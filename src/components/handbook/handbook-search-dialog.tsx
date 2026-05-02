"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useHandbookLocale } from "./use-handbook-locale";
import type { SearchResult } from "@/lib/handbook/search";
import type { HandbookLocale } from "@/lib/handbook/config";

const STORAGE_KEY = "handbook:last-search";

const STRINGS = {
  "pt-BR": {
    placeholder: "Buscar no Handbook…",
    empty: "Nenhum resultado encontrado.",
    typing: "Digite para buscar…",
    error: "Erro ao buscar.",
    loading: "Buscando…",
    title: "Buscar no Handbook",
    description: "Busca em todas as entries do Handbook.",
  },
  "en-US": {
    placeholder: "Search the Handbook…",
    empty: "No results found.",
    typing: "Type to search…",
    error: "Search error.",
    loading: "Searching…",
    title: "Search the Handbook",
    description: "Search across all Handbook entries.",
  },
} as const;

interface Props {
  userDefaultLocale: HandbookLocale;
}

export function HandbookSearchDialog({ userDefaultLocale }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useHandbookLocale(userDefaultLocale);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = STRINGS[locale];

  // Hotkey: Cmd+K / Ctrl+K, only when on /admin/handbook/*
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (pathname?.startsWith("/admin/handbook")) {
          e.preventDefault();
          setOpen((prev) => !prev);
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pathname]);

  // Restore last query when dialog opens
  useEffect(() => {
    if (open) {
      const last = window.localStorage.getItem(STORAGE_KEY);
      if (last) setQuery(last);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    debounceRef.current = setTimeout(async () => {
      try {
        const url = `/admin/api/handbook/search?q=${encodeURIComponent(query)}&locale=${locale}&limit=20`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results);
        window.localStorage.setItem(STORAGE_KEY, query);
      } catch {
        setError(true);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, locale]);

  const handleSelect = useCallback(
    (url: string) => {
      router.push(url);
      setOpen(false);
    },
    [router],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t.title}
      description={t.description}
    >
      <Command shouldFilter={false}>
      <CommandInput
        placeholder={t.placeholder}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!query.trim() ? (
          <CommandEmpty>{t.typing}</CommandEmpty>
        ) : loading ? (
          <CommandEmpty>{t.loading}</CommandEmpty>
        ) : error ? (
          <CommandEmpty>{t.error}</CommandEmpty>
        ) : results.length === 0 ? (
          <CommandEmpty>{t.empty}</CommandEmpty>
        ) : (
          <CommandGroup>
            {results.map((result) => (
              <CommandItem
                key={result.uid}
                value={result.uid}
                onSelect={() => handleSelect(result.url)}
                className="flex flex-col items-start py-3 gap-1"
              >
                <div className="font-medium text-foreground">{result.title}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {result.uid}
                </div>
                {result.snippet && (
                  <div
                    className="text-xs text-muted-foreground line-clamp-2 [&>mark]:bg-primary/20 [&>mark]:text-foreground [&>mark]:px-0.5 [&>mark]:rounded-sm"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
