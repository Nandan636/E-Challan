# E-Challan System 🚔

A comprehensive digital traffic violation reporting system that enables citizens to report traffic violations and allows police officers to manage and process these reports efficiently.

## Features

### For Citizens 👤
- **Easy Violation Reporting**: Upload photos of traffic violations with automatic license plate detection
- **AI-Powered OCR**: Advanced license plate recognition using EasyOCR and Tesseract
- **Location Tracking**: Automatic GPS location capture for accurate violation reporting
- **Violation Categories**: Pre-defined tags for different types of violations (Overspeeding, No Parking, Red Light, etc.)
- **Real-time Status**: Track the status of submitted reports
- **Leaderboard**: Community ranking system to encourage active participation

### For Police Officers 👮
- **Centralized Dashboard**: Manage all reported violations in one place
- **Quick Actions**: Approve or reject violation reports with detailed review
- **Statistics Overview**: Real-time analytics on reports, approvals, and rejections
- **Evidence Review**: View uploaded photos and violation details
- **Contributor Tracking**: Monitor top reporting citizens

## Technology Stack

### Frontend
- **React 19** with Vite for fast development
- **Modern CSS** with responsive design
- **Context API** for state management
- **Fetch API** for backend communication

### Backend
- **Node.js** with Express.js
- **File Upload** handling with Multer
- **CORS** enabled for cross-origin requests

### AI Service
- **Python Flask** API for license plate detection
- **EasyOCR** for accurate text recognition
- **OpenCV** for image preprocessing
- **Tesseract OCR** as fallback option

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd E-Challan
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Install AI Service Dependencies**
   ```bash
   cd ../ai_service
   pip install flask flask-cors easyocr opencv-python pillow pytesseract numpy
   ```

### Running the Application

1. **Start the AI Service** (Port 5001)
   ```bash
   cd ai_service
   python app.py
   ```

2. **Start the Backend Server** (Port 5000)
   ```bash
   cd backend
   npm start
   ```

3. **Start the Frontend** (Port 5173)
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the Application**
   - Open http://localhost:5173 in your browser
   - Register as a Citizen or Police Officer
   - Start reporting or managing violations!

## Usage

### For Citizens
1. Register/Login to the system
2. Click "Upload Violation Report"
3. Take a clear photo of the violating vehicle
4. AI will automatically detect the license plate
5. Select violation type and add description
6. Capture your current location
7. Submit the report

### For Police Officers
1. Login with police credentials
2. View all reported violations on the dashboard
3. Review evidence and details
4. Approve or reject reports
5. Monitor statistics and leaderboard

## Project Structure

```
E-Challan/
├── frontend/          # React frontend application
├── backend/           # Node.js Express API server
├── ai_service/        # Python Flask AI service
└── uploads/          # Uploaded violation images
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.