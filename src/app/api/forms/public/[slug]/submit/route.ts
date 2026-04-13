import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { submitFormResponseSchema } from "@/lib/validations/knowledge-form";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const form = await prisma.knowledgeForm.findUnique({
    where: { slug },
    include: {
      sections: {
        include: { fields: true },
      },
    },
  });

  if (!form) return apiError("Form not found", 404);
  if (form.formStatus !== "ACTIVE") {
    return apiError("This form is not accepting submissions", 400);
  }

  // Check date constraints
  const now = new Date();
  if (form.startsAt && now < form.startsAt) {
    return apiError("This form is not yet open for submissions", 400);
  }
  if (form.endsAt && now > form.endsAt) {
    return apiError("This form is no longer accepting submissions", 400);
  }

  // Check max responses
  if (form.maxResponses && form.responseCount >= form.maxResponses) {
    return apiError("This form has reached its maximum number of responses", 400);
  }

  const result = await parseAndValidate(request, submitFormResponseSchema);
  if ("error" in result) return result.error;

  const { answers, submitterName, submitterEmail } = result.data;

  // Validate required fields
  const allFields = form.sections.flatMap((s) => s.fields);
  for (const field of allFields) {
    if (field.isRequired) {
      const value = answers[field.id];
      if (value === undefined || value === null || value === "") {
        return apiError(`Field "${field.label}" is required`, 400);
      }
    }
  }

  // Get submitter IP
  const submitterIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  // Create response and increment count in a transaction
  const [response] = await prisma.$transaction([
    prisma.knowledgeFormResponse.create({
      data: {
        formId: form.id,
        answers: answers as Prisma.InputJsonValue,
        submitterName: submitterName || null,
        submitterEmail: submitterEmail || null,
        submitterIp,
      },
    }),
    prisma.knowledgeForm.update({
      where: { id: form.id },
      data: { responseCount: { increment: 1 } },
    }),
  ]);

  // Fire-and-forget: process the response
  const baseUrl = request.nextUrl.origin;
  fetch(
    `${baseUrl}/api/forms/${form.id}/responses/${response.id}/process`,
    { method: "POST" }
  ).catch(() => {});

  // Fire-and-forget: aggregate form text
  fetch(`${baseUrl}/api/forms/${form.id}/process`, {
    method: "POST",
  }).catch(() => {});

  return apiSuccess({ submitted: true, responseId: response.id }, 201);
}
