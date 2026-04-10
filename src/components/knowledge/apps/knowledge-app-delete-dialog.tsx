"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface KnowledgeAppDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
  dataPointCount: number;
  onConfirm: () => void;
}

export function KnowledgeAppDeleteDialog({
  open,
  onOpenChange,
  appName,
  dataPointCount,
  onConfirm,
}: KnowledgeAppDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete app</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete &ldquo;{appName}&rdquo;?
          {dataPointCount > 0 && (
            <>
              {" "}
              This will permanently remove {dataPointCount} synced data point
              {dataPointCount !== 1 ? "s" : ""} and all associated content.
            </>
          )}{" "}
          This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
