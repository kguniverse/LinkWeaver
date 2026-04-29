import { useQuery } from "@tanstack/react-query";
import { fetchEntityExpansion } from "@/services/node-service";

export function useEntityExpansion(entityId: string | null) {
    return useQuery({
        queryKey: ["entity-expansion", entityId],
        queryFn: () => fetchEntityExpansion(entityId!),
        enabled: !!entityId,
        staleTime: 1000 * 60 * 10,
    });
}
