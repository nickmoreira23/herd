import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

/**
 * requireSuperAdmin — enforce a valid session with role `super_admin`.
 *
 * Primary check: session.user.role === "super_admin" (env-based shortcut).
 * Fallback: DB isSuperAdmin flag on NetworkProfile (Sub-etapa 20).
 *
 * Returns a 401/403 NextResponse if the session is absent or the caller
 * does not hold super_admin access. Otherwise returns the session so
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

  // Primary check: env-based role assigned at login
  if (role === "super_admin") return session;

  // DB fallback: isSuperAdmin flag (covers tokens issued before Sub-etapa 20)
  const profileId = (session.user as { id?: string }).id;
  if (profileId) {
    const profile = await prisma.networkProfile.findUnique({
      where: { id: profileId },
      select: { isSuperAdmin: true },
    });
    if (profile?.isSuperAdmin) return session;
  }

  return apiError("Forbidden: super_admin role required", 403);
}
