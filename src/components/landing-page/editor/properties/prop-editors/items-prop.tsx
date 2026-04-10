"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X, GripVertical } from "lucide-react";

interface ItemsPropProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export function ItemsProp({ label, value, onChange }: ItemsPropProps) {
  const items = Array.isArray(value) ? value : ["Item one", "Item two", "Item three"];

  function updateItem(index: number, text: string) {
    const updated = [...items];
    updated[index] = text;
    onChange(updated);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, `Item ${items.length + 1}`]);
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const updated = [...items];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    onChange(updated);
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            <button
              type="button"
              className="cursor-grab text-muted-foreground hover:text-foreground shrink-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => moveItem(i, i - 1)}
              title="Move up"
            >
              <GripVertical className="h-3 w-3" />
            </button>
            <Input
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              className="h-7 text-xs flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(i)}
              disabled={items.length <= 1}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={addItem}
        className="w-full h-7 text-xs gap-1"
      >
        <Plus className="h-3 w-3" />
        Add Item
      </Button>
    </div>
  );
}
