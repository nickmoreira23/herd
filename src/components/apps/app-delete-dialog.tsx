"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { pluralize } from "@/lib/i18n/pluralize";
import { t as translate } from "@/lib/i18n/t";

interface AppDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
  dataPointCount: number;
  onConfirm: () => void;
}

export function AppDeleteDialog({
  open,
  onOpenChange,
  appName,
  dataPointCount,
  onConfirm,
}: AppDeleteDialogProps) {
  const t = useT();
  const locale = useLocale();

  const message =
    dataPointCount > 0
      ? pluralize(dataPointCount, locale, {
          one: translate("apps.delete_dialog.confirm_one", locale, {
            name: appName,
            count: dataPointCount,
          }),
          other: translate("apps.delete_dialog.confirm_other", locale, {
            name: appName,
            count: dataPointCount,
          }),
        })
      : t("apps.delete_dialog.confirm_no_data", { name: appName });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("apps.delete_dialog.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("apps.delete_dialog.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("apps.delete_dialog.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
