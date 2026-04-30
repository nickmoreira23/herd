"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import { PageHeader } from "@/components/layout/page-header";

interface Props {
  initialSettings: Record<string, string>;
  locale: Locale;
}

export function ContactInformationForm({ initialSettings }: Props) {
  const t = useT();
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
        notifyError("error.organization.save_failed", t);
        return;
      }
      notifySuccess("organization.feedback.contact_information_saved", t);
    } finally {
      setSaving(false);
    }
  }, [settings, t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("organization.contact.title")}
        description={t("organization.contact.description")}
        action={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("common.states.saving") : t("common.actions.save")}
          </Button>
        }
      />

      <div className="max-w-[800px] mx-auto space-y-6">
        {/* Primary Contact */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{t("organization.contact.primary_title")}</CardTitle>
            <CardDescription>
              {t("organization.contact.primary_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>{t("organization.profile.field.support_email")}</Label>
                <Input
                  type="email"
                  value={settings.companySupportEmail || ""}
                  onChange={(e) => set("companySupportEmail", e.target.value)}
                  placeholder={t(
                    "organization.profile.field.support_email_placeholder",
                  )}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("organization.contact.support_email_help")}
                </p>
              </div>
              <div>
                <Label>
                  {t("organization.contact.sales_email_label")}
                </Label>
                <Input
                  type="email"
                  value={settings.companySalesEmail || ""}
                  onChange={(e) => set("companySalesEmail", e.target.value)}
                  placeholder={t(
                    "organization.contact.sales_email_placeholder",
                  )}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>
                    {t("organization.contact.main_phone_label")}
                  </Label>
                  <Input
                    value={settings.companyPhone || ""}
                    onChange={(e) => set("companyPhone", e.target.value)}
                    placeholder={t(
                      "organization.profile.field.phone_placeholder",
                    )}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>
                    {t("organization.contact.support_phone_label")}
                  </Label>
                  <Input
                    value={settings.companySupportPhone || ""}
                    onChange={(e) => set("companySupportPhone", e.target.value)}
                    placeholder={t(
                      "organization.profile.field.phone_placeholder",
                    )}
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
            <CardTitle>
              {t("organization.contact.headquarters_title")}
            </CardTitle>
            <CardDescription>
              {t("organization.contact.headquarters_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>{t("organization.contact.street_label")}</Label>
                <Input
                  value={settings.companyStreet || ""}
                  onChange={(e) => set("companyStreet", e.target.value)}
                  placeholder={t("organization.contact.street_placeholder")}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.contact.street2_label")}</Label>
                <Input
                  value={settings.companyStreet2 || ""}
                  onChange={(e) => set("companyStreet2", e.target.value)}
                  placeholder={t("organization.contact.street2_placeholder")}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <Label>{t("organization.contact.city_label")}</Label>
                  <Input
                    value={settings.companyCity || ""}
                    onChange={(e) => set("companyCity", e.target.value)}
                    placeholder={t("organization.contact.city_placeholder")}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{t("organization.contact.state_label")}</Label>
                  <Input
                    value={settings.companyState || ""}
                    onChange={(e) => set("companyState", e.target.value)}
                    placeholder={t("organization.contact.state_placeholder")}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{t("organization.contact.zip_label")}</Label>
                  <Input
                    value={settings.companyZip || ""}
                    onChange={(e) => set("companyZip", e.target.value)}
                    placeholder={t("organization.contact.zip_placeholder")}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label>{t("organization.contact.country_label")}</Label>
                <Input
                  value={settings.companyCountry || ""}
                  onChange={(e) => set("companyCountry", e.target.value)}
                  placeholder={t("organization.contact.country_placeholder")}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social & Web Presence */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{t("organization.contact.social_title")}</CardTitle>
            <CardDescription>
              {t("organization.contact.social_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("organization.contact.social_instagram")}</Label>
                <Input
                  value={settings.companySocialInstagram || ""}
                  onChange={(e) => set("companySocialInstagram", e.target.value)}
                  placeholder="https://instagram.com/yourcompany"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.contact.social_facebook")}</Label>
                <Input
                  value={settings.companySocialFacebook || ""}
                  onChange={(e) => set("companySocialFacebook", e.target.value)}
                  placeholder="https://facebook.com/yourcompany"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.contact.social_linkedin")}</Label>
                <Input
                  value={settings.companySocialLinkedin || ""}
                  onChange={(e) => set("companySocialLinkedin", e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.contact.social_twitter")}</Label>
                <Input
                  value={settings.companySocialTwitter || ""}
                  onChange={(e) => set("companySocialTwitter", e.target.value)}
                  placeholder="https://x.com/yourcompany"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.contact.social_youtube")}</Label>
                <Input
                  value={settings.companySocialYoutube || ""}
                  onChange={(e) => set("companySocialYoutube", e.target.value)}
                  placeholder="https://youtube.com/@yourcompany"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("organization.contact.social_tiktok")}</Label>
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
