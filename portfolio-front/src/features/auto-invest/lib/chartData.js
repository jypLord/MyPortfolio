export function formatTimeLabel(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value ?? "");
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function parseCompactDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) {
    return null;
  }

  const dateText = String(dateValue).trim();
  const timeText = String(timeValue).trim().padStart(6, "0");

  if (!/^\d{8}$/.test(dateText) || !/^\d{6}$/.test(timeText)) {
    return null;
  }

  const year = Number(dateText.slice(0, 4));
  const month = Number(dateText.slice(4, 6)) - 1;
  const day = Number(dateText.slice(6, 8));
  const hours = Number(timeText.slice(0, 2));
  const minutes = Number(timeText.slice(2, 4));
  const seconds = Number(timeText.slice(4, 6));
  const parsed = new Date(year, month, day, hours, minutes, seconds);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseTimeLabelWithInstant(timeLabel, instantValue) {
  if (!timeLabel || !instantValue) {
    return null;
  }

  const instant = new Date(instantValue);
  const normalizedLabel = String(timeLabel).trim();

  if (Number.isNaN(instant.getTime()) || !/^\d{1,2}:\d{2}$/.test(normalizedLabel)) {
    return null;
  }

  const [hoursText, minutesText] = normalizedLabel.split(":");
  const parsed = new Date(instant);
  parsed.setHours(Number(hoursText), Number(minutesText), 0, 0);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeTimestamp(item, index) {
  const instantValue = item.instant ?? item.timestamp ?? item.datetime;
  const compactDateTime = parseCompactDateTime(item.date, item.time);
  const timeBucket = parseTimeLabelWithInstant(item.timeLabel, instantValue);

  if (timeBucket) {
    return timeBucket.toISOString();
  }

  if (typeof instantValue === "string" && instantValue.trim()) {
    return instantValue;
  }

  if (compactDateTime) {
    return compactDateTime.toISOString();
  }

  if (item.timeLabel) {
    return `${item.timeLabel}-${index}`;
  }

  if (item.time != null) {
    return String(item.time);
  }

  if (item.date != null) {
    return String(item.date);
  }

  return String(index);
}

function normalizeTimeLabel(item, index) {
  if (item.timeLabel) {
    return String(item.timeLabel);
  }

  const compactDateTime = parseCompactDateTime(item.date, item.time);
  if (compactDateTime) {
    return formatTimeLabel(compactDateTime);
  }

  const instantValue = item.instant ?? item.timestamp ?? item.datetime;
  if (instantValue) {
    return formatTimeLabel(instantValue);
  }

  return formatTimeLabel(item.time ?? item.date ?? index);
}

export function makeMockSeries(base = 60000, points = 70) {
  const now = Date.now();
  const stepMs = 60 * 1000;
  let close = Number(base) || 60000;

  const out = [];

  for (let i = points - 1; i >= 0; i -= 1) {
    const timestamp = new Date(now - i * stepMs);
    const open = close;
    const drift = (Math.random() - 0.5) * (base * 0.01);

    close = Math.max(1, Math.round(open + drift));

    const high = Math.max(open, close) + Math.round(Math.random() * (base * 0.004));
    const low = Math.max(1, Math.min(open, close) - Math.round(Math.random() * (base * 0.004)));

    out.push({
      time: formatTimeLabel(timestamp),
      timestamp: timestamp.toISOString(),
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
    });
  }

  return out;
}

export function normalizeCandle(item, index) {
  const open = Number(item.open ?? item.o);
  const high = Number(item.high ?? item.h);
  const low = Number(item.low ?? item.l);
  const close = Number(item.close ?? item.c ?? item.last ?? item.currentPrice ?? item.price);

  if (![open, high, low, close].every(Number.isFinite)) {
    return null;
  }

  return {
    time: normalizeTimeLabel(item, index),
    timestamp: normalizeTimestamp(item, index),
    open: Math.round(open),
    high: Math.round(high),
    low: Math.round(low),
    close: Math.round(close),
  };
}

export function extractSeries(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.t8412OutBlock1)) return payload.t8412OutBlock1;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.candles)) return payload.candles;
  if (Array.isArray(payload?.chart)) return payload.chart;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}
