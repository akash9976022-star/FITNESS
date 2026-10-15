/**
 * FitMaintenance AI - Messaging Webhooks & Edge Dispatcher Architecture
 * Supporting Twilio Programmable Messaging (SMS) & WhatsApp Business Cloud API
 */

export interface SmsPayload {
  to: string; // E.164 phone number format (e.g. "+1234567890" or "+919876543210")
  body: string;
  senderId?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppPayload {
  to: string; // E.164 recipient phone number
  messageType: 'template' | 'text';
  templateName?: string;
  templateLanguage?: string;
  body?: string;
  parameters?: string[];
}

export interface WebhookDispatchResult {
  success: boolean;
  messageId?: string;
  provider: 'twilio_sms' | 'whatsapp_cloud_api' | 'simulation';
  status: 'sent' | 'queued' | 'simulated' | 'failed';
  error?: string;
  timestamp: string;
}

/**
 * Dispatch an SMS reminder via Twilio (or configured backend Cloud Function webhook)
 */
export const dispatchSmsReminder = async (
  payload: SmsPayload,
  webhookEndpoint?: string
): Promise<WebhookDispatchResult> => {
  const timestamp = new Date().toISOString();

  // If a production Cloud Function / Twilio endpoint is provided
  if (webhookEndpoint) {
    try {
      const response = await fetch(webhookEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }

      const resData = await response.json();
      return {
        success: true,
        messageId: resData.sid || resData.id || `sms_${Date.now()}`,
        provider: 'twilio_sms',
        status: 'sent',
        timestamp,
      };
    } catch (err: any) {
      console.error('Twilio SMS webhook dispatch error:', err);
      return {
        success: false,
        provider: 'twilio_sms',
        status: 'failed',
        error: err.message,
        timestamp,
      };
    }
  }

  // Simulation mode (architecture ready)
  console.info(`[SMS SIMULATION] Dispatched to ${payload.to}: "${payload.body}"`);
  return {
    success: true,
    messageId: `sim_sms_${Date.now()}`,
    provider: 'simulation',
    status: 'simulated',
    timestamp,
  };
};

/**
 * Dispatch a WhatsApp notification via WhatsApp Business API / Twilio WhatsApp
 */
export const dispatchWhatsAppReminder = async (
  payload: WhatsAppPayload,
  webhookEndpoint?: string
): Promise<WebhookDispatchResult> => {
  const timestamp = new Date().toISOString();

  if (webhookEndpoint) {
    try {
      const response = await fetch(webhookEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }

      const resData = await response.json();
      return {
        success: true,
        messageId: resData.messages?.[0]?.id || `wa_${Date.now()}`,
        provider: 'whatsapp_cloud_api',
        status: 'sent',
        timestamp,
      };
    } catch (err: any) {
      console.error('WhatsApp webhook dispatch error:', err);
      return {
        success: false,
        provider: 'whatsapp_cloud_api',
        status: 'failed',
        error: err.message,
        timestamp,
      };
    }
  }

  // Simulation mode (architecture ready)
  console.info(`[WHATSAPP SIMULATION] Dispatched to ${payload.to}: ${payload.body || payload.templateName}`);
  return {
    success: true,
    messageId: `sim_wa_${Date.now()}`,
    provider: 'simulation',
    status: 'simulated',
    timestamp,
  };
};

/**
 * Sample backend Cloud Function snippet (Node.js / Express / Firebase Functions)
 * Reference implementation for connecting Twilio or WhatsApp Business Cloud API:
 *
 * ```javascript
 * const functions = require('firebase-functions');
 * const twilio = require('twilio');
 * const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 *
 * exports.sendFitnessSms = functions.https.onRequest(async (req, res) => {
 *   const { to, body } = req.body;
 *   try {
 *     const message = await client.messages.create({
 *       body: body,
 *       from: process.env.TWILIO_PHONE_NUMBER,
 *       to: to
 *     });
 *     res.json({ success: true, sid: message.sid });
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 * ```
 */
