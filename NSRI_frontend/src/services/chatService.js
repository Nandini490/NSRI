/**
 * chatService.js
 * Communicates with the NSRI AI chat backend endpoint.
 * Follows the same fetch-based pattern as wellnessService.js and dashboardService.js.
 */

const CHAT_URL = '/api/chat/';
const TIMEOUT_MS = 30000;

/**
 * Send a user message to the NSRI AI assistant and return the AI response string.
 *
 * @param {string} message        - The user's question or message.
 * @param {object|null} nsriData  - Optional: the nsri_data object already loaded
 *                                  by the Dashboard from GET /api/v1/nsri/latest.
 *                                  Pass null (or omit) when unavailable.
 *                                  The backend re-validates every field before
 *                                  forwarding anything to Llama.
 * @returns {Promise<string>}     - The assistant's response text.
 * @throws {Error}                - A user-friendly error message string.
 */
export const sendChatMessage = async (message, nsriData = null) => {
  if (!message || !message.trim()) {
    throw new Error('Please enter a message before sending.');
  }

  // Build request body.
  // nsri_context is included only when the dashboard has already loaded
  // NSRI data for this user. The backend treats it as optional — if absent
  // the chatbot behaves as a general educational assistant.
  const body = { message: message.trim() };

  if (nsriData && typeof nsriData === 'object') {
    // Pass only the fields that nsri_context_service.py recognises.
    // All values are re-validated server-side; we do not calculate anything here.
    body.nsri_context = {
      nsri: nsriData.nsri ?? null,
      sai: nsriData.sai ?? null,
      pri: nsriData.pri ?? null,
      rdt: nsriData.rdt ?? null,
      external_stress_score: nsriData.external_stress_score ?? null,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 400) {
      throw new Error('Your message could not be processed. Please try again.');
    }

    if (response.status === 503) {
      throw new Error(
        "I'm unable to connect to the NSRI AI assistant right now. Please make sure the local AI service is running and try again."
      );
    }

    if (!response.ok) {
      throw new Error(
        "I'm unable to connect to the NSRI AI assistant right now. Please make sure the local AI service is running and try again."
      );
    }

    const data = await response.json();
    return data.response || '';
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new Error(
        'The request timed out. The AI service may be busy — please try again in a moment.'
      );
    }

    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(
        "I'm unable to connect to the NSRI AI assistant right now. Please make sure the local AI service is running and try again."
      );
    }

    // Re-throw already user-friendly errors
    throw err;
  }
};
