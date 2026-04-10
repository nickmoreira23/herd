"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, User, Mail, Phone, Shield, Clock } from "lucide-react";
import { toast } from "sonner";

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
}

export function ProfileClient({ user: initialUser }: ProfileClientProps) {
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
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!email.trim()) { toast.error("Email is required"); return; }

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
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      await refreshUser();
      // Trigger NextAuth session refresh to update sidebar
      await updateSession({});
      toast.success("Profile updated");
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
        toast.error("Failed to upload avatar");
        return;
      }
      await refreshUser();
      await updateSession({});
      toast.success("Avatar updated");
    } finally {
      setUploadingAvatar(false);
    }
  }

  const roleLabel = user.role.charAt(0) + user.role.slice(1).toLowerCase();
  const statusColor = user.status === "ACTIVE"
    ? "bg-green-500/15 text-green-400 border-green-500/30"
    : user.status === "INVITED"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Picture Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative group">
              {user.avatarUrl ? (
                <Image
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
              <Badge className={`${statusColor} text-xs`}>{user.status}</Badge>
              <Badge variant="outline" className="text-xs">{roleLabel}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <User className="h-3 w-3" />
                  Full Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Mail className="h-3 w-3" />
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Phone className="h-3 w-3" />
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Shield className="h-3 w-3" />
                  Role
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
                Last login: {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleString()
                  : "Never"}
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                size="sm"
              >
                {saving ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Details Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Account ID</span>
                <p className="font-mono text-xs mt-0.5 truncate">{user.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Status</span>
                <p className="mt-0.5">
                  <Badge className={`${statusColor} text-xs`}>{user.status}</Badge>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Created</span>
                <p className="mt-0.5">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Last Login</span>
                <p className="mt-0.5">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
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
