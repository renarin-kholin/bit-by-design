import { useNavigate } from "@tanstack/react-router";
import { Button } from "../ui";
import { LogoutIcon, LoginIcon } from "../icons";
import { useAuth } from "../../hooks";
import { toast } from "react-hot-toast";

export function AuthButton() {
	const navigate = useNavigate();
	const { isAuthenticated, logout, isLoggingOut } = useAuth();

	const handleAuthAction = () => {
		if (isAuthenticated) {
			logout();
			toast.success("Logged out successfully");
		} else {
			navigate({ to: "/login" });
		}
	};

	return (
		<Button
			variant={isAuthenticated ? "logout" : "primary"}
			onClick={handleAuthAction}
			isLoading={isLoggingOut}
			className="w-[116px] h-[36px] gap-2 px-10"
		>
			{isAuthenticated ? (
				<>
					Logout
					<LogoutIcon className="w-[13px] h-[13px]" />
				</>
			) : (
				<>
					Login
					<LoginIcon className="w-[13px] h-[13px]" />
				</>
			)}
		</Button>
	);
}
