# F-Bot 2.0 Deployment Guide

## Overview

This guide covers production deployment of F-Bot 2.0 with full HIPAA compliance, high availability, and enterprise-grade monitoring.

## Prerequisites

### System Requirements
- **CPU**: 8+ cores (16+ recommended for production)
- **RAM**: 16GB minimum (32GB recommended)
- **Storage**: 100GB SSD minimum (500GB recommended)
- **Network**: 1Gbps bandwidth
- **OS**: Ubuntu 22.04 LTS / RHEL 8+ / CentOS 8+

### Software Dependencies
- Docker 24.0+ and Docker Compose v2
- Node.js 18.x LTS
- PostgreSQL 15+ (or managed service)
- Redis 7.0+ (or managed service)
- Nginx 1.20+ (reverse proxy)
- Certbot (SSL certificates)

### Infrastructure Services
- **Database**: PostgreSQL with encryption at rest
- **Cache**: Redis with persistence
- **Object Storage**: AWS S3 / Azure Blob / Google Cloud Storage
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or managed service
- **Security**: WAF, DDoS protection

## Quick Deployment

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/Jkinney331/F-Bot-2.0.git
cd F-Bot-2.0

# Create environment file
cp .env.example .env

# Generate secure keys
openssl rand -hex 32 > .jwt_secret
openssl rand -hex 32 > .encryption_key
```

### 2. Configure Environment

Edit `.env` file with your production settings:

```bash
# === Core Configuration ===
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# === Database ===
DATABASE_TYPE=postgres
DATABASE_HOST=db.example.com
DATABASE_PORT=5432
DATABASE_NAME=fbot_production
DATABASE_USERNAME=fbot_user
DATABASE_PASSWORD=your_secure_password
DATABASE_SSL=true

# === Redis Cache ===
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_SSL=true

# === Security ===
JWT_SECRET=your_jwt_secret_from_file
ENCRYPTION_KEY=your_encryption_key_from_file
SESSION_TIMEOUT=3600
CORS_ORIGIN=https://fbot.yourdomain.com

# === API Keys ===
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
LANGFUSE_SECRET_KEY=your_langfuse_key
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_HOST=https://cloud.langfuse.com

# === File Storage ===
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=fbot-production-files

# === Compliance ===
HIPAA_MODE=true
AUDIT_RETENTION_DAYS=2555
GDPR_ENABLED=true
DATA_RESIDENCY=US

# === Monitoring ===
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
HEALTH_CHECK_INTERVAL=30
LOG_LEVEL=info
```

### 3. Deploy with Docker

```bash
# Production deployment
docker-compose -f deployment/enhanced-deployment.yml up -d

# Verify deployment
docker-compose ps
docker-compose logs -f flowise
```

## Production Architecture

### High-Level Architecture
```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (AWS ALB)    │
                    └─────────────────┘
                             │
                    ┌─────────────────┐
                    │  Reverse Proxy  │
                    │     (Nginx)     │
                    └─────────────────┘
                             │
           ┌─────────────────────────────────┐
           │                                 │
    ┌─────────────┐                  ┌─────────────┐
    │  F-Bot 2.0  │                  │   Flowise   │
    │ Application │                  │  Instance   │
    └─────────────┘                  └─────────────┘
           │                                 │
    ┌─────────────────────────────────────────────┐
    │              Shared Services                │
    ├─────────────┬─────────────┬─────────────────┤
    │ PostgreSQL  │    Redis    │   Monitoring    │
    │  Database   │    Cache    │ (Prometheus)    │
    └─────────────┴─────────────┴─────────────────┘
```

### Container Architecture
- **Application**: F-Bot 2.0 main service
- **Flowise**: AI workflow engine
- **Database**: PostgreSQL with encryption
- **Cache**: Redis for session management
- **Monitoring**: Prometheus + Grafana
- **Analytics**: Langfuse for AI observability

## Infrastructure Setup

### AWS Deployment

#### 1. ECS Fargate Setup
```yaml
# ecs-task-definition.json
{
  "family": "fbot-production",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/fbot-task-role",
  "containerDefinitions": [
    {
      "name": "fbot-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/fbot:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:fbot/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/fbot",
          "awslogs-region": "us-east-1"
        }
      }
    }
  ]
}
```

#### 2. RDS Configuration
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier fbot-production \
  --db-instance-class db.r5.xlarge \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --master-username fbot_admin \
  --master-user-password your_secure_password \
  --vpc-security-group-ids sg-12345678 \
  --backup-retention-period 30 \
  --multi-az
```

#### 3. ElastiCache Setup
```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id fbot-redis \
  --cache-node-type cache.r6g.large \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --security-group-ids sg-87654321 \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled
```

### Kubernetes Deployment

#### 1. Namespace and RBAC
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: fbot
  labels:
    name: fbot
    compliance: hipaa
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fbot-service-account
  namespace: fbot
