import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Unauthorized", 401);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return apiError("No file provided", 400);

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return apiError("File must be an image", 400);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${userId}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  const avatarUrl = `/uploads/avatars/${fileName}?t=${Date.now()}`;

  // Update user record
  await prisma.networkProfile.update({
    where: { id: userId },
    data: { avatarUrl },
  });

  return apiSuccess({ avatarUrl });
}
