/**
 * Veroxa API Client Service
 * Connects the Frontend to the FastAPI AI Matching Backend and PayPal Escrow Sandbox.
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

export interface MatchingApiPayload {
  dispute_id: string;
  ordered_product: {
    title: string;
    brand?: string;
    model?: string;
    sku?: string;
    attributes?: Record<string, any>;
  };
  received_product?: {
    title: string;
    brand?: string;
    model?: string;
    sku?: string;
    attributes?: Record<string, any>;
  };
  buyer_claim?: string;
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/matching/health`);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: String(err) };
  }
}

export async function runLiveAiMatching(payload: MatchingApiPayload, apiKey: string = 'test-secret-key-12345') {
  const res = await fetch(`${API_BASE_URL}/matching/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Matching-API-Key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Matching Error (${res.status}): ${errText}`);
  }

  return await res.json();
}

export async function createPayPalEscrow(orderId: number, amount: number) {
  const formData = new FormData();
  formData.append('order_id', String(orderId));
  formData.append('amount', String(amount));
  formData.append('currency', 'USD');

  const res = await fetch(`${API_BASE_URL}/paypal/create-escrow`, {
    method: 'POST',
    body: formData,
  });

  return await res.json();
}

export async function executePayPalRefund(orderId: number, amount: number, reason: string) {
  const formData = new FormData();
  formData.append('order_id', String(orderId));
  formData.append('amount', String(amount));
  formData.append('reason', reason);

  const res = await fetch(`${API_BASE_URL}/paypal/execute-refund`, {
    method: 'POST',
    body: formData,
  });

  return await res.json();
}
