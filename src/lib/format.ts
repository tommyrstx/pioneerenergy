// Number formatting used across the dashboard (en-GB, thousands separators,
// 1 decimal place for percentages, "S$" for money).

export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-GB");

export const fmtPct = (n: number) =>
  `${n.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export const fmtMoney = (n: number) =>
  `S$${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtX = (n: number) => `${n.toLocaleString("en-GB", { maximumFractionDigits: 1 })}x`;

export const fmtDec = (n: number) =>
  n.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
