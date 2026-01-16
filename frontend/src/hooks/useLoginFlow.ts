import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useRequestOtp, useResendOtp, useVerifyOtp } from "../api";

export type LoginStep = "email" | "otp";

export interface UseLoginFlowOptions {
    onStepChange?: (step: LoginStep) => void;
    onSuccess?: (token: string) => void;
}

export function useLoginFlow(options: UseLoginFlowOptions = {}) {
    const navigate = useNavigate();
    const [step, setStep] = useState<LoginStep>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    const requestOtpMutation = useRequestOtp();
    const verifyOtpMutation = useVerifyOtp();
    const resendOtpMutation = useResendOtp();

    // Derived state from mutations
    const isRequestingOtp = requestOtpMutation.isPending;
    const isVerifyingOtp = verifyOtpMutation.isPending;
    const isResendingOtp = resendOtpMutation.isPending;
    const isLoading = isRequestingOtp || isVerifyingOtp;

    // Error state - prefer mutation errors
    const error = requestOtpMutation.error?.message ||
        verifyOtpMutation.error?.message ||
        resendOtpMutation.error?.message ||
        null;

    // Resend success state
    const resendSuccess = resendOtpMutation.isSuccess;

    const changeStep = useCallback(
        (newStep: LoginStep) => {
            setStep(newStep);
            options.onStepChange?.(newStep);
        },
        [options],
    );

    const requestOtp = useCallback(async () => {
        requestOtpMutation.reset();
        verifyOtpMutation.reset();

        try {
            await requestOtpMutation.mutateAsync({ email });
            changeStep("otp");
            return true;
        } catch {
            return false;
        }
    }, [email, requestOtpMutation, verifyOtpMutation, changeStep]);

    const verifyOtp = useCallback(async () => {
        verifyOtpMutation.reset();

        try {
            const result = await verifyOtpMutation.mutateAsync({ email, otp });
            if (result.token) {
                localStorage.setItem("auth_token", result.token);
                options.onSuccess?.(result.token);
                return result.token;
            }
            return null;
        } catch {
            return null;
        }
    }, [email, otp, verifyOtpMutation, options]);

    const resendOtp = useCallback(async () => {
        resendOtpMutation.reset();
        verifyOtpMutation.reset();
        setOtp("");

        try {
            await resendOtpMutation.mutateAsync({ email });
            return true;
        } catch {
            return false;
        }
    }, [email, resendOtpMutation, verifyOtpMutation]);

    const goBackToEmail = useCallback(() => {
        requestOtpMutation.reset();
        verifyOtpMutation.reset();
        resendOtpMutation.reset();
        setOtp("");
        changeStep("email");
    }, [requestOtpMutation, verifyOtpMutation, resendOtpMutation, changeStep]);

    const clearError = useCallback(() => {
        requestOtpMutation.reset();
        verifyOtpMutation.reset();
        resendOtpMutation.reset();
    }, [requestOtpMutation, verifyOtpMutation, resendOtpMutation]);

    const clearResendSuccess = useCallback(() => {
        resendOtpMutation.reset();
    }, [resendOtpMutation]);

    const updateEmail = useCallback(
        (value: string) => {
            setEmail(value);
            if (requestOtpMutation.isError) {
                requestOtpMutation.reset();
            }
        },
        [requestOtpMutation],
    );

    const updateOtp = useCallback(
        (value: string) => {
            // Only allow digits
            const sanitized = value.replace(/\D/g, "");
            setOtp(sanitized);
            if (verifyOtpMutation.isError) {
                verifyOtpMutation.reset();
            }
        },
        [verifyOtpMutation],
    );

    return {
        // State
        step,
        email,
        otp,
        error,
        resendSuccess,

        // Loading states
        isLoading,
        isRequestingOtp,
        isVerifyingOtp,
        isResendingOtp,

        // Actions
        updateEmail,
        updateOtp,
        requestOtp,
        verifyOtp,
        resendOtp,
        goBackToEmail,
        clearError,
        clearResendSuccess,

        // For animation coordination
        hasError: !!error,
    };
}
