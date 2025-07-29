# F-Bot 2.0 Configuration Manual

## Overview

This guide covers all configuration options for F-Bot 2.0, including environment variables, Flowise settings, and specialized configurations for HIPAA compliance and multi-LLM orchestration.

## Environment Configuration

### Core Application Settings

```bash
# === Application Core ===
NODE_ENV=production                    # Environment: development, staging, production
PORT=3000                             # Application port
HOST=0.0.0.0                          # Bind address
APP_NAME=F-Bot-2.0                    # Application identifier
VERSION=2.0.0                         # Version string

# === Logging ===
LOG_LEVEL=info                        # Levels: error, warn, info, debug, trace
LOG_FORMAT=json                       # Formats: json, text, structured
LOG_OUTPUT=file                       # Outputs: console, file, both
LOG_FILE_PATH=/var/log/fbot/app.log   # Log file location
LOG_MAX_SIZE=100MB                    # Maximum log file size
LOG_MAX_FILES=10                      # Maximum number of log files
```

### Database Configuration

```bash
# === PostgreSQL Database ===
DATABASE_TYPE=postgres                # Database type
DATABASE_HOST=localhost               # Database host
DATABASE_PORT=5432                    # Database port
DATABASE_NAME=fbot_production         # Database name
DATABASE_USERNAME=fbot_user           # Database username
DATABASE_PASSWORD=secure_password     # Database password
DATABASE_SSL=true                     # Enable SSL
DATABASE_SSL_CA=/path/to/ca.pem       # SSL CA certificate
DATABASE_POOL_MIN=5                   # Minimum connections
DATABASE_POOL_MAX=20                  # Maximum connections
DATABASE_TIMEOUT=30000                # Connection timeout (ms)
DATABASE_ENCRYPT_FIELDS=true          # Enable field-level encryption

# === Connection String (Alternative) ===
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

### Redis Configuration

```bash
# === Redis Cache ===
REDIS_HOST=localhost                  # Redis host
REDIS_PORT=6379                       # Redis port
REDIS_PASSWORD=redis_password         # Redis password
REDIS_SSL=true                        # Enable SSL/TLS
REDIS_SSL_CA=/path/to/redis-ca.pem    # SSL CA certificate
REDIS_DB=0                            # Redis database number
REDIS_KEY_PREFIX=fbot:                # Key prefix
REDIS_TTL=3600                        # Default TTL (seconds)
REDIS_MAX_RETRIES=3                   # Connection retry attempts
REDIS_RETRY_DELAY=1000                # Retry delay (ms)

# === Session Management ===
SESSION_STORE=redis                   # Session store type
SESSION_SECRET=session_secret_key     # Session encryption key
SESSION_TTL=7200                      # Session timeout (seconds)
SESSION_ROLLING=true                  # Rolling session expiration
```

### AI Model Configuration

```bash
# === Multi-LLM Orchestration ===
LLM_ORCHESTRATION_ENABLED=true        # Enable multi-LLM orchestration
LLM_DEFAULT_MODEL=gpt-4o              # Default model
LLM_COST_OPTIMIZATION=true            # Enable cost optimization
LLM_PERFORMANCE_TRACKING=true         # Track model performance
LLM_FALLBACK_ENABLED=true             # Enable fallback models

# === OpenAI Configuration ===
OPENAI_API_KEY=your_openai_key        # OpenAI API key
OPENAI_ORGANIZATION=your_org_id       # OpenAI organization ID
OPENAI_BASE_URL=https://api.openai.com/v1  # API base URL
OPENAI_TIMEOUT=120000                 # Request timeout (ms)
OPENAI_MAX_RETRIES=3                  # Maximum retries
OPENAI_MODELS=gpt-4o,gpt-4-turbo,gpt-3.5-turbo  # Available models

# === Anthropic Configuration ===
ANTHROPIC_API_KEY=your_anthropic_key  # Anthropic API key
ANTHROPIC_BASE_URL=https://api.anthropic.com  # API base URL
ANTHROPIC_TIMEOUT=120000              # Request timeout (ms)
ANTHROPIC_MAX_RETRIES=3               # Maximum retries
ANTHROPIC_MODELS=claude-3.5-sonnet,claude-3-opus,claude-3-haiku  # Available models

