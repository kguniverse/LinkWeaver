import { NodeType, EdgeType } from "@/lib/graph-store";

// TODO: Change from mock data to real data
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
    // Find the node with the given ID
    const node = mockData.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    // Find all connections where this node is either the source or target
    const connections = mockData.relations.filter(
        (relation) => relation.source === nodeId || relation.target === nodeId
    );

    // Convert the node to the format expected by DisplayPanelProps
    const nodeInfo = {
        ...node,
        // Parse attrs if it's a string, or keep it as is if it's already an object
        attrs: typeof node.attrs === 'string' && node.attrs !== '{}'
            ? JSON.parse(node.attrs)
            : node.attrs
    };

    // Return the data in DisplayPanelProps format
    return {
        nodeInfo: nodeInfo,
        Connections: connections
    };
}