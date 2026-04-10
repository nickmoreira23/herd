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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCircle, Building2 } from "lucide-react";

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
  departmentMemberships: Array<{
    department: { id: string; name: string; color: string | null };
  }>;
}

interface Department {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  headId: string | null;
  color: string | null;
  _count: { members: number };
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

function OrgChartNode({ data }: NodeProps) {
  const d = data as {
    label: string;
    email: string;
    profileType: string;
    profileColor: string | null;
    department: string;
    departmentColor: string | null;
    roles: string[];
    status: string;
  };

  return (
    <div className="bg-card rounded-xl ring-1 ring-foreground/10 px-4 py-3 w-[220px] shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground/50 !w-2 !h-2" />
      <div className="flex items-start gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: d.departmentColor || d.profileColor || "#71717a", opacity: 0.2 }}
        >
          <UserCircle className="h-4 w-4" style={{ color: d.departmentColor || d.profileColor || "#71717a" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{d.label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{d.profileType}</p>
          {d.department && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: d.departmentColor || "#71717a" }}
              />
              <span className="text-[10px] text-muted-foreground truncate">{d.department}</span>
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground/50 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { orgChart: OrgChartNode };

export function OrgChartCanvas() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState("ALL");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/org-chart/internal");
      const json = await res.json();
      if (json.data) {
        setProfiles(json.data.profiles);
        setDepartments(json.data.departments);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filteredProfiles = useMemo(() => {
    if (filterDept === "ALL") return profiles;
    return profiles.filter((p) =>
      p.departmentMemberships.some((dm) => dm.department.id === filterDept)
    );
  }, [profiles, filterDept]);

  const buildGraph = useCallback(() => {
    const profileIds = new Set(filteredProfiles.map((p) => p.id));

    const newNodes: Node[] = filteredProfiles.map((p) => {
      const dept = p.departmentMemberships[0]?.department;
      return {
        id: p.id,
        type: "orgChart",
        position: { x: 0, y: 0 },
        data: {
          label: `${p.firstName} ${p.lastName}`,
          email: p.email,
          profileType: p.profileType.displayName,
          profileColor: p.profileType.color,
          department: dept?.name || "",
          departmentColor: dept?.color || null,
          roles: p.profileRoles.map((r) => r.role.displayName),
          status: p.status,
        },
      };
    });

    const newEdges: Edge[] = filteredProfiles
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
  }, [filteredProfiles, setNodes, setEdges]);

  useEffect(() => {
    if (!loading) buildGraph();
  }, [loading, buildGraph]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-sm text-muted-foreground">
        Loading org chart...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Org Chart</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive view of your internal organizational structure and reporting lines.
          </p>
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
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
              const data = n.data as { departmentColor?: string | null };
              return data?.departmentColor || "#71717a";
            }}
            className="!bg-card !ring-1 !ring-foreground/10"
          />
          <Panel position="top-left" className="flex items-center gap-2">
            <Select value={filterDept} onValueChange={(val) => setFilterDept(val ?? "ALL")}>
              <SelectTrigger className="w-auto min-w-[160px] bg-card text-sm">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="px-1 py-1 text-xs bg-card">
              {filteredProfiles.length} people
            </Badge>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
