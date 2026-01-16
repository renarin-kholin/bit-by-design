import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGSAP } from "@gsap/react";
import {
	Button,
	Card,
	CardTitle,
	CardDescription,
	Input,
	ResendButton,
	AuthLayout,
} from "../components";
import { useLoginFlow, useLoginAnimations } from "../hooks";

const DESCRIPTIONS = {
	email: "Use your registered email address from unstop.",
	otp: "Enter the One Time Password that you just received on your email.",
} as const;

const RESEND_SUCCESS_TIMEOUT = 3000;

function LoginPage() {
	const navigate = useNavigate();
	const [shake, setShake] = useState(false);

	const animations = useLoginAnimations();
	const login = useLoginFlow({
		onSuccess: () => {
			animations.animateSuccessExit(() => {
				navigate({ to: "/" });
			});
		},
	});

	// Register GSAP context
	useGSAP(() => {}, { scope: animations.containerRef });

	// Trigger shake animation on error
	useEffect(() => {
		if (login.hasError) {
			setShake(true);
			const timer = setTimeout(() => setShake(false), 400);
			return () => clearTimeout(timer);
		}
	}, [login.hasError]);

	// Animate message appearance
	useEffect(() => {
		if (login.error || login.resendSuccess) {
			animations.animateMessageIn();
		}
	}, [login.error, login.resendSuccess, animations]);

	// Auto-hide resend success message
	useEffect(() => {
		if (login.resendSuccess) {
			const timer = setTimeout(() => {
				animations.animateMessageOut(() => {
					login.clearResendSuccess();
				});
			}, RESEND_SUCCESS_TIMEOUT);
			return () => clearTimeout(timer);
		}
	}, [login.resendSuccess, login, animations]);

	const handleRequestOtp = async (e: FormEvent) => {
		e.preventDefault();
		const success = await login.requestOtp();
		if (success) {
			animations.transitionToOtp(() => {});
		}
	};

	const handleVerifyOtp = async (e: FormEvent) => {
		e.preventDefault();
		await login.verifyOtp();
	};

	const handleResendOtp = async () => {
		await login.resendOtp();
	};

	const handleGoBack = () => {
		animations.transitionToEmail(() => {
			login.goBackToEmail();
		});
	};

	return (
		<AuthLayout>
			<div ref={animations.containerRef}>
				<Card className="w-full max-w-84.5">
					<CardTitle className="text-left">Login to Bit by Design</CardTitle>

					<div ref={animations.formContainerRef}>
						<CardDescription className="mt-2 mb-6">
							{DESCRIPTIONS[login.step]}
						</CardDescription>

						{login.step === "email" ? (
							<EmailForm
								email={login.email}
								onEmailChange={login.updateEmail}
								onSubmit={handleRequestOtp}
								isLoading={login.isLoading}
							/>
						) : (
							<OtpForm
								email={login.email}
								otp={login.otp}
								onOtpChange={login.updateOtp}
								onSubmit={handleVerifyOtp}
								onResend={handleResendOtp}
								onGoBack={handleGoBack}
								isLoading={login.isLoading}
								isResending={login.isResendingOtp}
								hasError={login.hasError}
								error={login.error}
								resendSuccess={login.resendSuccess}
								shake={shake}
								otpInputRef={animations.otpInputRef}
								messageRef={animations.messageRef}
							/>
						)}
					</div>
				</Card>
			</div>
		</AuthLayout>
	);
}

// --- Sub-components for cleaner organization ---

interface EmailFormProps {
	email: string;
	onEmailChange: (value: string) => void;
	onSubmit: (e: FormEvent) => void;
	isLoading: boolean;
}

function EmailForm({
	email,
	onEmailChange,
	onSubmit,
	isLoading,
}: EmailFormProps) {
	return (
		<form onSubmit={onSubmit} className="space-y-3">
			<Input
				type="email"
				placeholder="Email"
				value={email}
				onChange={(e) => onEmailChange(e.target.value)}
				required
				disabled={isLoading}
				autoFocus
			/>
			<Button type="submit" isLoading={isLoading}>
				Get OTP
			</Button>
		</form>
	);
}

interface OtpFormProps {
	email: string;
	otp: string;
	onOtpChange: (value: string) => void;
	onSubmit: (e: FormEvent) => void;
	onResend: () => void;
	onGoBack: () => void;
	isLoading: boolean;
	isResending: boolean;
	hasError: boolean;
	error: string | null;
	resendSuccess: boolean;
	shake: boolean;
	otpInputRef: React.RefObject<HTMLInputElement>;
	messageRef: React.RefObject<HTMLDivElement>;
}

function OtpForm({
	email,
	otp,
	onOtpChange,
	onSubmit,
	onResend,
	onGoBack,
	isLoading,
	isResending,
	hasError,
	error,
	resendSuccess,
	shake,
	otpInputRef,
	messageRef,
}: OtpFormProps) {
	return (
		<form onSubmit={onSubmit} className="space-y-3">
			<div className="otp-animate" style={{ opacity: 0 }}>
				<Input type="email" value={email} disabled placeholder={email} />
			</div>

			<div className="otp-animate" style={{ opacity: 0 }}>
				<Input
					ref={otpInputRef}
					type="text"
					placeholder="One Time Password"
					value={otp}
					onChange={(e) => onOtpChange(e.target.value)}
					error={hasError}
					disabled={isLoading}
					shake={shake}
					maxLength={6}
					suffix={
						<ResendButton
							onClick={onResend}
							error={hasError}
							disabled={isLoading}
							isLoading={isResending}
						/>
					}
				/>
			</div>

			{(error || resendSuccess) && (
				<div ref={messageRef} style={{ opacity: 0 }}>
					{error && <FormMessage variant="error">{error}</FormMessage>}
					{resendSuccess && !error && (
						<FormMessage variant="success">OTP sent successfully!</FormMessage>
					)}
				</div>
			)}

			<div className="otp-animate" style={{ opacity: 0 }}>
				<Button type="submit" isLoading={isLoading}>
					Login
				</Button>
			</div>

			<button
				type="button"
				onClick={onGoBack}
				className="otp-animate w-full text-center text-xs text-[#717171] hover:text-[#101010] transition-colors duration-200 cursor-pointer mt-2"
				style={{ opacity: 0 }}
			>
				← Use a different email
			</button>
		</form>
	);
}

interface FormMessageProps {
	variant: "error" | "success";
	children: React.ReactNode;
}

function FormMessage({ variant, children }: FormMessageProps) {
	const colorClass = variant === "error" ? "text-[#8d2727]" : "text-[#738f17]";

	return (
		<p
			className={`font-['Figtree',sans-serif] font-normal text-[10px] ${colorClass}`}
		>
			{children}
		</p>
	);
}

export const Route = createFileRoute("/login")({
	component: LoginPage,
});
