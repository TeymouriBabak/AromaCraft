import { SmsProvider } from '../smsProvider'

/**
 * Determine the appropriate SMS mock endpoint
 * - In Docker: Use service name (mock-sms:3000)
 * - Locally: Use host IP (127.0.0.1:3010)
 * 
 * Detection: Check environment variables or runtime indicators
 */
function getSmsEndpoint(): string {
  // Prefer explicit SMS_MOCK_URL
  if (process.env.SMS_MOCK_URL) return process.env.SMS_MOCK_URL
  // When running inside Docker, default to service name
  if (process.env.DOCKER_ENVIRONMENT === 'true') return 'http://sms-mock:3001'
  // Local default
  return 'http://localhost:3001'
}

export const mockSmsProvider: SmsProvider = {
  sendSms: async (to, message) => {
    const endpoint = getSmsEndpoint()
    try {
      const res = await fetch(`${endpoint.replace(/\/$/, '')}/send`, { method: 'POST', body: JSON.stringify({ to, body: message }), headers: { 'content-type': 'application/json' } })
      if (!res.ok) {
        console.warn(`[sms] mock endpoint responded ${res.status}`)
      }
    } catch (err) {
      console.warn(`[sms] Failed to send to ${endpoint}:`, err instanceof Error ? err.message : 'Unknown error')
      // Best-effort delivery; don't throw
    }
  },
}
