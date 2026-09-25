import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConvertPortfolio } from "./ConvertPortfolio.js";
import {
  MONTH_OPTIONS,
  REPORTS,
  type InvestmentMaturitiesPreviewResult,
  type MasterInspectResult,
  type MonthMaturitySummaryPreviewResult,
  type MaturityWisePreviewResult,
  type ReportFormat,
  type ReportGenerateOptions,
  type ReportId,
  type ReportPreviewResult,
  type ScheduleC3PreviewResult,
  type ScheduleC4PreviewResult,
  type ScheduleC5PreviewResult,
  type ScheduleC6PreviewResult,
  type ScheduleC6iPreviewResult,
  type PortfolioSharePreviewResult,
  type InstitutionRatingPreviewResult,
  downloadBlob,
  generateReport,
  generateReportFromItms,
  inspectItmsPortfolio,
  inspectMaster,
  loginToItms,
  clearStoredItmsSession,
  getStoredItmsToken,
  getStoredItmsUsername,
  previewReport,
  previewReportFromItms,
  previewScheduleC5FromItms,
  previewReportPdf,
  formatRatingPeriodLabel,
  defaultChartColorForSegment,
  PLOT_BG_LABELS,
  withDefaultPlotBackground,
  yearFromAsAtLabel,
  reportSupportsItms,
  type ChartColorMap,
} from "./api.js";

type Status = { kind: "idle" | "loading" | "error" | "ready"; message?: string };

function isC3Preview(meta: ReportPreviewResult): meta is ScheduleC3PreviewResult {
  return "maturityYear" in meta;
}

function isMaturityWisePreview(meta: ReportPreviewResult): meta is MaturityWisePreviewResult {
  return "yearCount" in meta;
}

function isInvestmentMaturitiesPreview(
  meta: ReportPreviewResult,
): meta is InvestmentMaturitiesPreviewResult {
  return "scope" in meta && "sections" in meta;
}

function isMonthMaturitySummaryPreview(
  meta: ReportPreviewResult,
): meta is MonthMaturitySummaryPreviewResult {
  return "scheduleLabel" in meta && "months" in meta && !("scope" in meta);
}

function isScheduleC4Preview(meta: ReportPreviewResult): meta is ScheduleC4PreviewResult {
  return "years" in meta && "totalMaturities" in meta && !("institutions" in meta);
}

function isPortfolioSharePreview(meta: ReportPreviewResult): meta is PortfolioSharePreviewResult {
  return "lines" in meta && "totalPortfolio" in meta && !("rowCount" in meta) && !("institutions" in meta);
}

function isScheduleC6iPreview(meta: ReportPreviewResult): meta is ScheduleC6iPreviewResult {
  return "years" in meta && "rowCount" in meta && "grandTotal" in meta && !("totalMaturities" in meta);
}

function isInstitutionRatingPreview(meta: ReportPreviewResult): meta is InstitutionRatingPreviewResult {
  return "institutionTotal" in meta && "rows" in meta;
}

function isScheduleC6Preview(meta: ReportPreviewResult): meta is ScheduleC6PreviewResult {
  return "institutions" in meta && !("ratingPeriod1Label" in meta);
}

function isScheduleC5Preview(meta: ReportPreviewResult): meta is ScheduleC5PreviewResult {
  return "institutions" in meta && "ratingPeriod1Label" in meta;
}

