# 자동투자 차트 가격 조정 반영 수정

## 무엇을 바꿨나
`portfolio-front/src/components/autoInvest/MonitoringChartCard.jsx`의 `applySimulatedPriceToSeries` 함수를 수정했습니다.

이전에는 가격 올리기/내리기 버튼을 누르면 마지막 봉의 `open`, `high`, `low`, `close`를 모두 같은 값으로 바꿨습니다. 그래서 장 마감 후 `15:30` 이후 fetch로 받아온 차트에서도 시가가 같이 움직여 봉 모양이 무너졌습니다.

이제는 다음처럼 동작합니다.

- `open`은 기존 값을 유지합니다.
- `close`만 버튼으로 조정한 가격으로 바뀝니다.
- `high`는 기존 `high`, `open`, 새 `close` 중 가장 큰 값으로 계산합니다.
- `low`는 기존 `low`, `open`, 새 `close` 중 가장 작은 값으로 계산합니다.

## 왜 이렇게 바꿨나
캔들 차트에서 시가(`open`)는 그 봉이 시작한 가격이라, 버튼으로 현재 가격을 올리거나 내릴 때 같이 바뀌면 안 됩니다.

종가(`close`)가 변하면 몸통 길이가 달라지고, 새 종가가 기존 범위를 넘으면 고가/저가도 같이 확장되어야 실제 봉처럼 보입니다. 그래서 `Math.max(...)`, `Math.min(...)`으로 범위를 다시 계산했습니다.

## React 쪽 로직 변경
버튼으로 만든 임시 가격은 `priceOverride` 상태로 관리하도록 바꿨습니다.

- 이전: `useEffect` 안에서 `setSimulatedPrice(...)`를 호출해 최신 가격을 다시 상태에 넣음
- 이후: 마지막 캔들의 `timestamp`와 함께 override 값을 저장하고, 렌더링 시 현재 마지막 봉과 timestamp가 같을 때만 그 값을 적용

이 방식은 "어떤 봉에 대해 사용자가 임시로 가격을 바꿨는지"를 명확하게 표현합니다. 또 effect 안에서 바로 state를 다시 바꾸는 구조를 줄여서 React 흐름도 더 단순해집니다.
