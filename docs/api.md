# API Documentation

The KMRL Document Intelligence Platform provides a RESTful API for document management, task handling, and user administration.

## Base URL

- Development: `http://localhost:3001/api/v1`
- Production: `https://api.yourdomain.com/api/v1`

## Authentication

All API endpoints require authentication using Clerk JWT tokens.

```bash
Authorization: Bearer <clerk_jwt_token>
```

## API Endpoints

### Documents

#### Upload Document
```http
POST /documents/presign
```

Get a presigned URL for document upload.

**Request Body:**
```json
{
  "fileName": "document.pdf",
  "contentType": "application/pdf",
  "docType": "invoice"
}
```

**Response:**
```json
{
  "documentId": "uuid",
  "presignedUrl": "https://s3.amazonaws.com/...",
  "s3Key": "documents/2024/01/uuid-document.pdf"
}
```

#### Finalize Upload
```http
POST /documents/{id}/finalize
```

Finalize document upload and start AI processing.

**Response:**
```json
{
  "message": "Document upload finalized and queued for processing"
}
```

#### Get Documents
```http
GET /documents
```

**Query Parameters:**
- `status`: Filter by status (uploaded, processing, processed, failed)
- `docType`: Filter by document type
- `department`: Filter by department
- `search`: Search in document content
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "file_name": "document.pdf",
      "doc_type": "invoice",
      "status": "processed",
      "summary_text": "Document summary...",
      "department_assigned": "finance",
      "created_at": "2024-01-15T10:30:00Z",
      "metadata": {
        "invoice_number": "INV-001",
        "amount": "1000"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Get Document
```http
GET /documents/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "file_name": "document.pdf",
  "doc_type": "invoice",
  "status": "processed",
  "ocr_text": "Extracted text...",
  "summary_text": "Summary...",
  "summary_bilingual": {
    "english": "English summary",
    "malayalam": "Malayalam summary"
  },
  "metadata": {
    "invoice_number": "INV-001"
  },
  "downloadUrl": "https://s3.amazonaws.com/...",
  "processing_metadata": {
    "model_versions": {
      "ocr": "tesseract-5.0"
    }
  }
}
```

#### Reprocess Document (Admin Only)
```http
POST /documents/{id}/reprocess
```

**Response:**
```json
{
  "message": "Document queued for reprocessing"
}
```

### Tasks

#### Get Tasks
```http
GET /tasks
```

**Query Parameters:**
- `status`: Filter by status (pending, acknowledged, closed)
- `department`: Filter by department
- `assignedTo`: Filter by assigned user
- `documentId`: Filter by document
- `search`: Search in task content
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Review invoice",
      "description": "Review and approve invoice INV-001",
      "status": "pending",
      "due_date": "2024-01-30T23:59:59Z",
      "assigned_department": "finance",
      "document": {
        "id": "uuid",
        "file_name": "invoice.pdf",
        "doc_type": "invoice"
      },
      "assigned_user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### Get Task
```http
GET /tasks/{id}
```

#### Create Task
```http
POST /tasks
```

**Request Body:**
```json
{
  "title": "Task title",
  "description": "Task description",
  "documentId": "uuid",
  "assignedTo": "user-uuid",
  "assignedDepartment": "finance",
  "dueDate": "2024-01-30T23:59:59Z"
}
```

#### Acknowledge Task
```http
PATCH /tasks/{id}/acknowledge
```

**Request Body:**
```json
{
  "notes": "Acknowledgment notes"
}
```

#### Close Task
```http
PATCH /tasks/{id}/close
```

### Users

#### Get Current User
```http
GET /users/me
```

**Response:**
```json
{
  "id": "uuid",
  "clerk_id": "clerk_user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "engineer",
  "department": "engineering",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Get Users (Admin Only)
```http
GET /users
```

**Query Parameters:**
- `role`: Filter by role
- `department`: Filter by department
- `search`: Search in name/email
- `page`: Page number
- `limit`: Items per page

#### Update User (Admin Only)
```http
PATCH /users/{id}
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "admin",
  "department": "it"
}
```

#### Get Department Users
```http
GET /users/department/{department}
```

### Webhooks

#### Clerk Webhook
```http
POST /webhooks/clerk
```

Handles user creation, updates, and deletion from Clerk.

#### AI Service Webhook
```http
POST /webhooks/ai-service
```

Handles AI processing completion notifications.

**Request Body:**
```json
{
  "job_id": "uuid",
  "document_id": "uuid",
  "status": "completed",
  "result": {
    "ocr_text": "Extracted text",
    "summary_text": "Summary",
    "metadata": {},
    "tasks": []
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate limited:
- Standard endpoints: 100 requests per minute
- Upload endpoints: 10 requests per minute
- Admin endpoints: 50 requests per minute

## Pagination

List endpoints support pagination:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Filtering and Search

Most list endpoints support filtering and search:

- **Filtering**: Use query parameters to filter results
- **Search**: Use the `search` parameter for full-text search
- **Sorting**: Use `sort` and `order` parameters

Example:
```http
GET /documents?status=processed&department=finance&search=invoice&page=1&limit=10
```

## Real-time Updates

The platform uses Supabase Realtime for live updates:

- Document status changes
- New task assignments
- Task acknowledgments
- System notifications

Connect to Supabase Realtime channels:
- `documents:department={department}`
- `tasks:user={user_id}`
- `tasks:department={department}`

## SDK and Client Libraries

### JavaScript/TypeScript
```javascript
import { useApi } from './hooks/useApi'

const { apiCall } = useApi()

// Get documents
const documents = await apiCall('/documents')

// Upload document
const uploadResponse = await apiCall('/documents/presign', {
  method: 'POST',
  body: JSON.stringify({
    fileName: 'document.pdf',
    contentType: 'application/pdf'
  })
})
```

### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {clerk_token}',
    'Content-Type': 'application/json'
}

# Get documents
response = requests.get(
    'http://localhost:3001/api/v1/documents',
    headers=headers
)
documents = response.json()
```

## Testing

### Health Check
```http
GET /health
```

Returns service health status.

### API Documentation
Interactive API documentation is available at:
- Development: `http://localhost:3001/api/docs`
- Production: `https://api.yourdomain.com/api/docs`

## Support

For API support:
1. Check the interactive documentation
2. Review error messages and status codes
3. Check application logs
4. Contact the development team