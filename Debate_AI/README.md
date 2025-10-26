# 🧠 Debate AI Module

## 📘 Project Description
This module serves as the **AI engine** of the Debate Platform. It analyzes multi-user debates and generates **argument scores** and **AI-based justifications** using fine-tuned transformer models. The goal is to make debate evaluation objective, scalable, and multilingual.

---

## ⚙️ Tech Stack & Prerequisites

**Languages & Frameworks**
- Python 3.10+
- FastAPI (for serving APIs)
- PyTorch (for model training and inference)
- Hugging Face Transformers

**Models Used**
- `DistilBERT` – Fine-tuned for **argument scoring**
- `T5-small` – Used for **text justification generation**

**Datasets**
- Combined **Webis** and **IBM Debater** datasets for robust multilingual fine-tuning.

**Hardware**
- NVIDIA **T4 GPU** (used for fine-tuning and inference)

---

## 🧩 Features
- Accepts JSON input containing the topic, users, and their debate arguments.  
- Outputs AI-generated argument **scores** and **justification summaries**.  
- Supports **multilingual** debates.  
- Integrates easily with backend APIs for real-time debate evaluation.

---

## 🚀 Setup & Run Locally

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/Debate_AI.git
cd Debate_AI
````

### 2️⃣ Create and Activate Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate  # for Windows
# OR
source venv/bin/activate  # for Linux/Mac
```

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 4️⃣ Run the FastAPI Server

```bash
uvicorn main:app --reload
```

Server will start at 👉 **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**

---

## 🧠 Example Input

```json
{
  "DebateId":"sbcjkjasoc09",
  "topic": "Should AI replace human teachers?",
  "arguments": [
    {"userId": "u1", "team": "A", "message": "AI can personalize learning."},
    {"userId": "u2", "team": "B", "message": "Teachers provide emotional support."},
    {"userId": "u3", "team": "A", "message": "AI adapts to students' pace."},
    {"userId": "u4", "team": "B", "message": "Human empathy cannot be replicated."}
  ]
}
```

---

## 🧾 Example Output

```json
{
  "debateId": "xyz123",
  "scores": {
    "team A": 0.86,
    "Team B": 0.64,
  },
  "justification": "  Gives emphasis of both teams and justifies why a particular team won."
}
```

---

## 👩‍💻 Tech Team Collaboration

* The **AI Team** (this module) handled all model fine-tuning, scoring logic, and justification generation.
* The **Tech Team** developed the backend infrastructure using **Node.js**, **Express.js**, and **Socket.IO** for real-time debates.
* Integration between both teams ensures smooth communication between the debate UI and the AI scoring API.

---

## 🔮 Future Outlook

* Full integration with the main debate platform for **live debate evaluation**.
* Enhanced **multilingual model support** for global debate participation.
* Incorporation of **blockchain technology** to ensure **transparency and trust** in AI scoring.

  * Example: Storing AI-generated scores and justifications on a decentralized ledger to prevent tampering and enable fairness audits.
* Adoption of **Explainable AI (XAI)** to improve interpretability and transparency of scoring.

---

📍 **Local Test URL:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

```

