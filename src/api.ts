export type ReportFormat = "pdf" | "xlsx";
export type ReportId =
  | "schedule-c3"
  | "maturity-wise"
  | "investment-maturities"
  | "month-maturity-summary"
  | "schedule-c5"
  | "schedule-c6"
  | "schedule-c6i"
  | "portfolio-share"
  | "institution-rating"
  | "schedule-c4";
export type InvestmentMaturitiesScope = "month" | "all-months";

export interface ReconciliationPreview {
  ok: boolean;
  failures: { name: string; difference: string }[];
}

export interface MasterInspectResult {
  sheetName: string;
  entity: string;
  asAtLabel: string;
  holdings: number;
  sections: { kind: string; label: string; holdings: number; declared: string; computed: string }[];
  worksheets: {
    name: string;
    score: number;
    dataRows: number;
    sectionTotals: number;
    hasTotalInvestments: boolean;
    looksLikeReportOutput: boolean;
    selected: boolean;
  }[];
  reconciliation: ReconciliationPreview;
  source?: "itms";
}

export interface ScheduleC3PreviewResult {
  entity: string;
  asAtLabel: string;
  sheetName: string;
  holdingsCount: number;
  maturityYear: number;
  title: string;
  scheduleLabel?: string;
  chartSegments?: string[];
  rowCount: number;
  grandTotal: string;
  reconciliation: ReconciliationPreview;
  months: { month: string; total: string }[];
}

export interface MaturityWisePreviewResult {
  entity: string;
  asAtLabel: string;
  sheetName: string;
  holdingsCount: number;
  title: string;
  subtitle: string;
  chartSegments?: string[];
  rowCount: number;
  yearCount: number;
  investmentsTotal: string;
  reconciliation: ReconciliationPreview;
  years: { year: number; subtotal: string; holdings: number }[];
}

export interface InvestmentMaturitiesPreviewResult {
  entity: string;
  asAtLabel: string;
  sheetName: string;
  holdingsCount: number;
  year: number;
  scope: InvestmentMaturitiesScope;
  sectionCount: number;
  reconciliation: ReconciliationPreview;
  sections: { month: number; monthName: string; title: string; rowCount: number }[];
}

export interface MonthMaturitySummaryPreviewResult {
  entity: string;
  asAtLabel: string;
  sheetName: string;
  holdingsCount: number;
  year: number;
  title: string;
  scheduleLabel: string;
  chartSegments?: string[];
  grandTotal: string;
  reconciliation: ReconciliationPreview;
  months: { month: string; total: string; types: Record<string, string> }[];
}

export interface ScheduleC5PreviewResult {
  entity: string;
  asAtLabel: string;
  sheetName: string;
  holdingsCount: number;
  title: string;
  scheduleLabel: string;
  chartSegments?: string[];
  grandTotal: string;
  ratingPeriod1Label: string;
  ratingPeriod2Label: string;
  reconciliation: ReconciliationPreview;
  institutions: {
    institution: string;
    amount: string;
    share: string;
    ratingPeriod1: string;
    ratingPeriod2: string;
  }[];
}

export interface InstitutionRatingPreviewResult {
  entity: string;
  asAtLabel: string;
  sheetName: string;
  holdingsCount: number;
  title: string;
  scheduleLabel: string;
  chartSegments?: string[];
  agreedRatingLabel: string;
  institutionTotal: string;
  reconciliation: ReconciliationPreview;
  rows: {
    institution: string;
    currentRating: string;
    total: string;
    share: string;
  }[];
}

export interface ScheduleC6PreviewResult {
  entity: string;
  asAtLabel: string;
  sheetName: string;
  holdingsCount: number;
  title: string;
  scheduleLabel: string;
  chartSegments?: string[];
  grandTotal: string;
  reconciliation: ReconciliationPreview;
  institutions: {
    institution: string;
    amount: string;
    share: string;
  }[];
}

export interface ScheduleC6iPreviewResult {
  entity: string;
  asAtLabel: string;
  sheetName: string;
  holdingsCount: number;
  title: string;
  scheduleLabel: string;
  chartSegments?: string[];
  rowCount: number;
  grandTotal: string;
  reconciliation: ReconciliationPreview;
  years: { year: number; amount: string }[];
}

