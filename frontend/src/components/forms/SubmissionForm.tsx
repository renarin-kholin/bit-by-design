import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import {
	Card,
	CardTitle,
	CardDescription,
	Input,
	Textarea,
	Button,
	FileUpload,
	Checkbox,
} from "../ui";
import { ArrowRightIcon, ChevronLeftIcon } from "../icons";
import { useAuth } from "../../hooks/useAuth";
import { useCreateSubmission, useUpdateSubmission } from "../../api";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { toast } from "react-hot-toast";

// Form data structure
export interface SubmissionFormData {
	// Step 1: Design Submission
	figmaLink: string;
	designImage: File | null;
	// Step 2: Design Rationale
	targetUserAndGoal: string;
	layoutExplanation: string;
	styleInterpretation: string;
	keyTradeOff: string;
	// Step 3: Confirmation
	originalityConfirmed: boolean;
	templateComplianceConfirmed: boolean;
	// Step 4: Optional Reflection
	futureImprovements: string;
}

const initialFormData: SubmissionFormData = {
	figmaLink: "",
	designImage: null,
	targetUserAndGoal: "",
	layoutExplanation: "",
	styleInterpretation: "",
	keyTradeOff: "",
	originalityConfirmed: false,
	templateComplianceConfirmed: false,
	futureImprovements: "",
};

interface SubmissionFormProps {
	timeRemaining: string;
	onSubmit?: (data: SubmissionFormData, imageUrl?: string) => void;
	isSubmitting?: boolean;
	initialData?: Partial<SubmissionFormData>;
	initialImageUrl?: string;
	existingSubmissionId?: number;
	onCancel?: () => void;
}

const TOTAL_STEPS = 4;

// Step indicator component
function StepIndicator({
	currentStep,
	totalSteps,
}: {
	currentStep: number;
	totalSteps: number;
}) {
	return (
		<div className="flex items-center gap-2 mb-4">
			{Array.from({ length: totalSteps }, (_, i) => {
				const stepNum = i + 1;
				const isActive = stepNum === currentStep;
				const isCompleted = stepNum < currentStep;

				return (
					<div
						key={i}
						className={`
							h-1.5 flex-1 rounded-full transition-all duration-300
							${isActive ? "bg-[#cbff1f]" : isCompleted ? "bg-[#738f17]" : "bg-[#e0e0e0]"}
						`}
					/>
				);
			})}
		</div>
	);
}

// Validation helpers
function validateStep1(data: SubmissionFormData): boolean {
	// Figma link is required and must be a valid URL
	if (!data.figmaLink.trim()) return false;
	try {
		const url = new URL(data.figmaLink);
		return url.hostname.includes("figma.com");
	} catch {
		return false;
	}
}

function validateStep2(data: SubmissionFormData): boolean {
	return (
		data.targetUserAndGoal.trim().length >= 20 &&
		data.layoutExplanation.trim().length >= 20 &&
		data.styleInterpretation.trim().length >= 20 &&
		data.keyTradeOff.trim().length >= 10
	);
}

function validateStep3(data: SubmissionFormData): boolean {
	return data.originalityConfirmed && data.templateComplianceConfirmed;
}

// Step 4 is optional, always valid
function validateStep4(_data: SubmissionFormData): boolean {
	return true;
}

const stepValidators = [
	validateStep1,
	validateStep2,
	validateStep3,
	validateStep4,
];

