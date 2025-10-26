# 🧠 AI Debate Judge

A real-time web app where users can **create or join debate rooms**, **argue live**, and get **AI-based judgment** with scores, summaries, and reasoning.

---

## ⚙️ Tech Stack

- **MongoDB** – stores users, debate data, and AI results  
- **Express.js** – backend API and business logic  
- **React.js (Vite)** – frontend user interface  
- **Node.js** – server runtime  
- **Socket.IO** – real-time debate messages and updates  
- **JWT + Cookie-parser** – secure authentication and sessions  
- **Axios** – handles frontend API calls  
- **TailwindCSS** – fast and responsive styling  
- **External AI API** – analyzes debates and returns winner & reasoning  

---

## 🔁 Workflow

1. User logs in (JWT auth)  
2. Creates or joins a debate room  
3. Participants exchange live arguments via Socket.IO  
4. On debate end, backend sends arguments to AI API  
5. AI returns winner, scores, and reasoning  
6. Results are stored in MongoDB and shown to all users  
7. Users can view past debate history anytime  

---

### 💻 Run Project Locally

1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/ai-debate-judge.git
cd ai-debate-judge
```

2️⃣ Backend Setup

```bash
cd backend
npm install
npm run dev
```

Runs on http://localhost:5000

If nodemon not installed:
```bash
npm install -g nodemon
```

3️⃣ Frontend Setup
Open a new terminal:

```bash
cd frontend
npm install
```

Start frontend:
```bash
npm run dev
```
Runs on http://localhost:5173


## ⚡ Common Commands
| Task | Directory | Command |
|------|-----------|---------|
| Install all dependencies | backend / frontend | `npm install` |
| Run backend | backend | `npm run dev` |
| Run frontend | frontend | `npm run dev` |
| Build frontend for deployment | frontend | `npm run build` |
| Start backend in production | backend | `npm start` |

### ✅ Done!
You now have:
Backend → http://localhost:5000
Frontend → http://localhost:5173
Fully working AI Debate Judge system 🎤