import { ElementDefinition } from "cytoscape";
import cytoscape from "cytoscape";

type NodeType = {
    id: string;
    label: string;
    type?: string;
    attrs?: Object;
}

type EdgeType = {
    id?: string;
    source: string;
    target: string;
    label?: string;
    type?: string;
    attrs?: Object;
}

class GraphStore {
    private nodeMap: Map<string, NodeType>;
    private edgeMap: Map<string, EdgeType>;
    private adjacencyMap: Map<string, EdgeType[]>;
    private cy: cytoscape.Core | null = null;

    constructor() {
        this.nodeMap = new Map();
        this.edgeMap = new Map();
        this.adjacencyMap = new Map();
    }

    setCyInstance(cy: cytoscape.Core | null) {
        this.cy = cy;
    }

    addNode(node: NodeType) {
        if (!this.nodeMap.has(node.id)) {
            this.nodeMap.set(node.id, node);

            if (this.cy && this.cy.getElementById(node.id).length === 0) {
                this.cy.add({
                    group: "nodes",
                    data: {
                        ...node,
                    },
                });
            }
        }
    }

    addEdge(edge: EdgeType) {
        if (!edge.id) {
            edge.id = `${edge.source}-${edge.target}`;
        }
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

        console.log("edge", edge);
        if (this.cy && this.cy.getElementById(edge.id).length === 0) {
            this.cy.add({
                group: "edges",
                data: {
                    ...edge,
                },
            });
        }
    }

    removeNode(nodeId: string) {
        const relatedEdges = this.adjacencyMap.get(nodeId) || [];

        for (const edge of relatedEdges) {
            this.removeEdge(edge.id!);
        }

        this.nodeMap.delete(nodeId);
        this.adjacencyMap.delete(nodeId);

        this.cy?.getElementById(nodeId).remove();
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
        this.cy?.getElementById(edgeId).remove();
    }

    layoutGraph(options?: cytoscape.LayoutOptions) {
        if (!this.cy) return;
        //TODO: Add layout options
        this.cy.layout({
            name: "cose",
            // animate: true,
            // gravity: 0.25,
            // nodeRepulsion: () => 8500,
            ...options,
        }).run();
    }

    centerGraphOnNode(nodeId: string) {
        if (!this.cy) return;

        const node = this.cy.getElementById(nodeId);
        if (node && node.length > 0) {
            this.cy.elements().unselect();
            this.cy.center(node);
            node.select();
        }
    }

    getNodeById(nodeId: string): NodeType | undefined {
        return this.nodeMap.get(nodeId);
    }

    getNeighbors(nodeId: string): Array<Record<string, string>> {
        const edges = this.adjacencyMap.get(nodeId) || [];
        const neighbors = new Array<Record<string, string>>();

        for (const edge of edges) {
            const fromName = this.getNodeById(edge.source)?.label || "";
            const toName = this.getNodeById(edge.target)?.label || "";
            neighbors.push({
                id: edge.id ?? "",
                label: edge.label ? edge.label : "",
                type: edge.type ? edge.type : "",
                fromName,
                toName,
                source: edge.source,
                target: edge.target,
            });
        }

        return neighbors;
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
        this.cy?.elements().remove();
        this.cy?.reset();
    }
}

export const graphStore = new GraphStore();