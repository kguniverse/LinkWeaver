import { NodeType, EdgeType } from "@/lib/graph-store";

const BACKEND_URL = "http://localhost:5001";

export type MatchHitClass = "restricted" | "informational" | "neutral";

export type EntityMatch = {
    id: string;
    caption: string;
    schema: string;
    datasets: string[];
    topics: string[];
    country: string | null;
    hit_class: MatchHitClass;
};

export async function matchEntity(name: string, limit = 10): Promise<EntityMatch[]> {
    if (!name.trim()) return [];
    const res = await fetch(`${BACKEND_URL}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, limit }),
    });
    if (!res.ok) {
        throw new Error(`match failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data.matches as EntityMatch[];
}

export type EntityNode = {
    id: string;
    caption: string;
    schema: string;
    datasets: string[];
    topics: string[];
    country: string | null;
    hit_class: MatchHitClass;
};

export type EntityEdge = {
    id: string;
    source: string;
    target: string;
    label: string;
};

export type EntityExpansion = {
    center: EntityNode;
    neighbors: EntityNode[];
    edges: EntityEdge[];
    total_neighbors: number;
};

export async function fetchEntityExpansion(id: string): Promise<EntityExpansion> {
    const res = await fetch(`${BACKEND_URL}/entity/${encodeURIComponent(id)}/expand`);
    if (!res.ok) {
        throw new Error(`expand failed: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as EntityExpansion;
}

// TODO: Change from mock data to real data — graph + display panels still use this
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
        {
            id: "4559", label: "Elon Musk", type: "Person", attrs: {
                tel: "123456789",
                email: "123@123"
            }
        },
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

export function fetchAllNodes() {
    //TODO: Change from mock data to real data
    // Only used in search panel
    return mockData.nodes;
}

export const FirstSubgraph = (nodeId: string) => {

    const centerNode = mockData.nodes.find((n) => n.id === nodeId);
    if (!centerNode) return { nodes: [], edges: [] };

    const connectedEdges = mockData.relations.filter(
        (e) => e.source === nodeId || e.target === nodeId
    );

    const neighborIds = new Set<string>();
    connectedEdges.forEach((edge) => {
        const neighborId = edge.source === nodeId ? edge.target : edge.source;
        neighborIds.add(neighborId);
    });

    const neighborNodes = mockData.nodes.filter((node) =>
        neighborIds.has(node.id)
    );

    return {
        nodes: [centerNode, ...neighborNodes],
        edges: connectedEdges
    };
}

export function fetchNodeInfo(nodeId: string) {
    const node = mockData.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const nameById = new Map(mockData.nodes.map((n) => [n.id, n.label]));

    const connections = mockData.relations
        .filter((r) => r.source === nodeId || r.target === nodeId)
        .map((r) => ({
            ...r,
            sourceName: nameById.get(r.source) ?? r.source,
            targetName: nameById.get(r.target) ?? r.target,
        }));

    const nodeInfo = {
        ...node,
        attrs: typeof node.attrs === 'string' && node.attrs !== '{}'
            ? JSON.parse(node.attrs)
            : node.attrs,
    };

    return {
        nodeInfo,
        Connections: connections,
    };
}