/** Roles that can sign into the admin dashboard. */
export const ADMIN_ROLES = ['admin', 'instructor'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Admin',
  instructor: 'Instructor',
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  admin: 'Full access to every module and platform setting.',
  instructor: 'Can manage lessons and cultural content, and view the overview.',
};

/** An existing dashboard account (admin or instructor). */
export interface AdminAccount {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  avatarUrl: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

export const ADMIN_INVITATION_STATUSES = ['pending', 'accepted', 'expired'] as const;
export type AdminInvitationStatus = (typeof ADMIN_INVITATION_STATUSES)[number];

/** A pending/accepted invitation to join the dashboard. */
export interface AdminInvitation {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  country: string | null;
  status: AdminInvitationStatus;
  invitedByName: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface CreateAdminInvitation {
  email: string;
  displayName: string;
  role: AdminRole;
  country?: string | null;
}

/** Public details surfaced on the registration screen for a given token. */
export interface AdminInvitationPreview {
  email: string;
  displayName: string;
  role: AdminRole;
  country: string | null;
  status: AdminInvitationStatus;
}

export interface AcceptAdminInvitation {
  token: string;
  password: string;
}
