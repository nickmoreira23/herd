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

interface FieldDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldName: string;
  onConfirm: () => void;
}

export function FieldDeleteDialog({
  open,
  onOpenChange,
  fieldName,
  onConfirm,
}: FieldDeleteDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("tables.fields.delete.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("tables.fields.delete.confirmation", { name: fieldName })}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("common.actions.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
