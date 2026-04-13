import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createMessageThreadSchema } from "@/lib/validators/messages";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const channelId = searchParams.get("channelId");
  const channelType = searchParams.get("channelType");
  const status = searchParams.get("status");
  const contactId = searchParams.get("contactId");
  const assigneeId = searchParams.get("assigneeId");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");

  const where: Prisma.MessageThreadWhereInput = {
    ...(channelId && { channelId }),
    ...(channelType && { channel: { channelType: channelType as never } }),
    ...(status && { status: status as never }),
    ...(contactId && { contactId }),
    ...(assigneeId && { assigneeId }),
    ...(tag && { tags: { has: tag } }),
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" as const } },
        {
          messages: {
            some: {
              content: { contains: search, mode: "insensitive" as const },
            },
          },
        },
      ],
    }),
  };

  const threads = await prisma.messageThread.findMany({
    where,
    orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
    include: {
      channel: { select: { id: true, name: true, channelType: true } },
      contact: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
      assignee: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          direction: true,
          senderName: true,
          sentAt: true,
        },
      },
      _count: { select: { messages: true } },
    },
  });

  return apiSuccess(threads);
}

export async function POST(request: NextRequest) {
  const result = await parseAndValidate(request, createMessageThreadSchema);
  if ("error" in result) return result.error;

  const { channelId, contactId, subject, content, contentType, tags } =
    result.data;

  // Verify channel exists
  const channel = await prisma.messageChannel.findUnique({
    where: { id: channelId },
  });
  if (!channel) return apiError("Channel not found", 404);

  const now = new Date();

  const thread = await prisma.messageThread.create({
    data: {
      channelId,
      contactId,
      subject,
      tags,
      lastMessageAt: now,
      messages: {
        create: {
          direction: "OUTBOUND",
          status: "SENT",
          content,
          contentType,
          sentAt: now,
        },
      },
    },
    include: {
      channel: { select: { id: true, name: true, channelType: true } },
      contact: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      messages: true,
      _count: { select: { messages: true } },
    },
  });

  return apiSuccess(thread, 201);
}
