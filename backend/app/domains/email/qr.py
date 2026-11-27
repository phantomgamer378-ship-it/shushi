import io
import qrcode
from PIL import Image


def generate_qr_code_png(token: str, version: str = "v1") -> bytes:
    """
    Renders an in-memory QR code PNG image encoding an opaque versioned ticket credential.
    Strictly contains zero attendee PII.
    """
    payload = f"ef:{version}:{token}"

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(payload)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
