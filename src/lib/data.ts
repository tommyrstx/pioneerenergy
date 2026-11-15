import "server-only";

// Static v1 snapshot. Imported at build time by a server module, so the JSON
// is bundled into the server build only and never served from /public.
import raw from "@/data/lightinghub-ga4-data.json";
import type {
  ChannelGroup,
  ChannelShare,
  DashboardData,
  MonthPoint,
  ScopeData,
} from "./types";

type Raw = typeof raw;
type ChannelRow = { month: string; channel: string; sessions: number; engaged_sessions: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthPoint(m: Raw["monthly"][number]): MonthPoint {
  const [y, mm] = m.month.split("-").map(Number);
  const label = MONTHS[mm - 1];
  const longLabel = m.partial
    ? `${label} ${y} (1 to ${m.days_covered} ${label}, partial)`
    : `${label} ${y}`;
  return { month: m.month, label, longLabel, partial: m.partial };
}

const CHANNEL_GROUP: Record<string, ChannelGroup> = {
  "Organic Search": "organic",
  Direct: "direct",
  Referral: "referral",
  "AI Assistant": "ai",
};
const GROUP_LABEL: Record<ChannelGroup, string> = {
  organic: "Search engines",
  direct: "Typed in / bookmarks",
  referral: "Other websites",
  ai: "AI assistants",
  other: "Other",
};
const GROUP_ORDER: ChannelGroup[] = ["organic", "direct", "referral", "ai", "other"];
const group = (channel: string): ChannelGroup => CHANNEL_GROUP[channel] ?? "other";

function channelMix(rows: { channel: string; sessions: number; share_pct: number }[]): ChannelShare[] {
  // Named channels keep the share_pct from the JSON as-is. "Other" is the
  // sum of the remaining small channels' sessions over the scope's total.
  const total = rows.reduce((s, r) => s + r.sessions, 0);
  return GROUP_ORDER.map((key) => {
    const members = rows.filter((r) => group(r.channel) === key);
    const sessions = members.reduce((s, r) => s + r.sessions, 0);
    const sharePct =
      key === "other"
        ? Math.round((sessions / total) * 1000) / 10
        : (members[0]?.share_pct ?? 0);
    return { key, label: GROUP_LABEL[key], sessions, sharePct };
  });
}

function channelsByMonth(rows: ChannelRow[], months: MonthPoint[]) {
  return months.map((mp) => {
    const out = { ...mp, organic: 0, direct: 0, referral: 0, ai: 0, other: 0 };
    for (const r of rows) if (r.month === mp.month) out[group(r.channel)] += r.sessions;
    return out;
  });
}

function sum(rows: ChannelRow[], month: string, channel: string, key: "sessions" | "engaged_sessions") {
  return rows.find((r) => r.month === month && r.channel === channel)?.[key] ?? 0;
}

function formatAsOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en_sg: "English (Singapore)",
  en_us: "English (US)",
  en_gb: "English (UK)",
  en: "English",
  zh_cn: "Chinese (Simplified)",
  zh_sg: "Chinese (Singapore)",
  zh: "Chinese",
};

