# 🗣️ Debate Project – Main Overview

This project is a real-time AI-powered debate platform built collaboratively by our team.  
It combines advanced **AI argument analysis** with a robust **web and backend architecture**, enabling users to debate interactively while receiving intelligent feedback.

---

## **1️⃣ AI Workflow (Reshmitha’s Work)**

- **Objective:** Evaluate and explain the quality of debate arguments using transformer models.
- **Models Used:**
  - 🧠 **DistilBERT (fine-tuned)** – for argument scoring  
    - Trained on combined **Webis** and **IBM Debater** datasets  
  - ✍️ **T5 Small** – for generating natural language justifications
- **Output:** Each argument receives a **score** and a **justification** explaining the reasoning.
- **Tech Stack:**
  - **FastAPI** for serving AI models  
  - **Docker** for containerization  
  - **NVIDIA T4 GPU** for inference acceleration  
- **Data Flow:**  
  Input → JSON with debate ID, topic, and arguments  
  Output → JSON with scores + justifications  
- **Local Testing:** [http://localhost:8000](http://localhost:8000)

---

## **2️⃣ Tech Team – Backend & Frontend (Collaborative Work)**

- **Backend Framework:** **Node.js + Express.js**
  - Manages debate creation, argument storage, and API routing  
  - Communicates with AI endpoints for scoring and justification  
  - Uses **MongoDB** for efficient and scalable data storage

- **Frontend Framework:** **React.js**
  - Provides a **dynamic and user-friendly interface**
  - Real-time debate experience using **Socket.IO**
  - Displays AI results (scores + justifications) instantly in the debate room  

- **Team Objective:** Ensure seamless **communication** between users, backend, and AI microservice for smooth and interactive debates.

---

## **3️⃣ Future Outlook**

- **Advanced AI Models:** Explore **larger multilingual transformers** for more nuanced scoring  
- **Enhanced Explainability:** Provide multiple or layered justifications per argument  
- **Real-Time Scaling:** Cloud GPU deployment for handling multiple debates concurrently  
- **Cross-Platform Support:** Integrate with web, mobile, and VR for immersive debate experiences  
- **Automated Feedback:** Personalized suggestions to improve participant arguments  
- **Blockchain Integration:**  
  - Plan to integrate **argument hashing** for tamper-proof debate records  
  - Ensures **transparency and trust** in AI-evaluated discussions  

---

### 🧩 Tech Stack Summary

| Layer | Technology |
|-------|-------------|
| **Frontend** | React.js, Socket.IO |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB |
| **AI Microservice** | FastAPI, Docker, Transformers (DistilBERT, T5) |
| **Runtime** | NVIDIA T4 GPU |
| **Future Add-on** | Blockchain for argument integrity |

---

> “Our debate platform combines technology, intelligence, and integrity — where humans and AI reason together.”
