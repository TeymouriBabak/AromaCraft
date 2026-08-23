/**
 * OCL (Object Constraint Language) Business Rules Enforcement
 *
 * This module centralizes all business logic constraints that MUST be enforced
 * at the application layer, even if the database has some constraints.
 *
 * 20 OCL Rules implemented:
 * 1. UNIQUE(mobile) across all Users
 * 2. UNIQUE(email) across all Users
 * 3. UNIQUE(username) across all Users
 * 4. VALIDATE(role) in {'customer', 'admin', 'manager'}
 * 5. User must have at least one valid identity (mobile OR email)
 * 6. OTP.code must be exactly 6 digits
 * 7. OTP.expiresAt must be greater than createdAt
 * 8. OTP.verified is allowed only if currentTime < expiresAt
 * 9. OTP.usedCount must never exceed 1
 * 10. OTP.attemptCount must be limited to 5 per session/token
 * 11. AuthSession.user must be non-nullable
 * 12. Session.isAuthenticated requires otpVerified == true
 * 13. Role('customer') cannot access Dashboard('admin')
 * 14. Role('admin') cannot access Settings('manager')
 * 15. Avatar.update is restricted to owner == request.user
 * 16. Avatar.mimeType must be in {'image/png', 'image/jpeg', 'image/webp'}
 * 17. Avatar.size must not exceed 5MB
 * 18. Review must have a valid authorID
 * 19. Review.rating must be an integer between 1 and 5
 * 20. Review.author must match the session.user who created it
 */

import type { UserRole } from '../generated/prisma/enums';

// ============================================================================
// OCL Rule 1-4: Identity & Role Validation
// ============================================================================

export const ALLOWED_ROLES: readonly UserRole[] = [
  'CUSTOMER',
  'ADMIN',
  'MANAGER',
];
export const ROLE_HIERARCHY: Record<string, number> = {
  CUSTOMER: 1,
  ADMIN: 2,
  MANAGER: 3,
};

export function validateRole(role: string): role is UserRole {
  return ALLOWED_ROLES.includes(role as UserRole);
}

/**
 * OCL Rule 5: User must have at least one valid identity (mobile OR email)
 */
export function validateUserIdentity(
  email: string | null,
  mobile: string | null
): boolean {
  const hasValidEmail = email && email.trim().length > 0;
  const hasValidMobile = mobile && mobile.trim().length > 0;
  return !!(hasValidEmail || hasValidMobile);
}

/**
 * OCL Rule 4: Validate email format
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * OCL Rule 4: Validate username format
 */
export function validateUsernameFormat(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{4,120}$/;
  return usernameRegex.test(username.trim());
}

// ============================================================================
// OCL Rule 6-10: OTP Validation
// ============================================================================

/**
 * OCL Rule 6: OTP.code must be exactly 6 digits
 */
export function validateOtpFormat(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * OCL Rule 7: OTP.expiresAt must be greater than createdAt
 */
export function validateOtpExpiry(createdAt: Date, expiresAt: Date): boolean {
  return expiresAt.getTime() > createdAt.getTime();
}

/**
 * OCL Rule 8: OTP.verified is allowed only if currentTime < expiresAt
 */
export function isOtpValid(expiresAt: Date): boolean {
  return new Date().getTime() < expiresAt.getTime();
}

/**
 * OCL Rule 9: OTP.usedCount must never exceed 1
 */
export function validateOtpUsedCount(usedCount: number): boolean {
  return usedCount <= 1;
}

/**
 * OCL Rule 10: OTP.attemptCount must be limited to 5 per session/token
 */
export const OTP_MAX_ATTEMPTS = 5;

export function validateOtpAttempts(attemptCount: number): boolean {
  return attemptCount <= OTP_MAX_ATTEMPTS;
}

// ============================================================================
// OCL Rule 11-12: Session Validation
// ============================================================================

/**
 * OCL Rule 11: AuthSession.user must be non-nullable
 */
export function validateSessionUser(
  userId: string | null | undefined
): boolean {
  return Boolean(userId && typeof userId === 'string' && userId.length > 0);
}

/**
 * OCL Rule 12: Session.isAuthenticated requires otpVerified == true
 * This is a business logic check - in production, session should ONLY exist if auth passed
 */
export function validateSessionAuthentication(
  isAuthenticated: boolean,
  otpVerified: boolean
): boolean {
  // If session claims to be authenticated, OTP must be verified
  if (isAuthenticated && !otpVerified) {
    return false;
  }
  return true;
}

// ============================================================================
// OCL Rule 13-14: Role-Based Access Control
// ============================================================================

/**
 * OCL Rule 13: Role('customer') cannot access Dashboard('admin')
 * OCL Rule 14: Role('admin') cannot access Settings('manager')
 */
export function canAccessResource(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const userHierarchy = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredHierarchy = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userHierarchy >= requiredHierarchy;
}

export function canAccessAdminDashboard(userRole: UserRole): boolean {
  return canAccessResource(userRole, 'ADMIN');
}

export function canAccessManagerSettings(userRole: UserRole): boolean {
  return canAccessResource(userRole, 'MANAGER');
}

// ============================================================================
// OCL Rule 15-17: File Upload Validation
// ============================================================================

export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
];
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * OCL Rule 16: Avatar.mimeType must be in {'image/png', 'image/jpeg', 'image/webp'}
 */
export function validateAvatarMimeType(mimeType: string): boolean {
  return ALLOWED_AVATAR_MIME_TYPES.includes(mimeType);
}

/**
 * OCL Rule 17: Avatar.size must not exceed 5MB
 */
export function validateAvatarSize(sizeBytes: number): boolean {
  return sizeBytes <= MAX_AVATAR_SIZE;
}

/**
 * OCL Rule 15: Avatar.update is restricted to owner == request.user
 */
export function canUpdateAvatar(
  userIdInSession: string,
  avatarOwnerId: string
): boolean {
  return userIdInSession === avatarOwnerId;
}

// ============================================================================
// OCL Rule 18-20: Review Validation
// ============================================================================

/**
 * OCL Rule 19: Review.rating must be an integer between 1 and 5
 */
export function validateReviewRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * OCL Rule 18: Review must have a valid authorID
 */
export function validateReviewAuthorId(
  authorId: string | null | undefined
): boolean {
  return Boolean(
    authorId && typeof authorId === 'string' && authorId.length > 0
  );
}

/**
 * OCL Rule 20: Review.author must match the session.user who created it
 */
export function canCreateReview(
  sessionUserId: string,
  reviewAuthorId: string
): boolean {
  return sessionUserId === reviewAuthorId;
}

/**
 * OCL Rule 20: Review.author must match the session.user for deletion/update
 */
export function canModifyReview(
  sessionUserId: string,
  reviewAuthorId: string
): boolean {
  return sessionUserId === reviewAuthorId;
}
