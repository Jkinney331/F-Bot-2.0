# F-Bot 2.0 API Reference

## Overview

F-Bot 2.0 provides a comprehensive REST API for interacting with the fascia AI platform. All endpoints are HIPAA-compliant with proper authentication and audit logging.

## Authentication

### JWT Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "role": "physician",
    "permissions": ["read:patients", "write:diagnosis"]
  }
}
```

### Authorization Header
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Core Endpoints

### Chat Interface

#### Send Message
```http
POST /api/chat/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "What are the symptoms of fascial restriction?",
  "patientId": "patient-456", // Optional for patient-specific queries
  "sessionId": "session-789",
  "context": {
    "language": "en",
    "urgency": "low",
    "specialty": "orthopedics"
  }
}
```

**Response:**
```json
{
  "id": "msg-123",
  "response": "Fascial restriction typically presents with...",
  "confidence": 0.94,
  "sources": [
    {
      "type": "pubmed",
      "title": "Fascial Anatomy and Pathology",
      "url": "https://pubmed.ncbi.nlm.nih.gov/...",
      "evidenceLevel": "1A"
    }
  ],
  "modelUsed": "gpt-4o",
  "cost": 0.0024,
  "processingTime": 1.2,
  "disclaimer": "This information is for educational purposes only..."
}
```

#### Get Chat History
```http
GET /api/chat/history/{sessionId}
Authorization: Bearer {token}
```

### Multi-LLM Orchestration

#### Get Available Models
```http
GET /api/models/available
Authorization: Bearer {token}
```

**Response:**
```json
{
  "models": [
    {
      "id": "gpt-4o",
      "name": "GPT-4 Omni",
      "provider": "openai",
      "costPerToken": 0.00003,
      "capabilities": ["text", "vision", "reasoning"],
      "status": "available"
    },
    {
      "id": "claude-3.5-sonnet",
      "name": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "costPerToken": 0.000015,
      "capabilities": ["text", "reasoning", "code"],
      "status": "available"
    }
  ]
}
```

#### Model Performance Metrics
```http
GET /api/models/performance
Authorization: Bearer {token}
```

### Ultrasound Analysis

#### Upload Ultrasound Image
```http
POST /api/ultrasound/analyze
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "image": [binary_data],
  "patientId": "patient-456",
  "bodyPart": "shoulder",
  "clinicalContext": "suspected fascial adhesion"
}
```

**Response:**
```json
{
  "analysisId": "analysis-789",
  "findings": [
    {
      "finding": "Hyperechoic tissue consistent with fascial thickening",
      "location": {
        "x": 120,
        "y": 85,
        "width": 45,
        "height": 30
      },
      "confidence": 0.87,
      "severity": "moderate"
    }
  ],
  "recommendations": [
    "Consider fascial release therapy",
    "Follow-up ultrasound in 4-6 weeks"
  ],
  "gemmaModel": "gemma-3n-ultrasound",
  "processingTime": 2.3
}
```

#### Clarius Device Integration
```http
POST /api/ultrasound/clarius/stream
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceId": "clarius-123",
  "sessionType": "live_analysis",
  "patientId": "patient-456"
}
```

### Medical RAG System

#### Query Medical Knowledge
```http
POST /api/rag/query
Authorization: Bearer {token}
Content-Type: application/json

{
  "query": "latest research on fascial release techniques",
  "filters": {
    "evidenceLevel": ["1A", "1B", "2A"],
    "dateRange": {
      "start": "2020-01-01",
      "end": "2024-12-31"
    },
    "specialty": "orthopedics"
  },
  "maxResults": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc-123",
      "title": "Systematic Review of Fascial Release Techniques",
      "snippet": "Recent studies demonstrate significant improvements...",
      "source": "Journal of Orthopedic Medicine",
      "evidenceLevel": "1A",
      "relevanceScore": 0.94,
      "url": "https://doi.org/10.1234/example"
    }
  ],
  "totalResults": 47,
  "queryTime": 0.8
}
```

### Patient Management

#### Create Patient Record
```http
POST /api/patients
Authorization: Bearer {token}
Content-Type: application/json

{
  "demographics": {
    "age": 45,
    "gender": "female",
    "height": 165,
    "weight": 70
  },
  "chiefComplaint": "chronic shoulder pain",
  "medicalHistory": ["previous rotator cuff injury"],
  "consentForms": {
    "dataProcessing": true,
    "aiAnalysis": true,
    "researchParticipation": false
  }
}
```

#### Get Patient Data
```http
GET /api/patients/{patientId}
Authorization: Bearer {token}
```

**Note:** Returns encrypted PHI data that is automatically decrypted for authorized users.

### Analytics and Monitoring

#### Usage Statistics
```http
GET /api/analytics/usage
Authorization: Bearer {token}
```

**Response:**
```json
{
  "period": "last_30_days",
  "metrics": {
    "totalQueries": 1247,
    "avgResponseTime": 1.8,
    "costBreakdown": {
      "gpt4o": 24.50,
      "claude": 18.30,
      "gemini": 12.80
    },
    "userSatisfaction": 0.92
  }
}
```

#### System Health
```http
GET /api/health
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "flowise": "up",
    "database": "up",
    "redis": "up",
    "monitoring": "up"
  },
  "performance": {
    "avgResponseTime": 1.2,
    "errorRate": 0.002,
    "uptime": 0.9998
  }
}
```

## Security Features

### Audit Logging
All API calls are automatically logged with:
- User identification
- Timestamp
- Request/response data (PHI encrypted)
- IP address
- User agent
- Response time

### Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per organization
- Elevated limits for enterprise users

### Data Encryption
- All PHI data encrypted with AES-256
- Field-level encryption for sensitive data
- Key rotation every 90 days

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request payload is invalid",
    "details": {
      "field": "patientId",
      "issue": "required field missing"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

### Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error
- `503` - Service Unavailable

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @fbot/api-client
```

```typescript
import { FBotClient } from '@fbot/api-client';

const client = new FBotClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.fbot.ai'
});

const response = await client.chat.sendMessage({
  message: 'What is fascial restriction?',
  sessionId: 'session-123'
});
```

### Python
```bash
pip install fbot-api
```

```python
from fbot import FBotClient

client = FBotClient(api_key='your-api-key')
response = client.chat.send_message(
    message='What is fascial restriction?',
    session_id='session-123'
)
```

## Webhooks

### Configuration
```http
POST /api/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/fbot",
  "events": ["chat.message", "ultrasound.analysis"],
  "secret": "webhook-secret-key"
}
```

### Event Types
- `chat.message` - New chat message processed
- `ultrasound.analysis` - Ultrasound analysis completed
- `patient.created` - New patient record created
- `alert.triggered` - System alert triggered

## Rate Limits and Quotas

### Default Limits
- **Chat API**: 60 requests/minute
- **Ultrasound Analysis**: 10 requests/minute
- **RAG Queries**: 30 requests/minute
- **File Uploads**: 5 requests/minute

### Quota Management
Monthly quotas based on subscription tier:
- **Basic**: 1,000 chat messages, 100 ultrasound analyses
- **Professional**: 10,000 chat messages, 1,000 ultrasound analyses
- **Enterprise**: Unlimited with custom rate limits

## Compliance and Privacy

### HIPAA Compliance
- All PHI encrypted at rest and in transit
- Audit logs maintained for 7 years
- Business Associate Agreements available
- Regular compliance audits

### GDPR Support
- Data subject access requests via API
- Right to erasure implementation
- Consent management tracking
- Data portability features

---

For additional support, visit our [Developer Portal](https://developers.fbot.ai) or contact support@fbot.ai. 