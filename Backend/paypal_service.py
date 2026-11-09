"""
PayPal Sandbox Service for Veroxa Escrow Protocol
===================================================
Direct integration with PayPal REST APIs (v1/v2):
- OAuth2 token generation
- Order creation with intent: AUTHORIZE or CAPTURE
- Payment authorization & hold in escrow
- Capture / Release of authorized funds to seller
- Refund execution for buyer dispute settlement

Credentials can be configured via environment variables:
    PAYPAL_CLIENT_ID
    PAYPAL_CLIENT_SECRET
    PAYPAL_MODE (sandbox | live) - defaults to sandbox
"""

import os
import base64
import json
import urllib.request
import urllib.error
from typing import Any, Dict


class PayPalService:
    def __init__(self):
        self.client_id = os.getenv("PAYPAL_CLIENT_ID", "mock_sandbox_client_id")
        self.client_secret = os.getenv("PAYPAL_CLIENT_SECRET", "mock_sandbox_secret")
        self.mode = os.getenv("PAYPAL_MODE", "sandbox").lower()
        
        if self.mode == "live":
            self.base_url = "https://api-m.paypal.com"
        else:
            self.base_url = "https://api-m.sandbox.paypal.com"

    def is_configured(self) -> bool:
        """Check if real PayPal credentials are provided."""
        return (
            self.client_id != "mock_sandbox_client_id"
            and bool(self.client_id)
            and bool(self.client_secret)
        )

    def get_access_token(self) -> str:
        """Generate PayPal OAuth2 Bearer Token."""
        if not self.is_configured():
            return "simulated_paypal_sandbox_bearer_token"

        auth_str = f"{self.client_id}:{self.client_secret}"
        encoded_auth = base64.b64encode(auth_str.encode()).decode()

        req = urllib.request.Request(
            f"{self.base_url}/v1/oauth2/token",
            data=b"grant_type=client_credentials",
            headers={
                "Authorization": f"Basic {encoded_auth}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )

        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                return data.get("access_token", "")
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode()
            raise RuntimeError(f"PayPal Auth Failed ({exc.code}): {error_body}") from exc

    def create_escrow_order(self, order_id: str, amount: float, currency: str = "USD") -> Dict[str, Any]:
        """
        Create a PayPal order with intent=AUTHORIZE to hold funds in escrow
        until item delivery and dispute inspection window closes.
        """
        if not self.is_configured():
            # Simulated Sandbox Response for immediate offline demo reliability
            return {
                "id": f"PAYPAL-SANDBOX-AUTH-{order_id}",
                "status": "CREATED",
                "intent": "AUTHORIZE",
                "amount": {"currency_code": currency, "value": f"{amount:.2f}"},
                "links": [
                    {"href": f"{self.base_url}/checkoutnow?token=SIMULATED_{order_id}", "rel": "approve", "method": "GET"}
                ],
                "mode": "simulated_sandbox"
            }

        token = self.get_access_token()
        payload = {
            "intent": "AUTHORIZE",
            "purchase_units": [
                {
                    "reference_id": str(order_id),
                    "description": f"Veroxa Escrow Protected Order #{order_id}",
                    "amount": {
                        "currency_code": currency,
                        "value": f"{amount:.2f}"
                    }
                }
            ],
            "application_context": {
                "brand_name": "Veroxa Escrow Protocol",
                "user_action": "CONTINUE",
                "shipping_preference": "GET_FROM_FILE"
            }
        }

        req = urllib.request.Request(
            f"{self.base_url}/v2/checkout/orders",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )

        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())

    def execute_dispute_refund(self, capture_or_order_id: str, amount: float, reason: str = "") -> Dict[str, Any]:
        """
        Executes an escrow refund to the buyer upon AI-verified mismatch or auditor confirmation.
        """
        if not self.is_configured():
            return {
                "refund_id": f"PAYPAL-REFUND-{capture_or_order_id[:8]}",
                "status": "COMPLETED",
                "amount": f"{amount:.2f}",
                "reason": reason or "Veroxa AI Mismatch Adjudication",
                "mode": "simulated_sandbox"
            }

        token = self.get_access_token()
        payload = {
            "note_to_payer": f"Veroxa Escrow Refund: {reason}"
        }
        req = urllib.request.Request(
            f"{self.base_url}/v2/payments/captures/{capture_or_order_id}/refund",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )

        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())

    def release_funds_to_seller(self, authorization_id: str, amount: float) -> Dict[str, Any]:
        """
        Captures previously authorized escrow funds and releases payout to seller.
        """
        if not self.is_configured():
            return {
                "capture_id": f"PAYPAL-CAPTURE-{authorization_id[:8]}",
                "status": "COMPLETED",
                "amount": f"{amount:.2f}",
                "mode": "simulated_sandbox"
            }

        token = self.get_access_token()
        payload = {
            "amount": {
                "value": f"{amount:.2f}",
                "currency_code": "USD"
            },
            "is_final_capture": True
        }
        req = urllib.request.Request(
            f"{self.base_url}/v2/payments/authorizations/{authorization_id}/capture",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        )

        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
