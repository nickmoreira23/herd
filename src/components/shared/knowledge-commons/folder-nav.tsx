"use client";

import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Folder,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { FolderRow } from "@/lib/knowledge-commons/types";

interface FolderNavProps {
  folders: FolderRow[];
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
  onEdit: (folder: FolderRow) => void;
  onDelete: (folder: FolderRow) => void;
  rootLabel: string;
  countKey: "documents" | "images" | "videos" | "audios";
  isSearching?: boolean;
}

export function FolderNav({
  folders,
  currentFolderId,
  onNavigate,
  onEdit,
  onDelete,
  rootLabel,
  countKey,
  isSearching,
}: FolderNavProps) {
  const breadcrumbs = useMemo(() => {
    const path: FolderRow[] = [];
    let id = currentFolderId;
    while (id) {
      const folder = folders.find((f) => f.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parentId;
    }
    return path;
  }, [currentFolderId, folders]);

  const currentFolders = useMemo(
    () => folders.filter((f) => f.parentId === currentFolderId),
    [folders, currentFolderId],
  );

  return (
    <>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 px-4 mb-4 text-sm">
          <button
            onClick={() => onNavigate(null)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {rootLabel}
          </button>
          {breadcrumbs.map((folder) => (
            <span key={folder.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                onClick={() => onNavigate(folder.id)}
                className={
                  folder.id === currentFolderId
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Folder grid */}
      {!isSearching && currentFolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-4 mb-6">
          {currentFolders.map((folder) => (
            <div
              key={folder.id}
              className="group relative rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div
                className="flex items-center gap-3 px-4 py-3"
                onClick={() => onNavigate(folder.id)}
              >
                <Folder
                  className="h-5 w-5 shrink-0"
                  style={{
                    color: folder.color ?? "var(--muted-foreground)",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{folder.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {folder._count[countKey]} item
                    {folder._count[countKey] !== 1 ? "s" : ""}
                    {folder._count.children > 0 &&
                      ` \u00b7 ${folder._count.children} folder${folder._count.children !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                      />
                    }
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(folder);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(folder);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
