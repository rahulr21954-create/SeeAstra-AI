from pathlib import Path

import pymupdf
import pytesseract
from PIL import Image


MAX_PAGES = 100
MIN_TEXT_LENGTH = 20


def extract_pdf_text(file_path: str) -> dict:
    path = Path(file_path)

    if not path.is_file() or path.suffix.lower() != ".pdf":
        raise ValueError("A valid PDF file is required")

    extracted_pages = []

    with pymupdf.open(path) as pdf:
        if pdf.is_encrypted:
            raise ValueError("Password-protected PDFs are not supported")

        if len(pdf) == 0:
            raise ValueError("PDF contains no pages")

        if len(pdf) > MAX_PAGES:
            raise ValueError("PDF exceeds the 100-page limit")

        for page_number, page in enumerate(pdf, start=1):
            text = page.get_text("text").strip()
            extraction_method = "pdf_text"

            # Use OCR if the page has little or no embedded text.
            if len(text) < MIN_TEXT_LENGTH:
                pixmap = page.get_pixmap(
                    matrix=pymupdf.Matrix(2, 2),
                    colorspace=pymupdf.csRGB,
                    alpha=False,
                )
                image = Image.frombytes(
                    "RGB",
                    [pixmap.width, pixmap.height],
                    pixmap.samples,
                )

                try:
                    text = pytesseract.image_to_string(
                        image,
                        lang="eng",
                    ).strip()
                    extraction_method = "ocr"
                except pytesseract.TesseractNotFoundError as exc:
                    raise RuntimeError(
                        "Tesseract OCR is not installed or not in PATH"
                    ) from exc

            extracted_pages.append({
                "page": page_number,
                "text": text,
                "method": extraction_method,
            })

    full_text = "\n\n".join(
        f"Page {page['page']}\n{page['text']}"
        for page in extracted_pages
    )

    return {
        "page_count": len(extracted_pages),
        "character_count": len(full_text),
        "text": full_text,
        "pages": extracted_pages,
        "needs_ocr": not any(
            page["text"] for page in extracted_pages
        ),
    }