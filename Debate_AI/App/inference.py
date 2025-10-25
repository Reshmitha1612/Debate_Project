# inference.py
import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from .model import DistilBERTRegressor  # your custom model class

# -------------------------------
# Base directory
# -------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Debate_AI folder
ARG_MODEL_PATH = os.path.join(BASE_DIR, "Models", "argument_scorer_model", "model.pt")
JUST_MODEL_PATH = os.path.join(BASE_DIR, "Models", "justification_model")

# -------------------------------
# Load Argument Scorer (custom DistilBERT)
# -------------------------------
score_tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
score_model = DistilBERTRegressor()
score_model.load_state_dict(torch.load(ARG_MODEL_PATH, map_location="cpu"))
score_model.eval()

# -------------------------------
# Load Justification Generator
# -------------------------------
just_tokenizer = AutoTokenizer.from_pretrained(JUST_MODEL_PATH, use_fast=False)
just_model = AutoModelForSeq2SeqLM.from_pretrained(JUST_MODEL_PATH)

# -------------------------------
# Helper functions
# -------------------------------
def get_argument_score(argument: str) -> float:
    inputs = score_tokenizer(argument, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        score = score_model(**inputs)
    return score.item()

def get_justification(DebateId: str, topic: str, team_a_args: str, team_b_args: str, winner: str) -> str:
    input_text = (
        f"DebateId: {DebateId}\n"
        f"Topic: {topic}\n"
        f"Team A: {team_a_args}\n"
        f"Team B: {team_b_args}\n"
        f"Winner: {winner}\nReason:"
    )
    inputs = just_tokenizer(input_text, return_tensors="pt", truncation=True, padding=True)
    outputs = just_model.generate(**inputs, max_length=128)
    return just_tokenizer.decode(outputs[0], skip_special_tokens=True)

def debate_judge(DebateId: str, topic: str, team_a_args: str, team_b_args: str) -> dict:
    score_a = get_argument_score(team_a_args)
    score_b = get_argument_score(team_b_args)
    winner = "Team A" if score_a > score_b else "Team B"
    justification = get_justification(DebateId, topic, team_a_args, team_b_args, winner)
    return {
        "DebateId": DebateId,
        "topic": topic,
        "score_team_a": score_a,
        "score_team_b": score_b,
        "winner": winner,
        "justification": justification
    }

def prepare_team_arguments(messages):
    team_a_msgs = " ".join([msg.message for msg in messages if msg.team == "A"])
    team_b_msgs = " ".join([msg.message for msg in messages if msg.team == "B"])
    return team_a_msgs, team_b_msgs

