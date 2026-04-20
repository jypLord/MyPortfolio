import Navbar from "../../shared/components/navbar/Navbar.jsx";
import Projects from "../../features/projects/components/Projects.jsx";
import "./ProjectListPage.css";

export default function ProjectListPage() {
  return (
      <div className="app projectListPage">
        <Navbar />

        <main className="projectListMain">
          <header className="projectListHead">
            <h1 className="h1 pageTitleDepth">Projects</h1>
          </header>

          {/* 여기부터 프로젝트 섹션 컴포넌트들을 쭉 쌓는 방식 */}
          <div className="projectListBody">
            <Projects />

            {/*
            나중에 이렇게 계속 추가하면 됨
            <Projects2 />
            <AutoInvestProject />
            <AnotherProject />
          */}
          </div>
        </main>
      </div>
  );
}
