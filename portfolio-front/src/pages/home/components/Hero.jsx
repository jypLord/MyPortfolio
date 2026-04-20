import "./Hero.css";

export default function Hero() {
  return (
      <section id="top" className="section hero">
        <div className="heroGrid">
          <div className="heroLeft">
            <div className="avatarWrap">
              <img
                  className="avatar"
                  src="/me.jpg"
                  alt="프로필 사진"
                  loading="eager"
              />
            </div>
          </div>

          <div className="heroRight">
            <p className="kicker">Backend Developer</p>
            <h1 className="title">
              안녕하세요, 백엔드 개발자 <span className="accent">박준영</span>입니다
            </h1>
            <p className="subtitle">
              직장에서 모든 업무를 자동화하며 개발의 세계에 빠져들었습니다.<br />
              이제는 직접 서비스에 기여하며 끊임없이 성장하는 보람을 느끼고 싶습니다!
            </p>

          </div>
        </div>
      </section>
  );
}
