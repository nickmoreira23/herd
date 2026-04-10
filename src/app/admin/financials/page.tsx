import { redirect } from "next/navigation";

// Redirect old URL to new finances structure
export default function LegacyFinancialsPage() {
  redirect("/admin/operation/finances/projections");
}
