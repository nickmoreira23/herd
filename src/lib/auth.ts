import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resolveActiveOrgIdForProfile } from "@/lib/auth/resolve-active-org";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // CRAVADO Sub-etapa 22 V2 — explicit secret resolves MissingSecret error when
  // trustHost is enabled. NEXTAUTH_SECRET (legacy) takes precedence; AUTH_SECRET
  // is the canonical Auth.js v5 name. Both are accepted.
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  // CRAVADO Sub-etapa 22 V2 — required for multi-host / custom-domain support.
  // Without trustHost, Auth.js rejects requests from hosts other than NEXTAUTH_URL.
  trustHost: true,
  // CRAVADO Sub-etapa 22.1 — cross-subdomain cookie sharing via COOKIE_DOMAIN env var.
  // Without domain: set, login at app.X is not recognised at buckedup.X (per-host
  // isolation by browser default). With COOKIE_DOMAIN=.localhost (DEV) or
  // COOKIE_DOMAIN=.comecaai.com.br (PROD), one login is shared across all subdomains.
  // Cookie name is specified explicitly because Auth.js derives it from NEXTAUTH_URL
  // host — in multi-host setups the default may diverge between requests.
  // Safari note: .localhost may not work in Safari (DEV only). PROD uses a real TLD.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.COOKIE_DOMAIN ?? undefined,
      },
    },
  },
  providers: [
    Credentials({
      name: "Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // ── 1. Super-admin shortcut (env-based) ──────────────────────
        const isSuperAdmin =
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD;

        if (isSuperAdmin) {
          // Look up or create the admin NetworkProfile.
          // RBAC (NetworkRole/NetworkProfileRole) deleted in Sub-etapa 3.3/3.5;
          // NetworkProfileType + NetworkProfile.networkType/profileTypeId/parentId
          // deleted in Sub-etapa 3.6. Role is derived from the super-admin
          // env-shortcut alone; profile is now plain identity.
          let user = await prisma.networkProfile.findUnique({
            where: { email },
          });

          if (!user) {
            user = await prisma.networkProfile.create({
              data: {
                firstName: "Admin",
                lastName: "",
                email,
                status: "ACTIVE",
                isSuperAdmin: true,
              },
            });
          } else if (!user.isSuperAdmin) {
            await prisma.networkProfile.update({
              where: { id: user.id },
              data: { isSuperAdmin: true },
            });
          }

          // OrganizationMember rows are guaranteed by Sub-etapa 20 backfill.
          // ownerId column dropped in Sub-etapa 20.1 — no migration needed here.

          await prisma.networkProfile.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim(),
            image: user.avatarUrl,
            role: "super_admin",
          };
        }

        // ── 2. Regular user login (password hash in DB) ──────────────
        const user = await prisma.networkProfile.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (user.status === "SUSPENDED" || user.status === "TERMINATED") {
          return null;
        }

        // Activate pending users on first login
        const updates: Record<string, unknown> = { lastLogin: new Date() };
        if (user.status === "PENDING") {
          updates.status = "ACTIVE";
          updates.onboardedAt = new Date();
        }
        await prisma.networkProfile.update({
          where: { id: user.id },
          data: updates,
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim(),
          image: user.avatarUrl,
          role: "user",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.dbId = user.id;
        token.activeOrgId = await resolveActiveOrgIdForProfile(user.id as string);
        // Read isSuperAdmin from DB (Sub-etapa 20: DB-backed flag alongside env check)
        const dbProfile = await prisma.networkProfile.findUnique({
          where: { id: user.id as string },
          select: { isSuperAdmin: true },
        });
        token.isSuperAdmin = dbProfile?.isSuperAdmin ?? false;
      }
      // Recover dbId from DB if missing (e.g. token created before this field existed)
      if (!token.dbId && token.email) {
        const dbUser = await prisma.networkProfile.findUnique({
          where: { email: token.email as string },
          select: { id: true },
        });
        if (dbUser) token.dbId = dbUser.id;
      }
      // Refresh user data from DB on update trigger.
      // RBAC removed in Sub-etapa 3.5; role stays as set on initial token.
      if (trigger === "update" && token.dbId) {
        const dbUser = await prisma.networkProfile.findUnique({
          where: { id: token.dbId as string },
        });
        if (dbUser) {
          token.name = `${dbUser.firstName}${dbUser.lastName ? " " + dbUser.lastName : ""}`.trim();
          token.picture = dbUser.avatarUrl;
          token.email = dbUser.email;
          token.isSuperAdmin = dbUser.isSuperAdmin;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.dbId as string;
        (session.user as { activeOrgId?: string | null }).activeOrgId =
          (token.activeOrgId as string | null | undefined) ?? null;
        (session.user as { isSuperAdmin?: boolean }).isSuperAdmin =
          (token.isSuperAdmin as boolean | undefined) ?? false;
        if (typeof token.picture === "string" || token.picture === null) {
          session.user.image = token.picture as string | null | undefined;
        }
        if (typeof token.name === "string") session.user.name = token.name;
      }
      return session;
    },
  },
});
