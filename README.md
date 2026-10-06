# 🏥 NLP-Based Electronic Health Record (EHR) System

A comprehensive EHR system that uses Natural Language Processing to automatically extract medical entities from clinical notes using ClinicalBERT and medSpaCy.

## 🚀 Features

- **Clinical Note Processing**: Upload and process clinical notes using advanced NLP
- **Entity Extraction**: Automatically extract diseases, symptoms, medications, lab results, procedures, and more
- **Negation Detection**: Identify negated conditions (e.g., "no chest pain")
- **Section Detection**: Parse clinical note sections (History, Plan, Medications, etc.)
- **AI-Generated Summaries**: Generate concise summaries of clinical notes
- **Secure Authentication**: JWT-based authentication system
- **Modern UI**: Clean, professional medical-style interface

## 🛠️ Tech Stack

### Backend
- **Python 3** with FastAPI
- **Hugging Face Transformers** (Bio_ClinicalBERT)
- **medSpaCy + spaCy** for medical NLP
- **MongoDB** with PyMongo
- **JWT Authentication** with bcrypt
- **Uvicorn** server

### Frontend
- **React** with modern hooks
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Router** for navigation

## 📁 Project Structure

```
ehr-nlp-system/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── nlp_pipeline.py         # NLP processing pipeline
│   ├── database.py            # MongoDB connection and setup
│   ├── auth.py                # Authentication utilities
│   ├── routes/
│   │   ├── users.py           # User management routes
│   │   └── notes.py           # Note processing routes
│   ├── models/
│   │   ├── user_model.py      # User data models
│   │   └── note_model.py      # Note and entity models
│   ├── utils/
│   │   ├── jwt_handler.py     # JWT token management
│   │   └── hash_password.py   # Password hashing utilities
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/             # React page components
│   │   ├── components/        # Reusable React components
│   │   ├── services/          # API service layer
│   │   ├── App.jsx           # Main App component
│   │   └── index.js          # React entry point
│   ├── package.json          # Node.js dependencies
│   └── tailwind.config.js    # Tailwind CSS configuration
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or cloud)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string and JWT secret
   ```

5. **Start the server:**
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

### Database Setup

1. **Start MongoDB** (if running locally)
2. **The application will automatically create collections** on first run

## 🔧 Configuration

### Environment Variables (.env)

```env
MONGODB_URL=mongodb://localhost:27017/ehr_nlp_system
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login

### Notes
- `POST /api/note/upload` - Upload clinical note for processing
- `GET /api/notes` - Get all user's processed notes
- `GET /api/note/{id}` - Get detailed note with extracted entities

## 🧠 NLP Pipeline

The system uses a sophisticated NLP pipeline combining:

1. **ClinicalBERT**: For medical entity recognition
2. **medSpaCy**: For section detection and negation analysis
3. **Custom Processing**: For structured data extraction

### Extracted Entities
- **Diseases/Conditions**: Medical diagnoses and conditions
- **Symptoms**: Patient-reported symptoms
- **Medications**: Drug names with dosages
- **Lab Results**: Test names and values
- **Procedures**: Medical procedures with dates
- **Negations**: Identified negated conditions
- **Sections**: Clinical note sections (History, Plan, etc.)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configured for frontend-backend communication
- **Input Validation**: Comprehensive data validation

## 🎨 Frontend Features

- **Responsive Design**: Works on desktop and mobile
- **Real-time Processing**: Live NLP processing feedback
- **Entity Visualization**: Color-coded entity highlighting
- **Summary Generation**: AI-powered note summaries
- **Patient Dashboard**: Clean, medical-style interface

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📈 Performance Considerations

- **Model Caching**: ClinicalBERT model is cached for faster processing
- **Async Processing**: Non-blocking API endpoints
- **Database Indexing**: Optimized MongoDB queries
- **Frontend Optimization**: React optimization techniques

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- **Multi-language Support**: Support for multiple languages
- **Advanced Analytics**: Clinical analytics and insights
- **Integration APIs**: Connect with existing EHR systems
- **Mobile App**: Native mobile application
- **Real-time Collaboration**: Multi-user note editing

---

**Built with ❤️ for healthcare professionals**
