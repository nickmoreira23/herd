"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";

const INDUSTRIES = [
  { value: "health-wellness", label: "Health & Wellness" },
  { value: "supplements", label: "Supplements & Nutrition" },
  { value: "fitness", label: "Fitness & Sports" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "saas", label: "SaaS / Technology" },
  { value: "retail", label: "Retail" },
  { value: "food-beverage", label: "Food & Beverage" },
  { value: "beauty", label: "Beauty & Personal Care" },
  { value: "other", label: "Other" },
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

interface Props {
  initialSettings: Record<string, string>;
}

export function GeneralInformationForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  const set = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      toast.success("General information saved");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="General Information"
        description="Basic details about your organization, including name, industry, and mission."
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <div className="max-w-[800px] mx-auto space-y-6">
        {/* Organization Identity */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Organization Identity</CardTitle>
            <CardDescription>
              Your organization&apos;s name, legal entity, and tax identification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Organization Name</Label>
                <Input
                  value={settings.companyName || ""}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder="e.g. Bucked Up"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Legal Entity Name</Label>
                <Input
                  value={settings.companyLegalName || ""}
                  onChange={(e) => set("companyLegalName", e.target.value)}
                  placeholder="Full legal name of your company"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used in contracts, invoices, and official documents.
                </p>
              </div>
              <div>
                <Label>Tax ID / EIN</Label>
                <Input
                  value={settings.companyTaxId || ""}
                  onChange={(e) => set("companyTaxId", e.target.value)}
                  placeholder="XX-XXXXXXX"
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>About</CardTitle>
            <CardDescription>
              Describe your organization, its mission, and online presence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <Textarea
                  value={settings.companyDescription || ""}
                  onChange={(e) => set("companyDescription", e.target.value)}
                  placeholder="Brief description of your organization and what you do"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Mission Statement</Label>
                <Textarea
                  value={settings.companyMission || ""}
                  onChange={(e) => set("companyMission", e.target.value)}
                  placeholder="What drives your organization?"
                  rows={2}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  type="url"
                  value={settings.companyWebsite || ""}
                  onChange={(e) => set("companyWebsite", e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Company Details</CardTitle>
            <CardDescription>
              Industry, size, and founding information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Industry</Label>
                <Select
                  value={settings.companyIndustry || ""}
                  onValueChange={(val) => set("companyIndustry", val ?? "")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i.value} value={i.value}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Size</Label>
                <Select
                  value={settings.companySize || ""}
                  onValueChange={(val) => set("companySize", val ?? "")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year Founded</Label>
                <Input
                  value={settings.companyFounded || ""}
                  onChange={(e) => set("companyFounded", e.target.value)}
                  placeholder="e.g. 2016"
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
