"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import { PublicFormRenderer } from "./public-form-renderer";

interface FormField {
  id: string;
  label: string;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: { choices: string[] } | null;
  validation: Record<string, unknown> | null;
  conditionalLogic: { fieldId: string; operator: string; value?: unknown } | null;
  sortOrder: number;
}

interface FormSection {
  id: string;
  title: string | null;
  description: string | null;
  sortOrder: number;
  fields: FormField[];
}

interface FormData {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  thankYouMessage: string | null;
  sections: FormSection[];
}

interface PublicFormAccessGateProps {
  slug: string;
  formName: string;
  formDescription: string | null;
  formData: FormData;
}

export function PublicFormAccessGate({
  slug,
  formName,
  formDescription,
  formData,
}: PublicFormAccessGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  async function handleVerify() {
    if (!password) return;
    setVerifying(true);
    setError("");

    try {
      const res = await fetch(`/api/forms/${slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setVerified(true);
      } else {
        setError("Incorrect password. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  }

  if (verified) {
    return <PublicFormRenderer slug={slug} form={formData} />;
  }

  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-orange-500/10 mx-auto mb-5">
        <Lock className="h-7 w-7 text-orange-500" />
      </div>
      <h1 className="text-xl font-semibold mb-2">{formName}</h1>
      {formDescription && (
        <p className="text-sm text-muted-foreground mb-6">
          {formDescription}
        </p>
      )}
      <p className="text-sm text-muted-foreground mb-4">
        This form requires a password to access.
      </p>

      <div className="max-w-xs mx-auto space-y-3">
        <div className="space-y-1.5 text-left">
          <Label className="text-xs">Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleVerify();
            }}
            placeholder="Enter the form password"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button
          onClick={handleVerify}
          disabled={verifying || !password}
          className="w-full"
        >
          {verifying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Access Form"
          )}
        </Button>
      </div>
    </div>
  );
}
