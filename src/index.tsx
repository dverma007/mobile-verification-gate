import React, { useEffect, useMemo, useState } from 'react';

export const DEFAULT_MOBILE_VERIFICATION_GATE_STORAGE_KEY =
  'mobile_verification_gate_after_email_login';

export const MOBILE_VERIFICATION_GATE_COPY: {
  [K in
    | 'title'
    | 'description'
    | 'mobileLabel'
    | 'sendCodeLabel'
    | 'sendingCodeLabel'
    | 'verifyingCodeLabel'
    | 'otpTitle'
    | 'otpDescription'
    | 'otpLabel'
    | 'otpPlaceholder'
    | 'resendLabel'
    | 'skipLabel'
    | 'verifiedMessage'
    | 'skipMessage'
    | 'unverifiedLoginGuidance'
    | 'profilePendingMessage'
    | 'profileEnabledMessage'
    | 'requestCodeError'
    | 'verifyCodeError'
    | 'verificationCodeSentMessage']: string;
} = {
  title: 'Enable mobile login verification',
  description:
    'Add and verify your mobile number so you can sign in faster next time with a 6-digit code.',
  mobileLabel: 'Mobile Number',
  sendCodeLabel: 'Verify',
  sendingCodeLabel: 'Sending code...',
  verifyingCodeLabel: 'Verifying...',
  otpTitle: 'Enter the 6-digit code',
  otpDescription: 'We sent a verification code to your mobile number.',
  otpLabel: 'Verification Code',
  otpPlaceholder: '123456',
  resendLabel: 'Send a new code',
  skipLabel: 'Skip for now',
  verifiedMessage: 'Mobile login is now enabled for this account.',
  skipMessage: 'No problem. We will remind you again the next time you sign in with email.',
  unverifiedLoginGuidance:
    'Sign in with email and we will help you verify your mobile number before you continue.',
  profilePendingMessage:
    'Mobile login is not verified yet. After your next email sign-in, we will walk you through verification.',
  profileEnabledMessage:
    'Your mobile phone number can be used to sign into {{productName}}.',
  requestCodeError: 'Unable to start mobile verification right now.',
  verifyCodeError: 'Unable to verify this code right now.',
  verificationCodeSentMessage: 'Verification code sent.',
};

export type MobileVerificationGateCopy = typeof MOBILE_VERIFICATION_GATE_COPY;
export type MobileVerificationGateAuthMethod = 'email' | 'mobile' | 'unknown';

export type MobileVerificationGateUser = {
  mobile?: string | null;
  mobileVerified?: boolean | null;
};

export type MobileVerificationGateRequestResult<TUser = unknown> = {
  pendingVerification?: boolean;
  alreadyEnabled?: boolean;
  message?: string;
  user?: TUser | null;
};

export type MobileVerificationGateVerifyResult<TUser = unknown> = {
  success?: boolean;
  message?: string;
  user?: TUser | null;
};

export type MobileVerificationGateNotifications = {
  success?: (message: string) => void;
  error?: (message: string) => void;
  info?: (message: string) => void;
};

export type MobileVerificationGateTheme = {
  accentColor?: string;
  surfaceColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  borderColor?: string;
  overlayBackground?: string;
  radius?: number | string;
  zIndex?: number;
};

export function buildMobileVerificationGateCopy(options?: {
  productName?: string;
  overrides?: Partial<MobileVerificationGateCopy>;
}): MobileVerificationGateCopy {
  const nextCopy = {
    ...MOBILE_VERIFICATION_GATE_COPY,
    ...(options?.overrides ?? {}),
  };

  const productName = options?.productName?.trim() || 'the app';
  return {
    ...nextCopy,
    profileEnabledMessage: nextCopy.profileEnabledMessage.replace('{{productName}}', productName),
  };
}

function resolveStorageKey(storageKey?: string): string {
  return storageKey?.trim() || DEFAULT_MOBILE_VERIFICATION_GATE_STORAGE_KEY;
}

export function markMobileVerificationGateForEmailLogin(
  storage?: Storage | null,
  storageKey?: string
): void {
  storage?.setItem(resolveStorageKey(storageKey), 'email');
}

export function clearMobileVerificationGateMarker(
  storage?: Storage | null,
  storageKey?: string
): void {
  storage?.removeItem(resolveStorageKey(storageKey));
}

export function readMobileVerificationGateMarker(
  storage?: Storage | null,
  storageKey?: string
): MobileVerificationGateAuthMethod {
  const value = storage?.getItem(resolveStorageKey(storageKey));
  if (value === 'email' || value === 'mobile') return value;
  return 'unknown';
}

