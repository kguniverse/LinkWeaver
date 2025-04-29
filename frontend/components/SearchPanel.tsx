import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

import { useEffect, useState } from "react";
import { useDashboardUI } from "@/hooks/use-dashboardUI";
import { useAllNodes } from "@/hooks/use-allNodes";

export default function SearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const setSelectedNodeId = useDashboardUI((s) => s.setSelectedNodeId);
  const { data: allNodes = [] } = useAllNodes();


  // const filtered = allNodes.filter((n) =>
  //   n.label.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  return (
    <Command>
      <CommandInput
        placeholder="Search..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No result found.</CommandEmpty>
        {/* {filtered.map((node) => (
          <CommandItem
            key={node.id}
            value={node.label}
            onSelect={() => {
              setSelectedNodeId(node.id);
              // setSearchQuery(""); // Optional: clear the search input after selection
            }}
          >
            {node.label}
          </CommandItem>
        ))} */}
      </CommandList>
    </Command>
  );
}