export function App() {
  const [mode, setMode] = useState<"reports" | "convert">("reports");
  const [file, setFile] = useState<File | null>(null);
  const [reportId, setReportId] = useState<ReportId>("maturity-wise");
  const [pageNumber, setPageNumber] = useState(22);
  const [scheduleLabel, setScheduleLabel] = useState("");
  const [chartSegments, setChartSegments] = useState<string[]>([]);
  const [chartColors, setChartColors] = useState<ChartColorMap>({});
  const [maturityYear, setMaturityYear] = useState(2026);
  const [maturityMonth, setMaturityMonth] = useState(3);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<ReportPreviewResult | null>(null);
  const [inspectResult, setInspectResult] = useState<MasterInspectResult | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [busyFormat, setBusyFormat] = useState<ReportFormat | null>(null);
  const [busyAllMonths, setBusyAllMonths] = useState<ReportFormat | null>(null);
  const [ratingPeriod1Date, setRatingPeriod1Date] = useState("");
  const [ratingPeriod2Date, setRatingPeriod2Date] = useState("");
  const [institutionRatings, setInstitutionRatings] = useState<
    Record<string, { period1: string; period2: string }>
  >({});
  const [fdInstitutionRows, setFdInstitutionRows] = useState<
    { institution: string; amount: string; share: string }[]
  >([]);
  const [agreedRatingLabel, setAgreedRatingLabel] = useState("A & above");
  const [institutionCurrentRatings, setInstitutionCurrentRatings] = useState<
    Record<string, string>
  >({});
  const [institutionRatingRows, setInstitutionRatingRows] = useState<
    { institution: string; total: string; share: string }[]
  >([]);
  const [dragging, setDragging] = useState(false);
  const [dataSource, setDataSource] = useState<"excel" | "itms">("excel");
  const [itmsAsAtDate, setItmsAsAtDate] = useState("");
  const [itmsUsername, setItmsUsername] = useState("");
  const [itmsPassword, setItmsPassword] = useState("");
  const [itmsSignedIn, setItmsSignedIn] = useState(() => Boolean(getStoredItmsToken()));
  const [itmsSigningIn, setItmsSigningIn] = useState(false);
  const [itmsSavings, setItmsSavings] = useState("");
  const [itmsLoans, setItmsLoans] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const report = useMemo(() => REPORTS.find((r) => r.id === reportId)!, [reportId]);
  const maturityOptions = useMemo(
    () => ({ year: maturityYear, month: maturityMonth, scope: "month" as const }),
    [maturityYear, maturityMonth],
  );
  const reportYearOptions = useMemo(() => {
    if (!report.usesYearPicker && !report.usesMaturityPeriod) return undefined;
    if (report.usesMaturityPeriod) return maturityOptions;
    return { year: maturityYear };
  }, [report, maturityOptions, maturityYear]);

  const ratingPeriod1Label = useMemo(
    () => formatRatingPeriodLabel(ratingPeriod1Date),
    [ratingPeriod1Date],
  );
  const ratingPeriod2Label = useMemo(
    () => formatRatingPeriodLabel(ratingPeriod2Date),
    [ratingPeriod2Date],
  );

  const reportGenerateOptions = useMemo((): ReportGenerateOptions | undefined => {
    const opts: ReportGenerateOptions = { ...(reportYearOptions ?? {}) };
    if (report.usesChartColors && Object.keys(chartColors).length > 0) {
      opts.chartColors = withDefaultPlotBackground(chartColors);
    }
    if (report.usesFdRatings) {
      opts.ratingPeriod1 = ratingPeriod1Label;
      opts.ratingPeriod2 = ratingPeriod2Label;
      opts.ratings = Object.fromEntries(
        fdInstitutionRows.map((row) => [
          row.institution,
          {
            period1: institutionRatings[row.institution]?.period1 ?? "",
            period2: institutionRatings[row.institution]?.period2 ?? "",
          },
        ]),
      );
    }
    if (report.usesInstitutionRatings) {
      opts.agreedRatingLabel = agreedRatingLabel;
      opts.ratings = Object.fromEntries(
        institutionRatingRows.map((row) => [
          row.institution,
          { current: institutionCurrentRatings[row.institution] ?? "" },
        ]),
      );
    }
    if (dataSource === "itms" && report.needsSavingsLoans) {
      const savingsRaw = itmsSavings.trim().replace(/,/g, "");
      const loansRaw = itmsLoans.trim().replace(/,/g, "");
      opts.savings = savingsRaw === "" ? 0 : Number(savingsRaw);
      opts.loans = loansRaw === "" ? 0 : Number(loansRaw);
    }
    return Object.keys(opts).length > 0 ? opts : undefined;
  }, [
    report,
    reportYearOptions,
    chartColors,
    ratingPeriod1Label,
    ratingPeriod2Label,
    fdInstitutionRows,
    institutionRatings,
    agreedRatingLabel,
    institutionRatingRows,
    institutionCurrentRatings,
    dataSource,
    itmsSavings,
    itmsLoans,
  ]);

  const setPreview = useCallback((url: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }, []);

  useEffect(() => {
    setPreview(null);
    setPreviewMeta(null);
    setStatus({ kind: "idle" });
  }, [
    file,
    pageNumber,
    scheduleLabel,
    chartColors,
    reportId,
    maturityYear,
    maturityMonth,
    ratingPeriod1Date,
    ratingPeriod2Date,
    dataSource,
    itmsAsAtDate,
    setPreview,
  ]);

  useEffect(() => {
    // Excel path only — ITMS Schedule C5 sets chart segments after Load from ITMS.
    if (dataSource === "itms") return;
    if (!file || !inspectResult || !report.usesChartColors) {
      setChartSegments([]);
      return;
    }
    let cancelled = false;
    previewReport(reportId, file, pageNumber, scheduleLabel, reportYearOptions)
      .then((meta) => {
        if (cancelled) return;
        const segments =
          meta && typeof meta === "object" && "chartSegments" in meta && Array.isArray(meta.chartSegments)
            ? meta.chartSegments
            : [];
        setChartSegments(segments);
        setChartColors((prev) => {
          const next: ChartColorMap = {};
          segments.forEach((label, i) => {
            next[label] = prev[label] ?? defaultChartColorForSegment(reportId, i);
          });
          return withDefaultPlotBackground({ ...prev, ...next });
        });
      })
      .catch(() => {
        if (!cancelled) setChartSegments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [file, inspectResult, report, reportId, pageNumber, scheduleLabel, reportYearOptions, dataSource]);

  useEffect(() => {
    if (reportId !== "institution-rating" || !inspectResult) {
      setInstitutionRatingRows([]);
      return;
    }
    if (dataSource === "excel" && !file) {
      setInstitutionRatingRows([]);
      return;
    }
    if (dataSource === "itms" && !itmsAsAtDate) {
      setInstitutionRatingRows([]);
      return;
    }

    let cancelled = false;
    const opts = {
      agreedRatingLabel,
      ...(dataSource === "itms"
        ? {
            savings: itmsSavings.trim() === "" ? 0 : Number(itmsSavings.trim().replace(/,/g, "")),
            loans: itmsLoans.trim() === "" ? 0 : Number(itmsLoans.trim().replace(/,/g, "")),
          }
        : {}),
    };

    const load =
      dataSource === "itms"
        ? previewReportFromItms(reportId, itmsAsAtDate, pageNumber, scheduleLabel, opts)
        : previewReport(reportId, file!, pageNumber, scheduleLabel, opts);

    load
      .then((meta) => {
        if (cancelled || !isInstitutionRatingPreview(meta)) return;
        const rows = meta.rows.map((r) => ({
          institution: r.institution,
          total: r.total,
          share: r.share,
        }));
        setInstitutionRatingRows(rows);
        setInstitutionCurrentRatings((prev) => {
          const next = { ...prev };
          for (const row of meta.rows) {
            if (next[row.institution] === undefined) {
              next[row.institution] = row.currentRating;
            }
          }
          const names = meta.rows.map((r) => r.institution);
          for (const key of Object.keys(next)) {
            if (!names.includes(key)) delete next[key];
          }
          return next;
        });
        if (meta.chartSegments?.length) {
          const segments = meta.chartSegments;
          setChartSegments(segments);
          setChartColors((prev) => {
            const next: ChartColorMap = {};
            segments.forEach((label, i) => {
              next[label] = prev[label] ?? defaultChartColorForSegment("institution-rating", i);
            });
            return withDefaultPlotBackground({ ...prev, ...next });
          });
        }
      })
      .catch(() => {
        if (!cancelled) setInstitutionRatingRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [
    file,
    reportId,
    inspectResult,
    pageNumber,
    scheduleLabel,
    agreedRatingLabel,
    dataSource,
    itmsAsAtDate,
    itmsSavings,
    itmsLoans,
  ]);

  useEffect(() => {
    if (!file || reportId !== "schedule-c5" || !inspectResult || dataSource !== "excel") {
      if (dataSource === "excel") setFdInstitutionRows([]);
      return;
    }
    let cancelled = false;
    previewReport("schedule-c5", file, pageNumber, scheduleLabel, {
      ratingPeriod1: ratingPeriod1Label,
      ratingPeriod2: ratingPeriod2Label,
    })
      .then((meta) => {
        if (cancelled || !isScheduleC5Preview(meta)) return;
        const rows = meta.institutions.map((r) => ({
          institution: r.institution,
          amount: r.amount,
          share: r.share,
        }));
        setFdInstitutionRows(rows);
        const names = rows.map((r) => r.institution);
        setInstitutionRatings((prev) => {
          const next = { ...prev };
          for (const row of meta.institutions) {
            if (!next[row.institution]) {
              next[row.institution] = {
                period1: row.ratingPeriod1,
                period2: row.ratingPeriod2,
              };
            }
          }
          for (const key of Object.keys(next)) {
            if (!names.includes(key)) delete next[key];
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setFdInstitutionRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [file, reportId, inspectResult, pageNumber, scheduleLabel, ratingPeriod1Label, ratingPeriod2Label, dataSource]);

  useEffect(() => {
    if (
      dataSource !== "itms" ||
      !inspectResult ||
      !itmsAsAtDate ||
      !report.usesChartColors ||
      reportId === "schedule-c5"
    ) {
      return;
    }
    let cancelled = false;
    previewReportFromItms(reportId, itmsAsAtDate, pageNumber, scheduleLabel, reportYearOptions)
      .then((meta) => {
        if (cancelled) return;
        const segments =
          meta && typeof meta === "object" && "chartSegments" in meta && Array.isArray(meta.chartSegments)
            ? meta.chartSegments
            : [];
        setChartSegments(segments);
        setChartColors((prev) => {
          const next: ChartColorMap = {};
          segments.forEach((label, i) => {
            next[label] = prev[label] ?? defaultChartColorForSegment(reportId, i);
          });
          return withDefaultPlotBackground({ ...prev, ...next });
        });
      })
      .catch(() => {
        if (!cancelled) setChartSegments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [
    dataSource,
    inspectResult,
    itmsAsAtDate,
    reportId,
    report.usesChartColors,
    pageNumber,
    scheduleLabel,
    reportYearOptions,
  ]);

  useEffect(() => {
    if (reportId !== "schedule-c5" || !inspectResult || dataSource !== "itms" || !itmsAsAtDate) {
      if (dataSource === "itms" && reportId !== "schedule-c5") setFdInstitutionRows([]);
      return;
    }
    let cancelled = false;
    previewScheduleC5FromItms(itmsAsAtDate, pageNumber, scheduleLabel, {
      ratingPeriod1: ratingPeriod1Label,
      ratingPeriod2: ratingPeriod2Label,
    })
      .then((meta) => {
        if (cancelled) return;
        const rows = meta.institutions.map((r) => ({
          institution: r.institution,
          amount: r.amount,
          share: r.share,
        }));
        setFdInstitutionRows(rows);
        const names = rows.map((r) => r.institution);
        setInstitutionRatings((prev) => {
          const next = { ...prev };
          for (const row of meta.institutions) {
            if (!next[row.institution]) {
              next[row.institution] = {
                period1: row.ratingPeriod1,
                period2: row.ratingPeriod2,
              };
            }
          }
          for (const key of Object.keys(next)) {
            if (!names.includes(key)) delete next[key];
          }
          return next;
        });
        // Same chart-colour pickers as Excel C5 — one colour per institution pie slice.
        if (meta.chartSegments?.length) {
          const segments = meta.chartSegments;
          setChartSegments(segments);
          setChartColors((prev) => {
            const next: ChartColorMap = {};
            segments.forEach((label, i) => {
              next[label] = prev[label] ?? defaultChartColorForSegment("schedule-c5", i);
            });
            return withDefaultPlotBackground({ ...prev, ...next });
          });
        } else {
          setChartSegments(names);
          setChartColors((prev) => {
            const next: ChartColorMap = {};
            names.forEach((label, i) => {
              next[label] = prev[label] ?? defaultChartColorForSegment("schedule-c5", i);
            });
            return withDefaultPlotBackground({ ...prev, ...next });
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFdInstitutionRows([]);
          setChartSegments([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    reportId,
    inspectResult,
    dataSource,
    itmsAsAtDate,
    pageNumber,
    scheduleLabel,
    ratingPeriod1Label,
    ratingPeriod2Label,
  ]);

  useEffect(() => {
    if (!reportSupportsItms(reportId)) {
      setDataSource("excel");
      setItmsAsAtDate("");
    }
    if (reportId !== "schedule-c5") {
      setRatingPeriod1Date("");
      setRatingPeriod2Date("");
      setInstitutionRatings({});
      setFdInstitutionRows([]);
    }
    if (reportId !== "institution-rating") {
      setAgreedRatingLabel("A & above");
      setInstitutionCurrentRatings({});
      setInstitutionRatingRows([]);
    }
  }, [reportId, file]);

  useEffect(() => {
    if (dataSource !== "excel") {
      return;
    }
    if (!file) {
      setInspectResult(null);
      return;
    }
    let cancelled = false;
    setInspecting(true);
    setStatus({ kind: "loading", message: "Reading portfolio…" });
    inspectMaster(file)
      .then((result) => {
        if (cancelled) return;
        setInspectResult(result);
        const y = yearFromAsAtLabel(result.asAtLabel);
        if (y) setMaturityYear(y);
        if (!result.reconciliation.ok) {
          setStatus({
            kind: "error",
            message:
              "Portfolio parsed but totals do not reconcile — preview is available; PDF/Excel download will be blocked until the file structure matches.",
          });
        } else {
          setStatus({ kind: "ready" });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setInspectResult(null);
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
  }, [file, dataSource]);

  const loadFromItms = useCallback(async () => {
    if (!itmsAsAtDate) {
      setStatus({ kind: "error", message: "Choose an as-at date before loading from ITMS." });
      return;
    }
    if (!getStoredItmsToken()) {
      setStatus({
        kind: "error",
        message: "Sign in to ITMS first (same username and password as the ITMS application).",
      });
      setItmsSignedIn(false);
      return;
    }
    setInspecting(true);
    setStatus({ kind: "loading", message: "Loading ITMS portfolio holdings…" });
    try {
      const result = await inspectItmsPortfolio(itmsAsAtDate);
      setInspectResult(result);
      const y = yearFromAsAtLabel(result.asAtLabel);
      if (y) setMaturityYear(y);
      setStatus({ kind: "ready" });
    } catch (err) {
      setInspectResult(null);
      const message = err instanceof Error ? err.message : String(err);
      if (/401|invalid token|sign in|login/i.test(message)) {
        clearStoredItmsSession();
        setItmsSignedIn(false);
        setStatus({
          kind: "error",
          message: "ITMS session expired. Sign in again, then Load from ITMS.",
        });
      } else {
        setStatus({ kind: "error", message });
      }
    } finally {
      setInspecting(false);
    }
  }, [itmsAsAtDate]);

  const signInToItms = useCallback(async () => {
    if (!itmsUsername.trim() || !itmsPassword) {
      setStatus({ kind: "error", message: "Enter your ITMS username and password." });
      return;
    }
    setItmsSigningIn(true);
    setStatus({ kind: "loading", message: "Signing in to ITMS…" });
    try {
      const result = await loginToItms(itmsUsername, itmsPassword);
      setItmsPassword("");
      setItmsSignedIn(true);
      setStatus({
        kind: "ready",
        message: `Signed in to ITMS as ${result.user?.username ?? itmsUsername.trim()}.`,
      });
    } catch (err) {
      setItmsSignedIn(false);
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setItmsSigningIn(false);
    }
  }, [itmsUsername, itmsPassword]);

  const signOutItms = useCallback(() => {
    clearStoredItmsSession();
    setItmsSignedIn(false);
    setItmsUsername("");
    setItmsPassword("");
    setInspectResult(null);
    setFdInstitutionRows([]);
    setChartSegments([]);
    setStatus({ kind: "idle", message: "Signed out of ITMS." });
  }, []);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const handleFiles = useCallback((files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) {
      setStatus({ kind: "error", message: "Please select a .xlsx master file." });
      return;
    }
    setFile(f);
  }, []);

  const onReportChange = useCallback((id: ReportId) => {
    const meta = REPORTS.find((r) => r.id === id)!;
    setReportId(id);
    if (meta.usesPageNumber) setPageNumber(meta.defaultPage);
    if (meta.usesScheduleNumber) setScheduleLabel(meta.defaultSchedule);
    setChartSegments([]);
    setChartColors({});
  }, []);

  const runPreview = useCallback(async () => {
    const portfolioReady =
      dataSource === "excel" ? Boolean(file && inspectResult) : Boolean(itmsAsAtDate && inspectResult);
    if (!portfolioReady) return;
    setPreviewing(true);
    setStatus({ kind: "loading", message: "Generating preview…" });
    try {
      const opts = reportGenerateOptions;
      if (dataSource === "itms" && reportSupportsItms(reportId)) {
        const meta = await previewReportFromItms(
          reportId,
          itmsAsAtDate,
          pageNumber,
          scheduleLabel,
          opts,
        );
        const { blob } = await generateReportFromItms(
          reportId,
          itmsAsAtDate,
          pageNumber,
          scheduleLabel,
          "pdf",
          opts,
          true,
        );
        const url = URL.createObjectURL(blob);
        setPreviewMeta(meta);
        setPreview(url);
      } else if (file) {
        const [meta, url] = await Promise.all([
          previewReport(reportId, file, pageNumber, scheduleLabel, opts),
          previewReportPdf(reportId, file, pageNumber, scheduleLabel, opts),
        ]);
        setPreviewMeta(meta);
        setPreview(url);
      }
      setStatus({ kind: "ready" });
    } catch (err) {
      setPreview(null);
      setPreviewMeta(null);
      setStatus({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    } finally {
      setPreviewing(false);
    }
  }, [
    file,
    pageNumber,
    scheduleLabel,
    reportId,
    reportGenerateOptions,
    setPreview,
    dataSource,
    itmsAsAtDate,
    inspectResult,
  ]);

  const runDownload = useCallback(
    async (format: ReportFormat) => {
      const portfolioReady =
        dataSource === "excel" ? Boolean(file) : Boolean(itmsAsAtDate && inspectResult);
      if (!portfolioReady) return;
      setBusyFormat(format);
      setStatus({ kind: "loading", message: `Generating ${format.toUpperCase()}…` });
      try {
        const opts = reportGenerateOptions;
        const { blob, filename } =
          dataSource === "itms" && reportSupportsItms(reportId)
            ? await generateReportFromItms(
                reportId,
                itmsAsAtDate,
                pageNumber,
                scheduleLabel,
                format,
                opts,
              )
            : await generateReport(reportId, file!, pageNumber, scheduleLabel, format, opts);
        downloadBlob(blob, filename);
        setStatus({ kind: "ready" });
      } catch (err) {
        setStatus({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        setBusyFormat(null);
      }
    },
    [
      file,
      pageNumber,
      scheduleLabel,
      reportId,
      reportGenerateOptions,
      dataSource,
      itmsAsAtDate,
      inspectResult,
    ],
  );

  const runDownloadAllMonths = useCallback(
    async (format: ReportFormat) => {
      const portfolioReady =
        dataSource === "excel" ? Boolean(file) : Boolean(itmsAsAtDate && inspectResult);
      if (!portfolioReady) return;
      setBusyAllMonths(format);
      setStatus({ kind: "loading", message: `Generating all months (${format.toUpperCase()})…` });
      try {
        const opts = {
          year: maturityYear,
          month: maturityMonth,
          scope: "all-months" as const,
          chartColors: reportGenerateOptions?.chartColors,
        };
        const { blob, filename } =
          dataSource === "itms" && reportSupportsItms(reportId)
            ? await generateReportFromItms(
                reportId,
                itmsAsAtDate,
                pageNumber,
                scheduleLabel,
                format,
                opts,
              )
            : await generateReport(reportId, file!, pageNumber, scheduleLabel, format, opts);
        downloadBlob(blob, filename);
        setStatus({ kind: "ready" });
      } catch (err) {
        setStatus({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        setBusyAllMonths(null);
      }
    },
    [
      file,
      maturityMonth,
      maturityYear,
      pageNumber,
      scheduleLabel,
      reportId,
      dataSource,
      itmsAsAtDate,
      inspectResult,
      reportGenerateOptions?.chartColors,
    ],
  );

  const canGenerate =
    dataSource === "excel"
      ? Boolean(file && inspectResult && !inspecting)
      : Boolean(itmsAsAtDate && inspectResult && !inspecting);
  const canDownload = canGenerate && inspectResult?.reconciliation.ok;

  const inspectSummary = inspectResult ? (
    <div className={`inspect-panel${inspectResult.reconciliation.ok ? "" : " warn"}`}>
      <div className="inspect-head">
        <strong>{inspectResult.entity}</strong>
        <span className="muted">{inspectResult.asAtLabel}</span>
      </div>
      <div className="inspect-meta muted">
        Sheet: <code>{inspectResult.sheetName}</code> · {inspectResult.holdings} holdings ·{" "}
        {inspectResult.sections.length} sections ·{" "}
        {inspectResult.reconciliation.ok ? "totals reconcile" : "reconciliation failed"}
      </div>
      {!inspectResult.reconciliation.ok && (
        <ul className="inspect-failures">
          {inspectResult.reconciliation.failures.map((f) => (
            <li key={f.name}>
              {f.name} (diff Rs. {Number(f.difference).toLocaleString("en-LK")})
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;

  const previewSummary = previewMeta ? (
    <div className="preview-summary muted">
      <span>{previewMeta.asAtLabel}</span>
      {isC3Preview(previewMeta) ? (
        <span>
          Maturity year: {previewMeta.maturityYear} · {previewMeta.rowCount} rows · Total Rs.{" "}
          {Number(previewMeta.grandTotal).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : isInvestmentMaturitiesPreview(previewMeta) ? (
        <span>
          {previewMeta.year} · {previewMeta.sections[0]?.title ?? "No section"} ·{" "}
          {previewMeta.sections[0]?.rowCount ?? 0} maturities
        </span>
      ) : isMonthMaturitySummaryPreview(previewMeta) ? (
        <span>
          {previewMeta.year} · {previewMeta.months.length} months · Total Rs.{" "}
          {Number(previewMeta.grandTotal).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : isScheduleC4Preview(previewMeta) ? (
        <span>
          {previewMeta.years.length} years · Maturities Rs.{" "}
          {Number(previewMeta.totalMaturities).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : isPortfolioSharePreview(previewMeta) ? (
        <span>
          {previewMeta.lines.length} categories · Total portfolio Rs.{" "}
          {Number(previewMeta.totalPortfolio).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : isScheduleC6iPreview(previewMeta) ? (
        <span>
          {previewMeta.rowCount} debentures · {previewMeta.years.length} years · Total Rs.{" "}
          {Number(previewMeta.grandTotal).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : isScheduleC6Preview(previewMeta) ? (
        <span>
          {previewMeta.institutions.length} institutions · Total Debentures Rs.{" "}
          {Number(previewMeta.grandTotal).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : isScheduleC5Preview(previewMeta) ? (
        <span>
          {previewMeta.institutions.length} institutions · Total FDs Rs.{" "}
          {Number(previewMeta.grandTotal).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : isInstitutionRatingPreview(previewMeta) ? (
        <span>
          {previewMeta.rows.length} institutions · Total Rs.{" "}
          {Number(previewMeta.institutionTotal).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : isMaturityWisePreview(previewMeta) ? (
        <span>
          {previewMeta.yearCount} years · {previewMeta.rowCount} holdings · Total Rs.{" "}
          {Number(previewMeta.investmentsTotal).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : null}
    </div>
  ) : null;

  const usingItms = reportSupportsItms(reportId) && dataSource === "itms";
  const dataReady = Boolean(inspectResult);
  const uploadStepDone = usingItms ? dataReady : Boolean(file);
  const readinessItems = [
    { label: "Report selected", done: true },
    {
      label: usingItms ? "ITMS holdings loaded" : "Master file uploaded",
      done: dataReady,
    },
    {
      label: "Ready to generate",
      done: Boolean(canGenerate && canDownload),
    },
  ];

  return (
    <div className="page app-shell">
      <header className="app-header">
        <div className="app-brand">
          <h1>Portfolio Report Generator</h1>
          <p>The Mercantile Service Provident Society</p>
        </div>
      </header>

      <main className="app-body">
        <nav className="mode-tabs" aria-label="Application mode">
          <button
            type="button"
            className={`mode-tab${mode === "reports" ? " active" : ""}`}
            onClick={() => setMode("reports")}
          >
            Generate reports
          </button>
          <button
            type="button"
            className={`mode-tab${mode === "convert" ? " active" : ""}`}
            onClick={() => setMode("convert")}
          >
            Convert portfolio
          </button>
        </nav>

        {mode === "convert" ? (
          <div className="convert-pane panel">
            <ConvertPortfolio
              onUseForReports={(converted) => {
                setFile(converted);
                setMode("reports");
              }}
            />
          </div>
        ) : (
          <div className="workspace">
            <div className="setup-pane">
              <ol className="progress-track" aria-label="Report steps">
                <li className="progress-item done">
                  <span className="progress-dot">1</span>
                  <span>Choose report</span>
                </li>
                <li className={`progress-item${uploadStepDone ? " done" : " current"}`}>
                  <span className="progress-dot">2</span>
                  <span>{usingItms ? "Load data" : "Upload file"}</span>
                </li>
                <li className={`progress-item${canGenerate ? " done" : dataReady ? " current" : ""}`}>
                  <span className="progress-dot">3</span>
                  <span>Generate</span>
                </li>
              </ol>

              <section className="panel">
                <div className="panel-head">
                  <h3>Report</h3>
                </div>
                <label className="field grow">
                  <span>Report type</span>
                  <select value={reportId} onChange={(e) => onReportChange(e.target.value as ReportId)}>
                    {REPORTS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="panel-note muted">{report.description}</p>
              </section>

              {reportSupportsItms(reportId) && (
                <section className="panel">
                  <div className="panel-head">
                    <h3>Data source</h3>
                  </div>
                  <div className="source-cards" role="radiogroup" aria-label="Data source">
                    <button
                      type="button"
                      className={`source-card${dataSource === "excel" ? " selected" : ""}`}
                      onClick={() => {
                        setDataSource("excel");
                        setInspectResult(null);
                        setChartSegments([]);
                        setChartColors({});
                        setPreview(null);
                        setPreviewMeta(null);
                      }}
                    >
                      <span className="source-card-title">Master Excel</span>
                      <span className="source-card-desc muted">
                        Upload the Schedule B Inv Portfolio file.
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`source-card${dataSource === "itms" ? " selected" : ""}`}
                      onClick={() => {
                        setDataSource("itms");
                        setFile(null);
                        setInspectResult(null);
                        setChartSegments([]);
                        setChartColors({});
                        setFdInstitutionRows([]);
                        setPreview(null);
                        setPreviewMeta(null);
                      }}
                    >
                      <span className="source-card-title">ITMS live data</span>
                      <span className="source-card-desc muted">
                        Load FD, Repo, Debenture, and GSec holdings from ITMS.
                      </span>
                    </button>
                  </div>
                </section>
              )}

              {usingItms ? (
                <section className="panel itms-panel">
                  <div className="panel-head">
                    <h3>ITMS connection</h3>
                  </div>

                  <ol className="itms-steps">
                    <li className={`itms-step${itmsSignedIn ? " done" : " active"}`}>
                      <div className="itms-step-head">
                        <span className="itms-step-num">A</span>
                        <div>
                          <strong>Sign in</strong>
                          <p className="muted step-hint">
                            Same username and password as ITMS. Password is not saved.
                          </p>
                        </div>
                      </div>
                      {itmsSignedIn ? (
                        <div className="itms-session">
                          <span className="session-badge">Connected</span>
                          <span>
                            Signed in as <strong>{getStoredItmsUsername() ?? "ITMS user"}</strong>
                          </span>
                          <button type="button" className="btn ghost small" onClick={signOutItms}>
                            Sign out
                          </button>
                        </div>
                      ) : (
                        <form
                          className="itms-login-grid"
                          autoComplete="off"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void signInToItms();
                          }}
                        >
                          <label className="field grow">
                            <span>Username</span>
                            <input
                              type="text"
                              name="itms-username"
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="none"
                              spellCheck={false}
                              value={itmsUsername}
                              onChange={(e) => setItmsUsername(e.target.value)}
                              placeholder="Enter your ITMS username"
                            />
                          </label>
                          <label className="field grow">
                            <span>Password</span>
                            <input
                              type="password"
                              name="itms-password"
                              autoComplete="new-password"
                              value={itmsPassword}
                              onChange={(e) => setItmsPassword(e.target.value)}
                              placeholder="Enter your ITMS password"
                            />
                          </label>
                          <button
                            type="submit"
                            className="btn"
                            disabled={itmsSigningIn}
                          >
                            {itmsSigningIn ? "Signing in…" : "Sign in"}
                          </button>
                        </form>
                      )}
                    </li>

                    <li
                      className={`itms-step${itmsSignedIn && !inspectResult ? " active" : ""}${inspectResult ? " done" : ""}${!itmsSignedIn ? " locked" : ""}`}
                    >
                      <div className="itms-step-head">
                        <span className="itms-step-num">B</span>
                        <div>
                          <strong>As-at date &amp; load</strong>
                          <p className="muted step-hint">
                            Holdings live on this date (started on or before, not yet matured).
                          </p>
                        </div>
                      </div>
                      <div className="itms-load-row">
                        <label className="field grow">
                          <span>Portfolio as-at date</span>
                          <input
                            type="date"
                            value={itmsAsAtDate}
                            disabled={!itmsSignedIn}
                            onChange={(e) => {
                              setItmsAsAtDate(e.target.value);
                              setInspectResult(null);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => void loadFromItms()}
                          disabled={!itmsAsAtDate || !itmsSignedIn || inspecting}
                        >
                          {inspecting ? "Loading…" : "Load holdings"}
                        </button>
                      </div>
                    </li>
                  </ol>
                </section>
              ) : (
                <section className="panel">
                  <div className="panel-head">
                    <h3>Master file</h3>
                    {file ? <span className="chip ok-chip">Ready</span> : <span className="chip">Required</span>}
                  </div>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        inputRef.current?.click();
                      }
                    }}
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
                        <span className="dz-icon" aria-hidden>
                          ✓
                        </span>
                        <span className="file-name">{file.name}</span>
                        <span className="muted">
                          {(file.size / 1024).toFixed(0)} KB — click to replace
                        </span>
                      </div>
                    ) : (
                      <div className="dz-hint">
                        <span className="dz-icon" aria-hidden>
                          ↑
                        </span>
                        <strong>Drop master .xlsx here</strong>
                        <span className="muted">or click to browse your computer</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {inspectSummary}

              {usingItms && report.needsSavingsLoans && (
                <section className="panel">
                  <div className="panel-head">
                    <h3>Portfolio extras</h3>
                    <span className="chip">Required for this report</span>
                  </div>
                  <p className="muted ratings-hint">
                    Not available from ITMS — enter Savings A/C and Loans to Members for this run.
                    Leave blank to treat as 0.
                  </p>
                  <div className="ratings-periods">
                    <label className="field">
                      <span>Savings A/C (Rs.)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={itmsSavings}
                        onChange={(e) => setItmsSavings(e.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Loans to Members (Rs.)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={itmsLoans}
                        onChange={(e) => setItmsLoans(e.target.value)}
                      />
                    </label>
                  </div>
                </section>
              )}

              {report.usesFdRatings && fdInstitutionRows.length > 0 && (
                <section className="panel ratings-panel">
                  <div className="panel-head">
                    <h3>Credit ratings</h3>
                    <span className="chip">Optional</span>
                  </div>
                  <p className="muted ratings-hint">
                    Pick rating dates and enter each bank&apos;s rating. Not stored — this run only.
                  </p>
                  <div className="ratings-periods">
                    <label className="field">
                      <span>Rating period 1</span>
                      <input
                        type="date"
                        value={ratingPeriod1Date}
                        onChange={(e) => setRatingPeriod1Date(e.target.value)}
                      />
                      {ratingPeriod1Label ? (
                        <span className="muted period-preview">Column: {ratingPeriod1Label}</span>
                      ) : null}
                    </label>
                    <label className="field">
                      <span>Rating period 2</span>
                      <input
                        type="date"
                        value={ratingPeriod2Date}
                        onChange={(e) => setRatingPeriod2Date(e.target.value)}
                      />
                      {ratingPeriod2Label ? (
                        <span className="muted period-preview">Column: {ratingPeriod2Label}</span>
                      ) : null}
                    </label>
                  </div>
                  <div className="ratings-table-wrap">
                    <table className="grid ratings-table">
                      <thead>
                        <tr>
                          <th>Institution</th>
                          <th className="num">Amount (Rs.)</th>
                          <th>{ratingPeriod1Label || "Period 1"}</th>
                          <th>{ratingPeriod2Label || "Period 2"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fdInstitutionRows.map((row) => (
                          <tr key={row.institution}>
                            <td>{row.institution}</td>
                            <td className="num">
                              {Number(row.amount).toLocaleString("en-LK", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td>
                              <input
                                className="rating-input"
                                type="text"
                                placeholder="e.g. A+"
                                value={institutionRatings[row.institution]?.period1 ?? ""}
                                onChange={(e) =>
                                  setInstitutionRatings((prev) => ({
                                    ...prev,
                                    [row.institution]: {
                                      ...prev[row.institution],
                                      period1: e.target.value,
                                      period2: prev[row.institution]?.period2 ?? "",
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="rating-input"
                                type="text"
                                placeholder="e.g. AA-"
                                value={institutionRatings[row.institution]?.period2 ?? ""}
                                onChange={(e) =>
                                  setInstitutionRatings((prev) => ({
                                    ...prev,
                                    [row.institution]: {
                                      period1: prev[row.institution]?.period1 ?? "",
                                      period2: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {report.usesInstitutionRatings && institutionRatingRows.length > 0 && (
                <section className="panel ratings-panel">
                  <div className="panel-head">
                    <h3>Credit ratings</h3>
                    <span className="chip">Optional</span>
                  </div>
                  <p className="muted ratings-hint">
                    Enter each bank&apos;s current rating. Optional — this run only.
                  </p>
                  <label className="field">
                    <span>Agreed rating (target)</span>
                    <input
                      type="text"
                      value={agreedRatingLabel}
                      onChange={(e) => setAgreedRatingLabel(e.target.value)}
                      placeholder="A & above"
                    />
                  </label>
                  <div className="ratings-table-wrap">
                    <table className="grid ratings-table">
                      <thead>
                        <tr>
                          <th>Institution</th>
                          <th className="num">Total (Rs.)</th>
                          <th>Current rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {institutionRatingRows.map((row) => (
                          <tr key={row.institution}>
                            <td>{row.institution}</td>
                            <td className="num">
                              {Number(row.total).toLocaleString("en-LK", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td>
                              <input
                                className="rating-input"
                                type="text"
                                placeholder="e.g. AA-"
                                value={institutionCurrentRatings[row.institution] ?? ""}
                                onChange={(e) =>
                                  setInstitutionCurrentRatings((prev) => ({
                                    ...prev,
                                    [row.institution]: e.target.value,
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {report.usesChartColors && chartSegments.length > 0 && (
                <section className="panel chart-colors-panel">
                  <div className="panel-head">
                    <h3>Chart colours</h3>
                    <span className="chip">Optional</span>
                  </div>
                  <p className="chart-colors-hint muted">
                    Pick colours for chart segments. Bar charts also use the plot background below.
                  </p>
                  <div className="chart-colors-grid">
                    {chartSegments.map((segment, index) => (
                      <label key={segment} className="chart-color-row">
                        <span className="chart-color-label" title={segment}>
                          {segment}
                        </span>
                        <input
                          type="color"
                          value={chartColors[segment] ?? defaultChartColorForSegment(reportId, index)}
                          onChange={(e) =>
                            setChartColors((prev) =>
                              withDefaultPlotBackground({ ...prev, [segment]: e.target.value }),
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <p className="chart-colors-hint muted" style={{ marginTop: 14 }}>
                    Bar chart background (peach gradient + border by default — customise freely).
                  </p>
                  <div className="chart-colors-grid">
                    {PLOT_BG_LABELS.map(({ key, label }) => (
                      <label key={key} className="chart-color-row">
                        <span className="chart-color-label" title={label}>
                          {label}
                        </span>
                        <input
                          type="color"
                          value={
                            chartColors[key] ??
                            withDefaultPlotBackground()[key]
                          }
                          onChange={(e) =>
                            setChartColors((prev) =>
                              withDefaultPlotBackground({ ...prev, [key]: e.target.value }),
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {status.kind === "error" && <div className="banner error">{status.message}</div>}
              {status.kind === "loading" && <div className="banner info">{status.message}</div>}
              {status.kind === "ready" && status.message && (
                <div className="banner ok">{status.message}</div>
              )}

              {previewSummary}

              {previewUrl && (
                <section className="pdf-preview panel">
                  <div className="preview-bar">
                    <span className="muted">Preview — {report.label}</span>
                    <div className="preview-actions">
                      <button className="btn ghost small" onClick={() => runDownload("pdf")}>
                        Download PDF
                      </button>
                      <button className="btn ghost small" onClick={() => runDownload("xlsx")}>
                        Download Excel
                      </button>
                    </div>
                  </div>
                  <iframe className="preview-frame" title="Report preview" src={previewUrl} />
                </section>
              )}
            </div>

            <aside className="action-pane">
              <div className="action-card">
                <h3>Generate</h3>
                <p className="muted action-lede">
                  {!canGenerate
                    ? usingItms
                      ? "Sign in and load holdings to unlock preview and download."
                      : "Upload a master Excel file to unlock preview and download."
                    : canDownload
                      ? "Portfolio looks good. Preview or download below."
                      : "File loaded, but totals do not reconcile — fix before download."}
                </p>

                <ul className="ready-list">
                  {readinessItems.map((item) => (
                    <li key={item.label} className={item.done ? "ready-done" : ""}>
                      <span className="ready-mark" aria-hidden>
                        {item.done ? "✓" : "○"}
                      </span>
                      {item.label}
                    </li>
                  ))}
                </ul>

                <div className="action-fields">
                  {report.usesYearPicker && (
                    <label className="field grow">
                      <span>Year</span>
                      <input
                        type="number"
                        min={2000}
                        max={2100}
                        value={maturityYear}
                        onChange={(e) => setMaturityYear(Number(e.target.value) || 2026)}
                      />
                    </label>
                  )}
                  {report.usesMaturityPeriod && (
                    <label className="field grow">
                      <span>Month</span>
                      <select
                        value={maturityMonth}
                        onChange={(e) => setMaturityMonth(Number(e.target.value))}
                      >
                        {MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {report.usesScheduleNumber && (
                    <label className="field grow">
                      <span>Schedule number</span>
                      <input
                        type="text"
                        value={scheduleLabel}
                        onChange={(e) => setScheduleLabel(e.target.value)}
                        placeholder={report.defaultSchedule || "e.g. Schedule - C (3)"}
                      />
                    </label>
                  )}
                  {report.usesPageNumber && (
                    <label className="field grow">
                      <span>Page number</span>
                      <input
                        type="number"
                        min={1}
                        value={pageNumber}
                        onChange={(e) => setPageNumber(Number(e.target.value) || 1)}
                      />
                    </label>
                  )}
                </div>

                <div className="action-buttons">
                  <button
                    className="btn btn-block"
                    disabled={!canGenerate || previewing}
                    onClick={runPreview}
                  >
                    {previewing ? "Generating…" : "Preview report"}
                  </button>
                  <button
                    className="btn ghost btn-block"
                    disabled={!canDownload || busyFormat !== null}
                    onClick={() => runDownload("pdf")}
                    title={
                      !canDownload
                        ? "Fix portfolio parsing/reconciliation before download"
                        : undefined
                    }
                  >
                    {busyFormat === "pdf" ? "Generating…" : "Download PDF"}
                  </button>
                  <button
                    className="btn ghost btn-block"
                    disabled={!canDownload || busyFormat !== null}
                    onClick={() => runDownload("xlsx")}
                    title={
                      !canDownload
                        ? "Fix portfolio parsing/reconciliation before download"
                        : undefined
                    }
                  >
                    {busyFormat === "xlsx" ? "Generating…" : "Download Excel"}
                  </button>
                </div>

                {report.usesMaturityPeriod && (
                  <div className="action-extra">
                    <span className="muted action-hint">All months in {maturityYear}</span>
                    <div className="action-buttons tight">
                      <button
                        className="btn ghost small"
                        disabled={!canDownload || busyAllMonths !== null}
                        onClick={() => runDownloadAllMonths("pdf")}
                      >
                        {busyAllMonths === "pdf" ? "Generating…" : "All months PDF"}
                      </button>
                      <button
                        className="btn ghost small"
                        disabled={!canDownload || busyAllMonths !== null}
                        onClick={() => runDownloadAllMonths("xlsx")}
                      >
                        {busyAllMonths === "xlsx" ? "Generating…" : "All months Excel"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      <footer className="app-footer">Runs offline · no data is stored on the server.</footer>
    </div>
  );
}
