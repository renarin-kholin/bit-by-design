import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";

interface UseLoginAnimationsOptions {
    onTransitionComplete?: () => void;
}

export function useLoginAnimations(options: UseLoginAnimationsOptions = {}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);
    const otpInputRef = useRef<HTMLInputElement>(null);
    const messageRef = useRef<HTMLDivElement>(null);

    const animateOtpFormIn = useCallback(() => {
        if (!containerRef.current) return;

        requestAnimationFrame(() => {
            const otpElements = containerRef.current?.querySelectorAll(
                ".otp-animate",
            );
            if (otpElements && otpElements.length > 0) {
                gsap.fromTo(
                    otpElements,
                    { opacity: 0, y: 12 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.35,
                        stagger: 0.06,
                        ease: "power2.out",
                        onComplete: () => {
                            otpInputRef.current?.focus();
                        },
                    },
                );
            }
        });
    }, []);

    const animateMessageIn = useCallback(() => {
        if (!messageRef.current) return;
        gsap.fromTo(
            messageRef.current,
            { opacity: 0, y: -5 },
            { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" },
        );
    }, []);

    const animateMessageOut = useCallback((onComplete?: () => void) => {
        if (!messageRef.current) {
            onComplete?.();
            return;
        }
        gsap.to(messageRef.current, {
            opacity: 0,
            y: -5,
            duration: 0.2,
            ease: "power2.in",
            onComplete,
        });
    }, []);

    const transitionToOtp = useCallback(
        (onStepChange: () => void) => {
            if (!formContainerRef.current) {
                onStepChange();
                return;
            }

            const tl = gsap.timeline();

            tl.to(formContainerRef.current, {
                opacity: 0,
                y: -8,
                duration: 0.18,
                ease: "power2.in",
            });

            tl.call(() => {
                onStepChange();
            });

            tl.set(formContainerRef.current, { opacity: 1, y: 0 });

            tl.call(() => {
                animateOtpFormIn();
            });
        },
        [animateOtpFormIn],
    );

    const transitionToEmail = useCallback((onStepChange: () => void) => {
        if (!formContainerRef.current) {
            onStepChange();
            return;
        }

        const tl = gsap.timeline();

        tl.to(formContainerRef.current, {
            opacity: 0,
            y: 8,
            duration: 0.18,
            ease: "power2.in",
        });

        tl.call(onStepChange);

        tl.to(formContainerRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.25,
            ease: "power2.out",
        });
    }, []);

    const animateSuccessExit = useCallback(
        (onComplete: () => void) => {
            if (!containerRef.current) {
                onComplete();
                return;
            }

            gsap.to(containerRef.current, {
                opacity: 0,
                scale: 0.98,
                duration: 0.2,
                ease: "power2.in",
                onComplete,
            });
        },
        [],
    );

    return {
        // Refs to attach to elements
        containerRef,
        formContainerRef,
        otpInputRef,
        messageRef,

        // Animation functions
        animateOtpFormIn,
        animateMessageIn,
        animateMessageOut,
        transitionToOtp,
        transitionToEmail,
        animateSuccessExit,
    };
}
