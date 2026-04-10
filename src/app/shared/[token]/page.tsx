import { Suspense } from "react";
import { SharedPackageView } from "@/components/packages/shared-package-view";

async function SharedContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedPackageView token={token} />;
}

export default function SharedPackagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense>
      <SharedContent params={params} />
    </Suspense>
  );
}
