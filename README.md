# API Monitor - Secure Note-Taking & Analytics System 
A full-stack system I built that automatically monitors API responses, detects anomalies, and generates AI-powered human-readable alerts using Groq's LLaMA AI.

---

##  What I Built

I built this project to solve a real problem, when you're integrating with multiple external APIs, things go wrong silently. APIs slow down, return errors, or stop sending data. This system catches all of that automatically and tells you exactly what went wrong in plain English and also sends an email(if it is set up with Google).

When you send API response data to the system, it:
- Checks if the response time is too high
- Detects error status codes (4xx, 5xx)
- Validates that data was actually returned
- Uses AI to generate a clear alert message like *"AppointmentAPI failed with status 500 and returned 0 records — possible service outage or database failure"*
- Saves everything to MongoDB and shows it on a live dashboard

---

## Tech Stack

| Layer | Technology | Why I chose it |
|---|---|---|
| Backend | Node.js + Express | Fast, great for API-heavy apps |
| Database | MongoDB | Flexible document storage for alerts |
| AI | Groq (LLaMA 3) | Free, fast AI for alert generation |
| Frontend | HTML + CSS + JS | Lightweight, no framework needed |
| Logging | Winston | File + console logging simultaneously |
| Email | Nodemailer | Optional alert notifications |

---

## Project Structure

```
api-monitor/
├── backend/
│   ├── controllers/
│   │   ├── monitorController.js   # Main processing logic
│   │   └── alertController.js     # CRUD operations for alerts
│   ├── services/
│   │   ├── anomalyDetector.js     # Rule-based anomaly detection
│   │   ├── aiAlertService.js      # Groq AI alert generation
│   │   └── emailService.js        # Email notifications
│   ├── models/
│   │   └── Alert.js               # MongoDB schema
│   ├── routes/
│   │   ├── monitor.js             # POST /monitor
│   │   └── alerts.js              # GET/PATCH/DELETE /alerts
│   ├── middleware/
│   │   └── errorHandler.js        # Global error handling
│   ├── utils/
│   │   └── logger.js              # Winston logger
│   └── server.js                  # App entry point
├── frontend/
│   └── public/
│       └── index.html             # Dashboard UI
└── README.md
```

---

##  How to Run

### Prerequisites
Make sure you have these installed before starting:
- [Node.js](https://nodejs.org/) v18 or higher — check with `node -v`
- [MongoDB](https://www.mongodb.com/try/download/community) — check with `mongod --version`
- [Git](https://git-scm.com/) — check with `git --version`
- Groq API key (free, no credit card — sign up at https://console.groq.com)

---

### Step 1 — Clone the repository
```bash
git clone https://github.com/mirzasalem/intelligent-api-monitoring-and-alert-system.git
cd intelligent-api-monitoring-and-alert-system
```

### Step 2 — Install dependencies
```bash
cd backend
npm install
```

### Step 3 — Create environment file
```bash
cp .env.example .env
```

Now open `.env` and add your values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/api_monitor
GROQ_API_KEY=your_groq_api_key_here

# Optional - only needed if you want email alerts
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
ALERT_RECIPIENT=alerts@yourcompany.com
```

> **How to get Groq API key:** Go to https://console.groq.com → Sign up → API Keys → Create new key → paste it above

### Step 4 — Start MongoDB
```bash
# Linux
sudo systemctl start mongod

# Mac (with Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB
```

Verify MongoDB is running:
```bash
mongosh
```
You should see a `>` prompt. Type `exit` to close.

### Step 5 — Start the server
```bash
# Development mode (auto-restarts on file changes)
npm run dev

# Production mode
npm start
```

You should see:
```
[INFO]: MongoDB connected
[INFO]: Server running on http://localhost:5000
```

### Step 6 — Open the dashboard
Open your browser and go to:
```
http://localhost:5000
```

Click **"Load Sample Data"** then **"Submit for Analysis"** to test the system immediately.

---

##  API Endpoints

### POST /monitor
Submit API responses for anomaly analysis.

```bash
curl -X POST http://localhost:5000/monitor \
  -H "Content-Type: application/json" \
  -d '[
    {
      "api_name": "PatientDataAPI",
      "response_time_ms": 1200,
      "status_code": 200,
      "records_returned": 50
    },
    {
      "api_name": "AppointmentAPI",
      "response_time_ms": 5500,
      "status_code": 500,
      "records_returned": 0
    }
  ]'
```

### GET /alerts
Fetch all stored alerts. Supports filters:
```
GET /alerts?severity=CRITICAL
GET /alerts?resolved=false
GET /alerts?api_name=Appointment
```

### GET /alerts/stats
Dashboard statistics — totals by severity, top APIs.

### PATCH /alerts/:id/resolve
Mark an alert as resolved.

### DELETE /alerts/:id
Delete an alert.

### GET /health
Server health check.

---

##  How Anomaly Detection Works

I built a scoring system where each violation adds points and the total score determines severity:

| Condition | Score |
|---|---|
| Response time > 3000ms | +2 |
| Response time > 8000ms | +3 |
| 5xx status code | +3 |
| 4xx status code | +1 |
| Zero records on HTTP 200 | +2 |
| Negative records | +2 |

**Score → Severity:**
- 1 point = LOW
- 2-3 points = MEDIUM
- 4-5 points = HIGH
- 6+ points = CRITICAL

---

## AI Alert Generation

When an anomaly is detected, I send the API details to Groq's LLaMA model with a structured prompt. It returns a professional, human-readable message explaining what went wrong and what might have caused it.

If the AI API is unavailable, the system automatically falls back to rule-based message generation, so alerts are never lost.

Example AI-generated alert:
> *"AppointmentAPI encountered a server error (HTTP 500) with an unusually high response time of 5500ms and returned 0 records. This likely indicates a backend service outage or database connection failure. Immediate investigation is recommended."*

---

## Dashboard Features

- Live stats — total, active, resolved, by severity
- Filter alerts by severity or API name
- Resolve and delete alerts
- Built-in test panel to submit JSON directly
- Auto-refreshes every 30 seconds

---

## Email Alerts (Optional)

Add your Gmail credentials to `.env` and the system will automatically send an HTML email report for every batch of detected anomalies.

For Gmail, generate an App Password at: https://myaccount.google.com/apppasswords

---

##  Logs

All activity is logged to:
- Console (colorized)
- `logs/combined.log` — all logs
- `logs/error.log` — errors only


 

## 👨 Author

Mirza Salem  
[GitHub](https://github.com/mirzasalem/) | [LinkedIn](https://www.linkedin.com/in/mirzasalem/) | [Portfolio](https://mirzasalem.vercel.app/)

