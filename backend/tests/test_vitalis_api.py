"""
Vitalis Mission Monitoring API Tests
Tests authentication, health data, biometric scans, and chat endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vitalis-mission.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = f"test_user_{uuid.uuid4().hex[:8]}@vitalis.com"
TEST_PASSWORD = "test1234"
TEST_NAME = "Test Astronaut"
EXISTING_EMAIL = "commander@vitalis.com"
EXISTING_PASSWORD = "test1234"


class TestHealthEndpoint:
    """API Health Check Tests"""
    
    def test_health_check(self):
        """Test /api/health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["system"] == "Vitalis Mission Monitoring"
        assert "timestamp" in data
        print(f"✓ Health check passed - System: {data['system']}, Version: {data['version']}")


class TestAuthentication:
    """Authentication Endpoint Tests"""
    
    def test_register_new_user(self):
        """Test user registration creates new account"""
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": TEST_NAME,
            "role": "astronaut"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert data["user"]["full_name"] == TEST_NAME
        assert "astronaut_id" in data["user"]
        print(f"✓ Registration successful - User ID: {data['user']['id']}, Astronaut ID: {data['user']['astronaut_id']}")
        return data["access_token"]
    
    def test_register_duplicate_email(self):
        """Test registration fails for existing email"""
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Duplicate User",
            "role": "astronaut"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        print(f"✓ Duplicate email registration correctly rejected")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful - Token received")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login fails with wrong password"""
        payload = {
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 401, f"Expected 401 for invalid credentials, got {response.status_code}"
        print(f"✓ Invalid credentials correctly rejected")
    
    def test_get_current_user(self):
        """Test /api/auth/me returns current user"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Get current user
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Get user failed: {response.text}"
        
        data = response.json()
        assert data["email"] == TEST_EMAIL
        assert "password" not in data  # Password should be excluded
        print(f"✓ Get current user successful - {data['full_name']}")
    
    def test_unauthorized_access(self):
        """Test endpoints require valid token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403], f"Expected auth error, got {response.status_code}"
        print(f"✓ Unauthorized access correctly blocked")


