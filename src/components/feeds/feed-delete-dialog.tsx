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

interface FeedDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedName: string;
  onConfirm: () => void;
}

export function FeedDeleteDialog({
  open,
  onOpenChange,
  feedName,
  onConfirm,
}: FeedDeleteDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("feeds.delete_dialog.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("feeds.delete_dialog.confirm", { name: feedName })}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("feeds.delete_dialog.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("feeds.delete_dialog.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
