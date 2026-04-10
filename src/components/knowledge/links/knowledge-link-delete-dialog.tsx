"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface KnowledgeLinkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkName: string;
  onConfirm: () => void;
}

export function KnowledgeLinkDeleteDialog({
  open,
  onOpenChange,
  linkName,
  onConfirm,
}: KnowledgeLinkDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete link</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete &ldquo;{linkName}&rdquo;? The scraped
          content and all associated data will be permanently removed. This
          action cannot be undone.
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
