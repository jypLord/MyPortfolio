import {
  API_BASE_URL,
  API_STREAM_PATH,
} from "../constants/autoInvest.js";
import {
  extractSeries,
  normalizeCandle,
} from "../lib/chartData.js";

function buildApiUrl(path) {
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!baseUrl) {
    return normalizedPath;
  }

  return new URL(`${baseUrl}${normalizedPath}`).toString();
}

export function buildChartUrl(stockName) {
  const url = new URL(buildApiUrl(API_STREAM_PATH), window.location.origin);

  if (stockName.trim()) {
    url.searchParams.set("stockName", stockName.trim());
  }

  return url.toString();
}

export function normalizeSeriesPayload(payload) {
  const extracted = extractSeries(payload);

  if (extracted.length) {
    return extracted
      .map(normalizeCandle)
      .filter(Boolean);
  }

  const singleItem = normalizeCandle(payload, 0);
  return singleItem ? [singleItem] : [];
}

export function normalizeChartPoint(payload) {
  return normalizeCandle(payload, 0);
}

export function openChartEventSource(stockName) {
  return new EventSource(buildChartUrl(stockName));
}
