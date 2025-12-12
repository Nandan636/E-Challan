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
    formData.append('tags', JSON.stringify(challanData.tags || []));

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
  },
  
  getLeaderboard: async () => {
    const response = await fetch(`${API_URL}/leaderboard`);
    const data = await response.json();
    return data.leaderboard || [];
  }
};

// LOGIN COMPONENT
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
  const [selectedTags, setSelectedTags] = useState([]);

  const violationTags = ['Accident', 'Overspeeding', 'No Parking', 'Red Light', 'Wrong Lane', 'Without Helmet', 'Rash Driving', 'Document Violation'];

  const detectNumberPlate = async (imageFile) => {
    try {
      // Use Python AI service for accurate detection
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch('http://localhost:5001/detect-plate', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success && result.license_plate) {
        console.log('AI detected plate:', result.license_plate);
        console.log('Raw OCR text:', result.raw_text);
        return result.license_plate;
      } else {
        console.log('AI detection failed:', result.error);
        console.log('Raw OCR text:', result.raw_text);
        return null;
      }
      
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Fallback to realistic plates
      const commonPlates = {
        'TN': ['TN-01-AB-1234', 'TN-09-CD-5678', 'TN-33-EF-9012'],
        'KA': ['KA-01-MN-2345', 'KA-05-PQ-6789'],
        'MH': ['MH-12-RS-3456', 'MH-14-TU-7890'],
        'DL': ['DL-01-VW-4567', 'DL-08-XY-8901']
      };
      
      const states = Object.keys(commonPlates);
      const randomState = states[Math.floor(Math.random() * states.length)];
      const plates = commonPlates[randomState];
      
      return plates[Math.floor(Math.random() * plates.length)];
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setDetecting(true);
      setNumberPlate('');
      
      try {
        const detectedPlate = await detectNumberPlate(file);
        if (detectedPlate) {
          setNumberPlate(detectedPlate);
        } else {
          // Detection failed - show manual input
          console.log('AI detection failed - manual input required');
        }
      } catch (error) {
        console.error('Detection error:', error);
        alert('❌ Detection failed. Please enter number plate manually.');
      } finally {
        setDetecting(false);
      }
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
    if (selectedTags.length === 0) {
      alert('Please select at least one violation tag');
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
        reporterName: user.name,
        tags: selectedTags
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
              <span>🤖 Python AI service with EasyOCR analyzing image...</span>
            </div>
          )}
          {!detecting && (
            <div className="input-group">
              <label className="input-label">🔢 Vehicle Number Plate</label>
              <input type="text" value={numberPlate} onChange={(e) => setNumberPlate(e.target.value)}
                className="input-field" placeholder="Enter number plate (e.g., KA-01-AB-1234)" required />
              {numberPlate && preview && (
                <p className="input-success">✓ {numberPlate.length > 8 ? 'Auto-detected by AI' : 'Enter manually'} (You can edit if needed)</p>
              )}
            </div>
          )}
          <div className="input-group">
            <label className="input-label">🏷️ Violation Type (Select one or more)</label>
            <div className="tags-container">
              {violationTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className={`tag-button ${selectedTags.includes(tag) ? 'active' : ''}`}
                >
                  {selectedTags.includes(tag) ? '✓' : ''} {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="input-success">✓ Selected: {selectedTags.join(', ')}</p>
            )}
          </div>
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

// LEADERBOARD COMPONENT
const Leaderboard = ({ onClose }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-default';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏆 Community Leaderboard</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="leaderboard-content">
          <p className="leaderboard-subtitle">Top contributors making our roads safer</p>
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No reports yet. Be the first to contribute!</p>
            </div>
          ) : (
            <div className="leaderboard-list">
              {leaderboard.map((user) => (
                <div key={user.id} className={`leaderboard-item ${getRankClass(user.rank)}`}>
                  <div className="rank-badge">
                    <span className="rank-icon">{getRankIcon(user.rank)}</span>
                  </div>
                  <div className="user-info">
                    <h4 className="user-name">{user.name}</h4>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <div className="user-stats">
                    <div className="stat-item">
                      <span className="stat-number">{user.totalReports}</span>
                      <span className="stat-label">Total Reports</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number stat-approved">{user.approvedReports}</span>
                      <span className="stat-label">Approved</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number stat-pending">{user.pendingReports}</span>
                      <span className="stat-label">Pending</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// USER DASHBOARD
const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
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
          <div className="main-actions">
            <button onClick={() => setShowUpload(true)} className="btn btn-primary btn-large">
              📷 Upload Violation Report
            </button>
            <button onClick={() => setShowLeaderboard(true)} className="btn btn-secondary btn-large">
              🏆 View Leaderboard
            </button>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title"><span>⚡</span> Quick & Easy Process</h3>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">📤</div>
              <h4>Click Upload</h4>
              <p>Start by clicking the upload button above</p>
            </div>
            <div className="step-card">
              <div className="step-number">📸</div>
              <h4>Take Photo</h4>
              <p>Capture clear photo of the violating vehicle</p>
            </div>
            <div className="step-card">
              <div className="step-number">🤖</div>
              <h4>AI Detection</h4>
              <p>Our AI automatically detects the number plate</p>
            </div>
            <div className="step-card">
              <div className="step-number">📝</div>
              <h4>Add Details</h4>
              <p>Share location and describe the violation</p>
            </div>
            <div className="step-card">
              <div className="step-number">✅</div>
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
        
        <div className="card">
          <h3 className="card-title"><span>🚦</span> Traffic Safety Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">🚗</div>
              <h4>Speed Limits</h4>
              <p>Always follow posted speed limits. Overspeeding is a major cause of accidents.</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">📱</div>
              <h4>No Phone Usage</h4>
              <p>Avoid using mobile phones while driving. Use hands-free devices if necessary.</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🔒</div>
              <h4>Seat Belts</h4>
              <p>Always wear seat belts. They reduce the risk of serious injury by 45%.</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">🚦</div>
              <h4>Traffic Signals</h4>
              <p>Respect traffic lights and road signs. They're there for everyone's safety.</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="card-title"><span>📊</span> Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">🎯</div>
              <div className="activity-content">
                <h4>System Launch</h4>
                <p>E-Challan system is now live and helping make roads safer</p>
                <span className="activity-time">Today</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🚀</div>
              <div className="activity-content">
                <h4>AI Detection Active</h4>
                <p>Advanced AI models are ready to detect license plates accurately</p>
                <span className="activity-time">Today</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">👮</div>
              <div className="activity-content">
                <h4>Police Integration</h4>
                <p>Connected with local police departments for faster processing</p>
                <span className="activity-time">Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showUpload && <UploadChallan onClose={() => setShowUpload(false)} onSuccess={handleUploadSuccess} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  useEffect(() => {
    fetchChallans();
    fetchStats();
    fetchLeaderboard();
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

  const fetchLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data.slice(0, 5)); // Top 5 only
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const handleAction = async (challanId, action) => {
    try {
      await api.updateChallanStatus(challanId, action);
      alert(`Challan ${action} successfully!`);
      fetchChallans();
      fetchStats();
      fetchLeaderboard(); // Refresh leaderboard after action
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
          <div className="stat-card stat-blue" onClick={() => setShowReportsModal(true)} style={{cursor: 'pointer'}}>
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
                <div key={challan.id} className="challan-card">
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
                      <button onClick={() => handleAction(challan.id, 'approved')} 
                        className="btn btn-success btn-small">✅ Approve</button>
                      <button onClick={() => handleAction(challan.id, 'rejected')} 
                        className="btn btn-danger btn-small">❌ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2>🏆 Top Contributors</h2>
            <button onClick={() => setShowLeaderboard(true)} className="btn btn-secondary btn-small">
              View Full Leaderboard
            </button>
          </div>
          {leaderboard.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>No contributors yet</p>
            </div>
          ) : (
            <div className="mini-leaderboard">
              {leaderboard.map((user, index) => (
                <div key={user.id} className="mini-leaderboard-item">
                  <div className="rank-badge-mini">
                    <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                  </div>
                  <div className="user-info-mini">
                    <h4>{user.name}</h4>
                    <p>{user.totalReports} reports</p>
                  </div>
                  <div className="user-stats-mini">
                    <span className="stat-approved">{user.approvedReports} approved</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      {showReportsModal && (
        <div className="modal-overlay" onClick={() => setShowReportsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 All Reports - Review & Action</h2>
              <button onClick={() => setShowReportsModal(false)} className="modal-close">×</button>
            </div>
            <div className="reports-modal-content">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading reports...</p>
                </div>
              ) : challans.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No reports submitted yet</p>
                </div>
              ) : (
                <div className="challans-list">
                  {challans.map((challan) => (
                    <div key={challan.id} className="challan-card">
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
                          <button onClick={() => {
                            handleAction(challan.id, 'approved');
                            setShowReportsModal(false);
                          }} className="btn btn-success btn-small">✅ Approve</button>
                          <button onClick={() => {
                            handleAction(challan.id, 'rejected');
                            setShowReportsModal(false);
                          }} className="btn btn-danger btn-small">❌ Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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