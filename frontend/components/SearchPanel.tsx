import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";

import { useEffect, useState, useRef } from "react";
import { useDashboardUI } from "@/hooks/use-dashboardUI";
import { useAllNodes } from "@/hooks/use-allNodes";
import { graphStore } from "@/lib/graph-store";
import { loadAndExpand } from "@/services/node-service";
import { X } from "lucide-react";

export default function SearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const setSearchSelectedNodeId = useDashboardUI((s) => s.setSearchSelectedNodeId);
  const setDisplayNodeId = useDashboardUI((s) => s.setDisplayNodeId);
  const { data: allNodes = [], isLoading } = useAllNodes();

  const filtered = allNodes.filter((n) =>
    n.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Command>
      <div className="relative">
        <CommandInput
          placeholder="Search..."
          value={searchQuery}
          onValueChange={(v) => {
            setSearchQuery(v);
          }}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <CommandList>
        <CommandEmpty>No result found.</CommandEmpty>
        {filtered.map((node) => (
          <CommandItem
            key={node.id}
            value={node.label}
            onSelect={async () => {
              graphStore.clear();
              setSearchSelectedNodeId(node.id);
              setSearchQuery(node.label);
              setDisplayNodeId(node.id);
              await loadAndExpand(node.id);
            }}
          >
            {node.label}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
