import { useCallback, useEffect, useRef, useState } from "react";
import {
  PORTFOLIO_LAYOUT_LABELS,
  type PortfolioLayoutInspectResult,
  convertPortfolio,
  downloadBlob,
  inspectPortfolioLayout,
} from "./api.js";

type Status = { kind: "idle" | "loading" | "error" | "ready"; message?: string };

interface ConvertPortfolioProps {
  onUseForReports?: (file: File) => void;
}

export function ConvertPortfolio({ onUseForReports }: ConvertPortfolioProps) {
  const [file, setFile] = useState<File | null>(null);
  const [layoutInfo, setLayoutInfo] = useState<PortfolioLayoutInspectResult | null>(null);
  const [convertedFile, setConvertedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [inspecting, setInspecting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setLayoutInfo(null);
      setConvertedFile(null);
      return;
    }
    let cancelled = false;
    setInspecting(true);
    setConvertedFile(null);
    setStatus({ kind: "loading", message: "Detecting portfolio layout…" });
    inspectPortfolioLayout(file)
      .then((info) => {
        if (cancelled) return;
        setLayoutInfo(info);
        setStatus({ kind: "ready" });
      })
      .catch((err) => {
        if (cancelled) return;
        setLayoutInfo(null);
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => {
        if (!cancelled) setInspecting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const handleFiles = useCallback((files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) {
      setStatus({ kind: "error", message: "Please select a .xlsx portfolio file." });
      return;
    }
    setFile(f);
  }, []);

  const runConvert = useCallback(async () => {
    if (!file) return;
    setConverting(true);
    setStatus({ kind: "loading", message: "Converting to standard template…" });
    try {
      const { blob, filename, rowsWritten } = await convertPortfolio(file);
      downloadBlob(blob, filename);
      const nextFile = new File([blob], filename, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      setConvertedFile(nextFile);
      setStatus({
        kind: "ready",
        message: `Converted ${rowsWritten > 0 ? `${rowsWritten} rows` : "portfolio"} — saved as ${filename}`,
      });
    } catch (err) {
      setConvertedFile(null);
      setStatus({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    } finally {
      setConverting(false);
    }
  }, [file]);

  const layoutSummary = layoutInfo ? (
    <div className={`inspect-panel${layoutInfo.isStandard ? "" : " info-panel"}`}>
      <div className="inspect-head">
        <strong>{PORTFOLIO_LAYOUT_LABELS[layoutInfo.layout] ?? layoutInfo.layout}</strong>
        <span className="muted">Sheet: {layoutInfo.sheetName}</span>
      </div>
      <div className="inspect-meta muted">
        Headers rows {layoutInfo.headerRow1}–{layoutInfo.headerRow2} · data from row{" "}
        {layoutInfo.dataStartRow} · Amount col {layoutInfo.amountCol} · Total col{" "}
        {layoutInfo.totalCol}
        {layoutInfo.accountCol ? ` · Account col ${layoutInfo.accountCol}` : ""}
      </div>
      {layoutInfo.isStandard ? (
        <p className="convert-hint muted">
          This file already matches the standard A–L template. Converting will still normalize
          headers and column widths for consistency.
        </p>
      ) : (
        <p className="convert-hint muted">
          Output uses columns A–L: FILE, INSTITUTION, TYPE, AMOUNT, TOTAL, rates, dates, and ISIN.
        </p>
      )}
    </div>
  ) : null;

  return (
    <>
      <h2>Convert investment portfolio</h2>
      <p className="muted">
        Upload a legacy or variant Schedule B master (.xlsx). The converter detects the column
        layout and produces the standard template used by the report generator.
      </p>

      <div
        className={`dropzone${dragging ? " dragging" : ""}${file ? " has-file" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {file ? (
          <div className="file-info">
            <span className="file-name">{file.name}</span>
            <span className="muted">{(file.size / 1024).toFixed(0)} KB — click to replace</span>
          </div>
        ) : (
          <div className="dz-hint">
            <strong>Drop the portfolio .xlsx here</strong>
            <span className="muted">or click to browse</span>
          </div>
        )}
      </div>

      {layoutSummary}

      <div className="controls convert-controls">
        <div className="actions">
          <button
            className="btn"
            disabled={!file || inspecting || converting}
            onClick={runConvert}
          >
            {converting ? "Converting…" : "Download standard template"}
          </button>
          {convertedFile && onUseForReports ? (
            <button
              className="btn ghost"
              onClick={() => onUseForReports(convertedFile)}
            >
              Use for reports
            </button>
          ) : null}
        </div>
      </div>

      {status.kind === "error" && <div className="banner error">{status.message}</div>}
      {status.kind === "loading" && <div className="banner info">{status.message}</div>}
      {status.kind === "ready" && status.message && (
        <div className="banner ok">{status.message}</div>
      )}
    </>
  );
}
