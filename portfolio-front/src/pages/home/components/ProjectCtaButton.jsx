import "./ProjectCtaButton.css";
import { Link } from "react-router-dom";

export default function ProjectCtaButton({ to = "/projects", label = "Project 보기" }) {
  return (
      <div className="projectCtaWrap">
        <Link className="projectCtaBtn" to={to}>
          <span className="projectCtaText">{label}</span>
          <span className="projectCtaArrow" aria-hidden="true">→</span>
        </Link>
      </div>
  );
}