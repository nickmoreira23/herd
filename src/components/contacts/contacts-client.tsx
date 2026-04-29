"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow as TR,
} from "@/components/ui/table";
import { ContactCard } from "./contact-card";
import { ContactRow as ContactTableRow } from "./contact-row";
import { CreateContactDialog } from "./create-contact-dialog";
import { displayName, type ContactRow as ContactRowType } from "./types";
import { LayoutGrid, List, Users } from "lucide-react";

interface ContactsClientProps {
  initialContacts: ContactRowType[];
}

export function ContactsClient({ initialContacts }: ContactsClientProps) {
  const [contacts] = useState(initialContacts);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (tagFilter && !c.tags.includes(tagFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          displayName(c).toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.phone?.toLowerCase().includes(q) ?? false) ||
          (c.jobTitle?.toLowerCase().includes(q) ?? false) ||
          (c.department?.toLowerCase().includes(q) ?? false) ||
          c.contentText.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [contacts, search, tagFilter]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of contacts) c.tags.forEach((t) => set.add(t));
    return Array.from(set).sort();
  }, [contacts]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pessoas com quem você se relaciona — leads, prospects, clientes.
          </p>
        </div>
        <CreateContactDialog />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Buscar nome, email, telefone, cargo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Todas as tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5">
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="Visualização lista"
            className={`rounded px-2 py-1.5 transition-colors ${
              view === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="Visualização grid"
            className={`rounded px-2 py-1.5 transition-colors ${
              view === "grid"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center gap-2 py-16 border border-dashed rounded-lg">
          <Users className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">Nenhum contato encontrado</h3>
          <p className="text-xs text-muted-foreground">
            Crie o primeiro em "Novo contato".
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((c) => (
            <ContactCard key={c.id} contact={c} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TR>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Tags</TableHead>
              </TR>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <ContactTableRow key={c.id} contact={c} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
