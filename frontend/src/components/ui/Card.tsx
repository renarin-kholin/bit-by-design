import { useRef, useEffect, useLayoutEffect } from "react";
import gsap from "gsap";

interface CardProps {
	children: React.ReactNode;
	className?: string;
	animate?: boolean;
}

export function Card({ children, className = "", animate = true }: CardProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const isFirstRender = useRef(true);

	// Entrance animation
	useEffect(() => {
		if (!animate || !cardRef.current) return;

		gsap.fromTo(
			cardRef.current,
			{ opacity: 0, scale: 0.95, y: 10 },
			{ opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" }
		);
	}, [animate]);

	// Smooth height animation on content change
	useLayoutEffect(() => {
		if (!cardRef.current || !contentRef.current) return;

		const contentHeight = contentRef.current.scrollHeight;
		const newHeight = contentHeight + 48; // p-6 = 24px * 2

		if (isFirstRender.current) {
			// Set initial height without animation
			gsap.set(cardRef.current, { height: newHeight });
			isFirstRender.current = false;
			return;
		}

		// Animate to new height
		gsap.to(cardRef.current, {
			height: newHeight,
			duration: 0.35,
			ease: "power2.inOut",
		});
	}, [children]);

	// ResizeObserver for dynamic content changes
	useEffect(() => {
		if (!contentRef.current || !cardRef.current) return;

		const card = cardRef.current;
		const resizeObserver = new ResizeObserver(() => {
			if (isFirstRender.current) return;

			const contentHeight = contentRef.current?.scrollHeight ?? 0;
			const newHeight = contentHeight + 48;

			gsap.to(card, {
				height: newHeight,
				duration: 0.25,
				ease: "power2.out",
			});
		});

		resizeObserver.observe(contentRef.current);

		return () => resizeObserver.disconnect();
	}, []);

	return (
		<div
			ref={cardRef}
			className={`bg-white border border-[#202020] rounded-[13px] p-6 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.25)] hover:shadow-[0px_8px_30px_0px_rgba(0,0,0,0.35)] transition-shadow overflow-hidden ${className}`}
			style={{ opacity: animate ? 0 : 1 }}
		>
			<div ref={contentRef}>{children}</div>
		</div>
	);
}

interface CardTitleProps {
	children: React.ReactNode;
	className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
	return (
		<h2
			className={`font-['Figtree',sans-serif] font-semibold text-base text-black text-center ${className}`}
		>
			{children}
		</h2>
	);
}

interface CardDescriptionProps {
	children: React.ReactNode;
	className?: string;
}

export function CardDescription({
	children,
	className = "",
}: CardDescriptionProps) {
	return (
		<p
			className={`font-['Figtree',sans-serif] font-normal text-sm text-black/70 transition-all duration-300 ${className}`}
		>
			{children}
		</p>
	);
}
