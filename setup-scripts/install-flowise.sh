#!/bin/bash

# Flowise Fascia AI Installation Script
# This script automates the complete setup of the Fascia AI chatbot

set -e

echo "🔧 Starting Flowise Fascia AI Installation..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check RAM
    total_ram=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$total_ram" -lt 8 ]; then
        print_warning "System has less than 8GB RAM. Recommended: 16GB+"
    fi
    
    # Check disk space
    available_space=$(df -BG . | awk 'NR==2{gsub(/G/,"",$4); print $4}')
    if [ "$available_space" -lt 50 ]; then
        print_error "Insufficient disk space. Need at least 50GB free."
        exit 1
    fi
    
    print_success "System requirements check completed"
}

# Install Node.js
install_nodejs() {
    print_status "Installing Node.js 18..."
    
    if command -v node &> /dev/null; then
        current_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$current_version" -ge 18 ]; then
            print_success "Node.js $current_version is already installed"
            return
        fi
    fi
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    print_success "Node.js installed: $(node --version)"
}

# Install Docker
install_docker() {
    print_status "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        print_success "Docker is already installed"
        return
    fi
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully"
    print_warning "Please log out and back in for Docker group changes to take effect"
}

# Create project directory structure
create_project_structure() {
    print_status "Creating project directory structure..."
    
    mkdir -p F-Bot/{
        config,
        data/{documents,uploads},
        logs/{audit,application},
        scripts,
        ssl,
        backups,
        init-scripts
    }
    
    cd F-Bot
    
    print_success "Project structure created"
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    cat > .env << 'EOF'
# Flowise Configuration
PORT=3000
HOST=0.0.0.0
DEBUG=true
NODE_ENV=development

# Database Configuration
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=fasciaai
DATABASE_PASSWORD=CHANGE_THIS_PASSWORD
DATABASE_NAME=fasciaai

# Security
FLOWISE_USERNAME=admin
FLOWISE_PASSWORD=CHANGE_THIS_PASSWORD
SECRETKEY_PATH=./config/secretkey
JWT_SECRET=CHANGE_THIS_JWT_SECRET

# API Keys (REQUIRED - Please fill these in)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here
FIRECRAWL_API_KEY=your_firecrawl_key_here
YOUTUBE_API_KEY=your_youtube_key_here

# Vector Database
QDRANT_API_KEY=your_qdrant_key_here
QDRANT_URL=http://localhost:6333

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD

# Optional APIs
PUBMED_API_KEY=your_pubmed_key_here
LANGSMITH_API_KEY=your_langsmith_key_here

# Logging
LOG_LEVEL=info
LOG_PATH=./logs

# Security
HASH_SALT=CHANGE_THIS_SALT
ENCRYPTION_KEY=CHANGE_THIS_ENCRYPTION_KEY

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
EOF

    print_success "Environment file created: .env"
    print_warning "⚠️  IMPORTANT: Please edit .env file and add your API keys!"
}

# Create Docker Compose file
create_docker_compose() {
    print_status "Creating Docker Compose configuration..."
    
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: fasciaai-postgres
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USERNAME} -d ${DATABASE_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: fasciaai-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:latest
    container_name: fasciaai-qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
EOF

    print_success "Docker Compose file created"
}

# Create database initialization script
create_db_init_script() {
    print_status "Creating database initialization script..."
    
    cat > init-scripts/01-init.sql << 'EOF'
-- Initialize Fascia AI database
-- Create additional schemas and extensions if needed

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id_hash VARCHAR(64),
    session_id_hash VARCHAR(64),
    action VARCHAR(100),
    resource VARCHAR(200),
    outcome VARCHAR(20),
    details JSONB,
    ip_hash VARCHAR(64),
    checksum VARCHAR(64)
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_hash VARCHAR(64),
    message_hash VARCHAR(64),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    categories TEXT[],
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_hash VARCHAR(64)
);

-- Create knowledge base metadata table
CREATE TABLE IF NOT EXISTS knowledge_base_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id VARCHAR(100),
    source_url TEXT,
    title TEXT,
    content_type VARCHAR(50),
    upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    quality_score DECIMAL(3,2),
    metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_knowledge_metadata_type ON knowledge_base_metadata(content_type);

-- Set up permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fasciaai;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fasciaai;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO fasciaai;

-- Success message
SELECT 'Database initialized successfully for Fascia AI' AS message;
EOF

    print_success "Database initialization script created"
}

# Install Flowise
install_flowise() {
    print_status "Installing Flowise..."
    
    # Global installation
    sudo npm install -g flowise
    
    # Verify installation
    if command -v flowise &> /dev/null; then
        print_success "Flowise installed successfully"
    else
        print_error "Flowise installation failed"
        exit 1
    fi
}

# Start services
start_services() {
    print_status "Starting database services..."
    
    # Start Docker services
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service health
    if docker-compose ps | grep -q "Up (healthy)"; then
        print_success "Database services are running"
    else
        print_warning "Some services may not be fully ready. Check with: docker-compose ps"
    fi
}

# Create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    cat > start-fasciaai.sh << 'EOF'
#!/bin/bash

# Fascia AI Startup Script
echo "🚀 Starting Fascia AI Chatbot..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

# Check if API keys are set
if [ "$OPENAI_API_KEY" = "your_openai_key_here" ]; then
    echo "❌ Please set your API keys in .env file first!"
    exit 1
