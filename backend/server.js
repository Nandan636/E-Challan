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
mongoose.connect(process.env.MONGODB_URI)
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

const ChallanSchema = new mongoose.Schema({
  numberPlate: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
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
    
    // Create new user (In production, hash password with bcrypt)
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

// Get challans by user
app.get('/api/challans/user/:userId', async (req, res) => {
  try {
    const challans = await Challan.find({ reportedBy: req.params.userId })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, challans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new challan with image upload
app.post('/api/challans', upload.single('image'), async (req, res) => {
  try {
    const { numberPlate, description, location, reportedBy, reporterName } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }
    
    const challan = new Challan({
      numberPlate,
      description,
      imageUrl: `/uploads/${req.file.filename}`,
      location: JSON.parse(location),
      reportedBy,
      reporterName,
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

// Delete challan
app.delete('/api/challans/:id', async (req, res) => {
  try {
    const challan = await Challan.findByIdAndDelete(req.params.id);
    
    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }
    
    res.json({ success: true, message: 'Challan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== STATS ROUTES ====================

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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});