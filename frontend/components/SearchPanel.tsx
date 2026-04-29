"use client";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";

import { useState, useDeferredValue } from "react";
import { useMatchEntity } from "@/hooks/use-matchEntity";
import type { EntityMatch, MatchHitClass } from "@/services/node-service";
import { X } from "lucide-react";

const HIT_CLASS_BADGE: Record<MatchHitClass, { label: string; className: string } | null> = {
  restricted: {
    label: "Hit",
    className: "bg-red-100 text-red-700 border border-red-300",
  },
  informational: {
    label: "Mention",
    className: "bg-gray-100 text-gray-600 border border-gray-300",
  },
  neutral: null,
};

function HitBadge({ hitClass }: { hitClass: MatchHitClass }) {
  const cfg = HIT_CLASS_BADGE[hitClass];
  if (!cfg) return null;
  return (
    <span className={`inline-block text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function DatasetSummary({ datasets }: { datasets: string[] }) {
  if (datasets.length === 0) return null;
  const head = datasets.slice(0, 2).join(", ");
  const more = datasets.length > 2 ? ` +${datasets.length - 2}` : "";
  return (
    <span className="text-[11px] text-muted-foreground truncate">
      {head}
      {more}
    </span>
  );
}

export default function SearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const { data: matches = [], isLoading, isError } = useMatchEntity(deferredQuery);

  const clearSearch = () => setSearchQuery("");

  return (
    <Command shouldFilter={false}>
      <div className="relative">
        <CommandInput
          placeholder="Search a person or organization..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <CommandList>
        {searchQuery.trim().length < 2 && (
          <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
        )}
        {searchQuery.trim().length >= 2 && isLoading && (
          <CommandEmpty>Searching…</CommandEmpty>
        )}
        {isError && (
          <CommandEmpty>Search failed. Is the backend running on :5001?</CommandEmpty>
        )}
        {!isLoading && !isError && searchQuery.trim().length >= 2 && matches.length === 0 && (
          <CommandEmpty>No match found.</CommandEmpty>
        )}
        {matches.map((m: EntityMatch) => (
          <CommandItem
            key={m.id}
            value={`${m.caption} ${m.id}`}
            onSelect={() => setSearchQuery(m.caption)}
            className="flex flex-col items-start gap-0.5"
          >
            <div className="flex items-center gap-2 w-full">
              <span className="font-medium truncate flex-1">{m.caption}</span>
              <HitBadge hitClass={m.hit_class} />
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {m.score.toFixed(2)}
              </span>
            </div>
            <DatasetSummary datasets={m.datasets} />
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
