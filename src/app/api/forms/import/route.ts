import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import {
  parseGoogleForms,
  parseTypeform,
  parseSurveyMonkeyCSV,
} from "@/lib/forms/form-importers";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const format = formData.get("format") as string | null;

    if (!file) return apiError("File is required", 400);
    if (!format) return apiError("Format is required", 400);

    const text = await file.text();
    let parsed;

    switch (format) {
      case "google_forms": {
        const json = JSON.parse(text);
        parsed = parseGoogleForms(json);
        break;
      }
      case "typeform": {
        const json = JSON.parse(text);
        parsed = parseTypeform(json);
        break;
      }
      case "surveymonkey": {
        parsed = parseSurveyMonkeyCSV(text);
        break;
      }
      default:
        return apiError(`Unsupported format: ${format}`, 400);
    }

    // Generate unique slug
    let slug = generateSlug(parsed.name);
    let suffix = 0;
    while (await prisma.knowledgeForm.findUnique({ where: { slug } })) {
      suffix++;
      slug = `${generateSlug(parsed.name)}-${suffix}`;
    }

    // Create the form
    const form = await prisma.knowledgeForm.create({
      data: {
        name: parsed.name,
        description: parsed.description || null,
        slug,
        sections: {
          create: parsed.sections.map((section, sIdx) => ({
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
          include: { fields: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return apiSuccess(form, 201);
  } catch (error) {
    const message =
      error instanceof SyntaxError
        ? "Invalid file format. Please check the file and try again."
        : error instanceof Error
        ? error.message
        : "Import failed";
    return apiError(message, 400);
  }
}
