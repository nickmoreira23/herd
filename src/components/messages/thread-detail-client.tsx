"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ThreadRow, MessageRow } from "./types";
import { ChannelBadge } from "./channel-badge";
import { MessageBubble } from "./message-bubble";
import { ComposeMessage } from "./compose-message";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Archive, Clock } from "lucide-react";
import { toast } from "sonner";

interface ThreadDetailClientProps {
  thread: ThreadRow;
  initialMessages: MessageRow[];
}

export function ThreadDetailClient({
  thread: initialThread,
  initialMessages,
}: ThreadDetailClientProps) {
  const router = useRouter();
  const [thread, setThread] = useState(initialThread);
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const refreshThread = useCallback(async () => {
    const res = await fetch(`/api/messages/threads/${thread.id}`);
    const json = await res.json();
    if (json.data) {
      setThread(json.data);
      setMessages(json.data.messages);
    }
  }, [thread.id]);

  const updateStatus = useCallback(
    async (status: string) => {
      const res = await fetch(`/api/messages/threads/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const json = await res.json();
        setThread((prev) => ({ ...prev, ...json.data }));
        toast.success(`Thread ${status.toLowerCase()}`);
      }
    },
    [thread.id]
  );

  const updatePriority = useCallback(
    async (priority: string) => {
      const res = await fetch(`/api/messages/threads/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: parseInt(priority) }),
      });
      if (res.ok) {
        const json = await res.json();
        setThread((prev) => ({ ...prev, ...json.data }));
      }
    },
    [thread.id]
  );

  const contactName = thread.contact
    ? `${thread.contact.firstName} ${thread.contact.lastName}`
    : "Unknown Contact";

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.push("/admin/blocks/messages")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {thread.subject || contactName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <ChannelBadge channelType={thread.channel.channelType} />
              <span className="text-xs text-muted-foreground">
                {contactName}
              </span>
              <span className="text-xs text-muted-foreground">
                &middot; {messages.length} messages
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {thread.status === "OPEN" && (
            <>
              <Button
                variant="outline"
                size="xs"
                onClick={() => updateStatus("CLOSED")}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Close
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => updateStatus("SNOOZED")}
              >
                <Clock className="mr-1 h-3 w-3" />
                Snooze
              </Button>
            </>
          )}
          {thread.status === "CLOSED" && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => updateStatus("OPEN")}
            >
              Reopen
            </Button>
          )}
          <Button
            variant="outline"
            size="xs"
            onClick={() => updateStatus("ARCHIVED")}
          >
            <Archive className="mr-1 h-3 w-3" />
            Archive
          </Button>

          <Select
            value={String(thread.priority)}
            onValueChange={updatePriority}
          >
            <SelectTrigger className="w-auto min-w-[100px] text-xs h-7">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Normal</SelectItem>
              <SelectItem value="1">High</SelectItem>
              <SelectItem value="2">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            No messages in this thread yet.
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="shrink-0">
        <ComposeMessage threadId={thread.id} onSent={refreshThread} />
      </div>
    </div>
  );
}
