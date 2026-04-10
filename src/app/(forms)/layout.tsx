import { Suspense } from "react";
import "@/app/globals.css";

export default function PublicFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <Suspense>{children}</Suspense>
      </div>
    </div>
  );
}
