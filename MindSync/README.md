# MindSync - Mental Health Companion App

MindSync is a comprehensive mental health companion application designed to support emotional wellbeing through journaling, AI-powered conversations, emergency alerts, and health tracking. Built with privacy-first principles and installable on both web and mobile.

## Features

### 🏠 Dashboard
- Health vitals tracking (Steps, Heart Rate, Sleep, Blood Pressure, Energy, Stress, Temperature)
- Manual vital entry and automatic wearable device sync
- Interactive graphs for each vital sign
- Mental wellness analysis based on vital signs

### 📝 Journal
- Daily journal entries with mood tracking
- Journal history with search and filter
- Privacy-focused local storage option

### 🌿 Wellness
- Personalized wellness tips based on vital signs analysis
- Checkable/completable wellness recommendations
- Google Fit integration for automatic health data sync

### 🎵 Playlist
- Curated playlists based on mental health status
- Multiple categories (Stress Relief, Focus, Energy, Sleep, Anxiety, Happy, Motivation)
- Spotify integration

### 💬 Chatbot
- AI-powered mental health conversations
- Sentiment analysis for personalized responses
- Voice input support

### 🚨 Emergency
- Manual and automatic SOS activation
- Emergency contact management
- Critical mental health score detection and alerts

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Chart.js for data visualization
- Responsive design

### Backend
- Node.js with Express
- MongoDB with Mongoose
- OpenAI API integration
- Google Fit API integration
- RESTful API architecture

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- OpenAI API Key (optional, for chatbot)
- Google OAuth credentials (optional, for Google Fit)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd MindSync
```

2. Install dependencies:
```bash
# Root dependencies
npm install

# Backend dependencies
cd Backend
npm install
```

3. Set up environment variables:
Create `Backend/.env` file:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5000
```

4. Start the server:
```bash
cd Backend
npm start
```

5. Open your browser:
Navigate to `http://localhost:5000`

## Deployment

### Render

1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Create a new Web Service
4. Configure environment variables in Render dashboard
5. Deploy!

The `render.yaml` file is included for easy deployment configuration.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `MONGO_URI` | MongoDB connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for chatbot | No |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `BASE_URL` | Base URL for OAuth callbacks | Yes (for Google Fit) |
| `FRONTEND_URL` | Frontend URL | Yes (for redirects) |

## Project Structure

```
MindSync/
├── Backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── public/
│   ├── assets/
│   ├── chart.js
│   ├── script.js
│   ├── styles.css
│   └── *.html
├── .gitignore
├── render.yaml
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email support@mindsync.com or open an issue in the repository.

## Acknowledgments

- OpenAI for GPT API
- Google for Fit API
- Chart.js for data visualization
- Spotify for music integration

