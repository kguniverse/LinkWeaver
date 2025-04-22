'use client'
import React, { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'

interface GraphViewerProps {
  elements: cytoscape.ElementDefinition[]
}

// Define the node styles based on the type
const nodeStyleMap: Record<string, any> = {
  Person: { shape: 'ellipse', 'background-color': '#60a5fa' },
  Company: { shape: 'roundrectangle', 'background-color': '#4ade80' },
  BankAccount: { shape: 'hexagon', 'background-color': '#c084fc' },
}

// Define the edge styles based on the type
const edgeStyleMap: Record<string, any> = {
  Controls: { 'line-color': '#facc15', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#facc15' },
  Owns: { 'line-color': '#f87171', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#f87171' },
}


function generateStyles() {
  const styles: cytoscape.StylesheetStyle[] = [
    { selector: 'node', style: { label: 'data(label)', 'text-valign': 'center', 'text-halign': 'center' } },
    { selector: 'edge', style: { label: 'data(label)', 'curve-style': 'bezier', 'target-arrow-shape': 'triangle' } },
  ]

  for (const [type, style] of Object.entries(nodeStyleMap)) {
    styles.push({ selector: `node[type = "${type}"]`, style })
  }
  for (const [type, style] of Object.entries(edgeStyleMap)) {
    styles.push({ selector: `edge[type = "${type}"]`, style })
  }

  return styles
}

export default function GraphViewer({ elements }: GraphViewerProps) {
  const cyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cyRef.current) {
      const cy = cytoscape({
        container: cyRef.current,
        elements,
        style: generateStyles(),
        layout: { name: 'cose' }
      })
      return () => cy.destroy()
    }
  }, [elements])

  return <div className="w-full h-full" ref={cyRef} />
}