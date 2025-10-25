# inference.py
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from .model import DistilBERTRegressor  # your custom model class
import torch.hub

# -------------------------------
# Hugging Face URLs for models
# -------------------------------
ARG_MODEL_HF_URL = "https://huggingface.co/Reshmitha1612/Argument_scorer/tree/main/argument_scorer_model"  # replace with your HF repo
JUST_MODEL_HF_URL = "https://huggingface.co/Reshmitha1612/Justification_model/tree/main"   # replace with your HF repo

# -------------------------------
# Load Argument Scorer (custom DistilBERT)
# -------------------------------
# Download model weights from HF
arg_model_weights_path = torch.hub.load_state_dict_from_url(
    f"https://huggingface.co/{ARG_MODEL_HF_URL}/model.pt",
    map_location="cpu"  # change to "cuda" if GPU is available
)
score_tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
score_model = DistilBERTRegressor()
score_model.load_state_dict(arg_model_weights_path)
score_model.eval()

# -------------------------------
# Load Justification Generator (Seq2Seq)
# -------------------------------
just_tokenizer = AutoTokenizer.from_pretrained(JUST_MODEL_HF_URL, use_fast=False)
just_model = AutoModelForSeq2SeqLM.from_pretrained(JUST_MODEL_HF_URL)
just_model.eval()

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



