import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { matchEntity } from "@/services/node-service";

export function useMatchEntity(query: string) {
    const trimmed = query.trim();
    return useQuery({
        queryKey: ["match", trimmed],
        queryFn: () => matchEntity(trimmed),
        enabled: trimmed.length >= 3,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
    });
}
