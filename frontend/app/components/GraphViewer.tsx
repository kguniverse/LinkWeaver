'use client'
import React, { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'

interface GraphViewerProps {
  elements: cytoscape.ElementDefinition[]
}

export default function GraphViewer({ elements }: GraphViewerProps) {
  const cyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cyRef.current) {
      const cy = cytoscape({
        container: cyRef.current,
        elements,
        style: [
          { selector: 'node', style: { label: 'data(label)', 'background-color': '#60a5fa' } },
          { selector: 'edge', style: { label: 'data(label)', 'line-color': '#94a3b8', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#94a3b8' } },
        ],
        layout: { name: 'cose' }
      })
      return () => cy.destroy()
    }
  }, [elements])

  return <div className="w-full h-full" ref={cyRef} />
}