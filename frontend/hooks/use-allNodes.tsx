import { useQuery } from "@tanstack/react-query";
import { fetchAllNodes } from "@/services/node-service"

export function useAllNodes() {
    return useQuery({
        queryKey: ["nodes", "all"],
        queryFn: fetchAllNodes,
        staleTime: 1000 * 60 * 60,
    });
}