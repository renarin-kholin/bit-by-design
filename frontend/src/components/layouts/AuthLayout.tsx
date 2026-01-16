import { type ReactNode, useRef, useEffect } from "react";
import gsap from "gsap";
import { AcmLogo, BitByDesignLogo } from "../logos";

interface AuthLayoutProps {
	children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
	const leftLogoRef = useRef<HTMLDivElement>(null);
	const rightLogoRef = useRef<HTMLDivElement>(null);
	const glowRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Staggered logo entrance
		const tl = gsap.timeline();

		tl.fromTo(
			leftLogoRef.current,
			{ opacity: 0, x: -20 },
			{ opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }
		);

		tl.fromTo(
			rightLogoRef.current,
			{ opacity: 0, x: 20 },
			{ opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
			"-=0.4"
		);

		// Subtle glow pulse animation
		if (glowRef.current) {
			gsap.to(glowRef.current, {
				opacity: 0.7,
				scale: 1.1,
				duration: 3,
				ease: "sine.inOut",
				repeat: -1,
				yoyo: true,
			});
		}
	}, []);

	return (
		<div className="bg-[#101010] min-h-screen w-full relative overflow-hidden">
			{/* Subtle gradient background */}
			<div className="absolute inset-0 bg-linear-to-brrom-[#101010] via-[#151515] to-[#101010] pointer-events-none" />

			{/* Subtle animated glow effect */}
			<div
				ref={glowRef}
				className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#cbff1f]/5 rounded-full blur-3xl pointer-events-none"
				style={{ opacity: 0.5 }}
			/>

			{/* Top left logo */}
			<div
				ref={leftLogoRef}
				className="absolute top-8 left-12"
				style={{ opacity: 0 }}
			>
				<AcmLogo />
			</div>

			{/* Top right logo */}
			<div
				ref={rightLogoRef}
				className="absolute top-8 right-12"
				style={{ opacity: 0 }}
			>
				<BitByDesignLogo />
			</div>

			{/* Centered content */}
			<div className="relative flex items-center justify-center min-h-screen px-4">
				{children}
			</div>
		</div>
	);
}