export function SubmissionForm({
	timeRemaining,
	onSubmit,
	isSubmitting = false,
	initialData,
	initialImageUrl,
	existingSubmissionId,
	onCancel,
}: SubmissionFormProps) {
	const [formData, setFormData] = useState<SubmissionFormData>({
		...initialFormData,
		...initialData,
	});
	const [currentStep, setCurrentStep] = useState(1);
	const [errors, setErrors] = useState<Record<string, boolean>>({});
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(
		initialImageUrl,
	);

	const containerRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	const { isAuthenticated, user } = useAuth();
	const createSubmission = useCreateSubmission();
	const updateSubmission = useUpdateSubmission();

	const isEditing = !!existingSubmissionId;
	const isMutating = createSubmission.isPending || updateSubmission.isPending;

	// Entrance animation
	useEffect(() => {
		const tl = gsap.timeline();

		tl.fromTo(
			containerRef.current,
			{ opacity: 0, y: 20 },
			{ opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
		);

		tl.fromTo(
			cardRef.current,
			{ opacity: 0, scale: 0.95 },
			{ opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)" },
			"-=0.2",
		);
	}, []);

	// Step transition animation - matches login form style
	const animateStepTransition = useCallback(
		(direction: "next" | "prev", onComplete?: () => void) => {
			if (!contentRef.current) {
				onComplete?.();
				return;
			}

			setIsTransitioning(true);

			const tl = gsap.timeline();

			// Fade out in the direction of travel (up for next, down for prev)
			tl.to(contentRef.current, {
				opacity: 0,
				y: direction === "next" ? -8 : 8,
				duration: 0.18,
				ease: "power2.in",
			});

			// Call the step change after fade out
			tl.call(() => {
				onComplete?.();
			});

			// Reset container position
			tl.set(contentRef.current, {
				y: 0,
				opacity: 1,
			});

			// Animate in the new content
			tl.call(() => {
				requestAnimationFrame(() => {
					if (!contentRef.current) return;

					// Get all animatable elements in the new step
					const elements =
						contentRef.current.querySelectorAll(".step-animate-item");

					if (elements.length > 0) {
						// Stagger animate child elements (they start hidden via CSS)
						gsap.to(elements, {
							opacity: 1,
							y: 0,
							duration: 0.3,
							stagger: 0.05,
							ease: "power2.out",
							onComplete: () => setIsTransitioning(false),
						});
					} else {
						setIsTransitioning(false);
					}
				});
			});
		},
		[],
	);
	const updateField = <K extends keyof SubmissionFormData>(
		field: K,
		value: SubmissionFormData[K],
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: false }));
		}
	};

	const handleNext = () => {
		const validator = stepValidators[currentStep - 1];
		if (!validator(formData)) {
			// Set specific field errors based on step
			if (currentStep === 1) {
				setErrors({
					figmaLink: !formData.figmaLink.trim() || !validateStep1(formData),
				});
			} else if (currentStep === 2) {
				setErrors({
					targetUserAndGoal: formData.targetUserAndGoal.trim().length < 20,
					layoutExplanation: formData.layoutExplanation.trim().length < 20,
					styleInterpretation: formData.styleInterpretation.trim().length < 20,
					keyTradeOff: formData.keyTradeOff.trim().length < 10,
				});
			} else if (currentStep === 3) {
				setErrors({
					originalityConfirmed: !formData.originalityConfirmed,
					templateComplianceConfirmed: !formData.templateComplianceConfirmed,
				});
			}
			return;
		}

		if (currentStep < TOTAL_STEPS) {
			animateStepTransition("next", () => {
				setCurrentStep((prev) => prev + 1);
				setErrors({});
			});
		}
	};

	const handlePrev = () => {
		if (currentStep > 1) {
			animateStepTransition("prev", () => {
				setCurrentStep((prev) => prev - 1);
				setErrors({});
			});
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Step 4 is optional - no validation needed
		// Step 3 validation already passed to get here

		if (!user) {
			toast.error("You must be logged in to submit.");
			return;
		}

		try {
			// Upload image only if a new file was selected
			let imageUrl = currentImageUrl || "";
			if (formData.designImage) {
				const uploadToastId = toast.loading("Uploading design image...");
				try {
					const uploadRes = await uploadToCloudinary(formData.designImage);
					imageUrl = uploadRes.secure_url;
					setCurrentImageUrl(imageUrl);
					toast.success("Image uploaded!", { id: uploadToastId });
				} catch {
					toast.error("Failed to upload image. Please try again.", {
						id: uploadToastId,
					});
					return;
				}
			}

			const submissionData = {
				figma_link: formData.figmaLink,
				design_image: imageUrl,
				target_user_and_goal: formData.targetUserAndGoal,
				layout_explanation: formData.layoutExplanation,
				style_interpretation: formData.styleInterpretation,
				key_trade_off: formData.keyTradeOff,
				originality_confirmed: formData.originalityConfirmed,
				template_compliance_confirmed: formData.templateComplianceConfirmed,
				future_improvements: formData.futureImprovements || undefined,
			};

			if (isEditing && existingSubmissionId) {
				await updateSubmission.mutateAsync({
					id: existingSubmissionId,
					data: submissionData,
				});
				toast.success("Submission updated!");
			} else {
				await createSubmission.mutateAsync(submissionData);
				toast.success("Submission received!");
			}

			onSubmit?.(formData, imageUrl);
		} catch {
			toast.error(
				isEditing
					? "Failed to update. Please try again."
					: "Failed to submit. Please try again.",
			);
		}
	};

	const isCurrentStepValid = stepValidators[currentStep - 1](formData);
	const isLastStep = currentStep === TOTAL_STEPS;

	// Step titles and descriptions
	const stepInfo = [
		{
			title: "Design Submission",
			description:
				"Upload your design mockup from Figma. Select the mockup frame and export a high quality PNG.",
		},
		{
			title: "Design Rationale",
			description:
				"Explain your design decisions and approach. This helps judges understand your thought process.",
		},
		{
			title: "Confirmation",
			description:
				"Please confirm the following requirements before submitting.",
		},
		{
			title: "Optional Reflection",
			description:
				"Share what you would improve with more time. This step is optional.",
		},
	];

	return (
		<div
			ref={containerRef}
			className="flex flex-col items-center gap-6"
			style={{ opacity: 0 }}
		>
			{/* Time remaining */}
			<div className="text-center">
				<span className="font-['Figtree',sans-serif] font-normal text-base text-white/50 tracking-[-0.64px]">
					Time until voting:{" "}
				</span>
				<span className="font-['Figtree',sans-serif] font-medium text-base text-white tracking-[-0.64px]">
					{timeRemaining}
				</span>
			</div>

			{/* Submission card */}
			<div ref={cardRef} style={{ opacity: 0 }}>
				<Card animate={false} className="w-[380px] max-w-[calc(100vw-32px)]">
					{!isAuthenticated ? (
						<div className="flex flex-col items-center justify-center py-8 gap-4">
							<p className="text-center font-['Figtree',sans-serif] text-sm text-[#bababa]">
								Please log in to submit your design.
							</p>
							<Button
								variant="primary"
								onClick={() => (window.location.href = "/login")} // Or use navigate if available/passed
								className="w-full max-w-[200px]"
							>
								Log In
							</Button>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="flex flex-col gap-4">
							{/* Step indicator */}
							<StepIndicator
								currentStep={currentStep}
								totalSteps={TOTAL_STEPS}
							/>

							{/* Step header */}
							<div className="text-left mb-2">
								<CardTitle>{stepInfo[currentStep - 1].title}</CardTitle>
								<CardDescription>
									{stepInfo[currentStep - 1].description}
								</CardDescription>
							</div>

							{/* Step content */}
							<div
								ref={contentRef}
								className={`flex flex-col gap-4 ${isTransitioning ? "transitioning" : ""}`}
							>
								{/* Step 1: Design Submission */}
								{currentStep === 1 && (
									<div className="step-1 flex flex-col gap-4">
										<div className="step-animate-item">
											<label className="block font-['Figtree',sans-serif] text-xs font-medium text-[#717171] mb-1.5">
												Figma Design Link *
											</label>
											<Input
												type="url"
												placeholder="https://www.figma.com/design/..."
												value={formData.figmaLink}
												onChange={(e) =>
													updateField("figmaLink", e.target.value)
												}
												disabled={isSubmitting}
												error={errors.figmaLink}
											/>
											{errors.figmaLink && (
												<p className="mt-1 text-xs text-[#a22121] font-['Figtree',sans-serif]">
													Please enter a valid Figma link with view access
													enabled
												</p>
											)}
										</div>

										<div className="step-animate-item">
											<label className="block font-['Figtree',sans-serif] text-xs font-medium text-[#717171] mb-1.5">
												Final Design Image{" "}
												<span className="text-[#bababa]">(optional)</span>
											</label>
											<FileUpload
												value={formData.designImage}
												onChange={(file) => updateField("designImage", file)}
												accept="image/png,image/jpeg"
												disabled={isSubmitting}
												previewUrl={initialImageUrl}
											/>
											<p className="mt-1 text-xs text-[#bababa] font-['Figtree',sans-serif]">
												PNG or JPG for quick preview during voting
											</p>
										</div>
									</div>
								)}

								{/* Step 2: Design Rationale */}
								{currentStep === 2 && (
									<div className="step-2 flex flex-col gap-4">
										<div className="step-animate-item">
											<label className="block font-['Figtree',sans-serif] text-xs font-medium text-[#717171] mb-1.5">
												Target User & Primary Goal *
											</label>
											<Textarea
												placeholder="Who is this design for and what action does it prioritize?"
												value={formData.targetUserAndGoal}
												onChange={(e) =>
													updateField("targetUserAndGoal", e.target.value)
												}
												disabled={isSubmitting}
												error={errors.targetUserAndGoal}
												rows={2}
												maxLength={500}
											/>
										</div>

										<div className="step-animate-item">
											<label className="block font-['Figtree',sans-serif] text-xs font-medium text-[#717171] mb-1.5">
												Layout & Visual Hierarchy *
											</label>
											<Textarea
												placeholder="How is content structured and attention guided?"
												value={formData.layoutExplanation}
												onChange={(e) =>
													updateField("layoutExplanation", e.target.value)
												}
												disabled={isSubmitting}
												error={errors.layoutExplanation}
												rows={2}
												maxLength={500}
											/>
										</div>

										<div className="step-animate-item">
											<label className="block font-['Figtree',sans-serif] text-xs font-medium text-[#717171] mb-1.5">
												Design Style Interpretation *
											</label>
											<Textarea
												placeholder="How did you understand and apply the assigned style?"
												value={formData.styleInterpretation}
												onChange={(e) =>
													updateField("styleInterpretation", e.target.value)
												}
												disabled={isSubmitting}
												error={errors.styleInterpretation}
												rows={2}
												maxLength={500}
											/>
										</div>

										<div className="step-animate-item">
											<label className="block font-['Figtree',sans-serif] text-xs font-medium text-[#717171] mb-1.5">
												Key Design Trade-Off *
											</label>
											<Input
												placeholder="One intentional compromise you made"
												value={formData.keyTradeOff}
												onChange={(e) =>
													updateField("keyTradeOff", e.target.value)
												}
												disabled={isSubmitting}
												error={errors.keyTradeOff}
												maxLength={200}
											/>
										</div>
									</div>
								)}

								{/* Step 3: Confirmation */}
								{currentStep === 3 && (
									<div className="step-3 flex flex-col gap-4 py-2">
										<div className="step-animate-item">
											<Checkbox
												label="I confirm that this design was created during the competition event and is my original work."
												checked={formData.originalityConfirmed}
												onChange={(e) =>
													updateField("originalityConfirmed", e.target.checked)
												}
												disabled={isSubmitting}
												error={errors.originalityConfirmed}
											/>
										</div>

										<div className="step-animate-item">
											<Checkbox
												label="I confirm that the template dimensions have not been altered from the original specifications."
												checked={formData.templateComplianceConfirmed}
												onChange={(e) =>
													updateField(
														"templateComplianceConfirmed",
														e.target.checked,
													)
												}
												disabled={isSubmitting}
												error={errors.templateComplianceConfirmed}
											/>
										</div>

										{(errors.originalityConfirmed ||
											errors.templateComplianceConfirmed) && (
											<p className="text-xs text-[#a22121] font-['Figtree',sans-serif]">
												Please confirm both requirements to continue
											</p>
										)}
									</div>
								)}

								{/* Step 4: Optional Reflection */}
								{currentStep === 4 && (
									<div className="step-4 flex flex-col gap-4">
										<div className="step-animate-item">
											<label className="block font-['Figtree',sans-serif] text-xs font-medium text-[#717171] mb-1.5">
												Future Improvements{" "}
												<span className="text-[#bababa]">(optional)</span>
											</label>
											<Textarea
												placeholder="What would you improve with more time? This helps showcase your growth mindset."
												value={formData.futureImprovements}
												onChange={(e) =>
													updateField("futureImprovements", e.target.value)
												}
												disabled={isSubmitting}
												rows={4}
												maxLength={1000}
											/>
										</div>
									</div>
								)}
							</div>

							{/* Navigation buttons */}
							<div className="flex gap-3 mt-2">
								{onCancel && currentStep === 1 && (
									<Button
										type="button"
										variant="secondary"
										onClick={onCancel}
										disabled={isMutating}
										className="w-auto px-6"
									>
										Cancel
									</Button>
								)}

								{currentStep > 1 && (
									<Button
										type="button"
										variant="secondary"
										onClick={handlePrev}
										disabled={isMutating}
										className="w-auto px-6"
									>
										<ChevronLeftIcon className="mr-1" />
										Back
									</Button>
								)}

								{isLastStep ? (
									<Button
										type="submit"
										variant="primary"
										isLoading={isMutating}
										disabled={isMutating}
										className="flex-1 px-6 whitespace-nowrap"
									>
										{isEditing ? "Update" : "Submit"}
										{!isMutating && <ArrowRightIcon className="ml-2" />}
									</Button>
								) : (
									<Button
										type="button"
										variant="primary"
										onClick={handleNext}
										disabled={!isCurrentStepValid}
										className="flex-1 px-6 whitespace-nowrap"
									>
										Continue
										<ArrowRightIcon className="ml-2" />
									</Button>
								)}
							</div>

							{/* Step counter */}
							<p className="text-center text-xs text-[#bababa] font-['Figtree',sans-serif]">
								Step {currentStep} of {TOTAL_STEPS}
								{currentStep === 4 && " (Optional)"}
							</p>
						</form>
					)}
				</Card>
			</div>
		</div>
	);
}
