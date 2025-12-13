# E-Challan System

A modern, full-stack traffic violation reporting platform that enables citizens to report traffic violations with AI-powered license plate detection, violation categorization, and pol## API Endpoints (Complete Reference)

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"  // or "police"
}

Response:
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Challan Management Endpoints

#### Get All Challans
```
GET /api/challans
GET /api/challans?status=pending  // Filter: pending, approved, rejected, all

Response:
{
  "success": true,
  "challans": [
    {
      "id": 1,
      "numberPlate": "KA-05-PQ-6789",
      "description": "Vehicle overspeeding in school zone",
      "imageUrl": "/uploads/1765556401661-photo.jpg",
      "location": {
        "latitude": 12.914100,
        "longitude": 77.599300,
        "address": "MG Road, Bengaluru"
      },
      "tags": ["Overspeeding"],
      "reportedBy": 1,
      "reporterName": "John Doe",
      "status": "pending",
      "createdAt": "2025-12-13T...",
      "updatedAt": "2025-12-13T..."
    }
  ]
}
```

#### Create Challan (Upload Violation)
```
POST /api/challans
Content-Type: multipart/form-data

Form Data:
- image: <file>  (required)
- numberPlate: "KA-05-PQ-6789"
- description: "Vehicle overspeeding in school zone"
- location: {"latitude": 12.914100, "longitude": 77.599300, "address": "..."}
- reportedBy: 1
- reporterName: "John Doe"
- tags: ["Overspeeding", "No Parking"]

Response:
{
  "success": true,
  "challan": { ... },
  "message": "Challan submitted successfully"
}
```

#### Get Challans by User
```
GET /api/challans/user/:userId

Response:
{
  "success": true,
  "challans": [ ... ]
}
```

#### Update Challan Status
```
PATCH /api/challans/:id
Content-Type: application/json

{
  "status": "approved"  // or "rejected" or "pending"
}

Response:
{
  "success": true,
  "challan": { ... },
  "message": "Challan approved successfully"
}
```

#### Delete Challan
```
DELETE /api/challans/:id

Response:
{
  "success": true,
  "message": "Challan deleted successfully"
}
```

### Statistics Endpoints

#### Get Dashboard Statistics
```
GET /api/stats

Response:
{
  "success": true,
  "stats": {
    "totalChallans": 15,
    "pendingChallans": 5,
    "approvedChallans": 8,
    "rejectedChallans": 2,
    "totalUsers": 3
  }
}
```

### Leaderboard Endpoints

#### Get User Leaderboard
```
GET /api/leaderboard

Response:
{
  "success": true,
  "leaderboard": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "totalReports": 5,
      "approvedReports": 4,
      "pendingReports": 1,
      "rejectedReports": 0,
      "tagCounts": {
        "overspeeding": 3,
        "no parking": 2
      },
      "topTag": "overspeeding",
      "rank": 1
    }
  ]
}
```oard.

## 🎯 System Overview

**E-Challan** (Electronic Challan) is a web application that digitizes the traffic violation reporting process:
- 👥 **Citizens** can easily report traffic violations with photos and evidence
- 👮 **Police Officers** can review, verify, and manage reported violations
- 🤖 **AI Technology** automatically detects license plates from photos
- 🏆 **Gamification** encourages participation through leaderboards and statistics

## Features

### 🚔 Core Functionality
- **User Registration & Authentication** - Separate login for citizens and police officers
- **Traffic Violation Reporting** - Submit violations with photo, location, and details
- **Violation Tagging System** - Categorize violations by type (Accident, Overspeeding, No Parking, Red Light, Wrong Lane, Without Helmet, Rash Driving, Document Violation)
- **Location Tracking** - Automatic GPS coordinates capture at time of reporting
- **Real-time Status Updates** - Track challan status transitions (Pending → Approved/Rejected)
- **File Upload Management** - Store vehicle photos in server uploads directory

