import Link from "next/link";
import { FileText, FileSignature } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Legal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage legal documents, contracts, and compliance requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/operation/legal/forms"
          className="group rounded-xl border bg-card p-6 hover:border-foreground/20 transition-colors"
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-violet-500/10 p-3 w-fit">
              <FileText className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base group-hover:text-foreground transition-colors">
                Forms
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Legal forms and templates — terms of service, waivers, and compliance documents.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/operation/legal/contracts"
          className="group rounded-xl border bg-card p-6 hover:border-foreground/20 transition-colors"
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-sky-500/10 p-3 w-fit">
              <FileSignature className="h-6 w-6 text-sky-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base group-hover:text-foreground transition-colors">
                Contracts
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage partner, promoter, and program contracts — track status, renewals, and terms.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
