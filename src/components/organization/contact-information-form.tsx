"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";

interface Props {
  initialSettings: Record<string, string>;
}

export function ContactInformationForm({ initialSettings }: Props) {
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
      toast.success("Contact information saved");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Information"
        description="How customers, partners, and team members can reach your organization."
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <div className="max-w-[800px] mx-auto space-y-6">
        {/* Primary Contact */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Primary Contact</CardTitle>
            <CardDescription>
              Email addresses and phone numbers for customer and partner inquiries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Support Email</Label>
                <Input
                  type="email"
                  value={settings.companySupportEmail || ""}
                  onChange={(e) => set("companySupportEmail", e.target.value)}
                  placeholder="support@yourcompany.com"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Displayed to customers and partners for general inquiries.
                </p>
              </div>
              <div>
                <Label>Sales Email</Label>
                <Input
                  type="email"
                  value={settings.companySalesEmail || ""}
                  onChange={(e) => set("companySalesEmail", e.target.value)}
                  placeholder="sales@yourcompany.com"
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Main Phone Number</Label>
                  <Input
                    value={settings.companyPhone || ""}
                    onChange={(e) => set("companyPhone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Support Phone Number</Label>
                  <Input
                    value={settings.companySupportPhone || ""}
                    onChange={(e) => set("companySupportPhone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Headquarters Address */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Headquarters Address</CardTitle>
            <CardDescription>
              Your organization&apos;s primary physical location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Street Address</Label>
                <Input
                  value={settings.companyStreet || ""}
                  onChange={(e) => set("companyStreet", e.target.value)}
                  placeholder="123 Main Street"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Street Address Line 2</Label>
                <Input
                  value={settings.companyStreet2 || ""}
                  onChange={(e) => set("companyStreet2", e.target.value)}
                  placeholder="Suite 100, Building A"
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={settings.companyCity || ""}
                    onChange={(e) => set("companyCity", e.target.value)}
                    placeholder="American Fork"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>State / Province</Label>
                  <Input
                    value={settings.companyState || ""}
                    onChange={(e) => set("companyState", e.target.value)}
                    placeholder="UT"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>ZIP / Postal Code</Label>
                  <Input
                    value={settings.companyZip || ""}
                    onChange={(e) => set("companyZip", e.target.value)}
                    placeholder="84003"
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={settings.companyCountry || ""}
                  onChange={(e) => set("companyCountry", e.target.value)}
                  placeholder="United States"
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social & Web Presence */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Social & Web Presence</CardTitle>
            <CardDescription>
              Links to your organization&apos;s social media profiles and online channels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Instagram</Label>
                <Input
                  value={settings.companySocialInstagram || ""}
                  onChange={(e) => set("companySocialInstagram", e.target.value)}
                  placeholder="https://instagram.com/yourcompany"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Facebook</Label>
                <Input
                  value={settings.companySocialFacebook || ""}
                  onChange={(e) => set("companySocialFacebook", e.target.value)}
                  placeholder="https://facebook.com/yourcompany"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>LinkedIn</Label>
                <Input
                  value={settings.companySocialLinkedin || ""}
                  onChange={(e) => set("companySocialLinkedin", e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>X (Twitter)</Label>
                <Input
                  value={settings.companySocialTwitter || ""}
                  onChange={(e) => set("companySocialTwitter", e.target.value)}
                  placeholder="https://x.com/yourcompany"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>YouTube</Label>
                <Input
                  value={settings.companySocialYoutube || ""}
                  onChange={(e) => set("companySocialYoutube", e.target.value)}
                  placeholder="https://youtube.com/@yourcompany"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>TikTok</Label>
                <Input
                  value={settings.companySocialTiktok || ""}
                  onChange={(e) => set("companySocialTiktok", e.target.value)}
                  placeholder="https://tiktok.com/@yourcompany"
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
