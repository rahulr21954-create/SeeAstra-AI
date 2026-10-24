import re


def extract_fields(text: str) -> dict:
    patterns = {
        "application_number": [
            r"application\s*(?:no\.?|number|id)\s*[:#-]?\s*([A-Z0-9/-]+)"
        ],
        "institution_name": [
            r"(?:name of the institution|institution name|college name)"
            r"\s*[:\-]\s*([^\n]+)"
        ],
        "address": [
            r"(?:registered address|institution address|address)"
            r"\s*[:\-]\s*([^\n]+)"
        ],
        "date": [
            r"\b(?:date|dated)\s*[:\-]\s*"
            r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"
        ],
    }

    fields = {}

    for field_name, regex_list in patterns.items():
        value = None

        for pattern in regex_list:
            match = re.search(
                pattern,
                text,
                flags=re.IGNORECASE,
            )

            if match:
                value = match.group(1).strip()
                break

        fields[field_name] = {
            "value": value,
            "found": value is not None,
        }

    return fields