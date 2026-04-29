"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeChange,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Dagre from "@dagrejs/dagre";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import {
  TriggerNode,
  TRIGGER_NODE_WIDTH,
  TRIGGER_NODE_HEIGHT,
} from "./nodes/trigger-node";
import {
  StepNode,
  STEP_NODE_WIDTH,
  STEP_NODE_HEIGHT,
} from "./nodes/step-node";
import {
  OutputNode,
  OUTPUT_NODE_WIDTH,
  OUTPUT_NODE_HEIGHT,
} from "./nodes/output-node";
import type {
  CanvasStep,
  StepRunResult,
  TriggerNodeData,
  StepNodeData,
  OutputNodeData,
} from "./canvas-types";

const NODE_TYPES = {
  trigger: TriggerNode,
  step: StepNode,
  output: OutputNode,
};

/** Per-type bounding box used by Dagre to lay out the graph. */
function nodeSize(type: string | undefined): { width: number; height: number } {
  if (type === "trigger")
    return { width: TRIGGER_NODE_WIDTH, height: TRIGGER_NODE_HEIGHT };
  if (type === "output")
    return { width: OUTPUT_NODE_WIDTH, height: OUTPUT_NODE_HEIGHT };
  // Steps need extra vertical room for the floating "+" button (h-7 = 28px,
  // -bottom-3.5 = -14px), so add ~24px buffer.
  return { width: STEP_NODE_WIDTH, height: STEP_NODE_HEIGHT + 24 };
}

function dagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 70, nodesep: 60, marginx: 20, marginy: 20 });
  for (const n of nodes) {
    const size = nodeSize(n.type);
    g.setNode(n.id, size);
  }
  for (const e of edges) g.setEdge(e.source, e.target);
  Dagre.layout(g);
  return nodes.map((n) => {
    const pos = g.node(n.id);
    const size = nodeSize(n.type);
    return {
      ...n,
      position: {
        x: pos.x - size.width / 2,
        y: pos.y - size.height / 2,
      },
    };
  });
}

interface RoutineCanvasProps {
  triggerSummary: string;
  triggerType: "MANUAL" | "SCHEDULE" | "EVENT";
  steps: CanvasStep[];
  selectedStepId: string | null;
  invalidStepIds?: Set<string>;
  /** When set, paints nodes with their per-step run status (trace mode). */
  stepResults?: StepRunResult[];
  onSelectStep: (stepId: string) => void;
  onAddStep: (afterStepId: string | null) => void;
  onDeleteStep: (stepId: string) => void;
  onPositionChange?: (stepId: string, x: number, y: number) => void;
  /** Read-only mode disables editing controls (used in detail page trace view). */
  readOnly?: boolean;
}

