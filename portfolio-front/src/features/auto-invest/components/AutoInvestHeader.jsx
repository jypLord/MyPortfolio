import "./AutoInvestHeader.css";

export default function AutoInvestHeader() {
  return (
    <header className="head">
      <h1 className="h1 title">AutoInvest</h1>
      <p className="desc">
        투자에서 가장 중요한 손절!
        <br />

        우리가 손절하기 싫어하는 이유는 내가 팔면 오르는 것을 보기 힘들어서 아닐까요?
        <br />
        <br />
        현재 보유 중인 종목, 금액, 기준가를 입력하면 자동으로 손절하고, 주가가 회복되면 재매수해주는 프로젝트 입니다.
        <br />
        아래는 프로젝트의 샘플이며 실시간 데이터를 서버를 통해 가져옵니다.
        
        자세한 내용은{" "}
        <a
          className="desc-link"
          href="https://github.com/jypLord/autoInvest"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        를 참고해주세요.
      </p>
    </header>
  );
}
