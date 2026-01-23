import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

// --- Types ---
export interface SubmissionParams {
    figma_link: string;
    design_image: string;
    target_user_and_goal: string;
    layout_explanation: string;
    style_interpretation: string;
    key_trade_off: string;
    originality_confirmed: boolean;
    template_compliance_confirmed: boolean;
    future_improvements?: string;
}

export interface SubmissionResponse {
    id: number;
    user_id: number;
    figma_link: string;
    design_image: string;
    target_user_and_goal: string;
    layout_explanation: string;
    style_interpretation: string;
    key_trade_off: string;
    originality_confirmed: boolean;
    template_compliance_confirmed: boolean;
    future_improvements?: string;
    created_at: string;
    updated_at: string;
}

// --- API Functions ---
async function createSubmission(
    data: SubmissionParams,
): Promise<SubmissionResponse> {
    return apiFetch("/submissions", {
        method: "POST",
        data,
    });
}

async function updateSubmission(
    { id, data }: { id: number; data: SubmissionParams },
): Promise<SubmissionResponse> {
    return apiFetch(`/submissions/${id}`, {
        method: "PUT",
        data,
    });
}

async function checkMySubmission(): Promise<SubmissionResponse | null> {
    try {
        return await apiFetch("/submissions/mine", { method: "GET" });
    } catch {
        // If 404, returns null to indicate no submission
        return null;
    }
}

// --- Query Keys ---
export const subkeys = {
    all: ["submissions"] as const,
    mine: () => [...subkeys.all, "mine"] as const,
};

// --- Hooks ---
export function useCreateSubmission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createSubmission,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subkeys.mine() });
        },
    });
}

export function useUpdateSubmission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateSubmission,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subkeys.mine() });
        },
    });
}

export function useMySubmission() {
    return useQuery({
        queryKey: subkeys.mine(),
        queryFn: checkMySubmission,
        retry: false,
    });
}
