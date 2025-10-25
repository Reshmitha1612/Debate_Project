import torch.nn as nn
from transformers import DistilBertModel
class DistilBERTRegressor(nn.Module):
    def __init__(self):
        super(DistilBERTRegressor, self).__init__()
        self.bert = DistilBertModel.from_pretrained('distilbert-base-uncased')
        self.dropout = nn.Dropout(0.3)
        self.regressor = nn.Linear(self.bert.config.hidden_size, 1)  # output is a single float

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        hidden_state = outputs.last_hidden_state[:,0]  # CLS token representation
        x = self.dropout(hidden_state)
        x = self.regressor(x)
        return x.squeeze(-1)  # shape: (batch_size)