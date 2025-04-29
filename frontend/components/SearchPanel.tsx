import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandSeparator,
} from "@/components/ui/command";
import { useEffect, useState } from "react";
import { CommandItem } from "cmdk";
import { fetchGraphData } from "@/lib/api";

export default function SearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");

  const [elements, setElements] = useState<any>({});

  useEffect(() => {
    async function loadGraph() {
      const data = await fetchGraphData();
      console.log("data", data);
      setElements(data);
    }
    loadGraph();
  }, []);

  const { nodes, edges } = elements;
  console.log("edges", edges);
  console.log("elements", elements);
  console.log("nodes", nodes);

  const filteredData = nodes.filter(
    (item: any) =>
      item.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.data.attrs.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Command>
      <CommandInput
        placeholder="Search..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {filteredData.length === 0 ? (
          <CommandEmpty>No result found.</CommandEmpty>
        ) : (
          filteredData.map((item) => <CommandItem>item.label</CommandItem>)
        )}
      </CommandList>
    </Command>
  );
}
