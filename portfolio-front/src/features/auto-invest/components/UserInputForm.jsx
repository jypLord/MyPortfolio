import "./UserInputForm.css";

export default function UserInputForm({
  symbol,
  buyAmount,
  baseline,
  onChangeSymbol,
  onChangeBuyAmount,
  onChangeBaseline,
  onSubmit,
  submitLabel = "저장",
}) {
  return (
    <section className="aiForm">
      <h3 className="aiFormTitle">종목 정보 입력</h3>

      <form className="aiFormBody" onSubmit={onSubmit}>
        <div className="aiGrid">
          <label className="aiField">
            <span className="aiLabel">종목명</span>
            <input
              className="aiInput"
              value={symbol}
              onChange={(event) => onChangeSymbol(event.target.value)}
              placeholder="예: 삼성전자"
            />
          </label>

          <label className="aiField">
            <span className="aiLabel">금액</span>
            <input
              className="aiInput"
              value={buyAmount}
              onChange={(event) => onChangeBuyAmount(event.target.value)}
              placeholder="예: 1000000"
              inputMode="numeric"
            />
          </label>

          <label className="aiField">
            <span className="aiLabel">기준가</span>
            <input
              className="aiInput"
              value={baseline}
              onChange={(event) => onChangeBaseline(event.target.value)}
              placeholder="예: 200000"
              inputMode="numeric"
            />
          </label>
        </div>

        <button type="submit" className="aiSubmitBtn">
          {submitLabel}
        </button>
      </form>
    </section>
  );
}
