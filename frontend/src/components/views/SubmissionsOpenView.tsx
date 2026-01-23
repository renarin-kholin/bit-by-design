import { useState, useEffect } from "react";
import { SubmissionForm, type SubmissionFormData } from "../forms";
import { SubmissionComplete } from "./SubmissionComplete";
import { formatTimeRemaining } from "../../utils";
import { useMySubmission } from "../../api/submissions";
import { Spinner } from "../ui";

interface SubmissionsOpenViewProps {
	hours: number;
	minutes: number;
}

/**
 * Submissions open view - shows multi-step submission form
 * Note: Background is handled separately via DashboardLayout
 */
export function SubmissionsOpenView({
	hours,
	minutes,
}: SubmissionsOpenViewProps) {
	const timeRemaining = formatTimeRemaining(hours, minutes);

	const { data: existingSubmission, isLoading, refetch } = useMySubmission();
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<SubmissionFormData | undefined>(
		undefined,
	);
	const [submittedImageUrl, setSubmittedImageUrl] = useState<
		string | undefined
	>(undefined);

	// Sync existing submission data to local state
	useEffect(() => {
		if (existingSubmission) {
			setSubmittedImageUrl(existingSubmission.design_image || undefined);
			setFormData({
				figmaLink: existingSubmission.figma_link,
				designImage: null, // File input can't be prefilled securely
				targetUserAndGoal: existingSubmission.target_user_and_goal,
				layoutExplanation: existingSubmission.layout_explanation,
				styleInterpretation: existingSubmission.style_interpretation,
				keyTradeOff: existingSubmission.key_trade_off,
				originalityConfirmed: existingSubmission.originality_confirmed,
				templateComplianceConfirmed:
					existingSubmission.template_compliance_confirmed,
				futureImprovements: existingSubmission.future_improvements || "",
			});
		}
	}, [existingSubmission]);

	const handleSubmit = (data: SubmissionFormData, imageUrl?: string) => {
		setFormData(data);
		if (imageUrl) {
			setSubmittedImageUrl(imageUrl);
		}
		setIsEditing(false);
		// Refetch to get the latest data from the server
		refetch();
	};

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleCancel = () => {
		setIsEditing(false);
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12">
				<Spinner className="text-[#cbff1f]" size="lg" />
			</div>
		);
	}

	// Show complete view if we have a submission and not editing
	const hasSubmission = !!existingSubmission;
	if (hasSubmission && !isEditing && formData) {
		return (
			<SubmissionComplete
				timeRemaining={timeRemaining}
				imageUrl={submittedImageUrl}
				figmaLink={formData.figmaLink}
				formData={formData}
				onEdit={handleEdit}
			/>
		);
	}

	return (
		<SubmissionForm
			timeRemaining={timeRemaining}
			onSubmit={handleSubmit}
			initialData={formData}
			initialImageUrl={submittedImageUrl}
			existingSubmissionId={existingSubmission?.id}
			onCancel={hasSubmission ? handleCancel : undefined}
		/>
	);
}
