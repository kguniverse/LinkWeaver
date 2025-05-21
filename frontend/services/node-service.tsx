import { graphStore } from "@/lib/graph-store";

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
    return mockData.nodes;
}

export const loadAndExpand = async (nodeId: string) => {
    // TODO: Change from mock data to real data
    // const res = await fetch(`/api/graph?id=${nodeId}`);
    // const { node, edges } = await res.json();

    const node = mockData.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Add the central node to the graph
    graphStore.addNode(node);

    // Step 1: Get all directly connected edges
    const directEdges = mockData.relations.filter(
        (e) => e.source === nodeId || e.target === nodeId
    );

    // Step 2: Track neighbor IDs
    const neighborIds = new Set<string>();
    for (const edge of directEdges) {
        const neighborId = edge.source === nodeId ? edge.target : edge.source;
        neighborIds.add(neighborId);

        const neighbor = mockData.nodes.find((n) => n.id === neighborId);
        if (!neighbor) continue;

        graphStore.addNode(neighbor);
        graphStore.addEdge(edge);
    }

    // Step 3: Add internal edges between neighbors (including nodeId)
    const closureIds = new Set<string>(neighborIds);
    closureIds.add(nodeId); // include the central node

    for (const edge of mockData.relations) {
        const { source, target } = edge;
        if (
            closureIds.has(source) &&
            closureIds.has(target)
        ) {
            graphStore.addEdge(edge);
        }
    }

    // Step 4: Re-layout the graph after update
    graphStore.layoutGraph();
};

export const FirstSubgraph = (nodeId: string) => {
    // 查找中心节点
    const centerNode = mockData.nodes.find((n) => n.id === nodeId);
    if (!centerNode) return { nodes: [], edges: [] };

    // 找出所有与该节点直接相连的边
    const connectedEdges = mockData.relations.filter(
        (e) => e.source === nodeId || e.target === nodeId
    );

    // 收集所有相邻节点的ID
    const neighborIds = new Set<string>();
    connectedEdges.forEach((edge) => {
        const neighborId = edge.source === nodeId ? edge.target : edge.source;
        neighborIds.add(neighborId);
    });

    // 获取所有相邻节点
    const neighborNodes = mockData.nodes.filter((node) =>
        neighborIds.has(node.id)
    );

    // 返回包含中心节点、相邻节点和连接边的子图
    return {
        nodes: [centerNode, ...neighborNodes],
        edges: connectedEdges
    };
}