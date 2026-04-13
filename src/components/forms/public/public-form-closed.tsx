"use client";

import { XCircle } from "lucide-react";

interface PublicFormClosedProps {
  name: string;
  message: string;
}

export function PublicFormClosed({ name, message }: PublicFormClosedProps) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-zinc-500/10 mx-auto mb-5">
        <XCircle className="h-7 w-7 text-zinc-500" />
      </div>
      <h1 className="text-xl font-semibold mb-2">{name}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