export interface PortfolioSharePreviewResult {
  entity: string;
  asAtLabel: string;
  sheetName: string;
  holdingsCount: number;
  title: string;
  totalPortfolio: string;
  chartSegments?: string[];
  reconciliation: ReconciliationPreview;
  lines: { label: string; amount: string; share: string }[];
}

export interface ScheduleC4PreviewResult {
  entity: string;
  asAtLabel: string;
  sheetName: string;
  holdingsCount: number;
  title: string;
  scheduleLabel: string;
  chartSegments?: string[];
  totalMaturities: string;
  totalPortfolio: string | null;
  reconciliation: ReconciliationPreview;
  years: { year: number; amount: string }[];
}

export type ReportPreviewResult =
  | ScheduleC3PreviewResult
  | MaturityWisePreviewResult
  | InvestmentMaturitiesPreviewResult
  | MonthMaturitySummaryPreviewResult
  | ScheduleC5PreviewResult
  | ScheduleC6PreviewResult
  | ScheduleC6iPreviewResult
  | PortfolioSharePreviewResult
  | InstitutionRatingPreviewResult
  | ScheduleC4PreviewResult;

export interface ReportMeta {
  id: ReportId;
  label: string;
  description: string;
  defaultPage: number;
  usesPageNumber: boolean;
  defaultSchedule: string;
  usesScheduleNumber: boolean;
  usesChartColors?: boolean;
  usesYearPicker?: boolean;
  usesMaturityPeriod?: boolean;
  usesFdRatings?: boolean;
  usesInstitutionRatings?: boolean;
  /** Report can load holdings from ITMS (Excel still available). */
  supportsItms?: boolean;
  /** ITMS path needs user-entered Savings A/C and Loans to Members. */
  needsSavingsLoans?: boolean;
}

export type ChartColorMap = Record<string, string>;

/** Reserved keys for customisable bar-chart plot frame (ignored as segments). */
export const PLOT_BG_KEYS = {
  outer: "__plotOuter",
  top: "__plotTop",
  bottom: "__plotBottom",
  border: "__plotBorder",
} as const;

export const DEFAULT_PLOT_BACKGROUND = {
  outer: "#DCE6F1",
  top: "#F4C4A0",
  bottom: "#FFF8DC",
  border: "#C00000",
} as const;

export const PLOT_BG_LABELS: Array<{ key: (typeof PLOT_BG_KEYS)[keyof typeof PLOT_BG_KEYS]; label: string }> = [
  { key: PLOT_BG_KEYS.outer, label: "Outer background" },
  { key: PLOT_BG_KEYS.top, label: "Plot top (gradient)" },
  { key: PLOT_BG_KEYS.bottom, label: "Plot bottom (gradient)" },
  { key: PLOT_BG_KEYS.border, label: "Plot border" },
];

export function withDefaultPlotBackground(colors: ChartColorMap = {}): ChartColorMap {
  return {
    [PLOT_BG_KEYS.outer]: colors[PLOT_BG_KEYS.outer] ?? DEFAULT_PLOT_BACKGROUND.outer,
    [PLOT_BG_KEYS.top]: colors[PLOT_BG_KEYS.top] ?? DEFAULT_PLOT_BACKGROUND.top,
    [PLOT_BG_KEYS.bottom]: colors[PLOT_BG_KEYS.bottom] ?? DEFAULT_PLOT_BACKGROUND.bottom,
    [PLOT_BG_KEYS.border]: colors[PLOT_BG_KEYS.border] ?? DEFAULT_PLOT_BACKGROUND.border,
    ...colors,
  };
}

/** Default palette for pie/bar chart segments (matches backend CHART_COLORS). */
export const CHART_COLOR_DEFAULTS = [
  "#4472C4",
  "#ED7D31",
  "#A5A5A5",
  "#FFC000",
  "#5B9BD5",
  "#70AD47",
  "#264478",
  "#9E480E",
  "#636363",
  "#997300",
] as const;

export function defaultChartColorForSegment(reportId: ReportId, index: number): string {
  if (reportId === "maturity-wise" || reportId === "portfolio-share") {
    return "#00B050";
  }
  return CHART_COLOR_DEFAULTS[index % CHART_COLOR_DEFAULTS.length];
}

export function buildDefaultChartColors(segments: string[], reportId: ReportId): ChartColorMap {
  return withDefaultPlotBackground(
    Object.fromEntries(
      segments.map((label, i) => [label, defaultChartColorForSegment(reportId, i)]),
    ),
  );
}

export const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

