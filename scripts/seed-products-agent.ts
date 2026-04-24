import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("No DATABASE_URL / DIRECT_URL set");
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Remove the old mis-keyed record if it exists (convention is block-${name})
  await prisma.agent.deleteMany({ where: { key: "products" } });

  const agent = await prisma.agent.upsert({
    where: { key: "block-products" },
    update: {
      name: "Products Agent",
      description: "Manage the product catalog via natural language — create, update, delete, and bulk-edit products.",
      category: "ANALYTICS",
      icon: "package",
      sortOrder: 100,
      status: "ACTIVE",
      role: "BLOCK",
      scope: "products",
      isConversational: true,
      isSystem: true,
    },
    create: {
      key: "block-products",
      name: "Products Agent",
      description: "Manage the product catalog via natural language — create, update, delete, and bulk-edit products.",
      category: "ANALYTICS",
      icon: "package",
      sortOrder: 100,
      status: "ACTIVE",
      role: "BLOCK",
      scope: "products",
      isConversational: true,
      isSystem: true,
    },
  });
  console.log("Upserted:", { id: agent.id, key: agent.key, role: agent.role, scope: agent.scope });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
