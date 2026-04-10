import { redirect } from "next/navigation";

export default async function EditProjectionRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/operation/finances/projections/${id}`);
}
