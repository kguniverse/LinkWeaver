"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { fetchGraphData, convertToCytoscape } from "@/lib/api";
import { ElementDefinition } from "cytoscape";
const GraphViewer = dynamic(() => import("@/components/GraphViewer"), {
  ssr: false,
});
import {
  SidebarInset,
  SidebarProvider,
  Sidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Header from "@/components/header";
import SearchPanel from "@/components/SearchPanel";

export default function GraphPage() {
  const [elements, setElements] = useState<ElementDefinition[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  useEffect(() => {
    async function loadGraph() {
      const data = await fetchGraphData();
      const cytoElements = convertToCytoscape(data);
      setElements(cytoElements);
    }
    loadGraph();
  }, []);

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <h1 className="text-2xl font-bold">LinkWeaver Sidebar</h1>
      </Sidebar>
      <SidebarInset>
        <Header />
        <div className="flex flex-row w-full h-full">
          <div className="w-0 flex-grow-[1] flex flex-col p-4">
            <Card className="flex flex-col flex-1">
              <CardHeader>
                <h3>
                  Search Node
                </h3>
              </CardHeader>
              <CardContent>
                <SearchPanel />
              </CardContent>
            </Card>

            <Card className="flex flex-col flex-1">
              <CardHeader>
                <h2 className="text-lg font-semibold">
                  (Hold: Selected Object)
                </h2>
              </CardHeader>
              <CardContent>{/* 选中菜单内容 */}</CardContent>
            </Card>
          </div>

          <div className="w-0 flex-grow-[3] flex flex-col p-4">
            <Card className="w-full h-full">
              <CardContent className="w-full h-full">
                <GraphViewer />
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>

  );
}
