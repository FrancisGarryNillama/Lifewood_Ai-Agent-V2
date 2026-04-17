# 🔌 Lifewood AI Agent V2 - Backend

**Django REST API for Intelligent Expense Management**

The backend API powering Lifewood AI Agent V2, providing AI-driven expense recognition, analytics processing, reporting, and data management services.

---

## 📖 Overview

This Django REST Framework application serves as the core backend for the Lifewood AI Agent system. It handles expense data management, AI-powered receipt analysis, analytics computation, and comprehensive reporting functionality.

---

## 🎯 Features

- 🧠 **AI-Powered Receipt Analysis** - Vision API integration for OCR & categorization
- 📊 **Analytics Engine** - Real-time expense analytics and insights
- 📁 **Report Generation** - Multi-format export (Excel, PDF)
- 🔐 **Secure API** - Token authentication & REST standards
- 💾 **Database Management** - SQLite persistence with migrations
- 🏷️ **Smart Governance** - Customizable rules for expense categorization
- 📈 **Performance Optimized** - Fast query responses & caching

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Django** | 3.x/4.x | Web framework |
| **Django REST Framework** | Latest | API framework |
| **Python** | 3.8+ | Language |
| **SQLite** | 3.x | Database |
| **Pillow** | Latest | Image processing |
| **OpenAI/Claude SDK** | Latest | AI integration |

---

## 🚀 Getting Started

### Prerequisites

```bash
python --version            # 3.8 or higher
pip --version              # Latest
```

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### Development

```bash
# Start development server
python manage.py runserver

# Server runs on http://localhost:8000
```

---

## 📂 Project Structure

```
expense-ai-backend/
├── manage.py                    # Django management command
├── db.sqlite3                   # SQLite database
│
├── agent/                       # AI Agent Module
│   ├── main.py                 # Agent initialization
│   ├── models.py               # Database models
│   ├── views.py                # API views
│   ├── serializers.py          # DRF serializers
│   ├── urls.py                 # URL routing
│   ├── admin.py                # Admin interface
│   ├── apps.py                 # App configuration
│   ├── migrations/             # Database migrations
│   ├── services/               # Business logic
│   │   ├── agent_service.py   # AI agent logic
│   │   └── governance.py       # Rules engine
│   └── tools/                  # AI tools
│       ├── base.py             # Base tool classes
│       ├── receipt_vision.py   # Receipt OCR
│       └── tools.py            # Tool utilities
│
├── analytics/                   # Analytics Module
│   ├── models.py               # Analytics models
│   ├── views.py                # Analytics endpoints
│   ├── serializers.py          # Data serialization
│   ├── services/               # Analytics logic
│   │   └── ai_service.py      # AI analysis
│   ├── migrations/             # Database migrations
│   └── admin.py                # Admin interface
│
├── exports/                     # Export Module
│   ├── models.py               # Export models
│   ├── views.py                # Export endpoints
│   ├── services/               # Export logic
│   │   └── excel_report_builder.py  # Excel generation
│   ├── migrations/             # Database migrations
│   └── admin.py                # Admin interface
│
└── expense_ai/                  # Project Settings
    ├── settings.py             # Django settings
    ├── urls.py                 # Root URL routing
    ├── wsgi.py                 # WSGI application
    └── asgi.py                 # ASGI application
```

---

## 📡 API Endpoints

### Agent Module (`/api/agent/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/expenses/` | Create new expense |
| GET | `/expenses/` | List expenses |
| GET | `/expenses/{id}/` | Retrieve expense |
| PUT | `/expenses/{id}/` | Update expense |
| DELETE | `/expenses/{id}/` | Delete expense |
| POST | `/receipts/analyze/` | Analyze receipt image |
| GET | `/categories/` | List expense categories |

### Analytics Module (`/api/analytics/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/summary/` | Get analytics summary |
| GET | `/trends/` | Get spending trends |
| GET | `/categories/breakdown/` | Category breakdown |
| POST | `/chat/` | Chat with analytics AI |

### Exports Module (`/api/exports/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate/` | Generate report |
| GET | `/downloads/{id}/` | Download report |
| GET | `/templates/` | List report templates |

---

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test agent
python manage.py test analytics
python manage.py test exports

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

---

## 🔧 Configuration

### Settings

Edit `expense_ai/settings.py`:

```python
# API Configuration
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'db.sqlite3',
    }
}

# AI Services
OPENAI_API_KEY = 'your-key-here'
VISION_API_URL = 'https://your-api-endpoint'
```

### Environment Variables

Create a `.env` file:

```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
OPENAI_API_KEY=sk-...
```

---

## 📈 Performance

### Response Times

| Endpoint | Time |
|----------|------|
| List expenses | 45–80ms |
| Create expense | 120–200ms |
| Receipt analysis | 2–5s |
| Analytics summary | 150–300ms |

### Optimization Tips

- Enable query optimization with `select_related()` and `prefetch_related()`
- Use Django REST framework caching for frequently accessed endpoints
- Consider Redis for session/cache management in production
- Profile with Django Debug Toolbar

---

## 🚀 Deployment

### Production Setup

```bash
# Collect static files
python manage.py collectstatic

# Use Gunicorn as WSGI server
pip install gunicorn
gunicorn expense_ai.wsgi:application --bind 0.0.0.0:8000

# Or with multiple workers
gunicorn expense_ai.wsgi:application -w 4 --bind 0.0.0.0:8000
```

### Database Migration

```bash
# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate
```

---

## 🤝 Contributing

See the main [README.md](../README.md) for contribution guidelines.

---

## 📧 Support

For backend-specific issues:

1. Check the main [README.md](../README.md#contact--support)
2. Open a GitHub issue with the `backend` label
3. Email: support@lifewood-ai.com

---

**Last Updated:** April 2026 | **Version:** 2.0.0
