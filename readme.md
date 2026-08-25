# 📰 Saransh — AI-Powered News Aggregation

India's news. Sourced, summarised, accountable.

Saransh pulls directly from verified sources and gives you a concise, attributed summary of each story. No opinion. No algorithm. No forwarded videos.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker (for local infra)
- pnpm (`npm install -g pnpm`)

### One-Command Setup

```bash
# Clone and install
git clone https://github.com/imsks/Saransh.git
cd Saransh
pnpm install

# Start everything (infra + API + web)
pnpm dev
```

This starts:
- **Postgres** on `localhost:5433`
- **Redis** on `localhost:6379`
- **ChromaDB** on `localhost:8001`
- **FastAPI backend** on `localhost:8000`
- **Next.js frontend** on `localhost:3001`

### Manual Setup

```bash
# 1. Start infrastructure only
pnpm infra:up

# 2. Set up Python environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Copy environment file
cp .env.example .env
# Edit .env with your API keys

# 4. Start backend
pnpm dev:api

# 5. Start frontend (in another terminal)
pnpm dev:web
```

## 📁 Repository Structure

```
saransh/
├── app/                  # FastAPI backend
│   ├── agents/           # AI agents (summarization, curation)
│   ├── ai/               # LLM and embedding services
│   ├── api/              # API routes
│   ├── db/               # Database models
│   ├── processors/       # Content processing pipeline
│   ├── scrapers/         # News source scrapers
│   └── utils/            # Shared utilities
├── apps/
│   └── web/              # Next.js frontend (@saransh/web)
├── packages/             # Shared packages
├── docs/
│   └── adr/              # Architecture Decision Records
└── docker-compose.yml    # Local development infrastructure
```

## 🛠️ Development Commands

```bash
pnpm dev          # Start everything
pnpm dev:api      # Start FastAPI backend only
pnpm dev:web      # Start Next.js frontend only
pnpm infra:up     # Start Docker infrastructure
pnpm infra:down   # Stop Docker infrastructure
pnpm infra:logs   # View infrastructure logs
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm test         # Run all tests
```

## 🧪 Testing

```bash
# Python tests
pytest tests/ -v

# Frontend tests (when configured)
pnpm --filter @saransh/web test
```

## 📚 Documentation

- [CONTEXT.md](./CONTEXT.md) — Domain glossary
- [docs/adr/](./docs/adr/) — Architecture Decision Records

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a PR

## 📄 License

MIT
    cp env.example .env

    # Edit .env with your configuration
    nano .env
    ```

5. **Run the application**

    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

6. **Access the application**
    - API: http://localhost:8000
    - Health Check: http://localhost:8000/health
    - API Documentation: http://localhost:8000/docs

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/saransh_db

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Application Configuration
APP_ENV=development
DEBUG=True
LOG_LEVEL=INFO

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Redis Configuration (for caching later)
REDIS_URL=redis://localhost:6379
```

### Required API Keys

-   **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)

## 📁 Project Structure

```
Saransh/
├── app/
│   ├── agents/          # AI agents and LangChain integration
│   ├── api/             # API routes and endpoints
│   ├── db/              # Database models and connections
│   ├── processors/      # News processing and cleaning
│   ├── scrapers/        # News scraping modules
│   ├── utils/           # Utility functions
│   └── config.py        # Configuration management
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies
├── env.example          # Environment variables template
└── readme.md           # This file
```

## 🔧 Development

### Running in Development Mode

```bash
python main.py
```

The app will run with:

-   Auto-reload enabled
-   Debug mode on
-   Detailed logging

### Running in Production

```bash
# Set environment to production
export APP_ENV=production
export DEBUG=False

# Run with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🧪 Testing

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00",
    "service": "saransh-news-app",
    "environment": "development"
}
```

## 📋 Roadmap

-   [x] Project setup and structure
-   [x] Basic FastAPI application
-   [x] Environment configuration
-   [ ] Database setup and models
-   [ ] News scraping functionality
-   [ ] AI-powered content processing
-   [ ] RAG (Retrieval-Augmented Generation) system
-   [ ] API endpoints for news retrieval
-   [ ] Docker containerization
-   [ ] Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Built with ❤️ for the AI and news community**
