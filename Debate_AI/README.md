# Debate Project – AI Workflow

This document describes the AI workflow for the debate project, detailing the models, datasets, and processing steps used for scoring and justifying arguments.

---

## **1. Argument Scoring**

- **Model:** DistilBERT (fine-tuned)
- **Training Data:**
  - **Webis Dataset**
  - **IBM Debater Dataset**
  - Both datasets are combined for improved argument scoring performance.
- **Task:** Evaluate the **strength and relevance** of each argument.
- **Output:** A numerical **score** representing the quality of the argument.

---

## **2. Justification / Explanation**

- **Model:** T5 Small
- **Task:** Generate **natural language explanations** for the assigned argument scores.
- **Input:** Argument text + predicted score
- **Output:** Coherent justification text explaining why the argument received that score.

---

## **3. Deployment & Runtime**

- **Backend Framework:** FastAPI
- **Containerization:** Docker
- **GPU:** NVIDIA **T4 GPU** (for efficient inference and batch processing)
- **Input/Output Format:**
  - **Input JSON Example:**
    ```json
    {
      "DebateId": "12345",
      "topic": "Should AI replace human teachers?",
      "arguments": [
        {
          "userId": "abc123",
          "team": "A",
          "message": "AI can provide personalized learning experiences.",
          "timestamp": "2025-10-24T12:30:00Z"
        },
        {
          "userId": "def456",
          "team": "B",
          "message": "Human teachers understand emotions better than AI.",
          "timestamp": "2025-10-24T12:32:00Z"
        }
      ]
    }
    ```
  - **Output JSON Example:**
    ```json
      {
        "DebateId": "D001",
        "topic": "Should cricket be included in the Olympics?",
        "score_team_a": 0.8129299283027649,
        "score_team_b": 0.7649002075195312,
        "winner": "Team A",
        "justification": "Team A emphasized globalization and inclusion. Team B emphasized importance of international engagement. Team A won for promoting            globalization."
      }

arey API nundi neeku json lo vache output ilaa vuntundhi check chesuko
    ```

---

## **4. Collaboration Flow**

1. **Input:** Teammate backend sends debate JSON to FastAPI endpoint.
2. **Processing:** DistilBERT scores the arguments, then T5 generates justifications.
3. **Output:** FastAPI returns JSON results for direct use by the teammate’s backend.

---

## **5. Access & Local Testing**

- **Localhost Link (for testing):** [http://localhost:8000](http://localhost:8000)

---

**Notes:**

- Fine-tuning DistilBERT on a combined dataset improves argument scoring.
- T5 Small provides concise and meaningful justifications without heavy computation.
- Docker + T4 GPU ensures smooth deployment and fast inference for real-time debate analysis.

**Future Outlook:**
Enhanced Scoring Models: Explore using multilingual and larger transformer models for more nuanced scoring.
Explainability Improvements: Generate deeper reasoning or multiple justifications per argument.
Real-Time Scaling: Deploy on cloud GPUs for larger debates with many participants.
Cross-Platform Integration: Connect with web, mobile, and VR debate platforms.
Automated Feedback: Suggest improvements to participants’ arguments based on AI insights.
Dataset Expansion: Continuously include new datasets to improve scoring fairness and coverage.

