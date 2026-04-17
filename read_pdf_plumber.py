import pdfplumber

with pdfplumber.open("User prompts.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        print(f"--- PAGE {i+1} ---")
        text = page.extract_text()
        print(text)
