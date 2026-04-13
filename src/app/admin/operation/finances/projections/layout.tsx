import { ProjectionsAgentPanel } from "@/components/financials/projections-agent-panel";

export default function ProjectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ProjectionsAgentPanel />
    </>
  );
}
