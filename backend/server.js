const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/echallan')
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'police'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Update ChallanSchema to allow imageUrl and videoUrl (imageUrl not required)
const ChallanSchema = new mongoose.Schema({
  numberPlate: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  videoUrl: { type: String },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Challan = mongoose.model('Challan', ChallanSchema);

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({ name, email, password, role });
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Registration successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    res.json({ 
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CHALLAN ROUTES ====================

// Get all challans
app.get('/api/challans', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    
    const challans = await Challan.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, challans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new challan with image upload
app.post('/api/challans', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { numberPlate, description, location, reportedBy, reporterName, tags } = req.body;
    if (!req.files || (!req.files['image'] && !req.files['video'])) {
      return res.status(400).json({ success: false, message: 'Image or video is required' });
    }
    const imageFile = req.files['image'] ? req.files['image'][0] : null;
    const videoFile = req.files['video'] ? req.files['video'][0] : null;
    const challan = new Challan({
      numberPlate,
      description,
      imageUrl: imageFile ? `/uploads/${imageFile.filename}` : null,
      videoUrl: videoFile ? `/uploads/${videoFile.filename}` : null,
      location: location ? JSON.parse(location) : null,
      reportedBy,
      reporterName,
      tags: tags ? JSON.parse(tags) : [],
    });
    await challan.save();
    res.json({ success: true, challan, message: 'Challan submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update challan status
app.patch('/api/challans/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    const challan = await Challan.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }
    
    res.json({ success: true, challan, message: `Challan ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalChallans = await Challan.countDocuments();
    const pendingChallans = await Challan.countDocuments({ status: 'pending' });
    const approvedChallans = await Challan.countDocuments({ status: 'approved' });
    const rejectedChallans = await Challan.countDocuments({ status: 'rejected' });
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    res.json({
      success: true,
      stats: {
        totalChallans,
        pendingChallans,
        approvedChallans,
        rejectedChallans,
        totalUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' });
    const challans = await Challan.find();
    
    const userStats = {};
    
    // Initialize all users
    users.forEach(user => {
      userStats[user._id] = {
        id: user._id,
        name: user.name,
        email: user.email,
        totalReports: 0,
        approvedReports: 0,
        pendingReports: 0,
        rejectedReports: 0
      };
    });
    
    // Count reports for each user
    challans.forEach(challan => {
      if (userStats[challan.reportedBy]) {
        userStats[challan.reportedBy].totalReports++;
        if (challan.status === 'approved') {
          userStats[challan.reportedBy].approvedReports++;
        } else if (challan.status === 'pending') {
          userStats[challan.reportedBy].pendingReports++;
        } else if (challan.status === 'rejected') {
          userStats[challan.reportedBy].rejectedReports++;
        }
      }
    });
    
    // Convert to array and sort
    const leaderboard = Object.values(userStats)
      .sort((a, b) => b.totalReports - a.totalReports)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
    
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== SERVICE REQUEST ROUTES ====================

// In-memory storage for service requests
let serviceRequests = [];
let serviceRequestIdCounter = 1;

// Service request issue types/tags
const SERVICE_ISSUE_TYPES = [
  'Tyre Puncture',
  'Dead Battery',
  'Engine Trouble',
  'Brake Issues',
  'Air Filter',
  'Windshield Repair',
  'Light Replacement',
  'General Maintenance'
];

// Create a service request
app.post('/api/service-requests', upload.single('image'), (req, res) => {
  try {
    const { issueType, description, location, reportedBy, reporterName, vehicleInfo } = req.body;
    
    const serviceRequest = {
      id: serviceRequestIdCounter++,
      issueType: issueType || 'General Maintenance',
      description,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      location: location ? JSON.parse(location) : null,
      reportedBy: parseInt(reportedBy),
      reporterName,
      vehicleInfo,
      status: 'pending',
      assignedServiceShop: null,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    serviceRequests.push(serviceRequest);
    res.json({ success: true, message: 'Service request created', request: serviceRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all service requests (with filtering)
app.get('/api/service-requests', (req, res) => {
  try {
    const { status } = req.query;
    let filtered = serviceRequests;
    
    if (status && status !== 'all') {
      filtered = serviceRequests.filter(req => req.status === status);
    }
    
    res.json({ success: true, requests: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get service requests for a specific user
app.get('/api/service-requests/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userRequests = serviceRequests.filter(req => req.reportedBy === parseInt(userId));
    res.json({ success: true, requests: userRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update service request status
app.patch('/api/service-requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const request = serviceRequests.find(r => r.id === parseInt(id));
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }
    
    if (status) request.status = status;
    if (notes) request.notes = notes;
    request.updatedAt = new Date();
    
    res.json({ success: true, message: 'Service request updated', request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a service request
app.delete('/api/service-requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    serviceRequests = serviceRequests.filter(r => r.id !== parseInt(id));
    res.json({ success: true, message: 'Service request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get service stats
app.get('/api/service-stats', (req, res) => {
  try {
    const stats = {
      totalRequests: serviceRequests.length,
      pendingRequests: serviceRequests.filter(r => r.status === 'pending').length,
      acceptedRequests: serviceRequests.filter(r => r.status === 'accepted').length,
      scheduledRequests: serviceRequests.filter(r => r.status === 'scheduled').length,
      rejectedRequests: serviceRequests.filter(r => r.status === 'rejected').length,
      completedRequests: serviceRequests.filter(r => r.status === 'completed').length
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Leaderboard API available at http://localhost:${PORT}/api/leaderboard`);
  console.log(`🔧 Service Requests API available at http://localhost:${PORT}/api/service-requests`);
});