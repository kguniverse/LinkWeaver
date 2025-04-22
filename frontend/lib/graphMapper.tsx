import cytoscape from 'cytoscape'
import { GraphNode, GraphEdge } from './graphModel'

export function toCytoscapeElements(
  nodes: GraphNode[],
  edges: GraphEdge[]
): cytoscape.ElementDefinition[] {
  const nodeElements = nodes.map(node => ({
    data: {
      id: node.id,
      label: node.label,
      type: node.type,
      ...node.data
    }
  }))

  const edgeElements = edges.map(edge => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: edge.type,
      ...edge.data
    }
  }))

  return [...nodeElements, ...edgeElements]
}
