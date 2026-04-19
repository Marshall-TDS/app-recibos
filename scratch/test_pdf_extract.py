from pypdf import PdfReader
import os

pdf_paths = [
    "legacy/recibos/tamires_59584517000118_colaborador.pdf",
    "legacy/recibos/thiago_63490655000105_colaborador.pdf"
]

for pdf_path in pdf_paths:
    print(f"\n--- FILE: {pdf_path} ---")
    reader = PdfReader(pdf_path)
    page = reader.pages[0]
    text = page.extract_text()
    print(text)
