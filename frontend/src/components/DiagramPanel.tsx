import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { toPng } from "html-to-image";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  suppressErrorRendering: true,
});

interface DiagramPanelProps {
  mermaidCode: string;
}

function DiagramPanel({ mermaidCode }: DiagramPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mermaidCode || !ref.current) return;

    const renderDiagram = async () => {
      try {
        ref.current!.innerHTML = "";
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        ref.current!.innerHTML = svg;
      } catch (err) {
        ref.current!.innerHTML = `
          <p style="color:#ff6b6b; font-size:13px;">
            ⚠️ Could not render diagram.
          </p>
          <pre style="color:#888; font-size:12px; margin-top:10px; white-space:pre-wrap;">${mermaidCode}</pre>
        `;
      }
    };

    renderDiagram();
  }, [mermaidCode]);

  const handleExportSVG = () => {
    const svgEl = ref.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "architecture-diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = async () => {
    const svgEl = ref.current?.querySelector("svg");
    if (!svgEl) return;
    try {
      svgEl.style.background = "#1a1d27";
      const dataUrl = await toPng(svgEl, {
        backgroundColor: "#1a1d27",
        pixelRatio: 2,
      });
      svgEl.style.background = "";
      const a = document.createElement("a");
      a.download = "architecture-diagram.png";
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    }
  };

  if (!mermaidCode) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2 style={styles.heading}>🗺️ Architecture Diagram</h2>
        <div style={styles.exportButtons}>
          <button style={styles.exportBtn} onClick={handleExportSVG}>⬇ Export SVG</button>
          <button style={styles.exportBtn} onClick={handleExportPNG}>⬇ Export PNG</button>
        </div>
      </div>
      <div ref={ref} style={styles.diagram} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { backgroundColor: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: "12px", padding: "24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  heading: { fontSize: "18px", fontWeight: "700", color: "#a89cff" },
  exportButtons: { display: "flex", gap: "10px" },
  exportBtn: { padding: "8px 16px", backgroundColor: "#2a2d3a", color: "#a89cff", border: "1px solid #3d3a6b", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  diagram: { overflowX: "auto", display: "flex", justifyContent: "center" },
};

export default DiagramPanel;