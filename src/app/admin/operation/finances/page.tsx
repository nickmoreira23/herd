import Link from "next/link";
import { TrendingUp, CreditCard, Receipt } from "lucide-react";

export default function FinancesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finances</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Financial tools for projections, payments, and expense management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/operation/finances/projections"
          className="group rounded-xl border bg-card p-6 hover:border-foreground/20 transition-colors"
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-3 w-fit">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base group-hover:text-foreground transition-colors">
                Projections
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Build and compare P&L scenarios, model subscriber growth, and forecast revenue.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/operation/finances/payments"
          className="group rounded-xl border bg-card p-6 hover:border-foreground/20 transition-colors"
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3 w-fit">
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base group-hover:text-foreground transition-colors">
                Payments
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Commission payment ledger — track earned, held, released, and clawed-back entries.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/operation/finances/expenses"
          className="group rounded-xl border bg-card p-6 hover:border-foreground/20 transition-colors"
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-amber-500/10 p-3 w-fit">
              <Receipt className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base group-hover:text-foreground transition-colors">
                Expenses
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage operational expense categories with milestone-based cost scaling.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
