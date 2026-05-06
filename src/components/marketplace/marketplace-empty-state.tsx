"use client";

import Link from "next/link";
import { Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileView } from "@/lib/core/profile-view/hook";

export function MarketplaceEmptyState() {
  const { view } = useProfileView();
  const label = view === "member" ? "Explore" : "Marketplace";

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <div className="h-14 w-14 rounded-full bg-primary/10 dark:bg-brand/10 flex items-center justify-center mb-5">
        <Compass className="h-6 w-6 text-primary dark:text-brand" />
      </div>
      <h1 className="text-xl font-semibold mb-2">Your {label} is empty</h1>
      <p className="text-sm text-muted-foreground max-w-md text-center mb-6">
        Sections are the building blocks of {label}. Each section curates content from one or more
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
