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
    private expandedIds: Set<string>;
    private cy: cytoscape.Core | null = null;

    constructor() {
        this.nodeMap = new Map();
        this.edgeMap = new Map();
        this.adjacencyMap = new Map();
        this.expandedIds = new Set();
    }

    hasExpanded(nodeId: string): boolean {
        return this.expandedIds.has(nodeId);
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
        // Collapse parallel edges between the same node pair (in either
        // direction) into a single visual edge. Yente often emits both
        // `spouse` and `family member` for the same pair, plus mirror
        // entries source→target and target→source — drawing all of those
        // turns dense neighborhoods into spaghetti.
        const [a, b] = [edge.source, edge.target].sort();
        const canonId = `${a}|${b}`;
        const existing = this.edgeMap.get(canonId);
        if (existing) {
            const newLabel = (edge.label || "").trim();
            if (newLabel) {
                const parts = (existing.label || "")
                    .split(" · ")
                    .map((p) => p.trim())
                    .filter(Boolean);
                if (!parts.includes(newLabel)) {
                    parts.push(newLabel);
                    existing.label = parts.join(" · ");
                    this.cy?.getElementById(canonId).data("label", existing.label);
                }
            }
            return;
        }

        edge.id = canonId;
        this.edgeMap.set(canonId, edge);

        if (!this.adjacencyMap.has(edge.source)) {
            this.adjacencyMap.set(edge.source, []);
        }
        this.adjacencyMap.get(edge.source)!.push(edge);

        if (!this.adjacencyMap.has(edge.target)) {
            this.adjacencyMap.set(edge.target, []);
        }
        this.adjacencyMap.get(edge.target)!.push(edge);

        if (this.cy && this.cy.getElementById(canonId).length === 0) {
            this.cy.add({
                group: "edges",
                data: {
                    ...edge,
                    id: canonId,
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

    // Merge a 1-hop expansion into the current graph. The first call lays out
    // from scratch; subsequent calls keep the prior layout fixed and only
    // arrange the newly-introduced neighbors so the user can weave a larger
    // graph step by step instead of resetting on every focus change.
    loadOneHop(expansion: EntityExpansion) {
        if (!this.cy) return;

        const isFirst = this.cy.elements().length === 0;
        const centerId = expansion.center.id;
        const newNodeIds: string[] = [];

        // Demote previously-marked centers — only the most recently expanded
        // node carries the is_center flag (and the larger style that comes
        // with it).
        this.cy.nodes('[is_center = 1]').forEach((n) => {
            n.data("is_center", 0);
        });

        if (!this.nodeMap.has(centerId)) newNodeIds.push(centerId);
        const centerNodeData = entityToNode(expansion.center);
        centerNodeData.attrs = { ...(centerNodeData.attrs as object), is_center: 1 };
        this.addNode(centerNodeData);
        const centerEl = this.cy.getElementById(centerId);
        // addNode() is a no-op for already-present nodes, so push is_center=1
        // directly onto the cytoscape element to cover that case too.
        centerEl.data("is_center", 1);

        for (const n of expansion.neighbors) {
            if (!this.nodeMap.has(n.id)) newNodeIds.push(n.id);
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

        this.expandedIds.add(centerId);
        centerEl.addClass("expanded");

        // Hide edge labels once the accumulated graph passes the legibility
        // threshold; show them again if the user has reset back to a small
        // graph.
        if (this.cy.edges().length > 25) {
            this.cy.edges().addClass("dense");
        } else {
            this.cy.edges().removeClass("dense");
        }

        // Scale layout pressure with graph size — sparse graphs stay airy,
        // dense ones spread further so the hairball loosens up.
        const totalNodes = this.cy.nodes().length;
        const repulsion = totalNodes > 30 ? 18000 : totalNodes > 15 ? 12000 : 8500;
        const idealEdge = totalNodes > 30 ? 160 : totalNodes > 15 ? 130 : 110;

        // A brand-new component is one where the freshly added center isn't
        // wired into any pre-existing node — typically when the user picks a
        // second unrelated search result. Drop it in empty space to the right
        // so it doesn't pile on top of the existing cluster.
        const preExistingIds = new Set<string>();
        this.cy.nodes().forEach((n) => {
            if (!newNodeIds.includes(n.id())) preExistingIds.add(n.id());
        });
        const centerWasNew = newNodeIds.includes(centerId);
        const connectsToExisting = expansion.edges.some((e) => {
            const other = e.source === centerId ? e.target : e.source;
            return preExistingIds.has(other);
        });
        const isDisconnectedComponent = centerWasNew && !connectsToExisting && preExistingIds.size > 0;

        if (isDisconnectedComponent) {
            const bb = this.cy.nodes()
                .filter((n) => preExistingIds.has(n.id()))
                .boundingBox({});
            centerEl.position({ x: bb.x2 + 280, y: (bb.y1 + bb.y2) / 2 });
        }

        if (isFirst) {
            this.cy.layout({
                name: "cose",
                animate: true,
                animationDuration: 400,
                randomize: true,
                fit: true,
                padding: 60,
                nodeRepulsion: () => repulsion,
                idealEdgeLength: () => idealEdge,
                gravity: 0.2,
            } as cytoscape.LayoutOptions).run();
        } else {
            // Seed new neighbors around the (possibly already-positioned)
            // center so the force layout starts from a reasonable shape.
            const centerPos = centerEl.position();
            const newNeighbors = newNodeIds.filter((id) => id !== centerId);
            const radius = 150 + Math.min(newNeighbors.length, 20) * 4;
            newNeighbors.forEach((id, i) => {
                const angle = (i / Math.max(newNeighbors.length, 1)) * Math.PI * 2;
                this.cy!.getElementById(id).position({
                    x: centerPos.x + Math.cos(angle) * radius,
                    y: centerPos.y + Math.sin(angle) * radius,
                });
            });

            // Lock everything that already had a position so the prior layout
            // stays put — only the freshly-added neighbors get to move.
            const existing = this.cy.nodes().filter(
                (n) => !newNodeIds.includes(n.id())
            );
            existing.lock();

            const layout = this.cy.layout({
                name: "cose",
                animate: true,
                animationDuration: 350,
                randomize: false,
                fit: false,
                nodeRepulsion: () => repulsion,
                idealEdgeLength: () => idealEdge,
                gravity: 0.15,
            } as cytoscape.LayoutOptions);

            layout.one("layoutstop", () => {
                existing.unlock();
                // When a new component is dropped in, the user almost always
                // wants to see it — gently re-fit. For tight in-place expansions
                // (a couple of new neighbors near the current focus) leave the
                // user's pan/zoom alone.
                if (isDisconnectedComponent && this.cy) {
                    this.cy.animate({
                        fit: { eles: this.cy.elements(), padding: 60 },
                        duration: 350,
                    });
                }
            });
            layout.run();
        }

        this.cy.elements().unselect();
        centerEl.select();
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
        this.expandedIds.clear();
        this.cy?.elements().remove();
        this.cy?.reset();
    }
}

export const graphStore = new GraphStore();