import type { ReactNode } from "react";
import { AuthButton } from "../ui";

interface DashboardLayoutProps {
	children: ReactNode;
	/** Additional content to render before children */
	background?: ReactNode;
}

/**
 * Common layout for dashboard pages with centered auth button
 * Provides consistent positioning for the AuthButton across all states
 */
export function DashboardLayout({
	children,
	background,
}: DashboardLayoutProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-12 relative">
			{background}

			{/* Auth button - positioned at top center */}
			<div className="absolute top-6 sm:top-15 left-1/2 -translate-x-1/2 z-10">
				<AuthButton />
			</div>

			{/* Main content */}
			<div className="relative z-10">{children}</div>
		</div>
	);
}