export function shouldOpenMobileVerificationGate(params: {
  lastLoginMethod: MobileVerificationGateAuthMethod;
  mobileVerified?: boolean | null;
}): boolean {
  return params.lastLoginMethod === 'email' && !params.mobileVerified;
}

function defaultStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function toCssValue(value: number | string | undefined, fallback: string): string {
  if (typeof value === 'number') return `${value}px`;
  return value || fallback;
}

export type MobileVerificationGateProps<TUser = unknown> = {
  user?: MobileVerificationGateUser | null;
  isAuthenticated: boolean;
  storage?: Storage | null;
  storageKey?: string;
  productName?: string;
  copy?: Partial<MobileVerificationGateCopy>;
  theme?: MobileVerificationGateTheme;
  normalizePhone: (value: string) => string;
  formatPhone: (value: string) => string;
  requestCode: (
    normalizedMobile: string
  ) => Promise<MobileVerificationGateRequestResult<TUser>>;
  verifyCode: (
    normalizedMobile: string,
    otp: string
  ) => Promise<MobileVerificationGateVerifyResult<TUser>>;
  onVerified?: (payload: {
    normalizedMobile: string;
    message: string;
    user?: TUser | null;
  }) => void | Promise<void>;
  onSkip?: () => void;
  notifications?: MobileVerificationGateNotifications;
};

