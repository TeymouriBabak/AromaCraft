import { parsePhoneNumberFromString } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'

export function normalizeMobile(input?: string, defaultCountry: CountryCode = 'US'): string | null {
  if (!input) return null
  const cleaned = input.replace(/[^+0-9]/g, '')
  const pn = parsePhoneNumberFromString(cleaned, defaultCountry)
  if (!pn || !pn.isValid()) return null
  return pn.number // E.164
}

export function sanitizeMobileForSearch(mobile?: string) {
  const norm = normalizeMobile(mobile)
  if (!norm) return null
  // remove leading + for DB searches if stored without plus
  return norm.replace(/^\+/, '')
}
