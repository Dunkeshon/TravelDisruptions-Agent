import os
import markdown
from xhtml2pdf import pisa

def md_to_pdf(md_file, pdf_file):
    # Read markdown
    with open(md_file, 'r', encoding='utf-8') as f:
        md_text = f.read()
    
    # Convert to HTML with extensions for tables, fenced code, etc.
    html_text = markdown.markdown(md_text, extensions=['tables', 'fenced_code', 'nl2br'])
    
    # Wrap in basic HTML structure with some minimal styling
    html = f"""
    <html>
    <head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }}
        h1, h2, h3 {{ color: #333; }}
        table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
        code {{ background-color: #f4f4f4; padding: 2px 4px; border-radius: 4px; font-family: monospace; }}
        pre {{ background-color: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }}
        blockquote {{ border-left: 4px solid #ccc; padding-left: 10px; color: #666; }}
    </style>
    </head>
    <body>
    {html_text}
    </body>
    </html>
    """
    
    # Write PDF
    with open(pdf_file, "wb") as output_file:
        pisa_status = pisa.CreatePDF(html, dest=output_file)
        
    if pisa_status.err:
        print(f"Error creating PDF for {md_file}")
    else:
        print(f"Created {pdf_file}")

if __name__ == "__main__":
    files_to_convert = [
        "detailed_test_report.md",
        "detailed_test_report_2.md",
        "system_architecture_overview.md",
        "TEST_REPORT.md"
    ]
    
    for f in files_to_convert:
        if os.path.exists(f):
            md_to_pdf(f, f.replace(".md", ".pdf"))
        else:
            print(f"File not found: {f}")
