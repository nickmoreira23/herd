import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Plus, Compass } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function MarketplacePage() {
  await connection();

  const first = await prisma.marketplaceSection.findFirst({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });

  if (first) {
    redirect(`/admin/marketplace/sections/${first.id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <div className="h-14 w-14 rounded-full bg-primary/10 dark:bg-brand/10 flex items-center justify-center mb-5">
        <Compass className="h-6 w-6 text-primary dark:text-brand" />
      </div>
      <h1 className="text-xl font-semibold mb-2">Your Marketplace is empty</h1>
      <p className="text-sm text-muted-foreground max-w-md text-center mb-6">
        Sections are the building blocks of Explore. Each section curates content from one or more
        blocks (Products, Services, Experiences&hellip;) and renders its own composed page.
      </p>
      <Link href="/admin/marketplace/sections/new">
        <Button size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Add your first section
        </Button>
      </Link>
    </div>
  );
}
