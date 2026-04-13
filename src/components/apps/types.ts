export interface AppRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  category: string;
  status: string;
  isActive: boolean;
  authType: string;
  syncFrequencyMin: number;
  dataCategories: string[];
  connectedAt: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  dataPointCount: number;
  readyDataPointCount: number;
}

export interface AppStats {
  total: number;
  connected: number;
  syncing: number;
  error: number;
  totalDataPoints: number;
}

export interface AppDetail extends AppRow {
  syncStartDate: string | null;
  syncLogs: AppSyncLogRow[];
}

export interface AppSyncLogRow {
  id: string;
  action: string;
  status: string;
  details: string | null;
  recordsProcessed: number;
  syncedFrom: string | null;
  syncedTo: string | null;
  createdAt: string;
}

export interface AppDataPointRow {
  id: string;
  appId: string;
  category: string;
  date: string;
  textContent: string | null;
  status: string;
  errorMessage: string | null;
  chunkCount: number;
  processedAt: string | null;
  createdAt: string;
}
