"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete feed</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete &ldquo;{feedName}&rdquo;? All imported
          articles and sync history will be permanently removed. This action
          cannot be undone.
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
