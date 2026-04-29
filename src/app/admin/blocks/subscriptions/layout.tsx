import { PlansArchitectPanel } from "@/components/tiers/plans-architect-panel";

export default function TiersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PlansArchitectPanel />
    </>
  );
}
