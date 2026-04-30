"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, User, Mail, Phone, Shield, Clock } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/t";
import { formatDate } from "@/lib/i18n/format-date";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

type ProfileStatus = "ACTIVE" | "INVITED" | "INACTIVE";

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  lastLogin: string | null;
  createdAt: string;
}

interface ProfileClientProps {
  user: ProfileUser;
  locale: Locale;
}

const STATUS_KEYS = {
  ACTIVE: "profile.status.ACTIVE",
  INVITED: "profile.status.INVITED",
  INACTIVE: "profile.status.INACTIVE",
} as const satisfies Record<ProfileStatus, MessageKey>;

export function ProfileClient({ user: initialUser, locale }: ProfileClientProps) {
  const t = useT();
  const { update: updateSession } = useSession();
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges =
    name !== user.name ||
    email !== user.email ||
    phone !== (user.phone ?? "");

  const refreshUser = useCallback(async () => {
    const res = await fetch("/api/profile");
    const json = await res.json();
    if (json.data) setUser(json.data);
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      notifyError("error.profile.name_required", t);
      return;
    }
    if (!email.trim()) {
      notifyError("error.profile.email_required", t);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        }),
      });
      if (!res.ok) {
        notifyError("error.profile.save_failed", t);
        return;
      }
      await refreshUser();
      await updateSession({});
      notifySuccess("profile.feedback.updated", t);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        notifyError("error.profile.avatar_upload_failed", t);
        return;
      }
      await refreshUser();
      await updateSession({});
      notifySuccess("profile.feedback.avatar_updated", t);
    } finally {
      setUploadingAvatar(false);
    }
  }

  // role is a server-provided display name (raw, user-authored from profileType/role).
  const roleLabel = user.role.charAt(0) + user.role.slice(1).toLowerCase();

  // Match by stable enum value, never by translated label.
  const statusKey =
    user.status === "ACTIVE" || user.status === "INVITED" || user.status === "INACTIVE"
      ? STATUS_KEYS[user.status as ProfileStatus]
      : null;
  const statusLabel = statusKey ? t(statusKey) : user.status;

  const statusColor =
    user.status === "ACTIVE"
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : user.status === "INVITED"
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";

  const lastLoginText = user.lastLogin
    ? formatDate(new Date(user.lastLogin), locale, "dateTime")
    : t("common.time.never");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("profile.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Picture Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("profile.section.picture")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative group">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  width={120}
                  height={120}
                  className="h-28 w-28 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted border-2 border-zinc-200 dark:border-zinc-700">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="text-center">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={`${statusColor} text-xs`}>{statusLabel}</Badge>
              <Badge variant="outline" className="text-xs">{roleLabel}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">
              {t("profile.section.personal")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <User className="h-3 w-3" />
                  {t("profile.field.full_name")}
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("profile.placeholder.name")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Mail className="h-3 w-3" />
                  {t("profile.field.email")}
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("profile.placeholder.email")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Phone className="h-3 w-3" />
                  {t("profile.field.phone")}
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("profile.placeholder.phone")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Shield className="h-3 w-3" />
                  {t("profile.field.role")}
                </Label>
                <Input
                  value={roleLabel}
                  disabled
                  className="text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {t("profile.last_login.label", { value: lastLoginText })}
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    {t("common.states.saving")}
                  </>
                ) : (
                  t("common.actions.save")
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Details Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">
              {t("profile.section.account")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">
                  {t("profile.field.account_id")}
                </span>
                <p className="font-mono text-xs mt-0.5 truncate">{user.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  {t("profile.field.status")}
                </span>
                <p className="mt-0.5">
                  <Badge className={`${statusColor} text-xs`}>
                    {statusLabel}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  {t("profile.field.created")}
                </span>
                <p className="mt-0.5">
                  {formatDate(new Date(user.createdAt), locale)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  {t("profile.field.last_login")}
                </span>
                <p className="mt-0.5">
                  {user.lastLogin
                    ? formatDate(new Date(user.lastLogin), locale, "dateTime")
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