# === Google AI Configuration ===
GOOGLE_API_KEY=your_google_key        # Google AI API key
GOOGLE_PROJECT_ID=your_project_id     # Google Cloud project ID
GOOGLE_LOCATION=us-central1           # Google Cloud location
GOOGLE_MODELS=gemini-1.5-pro,gemini-1.5-flash  # Available models

# === Local LLM Configuration ===
LOCAL_LLM_ENABLED=false               # Enable local LLM
LOCAL_LLM_HOST=localhost              # Local LLM host
LOCAL_LLM_PORT=8080                   # Local LLM port
LOCAL_LLM_MODEL=llama-2-70b           # Local model name
LOCAL_LLM_CONTEXT_LENGTH=4096         # Context length
```

### Security Configuration

```bash
# === Authentication & Authorization ===
JWT_SECRET=your_jwt_secret            # JWT signing secret
JWT_EXPIRES_IN=3600                   # JWT expiration (seconds)
JWT_REFRESH_EXPIRES_IN=86400          # Refresh token expiration
JWT_ALGORITHM=HS256                   # JWT algorithm
JWT_ISSUER=fbot.ai                    # JWT issuer
JWT_AUDIENCE=fbot-users               # JWT audience

# === Encryption ===
ENCRYPTION_ALGORITHM=aes-256-gcm      # Encryption algorithm
ENCRYPTION_KEY=your_32_char_key       # Encryption key (32 characters)
ENCRYPTION_IV_LENGTH=16               # IV length
FIELD_ENCRYPTION_ENABLED=true        # Enable field-level encryption
KEY_ROTATION_INTERVAL=90              # Key rotation interval (days)

# === Password Policy ===
PASSWORD_MIN_LENGTH=12                # Minimum password length
PASSWORD_REQUIRE_UPPERCASE=true       # Require uppercase letters
PASSWORD_REQUIRE_LOWERCASE=true       # Require lowercase letters
PASSWORD_REQUIRE_NUMBERS=true         # Require numbers
PASSWORD_REQUIRE_SYMBOLS=true         # Require symbols
PASSWORD_MAX_AGE=90                   # Password expiration (days)

# === Rate Limiting ===
RATE_LIMIT_ENABLED=true               # Enable rate limiting
RATE_LIMIT_WINDOW=60                  # Rate limit window (seconds)
RATE_LIMIT_MAX_REQUESTS=100           # Max requests per window
RATE_LIMIT_SKIP_TRUSTED=true          # Skip rate limiting for trusted IPs
TRUSTED_IPS=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16  # Trusted IP ranges
```

### HIPAA Compliance Configuration

```bash
# === HIPAA Compliance ===
HIPAA_MODE=true                       # Enable HIPAA compliance mode
HIPAA_ENCRYPTION_REQUIRED=true        # Require encryption for PHI
HIPAA_AUDIT_ENABLED=true              # Enable audit logging
HIPAA_AUDIT_RETENTION_DAYS=2555       # Audit retention (7 years)
HIPAA_DATA_MINIMIZATION=true          # Enable data minimization
HIPAA_BREACH_NOTIFICATION=true        # Enable breach notifications

# === De-identification ===
DEIDENTIFICATION_ENABLED=true         # Enable de-identification
DEIDENTIFICATION_METHOD=MIDI          # Method: MIDI, HIPAA_Safe_Harbor
DEIDENTIFICATION_PRESERVE_DATES=false # Preserve date structures
DEIDENTIFICATION_PRESERVE_AGES=true   # Preserve age ranges

# === Access Controls ===
RBAC_ENABLED=true                     # Enable role-based access control
MFA_REQUIRED=true                     # Require multi-factor authentication
SESSION_TIMEOUT=1800                  # Session timeout (seconds)
IDLE_TIMEOUT=900                      # Idle timeout (seconds)
CONCURRENT_SESSIONS_LIMIT=3           # Maximum concurrent sessions

