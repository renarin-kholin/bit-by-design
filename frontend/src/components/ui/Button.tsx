import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "resend" | "resend-error";
	isLoading?: boolean;
	children: ReactNode;
}

const variantClasses = {
	primary:
		"bg-[#cbff1f] border-[#738f17] shadow-[0px_1px_0px_0px_#738f17] text-[#738f17] hover:bg-[#d4ff4a] hover:shadow-[0px_2px_8px_0px_rgba(203,255,31,0.3)] active:scale-[0.98] active:shadow-[0px_0px_0px_0px_#738f17]",
	secondary:
		"bg-[#f5f5f5] border-[#c4c4c4] shadow-[0px_1px_0px_0px_#ddd] text-[#656565] hover:bg-[#eaeaea] hover:shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] active:scale-[0.98]",
	resend:
		"bg-[#f5f5f5] border-[#c4c4c4] shadow-[0px_1px_0px_0px_#ddd] text-[#656565] hover:bg-[#eaeaea] hover:shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] active:scale-[0.98]",
	"resend-error":
		"bg-[#f6d9d9] border-[#a22121] shadow-[0px_1px_0px_0px_rgba(162,33,33,0.26)] text-[#7b1e1e] hover:bg-[#f0c7c7] hover:shadow-[0px_2px_4px_0px_rgba(162,33,33,0.2)] active:scale-[0.98]",
};

export function Button({
	variant = "primary",
	isLoading = false,
	disabled = false,
	children,
	className = "",
	...props
}: ButtonProps) {
	const baseClasses =
		"h-[33px] w-full rounded-[10px] border font-['Figtree',sans-serif] font-medium text-xs flex items-center justify-center transition-all duration-200 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:transform-none disabled:hover:shadow-none";

	return (
		<button
			className={`${baseClasses} ${variantClasses[variant]} ${className}`}
			disabled={disabled || isLoading}
			{...props}
		>
			{isLoading ? <Spinner className="text-[#738f17]" /> : children}
		</button>
	);
}

export function ResendButton({
	onClick,
	error = false,
	disabled = false,
	isLoading = false,
}: {
	onClick?: () => void;
	error?: boolean;
	disabled?: boolean;
	isLoading?: boolean;
}) {
	const baseClasses =
		"h-[33px] w-[71px] rounded-r-[10px] border font-['Figtree',sans-serif] font-medium text-xs flex items-center justify-center transition-all duration-200 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

	const stateClasses = error
		? "bg-[#f6d9d9] border-[#a22121] shadow-[0px_1px_0px_0px_rgba(162,33,33,0.26)] text-[#7b1e1e] hover:bg-[#f0c7c7] active:scale-[0.96]"
		: "bg-[#f5f5f5] border-[#c4c4c4] shadow-[0px_1px_0px_0px_#ddd] text-[#656565] hover:bg-[#eaeaea] active:scale-[0.96]";

	return (
		<button
			type="button"
			className={`${baseClasses} ${stateClasses}`}
			onClick={onClick}
			disabled={disabled || isLoading}
		>
			{isLoading ? <Spinner size="sm" className="text-[#656565]" /> : "Resend"}
		</button>
	);
}
