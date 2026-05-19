-- Sub-etapa 8.5 — separate summarize failures from fatal pipeline failures.
--
-- Pre-Sub-etapa 8.5 behavior: the inner `summarize` step in `processRecording`
-- (and `processCompletedMeeting`, `checkCompletedRecordings`) silently swallowed
-- exceptions inside a try/catch with no body. The Meeting kept `status = READY`
-- (transcript is present, the summary just never landed) and there was zero
-- visibility on why.
--
-- `summaryError TEXT NULL` records the failure message without invalidating
-- the Meeting. Convention codified in AGENTS.md:
--   - `summaryError` — partial failure; Meeting still usable (transcript only).
--   - `errorMessage` — fatal pipeline failure; status flips to ERROR.
--
-- No RLS concern: `Meeting` is not in `TENANT_SCOPED_MODELS`.

ALTER TABLE "meetings" ADD COLUMN "summaryError" TEXT;
