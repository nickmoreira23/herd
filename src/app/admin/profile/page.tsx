import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) redirect("/login");

  let user = await prisma.networkProfile.findUnique({
    where: { id: userId },
    include: {
      profileType: { select: { displayName: true, slug: true } },
      profileRoles: {
        include: { role: { select: { displayName: true, slug: true } } },
      },
    },
  });

  // Fallback: create user if it doesn't exist yet (first login before auth creates it)
  if (!user && session?.user?.email) {
    const adminType = await prisma.networkProfileType.findUnique({
      where: { slug: "admin" },
    });
    user = await prisma.networkProfile.create({
      data: {
        firstName: session.user.name || "Admin",
        lastName: "",
        email: session.user.email,
        networkType: "INTERNAL",
        profileTypeId: adminType!.id,
        status: "ACTIVE",
      },
      include: {
        profileType: { select: { displayName: true, slug: true } },
        profileRoles: {
          include: { role: { select: { displayName: true, slug: true } } },
        },
      },
    });
  }

  if (!user) redirect("/login");

  const roleName = user.profileRoles?.[0]?.role?.displayName ?? user.profileType.displayName;

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim(),
        email: user.email,
        phone: user.phone,
        role: roleName,
        status: user.status,
        avatarUrl: user.avatarUrl,
        lastLogin: user.lastLogin?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}
