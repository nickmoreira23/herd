import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";

/**
 * requireSuperAdmin — enforce a valid session with role `super_admin`.
 *
 * Returns a 401/403 NextResponse if the session is absent or the caller
 * does not hold the super_admin role. Otherwise returns the session so
 * the caller can use session.user.id.
 *
 * Usage:
 *   const sessionOrResponse = await requireSuperAdmin();
 *   if (sessionOrResponse instanceof Response) return sessionOrResponse;
 *   const session = sessionOrResponse;
 */
export async function requireSuperAdmin() {
  const session = await auth();

  if (!session?.user) {
    return apiError("Authentication required", 401);
  }

  const role = (session.user as { role?: string }).role;

  if (role !== "super_admin") {
    return apiError("Forbidden: super_admin role required", 403);
  }

  return session;
}
