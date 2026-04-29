"use client";
import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { graphStore } from "@/lib/graph-store";
import { useDashboardUI } from "@/hooks/use-dashboardUI";
import { useEntityExpansion } from "@/hooks/use-entityExpansion";
import { Search, ZoomIn, ZoomOut, Maximize2, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";

const HIT_COLORS = {
  restricted: { fill: "#fecaca", border: "#b91c1c", label: "#7f1d1d" },
  informational: { fill: "#fde68a", border: "#a16207", label: "#78350f" },
  neutral: { fill: "#e2e8f0", border: "#64748b", label: "#0f172a" },
} as const;

function generateStyles(): cytoscape.StylesheetStyle[] {
  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: HIT_COLORS.neutral.label,
        "text-valign": "bottom",
        "text-halign": "center",
        "text-margin-y": 8,
        "font-size": "11px",
        "font-weight": 500,
        "background-color": HIT_COLORS.neutral.fill,
        "border-color": HIT_COLORS.neutral.border,
        "border-width": 2,
        width: 32,
        height: 32,
        "text-wrap": "wrap",
        "text-max-width": "160px",
        "transition-property": "border-width, width, height",
        "transition-duration": 150,
      },
    },
    {
      selector: 'node[is_center = 1]',
      style: {
        width: 44,
        height: 44,
        "border-width": 3,
        "font-weight": 600,
      },
    },
    {
      selector: 'node[schema = "Person"]',
      style: { shape: "ellipse" },
    },
    {
      selector: 'node[schema != "Person"]',
      style: { shape: "round-rectangle" },
    },
    {
      selector: 'node[hit_class = "restricted"]',
      style: {
        "background-color": HIT_COLORS.restricted.fill,
        "border-color": HIT_COLORS.restricted.border,
        color: HIT_COLORS.restricted.label,
      },
    },
    {
      selector: 'node[hit_class = "informational"]',
      style: {
        "background-color": HIT_COLORS.informational.fill,
        "border-color": HIT_COLORS.informational.border,
        color: HIT_COLORS.informational.label,
      },
    },
    {
      selector: "node:selected",
      style: {
        "border-width": 3.5,
        "border-color": "#0284c7",
        "z-index": 9999,
      },
    },
    {
      selector: "node.cy-hover",
      style: {
        "border-width": 3,
        "z-index": 9998,
      },
    },
    {
      selector: "edge",
      style: {
        label: "data(label)",
        "font-size": "8px",
        color: "#94a3b8",
        "text-rotation": "autorotate",
        "text-background-color": "#ffffff",
        "text-background-opacity": 0.85,
        "text-background-padding": "1px",
        "text-opacity": 0.75,
        "curve-style": "straight",
        "target-arrow-shape": "triangle",
        "line-color": "#e2e8f0",
        "target-arrow-color": "#e2e8f0",
        "arrow-scale": 0.8,
        width: 1,
        opacity: 0.7,
      },
    },
    {
      selector: "edge:hover",
      style: {
        "line-color": "#475569",
        "target-arrow-color": "#475569",
        color: "#1e293b",
        "text-opacity": 1,
        opacity: 1,
        width: 1.6,
      },
    },
    {
      selector: "edge.dense",
      style: {
        "text-opacity": 0,
      },
    },
    {
      selector: "edge.dense:hover",
      style: {
        "text-opacity": 1,
      },
    },
  ];
}

interface HoverInfo {
  label: string;
  schema: string;
  hitClass: "restricted" | "informational" | "neutral";
  x: number;
  y: number;
}

