"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Dagre from "@dagrejs/dagre";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Award } from "lucide-react";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  parentId: string | null;
  profileType: { id: string; displayName: string; color: string | null };
  profileRoles: Array<{ role: { displayName: string } }>;
  profileRanks: Array<{
    rankTier: { displayName: string; color: string | null; level: number };
  }>;
}

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 40 });

  for (const node of nodes) {
    g.setNode(node.id, { width: 220, height: 80 });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  Dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - 110, y: pos.y - 40 },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function NetworkNode({ data }: NodeProps) {
  const d = data as {
    label: string;
    email: string;
    profileType: string;
    profileColor: string | null;
    rank: string | null;
    rankColor: string | null;
    status: string;
  };

  const borderColor = d.rankColor || d.profileColor || "#71717a";

  return (
    <div
      className="bg-card rounded-xl ring-1 px-4 py-3 w-[220px] shadow-sm"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground/50 !w-2 !h-2" />
      <div className="flex items-start gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${borderColor}20` }}
        >
          <UserCircle className="h-4 w-4" style={{ color: borderColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{d.label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{d.profileType}</p>
          {d.rank && (
            <div className="flex items-center gap-1 mt-1">
              <Award className="h-2.5 w-2.5 shrink-0" style={{ color: d.rankColor || "#71717a" }} />
              <span className="text-[10px] font-medium" style={{ color: d.rankColor || "#71717a" }}>
                {d.rank}
              </span>
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground/50 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { networkNode: NetworkNode };

export function NetworkMapCanvas() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/org-chart/external");
      const json = await res.json();
      if (json.data) {
        setProfiles(json.data.profiles);
      }
      setLoading(false);
    }
    load();
  }, []);

  const buildGraph = useCallback(() => {
    const profileIds = new Set(profiles.map((p) => p.id));

    const newNodes: Node[] = profiles.map((p) => {
      const rank = p.profileRanks[0]?.rankTier;
      return {
        id: p.id,
        type: "networkNode",
        position: { x: 0, y: 0 },
        data: {
          label: `${p.firstName} ${p.lastName}`,
          email: p.email,
          profileType: p.profileType.displayName,
          profileColor: p.profileType.color,
          rank: rank?.displayName || null,
          rankColor: rank?.color || null,
          status: p.status,
        },
      };
    });

    const newEdges: Edge[] = profiles
      .filter((p) => p.parentId && profileIds.has(p.parentId))
      .map((p) => ({
        id: `e-${p.parentId}-${p.id}`,
        source: p.parentId!,
        target: p.id,
        style: { stroke: "#71717a", strokeWidth: 1.5 },
        type: "smoothstep",
      }));

    if (newNodes.length > 0) {
      const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
      setNodes(layouted);
      setEdges(layoutedEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [profiles, setNodes, setEdges]);

  useEffect(() => {
    if (!loading) buildGraph();
  }, [loading, buildGraph]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-sm text-muted-foreground">
        Loading network map...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Network Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive view of your external network — sponsors, downlines, and partner relationships.
          </p>
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
        {profiles.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(n) => {
                const data = n.data as { rankColor?: string | null };
                return data?.rankColor || "#71717a";
              }}
              className="!bg-card !ring-1 !ring-foreground/10"
            />
            <Panel position="top-left">
              <Badge variant="outline" className="px-1 py-1 text-xs bg-card">
                {profiles.length} partners
              </Badge>
            </Panel>
          </ReactFlow>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <UserCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">No external network profiles yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              External partners will appear here once added to the network.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
