import { SubmissionForm, type SubmissionFormData } from "../forms";
import { formatTimeRemaining } from "../../utils";
import { toast } from "react-hot-toast";

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

	const handleSubmit = (data: SubmissionFormData) => {
		console.log("Submission data:", {
			figmaLink: data.figmaLink,
			hasImage: !!data.designImage,
			imageName: data.designImage?.name,
			targetUserAndGoal: data.targetUserAndGoal,
			layoutExplanation: data.layoutExplanation,
			styleInterpretation: data.styleInterpretation,
			keyTradeOff: data.keyTradeOff,
			originalityConfirmed: data.originalityConfirmed,
			templateComplianceConfirmed: data.templateComplianceConfirmed,
			futureImprovements: data.futureImprovements || "(not provided)",
		});
		const loadingToast = toast.loading("Uploading your submission...");
		try {
			// TODO: Implement submission API call
			toast.success("Submission successful! Good luck.", { id: loadingToast });
		} catch (error) {
			toast.error("Upload failed. Please check your connection.", { id: loadingToast });
		}
	};

	return (
		<SubmissionForm timeRemaining={timeRemaining} onSubmit={handleSubmit} />
	);
}
