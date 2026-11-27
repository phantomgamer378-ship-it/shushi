import logging
import base64
from typing import Optional, Dict, Any
import resend
from app.core.config import settings

logger = logging.getLogger("eventflow.email")


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
        subject = f"Your Ticket: {event_title}"

        # HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 24px; }}
            .card {{ max-width: 520px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
            h1 {{ font-size: 24px; margin-bottom: 8px; color: #ffffff; }}
            .badge {{ display: inline-block; padding: 4px 12px; background: rgba(99, 102, 241, 0.15); color: #818cf8; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }}
            .details {{ margin: 20px 0; border-top: 1px solid #1f2937; border-bottom: 1px solid #1f2937; padding: 16px 0; }}
            .details p {{ margin: 6px 0; color: #9ca3af; font-size: 14px; }}
            .details strong {{ color: #e5e7eb; }}
            .qr-notice {{ text-align: center; margin-top: 24px; padding: 16px; background: #1e293b; border-radius: 8px; font-size: 13px; color: #94a3b8; }}
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Confirmed Admission</span>
            <h1>Hello, {attendee_name}!</h1>
            <p>Your digital ticket for <strong>{event_title}</strong> is confirmed.</p>
            
            <div class="details">
              <p><strong>Venue:</strong> {venue_name}</p>
              <p><strong>Time:</strong> {start_time_str}</p>
            </div>

            <div class="qr-notice">
              Your entrance QR code is attached to this email. Please present it at the check-in gate for instant scanning.
            </div>
          </div>
        </body>
        </html>
        """

        attachment = {
            "filename": "eventflow_ticket_qr.png",
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
