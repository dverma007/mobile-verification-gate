import * as react_jsx_runtime from 'react/jsx-runtime';

declare const DEFAULT_MOBILE_VERIFICATION_GATE_STORAGE_KEY = "mobile_verification_gate_after_email_login";
declare const MOBILE_VERIFICATION_GATE_COPY: {
    [K in 'title' | 'description' | 'mobileLabel' | 'sendCodeLabel' | 'sendingCodeLabel' | 'verifyingCodeLabel' | 'otpTitle' | 'otpDescription' | 'otpLabel' | 'otpPlaceholder' | 'resendLabel' | 'skipLabel' | 'verifiedMessage' | 'skipMessage' | 'unverifiedLoginGuidance' | 'profilePendingMessage' | 'profileEnabledMessage' | 'requestCodeError' | 'verifyCodeError' | 'verificationCodeSentMessage']: string;
};
type MobileVerificationGateCopy = typeof MOBILE_VERIFICATION_GATE_COPY;
type MobileVerificationGateAuthMethod = 'email' | 'mobile' | 'unknown';
type MobileVerificationGateUser = {
    mobile?: string | null;
    mobileVerified?: boolean | null;
};
type MobileVerificationGateRequestResult<TUser = unknown> = {
    pendingVerification?: boolean;
    alreadyEnabled?: boolean;
    message?: string;
    user?: TUser | null;
};
type MobileVerificationGateVerifyResult<TUser = unknown> = {
    success?: boolean;
    message?: string;
    user?: TUser | null;
};
type MobileVerificationGateNotifications = {
    success?: (message: string) => void;
    error?: (message: string) => void;
    info?: (message: string) => void;
};
type MobileVerificationGateTheme = {
    accentColor?: string;
    surfaceColor?: string;
    textColor?: string;
    mutedTextColor?: string;
    borderColor?: string;
    overlayBackground?: string;
    radius?: number | string;
    zIndex?: number;
};
declare function buildMobileVerificationGateCopy(options?: {
    productName?: string;
    overrides?: Partial<MobileVerificationGateCopy>;
}): MobileVerificationGateCopy;
declare function markMobileVerificationGateForEmailLogin(storage?: Storage | null, storageKey?: string): void;
declare function clearMobileVerificationGateMarker(storage?: Storage | null, storageKey?: string): void;
declare function readMobileVerificationGateMarker(storage?: Storage | null, storageKey?: string): MobileVerificationGateAuthMethod;
declare function shouldOpenMobileVerificationGate(params: {
    lastLoginMethod: MobileVerificationGateAuthMethod;
    mobileVerified?: boolean | null;
}): boolean;
type MobileVerificationGateProps<TUser = unknown> = {
    user?: MobileVerificationGateUser | null;
    isAuthenticated: boolean;
    storage?: Storage | null;
    storageKey?: string;
    productName?: string;
    copy?: Partial<MobileVerificationGateCopy>;
    theme?: MobileVerificationGateTheme;
    normalizePhone: (value: string) => string;
    formatPhone: (value: string) => string;
    requestCode: (normalizedMobile: string) => Promise<MobileVerificationGateRequestResult<TUser>>;
    verifyCode: (normalizedMobile: string, otp: string) => Promise<MobileVerificationGateVerifyResult<TUser>>;
    onVerified?: (payload: {
        normalizedMobile: string;
        message: string;
        user?: TUser | null;
    }) => void | Promise<void>;
    onSkip?: () => void;
    notifications?: MobileVerificationGateNotifications;
};
declare function MobileVerificationGate<TUser = unknown>({ user, isAuthenticated, storage, storageKey, productName, copy, theme, normalizePhone, formatPhone, requestCode, verifyCode, onVerified, onSkip, notifications, }: MobileVerificationGateProps<TUser>): react_jsx_runtime.JSX.Element | null;

export { DEFAULT_MOBILE_VERIFICATION_GATE_STORAGE_KEY, MOBILE_VERIFICATION_GATE_COPY, MobileVerificationGate, type MobileVerificationGateAuthMethod, type MobileVerificationGateCopy, type MobileVerificationGateNotifications, type MobileVerificationGateProps, type MobileVerificationGateRequestResult, type MobileVerificationGateTheme, type MobileVerificationGateUser, type MobileVerificationGateVerifyResult, buildMobileVerificationGateCopy, clearMobileVerificationGateMarker, MobileVerificationGate as default, markMobileVerificationGateForEmailLogin, readMobileVerificationGateMarker, shouldOpenMobileVerificationGate };
