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

interface TableDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  onConfirm: () => void;
}

export function TableDeleteDialog({
  open,
  onOpenChange,
  tableName,
  onConfirm,
}: TableDeleteDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("tables.delete.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("tables.delete.confirmation", { name: tableName })}
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
