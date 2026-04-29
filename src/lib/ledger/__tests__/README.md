# Ledger integration tests

These tests exercise the ledger schema and constraints directly against a
running Postgres database. They are NOT part of the default `npm test` run.

To run them locally:

  DATABASE_URL=<your_test_db_url> npm run test:ledger

Why excluded from CI: the default CI run does not provision a Postgres
instance. The ledger service tests (Etapa 1.3) will be the entry point
for ledger-aware CI execution; integration of these constraint tests
into CI is decided then.

Note: these tests create and leave behind test accounts (`test:*` codes).
A teardown step is intentionally omitted to keep them simple. Run against
a disposable database.
