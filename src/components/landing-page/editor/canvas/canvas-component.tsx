"use client";

import { useState, useCallback, useRef, useLayoutEffect, createElement } from "react";
import { cn } from "@/lib/utils";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { ComponentRenderer, componentStylesToCSS } from "../../renderer/component-renderer";
import { getComponentDefinition } from "@/lib/landing-page/registry";
import type { ComponentNode } from "@/types/landing-page";

interface CanvasComponentProps {
  node: ComponentNode;
  sectionId: string;
}

// Component types that support inline text editing
const EDITABLE_TYPES = new Set(["heading", "text", "button"]);

// Map component type to the prop key that holds the text
const TEXT_PROP_KEY: Record<string, string> = {
  heading: "text",
  text: "text",
  button: "text",
};

// Button style maps for inline editing
const btnVariantStyles: Record<string, React.CSSProperties> = {
  primary: { backgroundColor: "#18181b", color: "#ffffff" },
  secondary: { backgroundColor: "#f4f4f5", color: "#18181b" },
  outline: { backgroundColor: "transparent", color: "#18181b", border: "1px solid #e4e4e7" },
  ghost: { backgroundColor: "transparent", color: "#18181b" },
};
const btnSizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: "8px 16px", fontSize: 13 },
  md: { padding: "12px 24px", fontSize: 14 },
  lg: { padding: "16px 32px", fontSize: 16 },
};

function InlineEditor({
  node,
  onCommit,
  onInput,
}: {
  node: ComponentNode;
  onCommit: (text: string) => void;
  onInput: (text: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const propKey = TEXT_PROP_KEY[node.type];
  const text = (node.props[propKey] as string) || "";
  const style = componentStylesToCSS(node.styles);
  const initializedRef = useRef(false);

  // Set initial text content imperatively (before paint, no flash)
  // After this, the contentEditable DOM manages its own content.
  useLayoutEffect(() => {
    if (ref.current && !initializedRef.current) {
      initializedRef.current = true;
      ref.current.textContent = text;
      ref.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    onCommit(e.currentTarget.textContent || "");
  };

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    onInput(e.currentTarget.textContent || "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
    // For headings and buttons, Enter commits; for text blocks, Enter inserts newline
    if (e.key === "Enter" && node.type !== "text") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const editableProps = {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onBlur: handleBlur,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
  };

  // IMPORTANT: Do NOT pass text as children — React would reconcile on every
  // re-render, resetting cursor position. Content is set via ref in useLayoutEffect.

  if (node.type === "heading") {
    const tag = (node.props.level as string) || "h2";
    return createElement(tag, {
      ...editableProps,
      style: { ...style, outline: "none", cursor: "text" },
    });
  }

  if (node.type === "text") {
    const tag = (node.props.tag as string) || "p";
    return createElement(tag, {
      ...editableProps,
      style: { ...style, outline: "none", cursor: "text", whiteSpace: "pre-wrap" },
    });
  }

  if (node.type === "button") {
    const variant = (node.props.variant as string) || "primary";
    const size = (node.props.size as string) || "md";
    const combinedStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "text",
      textDecoration: "none",
      fontWeight: 600,
      borderRadius: style.borderRadius ?? 8,
      ...btnVariantStyles[variant],
      ...btnSizeStyles[size],
      ...style,
      outline: "none",
    };
    return <span {...editableProps} style={combinedStyle} />;
  }

  return null;
}

export function CanvasComponent({ node, sectionId }: CanvasComponentProps) {
  const selectedComponentId = useLandingPageEditorStore((s) => s.selectedComponentId);
  const selectComponent = useLandingPageEditorStore((s) => s.selectComponent);
  const updateComponentProps = useLandingPageEditorStore((s) => s.updateComponentProps);

  const [isEditing, setIsEditing] = useState(false);

  const isSelected = selectedComponentId === node.id;
  const definition = getComponentDefinition(node.type);
  const canEdit = EDITABLE_TYPES.has(node.type);

  const handleInput = useCallback(
    (newText: string) => {
      const propKey = TEXT_PROP_KEY[node.type];
      if (propKey) {
        updateComponentProps(sectionId, node.id, { [propKey]: newText });
      }
    },
    [sectionId, node.id, node.type, updateComponentProps]
  );

  const handleCommit = useCallback(
    (newText: string) => {
      const propKey = TEXT_PROP_KEY[node.type];
      if (propKey) {
        updateComponentProps(sectionId, node.id, { [propKey]: newText });
      }
      setIsEditing(false);
    },
    [sectionId, node.id, node.type, updateComponentProps]
  );

  return (
    <div
      className={cn(
        "group/component relative cursor-pointer transition-all",
        isSelected
          ? "ring-2 ring-blue-500 ring-offset-1 rounded"
          : "hover:ring-1 hover:ring-blue-300 hover:ring-offset-1 hover:rounded"
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (!isEditing) {
          selectComponent(sectionId, node.id);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (canEdit) {
          selectComponent(sectionId, node.id);
          setIsEditing(true);
        }
      }}
      onBlur={(e) => {
        if (isEditing && !e.currentTarget.contains(e.relatedTarget)) {
          setIsEditing(false);
        }
      }}
    >
      {/* Component type label */}
      {!isEditing && (
        <div
          className={cn(
            "absolute -top-5 left-0 text-[10px] font-medium px-1.5 py-0.5 rounded-t transition-opacity z-10",
            isSelected
              ? "opacity-100 bg-blue-500 text-white"
              : "opacity-0 group-hover/component:opacity-100 bg-blue-400 text-white"
          )}
        >
          {definition?.label || node.type}
        </div>
      )}

      {/* Rendered component or inline editor */}
      {isEditing ? (
        <InlineEditor node={node} onCommit={handleCommit} onInput={handleInput} />
      ) : (
        <ComponentRenderer node={node} isEditor />
      )}
    </div>
  );
}