export const REPORTS: ReportMeta[] = [
  {
    id: "schedule-c3",
    label: "Schedule C3 — Maturities this year",
    description:
      "Investments maturing in the portfolio year, sorted by maturity date with monthly subtotals and a bar chart.",
    defaultPage: 22,
    usesPageNumber: true,
    defaultSchedule: "Schedule - C (3)",
    usesScheduleNumber: true,
    usesChartColors: true,
    supportsItms: true,
  },
  {
    id: "maturity-wise",
    label: "Maturity Date wise",
    description:
      "All investments sorted by maturity date, grouped by year with annual subtotals.",
    defaultPage: 22,
    usesPageNumber: true,
    defaultSchedule: "",
    usesScheduleNumber: true,
    usesChartColors: true,
    supportsItms: true,
    needsSavingsLoans: true,
  },
  {
    id: "investment-maturities",
    label: "Investment Maturities — Monthwise",
    description:
      "Principal maturities due in a selected month, or all months with maturities stacked in one file.",
    defaultPage: 0,
    usesPageNumber: false,
    defaultSchedule: "",
    usesScheduleNumber: false,
    usesYearPicker: true,
    usesMaturityPeriod: true,
    supportsItms: true,
  },
  {
    id: "month-maturity-summary",
    label: "Month Maturity Summary",
    description:
      "Maturities in the selected year by month and investment type, with a summary bar chart.",
    defaultPage: 0,
    usesPageNumber: false,
    defaultSchedule: "Schedule B (3) i",
    usesScheduleNumber: true,
    usesChartColors: true,
    usesYearPicker: true,
    supportsItms: true,
  },
  {
    id: "schedule-c5",
    label: "Fixed Deposits by Institution",
    description:
      "All fixed deposits grouped by bank, with credit ratings and a share pie chart.",
    defaultPage: 24,
    usesPageNumber: true,
    defaultSchedule: "Schedule C(5)",
    usesScheduleNumber: true,
    usesChartColors: true,
    usesFdRatings: true,
    supportsItms: true,
  },
  {
    id: "schedule-c6",
    label: "Debentures by Institution",
    description:
      "All debentures grouped by bank with share percentages and a pie chart.",
    defaultPage: 25,
    usesPageNumber: true,
    defaultSchedule: "Schedule - B (6)",
    usesScheduleNumber: true,
    usesChartColors: true,
    supportsItms: true,
  },
  {
    id: "schedule-c6i",
    label: "Debenture Maturities — Annually",
    description:
      "Debentures sorted by maturity date with annual subtotals and a bar chart.",
    defaultPage: 26,
    usesPageNumber: true,
    defaultSchedule: "Schedule - B (6) i",
    usesScheduleNumber: true,
    usesChartColors: true,
    supportsItms: true,
  },
  {
    id: "portfolio-share",
    label: "Investments as a Percentage from Total Portfolio",
    description:
      "Portfolio composition by investment type with share percentages and a bar chart.",
    defaultPage: 0,
    usesPageNumber: false,
    defaultSchedule: "",
    usesScheduleNumber: true,
    usesChartColors: true,
    supportsItms: true,
    needsSavingsLoans: true,
  },
  {
    id: "institution-rating",
    label: "Institution Wise — Rating Assessment",
    description:
      "Bank investments by institution and type with credit ratings, share percentages, and a pie chart (excludes gsec and loans).",
    defaultPage: 0,
    usesPageNumber: false,
    defaultSchedule: "",
    usesScheduleNumber: true,
    usesChartColors: true,
    usesInstitutionRatings: true,
    supportsItms: true,
    needsSavingsLoans: true,
  },
  {
    id: "schedule-c4",
    label: "Total Investments — Period wise",
    description:
      "Maturity totals by year with savings, loans, and portfolio footer, plus a bar chart.",
    defaultPage: 23,
    usesPageNumber: true,
    defaultSchedule: "Schedule - B (4)",
    usesScheduleNumber: true,
    usesChartColors: true,
    supportsItms: true,
    needsSavingsLoans: true,
  },
];

export interface ReportYearOptions {
  year: number;
  month?: number;
  scope?: InvestmentMaturitiesScope;
}

export interface InstitutionRatingValues {
  period1?: string;
  period2?: string;
}

export interface ReportFdRatingOptions {
  ratingPeriod1?: string;
  ratingPeriod2?: string;
  ratings?: Record<string, InstitutionRatingValues>;
}

