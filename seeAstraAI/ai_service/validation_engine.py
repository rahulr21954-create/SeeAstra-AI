from datetime import datetime
import re


REQUIRED_FIELDS = {
    "institution_name": "Institution name",
    "application_number": "Application number",
}


def validate_document(
    document: dict,
    extracted_fields: dict,
) -> dict:
    findings = []

    # 1. Check required fields
    for field_name, display_name in REQUIRED_FIELDS.items():
        field = extracted_fields.get(field_name, {})
        value = field.get("value")

        if not value:
            findings.append({
                "code": "MISSING_FIELD",
                "field": field_name,
                "severity": "warning",
                "message": f"{display_name} was not detected.",
                "recommendation": (
                    "Check the document manually; the field may "
                    "be present but unreadable."
                ),
            })

    # 2. Check whether any text was extracted
    text = document.get("text", "").strip()

    if not text:
        findings.append({
            "code": "NO_READABLE_TEXT",
            "field": None,
            "severity": "warning",
            "message": "No readable text was extracted.",
            "recommendation": (
                "Check scan quality and OCR support."
            ),
        })

    # 3. Check for unusually long extracted field values
    for field_name, field in extracted_fields.items():
        value = field.get("value")

        if isinstance(value, str) and len(value) > 250:
            findings.append({
                "code": "FIELD_REVIEW",
                "field": field_name,
                "severity": "info",
                "message": "Extracted field needs manual review.",
                "recommendation": (
                    "Verify the field boundary and extracted value."
                ),
            })

    # 4. Report whether review is needed
    requires_review = len(findings) > 0

    return {
        "checks_performed": [
            "required_fields",
            "readable_text",
            "extracted_field_sanity",
        ],
        "finding_count": len(findings),
        "requires_human_review": requires_review,
        "findings": findings,
        "decision_note": (
            "These checks identify possible issues only. "
            "They do not establish document authenticity "
            "or determine regulatory approval."
        ),
    }