from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import logging
from dotenv import load_dotenv

from services.document_processor import DocumentProcessor
from services.queue_service import QueueService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="KMRL Document Intelligence AI Service",
    description="AI processing service for document intelligence",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
document_processor = DocumentProcessor()
queue_service = QueueService()

class ProcessDocumentRequest(BaseModel):
    document_id: str
    s3_key: str
    file_name: str
    doc_type: Optional[str] = None
    language: Optional[str] = None

class ProcessDocumentResponse(BaseModel):
    job_id: str
    status: str
    message: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-service"}

@app.post("/process", response_model=ProcessDocumentResponse)
async def process_document(
    request: ProcessDocumentRequest,
    background_tasks: BackgroundTasks
):
    """Queue document for processing"""
    try:
        job_id = await queue_service.enqueue_job({
            "document_id": request.document_id,
            "s3_key": request.s3_key,
            "file_name": request.file_name,
            "doc_type": request.doc_type,
            "language": request.language
        })
        
        # Start background processing
        background_tasks.add_task(
            process_document_background,
            job_id,
            request.dict()
        )
        
        return ProcessDocumentResponse(
            job_id=job_id,
            status="queued",
            message="Document queued for processing"
        )
    except Exception as e:
        logger.error(f"Error queuing document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """Get job processing status"""
    try:
        status = await queue_service.get_job_status(job_id)
        return {"job_id": job_id, "status": status}
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_document_background(job_id: str, job_data: Dict[str, Any]):
    """Background task to process document"""
    try:
        logger.info(f"Starting processing for job {job_id}")
        
        # Update job status
        await queue_service.update_job_status(job_id, "processing")
        
        # Process the document
        result = await document_processor.process_document(
            job_data["s3_key"],
            job_data["file_name"],
            job_data.get("doc_type"),
            job_data.get("language")
        )
        
        # Update job with results
        await queue_service.complete_job(job_id, result)
        
        logger.info(f"Completed processing for job {job_id}")
        
    except Exception as e:
        logger.error(f"Error processing document {job_id}: {str(e)}")
        await queue_service.fail_job(job_id, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)