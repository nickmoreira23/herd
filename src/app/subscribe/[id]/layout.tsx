import { ForceLightTheme } from "@/components/subscribe/force-light-theme";

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ForceLightTheme />
      {children}
    </>
  );
}
