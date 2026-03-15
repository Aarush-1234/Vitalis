# 🩺 Vitalis

**AI-Powered Health Monitoring & rPPG Vital Analytics**

Vitalis is a professional-grade health monitoring platform designed for high-stakes environments, such as long-duration space missions. By leveraging Remote Photoplethysmography (rPPG) and advanced AI scanning, Vitalis provides non-invasive, real-time insights into vital signs, mental stress, and psychological well-being.

---

## 🚀 Core Technologies

### 📡 rPPG Scanning
Vitalis utilizes **Remote Photoplethysmography (rPPG)** to detect micro-variations in skin color caused by blood circulation. By analyzing video streams from a standard webcam, Vitalis can estimate:
- **Heart Rate (BPM)** with high precision.
- **Heart Rate Variability (HRV)** for stress assessment.
- **Respiration Rate (RR)** through thoracic movement and skin-tone analysis.

### 🧠 AI-Powered Analysis
Our proprietary AI engine processes biometric data to provide a holistic view of user health:
- **Mental Health Analytics**: Real-time stress indexing and fatigue probability.
- **Biometric Risk Assessment**: Automatic detection of deviations from personal baselines.
- **Predictive Recommendations**: Actionable insights like breathing exercises or workload moderation.

---

## ✨ Key Features

- **ASTRA Companion**: An OpenAI-powered psychological support agent (ASTRA) that provides empathetic guidance and stress management techniques.
- **Mission Dashboard**: Comprehensive tracking of health trends, mission phases, and environmental context.
- **Baseline Recalibration**: Dynamic adjustment of health 'normals' based on long-term data trends.
- **Non-Invasive Monitoring**: No wearables required; health analysis is performed entirely through optical sensors.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Computer Vision**: [MediaPipe Face Detection](https://developers.google.com/mediapipe), [TensorFlow.js](https://www.tensorflow.org/js)
- **Data Visualization**: [Recharts](https://recharts.org/)

### Backend
- **Engine**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: [MongoDB](https://www.mongodb.com/) (Motor Async Driver)
- **Intelligence**: OpenAI GPT-4 API (via Astra-Care integration)
- **Security**: JWT Authentication & Bcrypt Hashing

---

## 🏗 Project Structure

```text
VITALIS/
├── backend/            # FastAPI Server & AI Logic
│   ├── server.py       # Core API & Multi-agent Logic
│   └── requirements.txt# Backend Dependencies
├── frontend/           # React Web Application
│   ├── src/            # UI Components & rPPG Logic
│   └── package.json    # Frontend Dependencies
└── README.md           # Project Documentation
```

---

## 🚦 Quick Start

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment variables in `.env`:
   ```env
   MONGO_URL=mongodb://localhost:27017/astracare
   JWT_SECRET=your-secret-key
   EMERGENT_LLM_KEY=your-api-key
   ```
4. Start the server:
   ```bash
   uvicorn server:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

---

## 📝 License

This project is licensed under the [LICENSE.txt](LICENSE.txt).

---

*Vitalis: Vision for a Healthier Frontier.*
