# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from .inference import debate_judge, prepare_team_arguments

# -------------------------------
# FastAPI app
# -------------------------------
app = FastAPI(title="AI Debate Judge")

# -------------------------------
# Pydantic models for input
# -------------------------------
class Message(BaseModel):
    userId: str
    team: str  # "A" or "B"
    message: str

class DebateInput(BaseModel):
    DebateId: str
    topic: str
    arguments: List[Message]

# -------------------------------
# API endpoint
# -------------------------------
@app.post("/evaluate")
def evaluate_debate(input_data: DebateInput):
    # Convert messages to concatenated team arguments
    team_a_args, team_b_args = prepare_team_arguments(input_data.arguments)
    
    # Get scores, winner, and justification
    result = debate_judge(
        input_data.DebateId,
        input_data.topic,
        team_a_args,
        team_b_args
    )
    
    return result
