import { useEffect, useRef, useState } from "react";
import PriceChart from "./PriceChart.jsx";
import useChartSeries from "../../hooks/useChartSeries";

function adjustPriceByPercent(price, direction) {
  const basePrice = Number(price);

  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return basePrice;
  }

  const ratio = direction === "up" ? 1.01 : 0.99;
  return Math.max(1, Math.round(basePrice * ratio));
}

function hasReachedBaseline(previousPrice, nextPrice, baseline) {
  if (!Number.isFinite(previousPrice) || !Number.isFinite(nextPrice) || !Number.isFinite(baseline)) {
    return false;
  }

  if (nextPrice === baseline) {
    return true;
  }

  return (
    (previousPrice < baseline && nextPrice > baseline) ||
    (previousPrice > baseline && nextPrice < baseline)
  );
}

function applySimulatedPriceToSeries(series, simulatedPrice) {
  if (!series.length || !Number.isFinite(simulatedPrice) || simulatedPrice <= 0) {
    return series;
  }

  const lastIndex = series.length - 1;
  const lastCandle = series[lastIndex];

  if (!lastCandle || lastCandle.close === simulatedPrice) {
    return series;
  }

  const nextOpen = Number.isFinite(lastCandle.open) ? lastCandle.open : lastCandle.close;
  const nextHigh = Math.max(
    nextOpen,
    Number.isFinite(lastCandle.high) ? lastCandle.high : nextOpen,
    simulatedPrice,
  );
  const nextLow = Math.min(
    nextOpen,
    Number.isFinite(lastCandle.low) ? lastCandle.low : nextOpen,
    simulatedPrice,
  );

  const nextCandle = {
    ...lastCandle,
    open: nextOpen,
    high: nextHigh,
    low: nextLow,
    close: simulatedPrice,
  };

  return [...series.slice(0, lastIndex), nextCandle];
}

export default function MonitoringChartCard({ item }) {
  const {
    series,
    isLoading,
    fetchError,
    statusMessage,
  } = useChartSeries(item.symbol);
  const [priceOverride, setPriceOverride] = useState(null);
  const [isExecuted, setIsExecuted] = useState(false);
  const [hoveredAction, setHoveredAction] = useState("");
  const lastObservedPriceRef = useRef(null);
  const executionHideTimerRef = useRef(null);
  const hasSeries = series.length > 0;
  const lastCandle = series[series.length - 1];
  const latestClose = lastCandle?.close;
  const latestTimestamp = lastCandle?.timestamp ?? lastCandle?.time ?? null;
  const simulatedPrice =
    priceOverride && priceOverride.timestamp === latestTimestamp
      ? priceOverride.price
      : latestClose;
  const displayedSeries = applySimulatedPriceToSeries(series, simulatedPrice);

  function showExecutionNotice() {
    if (executionHideTimerRef.current) {
      window.clearTimeout(executionHideTimerRef.current);
    }

    setIsExecuted(true);
    executionHideTimerRef.current = window.setTimeout(() => {
      setIsExecuted(false);
      executionHideTimerRef.current = null;
    }, 3000);
  }

  useEffect(() => {
    return () => {
      if (executionHideTimerRef.current) {
        window.clearTimeout(executionHideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!Number.isFinite(latestClose)) {
      return;
    }

    const previousPrice = lastObservedPriceRef.current;
    const shouldExecute = hasReachedBaseline(previousPrice, simulatedPrice, item.baseline);
    lastObservedPriceRef.current = simulatedPrice;

    if (shouldExecute) {
      const timerId = window.setTimeout(() => {
        showExecutionNotice();
      }, 0);

      return () => {
        window.clearTimeout(timerId);
      };
    }
  }, [item.baseline, latestClose, simulatedPrice]);

  function handleAdjustPrice(direction) {
    setPriceOverride(() => {
      const basePrice = Number.isFinite(simulatedPrice) ? simulatedPrice : latestClose;

      if (!Number.isFinite(basePrice)) {
        return null;
      }

      const nextPrice = adjustPriceByPercent(basePrice, direction);

      if (hasReachedBaseline(basePrice, nextPrice, item.baseline)) {
        showExecutionNotice();
      }

      lastObservedPriceRef.current = nextPrice;
      return {
        price: nextPrice,
        timestamp: latestTimestamp,
      };
    });
  }

  return (
    <article className="autoChartCard">
      <div className="autoChartTop">
        <div className="autoSymbolBadge">{item.symbol}</div>
        <div className="autoChartControls">
          <div className="autoPriceBtnWrap">
            <button
              type="button"
              className="autoPriceBtn"
              onClick={() => handleAdjustPrice("down")}
              onMouseEnter={() => setHoveredAction("down")}
              onMouseLeave={() => setHoveredAction("")}
              onFocus={() => setHoveredAction("down")}
              onBlur={() => setHoveredAction("")}
              disabled={!hasSeries}
            >
              {"\uAC00\uACA9 \uB0B4\uB9AC\uAE30"}
            </button>
            {hoveredAction === "down" ? (
              <div className="autoPriceHint" role="tooltip">
                {"\uC8FC\uAC00\uB97C 1% \uB0B4\uB9BD\uB2C8\uB2E4."}
              </div>
            ) : null}
          </div>
          <div className="autoPriceBtnWrap">
            <button
              type="button"
              className="autoPriceBtn"
              onClick={() => handleAdjustPrice("up")}
              onMouseEnter={() => setHoveredAction("up")}
              onMouseLeave={() => setHoveredAction("")}
              onFocus={() => setHoveredAction("up")}
              onBlur={() => setHoveredAction("")}
              disabled={!hasSeries}
            >
              {"\uAC00\uACA9 \uC62C\uB9AC\uAE30"}
            </button>
            {hoveredAction === "up" ? (
              <div className="autoPriceHint" role="tooltip">
                {"\uC8FC\uAC00\uB97C 1% \uC62C\uB9BD\uB2C8\uB2E4."}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="autoChartBody">
        {hasSeries ? (
          <PriceChart
            data={displayedSeries}
            baseline={item.baseline}
            currentPrice={simulatedPrice}
            isExecuted={isExecuted}
          />
        ) : null}
      </div>

      {isLoading ? <p className="autoChartStatus">{"\uBD88\uB7EC\uC624\uB294 \uC911..."}</p> : null}
      {!isLoading && !fetchError && statusMessage ? (
        <p className="autoChartStatus">{statusMessage}</p>
      ) : null}
      {fetchError ? <p className="autoChartStatus isError">{fetchError}</p> : null}
      {!isLoading && !fetchError && !statusMessage && !hasSeries ? (
        <p className="autoChartStatus">{"\uC218\uC2E0\uB41C \uCC28\uD2B8 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}</p>
      ) : null}
    </article>
  );
}
