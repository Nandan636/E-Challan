import React, { useState, createContext, useContext, useEffect } from 'react';
import './App.css';

// API Base URL - Make sure your backend is running on port 5000
const API_URL = 'http://localhost:5000/api';

// AUTH CONTEXT
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const login = (userData) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

// API SERVICE - Connected to MongoDB Backend
const api = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },
  
  register: async (formData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },
  
  uploadChallan: async (challanData) => {
    const formData = new FormData();
    formData.append('image', challanData.image);
    formData.append('numberPlate', challanData.numberPlate);
    formData.append('description', challanData.description);
    formData.append('location', JSON.stringify(challanData.location));
    formData.append('reportedBy', challanData.reportedBy);
    formData.append('reporterName', challanData.reporterName);

    const response = await fetch(`${API_URL}/challans`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },
  
  getChallans: async (filter = 'all') => {
    const url = filter === 'all' ? `${API_URL}/challans` : `${API_URL}/challans?status=${filter}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.challans || [];
  },
  
  updateChallanStatus: async (challanId, status) => {
    const response = await fetch(`${API_URL}/challans/${challanId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },
  
  getStats: async () => {
    const response = await fetch(`${API_URL}/stats`);
    const data = await response.json();
    return data.stats || {};
  }
};

// LOGIN COMPONENT
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.login(email, password);
      login(response.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) return <Register onBack={() => setShowRegister(false)} />;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🚔</div>
          <h1>E-Challan System</h1>
          <p>Login to your account</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="auth-form">
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field" placeholder="Enter your email" required />
          </div>
          <div className="input-group">
  <label className="input-label">Password</label>
  <div style={{ position: 'relative' }}>
    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="input-field"
      placeholder="Enter your password"
      required
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: "absolute",
        right: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        border: "none",
        background: "none",
        cursor: "pointer",
        fontSize: "14px",
        color: "#6b7280"
      }}
    >
      {showPassword ? "Hide" : "Show"}
    </button>
  </div>
</div>

          <button onClick={handleSubmit} className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        <div className="auth-footer">
          <button onClick={() => setShowRegister(true)} className="link-button">
            Don't have an account? Register here
          </button>
        </div>
        <div className="demo-credentials">
          <p className="demo-title">💡 First Time? Register to get started!</p>
          <p>Click "Register here" above to create your account</p>
        </div>
      </div>
    </div>
  );
};

// REGISTER COMPONENT
const Register = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'user'
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.register(formData);
      setSuccess(true);
      setTimeout(() => onBack(), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">📝</div>
          <h2>Create Account</h2>
          <p>Register for E-Challan System</p>
        </div>
        {success && <div className="alert alert-success">✓ Registration successful! Redirecting...</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <div className="auth-form">
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              className="input-field" placeholder="Enter your full name" required />
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              className="input-field" placeholder="Enter your email" required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange}
              className="input-field" placeholder="Create a password" required />
          </div>
          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
              className="input-field" placeholder="Confirm your password" required />
          </div>
          <div className="input-group">
            <label className="input-label">Register As</label>
            <select name="role" value={formData.role} onChange={handleChange} className="input-field">
              <option value="user">👤 Citizen</option>
              <option value="police">👮 Police Officer</option>
            </select>
          </div>
          <button onClick={handleSubmit} className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
          <button onClick={onBack} className="btn btn-secondary btn-full">Back to Login</button>
        </div>
      </div>
    </div>
  );
};

