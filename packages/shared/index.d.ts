export const PASSWORD_MIN_LENGTH: number;
export const STRONG_PASSWORD: RegExp;
export function validatePasswordStrength(password: unknown): {
  ok: boolean;
  code?: string;
  message?: string;
};
export function passwordRequirementsShort(): string;
export function isValidLoginEmail(s: unknown): boolean;
