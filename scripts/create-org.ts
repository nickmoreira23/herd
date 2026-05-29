import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2).reduce<Record<string, string>>((acc, arg) => {
  const [key, value] = arg.replace(/^--/, "").split("=");
  acc[key] = value;
  return acc;
}, {});

const required = ["slug", "name", "subdomain", "owner-email"];
for (const r of required) {
  if (!args[r]) {
    console.error(`Missing required arg: --${r}`);
    console.error(
      'Usage: npx tsx scripts/create-org.ts --slug=X --name="Y" --subdomain=Z --owner-email=user@example.com [--parent=<slug|id>]',
    );
    process.exit(1);
  }
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? process.env.DIRECT_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Verifica owner existe
  const owner = await prisma.networkProfile.findUnique({
    where: { email: args["owner-email"] },
  });
  if (!owner) {
    throw new Error(`Owner profile not found: ${args["owner-email"]}`);
  }

  // 2. Verifica slug/subdomain único
  const existingSlug = await prisma.organization.findUnique({
    where: { slug: args.slug },
  });
  if (existingSlug) {
    throw new Error(`Org slug already exists: ${args.slug}`);
  }

  const existingSubdomain = await prisma.organization.findUnique({
    where: { subdomain: args.subdomain },
  });
  if (existingSubdomain) {
    throw new Error(`Subdomain already exists: ${args.subdomain}`);
  }

  // 2b. Resolve optional --parent (slug or id) → parentOrgId.
  // A org nova não tem descendentes, então não há ciclo possível na criação;
  // basta validar que o pai existe.
  let parentOrgId: string | null = null;
  if (args.parent) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        args.parent,
      );
    const parent = await prisma.organization.findUnique({
      where: isUuid ? { id: args.parent } : { slug: args.parent },
    });
    if (!parent) {
      throw new Error(`Parent organization not found: ${args.parent}`);
    }
    parentOrgId = parent.id;
  }

  // 3. Cria org + membership atomically
  const org = await prisma.organization.create({
    data: {
      slug: args.slug,
      name: args.name,
      subdomain: args.subdomain,
      status: "ACTIVE",
      parentOrgId,
      members: {
        create: {
          networkProfileId: owner.id,
          status: "ACTIVE",
          roles: {
            create: {
              role: "OWNER",
              scopeType: "ORG",
            },
          },
        },
      },
    },
    include: {
      members: { include: { roles: true } },
    },
  });

  console.log("✅ Organization created");
  console.log(JSON.stringify(org, null, 2));
}

main()
  .catch((e) => {
    console.error("❌ FAILED:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
