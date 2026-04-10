"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  ChevronRight,
  ChevronDown,
  Server,
  Users,
  Megaphone,
  Briefcase,
  Cog,
  Building2,
  DollarSign,
  Shield,
  Truck,
  Headphones,
  Scale,
  Flag,
  X,
  GripVertical,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────
interface Milestone {
  id?: string;
  memberCount: number;
  monthlyCost: number;
  notes?: string | null;
  [key: string]: unknown;
}

interface OpexItem {
  id: string;
  name: string;
  description?: string | null;
  vendor?: string | null;
  milestones: Milestone[];
  [key: string]: unknown;
}

interface OpexCategory {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
  items: OpexItem[];
  [key: string]: unknown;
}

interface MilestoneLevel {
  id: string;
  memberCount: number;
  label: string;
  [key: string]: unknown;
}

// ─── Constants ────────────────────────────────────────────────
const DEFAULT_MILESTONE_LEVELS: { memberCount: number; label: string }[] = [
  { memberCount: 0, label: "Pre-Launch" },
  { memberCount: 1000, label: "1k" },
  { memberCount: 5000, label: "5k" },
  { memberCount: 10000, label: "10k" },
  { memberCount: 25000, label: "25k" },
  { memberCount: 50000, label: "50k" },
  { memberCount: 100000, label: "100k" },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Server,
  Users,
  Megaphone,
  Briefcase,
  Cog,
  Building2,
  Shield,
  Truck,
  Headphones,
  Scale,
};

// ─── Category Presets with suggested expenses ────────────────
interface ExpensePreset {
  name: string;
  vendor?: string;
  description?: string;
}

interface CategoryPreset {
  name: string;
  description: string;
  icon: string;
  color: string;
  expenses: ExpensePreset[];
}

