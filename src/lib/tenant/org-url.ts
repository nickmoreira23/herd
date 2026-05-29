/**
 * Build the absolute URL to an organization's admin app on its subdomain.
 *
 * Single source of truth for the apex/protocol/port composition. Consumed by
 * both the accept server action (`accept/[token]/actions.ts`) and the accept
 * page (`accept/[token]/page.tsx`), so the subdomain used in the redirect can
 * never drift between the two code paths.
 *
 * DEV: http://<subdomain>.lvh.me:3000/admin
 * PROD: https://<subdomain>.<APEX_HOST>/admin
 */
export function buildOrgAdminUrl(subdomain: string): string {
  const apexHost = process.env.APEX_HOST ?? "lvh.me";
  const protocol =
    apexHost.includes("localhost") || apexHost === "lvh.me" ? "http" : "https";
  const port = process.env.NEXTAUTH_URL?.match(/:(\d+)$/)?.[1];
  const portSuffix = port ? `:${port}` : "";
  return `${protocol}://${subdomain}.${apexHost}${portSuffix}/admin`;
}
