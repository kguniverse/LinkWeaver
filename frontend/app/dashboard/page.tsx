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

import Header from "@/components/header";

export default function GraphPage() {
  const [elements, setElements] = useState<ElementDefinition[]>([]);

  useEffect(() => {
    async function loadGraph() {
      const data = await fetchGraphData("Alice");
      const cytoElements = convertToCytoscape(data);
      console.log("cytoElements", cytoElements);
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <GraphViewer elements={elements} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
