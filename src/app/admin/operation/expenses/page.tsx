import { redirect } from "next/navigation";

export default function ExpensesRedirect() {
  redirect("/admin/operation/finances/expenses");
}
