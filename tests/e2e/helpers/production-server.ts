import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * A second `next start` of the existing production build (`.next`), with the
 * given environment changes. Used to check runtime gates such as
 * ENABLE_DEV_PAGES, which the main e2e server has switched on.
 */
export interface ProductionServer {
  baseUrl: string;
  stop: () => void;
}

export function hasProductionBuild(): boolean {
  return existsSync(BUILD_ID_PATH);
}

export async function startProductionServer({
  port,
  environment,
}: {
  port: number;
  environment: NodeJS.ProcessEnv;
}): Promise<ProductionServer> {
  const serverProcess: ChildProcess = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--port", String(port)],
    { env: { ...environment, NODE_ENV: "production" }, stdio: "ignore" },
  );
  const baseUrl = `http://localhost:${port}`;
  const stop = () => {
    serverProcess.kill();
  };

  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const isUp = await fetch(baseUrl).then(
      (response) => response.ok,
      () => false,
    );
    if (isUp) return { baseUrl, stop };
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  stop();
  throw new Error(`next start on port ${port} did not answer in time.`);
}

const BUILD_ID_PATH = ".next/BUILD_ID";
const STARTUP_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 250;
