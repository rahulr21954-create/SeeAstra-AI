from consistency_checker import check_consistency


def test_matching_documents():
    documents = [
        {
            "document_id": "doc-1",
            "fields": {
                "institution_name": {"value": "ABC Institute"},
                "application_number": {"value": "APP-123"},
            },
        },
        {
            "document_id": "doc-2",
            "fields": {
                "institution_name": {"value": " abc institute "},
                "application_number": {"value": "APP-123"},
            },
        },
    ]

    result = check_consistency(documents)

    assert result["finding_count"] == 0
    assert result["requires_human_review"] is False


def test_mismatched_institution_names():
    documents = [
        {
            "document_id": "doc-1",
            "fields": {
                "institution_name": {"value": "ABC Institute"},
            },
        },
        {
            "document_id": "doc-2",
            "fields": {
                "institution_name": {"value": "XYZ Institute"},
            },
        },
    ]

    result = check_consistency(documents)

    assert result["finding_count"] == 1
    assert result["requires_human_review"] is True
    assert result["findings"][0]["field"] == "institution_name"