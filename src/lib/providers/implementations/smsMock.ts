import { SmsProvider } from '../smsProvider'

/**
 * Determine the appropriate SMS mock endpoint
 * - In Docker: Use service name (mock-sms:3000)
 * - Locally: Use host IP (127.0.0.1:3010)
 * 
 * Detection: Check environment variables or runtime indicators
 */
function getSmsEndpoint(): string {
  // Check if explicitly configured for Docker
  if (process.env.SMS_MOCK_ENDPOINT_DOCKER && process.env.DOCKER_ENVIRONMENT === 'true') {
    return process.env.SMS_MOCK_ENDPOINT_DOCKER
  }
  
  // Check if SMS_MOCK_ENDPOINT is explicitly set (local development)
  if (process.env.SMS_MOCK_ENDPOINT) {
    return process.env.SMS_MOCK_ENDPOINT
  }
  
  // Default fallback to Docker service name (used inside containers)
  return 'http://mock-sms:3000/sms'
}

export const mockSmsProvider: SmsProvider = {
  sendSms: async (to, message) => {
    const endpoint = getSmsEndpoint()
    try {
      await fetch(endpoint, { method: 'POST', body: JSON.stringify({ to, message }), headers: { 'content-type': 'application/json' } })
    } catch (err) {
      console.warn(`[sms] Failed to send to ${endpoint}:`, err instanceof Error ? err.message : 'Unknown error')
      // Best-effort delivery; don't throw
    }
  },
}
