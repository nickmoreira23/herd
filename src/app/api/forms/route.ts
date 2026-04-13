import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeFormSchema } from "@/lib/validations/knowledge-form";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET() {
  const forms = await prisma.knowledgeForm.findMany({
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: forms.length,
    draft: forms.filter((f) => f.formStatus === "DRAFT").length,
    active: forms.filter((f) => f.formStatus === "ACTIVE").length,
    closed: forms.filter((f) => f.formStatus === "CLOSED").length,
    totalResponses: forms.reduce((sum, f) => sum + f.responseCount, 0),
  };

  return apiSuccess({ forms, stats });
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createKnowledgeFormSchema);
  if ("error" in result) return result.error;

  const { name, description, thankYouMessage, accessMode, accessPassword, maxResponses, startsAt, endsAt, templateKey } = result.data;

  // Generate a unique slug
  let slug = generateSlug(name);
  let suffix = 0;
  while (await prisma.knowledgeForm.findUnique({ where: { slug } })) {
    suffix++;
    slug = `${generateSlug(name)}-${suffix}`;
  }

  const form = await prisma.knowledgeForm.create({
    data: {
      name,
      slug,
      description: description || null,
      thankYouMessage: thankYouMessage || null,
      accessMode: accessMode || "PUBLIC",
      accessPassword: accessPassword || null,
      maxResponses: maxResponses || null,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      templateKey: templateKey || null,
      sections: {
        create: {
          title: "Section 1",
          sortOrder: 0,
        },
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