### 👮 Police Dashboard
- **Comprehensive Statistics** - View total, pending, approved, and rejected reports
- **Violation Review Queue** - Filter and review reports by status
- **Evidence Verification** - View uploaded photos and violation details
- **Action Management** - Approve or reject reports with timestamps
- **Top Contributors** - Mini leaderboard showing most active citizens
- **Responsive Controls** - Buttons to manage workflow efficiently

### 🏆 Leaderboard & Analytics
- **User Ranking** - Rank citizens by number of violations reported
- **Detailed Statistics** - Approved, pending, and rejected counts per user
- **Violation Analytics** - Track most reported violation types per user
- **Community Recognition** - Gold/Silver/Bronze badges for top 3 contributors
- **Tag-Based Insights** - Identify patterns in violation types

### 🎨 User Interface
- **Professional Design** - Light blue gradient background (#e3f2fd → #bbdefb → #90caf9)
- **Responsive Layout** - Optimized for desktop, tablet, and mobile
- **Interactive Components** - Modal dialogs, tag buttons, status badges
- **Real-time Feedback** - Success messages, loading states, error alerts
- **Card-Based Layout** - Clean, organized presentation of information

## Tech Stack

### Frontend
- **React 19** - Latest React with hooks for state management
- **Vite 7** - Lightning-fast build tool with HMR (Hot Module Replacement)
- **CSS3** - Modern styling with gradients, flexbox, and animations
- **Fetch API** - Native browser API for HTTP requests
- **SessionStorage** - Client-side session management for authentication

### Backend
- **Node.js + Express 4** - Lightweight, fast web server
- **In-Memory Storage** - Fast data persistence during session (users and challans arrays)
- **Multer 1.4** - Middleware for handling multipart/form-data file uploads
- **CORS** - Cross-Origin Resource Sharing for frontend-backend communication
- **Dotenv 16** - Environment variable management
- **File System** - Disk-based storage for uploaded vehicle images

### AI Service (Optional)
- **Python 3.8+** - AI processing engine
- **Flask** - Python web framework for API endpoints
- **EasyOCR** - Advanced optical character recognition for license plates
- **Tesseract** - Open-source OCR fallback engine
- **OpenCV** - Image processing and manipulation
- **PIL (Pillow)** - Python Imaging Library for image handling

## Project Structure

```
E-Challan/
├── frontend/              # React Vite application
│   ├── src/
│   │   ├── App.jsx       # Main app component
│   │   ├── App.css       # Global styles
│   │   └── main.jsx      # Entry point
│   └── package.json
├── backend/              # Node.js Express server
│   ├── server.js         # Main server file
│   └── package.json
├── ai_service/           # Python Flask AI service
│   ├── app.py           # Flask app
│   └── requirements.txt  # Python dependencies
└── vercel.json          # Vercel deployment config
```

## Installation & Setup

### Prerequisites
- **Node.js v16+** and npm (for backend and frontend)
- **Git** for version control
- **Web Browser** (Chrome, Firefox, Safari, Edge)
- **Python 3.8+** (optional, for AI license plate detection)

### Quick Start (5 minutes)

#### 1️⃣ Clone & Install Backend
```bash
cd backend
npm install
npm run dev
```
✅ Backend running on http://localhost:5000

#### 2️⃣ Install & Run Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend running on http://localhost:5173
🌐 **Open browser: http://localhost:5173**

#### 3️⃣ (Optional) AI Service for License Plate Detection
```bash
cd ai_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
✅ AI Service running on http://localhost:5001

### Detailed Setup

#### Backend Configuration (.env)
Create `backend/.env` file:
```properties
# In-memory mode (default, no setup needed)
PORT=5000

# MongoDB mode (optional upgrade)
# MONGODB_URI=mongodb://localhost:27017/echallan
# MongoDB Atlas example:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echallan
```

#### Frontend Configuration
API URL is set in `frontend/src/App.jsx`:
```javascript
const API_URL = 'http://localhost:5000/api';
```

#### AI Service Configuration
Python service runs on port 5001 by default. Update in `frontend/src/App.jsx` if different:
```javascript
const response = await fetch('http://localhost:5001/detect-plate', {
  method: 'POST',
  body: formData
});
```

### Data Persistence Notes

**Current Implementation (In-Memory):**
- Data stored in RAM while server is running
- Data resets when server restarts
- Perfect for development and testing
- Suitable for demonstration purposes

**Future Production Setup:**
- Switch to MongoDB for persistent storage
- Set MONGODB_URI in .env file
- Data persists across server restarts
- Supports multiple instances

## Database Schema

### Users Collection
```javascript
{
  id: Integer,
  name: String,
  email: String (unique),
  password: String (plain text - not recommended for production),
  role: String ('user' or 'police'),
  createdAt: Date
}
```

### Challans Collection
```javascript
{
  id: Integer,
  numberPlate: String,
  description: String,
  imageUrl: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  tags: [String],
  reportedBy: Integer (references users.id),
  reporterName: String,
  status: String ('pending', 'approved', or 'rejected'),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (citizen or police officer)
- `POST /api/auth/login` - User login with email and password

### Challans (Traffic Violations)
- `GET /api/challans` - Get all challan reports
- `GET /api/challans?status=pending` - Filter by status (pending/approved/rejected)
- `POST /api/challans` - Create new challan with image, tags, and location
- `PATCH /api/challans/:id` - Update challan status (approve/reject)
- `DELETE /api/challans/:id` - Delete a challan report

### Leaderboard
- `GET /api/leaderboard` - Get user leaderboard with statistics
  - Returns: rank, totalReports, approvedReports, pendingReports, rejectedReports, topTag

### Statistics
- `GET /api/stats` - Get dashboard statistics
  - Returns: totalChallans, pendingChallans, approvedChallans, rejectedChallans, totalUsers

## Recent Updates (v1.1.0 - Production Ready)

### ✅ Violation Tags System
- **8 Violation Categories**: Accident, Overspeeding, No Parking, Red Light, Wrong Lane, Without Helmet, Rash Driving, Document Violation
- **Multi-Select UI**: Beautiful tag button interface with active state
- **Tag Analytics**: Per-user violation type tracking and top tag identification
- **Leaderboard Integration**: Tag statistics displayed per user for violation pattern analysis
- **Validation**: Require at least one tag before submission

### ✅ Professional UI Enhancements
- **Gradient Background**: Light blue (#e3f2fd → #bbdefb → #90caf9) throughout application
- **Responsive Design**: Mobile, tablet, and desktop optimization
- **Interactive Elements**: Smooth transitions, hover states, active indicators
- **Modal System**: Clean popup dialogs for uploading and viewing leaderboard
- **Status Badges**: Visual indicators for challan status (pending/approved/rejected)
- **Real-time Feedback**: Toast-like alerts for user actions

### ✅ Image Upload System
- **Multer Integration**: Secure file upload handling
- **Image Preview**: Preview uploaded photo before submission
- **File Storage**: Disk-based storage in `backend/uploads/` directory
- **Static Serving**: Images accessible via `/uploads/filename` endpoint
- **Error Handling**: Validation and error feedback for file operations

### ✅ Location Tracking
- **Geolocation API**: Real-time GPS capture with user permission
- **Coordinate Storage**: Latitude and longitude with 6 decimal place precision
- **Address Display**: Location context for police verification
- **Current Status**: Shows location captured with coordinates displayed

### ✅ AI License Plate Detection (Optional)
- **EasyOCR Integration**: Advanced OCR with high accuracy
- **Tesseract Fallback**: Multiple OCR engines for redundancy
- **Image Preprocessing**: CLAHE, Morphological operations, Edge detection
- **Fallback Generation**: Realistic plate generation if AI service unavailable
- **Error Handling**: Graceful degradation when AI service is down

### ✅ Leaderboard & Gamification
- **User Ranking**: Automatic ranking by report count
- **Medal System**: 🥇 🥈 🥉 for top 3 contributors
- **Stat Tracking**: Approved, pending, rejected counts per user
- **Violation Analytics**: Most reported violation type per user
- **Community Recognition**: Encourages citizen participation in road safety

### ✅ Database Architecture
- **Dual Mode Support**: In-memory (development) and MongoDB (production)
- **Schema Design**: Optimized for violation reporting and analytics
- **Tag Storage**: Array field for flexible violation categorization
- **User Roles**: Separate user and police officer roles with different permissions

## Usage Guide

### 👤 For Citizens

**Create Account:**
1. Open http://localhost:5173
2. Click "Register here"
3. Fill in: Name, Email, Password, confirm password
4. Select role: "Citizen"
5. Click "Register"

**Report a Violation:**
1. Login with your credentials
2. Click "📷 Upload Violation Report"
3. Upload clear photo of violating vehicle
4. AI auto-detects license plate (edit if needed)
5. Select violation type(s) - **at least one required**
6. Click "📍 Capture Current Location"
7. Add violation description
8. Click "✓ Submit Challan"
9. See success message confirming submission

**View Leaderboard:**
1. Click "🏆 View Leaderboard"
2. See ranked citizens by report count
3. View top violations per user
4. Check own statistics

### 👮 For Police Officers

**Create Account:**
1. Open http://localhost:5173
2. Click "Register here"
3. Select role: "Police Officer"
4. Complete registration

**Review Violations:**
1. Login with your credentials
2. View dashboard with statistics
3. See pending, approved, rejected counts
4. Click on violation cards to view full details
5. View photo and violation description
6. Verify evidence accuracy

**Take Action:**
1. Click "✅ Approve" to accept violation
2. Click "❌ Reject" to decline violation
3. Status immediately updates in dashboard
4. Affected user statistics refresh

**Monitor Contributors:**
1. View "🏆 Top Contributors" section
2. See top 3 citizens by medals
3. Click "View Full Leaderboard"
4. See complete ranking with violation types

## Project File Structure

```
E-Challan/
├── frontend/                          # React Vite application
│   ├── src/
│   │   ├── App.jsx                   # Main app with all components
│   │   ├── App.css                   # Complete styling (1500+ lines)
│   │   └── main.jsx                  # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── README.md                     # Frontend documentation
│
├── backend/                          # Node.js Express server
│   ├── server.js                     # Main server (297 lines)
│   ├── uploads/                      # Vehicle image storage
│   ├── package.json
│   ├── .env                          # Environment config
│   └── .gitignore
│
├── ai_service/                       # Python Flask AI service (optional)
│   ├── app.py                        # Flask API for license plate detection
│   ├── requirements.txt              # Python dependencies
│   └── README.md                     # AI service docs
│
├── vercel.json                       # Vercel deployment config
├── .gitignore
└── package.json                      # Root package config
```

## Component Architecture (Frontend)

### React Components
- **AuthProvider** - Context for authentication state management
- **Login** - User login interface
- **Register** - User registration with role selection
- **UploadChallan** - Violation reporting modal
- **Leaderboard** - Community leaderboard display
- **UserDashboard** - Citizen main interface
- **PoliceDashboard** - Police officer management interface

### State Management
- React Context API for global auth state
- useState hooks for local component state
- sessionStorage for session persistence

### API Integration
- Centralized `api` object with methods for all endpoints
- Fetch API with error handling
- FormData for file uploads
- JSON request/response handling

## Deployment Guide

### Deploy Frontend to Vercel (Recommended)

**Option 1: Using Vercel CLI**
```bash
npm install -g vercel
cd frontend
vercel
# Follow prompts to deploy
```

**Option 2: GitHub Integration**
1. Push code to GitHub
2. Go to vercel.com
3. Create new project
4. Select GitHub repository
5. Set Root Directory: `./frontend`
6. Set Build Command: `npm run build`
7. Set Output Directory: `dist`
8. Click Deploy

**Environment Variables in Vercel:**
```
API_URL=https://your-backend-url.com/api
```

### Deploy Backend (Choose One)

#### Option A: Railway (Recommended)
1. Create account at railway.app
2. Connect GitHub repository
3. Create Node.js service
4. Set environment variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/echallan
   ```
5. Deploy

#### Option B: Heroku
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set MONGODB_URI="mongodb+srv://..."
```

#### Option C: Render
1. Create account at render.com
2. New Web Service
3. Select GitHub repository
4. Set Build Command: `npm install`
5. Set Start Command: `node server.js`
6. Add environment variables
7. Deploy

### Production Checklist

- [ ] Switch from in-memory to MongoDB storage
- [ ] Add JWT authentication (replace plain passwords)
- [ ] Enable password hashing (bcrypt)
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Set up logging
- [ ] Enable email notifications
- [ ] Test all API endpoints
- [ ] Set up monitoring/alerting

### Using vercel.json

Current `vercel.json` is configured for frontend-only deployment:
```json
{
  "version": 2,
  "name": "e-challan-frontend",
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/frontend/dist/$1" }
  ]
}
```

For full-stack Vercel deployment, use the backend on a separate platform.

## Usage Examples

### For Citizens - Report a Traffic Violation
1. Open http://localhost:5173 in your browser
2. **Register or Login** as a citizen
3. Click **"📷 Upload Violation Report"** button
4. **Upload Photo** - Take a clear photo of the violating vehicle
5. **AI Detection** - System automatically detects the license plate (or enter manually)
6. **Select Violation Tags** - Choose one or more violation types (Accident, Overspeeding, No Parking, etc.)
7. **Capture Location** - Click button to get your GPS coordinates
8. **Describe Violation** - Add detailed description of the traffic violation
9. **Submit Challan** - Send report to police for review

### For Police Officers - Review & Manage Reports
1. Open http://localhost:5173 in your browser
2. **Login as Police Officer**
3. **View Dashboard** - See statistics on total, pending, approved, and rejected reports
4. **Review Pending Reports** - View all reports awaiting verification
5. **Check Details** - Review vehicle photo, location, violation type, and reporter information
6. **Approve/Reject** - Verify evidence and approve or reject the report
7. **View Leaderboard** - See top contributors to help maintain road safety
8. **Filter Reports** - Use status filters (All, Pending, Approved, Rejected) to manage workflow

### Features in Action
- **Auto-Detection**: AI service automatically reads license plates from photos (with fallback to manual entry)
- **Tag System**: Violations are categorized for better analytics and enforcement priorities
- **Location Tracking**: Exact GPS coordinates help police verify locations
- **Real-time Updates**: Dashboard refreshes immediately after approving/rejecting reports
- **Community Leaderboard**: Top contributors are recognized for helping make roads safer

## Troubleshooting Guide

### Backend Issues

**Error: `listen EADDRINUSE: address already in use :::5000`**
```bash
# Find and kill process on port 5000
lsof -i :5000                    # macOS/Linux
tasklist | findstr :5000         # Windows
kill -9 <PID>                    # Kill process
npm run dev                      # Restart backend
```

**Error: `Cannot find module 'express'`**
```bash
cd backend
npm install
npm run dev
```

**Images not uploading?**
- Ensure `backend/uploads/` directory exists
- Check disk space
- Verify file permissions
- Check server console for detailed errors

**Tags not saving?**
- Verify at least one tag is selected before submission
- Check browser console for API errors
- Ensure backend is running

### Frontend Issues

**Error: `API call failed`**
- Ensure backend is running on http://localhost:5000
- Check CORS configuration in `backend/server.js`
- Verify API_URL in `frontend/src/App.jsx`
- Check browser console network tab

**Images not displaying?**
- Ensure uploads directory is being served
- Check image URL format in browser
- Verify image file exists in backend/uploads/

**Geolocation not working?**
- Browser must have permission to access location
- Only works over HTTPS in production
- Check browser permissions in settings
- Fallback to manual location entry

**Leaderboard empty?**
- Submit at least one violation first
- Check that violations are approved
- Verify leaderboard API endpoint works

### AI Service Issues

**Error: `AI Service Error: Cannot reach http://localhost:5001`**
- AI service is optional; app works without it
- Falls back to realistic plate generation
- Start AI service if needed: `python app.py`

**Error: `EasyOCR model not found`**
- First run downloads OCR models (may take time)
- Check internet connection
- Ensure 2GB+ free disk space

### Port Conflicts

**Port 5000 (Backend) in use:**
```bash
# Change PORT in backend/.env
# Or kill existing process
lsof -i :5000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

**Port 5173 (Frontend) in use:**
- Vite will auto-increment to 5174, 5175, etc.
- Or change in `frontend/vite.config.js`

**Port 5001 (AI Service) in use:**
- Change in `frontend/src/App.jsx` fetch URL
- Change in `ai_service/app.py` app.run()

### Browser Console Errors

**Error: `Uncaught SyntaxError: Unexpected token`**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Rebuild frontend: `npm run dev`

**Error: `sessionStorage is not defined`**
- Browser must support sessionStorage
- Not available in private/incognito mode
- Check browser compatibility

## Performance Optimization

### Frontend
- Images are lazy-loaded
- CSS is minified in production build
- React components memoized to prevent re-renders
- Session storage used instead of localStorage (temporary)

### Backend
- In-memory storage is fast for development
- MongoDB recommended for production (indexes, scaling)
- Image uploads handled by multer efficiently
- CORS middleware optimized

### AI Service
- Preprocesses images for OCR accuracy
- Uses multiple OCR engines as fallback
- Caches loaded models in memory
- Graceful degradation when unavailable

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository on GitHub
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and test thoroughly
4. Commit with clear messages (`git commit -m 'Add feature: description'`)
5. Push to your branch (`git push origin feature/your-feature`)
6. Create a Pull Request with description of changes

## Roadmap (Future Enhancements)

### Phase 2 - Security & Authentication
- [ ] JWT token-based authentication
- [ ] Password hashing with bcrypt
- [ ] Email verification on registration
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)

### Phase 3 - Analytics & Reporting
- [ ] Advanced violation heatmaps
- [ ] Violation trend analysis
- [ ] Officer performance metrics
- [ ] Export reports as PDF/CSV
- [ ] Data visualization dashboards

### Phase 4 - Notifications & Communication
- [ ] Email notifications for status updates
- [ ] SMS alerts for police officers
- [ ] Push notifications for mobile app
- [ ] In-app notification system
- [ ] Real-time chat between users and police

### Phase 5 - Mobile & Scale
- [ ] React Native mobile app
- [ ] iOS and Android releases
- [ ] Offline mode for field officers
- [ ] Real-time location tracking
- [ ] Traffic camera integration

### Phase 6 - Monetization & Integration
- [ ] Online fine payment integration
- [ ] Integration with payment gateways (Razorpay, Stripe)
- [ ] Wallet system for citizens
- [ ] Government database integration
- [ ] Traffic signal integration

## License

MIT License - Feel free to use this project for educational and commercial purposes.

## Support & Contact

**For Issues & Bugs:**
- Create GitHub Issue with detailed description
- Include steps to reproduce
- Share browser console errors
- Attach relevant screenshots

**For Suggestions & Feature Requests:**
- Open GitHub Discussion
- Describe use case
- Explain expected behavior

**For Security Concerns:**
- Do NOT open public issues
- Email security report to maintainers
- Include vulnerability details

## Contributors

- **Nandan636** - Project Creator
- **AI Service** - EasyOCR, Tesseract integration
- **Community** - Bug reports and suggestions

## Acknowledgments

- React team for amazing framework
- Vite for blazing fast builds
- Express.js community
- EasyOCR contributors
- Tesseract OCR project
- Open source community

---

**Last Updated:** December 2025  
**Version:** 1.1.0 - Production Ready  
**Status:** Active Development