fi

# Start Docker services
echo "📦 Starting database services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 30

# Start Flowise
echo "🤖 Starting Flowise..."
flowise start --env .env

EOF

    chmod +x start-fasciaai.sh
    print_success "Startup script created: start-fasciaai.sh"
}

# Create configuration backup script
create_backup_script() {
    print_status "Creating backup script..."
    
    cat > scripts/backup-config.sh << 'EOF'
#!/bin/bash

# Backup configuration and data
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backup in $BACKUP_DIR..."

# Backup configuration files
cp .env "$BACKUP_DIR/"
cp docker-compose.yml "$BACKUP_DIR/"

# Backup database
docker exec fasciaai-postgres pg_dump -U fasciaai fasciaai > "$BACKUP_DIR/database.sql"

# Backup vector database
docker exec fasciaai-qdrant tar czf - /qdrant/storage > "$BACKUP_DIR/qdrant.tar.gz"

echo "Backup completed: $BACKUP_DIR"
EOF

    chmod +x scripts/backup-config.sh
    print_success "Backup script created"
}

# Generate secure passwords
generate_passwords() {
    print_status "Generating secure passwords..."
    
    # Generate random passwords
    DB_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    HASH_SALT=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    
    # Update .env file
    sed -i "s/CHANGE_THIS_PASSWORD/$DB_PASSWORD/g" .env
    sed -i "s/CHANGE_THIS_REDIS_PASSWORD/$REDIS_PASSWORD/g" .env
    sed -i "s/CHANGE_THIS_JWT_SECRET/$JWT_SECRET/g" .env
    sed -i "s/CHANGE_THIS_SALT/$HASH_SALT/g" .env
    sed -i "s/CHANGE_THIS_ENCRYPTION_KEY/$ENCRYPTION_KEY/g" .env
    
    print_success "Secure passwords generated and applied"
}

# Create API key validation script
create_api_validation() {
    print_status "Creating API key validation script..."
    
    cat > scripts/validate-apis.js << 'EOF'
#!/usr/bin/env node

// API Key Validation Script
require('dotenv').config();

const validateAPIs = async () => {
    const validations = [];
    
    // OpenAI API
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here') {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
            });
            validations.push({
                service: 'OpenAI',
                status: response.ok ? '✅ Valid' : '❌ Invalid',
                details: response.ok ? 'API key working' : 'API key invalid'
            });
        } catch (error) {
            validations.push({
                service: 'OpenAI',
                status: '❌ Error',
                details: error.message
            });
        }
    } else {
        validations.push({
            service: 'OpenAI',
            status: '⚠️ Not Set',
            details: 'API key not configured'
        });
    }
    
    // Anthropic API
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_key_here') {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1,
                    messages: [{ role: 'user', content: 'test' }]
                })
            });
            validations.push({
                service: 'Anthropic',
                status: response.ok ? '✅ Valid' : '❌ Invalid',
                details: response.ok ? 'API key working' : 'API key invalid'
            });
        } catch (error) {
            validations.push({
                service: 'Anthropic',
                status: '❌ Error',
                details: error.message
            });
        }
    } else {
        validations.push({
            service: 'Anthropic',
            status: '⚠️ Not Set',
            details: 'API key not configured'
        });
    }
    
    // Display results
    console.log('\n🔑 API Key Validation Results:');
    console.log('================================');
    validations.forEach(v => {
        console.log(`${v.service}: ${v.status} - ${v.details}`);
    });
    console.log('');
    
    const validKeys = validations.filter(v => v.status.includes('✅')).length;
    const totalKeys = validations.length;
    
    if (validKeys === totalKeys) {
        console.log('🎉 All API keys are valid!');
        process.exit(0);
    } else if (validKeys > 0) {
        console.log(`⚠️ ${validKeys}/${totalKeys} API keys are valid. Please check the others.`);
        process.exit(1);
    } else {
        console.log('❌ No valid API keys found. Please configure your .env file.');
        process.exit(1);
    }
};

validateAPIs().catch(console.error);
EOF

    chmod +x scripts/validate-apis.js
    print_success "API validation script created"
}

# Main installation process
main() {
    echo "🚀 Welcome to Flowise Fascia AI Installation!"
    echo "This script will set up everything you need to run the Fascia AI chatbot."
    echo ""
    
    read -p "Continue with installation? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Installation cancelled"
        exit 0
    fi
    
    check_requirements
    install_nodejs
    install_docker
    create_project_structure
    create_env_file
    create_docker_compose
    create_db_init_script
    install_flowise
    generate_passwords
    start_services
    create_startup_script
    create_backup_script
    create_api_validation
    
    print_success "🎉 Installation completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Edit .env file and add your API keys:"
    echo "   - OpenAI API Key"
    echo "   - Anthropic API Key" 
    echo "   - Google API Key"
    echo "   - FireCrawl API Key"
    echo "   - YouTube API Key"
    echo ""
    echo "2. Validate your API keys:"
    echo "   node scripts/validate-apis.js"
    echo ""
    echo "3. Start the Fascia AI system:"
    echo "   ./start-fasciaai.sh"
    echo ""
    echo "4. Access Flowise UI at: http://localhost:3000"
    echo ""
    echo "📚 Documentation: See flowise-implementation-guide.md for detailed setup instructions"
    echo ""
}

# Run main installation
main "$@" 