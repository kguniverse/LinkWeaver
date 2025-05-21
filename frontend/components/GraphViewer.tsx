"use client";
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import cytoscape from "cytoscape";
import { graphStore } from "@/lib/graph-store";
import { useDashboardUI } from "@/hooks/use-dashboardUI";

// Define the node styles based on the type
const nodeStyleMap: Record<string, any> = {
  Person: {
    shape: "ellipse",
    "background-color": "#60a5fa",
    width: "7px",
    height: "7px",
    "font-size": "3px",
  },
  Organization: {
    shape: "roundrectangle",
    "background-color": "#4ade80",
    width: "7px",
    height: "7px",
    "font-size": "3px",
  },
  BankAccount: {
    shape: "hexagon",
    "background-color": "#c084fc",
    width: "6px",
    height: "6px",
    "font-size": "3px",
  },
};

// Define the edge styles based on the type
const edgeStyleMap: Record<string, any> = {
  Controls: {
    "line-color": "#facc15",
    "target-arrow-shape": "triangle",
    "target-arrow-color": "#facc15",
    width: 2,
  },
  Owns: {
    "line-color": "#f87171",
    "target-arrow-shape": "triangle",
    "target-arrow-color": "#f87171",
    width: 2,
  },
};

function generateStyles() {
  const styles: cytoscape.StylesheetStyle[] = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "text-valign": "bottom",
        "text-halign": "center",
        "font-size": "8px",
        "background-color": "#ddd",
      },
    },
    {
      selector: "edge",
      style: {
        label: "",
        'text-opacity': 0,
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "line-color": "#aaa",
        "target-arrow-color": "#aaa",
        "arrow-scale": 0.25,
        width: 0.25,
        "font-size": "3px",
      },
    },
    {
      selector: 'node:active',
      style: {
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'node:grabbed',
      style: {
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 0.8,
        'border-color': '#999999',
        'overlay-opacity': 0,
        'background-opacity': 1,
        'z-index': 9999
      }
    },
    {
      selector: 'edge:active',
      style: {
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'overlay-opacity': 0,
      },
    },
  ];

  for (const [type, style] of Object.entries(nodeStyleMap)) {
    styles.push({ selector: `node[type = "${type}"]`, style });
  }
  for (const [type, style] of Object.entries(edgeStyleMap)) {
    styles.push({ selector: `edge[type = "${type}"]`, style });
  }

  return styles;
}

export default function GraphViewer() {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);
  const setDisplayNodeId = useDashboardUI((s) => s.setDisplayNodeId);

  useEffect(() => {
    if (!cyRef.current) {
      console.error("Cytoscape container is null");
      return;
    }
    const cy = cytoscape({
      container: cyRef.current,
      elements: [],
      style: generateStyles(),
      layout: {
        name: "cose",
        animate: true,
        gravity: 0.25,
        nodeRepulsion: () => 8500,
      },
    });

    graphStore.setCyInstance(cy);

    cy.on('mouseover', 'edge', function (evt) {
      const edge = evt.target;
      edge.style({
        'label': edge.data('label'),
        'text-opacity': 1
      });
    });

    cy.on('mouseout', 'edge', function (evt) {
      const edge = evt.target;
      edge.style({
        'label': '',
        'text-opacity': 0
      });
    });

    cy.on('click', 'node', function (evt) {
      const node = evt.target;
      setDisplayNodeId(node.id());
    });

    cy.ready(() => {
      cy.fit();
    });

    cyInstance.current = cy;

    return () => {
      cy.destroy();
      graphStore.setCyInstance(null);
    }
  }, []);

  const handleFit = () => {
    if (cyInstance.current) {
      cyInstance.current.fit();
    }
  };

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full" ref={cyRef} />
      <Button onClick={handleFit} className="absolute bottom-4 right-4 z-10">
        Recenter
      </Button>
    </div>
  );
}
