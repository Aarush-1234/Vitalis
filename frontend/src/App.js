import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  Activity, Heart, Brain, AlertTriangle, MessageCircle, Camera, Clock, User,
  Shield, TrendingUp, Zap, Bell, CheckCircle, RefreshCw, Send, Menu, X, Home,
  BarChart2, Users, Settings, Search, ChevronRight, Play, Pause, Video,
  AlertCircle, ArrowUp, ArrowDown, Minus, Monitor, Cpu, Radio, Target,
  Calendar, Plus, ChevronDown, ChevronLeft, Stethoscope, FileText, Volume2,
  Moon, Sun, Globe, Lock, Eye, EyeOff, Trash2, Download, Upload
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// ===================== AUTH CONTEXT =====================
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ===================== NOTIFICATION CONTEXT =====================
const NotificationContext = createContext(null);
const useNotifications = () => useContext(NotificationContext);

// ===================== API SERVICE =====================
const api = {
  token: localStorage.getItem('vitalis_token'),
  setToken(token) {
    this.token = token;
    token ? localStorage.setItem('vitalis_token', token) : localStorage.removeItem('vitalis_token');
  },
  async fetch(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const response = await fetch(`${BACKEND_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401) { this.setToken(null); window.location.reload(); }
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },
  login: (data) => api.fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => api.fetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => api.fetch('/api/auth/me'),
  getDashboardSummary: (id) => api.fetch(`/api/dashboard/summary/${id}`),
  sendChat: (data) => api.fetch('/api/chat/send', { method: 'POST', body: JSON.stringify(data) }),
  getChatHistory: (id) => api.fetch(`/api/chat/history/${id}`),
  generateSimulation: (id, days) => api.fetch(`/api/simulate/generate?astronaut_id=${id}&days=${days}`, { method: 'POST' }),
  saveBiometricScan: (data) => api.fetch('/api/biometric/scan', { method: 'POST', body: JSON.stringify(data) }),
};

// ===================== BIOMETRIC ENGINE =====================
class BiometricEngine {
  constructor() {
    this.heartRateHistory = [];
    this.hrvHistory = [];
    this.baseHeartRate = 72;
    this.lastUpdate = Date.now();
    this.stressAccumulator = 0;
    this.fatigueAccumulator = 0;
  }

  processFrame(rgbSignal) {
    const now = Date.now();
    const elapsed = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    const signalVariation = rgbSignal ? (rgbSignal.r + rgbSignal.g + rgbSignal.b) / 3 : 0;
    const heartRateVariation = Math.sin(now / 1000) * 5 + (signalVariation % 10) - 5;
    const heartRate = Math.round(this.baseHeartRate + heartRateVariation + (Math.random() - 0.5) * 4);
    const hrv = Math.round(40 + Math.random() * 30 + Math.sin(now / 5000) * 10);

    this.heartRateHistory.push(heartRate);
    this.hrvHistory.push(hrv);
    if (this.heartRateHistory.length > 30) this.heartRateHistory.shift();
    if (this.hrvHistory.length > 30) this.hrvHistory.shift();

    const avgHrv = this.hrvHistory.reduce((a, b) => a + b, 0) / this.hrvHistory.length;
    const stressLevel = Math.round(Math.max(0, Math.min(100, 100 - avgHrv + (Math.random() - 0.5) * 10)));
    this.fatigueAccumulator += elapsed * 0.1;
    const fatigueLevel = Math.round(Math.min(100, 15 + this.fatigueAccumulator + Math.sin(now / 10000) * 5));
    const wellnessScore = Math.round(100 - (stressLevel * 0.3) - (fatigueLevel * 0.2) - (Math.abs(heartRate - 72) * 0.3));

    return {
      heartRate: Math.max(55, Math.min(120, heartRate)),
      hrv: Math.max(20, Math.min(100, hrv)),
      stressLevel: Math.max(0, Math.min(100, stressLevel)),
      fatigueLevel: Math.max(0, Math.min(100, fatigueLevel)),
      wellnessScore: Math.max(0, Math.min(100, wellnessScore)),
      timestamp: now
    };
  }

  reset() {
    this.fatigueAccumulator = 0;
    this.heartRateHistory = [];
    this.hrvHistory = [];
  }
}

const biometricEngine = new BiometricEngine();

// ===================== NOTIFICATION PROVIDER =====================
function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', title: 'System Online', message: 'Vitalis monitoring system initialized', time: new Date(), read: false },
    { id: 2, type: 'warning', title: 'Stress Alert', message: 'Elevated stress levels detected', time: new Date(Date.now() - 300000), read: false },
  ]);

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: Date.now(),
      time: new Date(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, clearAll, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ===================== MAIN APP =====================
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (api.token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch { api.setToken(null); }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const result = await api.login({ email, password });
    api.setToken(result.access_token);
    setUser(result.user);
    return result;
  };

  const register = async (data) => {
    const result = await api.register(data);
    api.setToken(result.access_token);
    setUser(result.user);
    return result;
  };

  const logout = () => { api.setToken(null); setUser(null); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Initializing Vitalis...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      <NotificationProvider>
        {user ? <Dashboard /> : <LoginPage />}
      </NotificationProvider>
    </AuthContext.Provider>
  );
}

// ===================== LOGIN PAGE =====================
function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', role: 'astronaut' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) await login(formData.email, formData.password);
      else await register(formData);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#4A5D4A] rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">VITALIS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mission Monitoring</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time biometric intelligence platform</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${isLogin ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!isLogin ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                  placeholder="Dr. John Doe"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                placeholder="you@mission.control"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                >
                  <option value="astronaut">Crew Member</option>
                  <option value="supervisor">Mission Controller</option>
                  <option value="medical">Medical Officer</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#4A5D4A] hover:bg-[#3d4d3d] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ===================== TOAST NOTIFICATION =====================
function Toast({ notification, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    success: 'bg-green-500'
  };

  return (
    <div className={`${bgColors[notification.type] || 'bg-gray-700'} text-white px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 min-w-[300px] animate-slide-in`}>
      <div className="flex-1">
        <p className="font-medium text-sm">{notification.title}</p>
        <p className="text-xs opacity-90 mt-0.5">{notification.message}</p>
      </div>
      <button onClick={onClose} className="text-white/70 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ===================== DASHBOARD =====================
function Dashboard() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, addNotification } = useNotifications();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [biometrics, setBiometrics] = useState({
    heartRate: 72, hrv: 55, stressLevel: 25, fatigueLevel: 15, wellnessScore: 85
  });
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [monitoringStartTime, setMonitoringStartTime] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState([]);
  const saveCounterRef = useRef(0);

  const crewId = user?.astronaut_id || 'CREW-001';

  // Add toast
  const showToast = useCallback((toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const saveBiometricToBackend = useCallback(async (biometricData) => {
    try {
      const scanDuration = monitoringStartTime ? (Date.now() - monitoringStartTime) / 1000 : 0;
      await api.saveBiometricScan({
        astronaut_id: crewId,
        heart_rate: biometricData.heartRate,
        hrv: biometricData.hrv,
        stress_level: biometricData.stressLevel,
        fatigue_level: biometricData.fatigueLevel,
        wellness_score: biometricData.wellnessScore,
        face_detected: true,
        scan_duration_seconds: scanDuration
      });
    } catch (err) {
      console.log('Failed to save biometric data:', err);
    }
  }, [crewId, monitoringStartTime]);

  useEffect(() => {
    if (isMonitoring && !monitoringStartTime) {
      setMonitoringStartTime(Date.now());
      saveCounterRef.current = 0;
      showToast({ type: 'success', title: 'Monitoring Started', message: 'Biometric capture is now active' });
    } else if (!isMonitoring && monitoringStartTime) {
      setMonitoringStartTime(null);
      showToast({ type: 'info', title: 'Monitoring Stopped', message: 'Session has been paused' });
    }
  }, [isMonitoring, monitoringStartTime, showToast]);

  useEffect(() => {
    if (!isMonitoring) return;
    const interval = setInterval(() => {
      const newBiometrics = biometricEngine.processFrame({ r: 128, g: 128, b: 128 });
      setBiometrics(newBiometrics);
      setTelemetryHistory(prev => {
        const newEntry = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          heartRate: newBiometrics.heartRate,
          stress: newBiometrics.stressLevel,
          fatigue: newBiometrics.fatigueLevel
        };
        return [...prev, newEntry].slice(-20);
      });

      // Alert notifications
      if (newBiometrics.stressLevel > 70) {
        addNotification({ type: 'warning', title: 'High Stress Alert', message: `Stress level at ${newBiometrics.stressLevel}%` });
      }
      if (newBiometrics.heartRate > 100) {
        addNotification({ type: 'warning', title: 'Elevated Heart Rate', message: `Heart rate at ${newBiometrics.heartRate} BPM` });
      }

      saveCounterRef.current += 1;
      if (saveCounterRef.current >= 5) {
        saveBiometricToBackend(newBiometrics);
        saveCounterRef.current = 0;
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isMonitoring, saveBiometricToBackend, addNotification]);

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'monitoring', label: 'Live Monitor' },
    { id: 'crew', label: 'Crew', roles: ['supervisor', 'medical'] },
    { id: 'timeline', label: 'Analytics' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'assistant', label: 'AI Assistant' },
  ].filter(tab => !tab.roles || tab.roles.includes(user?.role || 'astronaut'));

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} notification={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4A5D4A] rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">VITALIS</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full p-1">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  currentView === tab.id
                    ? 'bg-[#4A5D4A] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('settings')}
              className={`p-2 rounded-lg transition-colors ${currentView === 'settings' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <Settings className="w-4 h-4" />
            </button>
            
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-lg relative"
              >
                <Bell className="w-4 h-4 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              )}
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-700">Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {currentView === 'dashboard' && (
          <DashboardView
            biometrics={biometrics}
            telemetryHistory={telemetryHistory}
            isMonitoring={isMonitoring}
            setIsMonitoring={setIsMonitoring}
            crewId={crewId}
            user={user}
          />
        )}
        {currentView === 'monitoring' && (
          <LiveMonitoringView 
            biometrics={biometrics} 
            isMonitoring={isMonitoring} 
            setIsMonitoring={setIsMonitoring}
            showToast={showToast}
          />
        )}
        {currentView === 'crew' && <CrewView />}
        {currentView === 'timeline' && <TimelineView telemetryHistory={telemetryHistory} />}
        {currentView === 'alerts' && <AlertsView biometrics={biometrics} />}
        {currentView === 'assistant' && <AssistantView crewId={crewId} />}
        {currentView === 'settings' && <SettingsView user={user} showToast={showToast} />}
      </main>
    </div>
  );
}

