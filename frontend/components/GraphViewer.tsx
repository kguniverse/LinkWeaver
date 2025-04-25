"use client";
import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

interface GraphViewerProps {
  elements: cytoscape.ElementDefinition[];
}

// Define the node styles based on the type
const nodeStyleMap: Record<string, any> = {
  Person: {
    shape: "ellipse",
    "background-color": "#60a5fa",
    width: "7px",
    height: "7px",
    "font-size": "6px",
  },
  Organization: {
    shape: "roundrectangle",
    "background-color": "#4ade80",
    width: "7px",
    height: "7px",
    "font-size": "6px",
  },
  BankAccount: {
    shape: "hexagon",
    "background-color": "#c084fc",
    width: "6px",
    height: "6px",
    "font-size": "6px",
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
        label: "data(label)",
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "line-color": "#aaa",
        "target-arrow-color": "#aaa",
        "arrow-scale": 0.25,
        width: 0.25,
        "font-size": "3px",
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

export default function GraphViewer({ elements }: GraphViewerProps) {
  const cyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cyRef.current) {
      console.error("Cytoscape container is null");
      return;
    }
    const cy = cytoscape({
      container: cyRef.current,
      elements,
      style: generateStyles(),
      layout: {
        name: "cose",
        gravity: 0.25,
        nodeRepulsion: () => 2048,
      },
    });

    cy.ready(() => {
      // cy.layout({ name: "cose-bilkent" }).run();
      cy.fit();
    });

    return () => cy.destroy();
  }, [elements]);
  console.log("elements", elements);
  console.log("cyRef.current", cyRef.current);

  return <div className="w-full h-full" ref={cyRef} />;
}
