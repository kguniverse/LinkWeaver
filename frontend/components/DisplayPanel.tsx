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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboardUI } from "@/hooks/use-dashboardUI";
import { graphStore } from "@/lib/graph-store";
import { Button } from "./ui/button";
import { EdgeType } from "@/lib/graph-store";
import { useEffect, useState } from "react";
import { fetchNodeInfo } from "@/services/node-service";

type DisplayPanelProps = {
    nodeInfo: {
        id: string;
        label: string;
        type?: string;
        attrs?: any;
    };
    Connections: EdgeType[]
}

export default function DisplayPanel() {
    const displayNodeId = useDashboardUI((s) => s.displayNodeId);
    const [displayInfo, setDisplayInfo] = useState<DisplayPanelProps | null>(null);

    useEffect(() => {
        if (displayNodeId) {
            // Fetch node information and set it to the state
            const nodeData = fetchNodeInfo(displayNodeId);
            if (nodeData) {
                setDisplayInfo(nodeData);
            }
        } else {
            setDisplayInfo(null);
        }
    }, [displayNodeId]);

    return (
        <div className="h-full flex flex-col">
            {displayInfo && (
                <>
                    <div className="mb-4">
                        <h3 className="text-lg font-medium">{displayInfo.nodeInfo.label}</h3>
                        <p className="text-sm text-gray-500">Type: {displayInfo.nodeInfo.type}</p>
                        {displayInfo.nodeInfo.attrs && Object.keys(displayInfo.nodeInfo.attrs).length > 0 && (
                            <div className="mt-2">
                                <h4 className="text-sm font-medium">Attributes:</h4>
                                <ScrollArea className="h-[100px]">
                                    {Object.entries(displayInfo.nodeInfo.attrs).map(([key, value]) => (
                                        <div key={key} className="text-sm py-1">
                                            <span className="font-medium">{key}:</span> {String(value)}
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col">
                        <h4 className="text-md font-medium mb-2">Connections</h4>
                        <ScrollArea className="flex-1 border rounded">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-left">Source</TableHead>
                                        <TableHead className="text-left">Target</TableHead>
                                        <TableHead className="text-left">Label</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayInfo.Connections.map((edge, index) => (
                                        <TableRow
                                            key={index}
                                            onClick={() => {
                                                const targetId = edge.target === displayNodeId ? edge.source : edge.target;
                                                graphStore.centerGraphOnNode(targetId);
                                            }}
                                            className="cursor-pointer hover:bg-gray-100"
                                        >
                                            <TableCell className="text-left">{edge.source}</TableCell>
                                            <TableCell className="text-left">{edge.target}</TableCell>
                                            <TableCell className="text-left">{edge.label || "无标签"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </>
            )}

            {displayNodeId && (
                <Button
                    onClick={() => { graphStore.expandNode(displayNodeId) }}
                    className="mt-4 self-start"
                >
                    <span className="text-sm">Expand</span>
                </Button>
            )}
        </div>
    );
}