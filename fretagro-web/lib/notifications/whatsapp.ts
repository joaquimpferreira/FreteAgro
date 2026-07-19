// lib/notifications/whatsapp.ts — provider-agnostic WhatsApp notification module
// FR-006: drivers receive an activation invite via WhatsApp when the owner registers them.
// This module wraps the HTTP call to the configured provider (e.g. Twilio, Zapi, etc.).
// Set WHATSAPP_API_URL and WHATSAPP_API_TOKEN in .env.local (see .env.example).

export interface WhatsAppMessage {
  to: string   // destination phone number with country code, e.g. "5511999999999"
  body: string // message text
}

export interface WhatsAppResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Sends a WhatsApp message via the configured provider API.
 * Server-side only — WHATSAPP_API_TOKEN MUST NOT be exposed to the browser.
 *
 * Returns { success: true } on delivery acceptance or
 * { success: false, error } on failure without throwing (callers decide how to handle).
 */
export async function sendWhatsApp(message: WhatsAppMessage): Promise<WhatsAppResult> {
  const apiUrl   = process.env.WHATSAPP_API_URL
  const apiToken = process.env.WHATSAPP_API_TOKEN

  if (!apiUrl || !apiToken) {
    // In development / CI without the variables set, log and return gracefully
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[WhatsApp] WHATSAPP_API_URL or WHATSAPP_API_TOKEN not set — message skipped:', message)
      return { success: true, messageId: 'dev-skipped' }
    }
    return { success: false, error: 'WhatsApp provider not configured.' }
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        to:   message.to,
        type: 'text',
        text: { body: message.body },
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return { success: false, error: `Provider returned ${response.status}: ${text}` }
    }

    const data = await response.json().catch(() => ({}))
    return { success: true, messageId: data?.messages?.[0]?.id ?? data?.id ?? 'sent' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Sends the driver login credentials notification.
 * Called from POST /api/motoristas when the fleet owner registers a new driver.
 *
 * @param whatsapp       - Driver's 11-digit Brazilian phone number (digits only)
 * @param nomeMotorista  - Driver's name for personalisation
 * @param email          - Login e-mail set by the fleet owner
 * @param appName        - App name or URL shown in the message
 */
export async function sendDriverInvite(
  whatsapp: string,
  nomeMotorista: string,
  email: string,
  appName: string,
): Promise<WhatsAppResult> {
  // Strip non-digits and prepend Brazilian country code
  const digits = whatsapp.replace(/\D/g, '')
  const to = digits.startsWith('55') ? digits : `55${digits}`

  const body =
    `Olá, ${nomeMotorista}! 🚛\n\n` +
    `Você foi cadastrado no FreteAgro. Acesse ${appName} e faça login com:\n\n` +
    `📧 E-mail: ${email}\n` +
    `🔑 Senha: definida pelo dono da frota\n\n` +
    `Em caso de dúvidas, fale com o dono da frota.`

  return sendWhatsApp({ to, body })
}
