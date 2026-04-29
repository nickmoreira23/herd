import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Notify the routines system that something happened in a block. Routines
 * with `triggerType=EVENT` matching `blockName` + `eventType` get a QUEUED
 * RoutineRun. The `payload` is stored as the run's `input`.
 *
 * Fire-and-forget: this never throws to the caller (errors logged but the
 * mutation that triggered the event must not be blocked by routine lookup).
 */
export async function dispatchBlockEvent(
  blockName: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const routines = await prisma.routine.findMany({
      where: {
        status: "ACTIVE",
        triggerType: "EVENT",
        eventBlock: blockName,
        eventType,
      },
      select: { id: true },
    });

    if (routines.length === 0) return;

    await prisma.routineRun.createMany({
      data: routines.map((r) => ({
        routineId: r.id,
        triggerSource: "EVENT" as const,
        input: payload as Prisma.InputJsonValue,
      })),
    });
  } catch (err) {
    console.error(
      `[routines/dispatcher] dispatchBlockEvent failed: ${blockName}.${eventType}`,
      err
    );
  }
}
