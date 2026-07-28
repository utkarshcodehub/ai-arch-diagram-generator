import json
import logging
import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, ConfigDict, Field, ValidationError

# Load environment variables from .env
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Architecture Diagram Generator",
    description="Converts natural language system descriptions into architecture explanations and Mermaid diagrams.",
    version="1.0.0"
)

# Allow frontend (React) to talk to this backend
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,https://ai-software-architecture-generator.vercel.app",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to your environment or .env file.")
    return Groq(api_key=api_key)

# ── Models ──────────────────────────────────────────────

class PromptRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=1000, description="System idea to design")

    model_config = ConfigDict(str_strip_whitespace=True)

class DiagramResponse(BaseModel):
    explanation: str
    mermaid_code: str


class LLMOutput(BaseModel):
    explanation: str = Field(min_length=40)
    mermaid_code: str = Field(min_length=20)

    model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")

# ── System Prompt ────────────────────────────────────────

SYSTEM_PROMPT = """
You are a principal software architect.

Task:
Given a user idea (possibly short or informal), produce a practical architecture suitable for implementation.

Output format:
Return ONLY a valid JSON object (no markdown, no code fences, no commentary before/after) with exactly:
{
  "explanation": "...",
  "mermaid_code": "..."
}

Quality rules for explanation:
- Write clear, implementation-oriented plain text with newline separators.
- Keep it concise but complete (roughly 8-14 lines).
- Cover these parts when relevant:
  1) Core components
  2) Data flow request lifecycle
  3) Data storage and caching
  4) Security and auth
  5) Scalability and reliability
  6) Observability logs metrics tracing
- If requirements are ambiguous, make reasonable assumptions and state them briefly.

Strict Mermaid rules:
- Start with exactly: graph TD
- Use only nodes and simple directed edges.
- Node syntax only: ID[Label]
- Edge syntax only: A --> B
- Node IDs: alphanumeric only, no spaces, no symbols.
- Labels: plain readable words, avoid special characters.
- Do not use subgraphs, styles, classes, pipes, or edge labels.
- Keep the graph readable (typically 8-20 nodes).

Consistency rules:
- Components mentioned in explanation should appear in the diagram.
- Prefer production-ready building blocks over vague terms.
- Do not include placeholders like TBD.
"""

MODEL_NAME = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
MODEL_TEMPERATURE = float(os.getenv("MODEL_TEMPERATURE", "0.15"))
MODEL_MAX_TOKENS = int(os.getenv("MODEL_MAX_TOKENS", "2048"))


def _strip_markdown_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        if len(parts) >= 2:
            cleaned = parts[1].strip()
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()
    return cleaned


def _extract_json_object(text: str) -> str:
    """Extract first valid JSON object from arbitrary text."""
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char != "{":
            continue
        try:
            parsed_obj, offset = decoder.raw_decode(text[index:])
            if isinstance(parsed_obj, dict):
                return text[index:index + offset]
        except json.JSONDecodeError:
            continue
    raise ValueError("No valid JSON object found in LLM response.")


def _validate_mermaid(mermaid_code: str) -> str:
    lines = [line.strip() for line in mermaid_code.strip().splitlines() if line.strip()]
    if not lines:
        raise ValueError("Mermaid diagram is empty.")

    if lines[0] != "graph TD":
        lines.insert(0, "graph TD")

    forbidden_tokens = ["|", "subgraph", "classDef", "style ", ":::", "-->"]
    for token in forbidden_tokens[:5]:
        if any(token in line for line in lines[1:]):
            raise ValueError(f"Mermaid contains unsupported token: {token}")

    # Keep only lines that look like plain node-to-node edges.
    safe_lines = [lines[0]]
    for line in lines[1:]:
        if "-->" in line and "[" in line and "]" in line:
            safe_lines.append(line)

    if len(safe_lines) < 2:
        raise ValueError("Mermaid output does not contain valid edges.")

    return "\n".join(safe_lines)


def _parse_llm_output(raw_text: str) -> LLMOutput:
    cleaned = _strip_markdown_fences(raw_text)
    json_blob = _extract_json_object(cleaned)
    data: dict[str, Any] = json.loads(json_blob)
    parsed = LLMOutput.model_validate(data)
    parsed.mermaid_code = _validate_mermaid(parsed.mermaid_code)
    return parsed

# ── Routes ───────────────────────────────────────────────

@app.get("/health")
def health_check():
    api_key_configured = bool(os.getenv("GROQ_API_KEY", "").strip())
    return {
        "status": "ok",
        "message": "Backend is running",
        "model": MODEL_NAME,
        "groq_api_key_configured": api_key_configured,
    }


@app.post("/generate", response_model=DiagramResponse)
def generate_diagram(request: PromptRequest):
    try:
        client = get_groq_client()

        chat_completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.prompt}
            ],
            temperature=MODEL_TEMPERATURE,
            max_tokens=MODEL_MAX_TOKENS,
            response_format={"type": "json_object"},
        )

        raw_response = (chat_completion.choices[0].message.content or "").strip()
        if not raw_response:
            raise ValueError("LLM returned an empty response.")

        parsed = _parse_llm_output(raw_response)

        return DiagramResponse(
            explanation=parsed.explanation,
            mermaid_code=parsed.mermaid_code,
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="Model returned invalid JSON. Try rephrasing your prompt.",
        )
    except ValidationError as e:
        logger.warning("Model output validation failed: %s", str(e))
        raise HTTPException(
            status_code=502,
            detail="Model response schema validation failed.",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error while generating architecture diagram")
        raise HTTPException(status_code=500, detail=str(e))