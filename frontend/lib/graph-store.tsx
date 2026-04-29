import cytoscape from "cytoscape";
import { FirstSubgraph, type EntityExpansion, type EntityNode } from "@/services/node-service";

const FTM_SCHEMA_TO_DISPLAY: Record<string, string> = {
    Person: "Person",
    PublicBody: "Organization",
    LegalEntity: "Organization",
    Company: "Organization",
    Organization: "Organization",
};

function mapSchemaToType(schema: string): string {
    return FTM_SCHEMA_TO_DISPLAY[schema] ?? "Organization";
}

function entityToNode(e: EntityNode): NodeType {
    return {
        id: e.id,
        label: e.caption,
        type: mapSchemaToType(e.schema),
        attrs: {
            hit_class: e.hit_class,
            country: e.country,
            topics: e.topics,
            datasets: e.datasets,
            schema: e.schema,
        },
    };
}

export type NodeType = {
    id: string;
    label: string;
    type?: string;
    attrs?: Object;
}

export type EdgeType = {
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
                        id: node.id,
                        label: node.label,
                        type: node.type,
                        ...((node.attrs as Record<string, unknown>) ?? {}),
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

    initGraph(nodeID: string) {
        if (!this.cy) return;

        const { nodes, edges } = FirstSubgraph(nodeID);
        for (const node of nodes) {
            this.addNode(node);
        }
        for (const edge of edges) {
            this.addEdge(edge);
        }

        this.layoutGraph();
        this.cy.center(this.cy.getElementById(nodeID));
        this.cy.elements().unselect();
    }

    loadOneHop(expansion: EntityExpansion) {
        if (!this.cy) return;

        const centerNode = entityToNode(expansion.center);
        centerNode.attrs = { ...(centerNode.attrs as object), is_center: 1 };
        this.addNode(centerNode);

        for (const n of expansion.neighbors) {
            const neighborNode = entityToNode(n);
            neighborNode.attrs = { ...(neighborNode.attrs as object), is_center: 0 };
            this.addNode(neighborNode);
        }
        for (const e of expansion.edges) {
            this.addEdge({
                id: e.id,
                source: e.source,
                target: e.target,
                label: e.label,
            });
        }

        this.cy.layout({
            name: "concentric",
            concentric: (node: cytoscape.NodeSingular) => (node.data("is_center") ? 10 : 1),
            levelWidth: () => 1,
            minNodeSpacing: 110,
            spacingFactor: 1.5,
            fit: true,
            padding: 70,
            avoidOverlap: true,
            startAngle: -Math.PI / 2,
        } as cytoscape.LayoutOptions).run();

        const centerEl = this.cy.getElementById(expansion.center.id);
        if (centerEl && centerEl.length > 0) {
            this.cy.elements().unselect();
            centerEl.select();
        }
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

    expandNode(nodeId: string) {
        // lock existing nodes
        // this.cy?.elements().lock();
        const { nodes, edges } = FirstSubgraph(nodeId);
        for (const node of nodes) {
            this.addNode(node);
        }
        for (const edge of edges) {
            this.addEdge(edge);
        }
        this.layoutGraph();
        // this.cy?.elements().unlock();
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