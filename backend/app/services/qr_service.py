import qrcode

def generate_qr(data: str, filename: str):
    qr = qrcode.make(data)
    qr.save(filename)
