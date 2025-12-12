const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// In-memory storage (replaces MongoDB)
let users = [];
let challans = [];
let userIdCounter = 1;
let challanIdCounter = 1;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

console.log('✅ In-memory database initialized');

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

// Helper functions for in-memory storage
const findUserByEmail = (email) => users.find(user => user.email === email);
const findUserById = (id) => users.find(user => user.id === id);
const findChallanById = (id) => challans.find(challan => challan.id === id);

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const user = {
      id: userIdCounter++,
      name,
      email,
      password,
      role: role || 'user',
      createdAt: new Date()
    };
    users.push(user);
    
    res.json({ 
      success: true, 
      message: 'Registration successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    res.json({ 
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CHALLAN ROUTES ====================

// Get all challans
app.get('/api/challans', (req, res) => {
  try {
    const { status } = req.query;
    let filteredChallans = challans;
    
    if (status && status !== 'all') {
      filteredChallans = challans.filter(challan => challan.status === status);
    }
    
    // Sort by creation date (newest first)
    filteredChallans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, challans: filteredChallans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get challans by user
app.get('/api/challans/user/:userId', (req, res) => {
  try {
    const userChallans = challans.filter(challan => challan.reportedBy == req.params.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, challans: userChallans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new challan with image upload
app.post('/api/challans', upload.single('image'), async (req, res) => {
  try {
    const { numberPlate, description, location, reportedBy, reporterName } = req.body;

    let tags = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
        if (!Array.isArray(tags)) tags = [];
      } catch (e) {
        // if tags was sent as comma separated values
        tags = String(req.body.tags).split(',').map(t => t.trim()).filter(Boolean);
      }
    }

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
      tags
    });

    await challan.save();

    res.json({ success: true, challan, message: 'Challan submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update challan status
app.patch('/api/challans/:id', (req, res) => {
  try {
    const { status } = req.body;
    const challanId = parseInt(req.params.id);
    
    const challan = findChallanById(challanId);
    
    if (!challan) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }
    
    challan.status = status;
    challan.updatedAt = new Date();
    
    res.json({ success: true, challan, message: `Challan ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete challan
app.delete('/api/challans/:id', (req, res) => {
  try {
    const challanId = parseInt(req.params.id);
    const challanIndex = challans.findIndex(challan => challan.id === challanId);
    
    if (challanIndex === -1) {
      return res.status(404).json({ success: false, message: 'Challan not found' });
    }
    
    challans.splice(challanIndex, 1);
    
    res.json({ success: true, message: 'Challan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== STATS ROUTES ====================

app.get('/api/stats', (req, res) => {
  try {
    const totalChallans = challans.length;
    const pendingChallans = challans.filter(c => c.status === 'pending').length;
    const approvedChallans = challans.filter(c => c.status === 'approved').length;
    const rejectedChallans = challans.filter(c => c.status === 'rejected').length;
    const totalUsers = users.filter(u => u.role === 'user').length;
    
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

// ==================== LEADERBOARD ROUTES ====================

// Get leaderboard - users ranked by number of violations reported
app.get('/api/leaderboard', (req, res) => {
  try {
    // Count violations reported by each user
    const userStats = {};

    // Initialize all users with 0 reports
    users.forEach(user => {
      if (user.role === 'user') {
        userStats[user.id] = {
          id: user.id,
          name: user.name,
          email: user.email,
          totalReports: 0,
          approvedReports: 0,
          pendingReports: 0,
          rejectedReports: 0,
          tagCounts: {}
        };
      }
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

        // Count tags
        if (Array.isArray(challan.tags)) {
          challan.tags.forEach(tag => {
            const t = String(tag).toLowerCase();
            userStats[challan.reportedBy].tagCounts[t] = (userStats[challan.reportedBy].tagCounts[t] || 0) + 1;
          });
        }
      }
    });

    // Convert to array and sort by total reports (descending)
    const leaderboard = Object.values(userStats)
      .sort((a, b) => b.totalReports - a.totalReports)
      .map((user, index) => {
        // derive topTag for display
        let topTag = null;
        const entries = Object.entries(user.tagCounts || {});
        if (entries.length > 0) {
          entries.sort((a, b) => b[1] - a[1]);
          topTag = entries[0][0];
        }
        return {
          ...user,
          rank: index + 1,
          topTag
        };
      });

    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Leaderboard API available at http://localhost:${PORT}/api/leaderboard`);
});