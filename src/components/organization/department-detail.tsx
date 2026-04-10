"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Users, Building2, Plus, X, UserCircle } from "lucide-react";
import { toast } from "sonner";

interface Member {
  departmentId: string;
  profileId: string;
  title: string | null;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    status: string;
    profileType: { displayName: string; color: string | null };
  };
}

interface ChildDept {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  head: { id: string; firstName: string; lastName: string } | null;
  _count: { members: number };
}

interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  parent: { id: string; name: string; slug: string } | null;
  head: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null } | null;
  children: ChildDept[];
  members: Member[];
}

interface ProfileOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DepartmentDetailProps {
  department: Department;
  allProfiles: ProfileOption[];
}

export function DepartmentDetail({ department: initial, allProfiles }: DepartmentDetailProps) {
  const router = useRouter();
  const [department, setDepartment] = useState(initial);
  const [addingMember, setAddingMember] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/departments/${department.id}`);
    const json = await res.json();
    if (json.data) setDepartment(json.data);
  }, [department.id]);

  const addMember = async () => {
    if (!selectedProfileId) return;
    const res = await fetch(`/api/departments/${department.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: selectedProfileId }),
    });
    if (res.ok) {
      toast.success("Member added");
      setSelectedProfileId("");
      setAddingMember(false);
      await refresh();
      router.refresh();
    } else {
      toast.error("Failed to add member");
    }
  };

  const removeMember = async (profileId: string) => {
    const res = await fetch(`/api/departments/${department.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    if (res.ok) {
      toast.success("Member removed");
      await refresh();
      router.refresh();
    }
  };

  const existingMemberIds = new Set(department.members.map((m) => m.profileId));
  const availableProfiles = allProfiles.filter((p) => !existingMemberIds.has(p.id));

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/organization/departments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Departments
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: department.color || "#71717a" }}
            />
            <h1 className="text-2xl font-bold">{department.name}</h1>
            <Badge variant="outline" className="px-1 py-1 text-xs font-mono">
              {department.slug}
            </Badge>
          </div>
          {department.description && (
            <p className="text-sm text-muted-foreground ml-7">{department.description}</p>
          )}
          {department.parent && (
            <p className="text-xs text-muted-foreground ml-7">
              Part of{" "}
              <Link
                href={`/admin/organization/departments/${department.parent.id}`}
                className="hover:underline font-medium"
              >
                {department.parent.name}
              </Link>
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Head */}
      {department.head && (
        <div className="rounded-xl ring-1 ring-foreground/10 p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">Department Head</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {department.head.firstName} {department.head.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{department.head.email}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sub-departments */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Sub-departments</h2>
            <Badge variant="outline" className="px-1 py-1 text-xs">
              {department.children.length}
            </Badge>
          </div>
          {department.children.length > 0 ? (
            <div className="space-y-2">
              {department.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/admin/organization/departments/${child.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg ring-1 ring-foreground/10 hover:bg-muted/30 transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: child.color || "#71717a" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{child.name}</p>
                    {child.head && (
                      <p className="text-xs text-muted-foreground">
                        Led by {child.head.firstName} {child.head.lastName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {child._count.members}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sub-departments.</p>
          )}
        </div>

        {/* Members */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Members</h2>
            <Badge variant="outline" className="px-1 py-1 text-xs">
              {department.members.length}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 text-xs"
              onClick={() => setAddingMember(!addingMember)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>

          {/* Add member inline */}
          {addingMember && (
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/30">
              <Select
                value={selectedProfileId || "NONE"}
                onValueChange={(val) => setSelectedProfileId(val === "NONE" ? "" : val ?? "")}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a person..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" disabled>
                    Select a person...
                  </SelectItem>
                  {availableProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addMember} disabled={!selectedProfileId}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingMember(false);
                  setSelectedProfileId("");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {department.members.length > 0 ? (
            <div className="space-y-1">
              {department.members.map((m) => (
                <div
                  key={m.profileId}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.profile.firstName} {m.profile.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.profile.profileType.displayName}
                    </p>
                  </div>
                  {m.title && (
                    <Badge variant="outline" className="text-xs px-1 py-1 shrink-0">
                      {m.title}
                    </Badge>
                  )}
                  <button
                    onClick={() => removeMember(m.profileId)}
                    className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
