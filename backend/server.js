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
// Removed static file serving since images are now stored in MongoDB

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/echallan')
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

// File Upload Configuration
const upload = multer({ storage: multer.memoryStorage() });

// Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'police', 'service_shop'], default: 'user' },
  carBrand: { type: String }, // For service shops
  isBlacklisted: { type: Boolean, default: false }, // Blacklist flag
  createdAt: { type: Date, default: Date.now }
});

const ChallanSchema = new mongoose.Schema({
  numberPlate: { type: String, required: true },
  description: { type: String, required: true },
  imageData: { type: String }, // Base64 encoded image
  videoData: { type: String }, // Base64 encoded video
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

const AccidentReportSchema = new mongoose.Schema({
  accidentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  images: [{ type: String }], // Base64 encoded images
  witnessContact: { type: String, required: true },
  description: { type: String },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  createdAt: { type: Date, default: Date.now }
});

const ServiceRequestSchema = new mongoose.Schema({
  issueType: { type: String, required: true },
  description: { type: String, required: true },
  imageData: { type: String }, // Base64 encoded image
  numberPlate: { type: String, required: true }, // Vehicle number plate
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName: { type: String, required: true },
  vehicleInfo: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'scheduled', 'completed', 'rejected'], default: 'pending' },
  assignedServiceShop: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Challan = mongoose.model('Challan', ChallanSchema);
const AccidentReport = mongoose.model('AccidentReport', AccidentReportSchema);
const ServiceRequest = mongoose.model('ServiceRequest', ServiceRequestSchema);

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, carBrand } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({ name, email, password, role, carBrand });
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Registration successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, carBrand: user.carBrand }
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
    if (user.isBlacklisted) {
      return res.status(403).json({ success: false, message: 'Your account is blacklisted' });
    }
    res.json({ 
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, carBrand: user.carBrand }
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

// Create new challan with image/video upload
app.post('/api/challans', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { numberPlate, description, location, reportedBy, reporterName, tags } = req.body;
    
    if (!req.files || (!req.files['image'] && !req.files['video'])) {
      return res.status(400).json({ success: false, message: 'Image or video is required' });
    }
    
    let imageData = null;
    let videoData = null;
    
    // Convert image to Base64
    if (req.files['image']) {
      const imageFile = req.files['image'][0];
      const imageBase64 = imageFile.buffer.toString('base64');
      imageData = `data:${imageFile.mimetype};base64,${imageBase64}`;
    }
    
    // Convert video to Base64
    if (req.files['video']) {
      const videoFile = req.files['video'][0];
      const videoBase64 = videoFile.buffer.toString('base64');
      videoData = `data:${videoFile.mimetype};base64,${videoBase64}`;
    }
    
    const challan = new Challan({
      numberPlate,
      description,
      imageData,
      videoData,
      location: location ? JSON.parse(location) : null,
      reportedBy,
      reporterName,
    });
    
    await challan.save();
    
    res.json({ success: true, challan, message: 'Challan submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update challan status with optional blacklist
app.patch('/api/challans/:id', async (req, res) => {
  try {
    const { status, blacklistUser } = req.body;
    const challan = await Challan.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }
    // Blacklist user if requested
    if (status === 'rejected' && blacklistUser) {
      if (challan.reportedBy) {
        await User.findByIdAndUpdate(challan.reportedBy, { isBlacklisted: true });
      }
    }
    res.json({ success: true, challan, message: `Challan ${status} successfully${blacklistUser ? ' and user blacklisted' : ''}` });
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
app.post('/api/service-requests', upload.single('image'), async (req, res) => {
  try {
    const { issueType, description, location, reportedBy, reporterName, vehicleInfo, numberPlate } = req.body;
    
    let imageData = null;
    if (req.file) {
      const imageBase64 = req.file.buffer.toString('base64');
      imageData = `data:${req.file.mimetype};base64,${imageBase64}`;
    }
    
    const serviceRequest = new ServiceRequest({
      issueType: issueType || 'General Maintenance',
      description,
      imageData,
      numberPlate,
      location: location ? JSON.parse(location) : null,
      reportedBy,
      reporterName,
      vehicleInfo,
      status: 'pending',
      assignedServiceShop: null,
      notes: ''
    });
    
    await serviceRequest.save();
    res.json({ success: true, message: 'Service request created', request: serviceRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get service requests for a specific user or filtered by car brand for service shops
app.get('/api/service-requests', async (req, res) => {
  try {
    const { status, carBrand } = req.query;
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (carBrand) {
      filter.issueType = carBrand;
    }
    
    const requests = await ServiceRequest.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get service requests for a specific user
app.get('/api/service-requests/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userRequests = await ServiceRequest.find({ reportedBy: userId })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests: userRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update service request status
app.patch('/api/service-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const updateData = { updatedAt: Date.now() };
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    
    const request = await ServiceRequest.findByIdAndUpdate(id, updateData, { new: true });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }
    
    res.json({ success: true, message: 'Service request updated', request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a service request
app.delete('/api/service-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ServiceRequest.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }
    res.json({ success: true, message: 'Service request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get service stats
app.get('/api/service-stats', async (req, res) => {
  try {
    const totalRequests = await ServiceRequest.countDocuments();
    const pendingRequests = await ServiceRequest.countDocuments({ status: 'pending' });
    const acceptedRequests = await ServiceRequest.countDocuments({ status: 'accepted' });
    const scheduledRequests = await ServiceRequest.countDocuments({ status: 'scheduled' });
    const rejectedRequests = await ServiceRequest.countDocuments({ status: 'rejected' });
    const completedRequests = await ServiceRequest.countDocuments({ status: 'completed' });
    
    const stats = {
      totalRequests,
      pendingRequests,
      acceptedRequests,
      scheduledRequests,
      rejectedRequests,
      completedRequests
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ACCIDENT REPORT ROUTES ====================

// Accident report upload (multiple images)
app.post('/api/accidents', upload.array('images', 5), async (req, res) => {
  try {
    const { name, witnessContact, description, location } = req.body;
    if (!name || !witnessContact || !req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Name, witness contact, and at least one image are required' });
    }
    
    // Generate unique accidentId
    const accidentId = 'ACC' + Date.now() + Math.floor(Math.random() * 1000);
    
    // Convert images to Base64
    const images = req.files.map(file => {
      const imageBase64 = file.buffer.toString('base64');
      return `data:${file.mimetype};base64,${imageBase64}`;
    });
    
    const report = new AccidentReport({
      accidentId,
      name,
      images,
      witnessContact,
      description,
      location: location ? JSON.parse(location) : null
    });
    
    await report.save();
    res.json({ success: true, report, message: 'Accident report submitted', accidentId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all accident reports
app.get('/api/accidents', async (req, res) => {
  try {
    const reports = await AccidentReport.find().sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Police: Blacklist or unblacklist a user by email
app.post('/api/users/blacklist', async (req, res) => {
  try {
    const { email, blacklist } = req.body;
    const user = await User.findOneAndUpdate(
      { email },
      { isBlacklisted: !!blacklist },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user, message: blacklist ? 'User blacklisted' : 'User unblacklisted' });
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