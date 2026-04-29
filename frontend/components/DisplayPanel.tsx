"use client";

import { useState } from "react";
import { useDashboardUI } from "@/hooks/use-dashboardUI";
import { useEntityExpansion } from "@/hooks/use-entityExpansion";
import { graphStore } from "@/lib/graph-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HitBadge, TopicChip, DatasetChip } from "@/components/badges";
import { countryName } from "@/lib/labels";
import { ArrowLeft, ArrowRight, ChevronRight, Info, Network } from "lucide-react";

const DATASET_COLLAPSE_THRESHOLD = 6;

export default function DisplayPanel() {
  const displayNodeId = useDashboardUI((s) => s.displayNodeId);
  const searchSelectedNodeId = useDashboardUI((s) => s.searchSelectedNodeId);
  const setSearchSelectedNodeId = useDashboardUI((s) => s.setSearchSelectedNodeId);
  const setDisplayNodeId = useDashboardUI((s) => s.setDisplayNodeId);
  const goBack = useDashboardUI((s) => s.goBack);
  const goForward = useDashboardUI((s) => s.goForward);
  const pastIds = useDashboardUI((s) => s.pastIds);
  const futureIds = useDashboardUI((s) => s.futureIds);
  const [showAllDatasets, setShowAllDatasets] = useState(false);

  const { data: expansion, isLoading, isError } = useEntityExpansion(displayNodeId);

  const canGoBack = pastIds.length > 0;
  const canGoForward = futureIds.length > 0;

  const NavBar = (
    <div className="flex items-center gap-1 mb-3">
      <Button
        onClick={goBack}
        disabled={!canGoBack}
        size="icon"
        variant="ghost"
        className="size-7"
        title="Back"
      >
        <ArrowLeft className="size-3.5" />
      </Button>
      <Button
        onClick={goForward}
        disabled={!canGoForward}
        size="icon"
        variant="ghost"
        className="size-7"
        title="Forward"
      >
        <ArrowRight className="size-3.5" />
      </Button>
    </div>
  );

  if (!displayNodeId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 text-slate-400">
        <Info className="size-8 mb-2" strokeWidth={1.5} />
        <p className="text-sm">Select an entity to see its details.</p>
        <p className="text-xs text-slate-400 mt-1">
          Click a node in the graph or pick a search result.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {NavBar}
        <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
          Loading…
        </div>
      </div>
    );
  }

  if (isError || !expansion) {
    return (
      <div className="h-full flex flex-col">
        {NavBar}
        <div className="flex-1 flex items-center justify-center text-sm text-red-600">
          Failed to load entity details.
        </div>
      </div>
    );
  }

  const e = expansion.center;
  const country = countryName(e.country);
  const isCenter = displayNodeId === searchSelectedNodeId;

  const handleConnectionClick = (neighborId: string) => {
    setDisplayNodeId(neighborId);
    graphStore.centerGraphOnNode(neighborId);
  };

  const handleExpand = () => {
    setSearchSelectedNodeId(displayNodeId);
  };

  return (
    <div className="h-full flex flex-col">
      {NavBar}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-5 pr-1">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold leading-tight">{e.caption}</h2>
              <HitBadge hitClass={e.hit_class} size="md" />
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span>{e.schema}</span>
              {country && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{country}</span>
                </>
              )}
            </div>
          </div>

          {!isCenter && (
            <Button
              onClick={handleExpand}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Network className="size-3.5" />
              Expand network around this entity
            </Button>
          )}

          {e.topics.length > 0 && (
            <Section title="Risk topics">
              <div className="flex flex-wrap gap-1.5">
                {e.topics.map((t) => (
                  <TopicChip key={t} topic={t} />
                ))}
              </div>
            </Section>
          )}

          {e.datasets.length > 0 && (
            <Section title={`Appears in ${e.datasets.length} source${e.datasets.length === 1 ? "" : "s"}`}>
              <div className="flex flex-wrap gap-1.5">
                {(showAllDatasets || e.datasets.length <= DATASET_COLLAPSE_THRESHOLD
                  ? e.datasets
                  : e.datasets.slice(0, DATASET_COLLAPSE_THRESHOLD)
                ).map((d) => (
                  <DatasetChip key={d} slug={d} />
                ))}
                {e.datasets.length > DATASET_COLLAPSE_THRESHOLD && (
                  <button
                    onClick={() => setShowAllDatasets((v) => !v)}
                    className="text-xs px-2 py-0.5 rounded border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 transition"
                  >
                    {showAllDatasets
                      ? "Show fewer"
                      : `+${e.datasets.length - DATASET_COLLAPSE_THRESHOLD} more`}
                  </button>
                )}
              </div>
            </Section>
          )}

          {expansion.neighbors.length > 0 && (
            <Section
              title={
                expansion.total_neighbors > expansion.neighbors.length
                  ? `Connections (showing ${expansion.neighbors.length} of ${expansion.total_neighbors})`
                  : `Connections (${expansion.neighbors.length})`
              }
            >
              <ul className="space-y-1.5">
                {expansion.edges.map((edge) => {
                  const neighborId = edge.source === e.id ? edge.target : edge.source;
                  const neighbor = expansion.neighbors.find((n) => n.id === neighborId);
                  if (!neighbor) return null;
                  return (
                    <li
                      key={edge.id}
                      onClick={() => handleConnectionClick(neighbor.id)}
                      className="group cursor-pointer rounded border px-2.5 py-1.5 hover:bg-sky-50 hover:border-sky-200 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-snug flex-1">
                          {neighbor.caption}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <HitBadge hitClass={neighbor.hit_class} />
                          <ChevronRight className="size-3 text-slate-300 group-hover:text-sky-600 transition" />
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {edge.label}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wide text-slate-500 font-medium mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
