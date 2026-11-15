import { getDashboardData } from "@/lib/data";
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";
import { HatchDefs, Legend, MonthlyBars, type Series } from "@/components/charts";
import { ScopeProvider, ScopeToggle } from "@/components/scope";
import { ThemeToggle } from "@/components/theme";
import { ChannelsSection, GrowthSection, SummaryCards } from "@/components/scoped-sections";

const NAV = [
  ["summary", "Summary"],
  ["growth", "Organic growth"],
  ["channels", "Where visits come from"],
  ["quality", "Traffic quality"],
  ["revenue", "Revenue tracking"],
  ["pages", "Top pages"],
  ["devices", "Devices"],
  ["ai", "AI assistants"],
  ["search-terms", "Site search"],
  ["chinese", "Chinese visitors"],
  ["search-console", "Search Console"],
] as const;

const PAGE_TYPE: Record<string, { label: string; tone?: "warn" | "good" | "amber" }> = {
  homepage: { label: "Homepage", tone: "amber" },
  category: { label: "Category" },
  product: { label: "Product" },
  blog: { label: "Blog guide", tone: "good" },
  showroom: { label: "Showroom" },
  brand: { label: "Brand" },
  other: { label: "Other" },
  utility: { label: "Cart / login / app", tone: "warn" },
  not_set: { label: "(not set)", tone: "warn" },
};

const AI_LABEL: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  copilot: "Copilot",
  perplexity: "Perplexity",
  claude: "Claude",
};
const AI_COLOUR = ["blue", "sage", "plum", "amber", "grey"] as const;

function Heading({ n, title, scope }: { n: number; title: string; scope?: string }) {
  return (
    <h2>
      <span className="num">{n}</span>
      {title}
      {scope && <span className="scope">{scope}</span>}
    </h2>
  );
}

function PageType({ type }: { type: string }) {
  const t = PAGE_TYPE[type] ?? { label: type };
  return <span className={`ptype${t.tone ? ` ${t.tone}` : ""}`}>{t.label}</span>;
}

