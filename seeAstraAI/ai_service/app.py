
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from pdf_extractor import extract_pdf_text
from field_extractor import extract_fields
from validation_engine import validate_document
from consistency_checker import check_consistency

app = FastAPI(
    title="SeeAstra AI Service",
    version="0.1.0",
    description="PDF text extraction service for document review",
)


class ExtractRequest(BaseModel):
    file_path: str = Field(min_length=1, max_length=1000)


class ConsistencyRequest(BaseModel):
    documents: list[dict] = Field(min_length=2, max_length=50)

@app.get("/health")
def health():
    return {
        "success": True,
        "service": "SeeAstra AI",
        "status": "running",
    }


@app.post("/extract-text")
def extract_text(request: ExtractRequest):
    try:
        result = extract_pdf_text(request.file_path)

        fields = extract_fields(result["text"])
        analysis = validate_document(result, fields)

        return {
            "success": True,
            "document": result,
            "extracted_fields": fields,
            "analysis": analysis,
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="PDF file not found",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        print(f"PDF extraction failed: {type(error).__name__}")

        raise HTTPException(
            status_code=422,
            detail="Unable to read this PDF",
        )


@app.post("/check-consistency")
def check_documents_consistency(request: ConsistencyRequest):
    try:
        result = check_consistency(request.documents)

        return {
            "success": True,
            "analysis": result,
        }

    except Exception as error:
        print(f"Consistency check failed: {type(error).__name__}")

        raise HTTPException(
            status_code=422,
            detail="Unable to compare the supplied documents",
        )