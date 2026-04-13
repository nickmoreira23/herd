import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Email, push, SMS, and in-app notification delivery.
        </p>
      </div>
      <div className="rounded-lg border p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Coming Soon</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          The Notifications foundation service will provide centralized email, push, SMS,
          and in-app notification capabilities shared across all blocks and solutions.
        </p>
      </div>
    </div>
  );
}