```

#### 2. ConfigMap and Secrets
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fbot-config
  namespace: fbot
data:
  NODE_ENV: "production"
  HIPAA_MODE: "true"
  LOG_LEVEL: "info"
---
apiVersion: v1
kind: Secret
metadata:
  name: fbot-secrets
  namespace: fbot
type: Opaque
data:
  database-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-secret>
  encryption-key: <base64-encoded-key>
```

#### 3. Deployment
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fbot-app
  namespace: fbot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fbot
  template:
    metadata:
      labels:
        app: fbot
        version: v2.0
    spec:
      serviceAccountName: fbot-service-account
      containers:
      - name: fbot
        image: fbot:v2.0
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: fbot-config
        - secretRef:
            name: fbot-secrets
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Security Configuration

### SSL/TLS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d fbot.yourdomain.com

# Auto-renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /etc/crontab
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/fbot
server {
    listen 443 ssl http2;
    server_name fbot.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/fbot.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fbot.yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
    
    # Rate limiting
    limit_req zone=api burst=10 nodelay;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/health;
    }
}

# Rate limiting configuration
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

### Firewall Configuration

```bash
# UFW firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Database access (restrict to application servers)
sudo ufw allow from 10.0.1.0/24 to any port 5432
sudo ufw allow from 10.0.1.0/24 to any port 6379
```

## Monitoring and Observability

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "fbot_rules.yml"

scrape_configs:
  - job_name: 'fbot-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
      
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboards

Import the following dashboard IDs:
- **Node Exporter**: 1860
- **PostgreSQL**: 9628
- **Redis**: 763
- **F-Bot Custom**: See `monitoring/fbot-dashboard.json`

### Health Checks

```bash
# Application health
curl https://fbot.yourdomain.com/health

# Database connectivity
curl https://fbot.yourdomain.com/health/database

# Redis connectivity
curl https://fbot.yourdomain.com/health/redis

# AI model availability
curl https://fbot.yourdomain.com/health/models
```

## Backup and Recovery

### Database Backups

```bash
#!/bin/bash
# backup.sh - Daily backup script

BACKUP_DIR="/var/backups/fbot"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="fbot_production"

# Create encrypted backup
pg_dump $DB_NAME | gzip | gpg --cipher-algo AES256 --compress-algo 1 \
  --symmetric --output $BACKUP_DIR/fbot_$DATE.sql.gz.gpg

# Upload to S3
aws s3 cp $BACKUP_DIR/fbot_$DATE.sql.gz.gpg s3://fbot-backups/database/

# Cleanup local files older than 7 days
find $BACKUP_DIR -name "*.gpg" -type f -mtime +7 -delete

# Verify backup integrity
gpg --decrypt $BACKUP_DIR/fbot_$DATE.sql.gz.gpg | gunzip | head -n 10
```

### Recovery Procedures

```bash
# Database recovery
aws s3 cp s3://fbot-backups/database/fbot_20240115_120000.sql.gz.gpg .
gpg --decrypt fbot_20240115_120000.sql.gz.gpg | gunzip | psql fbot_production

# File recovery
aws s3 sync s3://fbot-backups/files/ /var/lib/fbot/files/

# Configuration recovery
kubectl apply -f backup/k8s-manifests/
```

## Scaling

### Horizontal Scaling

```yaml
# hpa.yaml - Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fbot-hpa
  namespace: fbot
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fbot-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Vertical Scaling

```bash
# Update resource limits
kubectl patch deployment fbot-app -p '{"spec":{"template":{"spec":{"containers":[{"name":"fbot","resources":{"requests":{"memory":"4Gi","cpu":"2000m"},"limits":{"memory":"8Gi","cpu":"4000m"}}}]}}}}'
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check connectivity
telnet db.example.com 5432

# Verify credentials
psql -h db.example.com -U fbot_user -d fbot_production

# Check SSL configuration
psql "sslmode=require host=db.example.com dbname=fbot_production user=fbot_user"
```

#### 2. Memory Issues
```bash
# Check memory usage
docker stats fbot-app

# Increase Node.js heap size
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

#### 3. SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/fbot.yourdomain.com/cert.pem -text -noout

# Test SSL configuration
openssl s_client -connect fbot.yourdomain.com:443
```

### Log Analysis

```bash
# Application logs
docker logs fbot-app --tail 100 -f

# Database logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u docker -f
```

## Maintenance

### Regular Tasks

1. **Weekly**: Update system packages
2. **Monthly**: Rotate encryption keys
3. **Quarterly**: Security audit and penetration testing
4. **Annually**: Compliance certification renewal

### Update Procedures

```bash
# Application updates
git pull origin main
docker-compose build
docker-compose up -d

# Database migrations
npm run migrate:up

# Configuration updates
kubectl apply -f k8s/
kubectl rollout restart deployment/fbot-app
```

---

For additional support, contact devops@fbot.ai or see our [Troubleshooting Guide](https://docs.fbot.ai/troubleshooting). 