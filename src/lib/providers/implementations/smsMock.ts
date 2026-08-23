import { SmsProvider } from '../smsProvider';

/**
 * Determine the appropriate SMS mock endpoint.
 * Priority: SMS_MOCK_URL env var → Docker default → local default
 */
function getSmsEndpoint(): string {
  if (process.env.SMS_MOCK_URL) return process.env.SMS_MOCK_URL;
  if (process.env.DOCKER_ENVIRONMENT === 'true') return 'http://mock-sms:3000';
  return 'http://localhost:3001';
}

export const mockSmsProvider: SmsProvider = {
  sendSms: async (to, message) => {
    const endpoint = getSmsEndpoint();
    try {
      const res = await fetch(`${endpoint.replace(/\/$/, '')}/sms`, {
        method: 'POST',
        body: JSON.stringify({ to, body: message }),
        headers: { 'content-type': 'application/json' },
      });
      if (!res.ok) {
        console.warn(`[sms] mock endpoint responded ${res.status}`);
      }
    } catch (err) {
      console.warn(
        `[sms] Failed to send to ${endpoint}:`,
        err instanceof Error ? err.message : 'Unknown error'
      );
      // Best-effort delivery; don't throw
    }
  },
};
