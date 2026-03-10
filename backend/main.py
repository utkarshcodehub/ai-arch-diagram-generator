from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os
import json

# Load environment variables from .env
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI Architecture Diagram Generator",
    description="Converts natural language system descriptions into architecture explanations and Mermaid diagrams.",
    version="1.0.0"
)

# Allow frontend (React) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://ai-software-architecture-generator.vercel.app"],  # React dev server default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Models ──────────────────────────────────────────────

class PromptRequest(BaseModel):
    prompt: str

class DiagramResponse(BaseModel):
    explanation: str
    mermaid_code: str

# ── System Prompt ────────────────────────────────────────

SYSTEM_PROMPT = """
You are an expert software architect. Your job is to take ANY software system idea —
even described in plain simple English — and generate a proper architecture for it.

The user may describe their idea casually like:
- "design an architecture of an ai quiz generator"
- "i want to build a food delivery app"
- "how would netflix work"

You must ALWAYS generate a response. Never refuse. Always interpret the idea and design a sensible architecture.

Respond with ONLY a valid JSON object — no extra text, no markdown, no code fences.

The JSON must have exactly these two fields:
{
  "explanation": "A clear explanation of the architecture. Use plain text with newlines (\\n). Cover each component, its role, and how they connect.",
  "mermaid_code": "Valid Mermaid diagram code only."
}

STRICT MERMAID RULES:
- Always start with: graph TD
- Node format ONLY: A[Label Text]
- Arrow format ONLY: A --> B
- Use only letters and numbers in node IDs like A, B, API, DB, UI
- NO pipe characters | anywhere
- NO special characters in labels
- NO subgraphs
- Plain arrows and nodes only — nothing else

GOOD example of mermaid_code:
graph TD
A[User] --> B[Frontend]
B --> C[Backend API]
C --> D[Database]

Return ONLY the raw JSON object. Nothing before or after it.
"""

# ── Routes ───────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}


@app.post("/generate", response_model=DiagramResponse)
def generate_diagram(request: PromptRequest):

    # Basic input validation
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    if len(request.prompt) > 1000:
        raise HTTPException(status_code=400, detail="Prompt too long. Keep it under 1000 characters.")

    try:
        # Call Groq API
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.prompt}
            ],
            temperature=0.7,
            max_tokens=2048,
        )

        raw_response = chat_completion.choices[0].message.content.strip()

        # Strip accidental markdown code fences if present
        if raw_response.startswith("```"):
            raw_response = raw_response.split("```")[1]
            if raw_response.startswith("json"):
                raw_response = raw_response[4:]
            raw_response = raw_response.strip()

        # Find JSON object in response even if there's extra text around it
        start = raw_response.find("{")
        end = raw_response.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON object found in LLM response.")
        raw_response = raw_response[start:end]

        parsed = json.loads(raw_response)

        # Validate required fields exist
        if "explanation" not in parsed or "mermaid_code" not in parsed:
            raise ValueError("Missing required fields in LLM response.")

        return DiagramResponse(
            explanation=parsed["explanation"],
            mermaid_code=parsed["mermaid_code"]
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="LLM returned invalid JSON. Try rephrasing your prompt."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))