# === Data Retention ===
DATA_RETENTION_ENABLED=true           # Enable data retention policies
DATA_RETENTION_DEFAULT_DAYS=2555      # Default retention period
DATA_RETENTION_PHI_DAYS=2555          # PHI retention period
DATA_RETENTION_AUDIT_DAYS=2555        # Audit log retention
AUTO_PURGE_ENABLED=true               # Enable automatic data purging
```

### GDPR Configuration

```bash
# === GDPR Compliance ===
GDPR_ENABLED=true                     # Enable GDPR compliance
GDPR_DATA_RESIDENCY=EU                # Data residency region
GDPR_CONSENT_REQUIRED=true            # Require explicit consent
GDPR_CONSENT_TRACKING=true            # Track consent history
GDPR_RIGHT_TO_ERASURE=true            # Enable right to erasure
GDPR_DATA_PORTABILITY=true            # Enable data portability
GDPR_BREACH_NOTIFICATION_HOURS=72     # Breach notification window

# === Cookie Management ===
COOKIE_CONSENT_REQUIRED=true          # Require cookie consent
COOKIE_ESSENTIAL_ONLY=false           # Allow only essential cookies
COOKIE_ANALYTICS_ENABLED=true         # Enable analytics cookies
COOKIE_MARKETING_ENABLED=false        # Enable marketing cookies
```

### Monitoring and Analytics

```bash
# === Monitoring ===
MONITORING_ENABLED=true               # Enable monitoring
PROMETHEUS_ENABLED=true               # Enable Prometheus metrics
PROMETHEUS_PORT=9090                  # Prometheus port
PROMETHEUS_ENDPOINT=/metrics          # Metrics endpoint
GRAFANA_ENABLED=true                  # Enable Grafana dashboard
GRAFANA_PORT=3001                     # Grafana port

# === Health Checks ===
HEALTH_CHECK_ENABLED=true             # Enable health checks
HEALTH_CHECK_ENDPOINT=/health         # Health check endpoint
HEALTH_CHECK_INTERVAL=30              # Health check interval (seconds)
HEALTH_CHECK_TIMEOUT=5000             # Health check timeout (ms)
READINESS_CHECK_ENDPOINT=/ready       # Readiness check endpoint

# === Analytics ===
ANALYTICS_ENABLED=true                # Enable analytics
ANALYTICS_PROVIDER=langfuse           # Analytics provider
LANGFUSE_SECRET_KEY=your_secret       # Langfuse secret key
LANGFUSE_PUBLIC_KEY=your_public_key   # Langfuse public key
LANGFUSE_HOST=https://cloud.langfuse.com  # Langfuse host
ANALYTICS_SAMPLING_RATE=1.0           # Sampling rate (0.0-1.0)

# === Cost Tracking ===
COST_TRACKING_ENABLED=true            # Enable cost tracking
COST_ALERT_THRESHOLD=100              # Cost alert threshold (USD)
COST_ALERT_EMAIL=admin@fbot.ai        # Cost alert email
COST_REPORTING_INTERVAL=daily         # Cost reporting interval
```

### File Storage Configuration

```bash
# === File Storage ===
STORAGE_TYPE=s3                       # Storage type: local, s3, azure, gcp
STORAGE_ENCRYPTION=true               # Enable storage encryption
STORAGE_BACKUP_ENABLED=true           # Enable automatic backups

# === AWS S3 Configuration ===
AWS_ACCESS_KEY_ID=your_access_key     # AWS access key
AWS_SECRET_ACCESS_KEY=your_secret_key # AWS secret key
AWS_REGION=us-east-1                  # AWS region
AWS_S3_BUCKET=fbot-production-files   # S3 bucket name
AWS_S3_ENCRYPTION=AES256              # S3 encryption type
AWS_S3_VERSIONING=true                # Enable S3 versioning

# === Azure Blob Configuration ===
AZURE_STORAGE_ACCOUNT=fbotprod        # Azure storage account
AZURE_STORAGE_KEY=your_storage_key    # Azure storage key
AZURE_CONTAINER_NAME=fbot-files       # Azure container name

# === Google Cloud Storage ===
GCP_PROJECT_ID=your_project_id        # GCP project ID
GCP_KEY_FILE=/path/to/service-key.json # GCP service account key
GCP_BUCKET_NAME=fbot-production-files # GCS bucket name
```

### Ultrasound Integration

```bash
# === Gemma Model Configuration ===
GEMMA_ULTRASOUND_ENABLED=true         # Enable Gemma ultrasound analysis
GEMMA_MODEL_PATH=/models/gemma-3n     # Model path
GEMMA_CONFIDENCE_THRESHOLD=0.7        # Confidence threshold
GEMMA_MAX_IMAGE_SIZE=10485760         # Max image size (10MB)
GEMMA_SUPPORTED_FORMATS=jpg,png,dicom # Supported formats