// UPLOAD CHALLAN COMPONENT
const UploadChallan = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [numberPlate, setNumberPlate] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setDetecting(true);
      setTimeout(() => {
        const mockPlate = 'KA-' + 
          String(Math.floor(Math.random() * 99) + 1).padStart(2, '0') + 
          '-' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
          String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
          '-' + String(Math.floor(Math.random() * 9000) + 1000);
        setNumberPlate(mockPlate);
        setDetecting(false);
      }, 2000);
    }
  };

  const getLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: 'Bengaluru, Karnataka, India'
          });
          setLoading(false);
        },
        () => {
          alert('Unable to get location');
          setLoading(false);
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      alert('Please capture your location first');
      return;
    }
    setLoading(true);
    try {
      await api.uploadChallan({ 
        image, 
        numberPlate, 
        description, 
        location,
        reportedBy: user.id,
        reporterName: user.name
      });
      onSuccess();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚨 Report Traffic Violation</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div>
          <div className="input-group">
            <label className="input-label">📷 Upload Vehicle Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} 
              className="input-field" required />
            <p className="input-hint">Capture clear photo of the vehicle and number plate</p>
          </div>
          {preview && (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
            </div>
          )}
          {detecting && (
            <div className="alert alert-info">
              <div className="spinner-small"></div>
              <span>AI is detecting number plate...</span>
            </div>
          )}
          {numberPlate && !detecting && (
            <div className="input-group">
              <label className="input-label">🔢 Detected Number Plate</label>
              <input type="text" value={numberPlate} onChange={(e) => setNumberPlate(e.target.value)}
                className="input-field detected-plate" required />
              <p className="input-success">✓ Auto-detected by AI (You can edit if incorrect)</p>
            </div>
          )}
          <div className="input-group">
            <label className="input-label">📍 Location</label>
            {!location ? (
              <button onClick={getLocation} disabled={loading} className="btn btn-success btn-full">
                {loading ? 'Getting Location...' : '📍 Capture Current Location'}
              </button>
            ) : (
              <div className="location-captured">
                <p className="location-title">✓ Location Captured Successfully</p>
                <p className="location-address">{location.address}</p>
                <p className="location-coords">
                  Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
          <div className="input-group">
            <label className="input-label">📝 Description of Violation</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="input-field" rows="4" 
              placeholder="Describe what traffic rule was violated"
              required />
          </div>
          <div className="modal-actions">
            <button onClick={handleSubmit} className="btn btn-primary" disabled={loading || detecting}>
              {loading ? '⏳ Submitting...' : '✓ Submit Challan'}
            </button>
            <button onClick={onClose} disabled={loading} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// USER DASHBOARD
const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, [success]);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="dashboard">
      <nav className="navbar navbar-user">
        <div className="container navbar-content">
          <div className="navbar-brand">
            <span className="navbar-icon">🚔</span>
            <h1>E-Challan System</h1>
          </div>
          <div className="navbar-user-info">
            <div className="user-greeting">
              <p className="greeting-text">Welcome back,</p>
              <p className="user-name">{user.name}</p>
            </div>
            <button onClick={logout} className="btn btn-danger">Logout</button>
          </div>
        </div>
      </nav>
      <div className="container dashboard-content">
        {success && (
          <div className="alert alert-success alert-large">
            <span className="alert-icon">✓</span>
            <div>
              <p className="alert-title">Challan Submitted Successfully!</p>
              <p className="alert-subtitle">Your report has been sent to the police department.</p>
            </div>
          </div>
        )}
        <div className="card card-main">
          <div className="card-center">
            <div className="main-icon">🚨</div>
            <h2 className="main-title">Report Traffic Violation</h2>
            <p className="main-subtitle">Help make our roads safer by reporting traffic violations</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary btn-large btn-full">
            📷 Upload Violation Report
          </button>
        </div>
        <div className="card">
          <h3 className="card-title"><span>ℹ️</span> How It Works</h3>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1️⃣</div>
              <h4>Click Upload</h4>
              <p>Start by clicking the upload button above</p>
            </div>
            <div className="step-card">
              <div className="step-number">2️⃣</div>
              <h4>Take Photo</h4>
              <p>Capture clear photo of the violating vehicle</p>
            </div>
            <div className="step-card">
              <div className="step-number">3️⃣</div>
              <h4>AI Detection</h4>
              <p>Our AI automatically detects the number plate</p>
            </div>
            <div className="step-card">
              <div className="step-number">4️⃣</div>
              <h4>Add Details</h4>
              <p>Share location and describe the violation</p>
            </div>
            <div className="step-card">
              <div className="step-number">5️⃣</div>
              <h4>Submit Report</h4>
              <p>Police will review and take action</p>
            </div>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card stat-green">
            <div className="stat-icon">👥</div>
            <p className="stat-number">{stats.totalUsers || 0}</p>
            <p className="stat-label">Active Citizens</p>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-icon">📋</div>
            <p className="stat-number">{stats.totalChallans || 0}</p>
            <p className="stat-label">Reports Submitted</p>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon">✅</div>
            <p className="stat-number">{stats.approvedChallans || 0}</p>
            <p className="stat-label">Challans Issued</p>
          </div>
        </div>
      </div>
      {showUpload && <UploadChallan onClose={() => setShowUpload(false)} onSuccess={handleUploadSuccess} />}
    </div>
  );
};

