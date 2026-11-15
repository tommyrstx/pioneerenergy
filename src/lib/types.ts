// Shape of the GA4 snapshot (src/data/lightinghub-ga4-data.json) and the
// view model the pages render. v2 can fill the same DashboardData from the
// GA4 Data API without touching the UI.

export type Scope = "sg" | "all";

export interface MonthPoint {
  month: string; // "2026-02"
  label: string; // "Feb"
  longLabel: string; // "Feb 2026" or "Nov 2026 (1 to 15 Nov, partial)"
  partial: boolean;
}

export interface ChannelShare {
  key: ChannelGroup;
  label: string;
  sessions: number;
  sharePct: number;
}

export type ChannelGroup = "organic" | "direct" | "referral" | "ai" | "other";

export interface ScopeData {
  label: string; // "Singapore" | "All countries"
  organicByMonth: (MonthPoint & { sessions: number })[];
  organicOct: number;
  organicFeb: number;
  organicGrowthX: number;
  organicOctDailyAvg: number;
  organicNovDailyAvg: number;
  organicTotal: number;
  organicSharePct: number;
  organicEngagementPct: number;
  channelMix: ChannelShare[];
  channelsByMonth: (MonthPoint & Record<ChannelGroup, number>)[];
}

export interface DashboardData {
  meta: {
    site: string;
    asOf: string; // "15 Nov 2026"
    source: string;
    timezoneNote: string;
    currencyNote: string;
    caveats: string[];
  };
  scopes: Record<Scope, ScopeData>;
  summary: {
    recordedPurchases: number;
    recordedRevenue: number;
    purchasesFromOrganic: number;
    aiOct: number;
    aiJun: number;
    aiTotal: number;
    chatgptTotal: number;
    chatgptSharePct: number;
  };
  directQuality: {
    months: (MonthPoint & {
      singapore: number;
      outside: number;
      outsideEngagementPct: number | null;
    })[];
    note: string;
    novOutside: number;
    novTotal: number;
    novOutsideEngagementPct: number;
    junOutsideEngagementPct: number;
    novTopCountries: { country: string; sessions: number }[];
  };
  revenue: {
    purchases: {
      month: string;
      source: string;
      device: string;
      language: string;
      landingPage: string;
      revenue: number;
    }[];
    items: { item: string; revenue: number }[];
    itemsTotal: number;
    itemsNote: string;
    issues: { issue: string; evidence: string }[];
    keyEvents: string[];
  };
  landingPages: {
    top: {
      path: string;
      sessions: number;
      engagementPct: number;
      pageType: string;
    }[];
    byType: { type: string; sessions: number }[];
    homepageSharePct: number;
    homepageSessions: number;
  };
  devices: {
    byMonth: (MonthPoint & { mobile: number; desktop: number; tablet: number })[];
    total: { mobile: number; desktop: number; tablet: number };
    mobileSharePct: number;
  };
  ai: {
    sources: string[];
    byMonth: (MonthPoint & Record<string, number | string | boolean>)[];
  };
  siteSearch: { term: string; sessions: number }[];
  language: {
    rows: { code: string; label: string; sessions: number; chinese: boolean }[];
    chineseTotal: number;
    totalListed: number;
    chineseSharePct: number;
    purchasesFromZhCn: number;
  };
}
