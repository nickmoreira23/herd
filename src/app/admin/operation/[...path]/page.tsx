import { redirect } from "next/navigation";

export default async function OperationRedirect({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  redirect(`/admin/solutions/${path.join("/")}`);
}
