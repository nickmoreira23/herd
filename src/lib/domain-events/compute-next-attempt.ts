/**
 * Computes when the next retry attempt should occur, given the number of
 * attempts already made (post-increment, so this is called AFTER bumping
 * `attempts`).
 *
 * Backoff schedule (cumulative from time of failure):
 *   attempt 1 (failed) → +1 minute
 *   attempt 2 (failed) → +5 minutes
 *   attempt 3 (failed) → +30 minutes
 *   attempt 4 (failed) → +2 hours
 *   attempt 5 (failed) → null (exhausted)
 *
 * Returns null when exhausted. The worker uses null to mean "do not retry
 * automatically; manual intervention required."
 *
 * Pure function — no I/O, no Date.now() except for the explicit `now`
 * parameter (for testability).
 */
const SCHEDULE_MINUTES: ReadonlyArray<number> = [1, 5, 30, 120];

export const MAX_ATTEMPTS = SCHEDULE_MINUTES.length + 1; // 5 attempts before exhaustion

export function computeNextAttempt(attempts: number, now: Date): Date | null {
  if (attempts < 1) {
    throw new Error(`computeNextAttempt called with invalid attempts=${attempts}; expected >= 1.`);
  }
  if (attempts >= MAX_ATTEMPTS) return null;
  const minutes = SCHEDULE_MINUTES[attempts - 1];
  return new Date(now.getTime() + minutes * 60 * 1000);
}
