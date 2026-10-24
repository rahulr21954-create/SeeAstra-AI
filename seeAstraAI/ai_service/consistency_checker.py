from collections import defaultdict


FIELDS_TO_COMPARE = [
    "institution_name",
    "application_number",
    "address",
]


def normalize(value):
    if not isinstance(value, str):
        return ""

    return " ".join(value.casefold().split()).strip(" ,.-")


def check_consistency(documents: list[dict]) -> dict:
    """
    Each item:
    {
        "document_id": "doc-1",
        "fields": {
            "institution_name": {"value": "ABC Institute"},
            "application_number": {"value": "APP-123"}
        }
    }
    """

    findings = []

    for field_name in FIELDS_TO_COMPARE:
        values = defaultdict(list)

        for document in documents:
            fields = document.get("fields", {})
            field = fields.get(field_name, {})
            value = field.get("value")

            normalized = normalize(value)

            if normalized:
                values[normalized].append({
                    "document_id": str(
                        document.get("document_id", "unknown")
                    ),
                    "value": value,
                })

        # Compare only when at least two distinct values exist.
        if len(values) > 1:
            findings.append({
                "code": "CROSS_DOCUMENT_MISMATCH",
                "field": field_name,
                "severity": "warning",
                "message": (
                    f"Different {field_name.replace('_', ' ')} "
                    "values were found across documents."
                ),
                "evidence": [
                    entry
                    for entries in values.values()
                    for entry in entries
                ],
                "recommendation": (
                    "Compare the original documents and verify "
                    "whether the difference is legitimate."
                ),
            })

    return {
        "documents_compared": len(documents),
        "finding_count": len(findings),
        "findings": findings,
        "requires_human_review": bool(findings),
        "decision_note": (
            "Differences are review indicators, not proof of fraud "
            "or grounds for automatic rejection."
        ),
    }