"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageIcon, Library } from "lucide-react";
import { MediaPickerDialog } from "../../media-picker-dialog";

interface ImagePropProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ImageProp({ label, value, onChange, placeholder }: ImagePropProps) {
  const [imgError, setImgError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setImgError(false);
        }}
        placeholder={placeholder || "https://..."}
        className="h-8 text-xs"
      />
      {value && !imgError ? (
        <div className="relative w-full h-20 rounded-md overflow-hidden bg-muted border">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : value && imgError ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted rounded-md">
          <ImageIcon className="h-4 w-4" />
          <span>Unable to load image</span>
        </div>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => setPickerOpen(true)}
      >
        <Library className="h-3 w-3 mr-1.5" />
        Browse Library
      </Button>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mediaType="image"
        onSelect={(result) => {
          onChange(result.url);
          setImgError(false);
        }}
      />
    </div>
  );
}