const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    name: "Technology",
    description: "SaaS tools, hosting, infrastructure, dev tools",
    icon: "Server",
    color: "#3B82F6",
    expenses: [
      { name: "Cloud Hosting", vendor: "AWS / GCP / Azure", description: "Servers, databases, storage" },
      { name: "Domain & DNS", vendor: "Cloudflare / GoDaddy", description: "Domain registration and DNS management" },
      { name: "Email Service", vendor: "Google Workspace / Microsoft 365", description: "Business email and productivity suite" },
      { name: "CI/CD & DevOps", vendor: "GitHub / Vercel / Netlify", description: "Code hosting, deployments, CI pipelines" },
      { name: "Analytics", vendor: "Mixpanel / Amplitude / GA", description: "Product and web analytics" },
      { name: "Error Monitoring", vendor: "Sentry / Datadog", description: "Error tracking and performance monitoring" },
      { name: "Database", vendor: "Supabase / PlanetScale", description: "Managed database service" },
      { name: "AI / ML Services", vendor: "OpenAI / Anthropic", description: "AI APIs and machine learning tools" },
      { name: "Design Tools", vendor: "Figma / Adobe", description: "UI/UX design and creative tools" },
      { name: "Project Management", vendor: "Linear / Jira / Notion", description: "Task tracking and documentation" },
    ],
  },
  {
    name: "Marketing",
    description: "Paid ads, content creation, SEO, social media",
    icon: "Megaphone",
    color: "#F59E0B",
    expenses: [
      { name: "Paid Search Ads", vendor: "Google Ads", description: "Search engine advertising" },
      { name: "Social Media Ads", vendor: "Meta / TikTok", description: "Facebook, Instagram, TikTok ads" },
      { name: "SEO Tools", vendor: "Ahrefs / SEMrush", description: "Search engine optimization" },
      { name: "Email Marketing", vendor: "Klaviyo / Mailchimp", description: "Email campaigns and automation" },
      { name: "Social Media Management", vendor: "Hootsuite / Buffer", description: "Social scheduling and analytics" },
      { name: "Content Creation", description: "Copywriting, video production, photography" },
      { name: "Influencer Marketing", description: "Influencer partnerships and sponsorships" },
      { name: "PR & Communications", description: "Press releases, media outreach" },
      { name: "Affiliate Platform", vendor: "Impact / ShareASale", description: "Affiliate program management" },
      { name: "Brand & Creative", description: "Brand assets, packaging design" },
    ],
  },
  {
    name: "People",
    description: "Salaries, contractors, HR, benefits",
    icon: "Users",
    color: "#8B5CF6",
    expenses: [
      { name: "Salaries & Wages", description: "Full-time employee compensation" },
      { name: "Contractors & Freelancers", description: "Independent contractor payments" },
      { name: "Health Insurance", description: "Employee health benefits" },
      { name: "Payroll Processing", vendor: "Gusto / ADP / Deel", description: "Payroll service fees" },
      { name: "Recruiting & Hiring", vendor: "LinkedIn / Indeed", description: "Job postings and recruiting tools" },
      { name: "Training & Development", description: "Employee training, courses, conferences" },
      { name: "HR Software", vendor: "BambooHR / Rippling", description: "HR management platform" },
      { name: "Employee Perks", description: "Stipends, team events, wellness" },
    ],
  },
  {
    name: "Operations",
    description: "Office, utilities, supplies, day-to-day costs",
    icon: "Cog",
    color: "#6B7280",
    expenses: [
      { name: "Accounting Software", vendor: "QuickBooks / Xero", description: "Bookkeeping and invoicing" },
      { name: "Banking Fees", description: "Business bank account and transaction fees" },
      { name: "Payment Processing", vendor: "Stripe / PayPal", description: "Payment gateway fees" },
      { name: "Business Insurance", description: "General liability, E&O insurance" },
      { name: "Office Supplies", description: "Everyday office materials" },
      { name: "Communication Tools", vendor: "Slack / Zoom", description: "Team chat and video conferencing" },
      { name: "Travel & Expenses", description: "Business travel, meals, transportation" },
      { name: "Subscriptions & Memberships", description: "Industry memberships, publications" },
    ],
  },
  {
    name: "Fulfillment",
    description: "Warehousing, shipping, packaging, logistics",
    icon: "Truck",
    color: "#10B981",
    expenses: [
      { name: "Warehouse / 3PL", description: "Warehousing and third-party logistics" },
      { name: "Shipping & Freight", vendor: "UPS / FedEx / USPS", description: "Outbound shipping costs" },
      { name: "Packaging Materials", description: "Boxes, labels, inserts, mailers" },
      { name: "Inventory Management", vendor: "ShipBob / ShipStation", description: "Inventory and order management software" },
      { name: "Returns Processing", description: "Return shipping and restocking" },
      { name: "Customs & Duties", description: "International shipping fees and tariffs" },
    ],
  },
  {
    name: "Customer Support",
    description: "Support tools, CRM, call center, ticketing",
    icon: "Headphones",
    color: "#EC4899",
    expenses: [
      { name: "Help Desk Software", vendor: "Zendesk / Intercom", description: "Ticketing and live chat" },
      { name: "CRM", vendor: "HubSpot / Salesforce", description: "Customer relationship management" },
      { name: "Phone System", vendor: "Aircall / RingCentral", description: "Business phone and call center" },
      { name: "Knowledge Base", vendor: "Notion / GitBook", description: "Self-service documentation" },
      { name: "Customer Success Tools", vendor: "Gainsight / Vitally", description: "Customer health and retention" },
      { name: "Support Staff", description: "Customer support team compensation" },
    ],
  },
  {
    name: "Legal & Compliance",
    description: "Legal fees, licensing, insurance, audits",
    icon: "Scale",
    color: "#64748B",
    expenses: [
      { name: "Legal Counsel", description: "Attorneys, legal advice, contract review" },
      { name: "Business Licenses", description: "State and local business permits" },
      { name: "Trademark & IP", description: "Trademark registration and protection" },
      { name: "Compliance Software", description: "Regulatory compliance tools" },
      { name: "Audit & Tax Prep", vendor: "CPA Firm", description: "Annual audits and tax preparation" },
      { name: "Data Privacy", description: "GDPR, CCPA compliance tools and consulting" },
    ],
  },
  {
    name: "Security",
    description: "Cybersecurity, fraud prevention, monitoring",
    icon: "Shield",
    color: "#EF4444",
    expenses: [
      { name: "SSL & Certificates", description: "SSL certificates and encryption" },
      { name: "Security Monitoring", vendor: "CrowdStrike / SentinelOne", description: "Endpoint protection and threat detection" },
      { name: "Fraud Prevention", description: "Anti-fraud tools and services" },
      { name: "Penetration Testing", description: "Security audits and pen tests" },
      { name: "Password Management", vendor: "1Password / LastPass", description: "Team password management" },
      { name: "Backup & Recovery", description: "Data backup and disaster recovery" },
    ],
  },
  {
    name: "Facilities",
    description: "Rent, maintenance, equipment, physical space",
    icon: "Building2",
    color: "#0EA5E9",
    expenses: [
      { name: "Office Rent", description: "Monthly office or coworking space rental" },
      { name: "Utilities", description: "Electricity, water, internet, phone" },
      { name: "Office Equipment", description: "Desks, chairs, monitors, peripherals" },
      { name: "Cleaning & Maintenance", description: "Janitorial and building maintenance" },
      { name: "Security & Access", description: "Physical security, key cards, cameras" },
      { name: "Furniture & Buildout", description: "Office buildout and furniture" },
    ],
  },
];

function getCategoryIcon(icon?: string | null) {
  const Icon = icon && ICON_MAP[icon] ? ICON_MAP[icon] : Briefcase;
  return Icon;
}

function formatMilestoneLabel(m: number) {
  if (m === 0) return "Pre-Launch";
  if (m >= 1000) return `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)}k`;
  return String(m);
}

