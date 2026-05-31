"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import { DepartmentForm } from "./department-form";

interface Dept {
  id: string;
  name: string;
  tenantId: string;
}

/**
 * Sub-26.4a — escrita vertical na UI: cria/exclui departments no FILHO ativo
 * via as rotas verticais da 26.3 (`/api/org/[childId]/departments`).
 *
 * CREATE usa o mesmo `DepartmentForm` (Dialog DS) do dept-tree, com
 * `verticalContext` → o título nomeia o filho ("Criar departamento em [Loja X]")
 * e o POST vai pra rota vertical. O Dialog com o filho no título É a confirmação
 * consciente (sem confirm() redundante por cima). DELETE usa `confirm()`
 * nomeando o filho (consistente com o dept-tree). A listagem usa a leitura
 * vertical (GET /api/departments retorna o subtree) filtrada pro tenant do filho.
 */
export function OrgVerticalDepartments({
  childId,
  childName,
}: {
  childId: string;
  childName: string;
}) {
  const t = useT();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/departments");
    const json = await res.json();
    if (Array.isArray(json.data)) {
      setDepts(json.data.filter((d: Dept) => d.tenantId === childId));
    }
  }, [childId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (dept: Dept) => {
    if (!confirm(t("organization.hierarchy.delete_confirm", { name: dept.name, child: childName }))) {
      return;
    }
    const res = await fetch(`/api/org/${childId}/departments/${dept.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      notifySuccess("organization.feedback.vertical_dept_deleted", t, { child: childName });
      await refresh();
    } else if (res.status === 403) {
      notifyError("error.organization.org_vertical_forbidden", t);
    } else {
      notifyError("error.organization.vertical_write_failed", t);
    }
  };

  return (
    <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {t("organization.hierarchy.depts_panel_title", { child: childName })}
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-1 h-3 w-3" />
          {t("organization.hierarchy.add_dept_button")}
        </Button>
      </div>
      <div className="divide-y divide-border">
        {depts.length > 0 ? (
          depts.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors group"
            >
              <span className="text-sm flex-1 min-w-0 truncate">{d.name}</span>
              <button
                onClick={() => handleDelete(d)}
                className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                title={t("organization.departments.tree.delete_title")}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {t("organization.hierarchy.depts_empty", { child: childName })}
          </div>
        )}
      </div>

      {formOpen && (
        <DepartmentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSaved={refresh}
          departments={[]}
          profiles={[]}
          verticalContext={{ childId, childName }}
        />
      )}
    </div>
  );
}