# === Clarius Integration ===
CLARIUS_INTEGRATION_ENABLED=false     # Enable Clarius integration
CLARIUS_API_URL=https://api.clarius.com # Clarius API URL
CLARIUS_API_KEY=your_clarius_key      # Clarius API key
CLARIUS_DEVICE_TIMEOUT=30000          # Device timeout (ms)
CLARIUS_STREAM_QUALITY=high           # Stream quality: low, medium, high

# === DICOM Support ===
DICOM_ENABLED=true                    # Enable DICOM support
DICOM_MAX_FILE_SIZE=52428800          # Max DICOM file size (50MB)
DICOM_ANONYMIZATION=true              # Enable DICOM anonymization
DICOM_STORAGE_PATH=/var/dicom         # DICOM storage path
```

## Flowise Configuration

### Custom Tool Configuration

```javascript
// flowise-config/enhanced-multi-llm-orchestrator.js
const config = {
  modelSelection: {
    costOptimization: true,
    performanceWeight: 0.4,
    costWeight: 0.6,
    latencyWeight: 0.3
  },
  fallbackStrategy: {
    enabled: true,
    maxRetries: 3,
    backoffMultiplier: 2
  },
  models: {
    'gpt-4o': {
      costPerToken: 0.00003,
      maxTokens: 128000,
      capabilities: ['text', 'vision', 'reasoning']
    },
    'claude-3.5-sonnet': {
      costPerToken: 0.000015,
      maxTokens: 200000,
      capabilities: ['text', 'reasoning', 'code']
    }
  }
};
```

### Medical RAG Configuration

```javascript
// Enhanced Medical RAG Settings
const medicalRagConfig = {
  vectorStore: {
    type: 'pinecone',
    dimensions: 1536,
    metric: 'cosine'
  },
  evidenceGrading: {
    enabled: true,
    levels: ['1A', '1B', '2A', '2B', '3A', '3B', '4', '5'],
    weights: {
      '1A': 1.0,
      '1B': 0.9,
      '2A': 0.8,
      '2B': 0.7,
      '3A': 0.6,
      '3B': 0.5,
      '4': 0.4,
      '5': 0.3
    }
  },
  fasciaRelevance: {
    enabled: true,
    keywords: ['fascia', 'myofascial', 'connective tissue'],
    boostFactor: 1.5
  },
  safetyFilters: {
    contraindications: true,
    adverseEffects: true,
    disclaimer: true
  }
};
```

### Dr. Fascia Personality Configuration

```javascript
// Dr. Fascia Personality Settings
const personalityConfig = {
  communicationStyle: {
    warmth: 0.8,
    empathy: 0.9,
    professionalism: 0.85,
    encouragement: 0.7
  },
  culturalAdaptation: {
    enabled: true,
    detectLanguage: true,
    adaptTone: true
  },
  therapeuticApproach: {
    motivationalInterviewing: true,
    progressCelebration: true,
    goalSetting: true,
    emotionalSupport: true
  },
  disclaimers: {
    educationalPurpose: true,
    notMedicalAdvice: true,
    consultProfessional: true
  }
};
```

## Advanced Configuration

### Load Balancing Configuration

```yaml
# nginx-load-balancer.conf
upstream fbot_backend {
    least_conn;
    server 10.0.1.10:3000 weight=3 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 weight=3 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 weight=2 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name fbot.yourdomain.com;
    
    location / {
        proxy_pass http://fbot_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Health check
        proxy_next_upstream error timeout http_500 http_502 http_503;
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

### Backup Configuration

```bash
# === Backup Settings ===
BACKUP_ENABLED=true                   # Enable automatic backups
BACKUP_SCHEDULE=0 2 * * *             # Backup schedule (cron format)
BACKUP_RETENTION_DAYS=30              # Backup retention period
BACKUP_ENCRYPTION=true                # Encrypt backups
BACKUP_ENCRYPTION_KEY=backup_key      # Backup encryption key

# === Database Backup ===
DB_BACKUP_ENABLED=true                # Enable database backups
DB_BACKUP_TYPE=full                   # Backup type: full, incremental
DB_BACKUP_COMPRESSION=gzip            # Compression: gzip, lzma, none

# === File Backup ===
FILE_BACKUP_ENABLED=true              # Enable file backups
FILE_BACKUP_EXCLUDE=*.tmp,*.log       # Exclude patterns
FILE_BACKUP_INCLUDE=*.json,*.js       # Include patterns

# === Remote Backup ===
REMOTE_BACKUP_ENABLED=true            # Enable remote backups
REMOTE_BACKUP_TYPE=s3                 # Remote storage type
REMOTE_BACKUP_BUCKET=fbot-backups     # Remote backup bucket
REMOTE_BACKUP_REGION=us-east-1        # Remote backup region
```

### Disaster Recovery Configuration

```bash
# === Disaster Recovery ===
DR_ENABLED=true                       # Enable disaster recovery
DR_RTO=4                              # Recovery Time Objective (hours)
DR_RPO=1                              # Recovery Point Objective (hours)
DR_BACKUP_FREQUENCY=hourly            # Backup frequency
DR_REPLICATION_ENABLED=true           # Enable database replication
DR_SECONDARY_REGION=us-west-2         # Secondary region
DR_FAILOVER_THRESHOLD=5               # Failover threshold (minutes)
```

## Configuration Templates

### Development Environment

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/fbot_dev
REDIS_URL=redis://localhost:6379/1
HIPAA_MODE=false
MONITORING_ENABLED=false
COST_TRACKING_ENABLED=false
```

### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_URL=postgresql://staging_user:staging_pass@staging-db:5432/fbot_staging
REDIS_URL=redis://staging-redis:6379/0
HIPAA_MODE=true
MONITORING_ENABLED=true
COST_TRACKING_ENABLED=true
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_URL=postgresql://prod_user:secure_pass@prod-db:5432/fbot_production
REDIS_URL=redis://prod-redis:6379/0
HIPAA_MODE=true
MONITORING_ENABLED=true
COST_TRACKING_ENABLED=true
ANALYTICS_ENABLED=true
```

## Configuration Validation

### Environment Validator

```javascript
// config/validator.js
const requiredVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'ENCRYPTION_KEY'
];

const validateConfig = () => {
  const missing = requiredVars.filter(var => !process.env[var]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate encryption key length
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
  }
  
  // Validate HIPAA mode requirements
  if (process.env.HIPAA_MODE === 'true') {
    const hipaaRequired = ['ENCRYPTION_KEY', 'AUDIT_RETENTION_DAYS'];
    const hipaaMissing = hipaaRequired.filter(var => !process.env[var]);
    if (hipaaMissing.length > 0) {
      throw new Error(`HIPAA mode requires: ${hipaaMissing.join(', ')}`);
    }
  }
};
```

### Configuration Schema

```yaml
# config/schema.yaml
type: object
required:
  - NODE_ENV
  - PORT
  - DATABASE_URL
  - REDIS_URL
  - JWT_SECRET
properties:
  NODE_ENV:
    type: string
    enum: [development, staging, production]
  PORT:
    type: integer
    minimum: 1
    maximum: 65535
  LOG_LEVEL:
    type: string
    enum: [error, warn, info, debug, trace]
  HIPAA_MODE:
    type: boolean
  ENCRYPTION_KEY:
    type: string
    minLength: 32
    maxLength: 32
```

## Best Practices

### Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **Key Rotation**: Implement regular key rotation (every 90 days)
3. **Least Privilege**: Grant minimal required permissions
4. **Encryption**: Enable encryption for all sensitive data
5. **Monitoring**: Monitor all configuration changes

### Performance Best Practices

1. **Connection Pooling**: Configure appropriate database connection pools
2. **Caching**: Enable Redis caching for frequently accessed data
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Resource Limits**: Set appropriate memory and CPU limits
5. **Health Checks**: Configure comprehensive health checks

### Compliance Best Practices

1. **Audit Logging**: Enable comprehensive audit logging
2. **Data Retention**: Implement proper data retention policies
3. **Access Controls**: Enforce strict access controls
4. **Backup Verification**: Regularly test backup and recovery procedures
5. **Documentation**: Maintain detailed configuration documentation

---

For additional configuration support, see the [Deployment Guide](DEPLOYMENT.md) or contact support@fbot.ai. 