// ─── Milestone Pyramid ───────────────────────────────────────
function MilestonePyramid({
  totalLayers,
  solidLayers,
}: {
  totalLayers: number;
  solidLayers: number;
  active: boolean;
}) {
  const w = 110;
  const h = 92;
  const gap = 4;
  const bottomWidth = w - 10;
  const cx = w / 2;

  // The pyramid tip is at the center-top. The two edges go from
  // the tip straight down to the bottom corners at a constant angle.
  // We divide the full height (minus gaps) into equal-height layers.
  const totalGap = (totalLayers - 1) * gap;
  const layerHeight = (h - totalGap) / totalLayers;

  // The tip point
  const tipX = cx;
  const tipY = 0;
  // Bottom corners
  void (cx - bottomWidth / 2); // blX
  void (cx + bottomWidth / 2); // brX
  const bottomY = h;

  // For each layer, compute the y-range accounting for gaps,
  // then find the width at that y by linearly interpolating the pyramid edge.
  function widthAtY(y: number) {
    // At y=tipY width=0, at y=bottomY width=bottomWidth
    const t = (y - tipY) / (bottomY - tipY);
    return bottomWidth * t;
  }

  const layers = [];
  for (let i = 0; i < totalLayers; i++) {
    // y positions for this layer (layer 0 = top/peak)
    const yTop = i * (layerHeight + gap);
    const yBot = yTop + layerHeight;

    const wTop = widthAtY(yTop);
    const wBot = widthAtY(yBot);

    // For the very top layer (i=0), the top edge converges to a point (the tip)
    let points: string;
    if (i === 0) {
      // Triangle: tip point, bottom-left, bottom-right
      points = [
        `${tipX},${tipY}`,
        `${cx + wBot / 2},${yBot}`,
        `${cx - wBot / 2},${yBot}`,
      ].join(" ");
    } else {
      // Trapezoid: top-left, top-right, bottom-right, bottom-left
      points = [
        `${cx - wTop / 2},${yTop}`,
        `${cx + wTop / 2},${yTop}`,
        `${cx + wBot / 2},${yBot}`,
        `${cx - wBot / 2},${yBot}`,
      ].join(" ");
    }

    // Solid from bottom: layer index >= (totalLayers - solidLayers)
    const isSolid = i >= totalLayers - solidLayers;

    layers.push(
      <polygon
        key={i}
        points={points}
        fill={isSolid ? "#000000" : "none"}
        stroke={isSolid ? "#000000" : "#9ca3af"}
        strokeWidth={1.2}
        strokeDasharray={isSolid ? "none" : "4 3"}
        strokeLinejoin="round"
        opacity={isSolid ? 0.75 : 0.4}
      />
    );
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
    >
      {layers}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────
interface OperationsClientProps {
  initialCategories: OpexCategory[];
  initialMilestoneLevels: MilestoneLevel[];
}

export function OperationsClient({ initialCategories, initialMilestoneLevels }: OperationsClientProps) {
  const [categories, setCategories] = useState<OpexCategory[]>(initialCategories);
  const [milestoneLevels, setMilestoneLevels] = useState<MilestoneLevel[]>(initialMilestoneLevels);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(initialCategories.map((c) => c.id))
  );
  const [activeMilestone, setActiveMilestone] = useState<number>(0);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OpexCategory | null>(null);
  const [editingItem, setEditingItem] = useState<{ categoryId: string; item?: OpexItem } | null>(null);

  // Refresh data
  const refresh = useCallback(async () => {
    const res = await fetch("/api/operation");
    if (res.ok) {
      const json = await res.json();
      setCategories(json.data);
    }
  }, []);

  const refreshMilestones = useCallback(async () => {
    const res = await fetch("/api/operation/milestones");
    if (res.ok) {
      const json = await res.json();
      setMilestoneLevels(json.data);
    }
  }, []);

  // Milestone numbers derived from levels (or defaults)
  const allMilestones = useMemo(() => {
    if (milestoneLevels.length > 0) {
      return milestoneLevels.map((m) => m.memberCount);
    }
    return DEFAULT_MILESTONE_LEVELS.map((m) => m.memberCount);
  }, [milestoneLevels]);

  // Label map
  const milestoneLabels = useMemo(() => {
    const map: Record<number, string> = {};
    if (milestoneLevels.length > 0) {
      milestoneLevels.forEach((m) => (map[m.memberCount] = m.label));
    } else {
      DEFAULT_MILESTONE_LEVELS.forEach((m) => (map[m.memberCount] = m.label));
    }
    return map;
  }, [milestoneLevels]);

  // Total OPEX at selected milestone
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalAtMilestone = useMemo(() => {
    return categories.reduce((catSum, cat) => {
      return (
        catSum +
        cat.items.reduce((itemSum, item) => {
          return itemSum + getCostAtMilestone(item, activeMilestone);
        }, 0)
      );
    }, 0);
  }, [categories, activeMilestone]);

  // Category totals at selected milestone
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    categories.forEach((cat) => {
      map[cat.id] = cat.items.reduce((sum, item) => {
        return sum + getCostAtMilestone(item, activeMilestone);
      }, 0);
    });
    return map;
  }, [categories, activeMilestone]);

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteCategory(id: string) {
    const res = await fetch(`/api/operation/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Category deleted");
      await refresh();
    } else {
      toast.error("Failed to delete category");
    }
  }

  async function handleDeleteItem(categoryId: string, itemId: string) {
    const res = await fetch(`/api/operation/${categoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteItem", itemId }),
    });
    if (res.ok) {
      toast.success("Expense deleted");
      await refresh();
    } else {
      toast.error("Failed to delete expense");
    }
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Category drag end
  async function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    setCategories(reordered);

    const res = await fetch("/api/operation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds: reordered.map((c) => c.id) }),
    });
    if (!res.ok) {
      toast.error("Failed to reorder categories");
      await refresh();
    }
  }

  // Item drag end within a category
  async function handleItemDragEnd(categoryId: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;

    const oldIndex = cat.items.findIndex((i) => i.id === active.id);
    const newIndex = cat.items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(cat.items, oldIndex, newIndex);

    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, items: reordered } : c))
    );

    const res = await fetch(`/api/operation/${categoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorderItems", itemIds: reordered.map((i) => i.id) }),
    });
    if (!res.ok) {
      toast.error("Failed to reorder");
      await refresh();
    }
  }

  // OPEX at each milestone for the cards
  const opexByMilestone = useMemo(() => {
    const map: Record<number, number> = {};
    allMilestones.forEach((m) => {
      map[m] = categories.reduce(
        (catSum, cat) =>
          catSum + cat.items.reduce((s, item) => s + getCostAtMilestone(item, m), 0),
        0
      );
    });
    return map;
  }, [categories, allMilestones]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track operational expenses as your business scales across member milestones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setEditingCategory(null); setShowCategoryDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon" />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem onClick={() => setShowMilestoneDialog(true)}>
                <Flag className="h-3.5 w-3.5 mr-2 shrink-0" />
                <span>Edit Milestones</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h2 className="text-base font-medium text-muted-foreground mb-3">Milestones</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {allMilestones.map((m, idx) => {
            const isActive = activeMilestone === m;
            const monthly = opexByMilestone[m] || 0;
            const yearly = monthly * 12;
            const label = milestoneLabels[m] || formatMilestoneLabel(m);
            // Pre-Launch doesn't count as a layer — only subscriber milestones do
            const nonPreLaunchCount = allMilestones.filter((x) => x > 0).length;
            const totalLayers = Math.max(nonPreLaunchCount, 1);
            // Pre-Launch (idx 0) = 0 solid layers, then idx 1 = 1 solid, etc.
            const solidLayers = m === 0 ? 0 : idx;

            return (
              <button
                key={m}
                onClick={() => setActiveMilestone(m)}
                className={cn(
                  "flex-shrink-0 w-48 rounded-xl p-4 text-left transition-all cursor-pointer",
                  isActive
                    ? "border-2 border-foreground bg-muted/50"
                    : "border border-border bg-card hover:bg-[#fafafa] dark:hover:bg-muted/30"
                )}
              >
                {/* Pyramid SVG */}
                <div className="flex justify-center mb-3">
                  <MilestonePyramid
                    totalLayers={totalLayers}
                    solidLayers={solidLayers}
                    active={isActive}
                  />
                </div>
                {/* Label */}
                <p className="text-sm font-semibold">
                  {m === 0 ? "Pre-Launch" : label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m === 0 ? "\u00A0" : "subscribers"}
                </p>
                {/* Costs */}
                <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                  <div>
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(monthly)}</p>
                    <p className="text-xs text-muted-foreground">Monthly Opex</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums text-muted-foreground">
                      {formatCurrency(yearly)}
                    </p>
                    <p className="text-xs text-muted-foreground">Yearly Opex</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses */}
      <div>
        <h2 className="text-base font-medium text-muted-foreground mb-3">Expenses</h2>
        {categories.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium">No expense categories yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Start by adding a category like Technology, People, or Marketing.
            </p>
            <Button onClick={() => { setEditingCategory(null); setShowCategoryDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
            <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {categories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  const expanded = expandedCategories.has(cat.id);
                  const catTotal = categoryTotals[cat.id] || 0;
                  const color = cat.color || "#6B7280";

                  return (
                    <SortableCategoryCard
                      key={cat.id}
                      id={cat.id}
                      cat={cat}
                      Icon={Icon}
                      expanded={expanded}
                      catTotal={catTotal}
                      color={color}
                      activeMilestone={activeMilestone}
                      sensors={sensors}
                      onToggle={() => toggleCategory(cat.id)}
                      onAddExpense={() => {
                        setEditingItem({ categoryId: cat.id });
                        setShowItemDialog(true);
                      }}
                      onEditCategory={() => {
                        setEditingCategory(cat);
                        setShowCategoryDialog(true);
                      }}
                      onDeleteCategory={() => handleDeleteCategory(cat.id)}
                      onEditItem={(item) => {
                        setEditingItem({ categoryId: cat.id, item });
                        setShowItemDialog(true);
                      }}
                      onDeleteItem={(itemId) => handleDeleteItem(cat.id, itemId)}
                      onItemDragEnd={(event) => handleItemDragEnd(cat.id, event)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Category Dialog */}
      <CategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        category={editingCategory}
        existingNames={categories.map((c) => c.name)}
        onSave={refresh}
      />

      {/* Item Dialog */}
      <ItemDialog
        open={showItemDialog}
        onOpenChange={setShowItemDialog}
        categoryId={editingItem?.categoryId}
        categoryName={categories.find((c) => c.id === editingItem?.categoryId)?.name}
        existingItemNames={categories.find((c) => c.id === editingItem?.categoryId)?.items.map((i) => i.name)}
        item={editingItem?.item}
        milestones={allMilestones}
        milestoneLabels={milestoneLabels}
        onSave={refresh}
      />

      {/* Milestone Dialog */}
      <MilestoneDialog
        open={showMilestoneDialog}
        onOpenChange={setShowMilestoneDialog}
        levels={milestoneLevels}
        onSave={refreshMilestones}
      />
    </div>
  );
}

// ─── Sortable Expense Row ────────────────────────────────────
function SortableExpenseRow({
  id,
  item,
  activeMilestone,
  onEdit,
  onDelete,
}: {
  id: string;
  item: OpexItem;
  activeMilestone: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cost = getCostAtMilestone(item, activeMilestone);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-2.5 border-t border-border/50 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{item.name}</span>
          {item.vendor && (
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              {item.vendor}
            </span>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold tabular-nums shrink-0">
        {cost > 0 ? formatCurrency(cost) : "\u2014"}
      </span>
      <span className="text-xs text-muted-foreground shrink-0">/mo</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            />
          }
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Sortable Category Card ──────────────────────────────────
function SortableCategoryCard({
  id,
  cat,
  Icon,
  expanded,
  catTotal,
  color,
  activeMilestone,
  sensors,
  onToggle,
  onAddExpense,
  onEditCategory,
  onDeleteCategory,
  onEditItem,
  onDeleteItem,
  onItemDragEnd,
}: {
  id: string;
  cat: OpexCategory;
  Icon: React.ElementType;
  expanded: boolean;
  catTotal: number;
  color: string;
  activeMilestone: number;
  sensors: ReturnType<typeof useSensors>;
  onToggle: () => void;
  onAddExpense: () => void;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  onEditItem: (item: OpexItem) => void;
  onDeleteItem: (itemId: string) => void;
  onItemDragEnd: (event: DragEndEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-card overflow-hidden">
      {/* Category header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div
          className="h-8 w-8 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{cat.name}</h3>
        </div>
        <span className="text-sm font-bold tabular-nums">{formatCurrency(catTotal)}</span>
        <span className="text-xs text-muted-foreground">/mo</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => e.stopPropagation()}
              />
            }
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddExpense}>
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add Expense
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEditCategory}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit Category
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={onDeleteCategory}>
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete Category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded: expense list */}
      {expanded && (
        <div className="border-t">
          {cat.items.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No expenses in this category.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={onAddExpense}>
                <Plus className="h-3 w-3 mr-1" />
                Add Expense
              </Button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemDragEnd}>
              <SortableContext items={cat.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div>
                  {cat.items.map((item) => (
                    <SortableExpenseRow
                      key={item.id}
                      id={item.id}
                      item={item}
                      activeMilestone={activeMilestone}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => onDeleteItem(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────
function getCostAtMilestone(item: OpexItem, memberCount: number): number {
  let cost = 0;
  for (const m of item.milestones) {
    if (m.memberCount <= memberCount) {
      cost = Number(m.monthlyCost);
    } else {
      break;
    }
  }
  return cost;
}

// ─── Category Dialog ──────────────────────────────────────────
type DialogStep = "presets" | "expenses" | "custom";

function CategoryDialog({
  open,
  onOpenChange,
  category,
  existingNames,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: OpexCategory | null;
  existingNames: string[];
  onSave: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Briefcase");
  const [color, setColor] = useState("#6B7280");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<DialogStep>("presets");
  const [selectedPreset, setSelectedPreset] = useState<CategoryPreset | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || "");
      setIcon(category.icon || "Briefcase");
      setColor(category.color || "#6B7280");
      setStep("custom");
      setSelectedPreset(null);
      setSelectedExpenses(new Set());
    } else {
      setName("");
      setDescription("");
      setIcon("Briefcase");
      setColor("#6B7280");
      setStep("presets");
      setSelectedPreset(null);
      setSelectedExpenses(new Set());
    }
  }, [category, open]);

  function selectPreset(preset: CategoryPreset) {
    setName(preset.name);
    setDescription(preset.description);
    setIcon(preset.icon);
    setColor(preset.color);
    setSelectedPreset(preset);
    // Pre-select all expenses
    setSelectedExpenses(new Set(preset.expenses.map((e) => e.name)));
    setStep("expenses");
  }

  function toggleExpense(expenseName: string) {
    setSelectedExpenses((prev) => {
      const next = new Set(prev);
      if (next.has(expenseName)) next.delete(expenseName);
      else next.add(expenseName);
      return next;
    });
  }

  function toggleAllExpenses() {
    if (!selectedPreset) return;
    if (selectedExpenses.size === selectedPreset.expenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(selectedPreset.expenses.map((e) => e.name)));
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (category) {
        await fetch(`/api/operation/${category.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateCategory", name, description, icon, color }),
        });
        toast.success("Category updated");
      } else {
        // Build items from selected expenses
        const items = selectedPreset
          ? selectedPreset.expenses
              .filter((e) => selectedExpenses.has(e.name))
              .map((e) => ({
                name: e.name,
                description: e.description || undefined,
                vendor: e.vendor || undefined,
              }))
          : undefined;

        await fetch("/api/operation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, icon, color, items }),
        });
        const count = items?.length || 0;
        toast.success(
          count > 0
            ? `Category created with ${count} expense${count > 1 ? "s" : ""}`
            : "Category created"
        );
      }
      onSave();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  // Available presets (exclude already-added categories)
  const availablePresets = CATEGORY_PRESETS.filter(
    (p) => !existingNames.some((n) => n.toLowerCase() === p.name.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[calc(100vh-6rem)]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Edit Category"
              : step === "expenses"
              ? `${name} \u2014 Select Expenses`
              : "Add Category"}
          </DialogTitle>
          {!isEditing && step === "presets" && (
            <DialogDescription>
              Choose a common category or create a custom one.
            </DialogDescription>
          )}
          {step === "expenses" && (
            <DialogDescription>
              Select the expenses you want to track in this category. You can always add more later.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Step 1: Preset selection */}
        {!isEditing && step === "presets" && (
          <div className="space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {availablePresets.map((preset) => {
                const Icon = ICON_MAP[preset.icon];
                return (
                  <button
                    key={preset.name}
                    onClick={() => selectPreset(preset)}
                    className="flex items-center gap-3 rounded-lg border px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${preset.color}15` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: preset.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{preset.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {preset.expenses.length === 0
                        ? "No expenses"
                        : preset.expenses.length === 1
                        ? "1 expense"
                        : `${preset.expenses.length} expenses`}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setStep("custom")}
            >
              Create Custom Category
            </Button>
          </div>
        )}

        {/* Step 2: Expense selection (after choosing a preset) */}
        {!isEditing && step === "expenses" && selectedPreset && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setStep("presets"); setSelectedPreset(null); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              &larr; Back to categories
            </button>

            {/* Select all / none */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {selectedExpenses.size} of {selectedPreset.expenses.length} selected
              </span>
              <button
                onClick={toggleAllExpenses}
                className="text-xs text-primary hover:underline"
              >
                {selectedExpenses.size === selectedPreset.expenses.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            {/* Expense list */}
            <div className="space-y-1 max-h-[calc(100vh-22rem)] overflow-y-auto">
              {selectedPreset.expenses.map((expense) => {
                const selected = selectedExpenses.has(expense.name);
                return (
                  <button
                    key={expense.name}
                    onClick={() => toggleExpense(expense.name)}
                    className={cn(
                      "flex items-start gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                      selected
                        ? "bg-primary/5 border border-primary/20"
                        : "border border-transparent hover:bg-muted/50"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                        selected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {selected && (
                        <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{expense.name}</span>
                        {expense.vendor && (
                          <span className="text-xs text-muted-foreground">{expense.vendor}</span>
                        )}
                      </div>
                      {expense.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{expense.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("custom")}
              >
                Customize
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving
                  ? "Creating..."
                  : `Create with ${selectedExpenses.size} Expense${selectedExpenses.size !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Custom / Edit form */}
        {(isEditing || step === "custom") && (
          <div className="space-y-4">
            {!isEditing && (
              <button
                onClick={() => {
                  if (selectedPreset) {
                    setStep("expenses");
                  } else {
                    setStep("presets");
                  }
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back
              </button>
            )}
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Technology" />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. SaaS tools, hosting, infrastructure"
              />
            </div>
            <div>
              <Label className="mb-2 block">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {["#3B82F6","#F59E0B","#8B5CF6","#6B7280","#10B981","#EC4899","#64748B","#EF4444","#0EA5E9","#F97316"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-7 w-7 rounded-full transition-all",
                      color === c ? "ring-2 ring-offset-2 ring-foreground" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Icon</Label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(ICON_MAP).map(([key, I]) => (
                  <button
                    key={key}
                    onClick={() => setIcon(key)}
                    className={cn(
                      "h-8 w-8 rounded-md flex items-center justify-center transition-all",
                      icon === key
                        ? "ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80"
                    )}
                    style={icon === key ? { backgroundColor: `${color}20` } : undefined}
                  >
                    <I className="h-4 w-4" style={icon === key ? { color } : undefined} />
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={!name.trim() || saving}>
                {saving ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Item Dialog ──────────────────────────────────────────────
type ItemDialogStep = "suggestions" | "form";

function ItemDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  existingItemNames,
  item,
  milestones: milestoneLevels,
  milestoneLabels,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categoryId?: string;
  categoryName?: string;
  existingItemNames?: string[];
  item?: OpexItem;
  milestones: number[];
  milestoneLabels: Record<number, string>;
  onSave: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [costs, setCosts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<ItemDialogStep>("suggestions");

  const isEditing = !!item;

  const levels = milestoneLevels.length > 0 ? milestoneLevels : DEFAULT_MILESTONE_LEVELS.map((m) => m.memberCount);

  // Find matching preset suggestions for this category
  const suggestions = useMemo(() => {
    if (!categoryName) return [];
    const preset = CATEGORY_PRESETS.find(
      (p) => p.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (!preset) return [];
    const existingSet = new Set((existingItemNames || []).map((n) => n.toLowerCase()));
    return preset.expenses.filter((e) => !existingSet.has(e.name.toLowerCase()));
  }, [categoryName, existingItemNames]);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || "");
      setVendor(item.vendor || "");
      const c: Record<number, string> = {};
      levels.forEach((m) => {
        const ms = item.milestones.find((x) => x.memberCount === m);
        c[m] = ms ? String(Number(ms.monthlyCost)) : "";
      });
      setCosts(c);
      setStep("form");
    } else {
      setName("");
      setDescription("");
      setVendor("");
      setCosts({});
      setStep(suggestions.length > 0 ? "suggestions" : "form");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, open]);

  function selectSuggestion(expense: ExpensePreset) {
    setName(expense.name);
    setDescription(expense.description || "");
    setVendor(expense.vendor || "");
    setCosts({});
    setStep("form");
  }

  function handleCostChange(milestone: number, value: string) {
    setCosts((prev) => ({ ...prev, [milestone]: value }));
  }

  async function handleSave() {
    if (!categoryId) return;
    setSaving(true);

    const milestones = levels
      .filter((m) => costs[m] && parseFloat(costs[m]) > 0)
      .map((m) => ({
        memberCount: m,
        monthlyCost: parseFloat(costs[m]),
      }));

    try {
      if (item) {
        await fetch(`/api/operation/${categoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateItem",
            itemId: item.id,
            name,
            description,
            vendor,
            milestones,
          }),
        });
        toast.success("Expense updated");
      } else {
        await fetch(`/api/operation/${categoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addItem",
            name,
            description,
            vendor,
            milestones,
          }),
        });
        toast.success("Expense added");
      }
      onSave();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[calc(100vh-6rem)]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Edit Expense"
              : step === "form" && name
              ? name
              : "Add Expense"}
          </DialogTitle>
          {!isEditing && step === "suggestions" && (
            <DialogDescription>
              Choose a common expense or create a custom one.
            </DialogDescription>
          )}
          {isEditing && (
            <DialogDescription>
              Update the expense details and costs at each milestone.
            </DialogDescription>
          )}
          {!isEditing && step === "form" && (
            <DialogDescription>
              Set the expense details and monthly cost at each milestone.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Step 1: Suggestions */}
        {!isEditing && step === "suggestions" && (
          <div className="space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto">
            <div className="grid grid-cols-1 gap-1.5">
              {suggestions.map((expense) => (
                <button
                  key={expense.name}
                  onClick={() => selectSuggestion(expense)}
                  className="flex items-start gap-3 rounded-lg border px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{expense.name}</span>
                      {expense.vendor && (
                        <span className="text-xs text-muted-foreground">{expense.vendor}</span>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{expense.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-popover px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setStep("form")}
            >
              Create Custom Expense
            </Button>
          </div>
        )}

        {/* Step 2 / Edit: Form */}
        {(isEditing || step === "form") && (
          <div className="space-y-4">
            {!isEditing && suggestions.length > 0 && (
              <button
                onClick={() => {
                  setName("");
                  setDescription("");
                  setVendor("");
                  setCosts({});
                  setStep("suggestions");
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back to suggestions
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Expense Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AWS Hosting" />
              </div>
              <div>
                <Label>Vendor</Label>
                <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Amazon" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this expense"
              />
            </div>
            <div>
              <Label className="mb-2 block">Monthly Cost by Milestone</Label>
              <div className="space-y-2">
                {levels.map((m) => (
                  <div key={m} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                    <span className="text-sm text-muted-foreground w-24 shrink-0">
                      {milestoneLabels[m] || formatMilestoneLabel(m)}
                    </span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        className="pl-6 h-8 text-sm"
                        value={costs[m] || ""}
                        onChange={(e) => handleCostChange(m, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">/mo</span>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={!name.trim() || saving}>
                {saving ? "Saving\u2026" : isEditing ? "Update Expense" : "Add Expense"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Milestone Dialog ─────────────────────────────────────────
function MilestoneDialog({
  open,
  onOpenChange,
  levels,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  levels: MilestoneLevel[];
  onSave: () => Promise<void> | void;
}) {
  const [rows, setRows] = useState<{ memberCount: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (levels.length > 0) {
      // Ensure Pre-Launch (0) is always first
      const existing = levels.map((l) => ({ memberCount: String(l.memberCount), label: l.label }));
      const hasPreLaunch = existing.some((r) => r.memberCount === "0");
      if (!hasPreLaunch) {
        setRows([{ memberCount: "0", label: "Pre-Launch" }, ...existing]);
      } else {
        setRows(existing);
      }
    } else {
      setRows(DEFAULT_MILESTONE_LEVELS.map((m) => ({ memberCount: String(m.memberCount), label: m.label })));
    }
  }, [levels, open]);

  function addRow() {
    setRows((prev) => [...prev, { memberCount: "", label: "" }]);
  }

  function removeRow(idx: number) {
    // Don't allow removing Pre-Launch (first row with memberCount "0")
    if (rows[idx].memberCount === "0" && rows[idx].label === "Pre-Launch") return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, field: "memberCount" | "label", value: string) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        if (field === "memberCount") {
          const num = parseInt(value);
          const autoLabel = isNaN(num) ? "" : num === 0 ? "Pre-Launch" : formatMilestoneLabel(num);
          const currentAutoLabel = formatMilestoneLabel(parseInt(r.memberCount));
          return {
            ...r,
            memberCount: value,
            label: r.label === "" || r.label === currentAutoLabel ? autoLabel : r.label,
          };
        }
        return { ...r, [field]: value };
      })
    );
  }

  async function handleSave() {
    const valid = rows
      .filter((r) => r.memberCount !== "" && r.label.trim() !== "")
      .map((r) => ({ memberCount: parseInt(r.memberCount), label: r.label.trim() }))
      .filter((r) => !isNaN(r.memberCount))
      .sort((a, b) => a.memberCount - b.memberCount);

    if (valid.length === 0) {
      toast.error("Add at least one milestone");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/operation/milestones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestones: valid }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        console.error("Save milestones error:", errBody);
        toast.error("Failed to save milestones");
        setSaving(false);
        return;
      }
      // Refresh milestone data before closing
      await onSave();
      toast.success("Milestones updated");
      onOpenChange(false);
    } catch (e) {
      console.error("Save milestones exception:", e);
      toast.error("Failed to save milestones");
    } finally {
      setSaving(false);
    }
  }

  const isPreLaunchRow = (row: { memberCount: string; label: string }) =>
    row.memberCount === "0" && row.label === "Pre-Launch";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Milestones</DialogTitle>
          <DialogDescription>
            Define growth milestones to track how your expenses scale with subscribers.
          </DialogDescription>
        </DialogHeader>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-1">
          <span className="flex-1 text-xs font-medium text-muted-foreground">Title</span>
          <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">Subscribers</span>
          <div className="w-7 shrink-0" />
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {rows.map((row, idx) => {
            const locked = isPreLaunchRow(row);
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                  locked ? "bg-muted/30 border-border/50" : "bg-card"
                )}
              >
                {/* Milestone number badge */}
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-muted-foreground">{idx + 1}</span>
                </div>

                {/* Title */}
                <Input
                  className="h-8 text-sm flex-1"
                  placeholder="e.g. 5k"
                  value={row.label}
                  onChange={(e) => updateRow(idx, "label", e.target.value)}
                  disabled={locked}
                />

                {/* Subscriber count */}
                <div className="relative w-28 shrink-0">
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    placeholder="0"
                    value={row.memberCount}
                    onChange={(e) => updateRow(idx, "memberCount", e.target.value)}
                    disabled={locked}
                  />
                </div>

                {/* Remove */}
                {locked ? (
                  <div className="w-7 shrink-0" />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeRow(idx)}
                    className="shrink-0 text-muted-foreground hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <Button variant="outline" size="sm" onClick={addRow} className="w-full" disabled={saving}>
          <Plus className="h-3 w-3 mr-1" />
          Add Milestone
        </Button>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving\u2026" : "Save Milestones"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
