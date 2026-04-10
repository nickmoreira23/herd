import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getFormTemplate } from "@/lib/knowledge/form-templates";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const template = getFormTemplate(key);
  if (!template) return apiError("Template not found", 404);

  // Generate unique slug
  let slug = generateSlug(template.name);
  let suffix = 0;
  while (await prisma.knowledgeForm.findUnique({ where: { slug } })) {
    suffix++;
    slug = `${generateSlug(template.name)}-${suffix}`;
  }

  // Create form with all sections and fields in a single transaction
  const form = await prisma.knowledgeForm.create({
    data: {
      name: template.name,
      description: template.description,
      slug,
      templateKey: key,
      thankYouMessage: template.settings.thankYouMessage,
      sections: {
        create: template.sections.map((section, sIdx) => ({
          title: section.title || null,
          description: section.description || null,
          sortOrder: sIdx,
          fields: {
            create: section.fields.map((field, fIdx) => ({
              label: field.label,
              type: field.type,
              isRequired: field.isRequired,
              placeholder: field.placeholder || null,
              helpText: field.helpText || null,
              options: field.options || null,
              validation: field.validation || null,
              sortOrder: fIdx,
            })),
          },
        })),
      },
    },
    include: {
      sections: {
        include: { fields: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return apiSuccess(form, 201);
}
