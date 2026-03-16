# 🩺 Vitalis

**AI-Powered Health Monitoring & rPPG Vital Analytics**

Vitalis is a professional-grade health monitoring platform designed for high-stakes environments, such as long-duration space missions. By leveraging Remote Photoplethysmography (rPPG) and advanced AI scanning, Vitalis provides non-invasive, real-time insights into vital signs, mental stress, and psychological well-being.

---

<h2>How to Use Vitalis</h2>

<p>
Follow these simple steps to access and use the Vitalis platform.
</p>

<h3>Step 1 – Open the Website</h3>

<p>
Open the Vitalis platform using the link provided in this repository.
</p>

<p>
<strong>Website URL:</strong> <code>https://vitalisrppg.vercel.app/](https://vitalis-mission.preview.emergentagent.com</code>
</p>

<p>
Click the link or paste it into your browser to access the platform.
</p>

<h3>Step 2 – Login to the Platform</h3>

<p>
Once the website opens, log in using the credentials provided below.
</p>

<p>
<strong>Email:</strong> <code>hi@gmail.com</code><br>
<strong>Password:</strong> <code>abcd1234</code>
</p>
<p>Or you can also Register and Create a New Account!</p>

<p>
After entering the credentials, click <strong>Login</strong> to access the Vitalis dashboard.
</p>

<h3>Step 3 – Start Live Monitoring</h3>

<p>
After logging in, navigate to the <strong>Live Monitor</strong> section of the platform.
</p>

<p>
Click <strong>Start Camera</strong> to begin the biometric scan.
</p>

<p>
The system will activate your camera and use <strong>Remote Photoplethysmography (rPPG)</strong> technology to analyze subtle facial signals.
</p>

<p>
Within a few seconds, Vitalis will estimate and display your vital health indicators, including:
</p>

<ul>
<li><strong>Heart Rate</strong></li>
<li><strong>Heart Rate Variability (HRV)</strong></li>
<li><strong>Stress Level</strong></li>
<li><strong>Fatigue Index</strong></li>
<li><strong>Wellness Score</strong></li>
</ul>

<p>
These results will appear on the dashboard in real time, allowing you to monitor your health condition instantly.
</p>

<hr>

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
