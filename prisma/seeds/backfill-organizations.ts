import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizeSlug, organizationSlugSchema } from "../../src/lib/validators/organization-slug";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set");
}
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const profiles = await prisma.networkProfile.findMany({
    where: { ownedOrganization: null },
    select: { id: true, email: true },
  });

  console.log(`Backfilling ${profiles.length} organizations...`);

  let created = 0;
  let collisionsResolved = 0;

  for (const profile of profiles) {
    if (!profile.email) {
      throw new Error(`NetworkProfile ${profile.id} has no email — cannot derive slug`);
    }

    const local = profile.email.split("@")[0];
    const baseSlug = normalizeSlug(local) || `prof-${profile.id.slice(0, 8)}`;

    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
      collisionsResolved++;
      if (suffix > 100) {
        throw new Error(`Slug derivation failed for ${profile.id} (>100 collisions)`);
      }
    }

    organizationSlugSchema.parse(slug);

    await prisma.organization.create({
      data: {
        ownerId: profile.id,
        slug,
        name: `Personal — ${profile.email}`,
      },
    });

    created++;
    console.log(JSON.stringify({ profileId: profile.id, email: profile.email, slug, action: "created" }));
  }

  console.log(`Done. Created: ${created}. Collisions resolved: ${collisionsResolved}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
