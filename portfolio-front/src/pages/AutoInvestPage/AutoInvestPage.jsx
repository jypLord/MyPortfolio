import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../../common/components/navbar/Navbar.jsx";
import AutoInvestHeader from "../../components/autoInvest/AutoInvestHeader.jsx";
import UserInputForm from "../../components/autoInvest/UserInputForm.jsx";
import { MAX_WATCH_ITEMS } from "../../constants/autoInvest";
import "./AutoInvestPage.css";

let stockValidatorModulePromise;
const MonitoringChartCard = lazy(() => import("../../components/autoInvest/MonitoringChartCard.jsx"));

function loadStockValidatorModule() {
  if (!stockValidatorModulePromise) {
    stockValidatorModulePromise = import("../../utils/StockValidator.js");
  }

  return stockValidatorModulePromise;
}

export default function AutoInvestPage() {
  const [symbol, setSymbol] = useState("삼성전자");
  const [buyAmount, setBuyAmount] = useState("1000000");
  const [baseline, setBaseline] = useState("200000");
  const [savedItems, setSavedItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const stockValidatorRef = useRef(null);

  const chartColumns = useMemo(() => {
    const count = savedItems.length;

    if (count <= 1) return 1;
    if (count <= 5) return count;
    return 5;
  }, [savedItems.length]);

  useEffect(() => {
    let isMounted = true;

    loadStockValidatorModule()
      .then((module) => {
        if (isMounted) {
          stockValidatorRef.current = module;
        }
      })
      .catch(() => {
        if (isMounted) {
          stockValidatorRef.current = null;
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function validateSymbol(nextItem) {
    const stockValidator =
      stockValidatorRef.current ?? await loadStockValidatorModule();

    stockValidatorRef.current = stockValidator;

    if (!stockValidator.isValidStockName(nextItem.symbol)) {
      throw new Error("상장되지 않은 종목명입니다.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextSymbol = symbol.trim();
    const nextBuyAmount = Number(buyAmount);
    const nextBaseline = Number(baseline);
    const editingItem = savedItems.find((item) => item.id === editingItemId) ?? null;

    setFormMessage("");
    setFormError("");

    if (
      !nextSymbol ||
      !Number.isFinite(nextBuyAmount) ||
      nextBuyAmount <= 0 ||
      !Number.isFinite(nextBaseline) ||
      nextBaseline <= 0
    ) {
      setFormError("종목명, 매수 금액, 기준가를 올바르게 입력해 주세요.");
      return;
    }

    const normalizedSymbol = nextSymbol.toLowerCase();
    const duplicateItem = savedItems.find(
      (item) => (
        item.symbol.toLowerCase() === normalizedSymbol &&
        item.id !== editingItemId
      ),
    );

    if (duplicateItem) {
      setFormError("이미 등록된 종목입니다.");
      return;
    }

    const nextItem = {
      id: editingItem?.id ?? `${nextSymbol}-${Date.now()}`,
      symbol: nextSymbol,
      buyAmount: Math.round(nextBuyAmount),
      baseline: Math.round(nextBaseline),
    };

    if (
      editingItem &&
      editingItem.symbol.toLowerCase() === normalizedSymbol &&
      editingItem.buyAmount === nextItem.buyAmount &&
      editingItem.baseline === nextItem.baseline
    ) {
      setFormError("변경된 내용이 없습니다.");
      return;
    }

    if (!editingItem && savedItems.length >= MAX_WATCH_ITEMS) {
      setFormError("샘플에서는 한 종목만 등록할 수 있습니다.");
      return;
    }

    setIsSaving(true);

    try {
      await validateSymbol(nextItem);
      setSavedItems((current) => (
        editingItem
          ? current.map((item) => (item.id === editingItem.id ? nextItem : item))
          : [...current, nextItem]
      ));
      setFormMessage(editingItem ? "종목 정보를 수정했습니다." : "종목을 저장했습니다.");
      setSymbol("");
      setBuyAmount("");
      setBaseline("");
      setEditingItemId(null);
    } catch (error) {
      setFormError(`저장에 실패했습니다. ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  function handleSelectItem(item) {
    setEditingItemId(item.id);
    setSymbol(item.symbol);
    setBuyAmount(String(item.buyAmount));
    setBaseline(String(item.baseline));
    setFormMessage("선택한 종목 정보를 불러왔습니다.");
    setFormError("");
  }

  function handleDeleteItem(itemId) {
    setSavedItems((current) => {
      const nextItems = current.filter((item) => item.id !== itemId);

      if (!nextItems.length) {
        setIsMonitoring(false);
      }

      return nextItems;
    });

    if (editingItemId === itemId) {
      setEditingItemId(null);
      setSymbol("");
      setBuyAmount("");
      setBaseline("");
    }

    setFormMessage("저장한 종목을 삭제했습니다.");
    setFormError("");
  }

  return (
    <div className="app">
      <Navbar />

      <main className="autoMain">
        <AutoInvestHeader />

        <UserInputForm
          symbol={symbol}
          buyAmount={buyAmount}
          baseline={baseline}
          onChangeSymbol={setSymbol}
          onChangeBuyAmount={(value) => setBuyAmount(value.replace(/[^\d]/g, ""))}
          onChangeBaseline={(value) => setBaseline(value.replace(/[^\d]/g, ""))}
          onSubmit={handleSubmit}
          submitLabel={isSaving ? "저장 중..." : editingItemId ? "수정하기" : "저장하기"}
        />

        <section className="autoWatchSection">
          <div className="autoWatchHeader">
            <div>
              <h3 className="autoSectionTitle">저장한 종목</h3>
              <p className="autoSectionDesc">
                감시 시작을 누르면 저장된 종목을 감시하고 차트를 불러옵니다. <br/>프로젝트에서는 10개까지 등록할 수 있지만, 샘플에서는 한 개로 제한합니다.
              </p>
            </div>

            <button
              type="button"
              className="autoStartBtn"
              onClick={() => setIsMonitoring(true)}
              disabled={!savedItems.length}
            >
              감시 시작
            </button>
          </div>

          {formError ? <p className="autoFeedback isError">{formError}</p> : null}
          {!formError && formMessage ? <p className="autoFeedback">{formMessage}</p> : null}

          {!savedItems.length ? (
            <div className="autoEmptyState">아직 저장한 종목이 없습니다.</div>
          ) : (
            <ul className="autoWatchList">
              {savedItems.map((item, index) => (
                <li key={item.id}>
                  <div className={`autoWatchItem${editingItemId === item.id ? " isSelected" : ""}`}>
                    <button
                      type="button"
                      className="autoWatchSelect"
                      onClick={() => handleSelectItem(item)}
                    >
                      <span className="autoWatchIndex">{index + 1}</span>
                      <span className="autoWatchSymbol">{item.symbol}</span>
                      <span className="autoWatchMeta">금액 {item.buyAmount.toLocaleString()}원</span>
                      <span className="autoWatchMeta">기준가 {item.baseline.toLocaleString()}원</span>
                    </button>

                    <div className="autoWatchActions">
                      <button
                        type="button"
                        className="autoDeleteBtn"
                        aria-label={`${item.symbol} 삭제`}
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <span aria-hidden="true">×</span>
                        <span className="autoDeleteHint" role="tooltip">삭제하기</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isMonitoring && savedItems.length ? (
          <section className="autoChartSection">
            <Suspense fallback={<p className="autoChartStatus">차트 불러오는 중...</p>}>
              <div
                className="autoChartGrid"
                style={{ "--chart-columns": chartColumns }}
              >
                {savedItems.map((item) => (
                  <MonitoringChartCard key={`${item.symbol}-${item.baseline}`} item={item} />
                ))}
              </div>
            </Suspense>
          </section>
        ) : null}
      </main>
    </div>
  );
}
