"use client";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";

import { useEffect, useState, useDeferredValue } from "react";
import { useMatchEntity } from "@/hooks/use-matchEntity";
import type { EntityMatch } from "@/services/node-service";
import { useDashboardUI } from "@/hooks/use-dashboardUI";
import { HitBadge } from "@/components/badges";
import { countryName } from "@/lib/labels";
import { X } from "lucide-react";

const MIN_QUERY_LENGTH = 3;

export default function SearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(searchQuery);
  const { data: matches = [], isFetching, isError } = useMatchEntity(deferredQuery);
  const setDisplayNodeId = useDashboardUI((s) => s.setDisplayNodeId);
  const setSearchSelectedNodeId = useDashboardUI((s) => s.setSearchSelectedNodeId);
  const searchSelectedNodeId = useDashboardUI((s) => s.searchSelectedNodeId);

  const trimmedLen = searchQuery.trim().length;
  const showResults = trimmedLen >= MIN_QUERY_LENGTH;
  // Once the user picks a match, collapse the result list until they edit again.
  const justPicked = pickedId !== null && trimmedLen > 0;
  const showList = showResults && !justPicked;

  const clearSearch = () => {
    setSearchQuery("");
    setPickedId(null);
  };

  const handleSelect = (match: EntityMatch) => {
    setSearchSelectedNodeId(match.id);
    setDisplayNodeId(match.id);
    setSearchQuery(match.caption);
    setPickedId(match.id);
  };

  const handleQueryChange = (v: string) => {
    setSearchQuery(v);
    if (pickedId !== null) setPickedId(null);
  };

  // Cmd/Ctrl+K focuses the search input from anywhere in the dashboard.
  // Esc clears the current query when the input is focused.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          '[data-slot="command-input"]'
        );
        input?.focus();
        input?.select();
      }
      if (e.key === "Escape") {
        const input = document.querySelector<HTMLInputElement>(
          '[data-slot="command-input"]'
        );
        if (document.activeElement === input && input?.value) {
          e.preventDefault();
          clearSearch();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Command shouldFilter={false} className="border rounded-md">
      <div className="relative">
        <CommandInput
          placeholder="Search entities (min 3 chars)…"
          value={searchQuery}
          onValueChange={handleQueryChange}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery ? (
            <button
              onClick={clearSearch}
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Clear search"
              title="Clear (Esc)"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 rounded border bg-slate-50 text-slate-400 text-[10px] font-mono leading-none">
              ⌘K
            </kbd>
          )}
        </div>
        {isFetching && showResults && (
          <div className="absolute left-0 right-0 -bottom-px h-0.5 bg-sky-400/70 animate-pulse" />
        )}
      </div>

      <CommandList className="max-h-[calc(100vh-220px)]">
        {trimmedLen > 0 && trimmedLen < MIN_QUERY_LENGTH && (
          <CommandEmpty>Type at least {MIN_QUERY_LENGTH} characters to search.</CommandEmpty>
        )}
        {isError && (
          <CommandEmpty>Search failed. Is the backend running on :5001?</CommandEmpty>
        )}
        {showList && !isError && !isFetching && matches.length === 0 && (
          <CommandEmpty>No entities matched “{searchQuery.trim()}”.</CommandEmpty>
        )}
        {showList && matches.map((m: EntityMatch) => {
          const country = countryName(m.country);
          const isSelected = searchSelectedNodeId === m.id;
          return (
            <CommandItem
              key={m.id}
              value={`${m.caption} ${m.id}`}
              onSelect={() => handleSelect(m)}
              className={`flex flex-col items-start gap-0.5 cursor-pointer ${
                isSelected ? "bg-sky-50 data-[selected=true]:bg-sky-100" : ""
              }`}
            >
              <div className="flex items-center gap-2 w-full min-w-0">
                <span className="font-medium truncate flex-1">{m.caption}</span>
                <HitBadge hitClass={m.hit_class} />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0 w-full">
                <span>{m.schema}</span>
                {country && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="truncate">{country}</span>
                  </>
                )}
                <span className="text-slate-300">·</span>
                <span className="shrink-0">
                  {m.datasets.length} source{m.datasets.length === 1 ? "" : "s"}
                </span>
              </div>
            </CommandItem>
          );
        })}
      </CommandList>
    </Command>
  );
}
