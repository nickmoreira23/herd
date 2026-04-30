# Ledger tests

The ledger has two categories of tests, distinguished by file naming:

- **Pure tests** — `*.test.ts`. No database. Run as part of the default
  `npm test` (and CI).
- **Integration tests** — `*.integration.test.ts`. Touch a real Postgres
  database. Run via `npm run test:ledger`. NOT part of the default CI.

To run integration tests locally:

  DATABASE_URL=<your_test_db_url> npm run test:ledger

(`.env` / `.env.local` are auto-loaded by the dedicated `vitest.ledger.config.ts`
via `dotenv/config`, so usually you just run `npm run test:ledger`.)

Why integration tests are excluded from CI: the default CI run does not
provision a Postgres instance. When the ledger is wired through a CI
pipeline with a disposable Postgres (planned post-Phase 1), the
`*.integration.test.ts` pattern is the entry point.

Note: integration tests create and leave behind test accounts
(`test:*` codes). A teardown step is intentionally omitted to keep them
simple. Run against a disposable database.

**Tempo em testes de integração**: nunca use `Date.now()` para construir
seeds que serão filtrados depois por `asOf`/`from`/`to`. Use timestamps
absolutos e fixos via `postJournalEntry({ postedAt: new Date("2024-...") })`.
Isso garante determinismo independente da velocidade do CI.
