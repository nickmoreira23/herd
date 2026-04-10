"use client";

import { Bot, FileText, Image, Video, Headphones, Link2, Rss } from "lucide-react";

interface ChatEmptyStateProps {
  onSendMessage: (message: string) => void;
}

const suggestions = [
  "What documents do we have in our knowledge base?",
  "Summarize the key information from our uploaded content",
  "What products do we have and what are their details?",
  "Tell me about the most recent articles from our RSS feeds",
];

export function ChatEmptyState({ onSendMessage }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
        <Bot className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">HERD AI</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-2">
        Your knowledge base specialist. Ask me anything about your uploaded documents,
        images, videos, audio, web pages, and more.
      </p>
      <div className="flex items-center gap-3 text-muted-foreground mb-8">
        <FileText className="h-4 w-4" />
        <Image className="h-4 w-4" />
        <Video className="h-4 w-4" />
        <Headphones className="h-4 w-4" />
        <Link2 className="h-4 w-4" />
        <Rss className="h-4 w-4" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSendMessage(suggestion)}
            className="rounded-xl border bg-background p-3 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