class TestHealthData:
    """Health Data Endpoint Tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            # Try creating user first
            reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "full_name": TEST_NAME,
                "role": "astronaut"
            })
            return reg_response.json()["access_token"]
        return response.json()["access_token"]
    
    def test_ingest_health_data(self, auth_token):
        """Test posting health data"""
        payload = {
            "astronaut_id": "TEST-AST-001",
            "heart_rate": 72,
            "hrv": 55,
            "stress_level": 25,
            "fatigue_level": 15,
            "confidence": 0.9,
            "source": "test"
        }
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/health/ingest", json=payload, headers=headers)
        assert response.status_code == 200, f"Health ingest failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "record_id" in data
        assert "validation" in data
        print(f"✓ Health data ingested - Record ID: {data['record_id']}")
    
    def test_get_latest_health(self, auth_token):
        """Test getting latest health data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/latest/TEST-AST-001", headers=headers)
        
        # Should return 200 even if no data (returns null)
        assert response.status_code == 200, f"Get latest health failed: {response.text}"
        print(f"✓ Get latest health successful")
    
    def test_get_health_timeline(self, auth_token):
        """Test getting health timeline"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/health/timeline/TEST-AST-001?days=7", headers=headers)
        assert response.status_code == 200, f"Get timeline failed: {response.text}"
        
        data = response.json()
        assert "records" in data
        assert "daily_averages" in data
        assert "total_records" in data
        print(f"✓ Health timeline retrieved - {data['total_records']} records")


class TestBiometricScan:
    """Biometric Scan Endpoint Tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Cannot get auth token")
        return response.json()["access_token"]
    
    def test_store_biometric_scan(self, auth_token):
        """Test storing biometric scan data from webcam"""
        payload = {
            "astronaut_id": "TEST-AST-001",
            "heart_rate": 75,
            "hrv": 52,
            "stress_level": 30,
            "fatigue_level": 20,
            "wellness_score": 82,
            "face_detected": True,
            "scan_duration_seconds": 10.5
        }
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/biometric/scan", json=payload, headers=headers)
        assert response.status_code == 200, f"Biometric scan failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "record_id" in data
        assert "risk_analysis" in data
        print(f"✓ Biometric scan stored - Record ID: {data['record_id']}")
    
    def test_get_latest_biometric_scan(self, auth_token):
        """Test getting latest biometric scan"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/biometric/latest/TEST-AST-001", headers=headers)
        assert response.status_code == 200, f"Get biometric scan failed: {response.text}"
        print(f"✓ Get latest biometric scan successful")


class TestChatEndpoint:
    """AI Chat Endpoint Tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Cannot get auth token")
        return response.json()["access_token"]
    
    def test_send_chat_message(self, auth_token):
        """Test sending message to AI assistant"""
        payload = {
            "astronaut_id": "TEST-AST-001",
            "message": "Hello, how can you help me?"
        }
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/chat/send", json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Chat send failed: {response.text}"
        
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert len(data["response"]) > 0
        print(f"✓ Chat message sent - Response received (length: {len(data['response'])})")
    
    def test_get_chat_history(self, auth_token):
        """Test getting chat history"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/chat/history/TEST-AST-001", headers=headers)
        assert response.status_code == 200, f"Get chat history failed: {response.text}"
        
        data = response.json()
        assert "history" in data
        print(f"✓ Chat history retrieved - {len(data['history'])} messages")


class TestDashboardSummary:
    """Dashboard Summary Endpoint Tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Cannot get auth token")
        return response.json()["access_token"]
    
    def test_get_dashboard_summary(self, auth_token):
        """Test getting comprehensive dashboard data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/dashboard/summary/TEST-AST-001", headers=headers)
        assert response.status_code == 200, f"Dashboard summary failed: {response.text}"
        
        data = response.json()
        assert "health" in data or data.get("health") is None
        assert "baseline" in data
        assert "context" in data
        assert "timeline" in data
        assert "alerts" in data
        assert "timestamp" in data
        print(f"✓ Dashboard summary retrieved successfully")


class TestAlerts:
    """Alert Endpoint Tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Cannot get auth token")
        return response.json()["access_token"]
    
    def test_get_alerts(self, auth_token):
        """Test getting alerts for astronaut"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/alerts/TEST-AST-001", headers=headers)
        assert response.status_code == 200, f"Get alerts failed: {response.text}"
        
        data = response.json()
        assert "alerts" in data
        print(f"✓ Alerts retrieved - {len(data['alerts'])} alerts")


class TestMissionContext:
    """Mission Context Endpoint Tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Cannot get auth token")
        return response.json()["access_token"]
    
    def test_get_context(self, auth_token):
        """Test getting mission context"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/context/TEST-AST-001", headers=headers)
        assert response.status_code == 200, f"Get context failed: {response.text}"
        
        data = response.json()
        assert "mission_phase" in data
        assert "time_of_day" in data
        assert "work_cycle" in data
        print(f"✓ Mission context retrieved - Phase: {data.get('mission_phase', 'N/A')}")
    
    def test_update_context(self, auth_token):
        """Test updating mission context"""
        payload = {
            "astronaut_id": "TEST-AST-001",
            "mission_phase": "transit",
            "time_of_day": "morning",
            "work_cycle": "active",
            "days_since_launch": 45,
            "current_workload": "moderate"
        }
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/context/update", json=payload, headers=headers)
        assert response.status_code == 200, f"Update context failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        print(f"✓ Mission context updated successfully")


class TestSimulation:
    """Simulation Endpoint Tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Cannot get auth token")
        return response.json()["access_token"]
    
    def test_generate_simulation_data(self, auth_token):
        """Test generating simulated health data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/simulate/generate?astronaut_id=TEST-AST-001&days=3", 
            headers=headers
        )
        assert response.status_code == 200, f"Simulation generation failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["records_created"] > 0
        print(f"✓ Simulation data generated - {data['records_created']} records created")


class TestBaseline:
    """Baseline Endpoint Tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Cannot get auth token")
        return response.json()["access_token"]
    
    def test_get_baseline(self, auth_token):
        """Test getting astronaut baseline"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/baseline/TEST-AST-001", headers=headers)
        assert response.status_code == 200, f"Get baseline failed: {response.text}"
        
        data = response.json()
        assert "hr_baseline" in data
        assert "hrv_baseline" in data
        print(f"✓ Baseline retrieved - HR baseline: {data['hr_baseline']}")
    
    def test_recalibrate_baseline(self, auth_token):
        """Test recalibrating baseline"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/baseline/recalibrate?astronaut_id=TEST-AST-001", 
            headers=headers
        )
        assert response.status_code == 200, f"Recalibrate baseline failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "baseline" in data
        print(f"✓ Baseline recalibrated successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
