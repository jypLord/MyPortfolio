import "./Navbar.css";
import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_H = 72; // 네비 높이(px)
const SCROLL_KEY = "__scroll_target__";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const retryRef = useRef(null);

  const clearRetry = useCallback(() => {
    if (retryRef.current) {
      clearInterval(retryRef.current);
      retryRef.current = null;
    }
  }, []);

  const scrollToId = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return false;

    const y = el.getBoundingClientRect().top + window.scrollY - NAV_H;
    window.scrollTo({ top: y, behavior: "smooth" });
    return true;
  }, []);

  // 홈으로 이동한 뒤 "contact" 스크롤 예약이 있으면 실행
  useEffect(() => {
    clearRetry();

    const target = sessionStorage.getItem(SCROLL_KEY);
    if (!target) return;

    // 홈("/")에 도착했을 때만 스크롤 시도
    if (location.pathname !== "/") return;

    // 즉시 시도 → 없으면 잠깐 재시도(렌더 타이밍 대응)
    if (scrollToId(target)) {
      sessionStorage.removeItem(SCROLL_KEY);
      return;
    }

    let attempts = 0;
    retryRef.current = setInterval(() => {
      attempts += 1;

      if (scrollToId(target) || attempts >= 30) {
        sessionStorage.removeItem(SCROLL_KEY);
        clearRetry();
      }
    }, 50);

    return clearRetry;
  }, [location.pathname, location.hash, clearRetry, scrollToId]);

  // 로고 클릭: 홈으로 + 맨 위
  const onClickBrand = useCallback(
      (e) => {
        e.preventDefault();
        sessionStorage.removeItem(SCROLL_KEY);

        if (location.pathname !== "/") {
          navigate("/");
        }

        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 0);
      },
      [navigate, location.pathname]
  );

  // Project 클릭: /projects
  const onClickProject = useCallback(
      (e) => {
        e.preventDefault();
        sessionStorage.removeItem(SCROLL_KEY);
        navigate("/projects");
      },
      [navigate]
  );

  // Contact 클릭: 홈으로 이동 후 #contact로 스크롤
  const onClickContact = useCallback(
      (e) => {
        e.preventDefault();

        // 이미 홈이면 바로 스크롤
        if (location.pathname === "/") {
          scrollToId("contact");
          return;
        }

        // 다른 페이지면 홈으로 이동한 뒤 스크롤 예약
        sessionStorage.setItem(SCROLL_KEY, "contact");
        navigate("/");
      },
      [navigate, location.pathname, scrollToId]
  );

  return (
      <header className="navWrap">
        <nav className="nav">
          <a className="brand" href="/" onClick={onClickBrand} aria-label="홈으로 이동">
            JYPortfolio
          </a>

          <div className="navLinks">
            <a className="navLink" href="/projects" onClick={onClickProject}>
              Project
            </a>
            <a className="navLink" href="/#contact" onClick={onClickContact}>
              Contact
            </a>
          </div>
        </nav>
      </header>
  );
}