export default function GraphViewer() {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);
  const setDisplayNodeId = useDashboardUI((s) => s.setDisplayNodeId);
  const setSearchSelectedNodeId = useDashboardUI((s) => s.setSearchSelectedNodeId);
  const searchSelectedNodeId = useDashboardUI((s) => s.searchSelectedNodeId);
  const displayNodeId = useDashboardUI((s) => s.displayNodeId);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const { data: expansion, isFetching, isError } = useEntityExpansion(searchSelectedNodeId);

  // Bootstrap Cytoscape once.
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cytoscape({
      container: cyRef.current,
      elements: [],
      style: generateStyles(),
      layout: { name: "cose" },
      wheelSensitivity: 0.2,
      maxZoom: 1.6,
      minZoom: 0.2,
    });
    graphStore.setCyInstance(cy);

    cy.on("click", "node", (evt) => {
      setDisplayNodeId(evt.target.id());
    });

    cy.on("dblclick", "node", (evt) => {
      const id = evt.target.id();
      setSearchSelectedNodeId(id);
      setDisplayNodeId(id);
    });

    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      node.addClass("cy-hover");
      const pos = node.renderedPosition();
      setHover({
        label: node.data("label"),
        schema: node.data("schema") ?? "",
        hitClass: (node.data("hit_class") as HoverInfo["hitClass"]) ?? "neutral",
        x: pos.x,
        y: pos.y,
      });
    });

    cy.on("mouseout", "node", (evt) => {
      evt.target.removeClass("cy-hover");
      setHover(null);
    });

    cy.on("pan zoom", () => setHover(null));

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        cy.elements().unselect();
      }
    });

    cyInstance.current = cy;

    return () => {
      cy.destroy();
      graphStore.setCyInstance(null);
    };
  }, [setDisplayNodeId, setSearchSelectedNodeId]);

  // Replace the graph whenever a new entity expansion arrives.
  useEffect(() => {
    if (expansion) {
      graphStore.clear();
      graphStore.loadOneHop(expansion);
    }
  }, [expansion]);

  // Keep the graph selection in sync with the focused entity (e.g. when DisplayPanel
  // navigates without re-expanding, or when the user uses the back/forward history).
  useEffect(() => {
    const cy = cyInstance.current;
    if (!cy || !displayNodeId) return;
    const node = cy.getElementById(displayNodeId);
    if (node && node.length > 0 && !node.selected()) {
      cy.elements().unselect();
      node.select();
    }
  }, [displayNodeId, expansion]);

  const handleFit = () => cyInstance.current?.fit(undefined, 40);
  const handleZoomIn = () => cyInstance.current?.zoom({ level: cyInstance.current.zoom() * 1.25, position: cyInstance.current.pan() });
  const handleZoomOut = () => cyInstance.current?.zoom({ level: cyInstance.current.zoom() * 0.8, position: cyInstance.current.pan() });

  const showEmpty = !searchSelectedNodeId && !expansion;
  const showLoading = isFetching && searchSelectedNodeId;

  const hoverBorder =
    hover?.hitClass === "restricted"
      ? "border-red-300"
      : hover?.hitClass === "informational"
        ? "border-amber-300"
        : "border-slate-200";

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full" ref={cyRef} />

      {hover && (
        <div
          className={`absolute pointer-events-none bg-white/95 backdrop-blur border ${hoverBorder} rounded-md px-2 py-1 shadow-md text-xs leading-tight max-w-[220px] z-20`}
          style={{
            left: hover.x + 18,
            top: hover.y + 18,
          }}
        >
          <div className="font-medium text-slate-900 truncate">{hover.label}</div>
          {hover.schema && <div className="text-[10px] text-slate-500">{hover.schema}</div>}
        </div>
      )}

      {showEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <Search className="size-10 text-slate-300 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-slate-500 font-medium">
            Search a person or organization to start
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try “Harbin Institute of Technology” or “Tsinghua University”
          </p>
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
            Press <kbd className="px-1.5 py-0.5 rounded border bg-slate-50 text-slate-500 text-[10px] font-mono">⌘K</kbd> to focus search
          </p>
        </div>
      )}

      {showLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border rounded-md px-3 py-1.5 text-xs text-slate-600 shadow-sm">
          Loading entity…
        </div>
      )}

      {isError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 rounded-md px-3 py-1.5 text-xs text-red-700 shadow-sm">
          Failed to load entity. Is the backend running?
        </div>
      )}

      {expansion && !showEmpty && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border rounded-md px-2.5 py-1.5 text-[11px] text-slate-500 shadow-sm flex items-center gap-1.5">
          <MousePointerClick className="size-3" />
          <span>Click to inspect · double-click to expand</span>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-white/95 backdrop-blur border rounded-md p-1 shadow-sm">
        <Button onClick={handleZoomIn} size="icon" variant="ghost" className="size-8" title="Zoom in">
          <ZoomIn className="size-4" />
        </Button>
        <Button onClick={handleZoomOut} size="icon" variant="ghost" className="size-8" title="Zoom out">
          <ZoomOut className="size-4" />
        </Button>
        <Button onClick={handleFit} size="icon" variant="ghost" className="size-8" title="Fit to view">
          <Maximize2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
