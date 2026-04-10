import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          // Look up or create user as NetworkProfile with Administrator type
          let user = await prisma.networkProfile.findUnique({
            where: { email },
            include: {
              profileType: { select: { displayName: true, slug: true } },
              profileRoles: {
                include: { role: { select: { slug: true, displayName: true } } },
              },
            },
          });

          if (!user) {
            // Find the Administrator profile type
            const adminType = await prisma.networkProfileType.findUnique({
              where: { slug: "admin" },
            });
            // Find the super_admin role
            const superAdminRole = await prisma.networkRole.findUnique({
              where: { slug: "super_admin" },
            });

            user = await prisma.networkProfile.create({
              data: {
                firstName: "Admin",
                lastName: "",
                email,
                networkType: "INTERNAL",
                profileTypeId: adminType!.id,
                status: "ACTIVE",
                profileRoles: superAdminRole
                  ? { create: { roleId: superAdminRole.id } }
                  : undefined,
              },
              include: {
                profileType: { select: { displayName: true, slug: true } },
                profileRoles: {
                  include: { role: { select: { slug: true, displayName: true } } },
                },
              },
            });
          }

          // Update last login
          await prisma.networkProfile.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          // Determine the "role" label for the session from assigned roles
          const primaryRole =
            user.profileRoles?.[0]?.role?.slug ?? "user";

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim(),
            image: user.avatarUrl,
            role: primaryRole,
          };
        }

        return null;
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
      }
      // Recover dbId from DB if missing (e.g. token created before this field existed)
      if (!token.dbId && token.email) {
        const dbUser = await prisma.networkProfile.findUnique({
          where: { email: token.email as string },
          select: { id: true },
        });
        if (dbUser) token.dbId = dbUser.id;
      }
      // Refresh user data from DB on update trigger
      if (trigger === "update" && token.dbId) {
        const dbUser = await prisma.networkProfile.findUnique({
          where: { id: token.dbId as string },
          include: {
            profileRoles: {
              include: { role: { select: { slug: true } } },
            },
          },
        });
        if (dbUser) {
          token.name = `${dbUser.firstName}${dbUser.lastName ? " " + dbUser.lastName : ""}`.trim();
          token.picture = dbUser.avatarUrl;
          token.email = dbUser.email;
          token.role = dbUser.profileRoles?.[0]?.role?.slug ?? "user";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.dbId as string;
      }
      return session;
    },
  },
});
