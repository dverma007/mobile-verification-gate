// src/index.tsx
import { useEffect, useMemo, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var DEFAULT_MOBILE_VERIFICATION_GATE_STORAGE_KEY = "mobile_verification_gate_after_email_login";
var MOBILE_VERIFICATION_GATE_COPY = {
  title: "Enable mobile login verification",
  description: "Add and verify your mobile number so you can sign in faster next time with a 6-digit code.",
  mobileLabel: "Mobile Number",
  sendCodeLabel: "Verify",
  sendingCodeLabel: "Sending code...",
  verifyingCodeLabel: "Verifying...",
  otpTitle: "Enter the 6-digit code",
  otpDescription: "We sent a verification code to your mobile number.",
  otpLabel: "Verification Code",
  otpPlaceholder: "123456",
  resendLabel: "Send a new code",
  skipLabel: "Skip for now",
  verifiedMessage: "Mobile login is now enabled for this account.",
  skipMessage: "No problem. We will remind you again the next time you sign in with email.",
  unverifiedLoginGuidance: "Sign in with email and we will help you verify your mobile number before you continue.",
  profilePendingMessage: "Mobile login is not verified yet. After your next email sign-in, we will walk you through verification.",
  profileEnabledMessage: "Your mobile phone number can be used to sign into {{productName}}.",
  requestCodeError: "Unable to start mobile verification right now.",
  verifyCodeError: "Unable to verify this code right now.",
  verificationCodeSentMessage: "Verification code sent."
};
function buildMobileVerificationGateCopy(options) {
  var _a, _b;
  const nextCopy = {
    ...MOBILE_VERIFICATION_GATE_COPY,
    ...(_a = options == null ? void 0 : options.overrides) != null ? _a : {}
  };
  const productName = ((_b = options == null ? void 0 : options.productName) == null ? void 0 : _b.trim()) || "the app";
  return {
    ...nextCopy,
    profileEnabledMessage: nextCopy.profileEnabledMessage.replace("{{productName}}", productName)
  };
}
function resolveStorageKey(storageKey) {
  return (storageKey == null ? void 0 : storageKey.trim()) || DEFAULT_MOBILE_VERIFICATION_GATE_STORAGE_KEY;
}
function markMobileVerificationGateForEmailLogin(storage, storageKey) {
  storage == null ? void 0 : storage.setItem(resolveStorageKey(storageKey), "email");
}
function clearMobileVerificationGateMarker(storage, storageKey) {
  storage == null ? void 0 : storage.removeItem(resolveStorageKey(storageKey));
}
function readMobileVerificationGateMarker(storage, storageKey) {
  const value = storage == null ? void 0 : storage.getItem(resolveStorageKey(storageKey));
  if (value === "email" || value === "mobile") return value;
  return "unknown";
}
function shouldOpenMobileVerificationGate(params) {
  return params.lastLoginMethod === "email" && !params.mobileVerified;
}
function defaultStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}
function toCssValue(value, fallback) {
  if (typeof value === "number") return `${value}px`;
  return value || fallback;
}
function blurActiveElement() {
  if (typeof document === "undefined") return;
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}
function MobileVerificationGate({
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
  notifications
}) {
  var _a;
  const resolvedCopy = useMemo(
    () => buildMobileVerificationGateCopy({ productName, overrides: copy }),
    [copy, productName]
  );
  const browserStorage = storage != null ? storage : defaultStorage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("collect");
  const [mobile, setMobile] = useState("");
  const [formattedMobile, setFormattedMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const normalizedMobile = useMemo(
    () => normalizePhone(mobile || formattedMobile || (user == null ? void 0 : user.mobile) || ""),
    [formatPhone, formattedMobile, mobile, normalizePhone, user == null ? void 0 : user.mobile]
  );
  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      setStep("collect");
      setOtp("");
      setErrorMessage("");
      return;
    }
    const shouldOpen = shouldOpenMobileVerificationGate({
      lastLoginMethod: readMobileVerificationGateMarker(browserStorage, storageKey),
      mobileVerified: user == null ? void 0 : user.mobileVerified
    });
    if (!shouldOpen) {
      if (user == null ? void 0 : user.mobileVerified) {
        clearMobileVerificationGateMarker(browserStorage, storageKey);
      }
      setOpen(false);
      return;
    }
    const nextMobile = String((user == null ? void 0 : user.mobile) || "");
    setMobile(nextMobile);
    setFormattedMobile(formatPhone(nextMobile));
    setOtp("");
    setErrorMessage("");
    setStep("collect");
    setOpen(true);
  }, [browserStorage, formatPhone, isAuthenticated, storageKey, user == null ? void 0 : user.mobile, user == null ? void 0 : user.mobileVerified]);
  const resolvedTheme = {
    accentColor: (theme == null ? void 0 : theme.accentColor) || "#F25202",
    surfaceColor: (theme == null ? void 0 : theme.surfaceColor) || "#FFFFFF",
    textColor: (theme == null ? void 0 : theme.textColor) || "#0F172A",
    mutedTextColor: (theme == null ? void 0 : theme.mutedTextColor) || "#475569",
    borderColor: (theme == null ? void 0 : theme.borderColor) || "#CBD5E1",
    overlayBackground: (theme == null ? void 0 : theme.overlayBackground) || "rgba(15, 23, 42, 0.56)",
    radius: toCssValue(theme == null ? void 0 : theme.radius, "16px"),
    zIndex: (_a = theme == null ? void 0 : theme.zIndex) != null ? _a : 2e3
  };
  const handleSkip = () => {
    var _a2;
    clearMobileVerificationGateMarker(browserStorage, storageKey);
    setOpen(false);
    setStep("collect");
    setOtp("");
    setErrorMessage("");
    (_a2 = notifications == null ? void 0 : notifications.info) == null ? void 0 : _a2.call(notifications, resolvedCopy.skipMessage);
    onSkip == null ? void 0 : onSkip();
  };
  const handleRequestCode = async () => {
    var _a2, _b, _c;
    if (!normalizedMobile) return;
    blurActiveElement();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const result = await requestCode(normalizedMobile);
      if (result.alreadyEnabled || result.user) {
        const successMessage = result.message || resolvedCopy.verifiedMessage;
        await (onVerified == null ? void 0 : onVerified({
          normalizedMobile,
          message: successMessage,
          user: result.user
        }));
        clearMobileVerificationGateMarker(browserStorage, storageKey);
        setOpen(false);
        setStep("collect");
        setOtp("");
        (_a2 = notifications == null ? void 0 : notifications.success) == null ? void 0 : _a2.call(notifications, successMessage);
        return;
      }
      if (!result.pendingVerification) {
        throw new Error(result.message || resolvedCopy.requestCodeError);
      }
      setMobile(normalizedMobile);
      setFormattedMobile(formatPhone(normalizedMobile));
      setStep("verify");
      (_b = notifications == null ? void 0 : notifications.success) == null ? void 0 : _b.call(notifications, result.message || resolvedCopy.verificationCodeSentMessage);
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : resolvedCopy.requestCodeError;
      setErrorMessage(message);
      (_c = notifications == null ? void 0 : notifications.error) == null ? void 0 : _c.call(notifications, message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleVerify = async () => {
    var _a2, _b;
    if (!normalizedMobile || otp.length < 6) return;
    blurActiveElement();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const result = await verifyCode(normalizedMobile, otp);
      if (result.success === false) {
        throw new Error(result.message || resolvedCopy.verifyCodeError);
      }
      const successMessage = result.message || resolvedCopy.verifiedMessage;
      await (onVerified == null ? void 0 : onVerified({
        normalizedMobile,
        message: successMessage,
        user: result.user
      }));
      clearMobileVerificationGateMarker(browserStorage, storageKey);
      setOpen(false);
      setStep("collect");
      setOtp("");
      (_a2 = notifications == null ? void 0 : notifications.success) == null ? void 0 : _a2.call(notifications, successMessage);
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : resolvedCopy.verifyCodeError;
      setErrorMessage(message);
      (_b = notifications == null ? void 0 : notifications.error) == null ? void 0 : _b.call(notifications, message);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!open) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "mobile-verification-gate-title",
      style: {
        position: "fixed",
        inset: 0,
        zIndex: resolvedTheme.zIndex,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: resolvedTheme.overlayBackground
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            width: "100%",
            maxWidth: "420px",
            backgroundColor: resolvedTheme.surfaceColor,
            color: resolvedTheme.textColor,
            border: `1px solid ${resolvedTheme.borderColor}`,
            borderRadius: resolvedTheme.radius,
            boxShadow: "0 24px 48px rgba(15, 23, 42, 0.24)",
            padding: "20px"
          },
          children: [
            /* @__PURE__ */ jsx("h2", { id: "mobile-verification-gate-title", style: { margin: 0, fontSize: "1.25rem" }, children: resolvedCopy.title }),
            /* @__PURE__ */ jsx(
              "p",
              {
                style: {
                  margin: "8px 0 0",
                  color: resolvedTheme.mutedTextColor,
                  fontSize: "0.95rem",
                  lineHeight: 1.5
                },
                children: resolvedCopy.description
              }
            ),
            step === "collect" ? /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(
              "form",
              {
                onSubmit: (event) => {
                  event.preventDefault();
                  void handleRequestCode();
                },
                children: [
                  /* @__PURE__ */ jsxs("div", { style: { marginTop: "20px" }, children: [
                    /* @__PURE__ */ jsx(
                      "label",
                      {
                        htmlFor: "mobile-verification-gate-phone",
                        style: { display: "block", fontWeight: 600, marginBottom: "8px" },
                        children: resolvedCopy.mobileLabel
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        id: "mobile-verification-gate-phone",
                        type: "tel",
                        inputMode: "tel",
                        autoComplete: "tel",
                        enterKeyHint: "done",
                        value: formattedMobile,
                        onChange: (event) => {
                          const nextValue = event.target.value;
                          setMobile(nextValue);
                          setFormattedMobile(formatPhone(nextValue));
                          if (errorMessage) setErrorMessage("");
                        },
                        placeholder: "(555) 123-4567",
                        style: {
                          width: "100%",
                          boxSizing: "border-box",
                          borderRadius: "12px",
                          border: `1px solid ${resolvedTheme.borderColor}`,
                          padding: "12px 14px",
                          fontSize: "1rem"
                        }
                      }
                    )
                  ] }),
                  errorMessage ? /* @__PURE__ */ jsx("p", { style: { margin: "12px 0 0", color: "#B91C1C", fontSize: "0.9rem" }, children: errorMessage }) : null,
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: {
                        marginTop: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px"
                      },
                      children: [
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: handleSkip,
                            style: {
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              color: resolvedTheme.mutedTextColor,
                              textDecoration: "underline",
                              cursor: "pointer"
                            },
                            children: resolvedCopy.skipLabel
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "submit",
                            onTouchEnd: () => {
                              blurActiveElement();
                            },
                            onPointerDown: () => {
                              blurActiveElement();
                            },
                            disabled: isSubmitting || normalizedMobile.length < 10,
                            style: {
                              border: "none",
                              borderRadius: "12px",
                              padding: "12px 16px",
                              fontWeight: 600,
                              color: "#FFFFFF",
                              backgroundColor: resolvedTheme.accentColor,
                              opacity: isSubmitting || normalizedMobile.length < 10 ? 0.6 : 1,
                              cursor: isSubmitting || normalizedMobile.length < 10 ? "not-allowed" : "pointer",
                              touchAction: "manipulation",
                              WebkitAppearance: "none"
                            },
                            children: isSubmitting ? resolvedCopy.sendingCodeLabel : resolvedCopy.sendCodeLabel
                          }
                        )
                      ]
                    }
                  )
                ]
              }
            ) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { style: { marginTop: "20px" }, children: [
                /* @__PURE__ */ jsx("p", { style: { margin: 0, fontWeight: 600 }, children: resolvedCopy.otpTitle }),
                /* @__PURE__ */ jsx("p", { style: { margin: "6px 0 0", color: resolvedTheme.mutedTextColor }, children: resolvedCopy.otpDescription })
              ] }),
              /* @__PURE__ */ jsxs(
                "form",
                {
                  onSubmit: (event) => {
                    event.preventDefault();
                    void handleVerify();
                  },
                  children: [
                    /* @__PURE__ */ jsxs("div", { style: { marginTop: "16px" }, children: [
                      /* @__PURE__ */ jsx(
                        "label",
                        {
                          htmlFor: "mobile-verification-gate-otp",
                          style: { display: "block", fontWeight: 600, marginBottom: "8px" },
                          children: resolvedCopy.otpLabel
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          id: "mobile-verification-gate-otp",
                          type: "tel",
                          inputMode: "numeric",
                          autoComplete: "one-time-code",
                          enterKeyHint: "done",
                          value: otp,
                          onChange: (event) => {
                            setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                            if (errorMessage) setErrorMessage("");
                          },
                          placeholder: resolvedCopy.otpPlaceholder,
                          style: {
                            width: "100%",
                            boxSizing: "border-box",
                            borderRadius: "12px",
                            border: `1px solid ${resolvedTheme.borderColor}`,
                            padding: "12px 14px",
                            fontSize: "1rem",
                            letterSpacing: "0.2em"
                          }
                        }
                      )
                    ] }),
                    errorMessage ? /* @__PURE__ */ jsx("p", { style: { margin: "12px 0 0", color: "#B91C1C", fontSize: "0.9rem" }, children: errorMessage }) : null,
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        style: {
                          marginTop: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px"
                        },
                        children: [
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              onClick: handleSkip,
                              style: {
                                background: "transparent",
                                border: "none",
                                padding: 0,
                                color: resolvedTheme.mutedTextColor,
                                textDecoration: "underline",
                                cursor: "pointer"
                              },
                              children: resolvedCopy.skipLabel
                            }
                          ),
                          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
                            /* @__PURE__ */ jsx(
                              "button",
                              {
                                type: "button",
                                onClick: handleRequestCode,
                                disabled: isSubmitting,
                                style: {
                                  borderRadius: "12px",
                                  border: `1px solid ${resolvedTheme.borderColor}`,
                                  padding: "12px 14px",
                                  backgroundColor: "transparent",
                                  color: resolvedTheme.textColor,
                                  cursor: isSubmitting ? "not-allowed" : "pointer",
                                  touchAction: "manipulation",
                                  WebkitAppearance: "none"
                                },
                                children: resolvedCopy.resendLabel
                              }
                            ),
                            /* @__PURE__ */ jsx(
                              "button",
                              {
                                type: "submit",
                                onTouchEnd: () => {
                                  blurActiveElement();
                                },
                                onPointerDown: () => {
                                  blurActiveElement();
                                },
                                disabled: isSubmitting || otp.length < 6,
                                style: {
                                  border: "none",
                                  borderRadius: "12px",
                                  padding: "12px 16px",
                                  fontWeight: 600,
                                  color: "#FFFFFF",
                                  backgroundColor: resolvedTheme.accentColor,
                                  opacity: isSubmitting || otp.length < 6 ? 0.6 : 1,
                                  cursor: isSubmitting || otp.length < 6 ? "not-allowed" : "pointer",
                                  touchAction: "manipulation",
                                  WebkitAppearance: "none"
                                },
                                children: isSubmitting ? resolvedCopy.verifyingCodeLabel : resolvedCopy.sendCodeLabel
                              }
                            )
                          ] })
                        ]
                      }
                    )
                  ]
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
var index_default = MobileVerificationGate;
export {
  DEFAULT_MOBILE_VERIFICATION_GATE_STORAGE_KEY,
  MOBILE_VERIFICATION_GATE_COPY,
  MobileVerificationGate,
  buildMobileVerificationGateCopy,
  clearMobileVerificationGateMarker,
  index_default as default,
  markMobileVerificationGateForEmailLogin,
  readMobileVerificationGateMarker,
  shouldOpenMobileVerificationGate
};
