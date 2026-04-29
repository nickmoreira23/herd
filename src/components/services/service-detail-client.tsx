"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NoteEditor } from "@/components/notes/note-editor";
import { ArrowLeft, Trash2, X } from "lucide-react";
import {
  PRICING_TYPE_CONFIG,
  STATUS_CONFIG,
  type ServiceRow,
  type ServicePricingType,
  type ServiceStatus,
} from "./types";

interface ServiceDetailClientProps {
  service: ServiceRow;
}

export function ServiceDetailClient({ service }: ServiceDetailClientProps) {
  const router = useRouter();
  const [name, setName] = useState(service.name);
  const [key, setKey] = useState(service.key);
  const [description, setDescription] = useState(service.description ?? "");
  const [category, setCategory] = useState(service.category ?? "");
  const [duration, setDuration] = useState(service.duration ?? "");
  const [price, setPrice] = useState(service.price ?? "");
  const [pricingType, setPricingType] = useState<ServicePricingType>(
    service.pricingType
  );
  const [status, setStatus] = useState<ServiceStatus>(service.status);
  const [imageUrl, setImageUrl] = useState(service.imageUrl ?? "");
  const [icon, setIcon] = useState(service.icon);
  const [sortOrder, setSortOrder] = useState(service.sortOrder);
  const [tags, setTags] = useState(service.tags);
  const [tagInput, setTagInput] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  async function patchService(payload: Record<string, unknown>) {
    const res = await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSavedAt(new Date());
    return res;
  }

  function debouncedSave(payload: Record<string, unknown>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => patchService(payload), 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleEditorChange(json: unknown, text: string) {
    debouncedSave({ contentJson: json, contentText: text });
  }

  function changeStatus(v: ServiceStatus) {
    setStatus(v);
    patchService({ status: v });
  }

  function changePricingType(v: ServicePricingType) {
    setPricingType(v);
    patchService({ pricingType: v });
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    patchService({ tags: next });
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    patchService({ tags: next });
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${name}"?`)) return;
    const res = await fetch(`/api/services/${service.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/blocks/services");
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blocks/services"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Salvo {savedAt.toLocaleTimeString()}
            </span>
          )}
          <Badge variant="secondary" className={STATUS_CONFIG[status].className}>
            {STATUS_CONFIG[status].label}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (name !== service.name) patchService({ name });
        }}
        placeholder="Nome do serviço"
        className="text-xl font-semibold !border-0 !shadow-none !ring-0 px-0 focus-visible:ring-0"
      />

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => patchService({ description: description || null })}
        placeholder="Resumo curto…"
        rows={2}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Categoria</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={() => patchService({ category: category || null })}
            placeholder="ex: consultoria"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Duração</Label>
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            onBlur={() => patchService({ duration: duration || null })}
            placeholder='ex: "1 hora", "8 semanas"'
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tipo de cobrança</Label>
          <Select
            value={pricingType}
            onValueChange={(v) => changePricingType(v as ServicePricingType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRICING_TYPE_CONFIG).map(([k, cfg]) => (
                <SelectItem key={k} value={k}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Preço (R$)</Label>
          <Input
            value={price ?? ""}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={() => {
              if (pricingType === "CUSTOM") {
                patchService({ price: null });
                return;
              }
              const n = parseFloat(String(price).replace(",", "."));
              patchService({ price: Number.isNaN(n) ? null : n });
            }}
            disabled={pricingType === "CUSTOM"}
            placeholder={pricingType === "CUSTOM" ? "Sob consulta" : "0,00"}
            inputMode="decimal"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={(v) => changeStatus(v as ServiceStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                <SelectItem key={k} value={k}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Ordem</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            onBlur={() => patchService({ sortOrder })}
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs text-muted-foreground">URL da imagem</Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onBlur={() => patchService({ imageUrl: imageUrl || null })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Ícone (lucide)</Label>
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            onBlur={() => patchService({ icon })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Key (URL slug)
          </Label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onBlur={async () => {
              if (key !== service.key) {
                const res = await patchService({ key });
                if (!res.ok) {
                  alert("Key já em uso");
                  setKey(service.key);
                }
              }
            }}
          />
          <p className="text-[10px] text-muted-foreground">
            Mudar a key quebra referências futuras.
          </p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1">
            {t}
            <button
              onClick={() => removeTag(t)}
              className="hover:text-destructive"
              aria-label={`Remove tag ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Adicionar tag…"
          className="h-7 w-40 text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Descrição completa</Label>
        <NoteEditor
          initialJson={service.contentJson}
          onChange={handleEditorChange}
        />
      </div>
    </div>
  );
}