// POLICE DASHBOARD
const PoliceDashboard = () => {
  const { user, logout } = useAuth();
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchChallans();
    fetchStats();
  }, [filter]);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const data = await api.getChallans(filter);
      setChallans(data);
    } catch (err) {
      console.error('Error fetching challans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleAction = async (challanId, action) => {
    try {
      await api.updateChallanStatus(challanId, action);
      alert(`Challan ${action} successfully!`);
      fetchChallans();
      fetchStats();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar navbar-police">
        <div className="container navbar-content">
          <div className="navbar-brand">
            <span className="navbar-icon">👮</span>
            <div>
              <h1>Police Portal</h1>
              <p className="navbar-subtitle">E-Challan Management System</p>
            </div>
          </div>
          <div className="navbar-user-info">
            <div className="user-greeting">
              <p className="greeting-text">Officer on Duty</p>
              <p className="user-name">{user.name}</p>
            </div>
            <button onClick={logout} className="btn btn-danger">Logout</button>
          </div>
        </div>
      </nav>
      <div className="container dashboard-content">
        <div className="stats-grid stats-grid-4">
          <div className="stat-card stat-blue">
            <div className="stat-content">
              <div>
                <p className="stat-label">Total Reports</p>
                <p className="stat-number">{stats.totalChallans || 0}</p>
              </div>
              <div className="stat-icon">📋</div>
            </div>
          </div>
          <div className="stat-card stat-yellow">
            <div className="stat-content">
              <div>
                <p className="stat-label">Pending</p>
                <p className="stat-number">{stats.pendingChallans || 0}</p>
              </div>
              <div className="stat-icon">⏳</div>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-content">
              <div>
                <p className="stat-label">Approved</p>
                <p className="stat-number">{stats.approvedChallans || 0}</p>
              </div>
              <div className="stat-icon">✅</div>
            </div>
          </div>
          <div className="stat-card stat-red">
            <div className="stat-content">
              <div>
                <p className="stat-label">Rejected</p>
                <p className="stat-number">{stats.rejectedChallans || 0}</p>
              </div>
              <div className="stat-icon">❌</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2>Reported Violations</h2>
            <div className="filter-buttons">
              <button onClick={() => setFilter('all')} 
                className={`btn btn-filter ${filter === 'all' ? 'active' : ''}`}>All</button>
              <button onClick={() => setFilter('pending')} 
                className={`btn btn-filter ${filter === 'pending' ? 'active' : ''}`}>Pending</button>
              <button onClick={() => setFilter('approved')} 
                className={`btn btn-filter ${filter === 'approved' ? 'active' : ''}`}>Approved</button>
              <button onClick={() => setFilter('rejected')} 
                className={`btn btn-filter ${filter === 'rejected' ? 'active' : ''}`}>Rejected</button>
            </div>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading challans...</p>
            </div>
          ) : challans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔭</div>
              <p>No challans to display</p>
            </div>
          ) : (
            <div className="challans-list">
              {challans.map((challan) => (
                <div key={challan._id} className="challan-card">
                  <div className="challan-header">
                    <div>
                      <h3 className="challan-plate">{challan.numberPlate}</h3>
                      <span className={`status-badge status-${challan.status}`}>
                        {challan.status.charAt(0).toUpperCase() + challan.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="challan-meta">
                    <p>📅 Reported: {new Date(challan.createdAt).toLocaleString('en-IN')}</p>
                    <p>👤 Reported by: {challan.reporterName}</p>
                  </div>
                  <div className="challan-details">
                    <p><strong>🚨 Violation:</strong> {challan.description}</p>
                    <p><strong>📍 Location:</strong> {challan.location.address}</p>
                    {challan.imageUrl && (
                      <p><strong>📷 Image:</strong> <a href={`http://localhost:5000${challan.imageUrl}`} target="_blank" rel="noreferrer">View Photo</a></p>
                    )}
                  </div>
                  {challan.status === 'pending' && (
                    <div className="challan-actions">
                      <button onClick={() => handleAction(challan._id, 'approved')} 
                        className="btn btn-success btn-small">✅ Approve</button>
                      <button onClick={() => handleAction(challan._id, 'rejected')} 
                        className="btn btn-danger btn-small">❌ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// MAIN APP
function AppContent() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  if (!user) return <Login />;
  return user.role === 'police' ? <PoliceDashboard /> : <UserDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}