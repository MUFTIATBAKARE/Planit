import { FirebaseError } from "firebase/app";

/**
 * Maps Firebase Auth error codes to human readable, screen-reader friendly copy.
 * Never leaks raw credential details back to the UI.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use":
    "That email is already registered. Sign in instead.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-password": "Enter your password.",
  "auth/weak-password": "Use at least 6 characters for your password.",
  "auth/user-not-found": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests":
    "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
  "auth/operation-not-allowed":
    "Email sign-in is disabled for this project. Enable it in the Firebase console.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return (
      AUTH_ERROR_MESSAGES[error.code] ??
      "Something went wrong while authenticating. Please try again."
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
