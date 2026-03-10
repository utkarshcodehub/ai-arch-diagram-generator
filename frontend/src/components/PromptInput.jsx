function PromptInput({ prompt, setPrompt, onSubmit, loading }) {
  return (
    <div style={styles.wrapper}>
      <textarea
        style={styles.textarea}
        placeholder="Describe your system architecture... e.g. Design a FastAPI + Redis + Celery architecture for background job processing"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
      />
      <button
        style={loading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "Generating..." : "⚡ Generate Architecture"}
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #2a2d3a",
    backgroundColor: "#1a1d27",
    color: "#e0e0e0",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
    lineHeight: "1.6",
  },
  button: {
    padding: "12px 28px",
    backgroundColor: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    alignSelf: "flex-start",
    transition: "background 0.2s",
  },
  buttonDisabled: {
    backgroundColor: "#3d3a6b",
    cursor: "not-allowed",
  },
};

export default PromptInput;