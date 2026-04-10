import { redirect } from "next/navigation";

export default function NewProjectionRedirect() {
  redirect("/admin/operation/finances/projections/new");
}
