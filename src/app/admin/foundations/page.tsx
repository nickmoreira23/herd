import Link from "next/link";
import { foundationServices } from "@/lib/foundation/registry";
import { Mic, Video, CreditCard, Bell } from "lucide-react";
import { connection } from "next/server";

const ICON_MAP: Record<string, React.ElementType> = {
  voice: Mic,
  video: Video,
  payments: CreditCard,
  notifications: Bell,
};

export default async function FoundationsPage() {
  await connection();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Foundations</h1>
        <p className="text-muted-foreground mt-1">
          Centralized infrastructure services shared across the entire platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {foundationServices.map((service) => {
          const Icon = ICON_MAP[service.name] ?? Mic;
          const isActive = service.status === "active";

          return (
            <Link
              key={service.name}
              href={isActive ? service.adminPath : "#"}
              className={`rounded-lg border p-5 transition-colors ${
                isActive
                  ? "hover:border-foreground/20 hover:bg-muted/50"
                  : "opacity-60 cursor-default"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{service.displayName}</h3>
                  {!isActive && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{service.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {service.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
