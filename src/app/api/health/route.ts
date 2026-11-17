import packageJson from "../../../../package.json";

// Read APP_VERSION per request (it's set in the container's environment),
// never cache the response.
export const dynamic = "force-dynamic";

/**
 * Liveness check for Docker `HEALTHCHECK`, Coolify and uptime monitoring.
 *
 * Public (no auth) and touches no database or secrets: a 200 means the
 * Next.js server is up and answering requests. `version` is `APP_VERSION`
 * (the commit SHA, baked into the Docker image at build time) or, when unset,
 * the `package.json` version.
 */
export function GET(): Response {
  return Response.json(
    { status: "ok", version: getAppVersion() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function getAppVersion(): string {
  return process.env.APP_VERSION || packageJson.version;
}
