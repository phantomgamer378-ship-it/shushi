import logging
import base64
from typing import Optional, Dict, Any
import resend
from app.core.config import settings

logger = logging.getLogger("shushi.email")


class ResendEmailAdapter:
    """Adapter for sending transactional ticket emails with QR code attachments via Resend."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.RESEND_API_KEY
        resend.api_key = self.api_key

    def send_ticket_email(
        self,
        recipient_email: str,
        attendee_name: str,
        event_title: str,
        venue_name: str,
        start_time_str: str,
        qr_png_bytes: bytes,
    ) -> Dict[str, Any]:
        """Dispatches digital ticket email with attached QR code PNG."""
        subject = f"Admission Pass: {event_title}"

        # HTML email template (Editorial Brutalist Theme)
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; background-color: #0A0A0C; color: #F4F0EA; padding: 24px; margin: 0; }}
            .card {{ max-width: 520px; margin: 0 auto; background: #121214; border: 1px solid #27272A; padding: 32px; border-top: 4px solid #D72638; }}
            .brand {{ font-family: monospace; font-size: 11px; font-weight: bold; letter-spacing: 2px; color: #D72638; text-transform: uppercase; margin-bottom: 12px; }}
            h1 {{ font-size: 26px; margin: 0 0 8px 0; color: #FFFFFF; font-weight: 900; text-transform: uppercase; }}
            .badge {{ display: inline-block; padding: 4px 10px; background: #D72638; color: #FFFFFF; font-family: monospace; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }}
            .details {{ margin: 20px 0; border-top: 1px solid #27272A; border-bottom: 1px solid #27272A; padding: 16px 0; font-family: monospace; }}
            .details p {{ margin: 8px 0; color: #A1A1AA; font-size: 13px; }}
            .details strong {{ color: #FFFFFF; }}
            .qr-notice {{ text-align: center; margin-top: 24px; padding: 16px; background: #18181B; border: 1px solid #27272A; font-family: monospace; font-size: 12px; color: #D4D4D8; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">SHUSHI // ADMISSION GATEWAY</div>
            <span class="badge">CONFIRMED PASS</span>
            <h1>{attendee_name}</h1>
            <p style="font-family: monospace; font-size: 13px; color: #A1A1AA;">Your digital pass for <strong>{event_title}</strong> is verified.</p>
            
            <div class="details">
              <p><strong>VENUE:</strong> {venue_name}</p>
              <p><strong>TIME:</strong> {start_time_str}</p>
            </div>

            <div class="qr-notice">
              <strong>ZERO-PII QR PASS ATTACHED</strong><br>
              Please present the attached QR code at any entry checkpoint for sub-second atomic scan.
            </div>
          </div>
        </body>
        </html>
        """

        attachment = {
            "filename": "shushi_ticket_pass.png",
            "content": list(qr_png_bytes),
        }

        # In test/dev environment with dummy API key, log and return simulated response
        if not self.api_key or self.api_key.startswith("re_placeholder"):
            logger.info("[Mock Resend] Simulating successful ticket email delivery to %s", recipient_email)
            return {"id": "mock_msg_id_12345", "status": "simulated"}

        params = {
            "from": settings.FROM_EMAIL,
            "to": [recipient_email],
            "subject": subject,
            "html": html_content,
            "attachments": [attachment],
        }

        response = resend.Emails.send(params)
        return response
