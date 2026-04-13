"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete field</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete the &ldquo;{fieldName}&rdquo; field?
          All data stored in this column will be permanently removed from every
          record. This action cannot be undone.
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
