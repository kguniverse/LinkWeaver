import { Table } from "./ui/table";
import { useDashboardUI } from "@/hooks/use-dashboardUI";
import { graphStore } from "@/lib/graph-store";

export default function DisplayPanel() {
    const displayNodeId = useDashboardUI((s) => s.displayNodeId);

    const node = displayNodeId ? graphStore.getNodeById(displayNodeId) : undefined;
}