import { useEffect, useState } from "react";
import { HAS_API_CONFIG } from "../constants/autoInvest.js";
import {
  normalizeChartPoint,
  normalizeSeriesPayload,
  openChartEventSource,
} from "../services/autoInvestApi.js";

const MARKET_TIME_ZONE = "Asia/Seoul";
const MARKET_OPEN_HOUR = 9;
const MARKET_OPEN_MINUTE = 0;
const MARKET_CLOSE_HOUR = 15;
const MARKET_CLOSE_MINUTE = 30;

function formatSeoulTime(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: MARKET_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getSeoulDateParts(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MARKET_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
    hour: Number(parts.find((part) => part.type === "hour")?.value),
    minute: Number(parts.find((part) => part.type === "minute")?.value),
  };
}

function createSeoulDate(date, hour, minute) {
  const { year, month, day } = getSeoulDateParts(date);
  const utcTimestamp = Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0);
  return new Date(utcTimestamp);
}

function isSnapshotWindow(now = new Date()) {
  const { hour, minute } = getSeoulDateParts(now);

  if (hour < MARKET_OPEN_HOUR) {
    return true;
  }

  if (hour > MARKET_CLOSE_HOUR) {
    return true;
  }

  if (hour === MARKET_CLOSE_HOUR && minute >= MARKET_CLOSE_MINUTE) {
    return true;
  }

  return false;
}

function getNextModeTransition(now = new Date()) {
  const snapshotMode = isSnapshotWindow(now);
  const openTime = createSeoulDate(now, MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE);
  const closeTime = createSeoulDate(now, MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE);

  if (!snapshotMode) {
    return closeTime;
  }

  if (now < openTime) {
    return openTime;
  }

  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return createSeoulDate(nextDay, MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE);
}

function createScheduledMessage(targetTime, snapshotMode) {
  if (snapshotMode) {
    return `${formatSeoulTime(targetTime)}(KST)에 실시간 연결을 시작합니다.`;
  }

  return `${formatSeoulTime(targetTime)}(KST)에 장마감 스냅샷으로 전환합니다.`;
}

function createInitialState(symbol) {
  if (!symbol) {
    return {
      series: [],
      isLoading: false,
      fetchError: "",
      statusMessage: "",
    };
  }

  if (!HAS_API_CONFIG) {
    return {
      series: [],
      isLoading: false,
      fetchError: "API 설정이 없습니다.",
      statusMessage: "",
    };
  }

  const snapshotMode = isSnapshotWindow();

  return {
    series: [],
    isLoading: true,
    fetchError: "",
    statusMessage: snapshotMode ? "장마감 스냅샷을 불러오는 중입니다." : "실시간 차트에 연결하는 중입니다.",
  };
}

function parseEventData(event) {
  try {
    return JSON.parse(event.data);
  } catch {
    return null;
  }
}

function upsertLatestPoint(series, nextPoint) {
  if (!nextPoint) {
    return series;
  }

  if (!series.length) {
    return [nextPoint];
  }

  const lastPoint = series[series.length - 1];
  if (lastPoint.timestamp === nextPoint.timestamp || lastPoint.time === nextPoint.time) {
    return [...series.slice(0, -1), nextPoint];
  }

  return [...series, nextPoint];
}

export default function useChartSeries(symbol) {
  const [state, setState] = useState(() => createInitialState(symbol));

  useEffect(() => {
    if (!symbol || !HAS_API_CONFIG) {
      const timerId = window.setTimeout(() => {
        setState(createInitialState(symbol));
      }, 0);

      return () => {
        window.clearTimeout(timerId);
      };
    }

    let eventSource = null;
    let timerId = null;

    function clearResources() {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    }

    function scheduleReconnect(snapshotMode) {
      const targetTime = getNextModeTransition();
      const waitMs = Math.max(targetTime.getTime() - Date.now(), 0);

      timerId = window.setTimeout(() => {
        connect();
      }, waitMs);

      setState((currentState) => ({
        ...currentState,
        statusMessage: createScheduledMessage(targetTime, snapshotMode),
      }));
    }

    function connect() {
      clearResources();

      const snapshotMode = isSnapshotWindow();

      setState((currentState) => ({
        ...currentState,
        isLoading: true,
        fetchError: "",
        statusMessage: snapshotMode ? "장마감 스냅샷을 불러오는 중입니다." : "실시간 차트에 연결하는 중입니다.",
      }));

      eventSource = openChartEventSource(symbol);

      eventSource.addEventListener("initialChart", (event) => {
        const payload = parseEventData(event);
        const nextSeries = normalizeSeriesPayload(payload);

        if (!nextSeries.length) {
          setState((currentState) => ({
            ...currentState,
            isLoading: false,
            fetchError: "수신된 차트 데이터가 없습니다.",
            statusMessage: "",
          }));
          return;
        }

        if (snapshotMode) {
          eventSource?.close();
          eventSource = null;
        }

        setState({
          series: nextSeries,
          isLoading: false,
          fetchError: "",
          statusMessage: snapshotMode
            ? `장마감 스냅샷을 ${formatSeoulTime(new Date())}(KST)에 불러왔습니다.`
            : createScheduledMessage(getNextModeTransition(), false),
        });

        if (snapshotMode) {
          scheduleReconnect(true);
        }
      });

      eventSource.addEventListener("stockPrice", (event) => {
        if (snapshotMode) {
          return;
        }

        const payload = parseEventData(event);
        const nextPoint = normalizeChartPoint(payload);

        if (!nextPoint) {
          return;
        }

        setState((currentState) => ({
          series: upsertLatestPoint(currentState.series, nextPoint),
          isLoading: false,
          fetchError: "",
          statusMessage: createScheduledMessage(getNextModeTransition(), false),
        }));
      });

      eventSource.onerror = () => {
        clearResources();

        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          fetchError: "차트 스트림 연결에 실패했습니다.",
          statusMessage: "",
        }));
      };
    }

    connect();

    return () => {
      clearResources();
    };
  }, [symbol]);

  return state;
}
