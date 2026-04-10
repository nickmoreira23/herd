import { redirect } from "next/navigation";

export default function PaymentsRedirect() {
  redirect("/admin/operation/finances/payments");
}
