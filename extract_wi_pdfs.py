import pdfplumber

def read_pdf(pdf_path, out_txt):
    with pdfplumber.open(pdf_path) as pdf:
        text = []
        for i, page in enumerate(pdf.pages):
            text.append(f"--- PAGE {i+1} ---")
            t = page.extract_text()
            if t:
                text.append(t)
    with open(out_txt, "w", encoding="utf-8") as f:
        f.write("\n".join(text))
    print(f"Extracted {pdf_path} -> {out_txt} ({len(text)} lines/blocks)")

read_pdf(r"iso report/WI-CC-004V.01-20260831-162504.pdf", r"C:\Users\aaadc\.gemini\antigravity\brain\70a4b885-1b25-475d-9274-c0f5a3dfd5ef\scratch\wi_004.txt")
read_pdf(r"iso report/WI-CC-005V.02-20260831-162541.pdf", r"C:\Users\aaadc\.gemini\antigravity\brain\70a4b885-1b25-475d-9274-c0f5a3dfd5ef\scratch\wi_005.txt")
