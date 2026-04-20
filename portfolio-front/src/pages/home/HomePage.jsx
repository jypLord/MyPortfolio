import Navbar from "../../shared/components/navbar/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import TechStack from "./components/TechStack.jsx";
import Contact from "./components/Contact.jsx";


export default function HomePage() {
  return (
      <div className="app">
        <Navbar />

        <main>
          <Hero />
          <TechStack />
          <Contact />
        </main>
      </div>
  );
}
