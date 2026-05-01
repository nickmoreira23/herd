"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";

interface LinkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkName: string;
  onConfirm: () => void;
}

export function LinkDeleteDialog({
  open,
  onOpenChange,
  linkName,
  onConfirm,
}: LinkDeleteDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("links.delete_dialog.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("links.delete_dialog.confirm", { name: linkName })}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("links.delete_dialog.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("links.delete_dialog.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
