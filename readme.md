# 📰 Saransh - AI News App

An AI-powered news aggregation app inspired by InShorts, built with FastAPI and modern AI technologies.

## 🎯 What is Saransh?

Saransh is an open-source alternative to InShorts that uses AI to:

-   Scrape and process Indian news articles
-   Categorize and summarize news content
-   Provide intelligent news recommendations
-   Create 60-word summaries using AI

## 🚀 Quick Start

### Prerequisites

-   Python 3.8+
-   PostgreSQL (for production)
-   Redis (optional, for caching)

### Installation

1. **Clone the repository**

    ```bash
    git clone <your-repo-url>
    cd Saransh
    ```

2. **Create the Virtual Environment**

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3. **Install dependencies**

    ```bash
    CREATE requirements.in
    pip-compile requirements.in
    pip install -r requirements.txt
    pip freeze > requirements.txt
    ```

4. **Setup environment variables**

    ```bash
    # Copy the example environment file
    cp env.example .env

    # Edit .env with your configuration
    nano .env
    ```

5. **Run the application**

    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000
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
