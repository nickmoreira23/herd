import { redirect } from "next/navigation";

export default function NewExpenseRedirect() {
  redirect("/admin/operation/finances/expenses/new");
}
