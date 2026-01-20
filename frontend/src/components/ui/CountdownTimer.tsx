import { forwardRef } from "react";

interface CountdownTimerProps {
	hours: number;
	minutes: number;
	seconds: number;
	isLoading?: boolean;
	style?: React.CSSProperties;
}

export const CountdownTimer = forwardRef<HTMLDivElement, CountdownTimerProps>(
	function CountdownTimer(
		{ hours, minutes, seconds, isLoading = false, style },
		ref,
	) {
		const formatValue = (value: number) => value.toString().padStart(2, "0");
		
		return (
			<div
				ref={ref}
				className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center font-['Figtree',sans-serif] font-medium text-5xl sm:text-7xl md:text-[100px] lg:text-[128px] text-white leading-none tabular-nums"
				style={style}
			>
				{/* Hours */}
				<span className={`text-center ${isLoading ? "text-[#7e7e7e]" : ""}`}>
					{isLoading ? "--" : formatValue(hours)}
				</span>
				
				{/* Separator */}
				<span className="mx-1 sm:mx-2">:</span>
				
				{/* Minutes */}
				<span className={`text-center ${isLoading ? "text-[#7e7e7e]" : ""}`}>
					{isLoading ? "--" : formatValue(minutes)}
				</span>
				
				{/* Separator */}
				<span className="mx-1 sm:mx-2">:</span>
				
				{/* Seconds */}
				<span className={`text-center ${isLoading ? "text-[#7e7e7e]" : ""}`}>
					{isLoading ? "--" : formatValue(seconds)}
				</span>
			</div>
		);
	},
);

const LABELS = ["Hours", "Minutes", "Seconds"] as const;

interface CountdownLabelsProps {
	style?: React.CSSProperties;
}

export const CountdownLabels = forwardRef<HTMLDivElement, CountdownLabelsProps>(
	function CountdownLabels({ style }, ref) {
		return (
			<div
				ref={ref}
				className="grid grid-cols-[1fr_auto_1fr_auto_1fr] mt-2 sm:mt-4 font-['Figtree',sans-serif] font-medium text-sm sm:text-lg md:text-[24px] text-white w-full max-w-[280px] sm:max-w-[400px] md:max-w-[600px] mx-auto"
				style={style}
			>
				<span className="text-center">Hours</span>
				<span className="mx-1 sm:mx-2 invisible">:</span>
				<span className="text-center">Minutes</span>
				<span className="mx-1 sm:mx-2 invisible">:</span>
				<span className="text-center">Seconds</span>
			</div>
		);
	},
);
