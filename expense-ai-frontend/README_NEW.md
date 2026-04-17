# 🎨 Lifewood AI Agent V2 - Frontend

**React-based Interactive User Interface**

The frontend application for Lifewood AI Agent V2, providing an intuitive, responsive interface for expense tracking, AI-powered analytics, and financial insights.

---

## 📖 Overview

This React application serves as the primary user interface for the Lifewood AI Agent system. It enables users to upload receipts, visualize expense analytics in real-time, chat with AI-powered analytics assistants, and generate comprehensive financial reports.

---

## 🎯 Features

- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 💬 **Interactive Chat Interface** - Natural language queries for expense analysis
- 📊 **Dynamic Charts & Visualizations** - Real-time expense trends and breakdowns
- 📸 **Receipt Upload** - Easy image upload for expense capture
- 📁 **Export Functionality** - Generate reports in multiple formats
- 🎨 **Modern UI/UX** - Clean, intuitive design patterns
- ⚡ **Fast Performance** - Optimized rendering and data loading

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.x | UI framework |
| **React Router** | 6.x | Client-side routing |
| **Axios** | Latest | HTTP client |
| **Chart.js / Recharts** | Latest | Data visualization |
| **CSS3** | Latest | Styling & animations |
| **Node.js** | 16.x+ | Runtime environment |
| **npm** | 8.x+ | Package manager |

---

## 🚀 Getting Started

### Prerequisites

```bash
node --version          # v16.0.0 or higher
npm --version           # v8.0.0 or higher
```

### Installation

```bash
# Install dependencies
npm install

# Create environment configuration
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env
```

### Development

```bash
# Start development server
npm start
```

The application will open at `http://localhost:3000`

### Production Build

```bash
# Create optimized production build
npm run build

# Serve the build locally (optional)
npx serve -s build
```

---

## 📂 Project Structure

```
src/
├── App.jsx                      # Main application component
├── App.css                      # Global styling
├── App.test.js                  # App component tests
├── index.js                     # React entry point
├── index.css                    # Global styles
├── reportWebVitals.js           # Performance monitoring
├── setupTests.js                # Test configuration
│
├── components/                  # Reusable React components
│   ├── AnalyticsChat.jsx       # AI chat interface
│   ├── ChartRenderer.jsx        # Chart visualization component
│   └── ExportModal.jsx          # Export dialog component
│
├── services/                    # API services
│   └── api.js                   # Axios API client
│
└── utils/                       # Utility functions
    └── helpers.js              # Helper utilities
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_VERSION=2.0.0
REACT_APP_LOG_LEVEL=debug
```

---

## 📈 Performance

- **Build Size:** ~200KB gzipped
- **Load Time:** <2s on 4G
- **Lighthouse Score:** 90+ across all metrics
- **Bundle Analysis:** Run `npm run build && npm run analyze`

---

## 🤝 Contributing

See the main [README.md](../README.md) for contribution guidelines.

---

## 📧 Support

For issues or questions specific to the frontend, please:

1. Check the main [README.md](../README.md#contact--support)
2. Open a GitHub issue with the `frontend` label
3. Email: support@lifewood-ai.com

---

**Last Updated:** April 2026 | **Version:** 2.0.0
