import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/layout/providers";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <TooltipProvider>
        {children}
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </Providers>
  );
}
