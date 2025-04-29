// This file contains the mock implementation of the fetchGraphData function.

import { mock } from "node:test";

// FIXME: This is a mock implementation. You should replace it with the actual API call to fetch graph data.
export async function fetchGraphData(name?: string): Promise<any> {
  const mockData = {
    nodes: [
      { id: "8753", label: "Neuralink", type: "Organization", attrs: "{}" },
      { id: "4363", label: "SpaceX", type: "Organization", attrs: "{}" },
      { id: "3532", label: "Pretoria", type: "Organization", attrs: "{}" },
      {
        id: "9584",
        label: "The Boring Company",
        type: "Organization",
        attrs: "{}",
      },
      {
        id: "3509",
        label: "University of Pretoria",
        type: "Organization",
        attrs: "{}",
      },
      {
        id: "2580",
        label: "Stanford University",
        type: "Organization",
        attrs: "{}",
      },
      { id: "5542", label: "Jeff Bezos", type: "Person", attrs: "{}" },
      {
        id: "9452",
        label: "University of Pennsylvania",
        type: "Organization",
        attrs: "{}",
      },
      { id: "8606", label: "Kimbal Musk", type: "Person", attrs: "{}" },
      { id: "7415", label: "Tesla, Inc.", type: "Organization", attrs: "{}" },
      { id: "4559", label: "Elon Musk", type: "Person", attrs: "{}" },
    ],
    relations: [
      { source: "4559", target: "8753", label: "", attrs: "{}" },
      { source: "7415", target: "4559", label: "owned by", attrs: "{}" },
      { source: "4559", target: "9452", label: "residence", attrs: "{}" },
      { source: "4559", target: "7415", label: "owned by", attrs: "{}" },
      { source: "9584", target: "7415", label: "owned by", attrs: "{}" },
      { source: "4559", target: "8606", label: "sibling", attrs: "{}" },
      { source: "9452", target: "4559", label: "residence", attrs: "{}" },
      { source: "9584", target: "8753", label: "subsidiary", attrs: "{}" },
      { source: "4559", target: "3509", label: "work location", attrs: "{}" },
      { source: "9584", target: "4559", label: "owned by", attrs: "{}" },
      { source: "8606", target: "4559", label: "sibling", attrs: "{}" },
      { source: "8753", target: "4559", label: "owned by", attrs: "{}" },
      { source: "4559", target: "9584", label: "owned by", attrs: "{}" },
      { source: "4559", target: "9452", label: "work location", attrs: "{}" },
    ],
  };

  return mockData;
}
export function convertToCytoscape(data: any): cytoscape.ElementDefinition[] {
  const elements: cytoscape.ElementDefinition[] = [];
  const { nodes, relations } = data;

  const entityMap: { [key: string]: cytoscape.ElementDefinition } = {};
  nodes.forEach((entity: any) => {
    const { id, label, type, attrs } = entity;
    const element: cytoscape.ElementDefinition = {
      data: {
        id: id,
        label: label,
        type: type,
        attrs: JSON.parse(attrs),
      },
    };
    elements.push(element);
    entityMap[id] = element;
  });

  relations.forEach((relation: any) => {
    const { source, target, label, attrs } = relation;
    const sourceElement = entityMap[source];
    const targetElement = entityMap[target];

    if (sourceElement && targetElement) {
      const edge: cytoscape.ElementDefinition = {
        data: {
          id: `${source}-${target}`,
          source: source,
          target: target,
          label: label,
          attrs: JSON.parse(attrs),
        },
      };
      elements.push(edge);
    }
  });

  return elements;
}