export default async function Dashboard() {
  const d = await getDashboardData();
  const q = d.directQuality;
  const lp = d.landingPages;
  const maxType = Math.max(...lp.byType.map((t) => t.sessions));
  const maxTerm = Math.max(...d.siteSearch.map((t) => t.sessions));
  const maxLang = Math.max(...d.language.rows.map((r) => r.sessions));

  const directSeries: Series[] = [
    { key: "singapore", label: "From Singapore", colour: "blue" },
    { key: "outside", label: "From outside Singapore", colour: "red" },
  ];
  const deviceSeries: Series[] = [
    { key: "mobile", label: "Mobile", colour: "amber" },
    { key: "desktop", label: "Desktop", colour: "blue" },
    { key: "tablet", label: "Tablet", colour: "sage" },
  ];
  // ChatGPT is every month's largest source, so it goes last (top of the
  // stack) where the month total label sits. The legend keeps it first.
  const aiLegend: Series[] = d.ai.sources.map((s, i) => ({
    key: s,
    label: AI_LABEL[s] ?? s,
    colour: AI_COLOUR[i % AI_COLOUR.length],
  }));
  const aiSeries = [...aiLegend].reverse();

  return (
    <ScopeProvider>
      <HatchDefs />
      <div className="wrap">
        {/* Header */}
        <header className="hero">
          <div className="glow" aria-hidden="true" />
          <div className="kicker">Live companion to the SEO proposal</div>
          <h1>Lighting Hub · Search performance snapshot</h1>
          <div className="asof">
            Data as of {d.meta.asOf} · Source: {d.meta.source}
          </div>
          <div className="controls">
            <ScopeToggle />
            <ThemeToggle />
          </div>
        </header>

        <nav className="secnav" aria-label="Sections">
          {NAV.map(([id, label], i) => (
            <a key={id} href={`#${id}`}>
              <b>{i + 1}</b>
              {label}
            </a>
          ))}
        </nav>

        {/* 1. Summary */}
        <SummaryCards scopes={d.scopes} summary={d.summary} />

        {/* 2-3. Follow the Singapore / All countries toggle */}
        <GrowthSection scopes={d.scopes} />
        <ChannelsSection scopes={d.scopes} />

        {/* 4. Traffic quality */}
        <section className="card" id="quality">
          <Heading n={4} title="Traffic quality" scope="Singapore vs abroad" />
          <div className="takeaway">
            June and November spikes are bot-like traffic from abroad ({fmtPct(q.novOutsideEngagementPct)} to{" "}
            {fmtPct(q.junOutsideEngagementPct)} engaged). Filtering it out is part of month 1.
          </div>
          <div className="small muted">
            Typed-in / bookmark visits each month, split by where the visitor is. {q.note}
          </div>
          <MonthlyBars data={q.months} series={directSeries} keyLabels={[6, 11]} height={260} ariaLabel="Monthly direct visits, Singapore vs outside Singapore" />
          <Legend series={directSeries} />
          <div className="cols" style={{ marginTop: 12 }}>
            <div className="box red">
              <b>First half of November</b>
              <p className="small" style={{ margin: "4px 0 0" }}>
                {fmtInt(q.novOutside)} of {fmtInt(q.novTotal)} typed-in visits came from outside Singapore, and only{" "}
                {fmtPct(q.novOutsideEngagementPct)} of them engaged. Real shoppers usually engage far more often.
              </p>
            </div>
            <div className="box">
              <b>Top countries, 1 to 15 Nov (outside Singapore)</b>
              <p className="small" style={{ margin: "4px 0 0" }}>
                {q.novTopCountries.map((c) => `${c.country} ${fmtInt(c.sessions)}`).join(" · ")}
              </p>
            </div>
          </div>
          <p className="small muted" style={{ margin: "10px 0 0" }}>
            &quot;Engaged&quot; means the visit lasted over 10 seconds, viewed two or more pages, or led to an action. This is why trend
            charts default to Singapore only.
          </p>
        </section>

        {/* 5. Revenue tracking */}
        <section className="card" id="revenue">
          <Heading n={5} title="Revenue tracking" scope="All countries" />
          <div className="takeaway">GA4 can&apos;t show what the website sells today. Fixing this comes first.</div>
          <div className="small muted">
            These are the only purchases Google Analytics recorded since December 2025. They are a sign of broken tracking, not a
            measure of sales.
          </div>
          <div className="tablewrap">
            <table className="stack">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Came from</th>
                  <th>Device</th>
                  <th>Browser language</th>
                  <th>Landing page</th>
                  <th className="r">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {d.revenue.purchases.map((p, i) => (
                  <tr key={i}>
                    <td data-l="Month" style={{ whiteSpace: "nowrap" }}>{p.month}</td>
                    <td data-l="Came from">{p.source}</td>
                    <td data-l="Device">{p.device}</td>
                    <td data-l="Browser language">{p.language}</td>
                    <td data-l="Landing page" className="path">{p.landingPage}</td>
                    <td data-l="Revenue" className="r">{fmtMoney(p.revenue)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="no-label">
                    <b>Total recorded</b>
                  </td>
                  <td data-l="Total recorded" className="r">
                    <b>{fmtMoney(d.summary.recordedRevenue)}</b>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="cols" style={{ marginTop: 14 }}>
            <div className="box red">
              <b>What&apos;s wrong with the tracking</b>
              <ul className="clean small" style={{ marginTop: 6 }}>
                {d.revenue.issues.map((x) => (
                  <li key={x.issue}>
                    <b>{x.issue}.</b> {x.evidence}.
                  </li>
                ))}
                <li>
                  <b>Revenue figures disagree.</b> Item revenue adds up to {fmtMoney(d.revenue.itemsTotal)}, but purchases add up to{" "}
                  {fmtMoney(d.summary.recordedRevenue)}.
                </li>
                <li>
                  <b>Key events set up:</b> {d.revenue.keyEvents.join(", ")} only.
                </li>
              </ul>
            </div>
            <div className="box">
              <b>Products recorded as sold</b>
              <div className="tablewrap" style={{ marginTop: 4 }}>
                <table>
                  <tbody>
                    {d.revenue.items.map((it) => (
                      <tr key={it.item}>
                        <td>{it.item}</td>
                        <td className="r">{fmtMoney(it.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small muted" style={{ margin: "8px 0 0" }}>
                {d.revenue.itemsNote}
              </p>
            </div>
          </div>
          <p className="small muted" style={{ margin: "10px 0 0" }}>
            Currency shown as S$. Google Analytics didn&apos;t record a currency, so this is assumed, not verified.
          </p>
        </section>

        {/* 6. Top organic landing pages */}
        <section className="card" id="pages">
          <Heading n={6} title="Top organic landing pages" scope="All countries" />
          <div className="takeaway">
            The homepage carries {Math.round(lp.homepageSharePct)}% of search visits. New blog guides already bring visits, and cart, login and app pages
            shouldn&apos;t be landing pages at all.
          </div>
          <div className="small muted">
            The first page people see when they arrive from a search engine, Dec 2025 to Nov 2026. Homepage: {fmtInt(lp.homepageSessions)}{" "}
            visits ({fmtPct(lp.homepageSharePct)} of search visits).
          </div>
          <div className="sub">Search visits by page type (top 150 pages)</div>
          <ul className="hbars">
            {lp.byType.map((t) => (
              <li key={t.type}>
                <span>
                  <PageType type={t.type} />
                </span>
                <span className="v">{fmtInt(t.sessions)}</span>
                <span className="track">
                  <span
                    className="fill"
                    style={{
                      display: "block",
                      width: `${(t.sessions / maxType) * 100}%`,
                      background: t.type === "utility" || t.type === "not_set" ? "var(--red)" : t.type === "blog" ? "var(--green)" : undefined,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
          <div className="sub">Top 25 pages</div>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th className="hide-sm">#</th>
                  <th>Page</th>
                  <th className="hide-sm">Type</th>
                  <th className="r">Visits</th>
                  <th className="r">Engaged</th>
                </tr>
              </thead>
              <tbody>
                {lp.top.map((p, i) => (
                  <tr key={p.path}>
                    <td className="muted hide-sm">{i + 1}</td>
                    <td className="path">
                      {p.path}
                      <span className="show-sm" style={{ marginTop: 3 }}>
                        <PageType type={p.pageType} />
                      </span>
                    </td>
                    <td className="hide-sm">
                      <PageType type={p.pageType} />
                    </td>
                    <td className="r">{fmtInt(p.sessions)}</td>
                    <td className="r">{fmtPct(p.engagementPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ margin: "10px 0 0" }}>
            &quot;(not set)&quot; means Google Analytics lost track of the landing page. These visits are almost never engaged, which points
            to a tracking fault rather than real visitors.
          </p>
        </section>

        {/* 7. Devices */}
        <section className="card" id="devices">
          <Heading n={7} title="Devices" scope="All countries" />
          <div className="takeaway">Six in ten organic visits are on mobile.</div>
          <div className="small muted">
            Organic visits by device each month. Since December: mobile {fmtInt(d.devices.total.mobile)} ({fmtPct(d.devices.mobileSharePct)}),
            desktop {fmtInt(d.devices.total.desktop)}, tablet {fmtInt(d.devices.total.tablet)}.
          </div>
          <MonthlyBars data={d.devices.byMonth} series={deviceSeries} keyLabels={[10, 11]} ariaLabel="Monthly organic visits by device" />
          <Legend series={deviceSeries} />
        </section>

        {/* 8. AI assistants */}
        <section className="card" id="ai">
          <Heading n={8} title="AI assistants" scope="All countries" />
          <div className="takeaway">ChatGPT now sends ~190 visits a month. Small but growing fast.</div>
          <div className="small muted">
            Visits from AI assistants each month, by assistant. {fmtInt(d.summary.aiTotal)} since December, {fmtInt(d.summary.chatgptTotal)} of them
            from ChatGPT ({fmtPct(d.summary.chatgptSharePct)}). This counts every AI visit, so it is higher than the AI assistants channel in
            section 3.
          </div>
          <MonthlyBars data={d.ai.byMonth} series={aiSeries} keyLabels={[6, 10, 11]} ariaLabel="Monthly visits from AI assistants" />
          <Legend series={aiLegend} />
        </section>

        {/* 9. Site search */}
        <section className="card" id="search-terms">
          <Heading n={9} title="What shoppers search for on the site" scope="All countries" />
          <div className="takeaway">These are the products people come looking for, in their own words.</div>
          <div className="small muted">Top 30 terms typed into the website&apos;s search box, by number of visits.</div>
          <ul className="hbars two">
            {d.siteSearch.map((t) => (
              <li key={t.term}>
                <span>{t.term}</span>
                <span className="v">{fmtInt(t.sessions)}</span>
                <span className="track">
                  <span className="fill" style={{ display: "block", width: `${(t.sessions / maxTerm) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="cols">
          {/* 10. Chinese-speaking visitors */}
          <section className="card" id="chinese">
            <Heading n={10} title="Chinese-speaking visitors" scope="Singapore" />
            <div className="takeaway">About 9% of Singapore visitors browse in Chinese.</div>
            <div className="small muted">
              Visits by browser language. Chinese: {fmtInt(d.language.chineseTotal)} of {fmtInt(d.language.totalListed)} (
              {fmtPct(d.language.chineseSharePct)}).
            </div>
            <ul className="hbars">
              {d.language.rows.map((r) => (
                <li key={r.code}>
                  <span>
                    {r.label} <span className="muted small">{r.code}</span>
                  </span>
                  <span className="v">{fmtInt(r.sessions)}</span>
                  <span className="track">
                    <span
                      className="fill"
                      style={{ display: "block", width: `${(r.sessions / maxLang) * 100}%`, background: r.chinese ? "var(--amber)" : "var(--grey)" }}
                    />
                  </span>
                </li>
              ))}
            </ul>
            <p className="small muted" style={{ margin: "10px 0 0" }}>
              {d.language.purchasesFromZhCn} of the {d.summary.recordedPurchases} recorded purchases came from Chinese (Simplified) browsers. That
              sample is far too small to judge.
            </p>
          </section>

          {/* 11. Search Console placeholder */}
          <section className="card" id="search-console">
            <Heading n={11} title="Search Console" scope="Coming soon" />
            <div className="takeaway">Not connected yet.</div>
            <div className="placeholder">
              Queries, rankings and click-through rate will appear here once Search Console is connected.
            </div>
            <p className="small muted" style={{ margin: "10px 0 0" }}>
              Search Console is Google&apos;s free tool that shows which searches bring people to the site. Connecting it is part of month 1.
            </p>
          </section>
        </div>

        <footer className="foot">
          <p>
            Source: {d.meta.source} for {d.meta.site}, 1 Dec 2025 to 15 Nov 2026. November 2026 covers 1 to 15 November only and is
            marked * or hatched.
          </p>
          <p>
            Monthly figures use Singapore time. The landing page, device, language and source tables use UTC, so totals can differ by
            under 1%.
          </p>
          <p>Money is shown in S$. Google Analytics didn&apos;t record a currency, so this is assumed, not verified.</p>
          <p>
            <b>Prepared by Tommy for Pioneer Energy. Confidential.</b>
          </p>
        </footer>
      </div>
    </ScopeProvider>
  );
}
