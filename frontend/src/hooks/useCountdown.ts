import { useQuery } from "@tanstack/react-query";
import {
    type CompetitionState,
    type CompetitionStatus,
    getCompetitionStatus,
    useCompetitionConfig,
} from "../api";

interface CountdownTime {
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
}

function calculateTimeRemaining(targetDate: string | null): CountdownTime {
    if (!targetDate) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, isExpired: false };
}

export const countdownKeys = {
    time: ["countdown", "time"] as const,
};

export interface UseCountdownResult {
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    isLoading: boolean;
    state: CompetitionState;
    status: CompetitionStatus | null;
    label: string;
}

export function useCountdown(): UseCountdownResult {
    // Fetch competition config
    const { data: config, isLoading: configLoading } = useCompetitionConfig();

    // Compute competition status from config
    const status = config ? getCompetitionStatus(config) : null;
    const targetDate = status?.countdown.targetDate ?? null;

    // Update countdown every second
    const { data: time } = useQuery({
        queryKey: [...countdownKeys.time, targetDate],
        queryFn: () => calculateTimeRemaining(targetDate),
        enabled: !!targetDate,
        refetchInterval: 1000,
        staleTime: 0,
    });

    return {
        hours: time?.hours ?? 0,
        minutes: time?.minutes ?? 0,
        seconds: time?.seconds ?? 0,
        isExpired: time?.isExpired ?? !targetDate,
        isLoading: configLoading,
        state: status?.state ?? "waiting_for_submissions",
        status,
        label: status?.countdown.label ?? "Loading...",
    };
}
