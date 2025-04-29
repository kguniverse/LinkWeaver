type NodeType = {
    id: string;
    label: string;
    type?: string;
    attrs?: Object;
}

type EdgeType = {
    id: string;
    source: string;
    target: string;
    type?: string;
    attrs?: Object;
}

class GraphStore {
    nodeMap: Map<string, NodeType>;
    edgeMap: Map<string, EdgeType>;
    adjacencyMap: Map<string, EdgeType[]>;

    constructor() {
        this.nodeMap = new Map();
        this.edgeMap = new Map();
        this.adjacencyMap = new Map();
    }

    addNode(node: NodeType) {
        if (!this.nodeMap.has(node.id)) {
            this.nodeMap.set(node.id, node);
        }
    }

    addEdge(edge: EdgeType) {
        if (this.edgeMap.has(edge.id)) return;

        this.edgeMap.set(edge.id, edge);

        if (!this.adjacencyMap.has(edge.source)) {
            this.adjacencyMap.set(edge.source, []);
        }
        this.adjacencyMap.get(edge.source)!.push(edge);

        if (!this.adjacencyMap.has(edge.target)) {
            this.adjacencyMap.set(edge.target, []);
        }
        this.adjacencyMap.get(edge.target)!.push(edge);
    }

    removeNode(nodeId: string) {
        const relatedEdges = this.adjacencyMap.get(nodeId) || [];

        for (const edge of relatedEdges) {
            this.removeEdge(edge.id);
        }

        this.nodeMap.delete(nodeId);
        this.adjacencyMap.delete(nodeId);
    }

    removeEdge(edgeId: string) {
        const edge = this.edgeMap.get(edgeId);
        if (!edge) return;

        this.adjacencyMap.set(
            edge.source,
            (this.adjacencyMap.get(edge.source) || []).filter((e) => e.id !== edgeId)
        );
        this.adjacencyMap.set(
            edge.target,
            (this.adjacencyMap.get(edge.target) || []).filter((e) => e.id !== edgeId)
        );

        this.edgeMap.delete(edgeId);
    }

    getNeighbors(nodeId: string): NodeType[] {
        const edges = this.adjacencyMap.get(nodeId) || [];
        const neighborIds = new Set<string>();

        for (const edge of edges) {
            neighborIds.add(edge.source === nodeId ? edge.target : edge.source);
        }

        return Array.from(neighborIds)
            .map((id) => this.nodeMap.get(id))
            .filter((n): n is NodeType => !!n);
    }

    getFirstDegreeSubgraph(nodeId: string) {
        const edges = this.adjacencyMap.get(nodeId) || [];
        const neighborIds = new Set<string>();

        for (const edge of edges) {
            neighborIds.add(edge.source === nodeId ? edge.target : edge.source);
        }

        const nodes = [
            this.nodeMap.get(nodeId),
            ...Array.from(neighborIds).map((id) => this.nodeMap.get(id)),
        ].filter((n): n is NodeType => !!n);

        return { nodes, edges };
    }

    clear() {
        this.nodeMap.clear();
        this.edgeMap.clear();
        this.adjacencyMap.clear();
    }
}

export const graphStore = new GraphStore();