export interface InstitutionCurrentRatingValues {
  current?: string;
}

export interface ReportInstitutionRatingOptions {
  agreedRatingLabel?: string;
  ratings?: Record<string, InstitutionCurrentRatingValues>;
}

export type ReportGenerateOptions = Partial<ReportYearOptions> &
  ReportFdRatingOptions &
  ReportInstitutionRatingOptions & {
    chartColors?: ChartColorMap;
    savings?: number;
    loans?: number;
  };

function appendScheduleLabelField(
  form: FormData,
  reportId: ReportId,
  scheduleLabel: string,
): void {
  if (!REPORTS.find((r) => r.id === reportId)?.usesScheduleNumber) return;
  form.append("scheduleLabel", scheduleLabel);
}

function appendChartColorFields(
  form: FormData,
  reportId: ReportId,
  options?: ReportGenerateOptions,
): void {
  if (!REPORTS.find((r) => r.id === reportId)?.usesChartColors || !options?.chartColors) return;
  if (Object.keys(options.chartColors).length === 0) return;
  form.append("chartColors", JSON.stringify(options.chartColors));
}

function appendReportYearFields(
  form: FormData,
  reportId: ReportId,
  options?: ReportGenerateOptions,
): void {
  const meta = REPORTS.find((r) => r.id === reportId);
  if (!options || (!meta?.usesYearPicker && !meta?.usesMaturityPeriod)) return;
  form.append("year", String(options.year));
  if (reportId === "investment-maturities") {
    form.append("month", String(options.month ?? 1));
    form.append("scope", options.scope ?? "month");
  }
}

function appendReportInstitutionRatingFields(
  form: FormData,
  reportId: ReportId,
  options?: ReportGenerateOptions,
): void {
  if (reportId !== "institution-rating" || !options) return;
  if (options.agreedRatingLabel) form.append("agreedRatingLabel", options.agreedRatingLabel);
  if (options.ratings && Object.keys(options.ratings).length > 0) {
    form.append("ratings", JSON.stringify(options.ratings));
  }
}

function appendReportFdRatingFields(
  form: FormData,
  reportId: ReportId,
  options?: ReportGenerateOptions,
): void {
  if (reportId !== "schedule-c5" || !options) return;
  if (options.ratingPeriod1) form.append("ratingPeriod1", options.ratingPeriod1);
  if (options.ratingPeriod2) form.append("ratingPeriod2", options.ratingPeriod2);
  if (options.ratings && Object.keys(options.ratings).length > 0) {
    form.append("ratings", JSON.stringify(options.ratings));
  }
}

