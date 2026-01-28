import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Card, CardTitle, CardDescription, Button } from "../ui";
import type { SubmissionFormData } from "../forms";

interface SubmissionPreviewModalProps {
	imageUrl?: string;
	figmaLink: string;
	formData: SubmissionFormData;
	onClose: () => void;
}

/**
 * Modal showing a preview of how the submission will appear to voters.
 * This is the "public" view that judges/voters will see.
 */
export function SubmissionPreviewModal({
	imageUrl,
	figmaLink,
	formData,
	onClose,
}: SubmissionPreviewModalProps) {
	const overlayRef = useRef<HTMLDivElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const [showFullImage, setShowFullImage] = useState(false);

	// Entrance animation
	useEffect(() => {
		const tl = gsap.timeline();

		tl.fromTo(
			overlayRef.current,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.2, ease: "power2.out" },
		);

		tl.fromTo(
			modalRef.current,
			{ opacity: 0, scale: 0.95, y: 20 },
			{ opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.4)" },
			"-=0.1",
		);

		return () => {
			tl.kill();
		};
	}, []);

	const handleClose = () => {
		const tl = gsap.timeline({
			onComplete: onClose,
		});

		tl.to(modalRef.current, {
			opacity: 0,
			scale: 0.95,
			y: 10,
			duration: 0.2,
			ease: "power2.in",
		});

		tl.to(
			overlayRef.current,
			{ opacity: 0, duration: 0.15, ease: "power2.in" },
			"-=0.1",
		);
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === overlayRef.current) {
			handleClose();
		}
	};

	const handleViewInFigma = () => {
		window.open(figmaLink, "_blank");
	};

	return (
		<div
			ref={overlayRef}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
			onClick={handleOverlayClick}
			style={{ opacity: 0 }}
		>
			<div
				ref={modalRef}
				className="max-h-[90vh] overflow-y-auto"
				style={{ opacity: 0 }}
			>
				<Card animate={false} className="w-[480px] max-w-[calc(100vw-32px)]">
					<div className="flex flex-col gap-5">
						{/* Header */}
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="text-lg">Submission Preview</CardTitle>
								<CardDescription className="mt-1">
									This is how voters will see your submission
								</CardDescription>
							</div>
							<button
								type="button"
								onClick={handleClose}
								className="text-[#bababa] hover:text-[#717171] transition-colors p-1 -mr-1 -mt-1"
								aria-label="Close preview"
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M18 6L6 18M6 6l12 12" />
								</svg>
							</button>
						</div>

						{/* Design Image */}
						<div
							className={`relative w-full aspect-video rounded-lg overflow-hidden bg-[#f5f5f5] border border-[rgba(64,64,64,0.31)] ${imageUrl ? "cursor-zoom-in hover:opacity-90 transition-opacity" : ""}`}
							onClick={() => imageUrl && setShowFullImage(true)}
						>
							{imageUrl ? (
								<img
									src={imageUrl}
									alt="Submission Design"
									className="w-full h-full object-cover object-top"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center text-[#bababa] font-['Figtree',sans-serif] text-sm">
									No preview image uploaded
								</div>
							)}
						</div>

						{/* Design Rationale */}
						<div className="space-y-4">
							<h3 className="font-['Figtree',sans-serif] font-semibold text-sm text-black">
								Design Rationale
							</h3>

							<div className="space-y-3">
								<RationaleItem
									label="Target User & Primary Goal"
									value={formData.targetUserAndGoal}
								/>
								<RationaleItem
									label="Layout & Visual Hierarchy"
									value={formData.layoutExplanation}
								/>
								<RationaleItem
									label="Design Style Interpretation"
									value={formData.styleInterpretation}
								/>
								<RationaleItem
									label="Key Design Trade-Off"
									value={formData.keyTradeOff}
								/>
								{formData.futureImprovements && (
									<RationaleItem
										label="Future Improvements"
										value={formData.futureImprovements}
									/>
								)}
							</div>
						</div>

						{/* Actions */}
						<div className="flex gap-3 pt-2">
							<Button
								variant="secondary"
								onClick={handleViewInFigma}
								className="flex-1"
							>
								View in Figma
							</Button>
							<Button
								variant="primary"
								onClick={handleClose}
								className="flex-1"
							>
								Close Preview
							</Button>
						</div>
					</div>
				</Card>
			</div>

			{/* Full Image Lightbox */}
			{showFullImage && imageUrl && (
				<div
					className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 cursor-zoom-out p-4"
					onClick={() => setShowFullImage(false)}
				>
					<button
						type="button"
						onClick={() => setShowFullImage(false)}
						className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 z-10"
						aria-label="Close full image"
					>
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
					<img
						src={imageUrl}
						alt="Full size submission design"
						className="max-w-full max-h-full object-contain rounded-lg"
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}
		</div>
	);
}

function RationaleItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-1">
			<p className="font-['Figtree',sans-serif] text-xs font-medium text-[#717171]">
				{label}
			</p>
			<p className="font-['Figtree',sans-serif] text-sm text-black/80 leading-relaxed">
				{value || <span className="text-[#bababa] italic">Not provided</span>}
			</p>
		</div>
	);
}
