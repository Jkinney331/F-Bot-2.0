# F-Bot 2.0: Enhanced Fascia AI Chatbot

## 🚀 Next-Generation Medical AI Platform

F-Bot 2.0 is a comprehensive, HIPAA-compliant AI platform specializing in fascia health, diagnosis, and treatment guidance. Built on Flowise AI with advanced multi-LLM orchestration, real-time ultrasound analysis, and enterprise-grade security.

## ✨ Key Enhancements in v2.0

### 🧠 Advanced AI Capabilities
- **Multi-LLM Orchestration**: Dynamic model selection with cost optimization across GPT-4o, Claude 3.5, Gemini 1.5, and local LLaMA models
- **Gemma 3n Integration**: Medical-grade ultrasound image analysis with VQA and regression models
- **Enhanced RAG**: Medical-context aware retrieval with evidence grading and fascia-specific relevance scoring
- **Dr. Fascia Personality**: Warm, empathetic therapeutic AI with adaptive conversation flows

### 🏥 Medical-Grade Features
- **HIPAA Compliance**: Full encryption, audit logging, and MIDI de-identification algorithm
- **GDPR Support**: Complete data subject rights management
- **Clarius Integration**: Direct ultrasound device connectivity with live streaming analysis
- **Evidence-Based Medicine**: PubMed integration with research paper validation

### 📊 Enterprise Monitoring
- **Real-Time Cost Tracking**: API usage monitoring with threshold alerts
- **Performance Analytics**: Model performance tracking and optimization
- **Langfuse HIPAA Edition**: Compliant analytics and observability
- **Prometheus + Grafana**: Comprehensive system monitoring

### 🔒 Security & Compliance
- **AES-256 Encryption**: Field-level encryption for sensitive data
- **JWT Security**: Role-based access control (Admin, Physician, Researcher, Patient)
- **Audit Trail**: Tamper-evident logging with 7-year retention
- **Data Retention**: Automated compliance with medical record requirements

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git
- 8GB+ RAM recommended

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Jkinney331/F-Bot-2.0.git
cd F-Bot-2.0
```

2. **Run the automated setup**
```bash
chmod +x setup-scripts/install-flowise.sh
./setup-scripts/install-flowise.sh
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys and settings
```

4. **Deploy with Docker**
```bash
docker-compose -f deployment/enhanced-deployment.yml up -d
```

5. **Access the platform**
- Flowise UI: http://localhost:3000
- Analytics Dashboard: http://localhost:3001
- Monitoring: http://localhost:9090

## 📁 Project Structure

```
F-Bot-2.0/
├── flowise-config/           # Enhanced Flowise configurations
│   ├── enhanced-gemma-ultrasound-integration.js
│   ├── enhanced-monitoring-analytics.js
│   ├── enhanced-medical-compliance.js
│   ├── enhanced-firecrawl-scraper.js
│   ├── clarius-integration.js
│   ├── dr-fascia-personality.js
│   ├── enhanced-medical-rag.js
│   └── enhanced-multi-llm-orchestrator.js
├── deployment/               # Docker configurations
│   └── enhanced-deployment.yml
├── setup-scripts/           # Installation scripts
│   └── install-flowise.sh
├── docs/                    # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── CONFIGURATION.md
│   └── COMPLIANCE.md
├── tests/                   # Test suites
├── config/                  # Environment configurations
└── monitoring/             # Monitoring configurations
```

## 🔧 Configuration

### Environment Variables
```bash
# Core Settings
FLOWISE_USERNAME=admin
FLOWISE_PASSWORD=secure_password_here

# API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key

# Database
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_char_encryption_key

# Compliance
HIPAA_MODE=true
AUDIT_RETENTION_DAYS=2555  # 7 years
```

### Flowise Integration
```bash
# Import configurations
cp flowise-config/*.js /path/to/flowise/custom-tools/
docker-compose restart flowise
```

## 🏥 Medical Compliance Features

### HIPAA Compliance
- **Field-level encryption** for all PHI data
- **Audit logging** with tamper-evident trails
- **Access controls** with role-based permissions
- **Data retention** policies with automated purging

### GDPR Support
- **Data subject rights** management
- **Consent tracking** and withdrawal
- **Data portability** with structured exports
- **Right to erasure** with verification

### Safety Features
- **Contraindication checking** for all recommendations
- **Evidence grading** for medical claims
- **Disclaimer enforcement** for non-diagnostic use
- **Professional oversight** requirements

## 📊 Analytics & Monitoring

### Performance Metrics
- **Response time**: Target <2s for simple queries
- **Accuracy**: >95% for medical terminology
- **Cost efficiency**: 40% reduction vs single-model approach
- **User satisfaction**: Target >90% positive feedback

### Monitoring Dashboard
- Real-time API usage and costs
- Model performance comparison
- Security incident tracking
- Compliance audit reports

## 🔗 Integration Options

### Ultrasound Devices
- **Clarius**: Direct API integration for live analysis
- **Generic DICOM**: Standard medical imaging support
- **Custom devices**: Webhook-based integration

### EHR Systems
- **Epic**: FHIR R4 compatible
- **Cerner**: HL7 messaging support
- **Custom**: REST API endpoints

### Research Platforms
- **PubMed**: Automated literature search
- **Clinical trials**: Integration with trial databases
- **Institutional repositories**: Custom connectors

## 🛡️ Security

### Authentication
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Multi-factor authentication support
- Session management and timeouts

### Encryption
- TLS 1.3 for data in transit
- AES-256 for data at rest
- Field-level encryption for sensitive data
- Key rotation and management

### Monitoring
- Real-time threat detection
- Anomaly detection for unusual patterns
- Automated incident response
- Security audit trails

## 🧪 Testing

### Test Coverage
- Unit tests for all core functions
- Integration tests for API endpoints
- End-to-end testing for user workflows
- Load testing for performance validation

### Medical Safety Testing
- Contraindication detection accuracy
- Evidence source validation
- Disclaimer enforcement verification
- Professional oversight compliance

## 📚 Documentation

- **[API Reference](docs/API.md)**: Complete API documentation
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Production deployment instructions
- **[Configuration Manual](docs/CONFIGURATION.md)**: Detailed configuration options
- **[Compliance Guide](docs/COMPLIANCE.md)**: HIPAA/GDPR compliance details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards and add tests
4. Ensure compliance requirements are met
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Jkinney331/F-Bot-2.0/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Jkinney331/F-Bot-2.0/discussions)
- **Email**: support@fascia-ai.com
- **Documentation**: [Wiki](https://github.com/Jkinney331/F-Bot-2.0/wiki)

## 🔄 Version History

- **v2.0.0**: Complete rewrite with enhanced AI capabilities and medical compliance
- **v1.0.0**: Initial Flowise-based implementation

---

**⚠️ Medical Disclaimer**: F-Bot is designed as a research and educational tool. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions.
