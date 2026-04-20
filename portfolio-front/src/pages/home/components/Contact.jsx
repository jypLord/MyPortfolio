import "./Contact.css";

export default function Contact() {
  return (
      <section id="contact" className="section">
        <div className="sectionHead">
          <h2 className="h2">Contact</h2>
        </div>

        <div className="card contactCard">
          <div className="contactRow">
            <span className="muted">Email</span>
            <a className="textLink" href="mailto:jygold2n@naver.com">
              jygold2n@naver.com
            </a>
          </div>
          <div className="contactRow">
            <span className="muted">GitHub</span>
            <a className="textLink" href="https://github.com/jypLord" target="_blank" rel="noreferrer">
              github.com/jypLord
            </a>
          </div>

        </div>
      </section>
  );
}