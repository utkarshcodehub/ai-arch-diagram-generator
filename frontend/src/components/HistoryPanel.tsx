interface HistoryItem {
  prompt: string;
  explanation: string;
  mermaidCode: string;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

function HistoryPanel({ history, onSelect, onClear }: HistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2 style={styles.heading}>🕓 Prompt History</h2>
        <button style={styles.clearBtn} onClick={onClear}>Clear All</button>
      </div>
      <div style={styles.list}>
        {history.map((item, index) => (
          <div
            key={index}
            style={styles.item}
            onClick={() => onSelect(item)}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#22253a")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#1a1d27")}
          >
            <span style={styles.index}>#{history.length - index}</span>
            <span style={styles.promptText}>{item.prompt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "12px", padding: "24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  heading: { fontSize: "18px", fontWeight: "700", color: "#a89cff" },
  clearBtn: { padding: "6px 14px", backgroundColor: "transparent", color: "#ff6b6b", border: "1px solid #ff6b6b", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: "8px" },
  item: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "8px", cursor: "pointer", transition: "background 0.2s" },
  index: { fontSize: "12px", color: "#6c63ff", fontWeight: "700", minWidth: "28px" },
  promptText: { fontSize: "13px", color: "#c8c8d0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
};

export default HistoryPanel;