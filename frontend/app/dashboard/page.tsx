"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
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
import DisplayPanel from "@/components/DisplayPanel";
import AddNodePopover from "@/components/AddNodePopover";

const GraphViewer = dynamic(() => import("@/components/GraphViewer"), {
  ssr: false,
});

export default function GraphPage() {
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  return (
    <SidebarProvider defaultOpen={false}>
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
            defaultSize={25}
            minSize={15}
            maxSize={40}
            className="p-4"
          >
            <Card className="flex flex-col h-full">
              <CardHeader>
                <h2 className="text-lg font-semibold">
                  Search Nodes
                </h2>
              </CardHeader>
              <CardContent>
                <SearchPanel />
              </CardContent>
            </Card>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={80} minSize={30} className="p-4">
            <Card className="w-full h-full">
              <CardContent className="w-full h-full">
                <GraphViewer />
              </CardContent>
            </Card>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={25}
            minSize={15}
            maxSize={40}
            className="p-4"
          >
            <Card className="flex flex-col h-full">
              <AddNodePopover />
              <CardHeader>
                <h2 className="text-lg font-semibold">
                  Node Details
                </h2>
              </CardHeader>
              <CardContent>
                <DisplayPanel />
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarInset>
    </SidebarProvider>
  );
}
