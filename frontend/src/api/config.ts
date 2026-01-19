import { useQuery } from "@tanstack/react-query";

// --- Configuration ---
const CONFIG = {
    useMock: false,
    mockDelay: 500,
    apiBaseUrl: import.meta.env.PUBLIC_API_URL || "",
} as const;

// --- Types ---
export interface CompetitionConfig {
    submission_start: string | null;
    submission_end: string | null;
    voting_start: string | null;
    voting_end: string | null;
}

/**
 * Competition states based on current time vs config dates
 */
export type CompetitionState =
    | "waiting_for_submissions" // Before submission_start
    | "submissions_open" // Between submission_start and submission_end
    | "voting_open" // Between voting_start and voting_end
    | "competition_over"; // After voting_end (show leaderboard)

export interface CompetitionStatus {
    state: CompetitionState;
    config: CompetitionConfig;
    countdown: {
        targetDate: string | null;
        label: string;
    };
}

// --- Utilities ---
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Mock Data ---
function getMockConfig(): CompetitionConfig {
    const now = Date.now();

    // For demo: submissions start in 11 hours
    return {
        submission_start: new Date(now + 11 * 60 * 60 * 1000).toISOString(),
        submission_end: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        voting_start: new Date(now + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days
        voting_end: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    };
}

// --- API Functions ---

/**
 * Fetch competition config
 * GET /api/config/
 */
async function fetchConfig(): Promise<CompetitionConfig> {
    if (CONFIG.useMock) {
        await delay(CONFIG.mockDelay);
        return getMockConfig();
    }

    const response = await fetch("/api/config", {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            error.message || error.error || "Failed to fetch config",
        );
    }

    return response.json();
}

/**
 * Determine competition state based on config and current time
 */
export function getCompetitionStatus(
    config: CompetitionConfig,
): CompetitionStatus {
    const now = new Date();

    const submissionStart = config.submission_start
        ? new Date(config.submission_start)
        : null;
    const submissionEnd = config.submission_end
        ? new Date(config.submission_end)
        : null;
    const votingStart = config.voting_start
        ? new Date(config.voting_start)
        : null;
    const votingEnd = config.voting_end ? new Date(config.voting_end) : null;

    // Determine state based on current time
    if (submissionStart && now < submissionStart) {
        return {
            state: "waiting_for_submissions",
            config,
            countdown: {
                targetDate: config.submission_start,
                label: "Submissions open in",
            },
        };
    }

    if (submissionEnd && now < submissionEnd) {
        return {
            state: "submissions_open",
            config,
            countdown: {
                targetDate: config.submission_end,
                label: "Submissions close in",
            },
        };
    }

    if (votingStart && now < votingStart) {
        // Between submission end and voting start
        return {
            state: "submissions_open", // Show as submissions closed, waiting for voting
            config,
            countdown: {
                targetDate: config.voting_start,
                label: "Voting begins in",
            },
        };
    }

    if (votingEnd && now < votingEnd) {
        return {
            state: "voting_open",
            config,
            countdown: {
                targetDate: config.voting_end,
                label: "Voting ends in",
            },
        };
    }

    // After voting_end
    return {
        state: "competition_over",
        config,
        countdown: {
            targetDate: null,
            label: "Competition ended",
        },
    };
}

// --- Query Keys ---
export const configKeys = {
    all: ["config"] as const,
    config: () => [...configKeys.all, "competition"] as const,
};

// --- Hooks ---

/**
 * Hook to fetch and cache competition config
 */
export function useCompetitionConfig() {
    return useQuery({
        queryKey: configKeys.config(),
        queryFn: fetchConfig,
        staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
        refetchOnWindowFocus: true,
    });
}
