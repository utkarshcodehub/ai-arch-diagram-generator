interface ExplanationPanelProps {
  explanation: string;
}

function ExplanationPanel({ explanation }: ExplanationPanelProps) {
  if (!explanation) return null;

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.heading}>📋 Architecture Explanation</h2>
      <div style={styles.content}>
        {explanation.split("\n").map((line, i) => (
          <p key={i} style={line === "" ? styles.spacer : styles.line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "12px", padding: "24px" },
  heading: { fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: "#a89cff" },
  content: { lineHeight: "1.8" },
  line: { fontSize: "14px", color: "#c8c8d0", marginBottom: "4px" },
  spacer: { marginBottom: "10px" },
};

export default ExplanationPanel;