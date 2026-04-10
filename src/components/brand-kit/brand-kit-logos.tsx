"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BrandKitSection } from "./brand-kit-section";
import { BrandKitEmptyState } from "./brand-kit-empty-state";
import { useBrandKitSection } from "@/hooks/use-brand-kit-section";
import {
  LOGO_KEYS,
  LIGHT_IMAGE_SLOTS,
  DARK_IMAGE_SLOTS,
  type ImageSlot,
} from "@/lib/brand-kit-settings";
import {
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  Moon,
} from "lucide-react";
import { toast } from "sonner";

export function BrandKitLogos() {
  const { settings, set, loading, isEmpty } = useBrandKitSection(LOGO_KEYS);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be under 2MB");
        return;
      }

      setUploadingKey(settingKey);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "branding");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const json = await uploadRes.json();
          toast.error(json.error || "Upload failed");
          return;
        }
        const { data } = await uploadRes.json();
        const url = data.url as string;

        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [settingKey]: url }),
        });

        set(settingKey, url);
        toast.success("Logo uploaded");

        if (settingKey === "companyIconUrl") {
          window.dispatchEvent(
            new CustomEvent("brand-kit-updated", {
              detail: { companyIconUrl: url },
            })
          );
        }
      } catch {
        toast.error("Something went wrong");
      } finally {
        setUploadingKey(null);
      }
    },
    [set]
  );

  const handleRemove = useCallback(
    async (settingKey: string) => {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [settingKey]: "" }),
      });
      set(settingKey, "");
      toast.success("Logo removed");

      if (settingKey === "companyIconUrl") {
        window.dispatchEvent(
          new CustomEvent("brand-kit-updated", {
            detail: { companyIconUrl: "" },
          })
        );
      }
    },
    [set]
  );

  return (
    <BrandKitSection
      title="Logos"
      description="Upload and manage your brand logos and icons."
      loading={loading}
    >
      {isEmpty ? (
        <BrandKitEmptyState
          icon={ImageIcon}
          title="No logos uploaded yet"
          description="Upload your brand logos to maintain visual consistency across the platform. Add your icon, full logo, favicon, and AI assistant images."
          actionLabel="Upload your first logo"
          onAction={() =>
            document.getElementById("upload-companyIconUrl")?.click()
          }
        />
      ) : null}

      {/* Light Mode Logos */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIGHT_IMAGE_SLOTS.map((slot) => (
            <LogoCard
              key={slot.settingKey}
              slot={slot}
              url={settings[slot.settingKey]}
              uploading={uploadingKey === slot.settingKey}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      {/* Dark Mode Variants */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Moon className="h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">Dark Mode Variants</h3>
            <p className="text-xs text-muted-foreground">
              Optional alternate logos for dark backgrounds. Falls back to light
              mode logos if not set.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DARK_IMAGE_SLOTS.map((slot) => (
            <LogoCard
              key={slot.settingKey}
              slot={slot}
              url={settings[slot.settingKey]}
              uploading={uploadingKey === slot.settingKey}
              onUpload={handleUpload}
              onRemove={handleRemove}
              dark
            />
          ))}
        </div>
      </div>
    </BrandKitSection>
  );
}

// ─── Logo Card ───────────────────────────────────────────────────────────────

function LogoCard({
  slot,
  url,
  uploading,
  onUpload,
  onRemove,
  dark,
}: {
  slot: ImageSlot;
  url?: string;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, key: string) => void;
  onRemove: (key: string) => void;
  dark?: boolean;
}) {
  const hasImage = url && url !== "";

  return (
    <div className="group relative rounded-lg border bg-card overflow-hidden">
      {/* Preview area */}
      <div
        className={`flex items-center justify-center h-36 ${
          dark ? "bg-zinc-900" : "bg-muted/30"
        }`}
      >
        {hasImage ? (
          <div className="relative">
            <Image
              src={url}
              alt={slot.label}
              width={120}
              height={120}
              className="object-contain max-h-28"
            />
            {/* Remove button on hover */}
            <button
              type="button"
              onClick={() => onRemove(slot.settingKey)}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label
            htmlFor={`upload-${slot.settingKey}`}
            className="flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Upload className="h-5 w-5" />
            </div>
            <span className="text-xs">Click to upload</span>
          </label>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 border-t">
        <p className="text-sm font-medium truncate">{slot.label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {slot.description}
        </p>
      </div>

      {/* Upload button overlay when image exists */}
      {hasImage && (
        <div className="absolute bottom-12 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() =>
              document.getElementById(`upload-${slot.settingKey}`)?.click()
            }
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Replace"
            )}
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onUpload(e, slot.settingKey)}
        className="hidden"
        id={`upload-${slot.settingKey}`}
      />

      {/* Uploading overlay */}
      {uploading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
