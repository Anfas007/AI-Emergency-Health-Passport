import qrcode
from io import BytesIO

def generate_qr_code(data: str):
    """
    Generates a QR code from the given data and returns it as a BytesIO stream.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = BytesIO()
    img.save(buf, "PNG")
    buf.seek(0)
    return buf

def generate_qr(data: str, filename: str):
    qr = qrcode.make(data)
    qr.save(filename)
