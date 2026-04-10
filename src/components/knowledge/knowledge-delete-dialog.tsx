"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface KnowledgeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  itemType?: "document" | "folder";
  onConfirm: () => void;
}

export function KnowledgeDeleteDialog({
  open,
  onOpenChange,
  documentName,
  itemType = "document",
  onConfirm,
}: KnowledgeDeleteDialogProps) {
  const isFolder = itemType === "folder";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {itemType}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete &ldquo;{documentName}&rdquo;?
          {isFolder
            ? " Documents inside this folder will be moved to the root level. Subfolders will also be deleted."
            : " The file and all associated data will be permanently removed."}{" "}
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
