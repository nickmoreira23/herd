"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatInterface } from "./chat-interface";
import { ArtifactDetailPanel } from "./artifacts/artifact-detail-panel";
import type { ArtifactMeta } from "@/lib/chat/types";

interface Conversation {
  id: string;
  title: string | null;
  model: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: { content: string; role: string; createdAt: string } | null;
}

interface ChatLayoutProps {
  initialConversations: Conversation[];
}

export function ChatLayout({ initialConversations }: ChatLayoutProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [model, setModel] = useState("claude-sonnet-4-20250514");
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactMeta | null>(null);

  // Sync model when selecting a conversation
  useEffect(() => {
    if (selectedId) {
      const conv = conversations.find((c) => c.id === selectedId);
      if (conv) setModel(conv.model);
    }
  }, [selectedId, conversations]);

  const handleNew = useCallback(() => {
    setSelectedId(null);
    setModel("claude-sonnet-4-20250514");
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (selectedId === id) setSelectedId(null);
      } catch (e) {
        console.error("Failed to delete conversation:", e);
      }
    },
    [selectedId]
  );

  const handleModelChange = useCallback(
    async (newModel: string) => {
      setModel(newModel);
      if (selectedId) {
        try {
          await fetch(`/api/chat/conversations/${selectedId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: newModel }),
          });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedId ? { ...c, model: newModel } : c
            )
          );
        } catch (e) {
          console.error("Failed to update model:", e);
        }
      }
    },
    [selectedId]
  );

  const handleFirstMessage = useCallback(
    (newConversationId: string) => {
      setSelectedId(newConversationId);
      // Add to conversations list
      const newConv: Conversation = {
        id: newConversationId,
        title: null,
        model,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessage: null,
      };
      setConversations((prev) => [newConv, ...prev]);
    },
    [model]
  );

  const handleTitleUpdate = useCallback(
    (conversationId: string, title: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, title } : c
        )
      );
    },
    []
  );

  const handleArtifactClick = useCallback((artifact: ArtifactMeta) => {
    setSelectedArtifact((prev) =>
      prev?.id === artifact.id ? null : artifact
    );
  }, []);

  // Close artifact panel when switching conversations
  useEffect(() => {
    setSelectedArtifact(null);
  }, [selectedId]);

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden rounded-lg border bg-background">
      <ChatSidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <ChatInterface
          conversationId={selectedId}
          model={model}
          onModelChange={handleModelChange}
          onFirstMessage={handleFirstMessage}
          onTitleUpdate={handleTitleUpdate}
          onArtifactClick={handleArtifactClick}
          selectedArtifactId={selectedArtifact?.id ?? null}
        />
      </div>
      {selectedArtifact && (
        <ArtifactDetailPanel
          artifact={selectedArtifact}
          onClose={() => setSelectedArtifact(null)}
        />
      )}
    </div>
  );
}
