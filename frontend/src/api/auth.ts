import { useMutation } from "@tanstack/react-query";

// --- Configuration ---
const CONFIG = {
    useMock: true,
    mockDelay: 1500,
    validOtp: "123456",
    apiBaseUrl: import.meta.env.PUBLIC_API_URL || "/api",
} as const;

// --- Types ---
export interface RequestOtpRequest {
    email: string;
}

export interface RequestOtpResponse {
    success: boolean;
    message: string;
}

export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

export interface VerifyOtpResponse {
    success: boolean;
    token?: string;
    message?: string;
}

export interface ResendOtpRequest {
    email: string;
}

export interface ResendOtpResponse {
    success: boolean;
    message: string;
}

// --- Utilities ---
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function apiFetch<T>(
    endpoint: string,
    data: unknown,
    errorMessage: string,
): Promise<T> {
    const response = await fetch(`${CONFIG.apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || errorMessage);
    }

    return response.json();
}

// --- API Functions ---
async function requestOtp(
    data: RequestOtpRequest,
): Promise<RequestOtpResponse> {
    if (CONFIG.useMock) {
        await delay(CONFIG.mockDelay);
        if (!data.email.includes("@")) {
            throw new Error("Please enter a valid email address");
        }
        console.log(
            `[Mock] OTP sent to ${data.email}. Use OTP: ${CONFIG.validOtp}`,
        );
        return { success: true, message: "OTP sent successfully" };
    }

    return apiFetch("/auth/request-otp", data, "Failed to request OTP");
}

async function verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    if (CONFIG.useMock) {
        await delay(CONFIG.mockDelay);
        if (data.otp === CONFIG.validOtp) {
            return {
                success: true,
                token: `mock-jwt-token-${Date.now()}`,
                message: "Login successful",
            };
        }
        throw new Error("Invalid OTP. Please try again.");
    }

    return apiFetch("/auth/verify-otp", data, "Invalid OTP. Please try again.");
}

async function resendOtp(data: ResendOtpRequest): Promise<ResendOtpResponse> {
    if (CONFIG.useMock) {
        await delay(CONFIG.mockDelay);
        console.log(
            `[Mock] OTP resent to ${data.email}. Use OTP: ${CONFIG.validOtp}`,
        );
        return { success: true, message: "OTP resent successfully" };
    }

    return apiFetch("/auth/resend-otp", data, "Failed to resend OTP");
}

// --- Query Keys ---
export const authKeys = {
    all: ["auth"] as const,
    otp: () => [...authKeys.all, "otp"] as const,
};

// --- Hooks ---
export function useRequestOtp() {
    return useMutation({
        mutationFn: requestOtp,
        mutationKey: authKeys.otp(),
    });
}

export function useVerifyOtp() {
    return useMutation({
        mutationFn: verifyOtp,
        mutationKey: authKeys.otp(),
    });
}

export function useResendOtp() {
    return useMutation({
        mutationFn: resendOtp,
        mutationKey: authKeys.otp(),
    });
}
