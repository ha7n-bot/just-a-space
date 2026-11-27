"""Generate a print-ready QR PDF offline. Requires Python and ReportLab."""
import argparse
from urllib.parse import urlsplit
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("origin", help="Owner-approved HTTPS origin")
parser.add_argument("output", help="New PDF file to create")
parser.add_argument("--language", choices=["ar", "en"], default="ar")
args = parser.parse_args()
parsed = urlsplit(args.origin)
if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.path not in ("", "/") or parsed.query or parsed.fragment:
    parser.error("Supply an HTTPS origin without a path, credentials, query or fragment")
target = args.origin.rstrip("/") + "/" + args.language + "/menu"
widget = qr.QrCodeWidget(target, barWidth=180, barHeight=180, barBorder=4, barLevel="M")
drawing = Drawing(180, 180)
drawing.add(widget)
with open(args.output, "xb") as output:
    output.write(renderPDF.drawToString(drawing))
print(target)
