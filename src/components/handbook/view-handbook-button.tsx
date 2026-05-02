"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

interface Props {
  href: string | null;
}

const STRINGS: Record<string, string> = {
  "pt-BR": "Ver no Handbook",
  en: "View in Handbook",
  es: "Ver en el Handbook",
};

export function ViewHandbookButton({ href }: Props) {
  const locale = useLocale();
  const router = useRouter();

  if (!href) return null;
  const label = STRINGS[locale] ?? STRINGS["pt-BR"];

  return (
    <Button variant="outline" size="sm" onClick={() => router.push(href)}>
      <BookOpen className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
}
