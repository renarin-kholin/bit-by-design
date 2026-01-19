import { useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import gsap from "gsap";
import { AuthButton, CountdownTimer, CountdownLabels } from "../components/ui";
import { useCountdown } from "../hooks";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const { hours, minutes, seconds, isLoading, state, label, isExpired } =
		useCountdown();

	const contentRef = useRef<HTMLDivElement>(null);
	const timerRef = useRef<HTMLDivElement>(null);
	const labelsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const tl = gsap.timeline();

		tl.fromTo(
			contentRef.current,
			{ opacity: 0, y: 20 },
			{ opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
		);

		tl.fromTo(
			timerRef.current,
			{ opacity: 0, scale: 0.95 },
			{ opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
			"-=0.3",
		);

		tl.fromTo(
			labelsRef.current,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.4, ease: "power2.out" },
			"-=0.2",
		);
	}, []);

	// Show leaderboard when competition is over
	if (state === "competition_over" && !isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen px-4">
				<div className="absolute top-6 sm:top-[60px] left-1/2 -translate-x-1/2 z-10">
					<AuthButton />
				</div>
				<div ref={contentRef} className="text-center" style={{ opacity: 0 }}>
					<p className="font-['Figtree',sans-serif] font-normal text-xl sm:text-2xl md:text-[32px] text-white mb-4 sm:mb-6">
						Competition has ended!
					</p>
					<p className="font-['Figtree',sans-serif] text-lg text-white/70">
						Leaderboard coming soon...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen px-4">
			{/* Auth button - positioned at top center */}
			<div className="absolute top-6 sm:top-[60px] left-1/2 -translate-x-1/2 z-10">
				<AuthButton />
			</div>

			{/* Main content */}
			<div ref={contentRef} className="text-center" style={{ opacity: 0 }}>
				<p className="font-['Figtree',sans-serif] font-normal text-xl sm:text-2xl md:text-[32px] text-white mb-4 sm:mb-6">
					{label}
				</p>

				<CountdownTimer
					ref={timerRef}
					hours={hours}
					minutes={minutes}
					seconds={seconds}
					isLoading={isLoading}
					style={{ opacity: 0 }}
				/>

				<CountdownLabels ref={labelsRef} style={{ opacity: 0 }} />
			</div>
		</div>
	);
}
