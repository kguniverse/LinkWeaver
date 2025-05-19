import {
    Table,
    TableCaption,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
    TableFooter
} from "./ui/table";
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDashboardUI } from "@/hooks/use-dashboardUI";
import { graphStore } from "@/lib/graph-store";

export default function DisplayPanel() {
    const displayNodeId = useDashboardUI((s) => s.displayNodeId);

    const edges = displayNodeId ? graphStore.getNeighbors(displayNodeId) : undefined;
    console.log("edges", edges);

    return (
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
                            <TableRow key={edge.id}>
                                <TableCell className="text-left">{edge.fromName}</TableCell>
                                <TableCell className="text-left">{edge.toName}</TableCell>
                                <TableCell className="text-left">{edge.label}</TableCell>
                                <TableCell className="text-left">{edge.type}</TableCell>
                            </TableRow>
                        );
                    })}
            </TableBody>
        </Table>
    );
}