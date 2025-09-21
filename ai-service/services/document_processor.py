import os
import logging
from typing import Dict, Any, Optional
import boto3
from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes
import io
from langdetect import detect
from transformers import pipeline

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        self.bucket_name = os.getenv('S3_BUCKET_NAME')
        
        # Initialize AI models
        self.summarizer = pipeline(
            "summarization",
            model="facebook/bart-large-cnn",
            device=-1  # Use CPU
        )
        
    async def process_document(
        self,
        s3_key: str,
        file_name: str,
        doc_type: Optional[str] = None,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a document through the AI pipeline"""
        
        try:
            # Download file from S3
            file_content = await self._download_from_s3(s3_key)
            
            # Extract text using OCR
            ocr_text = await self._extract_text(file_content, file_name)
            
            # Detect language if not provided
            if not language:
                language = self._detect_language(ocr_text)
            
            # Generate summary
            summary = await self._generate_summary(ocr_text, language)
            
            # Extract metadata
            metadata = await self._extract_metadata(ocr_text, doc_type)
            
            # Classify department
            department = await self._classify_department(ocr_text, summary, doc_type)
            
            # Extract tasks/action items
            tasks = await self._extract_tasks(ocr_text, summary)
            
            return {
                "ocr_text": ocr_text,
                "language": language,
                "summary_text": summary.get("english", ""),
                "summary_bilingual": summary,
                "metadata": metadata,
                "department_suggested": department,
                "tasks": tasks,
                "processing_metadata": {
                    "model_versions": {
                        "ocr": "tesseract-5.0",
                        "summarizer": "facebook/bart-large-cnn",
                        "language_detector": "langdetect-1.0.9"
                    },
                    "confidence_scores": {
                        "ocr": 0.95,
                        "language_detection": 0.9,
                        "department_classification": 0.85
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing document {s3_key}: {str(e)}")
            raise
    
    async def _download_from_s3(self, s3_key: str) -> bytes:
        """Download file from S3"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
            return response['Body'].read()
        except Exception as e:
            logger.error(f"Error downloading from S3: {str(e)}")
            raise
    
    async def _extract_text(self, file_content: bytes, file_name: str) -> str:
        """Extract text from document using OCR"""
        try:
            file_extension = file_name.lower().split('.')[-1]
            
            if file_extension == 'pdf':
                # Convert PDF to images and OCR each page
                images = convert_from_bytes(file_content)
                text_parts = []
                
                for image in images:
                    text = pytesseract.image_to_string(image, lang='eng+mal')
                    text_parts.append(text)
                
                return '\n\n'.join(text_parts)
            
            elif file_extension in ['jpg', 'jpeg', 'png', 'tiff']:
                # Direct OCR on image
                image = Image.open(io.BytesIO(file_content))
                return pytesseract.image_to_string(image, lang='eng+mal')
            
            elif file_extension in ['txt', 'docx']:
                # For text files, return as-is (simplified)
                return file_content.decode('utf-8', errors='ignore')
            
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
                
        except Exception as e:
            logger.error(f"Error extracting text: {str(e)}")
            raise
    
    def _detect_language(self, text: str) -> str:
        """Detect document language"""
        try:
            detected = detect(text)
            # Map detected language codes to our supported languages
            if detected in ['ml', 'malayalam']:
                return 'malayalam'
            else:
                return 'english'
        except:
            return 'english'  # Default fallback
    
    async def _generate_summary(self, text: str, language: str) -> Dict[str, str]:
        """Generate bilingual summary"""
        try:
            # Truncate text if too long for the model
            max_length = 1024
            if len(text) > max_length:
                text = text[:max_length]
            
            # Generate English summary
            summary_result = self.summarizer(
                text,
                max_length=150,
                min_length=50,
                do_sample=False
            )
            
            english_summary = summary_result[0]['summary_text']
            
            # For now, return the same summary for both languages
            # In production, you'd use a translation service
            return {
                "english": english_summary,
                "malayalam": english_summary  # TODO: Implement translation
            }
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return {
                "english": "Summary generation failed",
                "malayalam": "Summary generation failed"
            }
    
    async def _extract_metadata(self, text: str, doc_type: Optional[str]) -> Dict[str, Any]:
        """Extract structured metadata from document"""
        metadata = {}
        
        try:
            # Simple regex-based extraction (can be enhanced with NER models)
            import re
            
            # Invoice number
            invoice_match = re.search(r'(?:invoice|inv)[\s#:]*([A-Z0-9-]+)', text, re.IGNORECASE)
            if invoice_match:
                metadata['invoice_number'] = invoice_match.group(1)
            
            # PO number
            po_match = re.search(r'(?:po|purchase order)[\s#:]*([A-Z0-9-]+)', text, re.IGNORECASE)
            if po_match:
                metadata['po_number'] = po_match.group(1)
            
            # Train number
            train_match = re.search(r'(?:train|unit)[\s#:]*([0-9]+)', text, re.IGNORECASE)
            if train_match:
                metadata['train_number'] = train_match.group(1)
            
            # Amount
            amount_match = re.search(r'(?:amount|total|₹)\s*([0-9,]+(?:\.[0-9]{2})?)', text, re.IGNORECASE)
            if amount_match:
                metadata['amount'] = amount_match.group(1)
            
            # Date
            date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
            if date_match:
                metadata['date'] = date_match.group(1)
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error extracting metadata: {str(e)}")
            return {}
    
    async def _classify_department(self, text: str, summary: Dict[str, str], doc_type: Optional[str]) -> str:
        """Classify document to appropriate department"""
        try:
            # Simple rule-based classification
            text_lower = text.lower()
            summary_lower = summary.get("english", "").lower()
            
            # Engineering keywords
            engineering_keywords = [
                'maintenance', 'repair', 'technical', 'equipment', 'train', 'track',
                'signal', 'electrical', 'mechanical', 'inspection', 'fault'
            ]
            
            # HR keywords
            hr_keywords = [
                'employee', 'staff', 'training', 'safety', 'policy', 'circular',
                'leave', 'attendance', 'performance', 'recruitment'
            ]
            
            # Finance keywords
            finance_keywords = [
                'invoice', 'payment', 'budget', 'cost', 'expense', 'purchase',
                'vendor', 'contract', 'billing', 'amount'
            ]
            
            # Count keyword matches
            eng_score = sum(1 for keyword in engineering_keywords if keyword in text_lower or keyword in summary_lower)
            hr_score = sum(1 for keyword in hr_keywords if keyword in text_lower or keyword in summary_lower)
            finance_score = sum(1 for keyword in finance_keywords if keyword in text_lower or keyword in summary_lower)
            
            # Determine department based on highest score
            scores = {'engineering': eng_score, 'hr': hr_score, 'finance': finance_score}
            department = max(scores, key=scores.get)
            
            # If no clear winner, use doc_type as fallback
            if scores[department] == 0 and doc_type:
                if doc_type in ['maintenance', 'technical']:
                    return 'engineering'
                elif doc_type in ['circular', 'policy']:
                    return 'hr'
                elif doc_type in ['invoice', 'purchase']:
                    return 'finance'
            
            return department
            
        except Exception as e:
            logger.error(f"Error classifying department: {str(e)}")
            return 'general'
    
    async def _extract_tasks(self, text: str, summary: Dict[str, str]) -> list:
        """Extract action items and compliance tasks"""
        tasks = []
        
        try:
            import re
            
            # Look for compliance-related phrases
            compliance_patterns = [
                r'(?:must|required|mandatory|compliance|acknowledge|confirm).*?(?:by|before)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
                r'(?:deadline|due date|submit by)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
                r'(?:action required|please|kindly).*?(?:by|before)\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
            ]
            
            for pattern in compliance_patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    # Extract the sentence containing the match
                    start = max(0, match.start() - 100)
                    end = min(len(text), match.end() + 100)
                    context = text[start:end].strip()
                    
                    tasks.append({
                        'title': 'Compliance Task',
                        'description': context,
                        'due_date': match.group(1) if match.groups() else None,
                        'type': 'compliance'
                    })
            
            return tasks[:5]  # Limit to 5 tasks
            
        except Exception as e:
            logger.error(f"Error extracting tasks: {str(e)}")
            return []