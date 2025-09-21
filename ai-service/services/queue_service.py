import redis
import json
import uuid
import os
from datetime import datetime
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class QueueService:
    def __init__(self):
        self.redis_client = redis.from_url(
            os.getenv('REDIS_URL', 'redis://localhost:6379'),
            decode_responses=True
        )
        self.job_queue = 'document_processing_jobs'
        self.job_status_prefix = 'job_status:'
        self.job_result_prefix = 'job_result:'

    async def enqueue_job(self, job_data: Dict[str, Any]) -> str:
        """Enqueue a document processing job"""
        try:
            job_id = str(uuid.uuid4())
            
            # Store job data
            job_payload = {
                'job_id': job_id,
                'status': 'queued',
                'data': job_data,
                'created_at': str(datetime.utcnow())
            }
            
            # Add to queue
            self.redis_client.lpush(self.job_queue, json.dumps(job_payload))
            
            # Set initial status
            await self.update_job_status(job_id, 'queued')
            
            logger.info(f"Enqueued job {job_id}")
            return job_id
            
        except Exception as e:
            logger.error(f"Error enqueuing job: {str(e)}")
            raise

    async def get_job_status(self, job_id: str) -> Optional[str]:
        """Get job status"""
        try:
            status = self.redis_client.get(f"{self.job_status_prefix}{job_id}")
            return status
        except Exception as e:
            logger.error(f"Error getting job status: {str(e)}")
            return None

    async def update_job_status(self, job_id: str, status: str):
        """Update job status"""
        try:
            self.redis_client.setex(
                f"{self.job_status_prefix}{job_id}",
                3600,  # 1 hour TTL
                status
            )
        except Exception as e:
            logger.error(f"Error updating job status: {str(e)}")
            raise

    async def complete_job(self, job_id: str, result: Dict[str, Any]):
        """Mark job as completed with results"""
        try:
            # Store result
            self.redis_client.setex(
                f"{self.job_result_prefix}{job_id}",
                3600,  # 1 hour TTL
                json.dumps(result)
            )
            
            # Update status
            await self.update_job_status(job_id, 'completed')
            
            # TODO: Notify backend service about completion
            # This could be done via webhook, database update, or message queue
            
            logger.info(f"Completed job {job_id}")
            
        except Exception as e:
            logger.error(f"Error completing job: {str(e)}")
            raise

    async def fail_job(self, job_id: str, error_message: str):
        """Mark job as failed"""
        try:
            # Store error
            self.redis_client.setex(
                f"{self.job_result_prefix}{job_id}",
                3600,  # 1 hour TTL
                json.dumps({'error': error_message})
            )
            
            # Update status
            await self.update_job_status(job_id, 'failed')
            
            logger.error(f"Failed job {job_id}: {error_message}")
            
        except Exception as e:
            logger.error(f"Error failing job: {str(e)}")
            raise

    async def get_job_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job result"""
        try:
            result_json = self.redis_client.get(f"{self.job_result_prefix}{job_id}")
            if result_json:
                return json.loads(result_json)
            return None
        except Exception as e:
            logger.error(f"Error getting job result: {str(e)}")
            return None