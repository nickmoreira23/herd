import { redirect } from "next/navigation";

export default async function EditExpenseRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/operation/finances/expenses/${id}`);
}
