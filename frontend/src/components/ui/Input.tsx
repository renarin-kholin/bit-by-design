import {
	forwardRef,
	useRef,
	useEffect,
	useImperativeHandle,
	type InputHTMLAttributes,
	type ReactNode,
} from "react";
import gsap from "gsap";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	error?: boolean;
	suffix?: ReactNode;
	shake?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{
		className = "",
		error = false,
		disabled = false,
		suffix,
		shake = false,
		...props
	},
	ref
) {
	const inputRef = useRef<HTMLInputElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Forward the ref to the input element
	useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

	// GSAP shake animation
	useEffect(() => {
		if (shake && wrapperRef.current) {
			gsap.to(wrapperRef.current, {
				keyframes: [
					{ x: -4, duration: 0.05 },
					{ x: 4, duration: 0.05 },
					{ x: -4, duration: 0.05 },
					{ x: 4, duration: 0.05 },
					{ x: -2, duration: 0.05 },
					{ x: 2, duration: 0.05 },
					{ x: 0, duration: 0.05 },
				],
				ease: "power2.out",
			});
		}
	}, [shake]);

	const baseClasses =
		"h-[33px] w-full rounded-[10px] border px-5 font-['Figtree',sans-serif] font-medium text-sm outline-none transition-all duration-200 ease-out";

	const stateClasses = error
		? "border-[#a22121] shadow-[0px_1px_0px_0px_#a22121] text-[#8d2727] placeholder:text-[#8d2727] bg-white"
		: disabled
			? "bg-[#c5c5c5] border-[rgba(64,64,64,0.31)] shadow-[0px_1px_0px_0px_rgba(114,114,114,0.24)] text-[#898989] placeholder:text-[#898989]"
			: "bg-white border-[rgba(64,64,64,0.31)] shadow-[0px_1px_0px_0px_rgba(114,114,114,0.24)] text-[#717171] placeholder:text-[#717171] focus:border-[#738f17] focus:shadow-[0px_1px_0px_0px_#738f17,0px_0px_0px_3px_rgba(203,255,31,0.15)]";

	if (suffix) {
		return (
			<div ref={wrapperRef} className="relative w-full">
				<input
					ref={inputRef}
					className={`${baseClasses} ${stateClasses} pr-18.75 ${className}`}
					disabled={disabled}
					{...props}
				/>
				<div className="absolute right-0 top-0 h-full">{suffix}</div>
			</div>
		);
	}

	return (
		<div ref={wrapperRef} className="w-full">
			<input
				ref={inputRef}
				className={`${baseClasses} ${stateClasses} ${className}`}
				disabled={disabled}
				{...props}
			/>
		</div>
	);
});
