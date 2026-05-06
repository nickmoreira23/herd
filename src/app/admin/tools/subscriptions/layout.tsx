import { PlansArchitectPanel } from "@/components/tiers/plans-architect-panel";

export default function SalesSubscriptionsLayout({
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
