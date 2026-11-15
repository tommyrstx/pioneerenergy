"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Scope } from "@/lib/types";

const ScopeContext = createContext<{ scope: Scope; setScope: (s: Scope) => void }>({
  scope: "sg",
  setScope: () => {},
});

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<Scope>("sg");
  return <ScopeContext.Provider value={{ scope, setScope }}>{children}</ScopeContext.Provider>;
}

export const useScope = () => useContext(ScopeContext);

export function ScopeToggle() {
  const { scope, setScope } = useScope();
  return (
    <div className="seg" role="group" aria-label="Country filter">
      <button type="button" aria-pressed={scope === "sg"} onClick={() => setScope("sg")}>
        Singapore only
      </button>
      <button type="button" aria-pressed={scope === "all"} onClick={() => setScope("all")}>
        All countries
      </button>
    </div>
  );
}

/** Small chip in a section heading saying which country filter applies. */
export function ScopeChip() {
  const { scope } = useScope();
  return <span className="scope">{scope === "sg" ? "Singapore" : "All countries"}</span>;
}
