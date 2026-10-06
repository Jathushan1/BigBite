export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'CARD'

export function cardBrand(number: string): CardBrand {
  const digits = number.replace(/\D/g, '')
  if (digits.startsWith('4')) return 'VISA'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MASTERCARD'
  if (/^3[47]/.test(digits)) return 'AMEX'
  return 'CARD'
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

export function passesLuhn(number: string): boolean {
  const digits = number.replace(/\D/g, '')
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return digits.length >= 13 && sum % 10 === 0
}

/** Mock gateway test cards (see backend MockPaymentGateway). */
export const TEST_CARDS = [
  { number: '4242 4242 4242 4242', result: 'Approved', tone: 'success' as const },
  { number: '4000 0000 0000 0002', result: 'Declined', tone: 'error' as const },
  { number: '4000 0000 0000 9995', result: 'Insufficient funds', tone: 'error' as const },
  { number: '4000 0000 0000 0069', result: 'Expired card', tone: 'error' as const },
]
