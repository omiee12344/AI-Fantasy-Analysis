// Firebase Authentication Error Codes and User-Friendly Messages
export const FIREBASE_AUTH_ERRORS = {
  // User cancellation errors (should not show error messages)
  'auth/popup-closed-by-user': 'Sign-in cancelled',
  'auth/cancelled-popup-request': 'Sign-in cancelled',
  'auth/popup-blocked': 'Sign-in popup was blocked',
  
  // Common authentication errors
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/invalid-email': 'Invalid email address',
  'auth/weak-password': 'Password is too weak',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'auth/operation-not-allowed': 'This sign-in method is not enabled',
  'auth/user-disabled': 'This account has been disabled',
  'auth/invalid-credential': 'Invalid credentials',
  
  // Google-specific errors
  'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials',
  'auth/requires-recent-login': 'Please sign in again to continue',
  
  // Firestore permission errors
  'firestore/permission-denied': 'Database access issue - please contact support',
  'firestore/unavailable': 'Database temporarily unavailable',
  
  // Default error
  'default': 'Authentication failed. Please try again'
};

// Get user-friendly error message from Firebase error code
export const getFirebaseErrorMessage = (errorCode: string): string => {
  return FIREBASE_AUTH_ERRORS[errorCode as keyof typeof FIREBASE_AUTH_ERRORS] || FIREBASE_AUTH_ERRORS.default;
};

// Check if error is a user cancellation (should not show error message)
export const isUserCancellation = (errorCode: string): boolean => {
  return ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/popup-blocked'].includes(errorCode);
};

// Check if error should be shown to user
export const shouldShowError = (errorCode: string): boolean => {
  return !isUserCancellation(errorCode);
};