// ===================== NOTIFICATION DROPDOWN =====================
function NotificationDropdown({ onClose }) {
  const { notifications, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs text-purple-600 hover:text-purple-700">
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-purple-50/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    notif.type === 'warning' ? 'bg-amber-500' : 
                    notif.type === 'error' ? 'bg-red-500' : 
                    notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-100">
            <button onClick={clearAll} className="w-full text-xs text-gray-500 hover:text-red-500 transition-colors">
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ===================== SETTINGS VIEW =====================
function SettingsView({ user, showToast }) {
  const [settings, setSettings] = useState({
    darkMode: false,
    soundAlerts: true,
    emailNotifications: true,
    pushNotifications: true,
    autoSaveInterval: 10,
    dataRetention: 30,
    language: 'en'
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    showToast({ type: 'success', title: 'Setting Updated', message: `${key} has been updated` });
  };

  const handleSave = () => {
    localStorage.setItem('vitalis_settings', JSON.stringify(settings));
    showToast({ type: 'success', title: 'Settings Saved', message: 'Your preferences have been saved' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{user?.full_name || 'User'}</h4>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-purple-600 mt-1 capitalize">{user?.role || 'Astronaut'}</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Preferences</h3>
        <div className="space-y-4">
          <SettingToggle
            icon={<Moon className="w-4 h-4" />}
            title="Dark Mode"
            description="Switch to dark theme"
            enabled={settings.darkMode}
            onToggle={() => handleToggle('darkMode')}
          />
          <SettingToggle
            icon={<Volume2 className="w-4 h-4" />}
            title="Sound Alerts"
            description="Play sound for notifications"
            enabled={settings.soundAlerts}
            onToggle={() => handleToggle('soundAlerts')}
          />
          <SettingToggle
            icon={<Bell className="w-4 h-4" />}
            title="Push Notifications"
            description="Receive push notifications"
            enabled={settings.pushNotifications}
            onToggle={() => handleToggle('pushNotifications')}
          />
        </div>
      </div>

      {/* Data Settings */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Data & Privacy</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto-save Interval</label>
            <select 
              value={settings.autoSaveInterval}
              onChange={(e) => setSettings({...settings, autoSaveInterval: Number(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              <option value={5}>Every 5 seconds</option>
              <option value={10}>Every 10 seconds</option>
              <option value={30}>Every 30 seconds</option>
              <option value={60}>Every minute</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Retention</label>
            <select 
              value={settings.dataRetention}
              onChange={(e) => setSettings({...settings, dataRetention: Number(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSave} className="flex-1 py-2.5 bg-[#4A5D4A] text-white rounded-xl text-sm font-medium hover:bg-[#3d4d3d] transition-colors">
          Save Settings
        </button>
        <button className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>
    </div>
  );
}

// ===================== SETTING TOGGLE =====================
function SettingToggle({ icon, title, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? 'bg-purple-500' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

// ===================== DASHBOARD VIEW =====================
function DashboardView({ biometrics, telemetryHistory, isMonitoring, setIsMonitoring, crewId, user }) {
  const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const weeklyData = [
    { day: 'S', value: 45 }, { day: 'S', value: 52 }, { day: 'M', value: 48 },
    { day: 'T', value: 61 }, { day: 'W', value: 55, highlight: true }, { day: 'T', value: 58 },
    { day: 'F', value: 50 }, { day: 'S', value: 47 }
  ];

  const dailyData = [
    { day: 'S', value: 20 }, { day: 'M', value: 35 }, { day: 'T', value: 45 },
    { day: 'W', value: 72, highlight: true }, { day: 'T', value: 55 }, { day: 'F', value: 40 }, { day: 'S', value: 30 }
  ];

  const diagnoseData = [
    { name: 'Normal', value: 120, color: '#8B5CF6' },
    { name: 'Elevated', value: 30, color: '#3B82F6' },
    { name: 'Critical', value: 24, color: '#E5E7EB' }
  ];

  const monthlyData = [
    { month: 'Jan', consultation: 180, checkup: 120 },
    { month: 'Feb', consultation: 200, checkup: 140 },
    { month: 'Mar', consultation: 220, checkup: 160 },
    { month: 'Apr', consultation: 190, checkup: 130 },
    { month: 'May', consultation: 280, checkup: 200 },
    { month: 'Jun', consultation: 320, checkup: 250, highlight: true },
    { month: 'Jul', consultation: 240, checkup: 180 },
    { month: 'Aug', consultation: 260, checkup: 190 },
    { month: 'Sep', consultation: 230, checkup: 170 },
    { month: 'Oct', consultation: 210, checkup: 150 },
    { month: 'Nov', consultation: 250, checkup: 180 }
  ];

  return (
    <div className="space-y-5">
      {/* Hero Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Mission Monitoring.</h1>
          <p className="text-gray-500 text-sm">Let's see the current health performance.</p>
        </div>

        <div className="flex gap-4">
          <StatsCard title="Active Sessions" value={isMonitoring ? "1" : "0"} change="+4.1%" trend="up" />
          <StatsCard title="Critical Alerts" value={biometrics.stressLevel > 70 ? "1" : "0"} change={biometrics.stressLevel > 50 ? "+2.1%" : "-1.2%"} trend={biometrics.stressLevel > 50 ? "up" : "down"} chartType="bars" />
          <StatsCard title="Wellness Score" value={biometrics.wellnessScore} change="+4.1%" trend="up" chartType="ring" ringValue={biometrics.wellnessScore} />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            isMonitoring ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isMonitoring ? <Pause className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isMonitoring ? 'Stop Session' : 'New Session'}
        </button>
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-gray-200">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{today}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-gray-200 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search..." className="text-sm bg-transparent outline-none flex-1" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Heart Rate Chart */}
        <div className="col-span-3 bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Heart Rate</h3>
            <select className="text-xs text-gray-500 bg-transparent border-0 outline-none cursor-pointer">
              <option>Today</option>
            </select>
          </div>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-xs text-purple-600">● Current</span>
            <span className="text-xs text-gray-400">● Average</span>
          </div>
          <div className="flex gap-4 mb-3">
            <div>
              <span className="text-2xl font-bold text-gray-900">{biometrics.heartRate}</span>
              <span className="text-xs text-gray-500 ml-1">BPM</span>
            </div>
            <div>
              <span className="text-lg text-gray-400">72</span>
              <span className="text-xs text-gray-400 ml-1">avg</span>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.highlight ? '#8B5CF6' : '#E9D5FF'} />
                  ))}
                </Bar>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stress Overview */}
        <div className="col-span-2 bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Stress Level</h3>
            <select className="text-xs text-gray-500 bg-transparent border-0 outline-none cursor-pointer">
              <option>Today</option>
            </select>
          </div>
          <div className="mb-2">
            <span className="text-xs text-purple-600">● Current Level</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">+{biometrics.stressLevel}%</div>
          <div className="h-32 flex items-end justify-center gap-1">
            {dailyData.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-3 rounded-full transition-all ${item.highlight ? 'bg-purple-500' : 'bg-purple-200'}`}
                  style={{ height: `${item.value}%` }}
                />
                {item.highlight && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                <span className="text-xs text-gray-400">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wellness Diagnose */}
        <div className="col-span-3 bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Health Diagnose</h3>
            <select className="text-xs text-gray-500 bg-transparent border-0 outline-none cursor-pointer">
              <option>Monthly</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={diagnoseData} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                    {diagnoseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400">{biometrics.wellnessScore}%</span>
                <span className="text-lg font-bold text-gray-900">174</span>
                <span className="text-xs text-gray-400">Total</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs text-gray-600">Normal</span>
                <span className="text-xs font-medium text-gray-900 ml-auto">120</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-600">Elevated</span>
                <span className="text-xs font-medium text-gray-900 ml-auto">30</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-600">Critical</span>
                <span className="text-xs font-medium text-gray-900 ml-auto">24</span>
              </div>
            </div>
          </div>
        </div>

        {/* Crew Card */}
        <div className="col-span-4 bg-white rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{user?.full_name || 'Crew Member'}</h4>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                {user?.role === 'supervisor' ? 'Mission Controller' : user?.role === 'medical' ? 'Medical Officer' : 'Crew Member'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Clock className="w-3 h-3" />
            <span>Session Active</span>
          </div>
          
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Schedule</span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <ChevronLeft className="w-3 h-3 cursor-pointer hover:text-gray-600" />
                <span>Mar</span>
                <ChevronRight className="w-3 h-3 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((day) => (
                <div
                  key={day}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${
                    day === 1 ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">On Duty Crew</span>
              <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500">4</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-gray-700">Medical Bay</span>
                </div>
                <span className="text-xs text-gray-400">2 active</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-700">Command</span>
                </div>
                <span className="text-xs text-gray-400">2 active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Fatigue Overview */}
        <div className="col-span-3 bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Fatigue Index</h3>
            <select className="text-xs text-gray-500 bg-transparent border-0 outline-none cursor-pointer">
              <option>Today</option>
            </select>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">{biometrics.fatigueLevel}%</div>
          <div className="text-xs text-gray-500 mb-4">Current Level</div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Optimal</span>
                <span className="text-gray-700">50%</span>
              </div>
              <div className="h-6 bg-green-100 rounded-lg flex items-center px-2">
                <span className="text-xs text-green-700">Low Fatigue</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Moderate</span>
                <span className="text-gray-700">35%</span>
              </div>
              <div className="h-6 bg-yellow-100 rounded-lg flex items-center px-2">
                <span className="text-xs text-yellow-700">Caution</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">High</span>
                <span className="text-gray-700">15%</span>
              </div>
              <div className="h-6 bg-red-100 rounded-lg flex items-center px-2">
                <span className="text-xs text-red-700">Rest Required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Status */}
        <div className="col-span-5 bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Session History</h3>
            <select className="text-xs text-gray-500 bg-transparent border-0 outline-none cursor-pointer">
              <option>Monthly</option>
            </select>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-gray-900">521</span>
            <span className="text-sm text-gray-500">Total Sessions</span>
          </div>
          <div className="flex items-center gap-4 mb-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Monitoring</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-900" /> Check-Up</span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis hide />
                <Bar dataKey="consultation" radius={[4, 4, 0, 0]} fill="#8B5CF6" />
                <Bar dataKey="checkup" radius={[4, 4, 0, 0]} fill="#1F2937" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Crew */}
        <div className="col-span-4 bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Active Crew</h3>
          </div>
          
          <div className="space-y-2">
            <CrewMemberCard
              name="Dr. Sarah Chen"
              role="Medical Officer"
              color="purple"
              time="10:00 AM"
              wellness={88}
              heartRate={68}
              stress={22}
            />
            <CrewMemberCard
              name="Dr. James Wilson"
              role="Flight Surgeon"
              color="blue"
              time="10:00 AM"
              wellness={82}
              heartRate={70}
              stress={28}
            />
            <CrewMemberCard
              name="Cmdr. Williams"
              role="Mission Commander"
              color="green"
              time="Online"
              wellness={85}
              heartRate={72}
              stress={25}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== CREW MEMBER CARD (with hover animation) =====================
function CrewMemberCard({ name, role, color, time, wellness, heartRate, stress }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const colors = {
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600' }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative p-3 border border-gray-100 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${colors[color].bg} rounded-full flex items-center justify-center transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
          <User className={`w-5 h-5 ${colors[color].text}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{name}</h4>
          <p className={`text-xs ${colors[color].text}`}>{role}</p>
        </div>
        <span className="text-xs text-gray-400">{time}</span>
      </div>

      {/* Animated Bio Data Panel */}
      <div className={`mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 transition-all duration-300 overflow-hidden ${isHovered ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-green-600">{wellness}</p>
          <p className="text-xs text-gray-500">Wellness</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-rose-500">{heartRate}</p>
          <p className="text-xs text-gray-500">BPM</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-amber-500">{stress}%</p>
          <p className="text-xs text-gray-500">Stress</p>
        </div>
      </div>
    </div>
  );
}

// ===================== STATS CARD =====================
function StatsCard({ title, value, change, trend, chartType, ringValue }) {
  return (
    <div className="bg-white rounded-2xl p-4 min-w-[160px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{title}</span>
        <button className="text-gray-400 hover:text-gray-600">•••</button>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? '↗' : '↘'} {change}
            </span>
          </div>
          <span className="text-xs text-gray-400">Since last week</span>
        </div>
        {chartType === 'ring' && (
          <div className="relative w-12 h-12">
            <svg className="w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#E5E7EB" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeDasharray={`${(ringValue / 100) * 125.6} 125.6`} strokeLinecap="round" />
            </svg>
          </div>
        )}
        {chartType === 'bars' && (
          <div className="flex items-end gap-0.5 h-10">
            {[40, 60, 45, 70, 55].map((h, i) => (
              <div key={i} className="w-1.5 bg-purple-300 rounded-full" style={{ height: `${h}%` }} />
            ))}
          </div>
        )}
        {!chartType && (
          <div className="flex items-end gap-0.5 h-8">
            {[30, 45, 35, 55, 40, 60, 50].map((h, i) => (
              <div key={i} className="w-1 bg-gray-200 rounded-full" style={{ height: `${h}%` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== LIVE MONITORING VIEW (FIXED CAMERA) =====================
function LiveMonitoringView({ biometrics, isMonitoring, setIsMonitoring, showToast }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setCameraActive(true);
            setIsMonitoring(true);
            showToast({ type: 'success', title: 'Camera Active', message: 'Biometric capture started' });
            // Simulate face detection after delay
            setTimeout(() => setFaceDetected(true), 2000);
          }).catch(err => {
            console.error('Video play failed:', err);
            setCameraError('Failed to start video playback');
          });
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMsg = 'Unable to access camera';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera found. Please connect a camera device.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Camera is in use by another application.';
      }
      setCameraError(errorMsg);
      showToast({ type: 'error', title: 'Camera Error', message: errorMsg });
    }
  }, [setIsMonitoring, showToast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsMonitoring(false);
    setFaceDetected(false);
    showToast({ type: 'info', title: 'Camera Stopped', message: 'Monitoring session ended' });
  }, [setIsMonitoring, showToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Monitoring</h1>
          <p className="text-sm text-gray-500">Real-time biometric capture and analysis</p>
        </div>
        {cameraActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700">Camera Active</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Camera Feed */}
        <div className="col-span-2 bg-white rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Camera Feed</span>
            {cameraActive && (
              <span className="flex items-center gap-1.5 text-xs text-red-500">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="aspect-video bg-gray-900 relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Face detection overlay */}
            {cameraActive && faceDetected && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-60 border-2 border-green-400 rounded-3xl opacity-70">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-green-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-green-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-green-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-green-400 rounded-br-lg" />
                </div>
                <div className="absolute top-4 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Face Detected
                </div>
              </div>
            )}

            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-sm mb-4">Camera not active</p>
                  {cameraError && (
                    <div className="mb-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs max-w-sm mx-auto">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      {cameraError}
                    </div>
                  )}
                  <button 
                    onClick={startCamera} 
                    className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Play className="w-4 h-4" />
                    Start Camera
                  </button>
                </div>
              </div>
            )}
            
            {cameraActive && (
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <div className="flex gap-2">
                  <div className="bg-black/60 backdrop-blur px-3 py-2 rounded-lg text-white">
                    <p className="text-xs text-rose-300">Heart Rate</p>
                    <p className="text-xl font-bold">{biometrics.heartRate} <span className="text-xs font-normal">BPM</span></p>
                  </div>
                  <div className="bg-black/60 backdrop-blur px-3 py-2 rounded-lg text-white">
                    <p className="text-xs text-amber-300">Stress</p>
                    <p className="text-xl font-bold">{biometrics.stressLevel}<span className="text-xs font-normal">%</span></p>
                  </div>
                  <div className="bg-black/60 backdrop-blur px-3 py-2 rounded-lg text-white">
                    <p className="text-xs text-indigo-300">Fatigue</p>
                    <p className="text-xl font-bold">{biometrics.fatigueLevel}<span className="text-xs font-normal">%</span></p>
                  </div>
                </div>
                <button 
                  onClick={stopCamera} 
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Stop Camera
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Live Metrics</h3>
            <div className="space-y-3">
              <MetricBar label="Heart Rate" value={biometrics.heartRate} max={120} unit="BPM" color="rose" />
              <MetricBar label="HRV" value={biometrics.hrv} max={100} unit="ms" color="emerald" />
              <MetricBar label="Stress" value={biometrics.stressLevel} max={100} unit="%" color="amber" />
              <MetricBar label="Fatigue" value={biometrics.fatigueLevel} max={100} unit="%" color="indigo" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Wellness Score</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="56" cy="56" r="48" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                  <circle
                    cx="56" cy="56" r="48" fill="none"
                    stroke={biometrics.wellnessScore >= 70 ? '#10B981' : biometrics.wellnessScore >= 50 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="8"
                    strokeDasharray={`${(biometrics.wellnessScore / 100) * 301.6} 301.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{biometrics.wellnessScore}</span>
                  <span className="text-xs text-gray-500">Score</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">
              {biometrics.wellnessScore >= 80 ? 'Excellent' : biometrics.wellnessScore >= 60 ? 'Good' : 'Needs Attention'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">Privacy Notice</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              All data is processed locally. No video is stored or transmitted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== METRIC BAR =====================
function MetricBar({ label, value, max, unit, color }) {
  const colors = {
    rose: 'bg-rose-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-500'
  };
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900">{value} {unit}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// ===================== CREW VIEW (with hover animations) =====================
function CrewView() {
  const crewMembers = [
    { id: 'CREW-001', name: 'Cmdr. Williams', role: 'Mission Commander', status: 'healthy', wellness: 85, hr: 72, stress: 25, fatigue: 15, hrv: 55, lastActive: '2 mins ago', bio: 'Leading the mission with 15 years of space experience.' },
    { id: 'CREW-002', name: 'Dr. Sarah Chen', role: 'Medical Officer', status: 'healthy', wellness: 88, hr: 68, stress: 22, fatigue: 18, hrv: 62, lastActive: '5 mins ago', bio: 'Board certified in aerospace medicine.' },
    { id: 'CREW-003', name: 'Lt. Marcus Johnson', role: 'Systems Specialist', status: 'warning', wellness: 72, hr: 75, stress: 45, fatigue: 38, hrv: 48, lastActive: '1 min ago', bio: 'Expert in spacecraft systems and engineering.' },
    { id: 'CREW-004', name: 'Dr. Elena Rodriguez', role: 'Flight Surgeon', status: 'healthy', wellness: 82, hr: 70, stress: 28, fatigue: 22, hrv: 58, lastActive: '8 mins ago', bio: 'Specialized in long-duration spaceflight medicine.' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crew Overview</h1>
        <p className="text-sm text-gray-500">Monitor all crew members health status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {crewMembers.map((member) => (
          <CrewCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

// ===================== CREW CARD (with full hover animation) =====================
function CrewCard({ member }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-2xl p-4 transition-all duration-300 cursor-pointer ${
        isHovered ? 'shadow-xl scale-[1.02] border-purple-200' : 'shadow-sm'
      } border border-transparent`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
          member.status === 'healthy' ? 'bg-green-100' : 'bg-amber-100'
        } ${isHovered ? 'scale-110' : ''}`}>
          <User className={`w-7 h-7 ${member.status === 'healthy' ? 'text-green-600' : 'text-amber-600'}`} />
        </div>
        <div>
          <h4 className="font-medium text-gray-900 text-sm">{member.name}</h4>
          <p className="text-xs text-gray-500">{member.role}</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className={`grid grid-cols-2 gap-3 transition-all duration-300 ${isHovered ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <div>
          <p className="text-xs text-gray-500">Wellness</p>
          <p className="text-lg font-bold text-gray-900">{member.wellness}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Heart Rate</p>
          <p className="text-lg font-bold text-gray-900">{member.hr}</p>
        </div>
      </div>

      {/* Expanded Bio Data on Hover */}
      <div className={`transition-all duration-300 ${isHovered ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
        <p className="text-xs text-gray-600 mb-3 italic">{member.bio}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-green-600">{member.wellness}</p>
            <p className="text-xs text-gray-500">Wellness</p>
          </div>
          <div className="bg-rose-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-rose-500">{member.hr}</p>
            <p className="text-xs text-gray-500">BPM</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-amber-500">{member.stress}%</p>
            <p className="text-xs text-gray-500">Stress</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-indigo-500">{member.fatigue}%</p>
            <p className="text-xs text-gray-500">Fatigue</p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">HRV</span>
              <span className="font-medium">{member.hrv} ms</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${member.hrv}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Last active: {member.lastActive}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            member.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {member.status}
          </span>
        </div>
      </div>

      {/* Status Badge (always visible) */}
      <div className={`mt-3 transition-all duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
        <span className={`text-xs px-2 py-1 rounded-full ${
          member.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {member.status}
        </span>
      </div>
    </div>
  );
}

// ===================== TIMELINE VIEW =====================
function TimelineView({ telemetryHistory }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Health Analytics</h1>
        <p className="text-sm text-gray-500">Historical health data and trends</p>
      </div>

      <div className="bg-white rounded-2xl p-4">
        <h3 className="font-medium text-gray-900 mb-4">Telemetry Timeline</h3>
        {telemetryHistory.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip />
                <Line type="monotone" dataKey="heartRate" name="Heart Rate" stroke="#F43F5E" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="stress" name="Stress" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fatigue" name="Fatigue" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start monitoring to see data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== ALERTS VIEW =====================
function AlertsView({ biometrics }) {
  const alerts = [];
  if (biometrics.stressLevel > 50) {
    alerts.push({ type: 'warning', title: 'Elevated Stress', message: `Current: ${biometrics.stressLevel}%`, time: new Date() });
  }
  if (biometrics.heartRate > 90) {
    alerts.push({ type: 'warning', title: 'High Heart Rate', message: `Current: ${biometrics.heartRate} BPM`, time: new Date() });
  }
  if (biometrics.fatigueLevel > 60) {
    alerts.push({ type: 'info', title: 'Fatigue Alert', message: `Current: ${biometrics.fatigueLevel}%`, time: new Date() });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <p className="text-sm text-gray-500">Health alerts and notifications</p>
      </div>

      <div className="bg-white rounded-2xl p-4">
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-xl border-l-4 transition-all hover:shadow-md ${
                alert.type === 'warning' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {alert.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-medium text-green-600 text-lg">All Systems Normal</p>
            <p className="text-sm text-gray-500 mt-1">No health alerts at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== ASSISTANT VIEW =====================
function AssistantView({ crewId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || sending) return;
    const userMsg = text.trim();
    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const result = await api.sendChat({ astronaut_id: crewId, message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
    setSending(false);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">AI Health Assistant</h1>
        <p className="text-sm text-gray-500">Powered by GPT-4o</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">How can I help you today?</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['Breathing exercise', 'Stress management', 'Sleep tips', 'Focus techniques'].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => sendMessage(s)} 
                    className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user' ? 'ml-auto bg-purple-500 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
          {sending && (
            <div className="bg-gray-100 p-4 rounded-2xl max-w-[80%]">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-200 transition-all"
          />
          <button 
            onClick={() => sendMessage(input)} 
            disabled={sending || !input.trim()}
            className="px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
