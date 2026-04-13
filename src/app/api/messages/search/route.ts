import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get("keyword") || "";
  const channelType = searchParams.get("channelType");
  const take = Math.min(parseInt(searchParams.get("take") || "20"), 100);

  if (!keyword) return apiSuccess([]);

  const messages = await prisma.message.findMany({
    where: {
      content: { contains: keyword, mode: "insensitive" },
      ...(channelType && {
        thread: { channel: { channelType: channelType as never } },
      }),
    },
    orderBy: { sentAt: "desc" },
    take,
    include: {
      thread: {
        select: {
          id: true,
          subject: true,
          status: true,
          channel: { select: { id: true, name: true, channelType: true } },
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  return apiSuccess(messages);
}
