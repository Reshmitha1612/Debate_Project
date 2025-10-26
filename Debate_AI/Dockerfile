# Use official lightweight Python image
FROM python:3.10

# Set working directory
WORKDIR /app

# Copy requirement file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Set the working directory to where FastAPI app is
WORKDIR /app/App

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
