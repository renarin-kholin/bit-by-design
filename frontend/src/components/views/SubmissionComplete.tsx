import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Card, CardTitle, CardDescription } from "../ui";
import { EditIcon, PreviewIcon } from "../icons";
import { SubmissionPreviewModal } from "./SubmissionPreviewModal";
import type { SubmissionFormData } from "../forms";

interface SubmissionCompleteProps {
	timeRemaining: string;
	imageUrl?: string;
	figmaLink: string;
	formData: SubmissionFormData;
	onEdit: () => void;
}

export function SubmissionComplete({
	timeRemaining,
	imageUrl,
	figmaLink,
	formData,
	onEdit,
}: SubmissionCompleteProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [showPreview, setShowPreview] = useState(false);

	// Entrance animation
	useEffect(() => {
		const tl = gsap.timeline();
		tl.fromTo(
			containerRef.current,
			{ opacity: 0, y: 20 },
			{ opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
		);
	}, []);

	return (
		<>
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

				<Card
					animate={false}
					className="w-[380px] max-w-[calc(100vw-32px)] overflow-hidden"
				>
					<div className="flex flex-col gap-4">
						<div className="text-left">
							<CardTitle className="text-left text-base">
								Your Submission
							</CardTitle>
							<CardDescription className="mt-1">
								You can edit your submission until the voting period begins.
							</CardDescription>
						</div>

						{/* Image with overlay buttons */}
						<div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/5 border border-[rgba(64,64,64,0.31)] shadow-[0px_1px_0px_0px_rgba(114,114,114,0.24)]">
							{imageUrl ? (
								<>
									<img
										src={imageUrl}
										alt="Submission Preview"
										className="w-full h-full object-cover"
									/>
									{/* Dark overlay */}
									<div className="absolute inset-0 bg-black/40" />
								</>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-[#f5f5f5] text-[#bababa] font-['Figtree',sans-serif] text-sm">
									No preview available
								</div>
							)}

							{/* Action buttons - pill shaped container */}
							<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex bg-white border border-[#cbcbcb] rounded-lg shadow-[0px_1px_0px_0px_#cbcbcb] overflow-hidden">
								<button
									type="button"
									onClick={() => setShowPreview(true)}
									className="flex items-center justify-center w-[34px] h-[26px] hover:bg-[#f5f5f5] transition-colors border-r border-[#cbcbcb]"
									title="Preview submission"
								>
									<PreviewIcon size={13} className="text-[#656565]" />
								</button>
								<button
									type="button"
									onClick={onEdit}
									className="flex items-center justify-center w-[32px] h-[26px] hover:bg-[#f5f5f5] transition-colors"
									title="Edit submission"
								>
									<EditIcon size={13} className="text-[#656565]" />
								</button>
							</div>
						</div>
					</div>
				</Card>
			</div>

			{/* Preview Modal */}
			{showPreview && (
				<SubmissionPreviewModal
					imageUrl={imageUrl}
					figmaLink={figmaLink}
					formData={formData}
					onClose={() => setShowPreview(false)}
				/>
			)}
		</>
	);
}
