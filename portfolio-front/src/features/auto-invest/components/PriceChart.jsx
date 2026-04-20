import "./PriceChart.css";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CURRENT_PRICE_TAG_COLOR = "#03c75a";
const CHART_HEIGHT = 320;
const CHART_MARGIN = { top: 12, right: 12, left: 4, bottom: 28 };
const OVERLAY_VIEWBOX_WIDTH = 1000;
const MIN_VISIBLE_RANGE_RATIO = 0.014;
const MIN_VISIBLE_RANGE_ABSOLUTE = 700;
const BASELINE_CANDLE_GAP_RATIO = 0.035;
const DOMAIN_PADDING_RATIO = 0.1;
const DOMAIN_PADDING_MIN = 120;
const BASELINE_TOP_EDGE_PADDING = 10;
const BASELINE_BOTTOM_SAFE_GAP = 38;
const CURRENT_PRICE_TAG_HEIGHT = 28;
const CURRENT_PRICE_TAG_GAP = 22;
const CURRENT_PRICE_TAG_TIP_OFFSET = 10;
const CURRENT_PRICE_TAG_HORIZONTAL_PADDING = 12;
const CURRENT_PRICE_TAG_MIN_WIDTH = 44;
const CURRENT_PRICE_TAG_MAX_WIDTH = 88;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function renderCandle({
  item,
  index,
  centerX,
  candleWidth,
  highY,
  lowY,
  top,
  bodyHeight,
  stroke,
  fill,
}) {
  return (
    <g key={`${item.timestamp}-${index}`}>
      <line
        x1={centerX}
        x2={centerX}
        y1={highY}
        y2={lowY}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <rect
        x={centerX - candleWidth / 2}
        y={top}
        width={candleWidth}
        height={bodyHeight}
        rx={2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
    </g>
  );
}

function getYCoordinate(value, minDomain, maxDomain, top, height) {
  if (!Number.isFinite(value) || !Number.isFinite(minDomain) || !Number.isFinite(maxDomain)) {
    return null;
  }

  if (maxDomain <= minDomain) {
    return top + height / 2;
  }

  const normalized = (value - minDomain) / (maxDomain - minDomain);
  return top + height - normalized * height;
}

function getVisualScale(data, baseline, currentPrice) {
  const lastClose = data[data.length - 1]?.close;
  const anchorPrice = Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : lastClose;
  const candlePrices = data.flatMap((item) => [item.low, item.high, item.open, item.close].filter(Number.isFinite));
  const minCandlePrice = candlePrices.length ? Math.min(...candlePrices) : 0;
  const maxCandlePrice = candlePrices.length ? Math.max(...candlePrices) : 0;
  const visiblePrices = [...candlePrices, ...(Number.isFinite(anchorPrice) ? [anchorPrice] : [])];
  const minVisiblePrice = visiblePrices.length ? Math.min(...visiblePrices) : 0;
  const maxVisiblePrice = visiblePrices.length ? Math.max(...visiblePrices) : 0;
  const visibleRange = Math.max(
    maxVisiblePrice - minVisiblePrice,
    (anchorPrice || maxVisiblePrice || 0) * MIN_VISIBLE_RANGE_RATIO,
    MIN_VISIBLE_RANGE_ABSOLUTE,
  );
  const pricePadding = Math.max(
    visibleRange * DOMAIN_PADDING_RATIO,
    (anchorPrice || maxVisiblePrice || 0) * 0.003,
    DOMAIN_PADDING_MIN,
  );
  const baselineGap = visibleRange * BASELINE_CANDLE_GAP_RATIO;
  let baselineDisplayValue = null;

  if (Number.isFinite(baseline)) {
    if (baseline > maxCandlePrice) {
      baselineDisplayValue = maxCandlePrice + baselineGap;
    } else if (baseline < minCandlePrice) {
      baselineDisplayValue = minCandlePrice - baselineGap;
    } else {
      baselineDisplayValue = baseline;
    }
  }

  const minDomainCandidate = Number.isFinite(baselineDisplayValue)
    ? Math.min(minVisiblePrice - pricePadding, baselineDisplayValue - pricePadding)
    : minVisiblePrice - pricePadding;
  const maxDomainCandidate = Number.isFinite(baselineDisplayValue)
    ? Math.max(maxVisiblePrice + pricePadding, baselineDisplayValue + pricePadding)
    : maxVisiblePrice + pricePadding;

  return {
    yDomain: [Math.max(0, minDomainCandidate), maxDomainCandidate],
    baselineDisplayValue,
  };
}

function BaselineMarker({ baseline, baselineDisplayValue, minDomain, maxDomain, plotLeft, plotRight, plotTop, plotHeight }) {
  if (!Number.isFinite(baseline) || !Number.isFinite(baselineDisplayValue)) {
    return null;
  }

  const rawBaselineY = getYCoordinate(baselineDisplayValue, minDomain, maxDomain, plotTop, plotHeight);
  const baselineY = clamp(
    rawBaselineY,
    plotTop + BASELINE_TOP_EDGE_PADDING,
    plotTop + plotHeight - BASELINE_BOTTOM_SAFE_GAP,
  );

  if (!Number.isFinite(baselineY)) {
    return null;
  }

  return (
    <g key="baseline-marker">
      <line
        x1={plotLeft}
        x2={plotRight}
        y1={baselineY}
        y2={baselineY}
        stroke="#ffb84d"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
      <text
        x={plotRight - 4}
        y={baselineY - 8}
        fill="#6b7280"
        fontSize={12}
        fontWeight={600}
        textAnchor="end"
      >
        {`\uAE30\uC900\uAC00 ${baseline.toLocaleString()}\uC6D0`}
      </text>
    </g>
  );
}

function CurrentPriceTag({
  currentPrice,
  chartRight,
  minDomain,
  maxDomain,
  plotTop,
  plotHeight,
}) {
  const currentY = getYCoordinate(currentPrice, minDomain, maxDomain, plotTop, plotHeight);

  if (!Number.isFinite(currentY)) {
    return null;
  }

  const clampedCenterY = clamp(
    currentY,
    plotTop + CURRENT_PRICE_TAG_HEIGHT / 2,
    plotTop + plotHeight - CURRENT_PRICE_TAG_HEIGHT / 2,
  );
  const label = Number(currentPrice).toLocaleString();
  const estimatedTextWidth = label.length * 7;
  const bodyWidth = clamp(
    estimatedTextWidth + CURRENT_PRICE_TAG_HORIZONTAL_PADDING * 2,
    CURRENT_PRICE_TAG_MIN_WIDTH,
    CURRENT_PRICE_TAG_MAX_WIDTH,
  );
  const bodyLeft = chartRight + CURRENT_PRICE_TAG_GAP;
  const bodyRight = bodyLeft + bodyWidth;
  const tipX = chartRight + CURRENT_PRICE_TAG_TIP_OFFSET;
  const topY = clampedCenterY - CURRENT_PRICE_TAG_HEIGHT / 2;
  const bottomY = clampedCenterY + CURRENT_PRICE_TAG_HEIGHT / 2;
  const points = [
    `${tipX},${clampedCenterY}`,
    `${bodyLeft},${topY}`,
    `${bodyRight},${topY}`,
    `${bodyRight},${bottomY}`,
    `${bodyLeft},${bottomY}`,
  ].join(" ");

  return (
    <g key="current-price-tag">
      <polygon
        points={points}
        fill={CURRENT_PRICE_TAG_COLOR}
        stroke="rgba(3,199,90,0.24)"
        strokeWidth={1}
      />
      <text
        x={bodyLeft + bodyWidth / 2}
        y={clampedCenterY}
        fill="#ffffff"
        fontSize={12}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>
    </g>
  );
}

function CandleOverlay({ data, currentPrice, baseline, baselineDisplayValue, yDomain }) {
  if (!data?.length) {
    return null;
  }

  const plotLeft = CHART_MARGIN.left;
  const plotTop = CHART_MARGIN.top;
  const plotRight = OVERLAY_VIEWBOX_WIDTH - CHART_MARGIN.right;
  const plotBottom = CHART_HEIGHT - CHART_MARGIN.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const minDomain = yDomain[0];
  const maxDomain = yDomain[1];
  const slotWidth = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;
  const candleWidth = Math.max(12, Math.min(24, slotWidth * 0.72));
  const xCoordinates = data.map((_, index) => plotLeft + slotWidth * index);

  return (
    <svg
      className="aiChartOverlay"
      viewBox={`0 0 ${OVERLAY_VIEWBOX_WIDTH} ${CHART_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <BaselineMarker
        baseline={baseline}
        baselineDisplayValue={baselineDisplayValue}
        minDomain={minDomain}
        maxDomain={maxDomain}
        plotLeft={plotLeft}
        plotRight={plotRight}
        plotTop={plotTop}
        plotHeight={plotHeight}
      />

      {data.map((item, index) => {
        const centerX = xCoordinates[index];
        const openY = getYCoordinate(item.open, minDomain, maxDomain, plotTop, plotHeight);
        const closeY = getYCoordinate(item.close, minDomain, maxDomain, plotTop, plotHeight);
        const highY = getYCoordinate(item.high, minDomain, maxDomain, plotTop, plotHeight);
        const lowY = getYCoordinate(item.low, minDomain, maxDomain, plotTop, plotHeight);

        if (![centerX, openY, closeY, highY, lowY].every(Number.isFinite)) {
          return null;
        }

        const top = Math.min(openY, closeY);
        const bottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(2, bottom - top);
        const isUp = item.close >= item.open;
        const stroke = isUp ? "#ff6b6b" : "#4d96ff";
        const fill = isUp ? "rgba(255,107,107,0.28)" : "rgba(77,150,255,0.28)";

        return renderCandle({
          item,
          index,
          centerX,
          candleWidth,
          highY,
          lowY,
          top,
          bodyHeight,
          stroke,
          fill,
        });
      })}

      <CurrentPriceTag
        currentPrice={currentPrice}
        chartRight={plotRight}
        minDomain={minDomain}
        maxDomain={maxDomain}
        plotTop={plotTop}
        plotHeight={plotHeight}
      />
    </svg>
  );
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString()}\uC6D0`;
}

function CandleTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;
  if (!item) {
    return null;
  }

  return (
    <div className="aiChartTooltip">
      <div className="aiChartTooltipLabel">{label}</div>
      <div>{`\uC2DC\uAC00: ${formatPrice(item.open)}`}</div>
      <div>{`\uACE0\uAC00: ${formatPrice(item.high)}`}</div>
      <div>{`\uC800\uAC00: ${formatPrice(item.low)}`}</div>
      <div>{`\uC885\uAC00: ${formatPrice(item.close)}`}</div>
    </div>
  );
}

export default function PriceChart({ data, baseline, currentPrice, isExecuted }) {
  const baselineOk = Number.isFinite(baseline) && baseline > 0;
  const currentPriceOk = Number.isFinite(currentPrice) && currentPrice > 0;
  const resolvedCurrentPrice = currentPriceOk ? currentPrice : data[data.length - 1]?.close;
  const { yDomain, baselineDisplayValue } = getVisualScale(
    data,
    baselineOk ? baseline : null,
    resolvedCurrentPrice,
  );

  return (
    <div className="aiChartWrap">
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ComposedChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke="rgba(3,199,90,0.08)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            hide
            width={0}
            domain={yDomain}
          />
          <Tooltip content={<CandleTooltip />} cursor={{ stroke: "rgba(3,199,90,0.16)" }} />
          <Line dataKey="close" stroke="transparent" dot={false} activeDot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <CandleOverlay
        data={data}
        currentPrice={resolvedCurrentPrice}
        baseline={baselineOk ? baseline : null}
        baselineDisplayValue={baselineDisplayValue}
        yDomain={yDomain}
      />

      {isExecuted ? (
        <div className="aiExecutionNotice">
          {"\uC8FC\uBB38\uC774 \uCCB4\uACB0\uB418\uC5C8\uC2B5\uB2C8\uB2E4."}
        </div>
      ) : null}
    </div>
  );
}
