"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, Link as LinkIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Props {
  markdown: string;
  githubEditUrl: string;
  selfUrl: string;
}

export function HandbookEntryActions({ markdown, githubEditUrl, selfUrl }: Props) {
  function copyMarkdown() {
    navigator.clipboard.writeText(markdown);
    toast.success("Markdown copiado");
  }

  function copyLink() {
    const fullUrl = `${window.location.origin}${selfUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copiado");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyMarkdown}>
          <Copy className="h-4 w-4 mr-2" />
          Copiar markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Copiar link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.open(githubEditUrl, "_blank", "noopener,noreferrer")}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Editar no GitHub
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
