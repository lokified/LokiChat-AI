# LokiChat AI

An offline AI chat application that runs entirely on your local machine, providing privacy and control over your conversations.

## Overview

LokiChat AI is a comprehensive chat application that combines:
- **Backend**: Spring Boot with Spring AI framework
- **AI Model**: Ollama for local AI model execution
- **Frontend**: Next.js for modern chat interface
- **Database**: PostgreSQL for conversation persistence
- **Deployment**: Docker Compose for seamless local deployment

## Features

- 🤖 Offline AI chat with local model execution
- 💬 Create and manage multiple conversations
- 💾 Persistent chat history stored in PostgreSQL
- 🐳 Docker containerization for easy deployment
- 🌐 Modern web interface built with Next.js
- 🔒 Complete privacy - no data leaves your machine

## Prerequisites

- Docker and Docker Compose
- Node.js (for frontend development)
- PM2 (for process management)
- Apache (for production frontend serving)

## Quick Start with Docker Compose

### 1. Environment Configuration

First, create a `.env` file in your project root:

```env
DB_USER=your_db_username
DB_PASSWORD=your_secure_password
```

**⚠️ Important**: Change the default database credentials in your `.env` file for security.

### 2. Docker Compose Setup

Create or update your `docker-compose.yml`:

### 3. Deploy with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Configure AI Models

After starting the containers, you need to pull your preferred AI model into Ollama:

```bash
# Access the Ollama container
docker exec -it lokichat_ollama ollama pull llama2

# Or pull other models like:
docker exec -it lokichat_ollama ollama pull mistral
docker exec -it lokichat_ollama ollama pull codellama

# List available models
docker exec -it lokichat_ollama ollama list
```

Popular model options:
- `llama2` - General purpose chat
- `mistral` - Fast and efficient
- `codellama` - Code-focused conversations
- `phi` - Lightweight option

## Frontend Setup (Next.js)

### Development Mode

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Production Deployment with PM2

#### 1. Install PM2 globally

```bash
npm install -g pm2
```

#### 2. Build the Next.js application

```bash
# In frontend directory
npm run build
```

#### 3. Create PM2 ecosystem file

Create `ecosystem.config.js` in your frontend directory:

```javascript
module.exports = {
  apps: [{
    name: 'lokichat-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/frontend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

#### 4. Start with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Backend Setup (Spring Boot)

### Local Development

```bash
# Navigate to backend directory
cd backend

# Run with Maven
./mvnw spring-boot:run

# Or with Gradle
./gradlew bootRun
```

### Configuration

Update `application.yml` or `application.properties`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/lokichat
    username: ${DB_USER:lokichat}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

  ai:
    ollama:
      base-url: http://localhost:11434
      chat:
        options:
          model: llama2
          temperature: 0.7
```

## Complete Deployment Guide

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd LokiChat-AI

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start all services
docker-compose up -d

# Pull AI model
docker exec -it lokichat_ollama ollama pull llama2

# Your application is now running at:
# - Backend: http://localhost:8081
# - Frontend: http://localhost:3000 (if running separately)
# - Ollama: http://localhost:11434
```

### Option 2: Separate Deployment

1. **Database**: Start PostgreSQL
2. **Backend**: Run Spring Boot application
3. **Ollama**: Start Ollama service and pull models
4. **Frontend**: Build and deploy with PM2 + Apache

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps
   
   # View database logs
   docker-compose logs lokichat-db
   ```

2. **AI Model Not Responding**
   ```bash
   # Check Ollama status
   docker exec -it lokichat_ollama ollama list
   
   # Test Ollama directly
   curl http://localhost:11434/api/generate -d '{
     "model": "llama2",
     "prompt": "Hello world"
   }'
   ```

3. **Frontend Not Loading**
   ```bash
   # Check PM2 status
   pm2 list
   
   # View frontend logs
   pm2 logs lokichat-frontend
   ```

## Security Considerations

- Change default database credentials in `.env`
- Use environment variables for sensitive configuration
- Consider using HTTPS in production
- Regularly update Docker images
- Monitor resource usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please create an issue in the GitHub repository.
