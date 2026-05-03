import { AsyncLocalStorage } from "node:async_hooks";

export type TenantContext = {
  tenantId: string;
};

// Module-level storage. Pinned to globalThis so duplicate module loads
// (e.g. Vitest's module resolution) share the same instance instead of
// fragmenting context.
const STORAGE_KEY = Symbol.for("herd.tenancy.storage");
type GlobalWithStorage = typeof globalThis & {
  [STORAGE_KEY]?: AsyncLocalStorage<TenantContext>;
};
const g = globalThis as GlobalWithStorage;
const storage: AsyncLocalStorage<TenantContext> =
  g[STORAGE_KEY] ?? (g[STORAGE_KEY] = new AsyncLocalStorage<TenantContext>());

export function withTenant<T>(tenantId: string, fn: () => Promise<T> | T): Promise<T> {
  // Always wrap in async so any Promise returned by fn is awaited inside the
  // ALS scope. Without this, a non-async fn that returns a Prisma promise
  // would have its continuations resolved AFTER storage.run exits the scope,
  // and async hooks lose the context for callbacks that run on later ticks.
  return storage.run({ tenantId }, async () => fn());
}

export function getTenantId(): string | null {
  return storage.getStore()?.tenantId ?? null;
}

export function requireTenantId(): string {
  const id = getTenantId();
  if (!id) {
    throw new Error(
      "requireTenantId() called outside withTenant context. " +
        "Wrap business logic in withTenant(orgId, () => ...)."
    );
  }
  return id;
}
