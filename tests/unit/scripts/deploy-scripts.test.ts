// @vitest-environment node
/**
 * Runs scripts/coolify-deploy.sh and scripts/wait-for-health.sh (E01-T08)
 * against a fake HTTP server that plays both the Coolify v4 API and the app's
 * /api/health, including the failure paths. Needs bash, curl and jq (present
 * on GitHub's ubuntu runners).
 */
import { execFile } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server } from "node:http";
import { type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const deployScript = fileURLToPath(
  new URL("../../../scripts/coolify-deploy.sh", import.meta.url),
);
const requireEnvScript = fileURLToPath(
  new URL("../../../scripts/require-env.sh", import.meta.url),
);
const healthScript = fileURLToPath(
  new URL("../../../scripts/wait-for-health.sh", import.meta.url),
);

const SHA = "0123456789abcdef0123456789abcdef01234567";
const TOKEN = "test-token";
const APP = "app-uuid-1";

type Recorded = { method: string; path: string; body: string; auth?: string };

/** Mutable behaviour of the fake server, reset before every test. */
let fake: {
  patchStatus: number;
  deployStatus: number;
  deployBody: unknown;
  /** Statuses returned by successive GET /deployments/{uuid} calls (last one repeats). */
  deploymentStatuses: string[];
  deploymentCommit: string;
  /** Versions returned by successive GET /api/health calls (last one repeats). */
  healthVersions: (string | null)[];
};
let requests: Recorded[];
let server: Server;
let baseUrl: string;

function next<T>(list: T[]): T {
  return (list.length > 1 ? list.shift() : list[0]) as T;
}

async function readBody(req: IncomingMessage): Promise<string> {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body;
}

beforeAll(async () => {
  server = createServer(async (req, res) => {
    const body = await readBody(req);
    const url = new URL(req.url ?? "/", "http://localhost");
    requests.push({
      method: req.method ?? "",
      path: url.pathname + url.search,
      body,
      auth: req.headers.authorization,
    });
    const json = (status: number, data: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };

    if (url.pathname === "/api/health") {
      const version = next(fake.healthVersions);
      if (version === null) return json(503, { error: "down" });
      return json(200, { status: "ok", version });
    }
    if (req.headers.authorization !== `Bearer ${TOKEN}`) {
      return json(401, { message: "Unauthenticated." });
    }
    if (
      req.method === "PATCH" &&
      url.pathname === `/api/v1/applications/${APP}`
    ) {
      return json(fake.patchStatus, { uuid: APP });
    }
    if (req.method === "POST" && url.pathname === "/api/v1/deploy") {
      return json(fake.deployStatus, fake.deployBody);
    }
    if (req.method === "GET" && url.pathname === "/api/v1/deployments/dep-1") {
      return json(200, {
        deployment_uuid: "dep-1",
        status: next(fake.deploymentStatuses),
        commit: fake.deploymentCommit,
      });
    }
    json(404, { message: "Not found." });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  requests = [];
  fake = {
    patchStatus: 200,
    deployStatus: 200,
    deployBody: {
      deployments: [
        {
          message: "Application gym-tracker deployment queued.",
          resource_uuid: APP,
          deployment_uuid: "dep-1",
        },
      ],
    },
    deploymentStatuses: ["queued", "in_progress", "finished"],
    deploymentCommit: SHA,
    healthVersions: [SHA],
  };
});

type Result = { code: number; output: string };

function run(
  file: string,
  args: string[],
  env: Record<string, string>,
): Promise<Result> {
  return new Promise((resolve) => {
    execFile(
      "bash",
      [file, ...args],
      // A minimal environment: no GITHUB_* from a CI runner leaks in.
      {
        env: { ...env, PATH: process.env.PATH ?? "", NODE_ENV: "test" },
        encoding: "utf8",
        timeout: 20_000,
      },
      (error, stdout: string, stderr: string) => {
        const code = error
          ? typeof error.code === "number"
            ? error.code
            : 1
          : 0;
        resolve({ code, output: stdout + stderr });
      },
    );
  });
}

const deployEnv = () => ({
  COOLIFY_URL: `${baseUrl}/`,
  COOLIFY_API_TOKEN: TOKEN,
  COOLIFY_APP_UUID: APP,
  DEPLOY_SHA: SHA,
  POLL_INTERVAL: "0",
  DEPLOY_TIMEOUT: "5",
});

describe("scripts/coolify-deploy.sh", () => {
  it("pins the commit, queues the deploy and waits until it finished", async () => {
    const result = await run(deployScript, [], deployEnv());

    expect(result.output).toContain("Deployment dep-1 finished.");
    expect(result.code).toBe(0);
    const [patch, deploy] = requests;
    expect(patch).toMatchObject({
      method: "PATCH",
      path: `/api/v1/applications/${APP}`,
      auth: `Bearer ${TOKEN}`,
    });
    expect(JSON.parse(patch?.body ?? "")).toEqual({ git_commit_sha: SHA });
    expect(deploy).toMatchObject({
      method: "POST",
      path: `/api/v1/deploy?uuid=${APP}&force=false`,
    });
    expect(
      requests.filter((r) => r.path === "/api/v1/deployments/dep-1"),
    ).toHaveLength(3);
  });

  it("fails when the deploy API returns an error", async () => {
    fake.deployStatus = 400;
    fake.deployBody = { message: "Application not found." };

    const result = await run(deployScript, [], deployEnv());

    expect(result.code).toBe(1);
    expect(result.output).toContain("returned HTTP 400");
    expect(result.output).toContain("Application not found.");
  });

  it("fails when the token is rejected (pinning the commit)", async () => {
    const result = await run(deployScript, [], {
      ...deployEnv(),
      COOLIFY_API_TOKEN: "wrong",
    });

    expect(result.code).toBe(1);
    expect(result.output).toContain("returned HTTP 401");
    expect(requests.some((r) => r.path.startsWith("/api/v1/deploy"))).toBe(
      false,
    );
  });

  it("fails when Coolify queues nothing", async () => {
    fake.deployBody = { deployments: [{ message: "Deployment skipped." }] };

    const result = await run(deployScript, [], deployEnv());

    expect(result.code).toBe(1);
    expect(result.output).toContain(
      "did not queue a deployment: Deployment skipped.",
    );
  });

  it("fails when the deployment fails (e.g. unhealthy container)", async () => {
    fake.deploymentStatuses = ["in_progress", "failed"];

    const result = await run(deployScript, [], deployEnv());

    expect(result.code).toBe(1);
    expect(result.output).toContain("ended with status 'failed'");
  });

  it("fails when Coolify deployed a different commit", async () => {
    fake.deploymentCommit = "f".repeat(40);

    const result = await run(deployScript, [], deployEnv());

    expect(result.code).toBe(1);
    expect(result.output).toContain(`expected ${SHA}`);
  });

  it("fails when the deployment doesn't finish in time", async () => {
    fake.deploymentStatuses = ["in_progress"];

    const result = await run(deployScript, [], {
      ...deployEnv(),
      DEPLOY_TIMEOUT: "1",
      POLL_INTERVAL: "0.2",
    });

    expect(result.code).toBe(1);
    expect(result.output).toContain("did not finish within 1s");
  });

  it("requires its environment variables", async () => {
    const { DEPLOY_SHA: _, ...env } = deployEnv();

    const result = await run(deployScript, [], env);

    expect(result.code).not.toBe(0);
    expect(result.output).toContain("DEPLOY_SHA is required");
    expect(requests).toHaveLength(0);
  });

  it("writes GitHub annotations and the deployment id output in Actions", async () => {
    fake.deploymentStatuses = ["failed"];
    const dir = await mkdtemp(join(tmpdir(), "coolify-deploy-"));
    const outputFile = join(dir, "output");

    const result = await run(deployScript, [], {
      ...deployEnv(),
      GITHUB_ACTIONS: "true",
      GITHUB_OUTPUT: outputFile,
    });

    expect(result.code).toBe(1);
    expect(result.output).toContain("::error::Coolify deployment dep-1 ended");
    expect(await readFile(outputFile, "utf8")).toBe("deployment_uuid=dep-1\n");
    await rm(dir, { recursive: true });
  });
});

describe("scripts/wait-for-health.sh", () => {
  const healthEnv = { HEALTH_INTERVAL: "0.1", HEALTH_TIMEOUT: "5" };

  it("waits until the new version is served", async () => {
    fake.healthVersions = [null, "old-version", SHA];

    const result = await run(healthScript, [baseUrl, SHA], healthEnv);

    expect(result.code).toBe(0);
    expect(result.output).toContain(
      `Healthy: {"status":"ok","version":"${SHA}"}`,
    );
    expect(requests.filter((r) => r.path === "/api/health")).toHaveLength(3);
  });

  it("accepts a short SHA prefix", async () => {
    fake.healthVersions = [SHA.slice(0, 7)];

    const result = await run(healthScript, [`${baseUrl}/`, SHA], healthEnv);

    expect(result.code).toBe(0);
  });

  it("rejects a prefix shorter than 7 characters", async () => {
    fake.healthVersions = [SHA.slice(0, 3)];

    const result = await run(healthScript, [baseUrl, SHA], {
      ...healthEnv,
      HEALTH_TIMEOUT: "1",
    });

    expect(result.code).toBe(1);
  });

  it("fails when the new version never shows up", async () => {
    fake.healthVersions = ["old-version"];

    const result = await run(healthScript, [baseUrl, SHA], {
      ...healthEnv,
      HEALTH_TIMEOUT: "1",
    });

    expect(result.code).toBe(1);
    expect(result.output).toContain(`did not report version ${SHA} within 1s`);
    expect(result.output).toContain("old-version");
  });

  it("fails when the app is unreachable", async () => {
    const result = await run(healthScript, ["http://127.0.0.1:9", SHA], {
      ...healthEnv,
      HEALTH_TIMEOUT: "1",
    });

    expect(result.code).toBe(1);
    expect(result.output).toContain("unreachable");
  });

  it("prints usage without arguments", async () => {
    const result = await run(healthScript, [], healthEnv);

    expect(result.code).toBe(2);
    expect(result.output).toContain("Usage:");
  });
});

describe("scripts/require-env.sh", () => {
  it("passes when every variable is set", async () => {
    const result = await run(requireEnvScript, ["A", "B"], { A: "1", B: "2" });

    expect(result.code).toBe(0);
  });

  it("lists every missing or empty variable", async () => {
    const result = await run(requireEnvScript, ["A", "B", "C"], {
      A: "1",
      B: "",
      GITHUB_ACTIONS: "true",
    });

    expect(result.code).toBe(1);
    expect(result.output).toContain("::error::Missing secrets/variables: B C.");
  });
});
