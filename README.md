# 🏗️ AI Architecture Diagram Generator

A full-stack application that converts natural language system descriptions into visual architecture diagrams using AI.

## Live Demo
🌐 [ai-software-architecture-generator.vercel.app](https://ai-software-architecture-generator.vercel.app)

## What It Does
Enter any software system description in plain English and get:
- A structured architecture explanation
- A visual diagram rendered from Mermaid.js
- Export the diagram as PNG or SVG

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React, Vite, Mermaid.js |
| Backend | FastAPI, Python |
| AI | Groq API (llama-3.3-70b-versatile) |
| Deployment | Vercel (frontend), Render (backend) |

## Run Locally

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file:
```
GROQ_API_KEY=your_groq_api_key
```
```bash
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## Features
- Natural language to architecture diagram
- Live Mermaid diagram rendering
- Prompt history with instant restore
- Export diagram as PNG or SVG
- Clean dark UI

## Author
[utkarshcodehub](https://github.com/utkarshcodehub)
