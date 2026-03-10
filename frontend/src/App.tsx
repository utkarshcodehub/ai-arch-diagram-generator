import { useState } from "react";
import PromptInput from "./components/PromptInput";
import ExplanationPanel from "./components/ExplanationPanel";
import DiagramPanel from "./components/DiagramPanel";
import HistoryPanel from "./components/HistoryPanel";

function App() {
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setExplanation("");
    setMermaidCode("");

    try {
      const response = await fetch("https://ai-software-architecture-generator.onrender.com/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong.");
      }

      setExplanation(data.explanation);
      setMermaidCode(data.mermaid_code);

      // Save to history (most recent first, no duplicates)
      setHistory(prev => {
        const filtered = prev.filter(item => item.prompt !== prompt.trim());
        return [
          { prompt: prompt.trim(), explanation: data.explanation, mermaidCode: data.mermaid_code },
          ...filtered,
        ];
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item) => {
    setPrompt(item.prompt);
    setExplanation(item.explanation);
    setMermaidCode(item.mermaidCode);
    setError("");
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🏗️ AI Architecture Diagram Generator</h1>
          <p style={styles.subtitle}>
            Describe any software system and get a visual architecture diagram instantly.
          </p>
        </div>

        {/* Input */}
        <PromptInput
          prompt={prompt}
          setPrompt={setPrompt}
          onSubmit={handleGenerate}
          loading={loading}
        />

        {/* Error */}
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* History */}
        <HistoryPanel
          history={history}
          onSelect={handleSelectHistory}
          onClear={handleClearHistory}
        />

        {/* Results */}
        <ExplanationPanel explanation={explanation} />
        <DiagramPanel mermaidCode={mermaidCode} />

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    backgroundColor: "#0f1117",
  },
  container: {
    maxWidth: "860px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  header: {
    textAlign: "center",
    paddingBottom: "10px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#888",
  },
  error: {
    backgroundColor: "#2a1a1a",
    border: "1px solid #ff6b6b",
    color: "#ff6b6b",
    padding: "14px",
    borderRadius: "8px",
    fontSize: "14px",
  },
};

export default App;