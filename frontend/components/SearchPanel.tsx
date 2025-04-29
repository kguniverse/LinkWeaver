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

export default function SearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const setSearchSelectedNodeId = useDashboardUI((s) => s.setSearchSelectedNodeId);
  const { data: allNodes = [] } = useAllNodes();

  const filtered = allNodes.filter((n) =>
    n.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  console.log("filtered", filtered);

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
            onSelect={() => {
              setSearchSelectedNodeId(node.id);
              setSearchQuery(node.label);
              const searchSelectedNodeId = useDashboardUI(
                (s) => s.searchSelectedNodeId
              );
              console.log("searchSelectedNodeId", searchSelectedNodeId);
            }}
          >
            {node.label}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
