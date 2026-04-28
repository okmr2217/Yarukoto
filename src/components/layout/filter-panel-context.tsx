"use client";

import { createContext, useContext, useState } from "react";

interface FilterPanelContextValue {
  filterPanelOpen: boolean;
  toggleFilterPanel: () => void;
}

const FilterPanelContext = createContext<FilterPanelContextValue | null>(null);

export function FilterPanelProvider({ children }: { children: React.ReactNode }) {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  return (
    <FilterPanelContext.Provider
      value={{
        filterPanelOpen,
        toggleFilterPanel: () => setFilterPanelOpen((v) => !v),
      }}
    >
      {children}
    </FilterPanelContext.Provider>
  );
}

export function useFilterPanel() {
  const ctx = useContext(FilterPanelContext);
  if (!ctx) throw new Error("useFilterPanel must be used within FilterPanelProvider");
  return ctx;
}