export function MobileVerificationGate<TUser = unknown>({
  user,
  isAuthenticated,
  storage,
  storageKey,
  productName,
  copy,
  theme,
  normalizePhone,
  formatPhone,
  requestCode,
  verifyCode,
  onVerified,
  onSkip,
  notifications,
}: MobileVerificationGateProps<TUser>) {
  const resolvedCopy = useMemo(
    () => buildMobileVerificationGateCopy({ productName, overrides: copy }),
    [copy, productName]
  );
  const browserStorage = storage ?? defaultStorage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'collect' | 'verify'>('collect');
  const [mobile, setMobile] = useState('');
  const [formattedMobile, setFormattedMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedMobile = useMemo(
    () => normalizePhone(mobile || formattedMobile || user?.mobile || ''),
    [formatPhone, formattedMobile, mobile, normalizePhone, user?.mobile]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      setStep('collect');
      setOtp('');
      setErrorMessage('');
      return;
    }

    const shouldOpen = shouldOpenMobileVerificationGate({
      lastLoginMethod: readMobileVerificationGateMarker(browserStorage, storageKey),
      mobileVerified: user?.mobileVerified,
    });

    if (!shouldOpen) {
      if (user?.mobileVerified) {
        clearMobileVerificationGateMarker(browserStorage, storageKey);
      }
      setOpen(false);
      return;
    }

    const nextMobile = String(user?.mobile || '');
    setMobile(nextMobile);
    setFormattedMobile(formatPhone(nextMobile));
    setOtp('');
    setErrorMessage('');
    setStep('collect');
    setOpen(true);
  }, [browserStorage, formatPhone, isAuthenticated, storageKey, user?.mobile, user?.mobileVerified]);

  const resolvedTheme = {
    accentColor: theme?.accentColor || '#F25202',
    surfaceColor: theme?.surfaceColor || '#FFFFFF',
    textColor: theme?.textColor || '#0F172A',
    mutedTextColor: theme?.mutedTextColor || '#475569',
    borderColor: theme?.borderColor || '#CBD5E1',
    overlayBackground: theme?.overlayBackground || 'rgba(15, 23, 42, 0.56)',
    radius: toCssValue(theme?.radius, '16px'),
    zIndex: theme?.zIndex ?? 2000,
  };

  const handleSkip = () => {
    clearMobileVerificationGateMarker(browserStorage, storageKey);
    setOpen(false);
    setStep('collect');
    setOtp('');
    setErrorMessage('');
    notifications?.info?.(resolvedCopy.skipMessage);
    onSkip?.();
  };

  const handleRequestCode = async () => {
    if (!normalizedMobile) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const result = await requestCode(normalizedMobile);

      if (result.alreadyEnabled || result.user) {
        const successMessage = result.message || resolvedCopy.verifiedMessage;
        await onVerified?.({
          normalizedMobile,
          message: successMessage,
          user: result.user,
        });
        clearMobileVerificationGateMarker(browserStorage, storageKey);
        setOpen(false);
        setStep('collect');
        setOtp('');
        notifications?.success?.(successMessage);
        return;
      }

      if (!result.pendingVerification) {
        throw new Error(result.message || resolvedCopy.requestCodeError);
      }

      setMobile(normalizedMobile);
      setFormattedMobile(formatPhone(normalizedMobile));
      setStep('verify');
      notifications?.success?.(result.message || resolvedCopy.verificationCodeSentMessage);
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : resolvedCopy.requestCodeError;
      setErrorMessage(message);
      notifications?.error?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!normalizedMobile || otp.length < 6) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const result = await verifyCode(normalizedMobile, otp);
      if (result.success === false) {
        throw new Error(result.message || resolvedCopy.verifyCodeError);
      }

      const successMessage = result.message || resolvedCopy.verifiedMessage;
      await onVerified?.({
        normalizedMobile,
        message: successMessage,
        user: result.user,
      });
      clearMobileVerificationGateMarker(browserStorage, storageKey);
      setOpen(false);
      setStep('collect');
      setOtp('');
      notifications?.success?.(successMessage);
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : resolvedCopy.verifyCodeError;
      setErrorMessage(message);
      notifications?.error?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-verification-gate-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: resolvedTheme.zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: resolvedTheme.overlayBackground,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: resolvedTheme.surfaceColor,
          color: resolvedTheme.textColor,
          border: `1px solid ${resolvedTheme.borderColor}`,
          borderRadius: resolvedTheme.radius,
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.24)',
          padding: '20px',
        }}
      >
        <h2 id="mobile-verification-gate-title" style={{ margin: 0, fontSize: '1.25rem' }}>
          {resolvedCopy.title}
        </h2>
        <p
          style={{
            margin: '8px 0 0',
            color: resolvedTheme.mutedTextColor,
            fontSize: '0.95rem',
            lineHeight: 1.5,
          }}
        >
          {resolvedCopy.description}
        </p>

        {step === 'collect' ? (
          <>
            <div style={{ marginTop: '20px' }}>
              <label
                htmlFor="mobile-verification-gate-phone"
                style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}
              >
                {resolvedCopy.mobileLabel}
              </label>
              <input
                id="mobile-verification-gate-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={formattedMobile}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setMobile(nextValue);
                  setFormattedMobile(formatPhone(nextValue));
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="(555) 123-4567"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '12px',
                  border: `1px solid ${resolvedTheme.borderColor}`,
                  padding: '12px 14px',
                  fontSize: '1rem',
                }}
              />
            </div>
            {errorMessage ? (
              <p style={{ margin: '12px 0 0', color: '#B91C1C', fontSize: '0.9rem' }}>
                {errorMessage}
              </p>
            ) : null}
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={handleSkip}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: resolvedTheme.mutedTextColor,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                {resolvedCopy.skipLabel}
              </button>
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={isSubmitting || normalizedMobile.length < 10}
                style={{
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor: resolvedTheme.accentColor,
                  opacity: isSubmitting || normalizedMobile.length < 10 ? 0.6 : 1,
                  cursor: isSubmitting || normalizedMobile.length < 10 ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? resolvedCopy.sendingCodeLabel : resolvedCopy.sendCodeLabel}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginTop: '20px' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{resolvedCopy.otpTitle}</p>
              <p style={{ margin: '6px 0 0', color: resolvedTheme.mutedTextColor }}>
                {resolvedCopy.otpDescription}
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label
                htmlFor="mobile-verification-gate-otp"
                style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}
              >
                {resolvedCopy.otpLabel}
              </label>
              <input
                id="mobile-verification-gate-otp"
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder={resolvedCopy.otpPlaceholder}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '12px',
                  border: `1px solid ${resolvedTheme.borderColor}`,
                  padding: '12px 14px',
                  fontSize: '1rem',
                  letterSpacing: '0.2em',
                }}
              />
            </div>
            {errorMessage ? (
              <p style={{ margin: '12px 0 0', color: '#B91C1C', fontSize: '0.9rem' }}>
                {errorMessage}
              </p>
            ) : null}
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={handleSkip}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: resolvedTheme.mutedTextColor,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                {resolvedCopy.skipLabel}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={isSubmitting}
                  style={{
                    borderRadius: '12px',
                    border: `1px solid ${resolvedTheme.borderColor}`,
                    padding: '12px 14px',
                    backgroundColor: 'transparent',
                    color: resolvedTheme.textColor,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {resolvedCopy.resendLabel}
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isSubmitting || otp.length < 6}
                  style={{
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: resolvedTheme.accentColor,
                    opacity: isSubmitting || otp.length < 6 ? 0.6 : 1,
                    cursor: isSubmitting || otp.length < 6 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? resolvedCopy.verifyingCodeLabel : resolvedCopy.sendCodeLabel}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MobileVerificationGate;
