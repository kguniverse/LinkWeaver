"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { fetchGraphData, convertToCytoscape } from "@/lib/api";
import { ElementDefinition } from "cytoscape";
import {
  SidebarInset,
  SidebarProvider,
  Sidebar,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import Header from "@/components/header";
import SearchPanel from "@/components/SearchPanel";

const GraphViewer = dynamic(() => import("@/components/GraphViewer"), {
  ssr: false,
});

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
        <ResizablePanelGroup
          direction="horizontal"
          className="w-full h-full flex-1"
        >
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            className="p-4"
          >
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={40} minSize={20} maxSize={80}>
                <Card className="flex flex-col h-full">
                  <CardHeader>
                    <h3>Search Node</h3>
                  </CardHeader>
                  <CardContent>
                    <SearchPanel />
                  </CardContent>
                </Card>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={60} minSize={20} maxSize={80}>
                <Card className="flex flex-col h-full">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">
                      (Hold: Selected Object)
                    </h2>
                  </CardHeader>
                  <CardContent>{/* 选中菜单内容 */}</CardContent>
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle />
          {/* 中间图谱区 */}
          <ResizablePanel defaultSize={80} minSize={30} className="p-4">
            <Card className="w-full h-full">
              <CardContent className="w-full h-full">
                <GraphViewer />
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarInset>
    </SidebarProvider>
  );
}