export async function inspectMaster(file: File): Promise<MasterInspectResult> {
  const form = new FormData();
  form.append("master", file);

  const res = await fetch("/api/master/inspect", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export interface ItmsHealthResult {
  reportGenerator: string;
  itmsBaseUrl: string;
  itms: { ok: boolean; message: string };
}

export interface ItmsLoginResult {
  success: boolean;
  token: string;
  user?: { id?: number; username?: string; role?: string };
}

const ITMS_TOKEN_KEY = "prg.itms.token";
const ITMS_USER_KEY = "prg.itms.username";

export function getStoredItmsToken(): string | null {
  try {
    return sessionStorage.getItem(ITMS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredItmsUsername(): string | null {
  try {
    return sessionStorage.getItem(ITMS_USER_KEY);
  } catch {
    return null;
  }
}

export function clearStoredItmsSession(): void {
  try {
    sessionStorage.removeItem(ITMS_TOKEN_KEY);
    sessionStorage.removeItem(ITMS_USER_KEY);
  } catch {
    /* ignore */
  }
}

function storeItmsSession(token: string, username: string): void {
  sessionStorage.setItem(ITMS_TOKEN_KEY, token);
  sessionStorage.setItem(ITMS_USER_KEY, username);
}

function itmsAuthHeaders(extra?: HeadersInit): HeadersInit {
  const token = getStoredItmsToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extra as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function checkItmsHealth(): Promise<ItmsHealthResult> {
  const res = await fetch("/api/itms/health");
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

/** Sign in to ITMS; password is sent once and not stored — only the JWT is kept in sessionStorage. */
export async function loginToItms(username: string, password: string): Promise<ItmsLoginResult> {
  const res = await fetch("/api/itms/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Login failed (${res.status})`);
  }
  const data = (await res.json()) as ItmsLoginResult;
  if (!data.token) throw new Error("ITMS login returned no token.");
  storeItmsSession(data.token, username.trim());
  return data;
}

export async function inspectItmsPortfolio(asAtDate: string): Promise<MasterInspectResult> {
  const res = await fetch("/api/portfolio/itms/inspect", {
    method: "POST",
    headers: itmsAuthHeaders(),
    body: JSON.stringify({ asAtDate }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

async function postItmsReport(
  path: string,
  asAtDate: string,
  pageNumber: number,
  scheduleLabel: string,
  options?: ReportGenerateOptions,
  query?: { format?: ReportFormat; preview?: boolean },
): Promise<Response> {
  const body: Record<string, unknown> = {
    asAtDate,
    pageNumber,
    scheduleLabel,
  };
  if (options?.year != null) body.year = options.year;
  if (options?.month != null) body.month = options.month;
  if (options?.scope) body.scope = options.scope;
  if (options?.savings != null) body.savings = options.savings;
  if (options?.loans != null) body.loans = options.loans;
  if (options?.agreedRatingLabel) body.agreedRatingLabel = options.agreedRatingLabel;
  if (options?.ratingPeriod1) body.ratingPeriod1 = options.ratingPeriod1;
  if (options?.ratingPeriod2) body.ratingPeriod2 = options.ratingPeriod2;
  if (options?.ratings && Object.keys(options.ratings).length > 0) {
    body.ratings = options.ratings;
  }
  if (options?.chartColors && Object.keys(options.chartColors).length > 0) {
    body.chartColors = options.chartColors;
  }

  const params = new URLSearchParams();
  if (query?.format) params.set("format", query.format);
  if (query?.preview) params.set("preview", "true");
  const qs = params.toString();
  const url = qs ? `${path}?${qs}` : path;

  return fetch(url, {
    method: "POST",
    headers: itmsAuthHeaders(),
    body: JSON.stringify(body),
  });
}

async function readItmsJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function readItmsFile(
  res: Response,
  format: ReportFormat,
  fallbackBase: string,
): Promise<{ blob: Blob; filename: string }> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const fromHeader = disposition?.match(/filename="([^"]+)"/)?.[1];
  const ext = format === "xlsx" ? "xlsx" : "pdf";
  return { blob, filename: fromHeader ?? `${fallbackBase}.${ext}` };
}

export function reportSupportsItms(reportId: ReportId): boolean {
  return Boolean(REPORTS.find((r) => r.id === reportId)?.supportsItms);
}

export async function previewScheduleC5FromItms(
  asAtDate: string,
  pageNumber: number,
  scheduleLabel: string,
  options?: ReportGenerateOptions,
): Promise<ScheduleC5PreviewResult> {
  const res = await postItmsReport(
    "/api/reports/schedule-c5/itms/preview",
    asAtDate,
    pageNumber,
    scheduleLabel,
    options,
  );
  return readItmsJson(res);
}

export async function generateScheduleC5FromItms(
  asAtDate: string,
  pageNumber: number,
  scheduleLabel: string,
  format: ReportFormat,
  options?: ReportGenerateOptions,
  preview = false,
): Promise<{ blob: Blob; filename: string }> {
  const res = await postItmsReport(
    "/api/reports/schedule-c5/itms",
    asAtDate,
    pageNumber,
    scheduleLabel,
    options,
    { format, preview },
  );
  return readItmsFile(res, format, "Fixed-Deposits-by-Institution");
}

export async function previewScheduleC6FromItms(
  asAtDate: string,
  pageNumber: number,
  scheduleLabel: string,
  options?: ReportGenerateOptions,
): Promise<ScheduleC6PreviewResult> {
  const res = await postItmsReport(
    "/api/reports/schedule-c6/itms/preview",
    asAtDate,
    pageNumber,
    scheduleLabel,
    options,
  );
  return readItmsJson(res);
}

export async function generateScheduleC6FromItms(
  asAtDate: string,
  pageNumber: number,
  scheduleLabel: string,
  format: ReportFormat,
  options?: ReportGenerateOptions,
  preview = false,
): Promise<{ blob: Blob; filename: string }> {
  const res = await postItmsReport(
    "/api/reports/schedule-c6/itms",
    asAtDate,
    pageNumber,
    scheduleLabel,
    options,
    { format, preview },
  );
  return readItmsFile(res, format, "Debentures-by-Institution");
}

export async function previewScheduleC6iFromItms(
  asAtDate: string,
  pageNumber: number,
  scheduleLabel: string,
  options?: ReportGenerateOptions,
): Promise<ScheduleC6iPreviewResult> {
  const res = await postItmsReport(
    "/api/reports/schedule-c6i/itms/preview",
    asAtDate,
    pageNumber,
    scheduleLabel,
    options,
  );
  return readItmsJson(res);
}

export async function generateScheduleC6iFromItms(
  asAtDate: string,
  pageNumber: number,
  scheduleLabel: string,
  format: ReportFormat,
  options?: ReportGenerateOptions,
  preview = false,
): Promise<{ blob: Blob; filename: string }> {
  const res = await postItmsReport(
    "/api/reports/schedule-c6i/itms",
    asAtDate,
    pageNumber,
    scheduleLabel,
    options,
    { format, preview },
  );
  return readItmsFile(res, format, "Debenture-Maturities-Annually");
}

export async function previewReportFromItms(
  reportId: ReportId,
  asAtDate: string,
  pageNumber: number,
  scheduleLabel: string,
  options?: ReportGenerateOptions,
): Promise<ReportPreviewResult> {
  const pathByReport: Partial<Record<ReportId, string>> = {
    "schedule-c5": "/api/reports/schedule-c5/itms/preview",
    "schedule-c6": "/api/reports/schedule-c6/itms/preview",
    "schedule-c6i": "/api/reports/schedule-c6i/itms/preview",
    "schedule-c3": "/api/reports/schedule-c3/itms/preview",
    "month-maturity-summary": "/api/reports/month-maturity-summary/itms/preview",
    "investment-maturities": "/api/reports/investment-maturities/itms/preview",
    "maturity-wise": "/api/reports/maturity-wise/itms/preview",
    "portfolio-share": "/api/reports/portfolio-share/itms/preview",
    "schedule-c4": "/api/reports/schedule-c4/itms/preview",
    "institution-rating": "/api/reports/institution-rating/itms/preview",
  };
  const path = pathByReport[reportId];
  if (!path) throw new Error(`ITMS is not supported for report "${reportId}" yet.`);
  const res = await postItmsReport(path, asAtDate, pageNumber, scheduleLabel, options);
  return readItmsJson(res);
}

export async function generateReportFromItms(
  reportId: ReportId,
  asAtDate: string,
  pageNumber: number,
  scheduleLabel: string,
  format: ReportFormat,
  options?: ReportGenerateOptions,
  preview = false,
): Promise<{ blob: Blob; filename: string }> {
  const pathByReport: Partial<Record<ReportId, string>> = {
    "schedule-c5": "/api/reports/schedule-c5/itms",
    "schedule-c6": "/api/reports/schedule-c6/itms",
    "schedule-c6i": "/api/reports/schedule-c6i/itms",
    "schedule-c3": "/api/reports/schedule-c3/itms",
    "month-maturity-summary": "/api/reports/month-maturity-summary/itms",
    "investment-maturities": "/api/reports/investment-maturities/itms",
    "maturity-wise": "/api/reports/maturity-wise/itms",
    "portfolio-share": "/api/reports/portfolio-share/itms",
    "schedule-c4": "/api/reports/schedule-c4/itms",
    "institution-rating": "/api/reports/institution-rating/itms",
  };
  const fallbackByReport: Partial<Record<ReportId, string>> = {
    "schedule-c5": "Fixed-Deposits-by-Institution",
    "schedule-c6": "Debentures-by-Institution",
    "schedule-c6i": "Debenture-Maturities-Annually",
    "schedule-c3": "Schedule-C3",
    "month-maturity-summary": "Month-Maturity-Summary",
    "investment-maturities": "Investment-Maturities",
    "maturity-wise": "Maturity-Date-wise",
    "portfolio-share": "Investments-Portfolio-Share",
    "schedule-c4": "Total-Investments-Period-wise",
    "institution-rating": "Institution-Wise-Rating-Assessment",
  };
  const path = pathByReport[reportId];
  if (!path) throw new Error(`ITMS is not supported for report "${reportId}" yet.`);
  const res = await postItmsReport(path, asAtDate, pageNumber, scheduleLabel, options, {
    format,
    preview,
  });
  return readItmsFile(res, format, fallbackByReport[reportId] ?? reportId);
}

export async function previewReport(
  reportId: ReportId,
  file: File,
  pageNumber: number,
  scheduleLabel: string,
  options?: ReportGenerateOptions,
): Promise<ReportPreviewResult> {
  const form = new FormData();
  form.append("master", file);
  if (REPORTS.find((r) => r.id === reportId)?.usesPageNumber) {
    form.append("pageNumber", String(pageNumber));
  }
  appendScheduleLabelField(form, reportId, scheduleLabel);
  appendReportYearFields(form, reportId, options);
  appendReportFdRatingFields(form, reportId, options);
  appendReportInstitutionRatingFields(form, reportId, options);
  appendChartColorFields(form, reportId, options);

  const res = await fetch(`/api/reports/${reportId}/preview`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function generateReport(
  reportId: ReportId,
  file: File,
  pageNumber: number,
  scheduleLabel: string,
  format: ReportFormat,
  options?: ReportGenerateOptions,
  preview = false,
): Promise<{ blob: Blob; filename: string }> {
  const form = new FormData();
  form.append("master", file);
  if (REPORTS.find((r) => r.id === reportId)?.usesPageNumber) {
    form.append("pageNumber", String(pageNumber));
  }
  appendScheduleLabelField(form, reportId, scheduleLabel);
  appendReportYearFields(form, reportId, options);
  appendReportFdRatingFields(form, reportId, options);
  appendReportInstitutionRatingFields(form, reportId, options);
  appendChartColorFields(form, reportId, options);

  const previewQ = preview ? "&preview=true" : "";
  const res = await fetch(`/api/reports/${reportId}?format=${format}${previewQ}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const fromHeader = disposition?.match(/filename="([^"]+)"/)?.[1];
  if (fromHeader) return { blob, filename: fromHeader };

  const meta = REPORTS.find((r) => r.id === reportId)!;
  const ext = format === "xlsx" ? "xlsx" : "pdf";
  const filename = `${meta.label.replace(/[^a-z0-9]+/gi, "-")}.${ext}`;
  return { blob, filename };
}

export async function previewReportPdf(
  reportId: ReportId,
  file: File,
  pageNumber: number,
  scheduleLabel: string,
  options?: ReportGenerateOptions,
): Promise<string> {
  const { blob } = await generateReport(reportId, file, pageNumber, scheduleLabel, "pdf", options, true);
  return URL.createObjectURL(blob);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function yearFromAsAtLabel(label: string): number | null {
  const m = label.match(/\b(20\d{2})\b/);
  return m ? Number(m[1]) : null;
}

const RATING_MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Format an ISO date (YYYY-MM-DD) for rating column headers, e.g. 31-Dec-25. */
export function formatRatingPeriodLabel(isoDate: string): string {
  if (!isoDate) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const month = RATING_MONTH_SHORT[m - 1];
  if (!month || !y || !d) return isoDate;
  return `${String(d).padStart(2, "0")}-${month}-${String(y).slice(-2)}`;
}

export interface PortfolioLayoutInspectResult {
  sheetName: string;
  layout: string;
  detected: boolean;
  headerRow1: number;
  headerRow2: number;
  dataStartRow: number;
  amountCol: string;
  totalCol: string;
  isStandard: boolean;
  accountCol?: string;
}

export const PORTFOLIO_LAYOUT_LABELS: Record<string, string> = {
  legacy_with_account: "Legacy layout (Account column before Amount)",
  standard: "Standard template (columns A–L)",
  detected: "Custom layout (auto-detected columns)",
};

export async function inspectPortfolioLayout(file: File): Promise<PortfolioLayoutInspectResult> {
  const form = new FormData();
  form.append("master", file);

  const res = await fetch("/api/portfolio/convert/inspect", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function convertPortfolio(
  file: File,
): Promise<{ blob: Blob; filename: string; layout: string; rowsWritten: number }> {
  const form = new FormData();
  form.append("master", file);

  const res = await fetch("/api/portfolio/convert", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const fromHeader = disposition?.match(/filename="([^"]+)"/)?.[1];
  const filename =
    fromHeader ?? file.name.replace(/\.xlsx$/i, " - Standard Template (with ISIN).xlsx");
  const layout = res.headers.get("X-Portfolio-Layout") ?? "unknown";
  const rowsWritten = Number(res.headers.get("X-Portfolio-Rows-Written") ?? 0);
  return { blob, filename, layout, rowsWritten };
}
