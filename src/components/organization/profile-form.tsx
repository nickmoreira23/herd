"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ProfileFormProps {
  initialSettings: Record<string, string>;
}

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese (Simplified)" },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

export function ProfileForm({ initialSettings }: ProfileFormProps) {
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
      toast.success("Profile saved");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organization Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organization details and preferences.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Organization Name</Label>
              <Input
                value={settings.companyName || ""}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="e.g. HERD"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={settings.companyDescription || ""}
                onChange={(e) => set("companyDescription", e.target.value)}
                placeholder="Brief description of your organization"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                type="url"
                value={settings.companyWebsite || ""}
                onChange={(e) => set("companyWebsite", e.target.value)}
                placeholder="https://yourcompany.com"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Support Email</Label>
              <Input
                type="email"
                value={settings.companySupportEmail || ""}
                onChange={(e) => set("companySupportEmail", e.target.value)}
                placeholder="support@yourcompany.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={settings.companyPhone || ""}
                onChange={(e) => set("companyPhone", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={settings.companyAddress || ""}
                onChange={(e) => set("companyAddress", e.target.value)}
                placeholder="Street address, city, state, zip"
                rows={2}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Regional Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default Language</Label>
              <Select
                value={settings.companyLanguage || "en-US"}
                onValueChange={(val) => set("companyLanguage", val ?? "en-US")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timezone</Label>
              <Select
                value={settings.companyTimezone || "America/New_York"}
                onValueChange={(val) => set("companyTimezone", val ?? "America/New_York")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select
                value={settings.companyCurrency || "USD"}
                onValueChange={(val) => set("companyCurrency", val ?? "USD")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (&euro;)</SelectItem>
                  <SelectItem value="GBP">GBP (&pound;)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                  <SelectItem value="AUD">AUD (A$)</SelectItem>
                  <SelectItem value="BRL">BRL (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Legal Entity Name</Label>
              <Input
                value={settings.companyLegalName || ""}
                onChange={(e) => set("companyLegalName", e.target.value)}
                placeholder="Full legal name of your company"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tax ID / EIN</Label>
              <Input
                value={settings.companyTaxId || ""}
                onChange={(e) => set("companyTaxId", e.target.value)}
                placeholder="XX-XXXXXXX"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
