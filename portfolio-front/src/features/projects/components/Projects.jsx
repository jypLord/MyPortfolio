import { useNavigate } from "react-router-dom";
import "./Projects.css";

const projects = [
  {
    title: "AutoInvest",
    period: "2개월",
    tags: ["WebSocket", "Spring WebFlux", "Redis", "AWS"],
    desc:
        "주가가 지정가 밑으로 떨어지면 자동으로 손절 한 후, 주가가 회복됐을 때 다시 재매수 하는 프로젝트입니다.",
    links: [
      { label: "GitHub", href: "https://github.com/jypLord/autoInvest" },

    ],
    path: "/projects/autoInvest"
  }
];

export default function Projects() {
  const navigate = useNavigate();

  return (
      <section id="projects" className="section">
        <div className="sectionHead">
        </div>

        <div className="cardGrid">
          {projects.map((p) => (
              <article
                  key={p.title}
                  className="card clickableCard"
                  onClick={() => navigate(p.path)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate("/projects/autoInvest");
                    }
                  }}
                  role="link"
                  tabIndex={0}
              >
                <div className="cardTop">
                  <h3 className="h3">{p.title}</h3>
                  <span className="muted">{p.period}</span>
                </div>

                <p className="cardDesc">{p.desc}</p>

                <div className="tagRow">
                  {p.tags.map((t) => (
                      <span key={t} className="tag">
                  {t}
                </span>
                  ))}
                </div>

                <div className="linkRow">
                  {p.links.map((l) => (
                      <a
                          key={l.label}
                          className="textLink"
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                      >
                        {l.label} →
                      </a>
                  ))}
                </div>
              </article>
          ))}
        </div>
      </section>
  );
}
