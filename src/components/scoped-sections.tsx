"use client";

import type { DashboardData, ScopeData } from "@/lib/types";
import { fmtDec, fmtInt, fmtMoney, fmtPct, fmtX } from "@/lib/format";
import { Legend, MonthlyBars, cssVar, type Colour, type Series } from "./charts";
import { ScopeChip, useScope } from "./scope";

type Scopes = DashboardData["scopes"];

const CHANNEL_COLOUR: Record<string, Colour> = {
  organic: "amber",
  direct: "blue",
  referral: "sage",
  ai: "plum",
  other: "grey",
};

function useData(scopes: Scopes): ScopeData {
  const { scope } = useScope();
  return scopes[scope];
}

export function SummaryCards({ scopes, summary }: { scopes: Scopes; summary: DashboardData["summary"] }) {
  const { scope } = useScope();
  const s = scopes[scope];
  const where = scope === "sg" ? "Singapore" : "all countries";
  return (
    <div className="stats" id="summary">
      <div className="stat good">
        <div className="k">Organic visits · Oct 2026</div>
        <div className="n">{fmtInt(s.organicOct)}</div>
        <div className="t">
          Up {fmtX(s.organicGrowthX)} since February ({fmtInt(s.organicFeb)}). {scope === "sg" ? "Singapore only." : "All countries."}
        </div>
      </div>
      <div className="stat amber">
        <div className="k">Share of visits from search</div>
        <div className="n">{fmtPct(s.organicSharePct)}</div>
        <div className="t">
          Of all {where} visits, Dec 2025 to Nov 2026.
        </div>
      </div>
      <div className="stat bad">
        <div className="k">Purchases tracked in GA4</div>
        <div className="n">{fmtInt(summary.recordedPurchases)}</div>
        <div className="t">
          {fmtMoney(summary.recordedRevenue)} recorded since Dec 2025. {summary.purchasesFromOrganic} from search.
        </div>
        <span className="flag">Tracking broken</span>
      </div>
      <div className="stat info">
        <div className="k">AI assistant visits · Oct 2026</div>
        <div className="n">{fmtInt(summary.aiOct)}</div>
        <div className="t">Up from {fmtInt(summary.aiJun)} in June. All countries.</div>
      </div>
    </div>
  );
}

export function GrowthSection({ scopes }: { scopes: Scopes }) {
  const { scope } = useScope();
  const s = useData(scopes);
  const growth = scope === "sg" ? "more than 8x" : `nearly 8x (${fmtX(s.organicGrowthX)})`;
  return (
    <section className="card" id="growth">
      <h2>
        <span className="num">2</span>Organic growth
        <ScopeChip />
      </h2>
      <div className="takeaway">
        Organic visits grew {growth} between February and October. November is on the same daily pace as October.
      </div>
      <div className="small muted">
        Monthly visits from unpaid search results (Google, Bing and others). October averaged {fmtDec(s.organicOctDailyAvg)} a day; the first
        15 days of November averaged {fmtDec(s.organicNovDailyAvg)} a day. Total since December: {fmtInt(s.organicTotal)}, of which{" "}
        {fmtPct(s.organicEngagementPct)} were engaged (stayed over 10 seconds, viewed two or more pages, or took an action).
      </div>
      <MonthlyBars
        data={s.organicByMonth}
        series={[{ key: "sessions", label: "Organic visits", colour: "amber" }]}
        keyLabels={[2, 10, 11]}
        ariaLabel={`Monthly organic visits, ${s.label}. February ${fmtInt(s.organicFeb)}, October ${fmtInt(s.organicOct)}.`}
      />
      <Legend series={[]} />
      <p className="small muted" style={{ margin: "8px 0 0" }}>
        Data starts in December 2025, when Google Analytics was set up, so there is no comparison with last year.
      </p>
    </section>
  );
}

export function ChannelsSection({ scopes }: { scopes: Scopes }) {
  const { scope } = useScope();
  const s = useData(scopes);
  const organic = s.channelMix.find((c) => c.key === "organic")!;
  const direct = s.channelMix.find((c) => c.key === "direct")!;
  const series: Series[] = s.channelMix.map((c) => ({ key: c.key, label: c.label, colour: CHANNEL_COLOUR[c.key] }));
  return (
    <section className="card" id="channels">
      <h2>
        <span className="num">3</span>Where visits come from
        <ScopeChip />
      </h2>
      <div className="takeaway">
        {scope === "sg"
          ? "Search engines bring in six in every ten Singapore visits."
          : `Across all countries, typed-in visits look larger (${fmtPct(direct.sharePct)}) because of bot-like traffic from abroad. Search engines bring in ${fmtPct(organic.sharePct)}.`}
      </div>
      <div className="small muted">
        Share of visits by channel, Dec 2025 to Nov 2026. Search engines include Google, Bing and Yahoo; Google sends about 96% of them.
      </div>
      <div className="mix" role="img" aria-label="Channel mix">
        {s.channelMix.map((c) => (
          <span key={c.key} style={{ width: `${c.sharePct}%`, background: cssVar(CHANNEL_COLOUR[c.key]) }} />
        ))}
      </div>
      <ul className="legend">
        {s.channelMix.map((c) => (
          <li key={c.key}>
            <i style={{ background: cssVar(CHANNEL_COLOUR[c.key]) }} />
            {c.label} <b>{fmtPct(c.sharePct)}</b> <span className="muted">({fmtInt(c.sessions)})</span>
          </li>
        ))}
      </ul>
      <div className="sub">Visits by channel, month by month</div>
      <MonthlyBars data={s.channelsByMonth} series={series} keyLabels={[10, 11]} height={260} ariaLabel={`Monthly visits by channel, ${s.label}`} />
      <Legend series={series} />
      <p className="small muted" style={{ margin: "8px 0 0" }}>
        &quot;Typed in / bookmarks&quot; is what Google Analytics calls Direct. &quot;Other&quot; covers social media, paid ads and visits Google
        Analytics couldn&apos;t label.
      </p>
    </section>
  );
}
