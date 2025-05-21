import {
    Table,
    TableCaption,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
    TableFooter
} from "@/components/ui/table";
import { useDashboardUI } from "@/hooks/use-dashboardUI";
import { graphStore } from "@/lib/graph-store";
import { Button } from "./ui/button";


export default function DisplayPanel() {
    const displayNodeId = useDashboardUI((s) => s.displayNodeId);

    const edges = displayNodeId ? graphStore.getNeighbors(displayNodeId) : undefined;
    console.log("edges", edges);

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-left">From</TableHead>
                        <TableHead className="text-left">To</TableHead>
                        <TableHead className="text-left">Label</TableHead>
                        <TableHead className="text-left">Type</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {edges &&
                        Array.from(edges).map((edge) => {
                            return (
                                <TableRow key={edge.id} onClick={() => { graphStore.centerGraphOnNode(edge.target) }}>
                                    <TableCell className="text-left">{edge.fromName}</TableCell>
                                    <TableCell className="text-left">{edge.toName}</TableCell>
                                    <TableCell className="text-left">{edge.label}</TableCell>
                                    <TableCell className="text-left">{edge.type}</TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>
            <Button onClick={() => {
                graphStore.expandNode(displayNodeId ? displayNodeId : "");
            }}>
                <span className="text-sm">Expand</span>
            </Button>
        </div>

    );
}