export const SRI_LANKAN_PHONE_REGEX = /^(?:\+94|0)[1-9][0-9]{8}$/
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
export const NAME_REGEX = /^[a-zA-Z ]+$/
export const PASSWORD_RULE =
  'At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol (@$!%*?&#).'

export interface PasswordCheck {
  label: string
  ok: boolean
}

export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Symbol @$!%*?&#', ok: /[@$!%*?&#]/.test(password) },
  ]
}
