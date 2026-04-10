"use client";

import { CheckCircle2 } from "lucide-react";

interface PublicFormSuccessProps {
  formName: string;
  thankYouMessage: string | null;
}

export function PublicFormSuccess({
  formName,
  thankYouMessage,
}: PublicFormSuccessProps) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-500/10 mx-auto mb-5">
        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
      </div>
      <h1 className="text-xl font-semibold mb-2">Response Submitted</h1>
      <p className="text-sm text-muted-foreground">
        {thankYouMessage || `Thank you for completing "${formName}". Your response has been recorded.`}
      </p>
    </div>
  );
}
