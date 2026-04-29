"use client";
import dynamic from "next/dynamic";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import Header from "@/components/header";
import SearchPanel from "@/components/SearchPanel";
import DisplayPanel from "@/components/DisplayPanel";

const GraphViewer = dynamic(() => import("@/components/GraphViewer"), {
  ssr: false,
});

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1"
      >
        <ResizablePanel defaultSize={24} minSize={18} maxSize={35}>
          <Pane title="Search">
            <SearchPanel />
          </Pane>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={52} minSize={30}>
          <div className="h-full p-4">
            <div className="h-full bg-white border rounded-lg overflow-hidden">
              <GraphViewer />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={24} minSize={18} maxSize={35}>
          <Pane title="Entity Details">
            <DisplayPanel />
          </Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function Pane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col p-4 gap-3">
      <h2 className="text-[11px] uppercase tracking-wide text-slate-500 font-medium px-1">
        {title}
      </h2>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
