import { apiSuccess } from "@/lib/api-utils";
import { FORM_TEMPLATES } from "@/lib/knowledge/form-templates";

export async function GET() {
  const templates = FORM_TEMPLATES.map((t) => ({
    key: t.key,
    name: t.name,
    description: t.description,
    icon: t.icon,
    category: t.category,
    fieldCount: t.sections.reduce((sum, s) => sum + s.fields.length, 0),
    sectionCount: t.sections.length,
  }));

  return apiSuccess(templates);
}
