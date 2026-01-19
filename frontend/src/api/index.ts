export {
    authApiKeys,
    type CurrentUserResponse,
    getCurrentUser,
    type LoginRequest,
    type LoginResponse,
    type ResendOtpRequest,
    type ResendOtpResponse,
    type SendOtpRequest,
    type SendOtpResponse,
    useRequestOtp,
    useResendOtp,
    useVerifyOtp,
} from "./auth";

export {
    type CompetitionConfig,
    type CompetitionState,
    type CompetitionStatus,
    configKeys,
    getCompetitionStatus,
    useCompetitionConfig,
} from "./config";
