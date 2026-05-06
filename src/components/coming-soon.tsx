import { Sparkles } from "lucide-react";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-full px-6 text-center">
      <div className="h-14 w-14 rounded-full bg-primary/10 dark:bg-brand/10 flex items-center justify-center mb-5">
        <Sparkles className="h-6 w-6 text-primary dark:text-brand" />
      </div>
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        Coming soon.
      </p>
    </div>
  );
}
