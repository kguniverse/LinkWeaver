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

export default function SearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const setSearchSelectedNodeId = useDashboardUI((s) => s.setSearchSelectedNodeId);
  const { data: allNodes = [], isLoading } = useAllNodes();

  const filtered = allNodes.filter((n) =>
    n.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Command>
      <CommandInput
        placeholder="Search..."
        value={searchQuery}
        onValueChange={(v) => {
          setSearchQuery(v);
        }}
      />
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
