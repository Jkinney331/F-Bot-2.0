# F-Bot 2.0 Quick Start Guide

## 🚀 Get F-Bot 2.0 Running in 5 Minutes

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (if running locally)
- Git

### Option 1: Docker Quick Start (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/Jkinney331/F-Bot-2.0.git
cd F-Bot-2.0

# 2. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 3. Deploy with Docker
docker-compose -f deployment/enhanced-deployment.yml up -d

# 4. Access F-Bot
# Flowise UI: http://localhost:3000
# Monitoring: http://localhost:9090
```

### Option 2: Local Development Setup

```bash
# 1. Clone and install
git clone https://github.com/Jkinney331/F-Bot-2.0.git
cd F-Bot-2.0
npm install

# 2. Install Flowise
npm run install:flowise

# 3. Configure environment
cp .env.example .env
# Add your API keys to .env

# 4. Set up database
npm run migrate

# 5. Start development server
npm run dev
```

### Essential Environment Variables

Add these to your `.env` file:

```bash
# Required API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key

# Database (for production)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Security
JWT_SECRET=your_32_character_secret_key
ENCRYPTION_KEY=your_32_character_encryption_key

# Enable HIPAA mode for production
HIPAA_MODE=true
```

### Verify Installation

```bash
# Check health
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","version":"2.0.0"}
```

### Next Steps

1. **Configure AI Models**: See [Configuration Guide](docs/CONFIGURATION.md)
2. **Set up HIPAA Compliance**: See [Compliance Guide](docs/COMPLIANCE.md)
3. **Deploy to Production**: See [Deployment Guide](docs/DEPLOYMENT.md)
4. **API Integration**: See [API Reference](docs/API.md)

### Need Help?

- 📖 [Full Documentation](docs/)
- 🐛 [Report Issues](https://github.com/Jkinney331/F-Bot-2.0/issues)
- 💬 [Discussions](https://github.com/Jkinney331/F-Bot-2.0/discussions)
- ✉️ support@fbot.ai

---

**⚠️ Important**: For production use, ensure all security configurations are properly set according to the [Compliance Guide](docs/COMPLIANCE.md). 