function build(d: Raw): DashboardData {
  const h = d.headline;
  const months = d.monthly.map(monthPoint);
  const nov = d.monthly.find((m) => m.partial)!;
  const novDays = nov.days_covered ?? 15;
  const oct = d.monthly.find((m) => m.month === "2026-10")!;

  const sgOrganicEng = d.channels_total_singapore.find((c) => c.channel === "Organic Search")!;
  const allOrganicEng = d.channels_total_all_countries.find((c) => c.channel === "Organic Search")!;

  const sg: ScopeData = {
    label: "Singapore",
    organicByMonth: d.monthly.map((m, i) => ({ ...months[i], sessions: m.organic_singapore.sessions })),
    organicFeb: h.organic_singapore_feb,
    organicOct: h.organic_singapore_oct,
    organicGrowthX: h.organic_singapore_growth_x,
    // The JSON's daily averages are all-country; the Singapore ones are
    // the monthly Singapore figures divided by days in the month.
    organicOctDailyAvg: Math.round((oct.organic_singapore.sessions / 31) * 10) / 10,
    organicNovDailyAvg: Math.round((nov.organic_singapore.sessions / novDays) * 10) / 10,
    organicTotal: h.organic_sessions_singapore_total,
    organicSharePct: h.organic_share_of_singapore_sessions_pct,
    organicEngagementPct: sgOrganicEng.engagement_rate_pct,
    channelMix: channelMix(d.channels_total_singapore),
    channelsByMonth: channelsByMonth(d.channel_by_month_singapore, months),
  };

  const all: ScopeData = {
    label: "All countries",
    organicByMonth: d.monthly.map((m, i) => ({ ...months[i], sessions: m.organic_all.sessions })),
    organicFeb: h.organic_feb_2026,
    organicOct: h.organic_oct_2026,
    organicGrowthX: h.organic_growth_feb_to_oct_x,
    organicOctDailyAvg: h.organic_oct_daily_avg,
    organicNovDailyAvg: h.organic_nov_daily_avg,
    organicTotal: h.organic_sessions_total,
    organicSharePct: allOrganicEng.share_pct,
    organicEngagementPct: allOrganicEng.engagement_rate_pct,
    channelMix: channelMix(d.channels_total_all_countries),
    channelsByMonth: channelsByMonth(d.channel_by_month_all_countries, months),
  };

  // Direct traffic split: outside Singapore = all countries minus Singapore.
  const directMonths = months.map((mp) => {
    const a = sum(d.channel_by_month_all_countries, mp.month, "Direct", "sessions");
    const s = sum(d.channel_by_month_singapore, mp.month, "Direct", "sessions");
    const ae = sum(d.channel_by_month_all_countries, mp.month, "Direct", "engaged_sessions");
    const se = sum(d.channel_by_month_singapore, mp.month, "Direct", "engaged_sessions");
    const outside = a - s;
    return {
      ...mp,
      singapore: s,
      outside,
      outsideEngagementPct: outside > 0 ? Math.round(((ae - se) / outside) * 1000) / 10 : null,
    };
  });
  const anomaly = d.direct_traffic_anomaly.months;
  const novA = anomaly.find((m) => m.month === "2026-11")!;
  const junA = anomaly.find((m) => m.month === "2026-06")!;

  const aiSources = Array.from(
    new Set(d.monthly.flatMap((m) => Object.keys(m.ai_referrals_by_source))),
  ).sort((a, b) => (a === "chatgpt" ? -1 : b === "chatgpt" ? 1 : a.localeCompare(b)));

  const dev = d.organic_device_total;
  const devTotal = dev.mobile + dev.desktop + dev.tablet;
  const lang = d.language_singapore;

  return {
    meta: {
      site: d.meta.site,
      asOf: formatAsOf(d.meta.pulled_on),
      source: "Google Analytics 4",
      timezoneNote: d.meta.timezone_note,
      currencyNote: d.meta.currency_note,
      caveats: d.meta.caveats,
    },
    scopes: { sg, all },
    summary: {
      recordedPurchases: h.recorded_purchases,
      recordedRevenue: h.recorded_revenue,
      purchasesFromOrganic: h.purchases_attributed_to_organic,
      aiOct: h.ai_referrals_oct,
      aiJun: h.ai_referrals_jun,
      aiTotal: h.ai_referrals_total,
      chatgptTotal: h.chatgpt_sessions_total,
      chatgptSharePct: h.chatgpt_share_of_ai_pct,
    },
    directQuality: {
      months: directMonths,
      note: d.direct_traffic_anomaly.note,
      novOutside: novA.direct_outside_singapore,
      novTotal: novA.direct_total,
      novOutsideEngagementPct: novA.engagement_rate_outside_sg_pct,
      junOutsideEngagementPct: junA.engagement_rate_outside_sg_pct,
      novTopCountries: Object.entries(novA.top_countries ?? {}).map(([country, sessions]) => ({
        country: country === "HongKong" ? "Hong Kong" : country,
        sessions: sessions as number,
      })),
    },
    revenue: {
      purchases: d.purchases.map((p) => ({
        month: formatAsOf(`${p.month}-01`).slice(2),
        source: p.source,
        device: p.device,
        language: p.language,
        landingPage: p.landing_page,
        revenue: p.revenue,
      })),
      items: d.items_with_revenue,
      itemsTotal: Math.round(d.items_with_revenue.reduce((s, i) => s + i.revenue, 0) * 100) / 100,
      itemsNote: d.items_note,
      issues: d.tracking_issues,
      keyEvents: h.key_events_configured,
    },
    landingPages: {
      top: d.organic_landing_pages_top150.slice(0, 25).map((p) => ({
        path: p.path,
        sessions: p.sessions,
        engagementPct: p.engagement_rate_pct,
        pageType: p.page_type,
      })),
      byType: Object.entries(d.organic_by_page_type_top150)
        .map(([type, sessions]) => ({ type, sessions: sessions as number }))
        .sort((a, b) => b.sessions - a.sessions),
      homepageSharePct: h.homepage_share_of_organic_pct,
      homepageSessions: d.organic_landing_pages_top150.find((p) => p.path === "/")!.sessions,
    },
    devices: {
      byMonth: d.monthly.map((m, i) => ({ ...months[i], ...m.organic_by_device })),
      total: { mobile: dev.mobile, desktop: dev.desktop, tablet: dev.tablet },
      mobileSharePct: Math.round((dev.mobile / devTotal) * 1000) / 10,
    },
    ai: {
      sources: aiSources,
      byMonth: d.monthly.map((m, i) => {
        const row: MonthPoint & Record<string, number | string | boolean> = { ...months[i] };
        for (const s of aiSources) row[s] = (m.ai_referrals_by_source as Record<string, number | undefined>)[s] ?? 0;
        row.total = m.ai_referrals_total;
        return row;
      }),
    },
    siteSearch: d.site_search_terms.slice(0, 30),
    language: {
      rows: Object.entries(LANGUAGE_LABELS)
        .map(([code, label]) => ({
          code: code.replace("_", "-"),
          label,
          sessions: (lang as Record<string, number>)[code] ?? 0,
          chinese: code.startsWith("zh"),
        }))
        .sort((a, b) => b.sessions - a.sessions),
      chineseTotal: lang.chinese_total,
      totalListed: lang.total_listed,
      chineseSharePct: lang.chinese_share_pct,
      purchasesFromZhCn: lang.purchases_from_zh_cn,
    },
  };
}

/**
 * The one entry point the pages use. v1 reads the bundled JSON snapshot.
 * v2 can fetch from the GA4 Data API here (cached, e.g. revalidate daily)
 * and map the responses into the same DashboardData shape.
 */
export async function getDashboardData(): Promise<DashboardData> {
  return build(raw);
}
