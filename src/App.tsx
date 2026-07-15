import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { ProgressProvider } from "./context/ProgressContext";
import { initSpeech } from "./utils/speech";
import { Home } from "./pages/Home/Home";
import { Play } from "./pages/Play/Play";
import { Teacher } from "./pages/Teacher/Teacher";
import { Parent } from "./pages/Parent/Parent";
import { SessionSummary } from "./pages/Progress/SessionSummary";

/**
 * HashRouter is used instead of BrowserRouter so the built app can be
 * opened from a static file server (or file://-style hosting) without any
 * server-side routing config — fitting the "no backend" constraint.
 */
function App() {
  useEffect(() => {
    initSpeech();
  }, []);

  return (
    <ProgressProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/teacher" element={<Teacher />} />
          <Route path="/parent" element={<Parent />} />
          <Route path="/summary" element={<SessionSummary />} />
        </Routes>
      </HashRouter>
    </ProgressProvider>
  );
}

export default App;