export function RoutineCanvas({
  triggerSummary,
  triggerType,
  steps,
  selectedStepId,
  invalidStepIds,
  stepResults,
  onSelectStep,
  onAddStep,
  onDeleteStep,
  onPositionChange,
  readOnly = false,
}: RoutineCanvasProps) {
  // Build nodes + edges from props
  const { initialNodes, initialEdges } = useMemo(() => {
    const triggerNodeId = "trigger";
    const outputNodeId = "output";
    const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

    const nodes: Node[] = [
      {
        id: triggerNodeId,
        type: "trigger",
        position: { x: 0, y: 0 },
        width: TRIGGER_NODE_WIDTH,
        height: TRIGGER_NODE_HEIGHT,
        data: {
          triggerType,
          summary: triggerSummary,
        } as TriggerNodeData,
        draggable: !readOnly,
      },
      ...sortedSteps.map((s) => ({
        id: s.id,
        type: "step",
        position: {
          x: s.positionX ?? 0,
          y: s.positionY ?? 0,
        },
        width: STEP_NODE_WIDTH,
        height: STEP_NODE_HEIGHT,
        data: {
          step: s,
          isSelected: s.id === selectedStepId,
          isInvalid: invalidStepIds?.has(s.id) ?? false,
          runStatus: stepResults?.find((r) => r.stepId === s.id)?.status ?? null,
          onClick: () => onSelectStep(s.id),
          onAddAfter: () => onAddStep(s.id),
          onDelete: () => onDeleteStep(s.id),
        } as StepNodeData,
        draggable: !readOnly,
      })),
      {
        id: outputNodeId,
        type: "output",
        position: { x: 0, y: 0 },
        width: OUTPUT_NODE_WIDTH,
        height: OUTPUT_NODE_HEIGHT,
        data: { totalSteps: sortedSteps.length } as OutputNodeData,
        draggable: !readOnly,
      },
    ];

    const edges: Edge[] = [];
    let prevId: string = triggerNodeId;
    for (const s of sortedSteps) {
      edges.push({
        id: `${prevId}->${s.id}`,
        source: prevId,
        target: s.id,
        type: "smoothstep",
        animated: false,
      });
      prevId = s.id;
    }
    edges.push({
      id: `${prevId}->${outputNodeId}`,
      source: prevId,
      target: outputNodeId,
      type: "smoothstep",
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [
    steps,
    triggerType,
    triggerSummary,
    selectedStepId,
    invalidStepIds,
    stepResults,
    onSelectStep,
    onAddStep,
    onDeleteStep,
    readOnly,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Re-sync when props change (steps added/removed/selected)
  useEffect(() => {
    // Honor manual positions stored on the step; otherwise auto-layout.
    const haveAllPositions = steps.every(
      (s) => s.positionX != null && s.positionY != null
    );
    if (haveAllPositions && steps.length > 0) {
      setNodes(initialNodes);
    } else {
      setNodes(dagreLayout(initialNodes, initialEdges));
    }
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges, steps]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      if (!onPositionChange || readOnly) return;
      for (const ch of changes) {
        if (
          ch.type === "position" &&
          ch.position &&
          ch.id !== "trigger" &&
          ch.id !== "output"
        ) {
          onPositionChange(ch.id, ch.position.x, ch.position.y);
        }
      }
    },
    [onNodesChange, onPositionChange, readOnly]
  );

  function autoLayout() {
    setNodes(dagreLayout(initialNodes, initialEdges));
  }

  // Per-node-type colour for the minimap so the user can see the structure
  function miniMapNodeColor(node: Node): string {
    if (node.type === "trigger") {
      const tt = (node.data as TriggerNodeData)?.triggerType;
      return tt === "SCHEDULE" ? "#3b82f6" : tt === "EVENT" ? "#f59e0b" : "#64748b";
    }
    if (node.type === "output") return "#10b981";
    const status = (node.data as StepNodeData)?.runStatus;
    if (status === "SUCCESS") return "#10b981";
    if (status === "FAILED") return "#ef4444";
    if ((node.data as StepNodeData)?.isInvalid) return "#f59e0b";
    return "#94a3b8";
  }

  return (
    <div className="h-[640px] w-full rounded-md border bg-muted/10 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.25, minZoom: 0.4, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={!readOnly}
        nodesConnectable={false}
        edgesFocusable={false}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          zoomable
          pannable
          nodeColor={miniMapNodeColor}
          nodeStrokeWidth={2}
          maskColor="rgba(0,0,0,0.08)"
          className="!bg-background border rounded shadow-sm"
          style={{ width: 180, height: 120 }}
        />
        {!readOnly && (
          <Panel position="top-left" className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAddStep(null)}
              className="gap-1 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add step
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={autoLayout}
              className="gap-1 bg-background/80 shadow-sm"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Auto layout
            </Button>
          </Panel>
        )}
        <Panel
          position="top-right"
          className="text-xs text-muted-foreground bg-background/80 backdrop-blur rounded px-2.5 py-1 border shadow-sm"
        >
          {steps.length} step{steps.length === 1 ? "" : "s"}
        </Panel>
      </ReactFlow>
    </div>
  );
}
