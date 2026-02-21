# AI Fantasy Analytics

AI-powered Fantasy Premier League analytics platform featuring:
- Player performance prediction
- Fixture difficulty modeling
- Data-driven team optimization
- Dashboard analytics

This is a demonstration version created for technical interviews.

## Features

- **Real-time FPL Data**: Fetches live player statistics, fixtures, and team information
- **ML-Powered Predictions**: Uses XGBoost machine learning model to predict player performance
- **Team Builder**: Automatically creates optimized 15-player squads within budget constraints
- **Fixture Analysis**: Analyzes upcoming fixtures to identify favorable matchups
- **Player Analysis**: Advanced player statistics and performance metrics
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS using shadcn/ui components
- **User Authentication**: Secure user registration and login system
- **Dashboard**: Personalized dashboard with team management features

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query for server state
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation

### Backend
- **Python API**: Flask with CORS support
- **Node.js API**: Express.js with TypeScript
- **Machine Learning**: scikit-learn, XGBoost
- **Data Processing**: pandas, numpy
- **Authentication**: JWT-based authentication

### Data Sources
- Official Fantasy Premier League API
- Real-time player statistics
- Fixture data and team information

## Installation

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8+
- Git

### Clone Repository
```bash
git clone <repository-url>
cd "FPL predictor"
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Backend Setup

#### Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Node.js Dependencies
```bash
cd backend/server
npm install
```

## Running the Application

### Development Mode

1. **Start the Python ML API** (Terminal 1):
```bash
cd backend
python app.py
```
The Python API will run on `http://localhost:5000`

2. **Start the Node.js API** (Terminal 2):
```bash
cd backend/server
npm run dev
```
The Node.js API will run on `http://localhost:3007`

3. **Start the Frontend** (Terminal 3):
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:8081`

### Production Build

#### Frontend
```bash
cd frontend
npm run build
```

#### Backend
Compile TypeScript:
```bash
cd backend/server
npm run build
```

## Project Structure

```
FPL predictor/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── fpl/         # FPL-specific components
│   │   │   ├── layout/      # Layout components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility libraries
│   │   ├── pages/           # Page components
│   │   └── main.tsx         # App entry point
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # Backend services
│   ├── server/              # Node.js/TypeScript API
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Express middleware  
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── index.ts         # Express app entry point
│   ├── ai/                  # AI/ML logic (organized)
│   │   ├── models/          # ML model files and algorithms
│   │   │   ├── fpl_ml_model.py      # Main XGBoost model
│   │   │   ├── fpl_xgboost_model.pkl # Trained model file
│   │   │   └── FPL_Predictor.ipynb  # Jupyter notebook for experimentation
│   │   ├── analyzers/       # Data analysis and fetching logic
│   │   │   ├── fpl_analyzer.py      # Main FPL data analyzer
│   │   │   └── data_fetcher.py      # API data fetching with caching
│   │   └── predictors/      # Prediction algorithms and optimization
│   │       ├── base_predictor.py    # Base class for all predictors
│   │       └── team_optimizer.py    # Team selection optimization
│   ├── api/                 # API endpoints (organized)
│   │   └── flask_app.py     # Flask API routes and handlers
│   ├── app.py              # Main Flask application entry point
│   └── requirements.txt    # Python dependencies
└── README.md               # This file
```

## API Endpoints

### Python Flask API (Port 5000)
- `GET /api/health` - Health check
- `GET /api/fixtures/analyze` - Analyze fixture difficulties
- `GET /api/players/analyze` - Player analysis with filters
- `GET /api/ml/players` - Get all players with ML predictions
- `GET /api/ml/best-team` - Create optimized team
- `GET /api/ml/team-suggestions` - Get multiple team strategies
- `GET /api/teams` - Get all Premier League teams
- `GET /api/positions` - Get all player positions
- `POST /api/refresh` - Refresh FPL data

### Node.js Express API (Port 3007)
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/players` - Get player data
- `GET /api/fpl/*` - FPL-related endpoints
- `GET /api/team/*` - Team management endpoints

## Features Overview

### Machine Learning Model
- **Algorithm**: XGBoost Regressor
- **Features**: Player statistics, fixture difficulty, form, team performance
- **Predictions**: Expected points for upcoming gameweeks
- **Training**: Automatically updates with latest FPL data

### Team Optimization
- **Budget Constraints**: Respects FPL budget limits (£100m default)
- **Formation Rules**: Ensures valid team formation (GK, DEF, MID, FWD)
- **Fixture Weighting**: Considers upcoming fixture difficulty
- **Multiple Strategies**: Generates different team approaches

### User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Theme switching support
- **Interactive Pitch**: Visual team selection interface
- **Real-time Updates**: Live data synchronization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is for educational and personal use only. Please respect the Fantasy Premier League Terms of Service when using their API.

## Acknowledgments

- Fantasy Premier League for providing the official API
- The open-source community for the amazing libraries and frameworks used
- Contributors and testers who helped improve the application

---

**Note**: This application is not affiliated with the Premier League or the official Fantasy Premier League game.
