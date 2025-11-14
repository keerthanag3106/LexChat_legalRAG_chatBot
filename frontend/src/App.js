// import React, { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next';
// import Dashboard from './pages/Dashboard';
// import LandingPage from './pages/LandingPage';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Navbar from './components/Navbar';
// import EvaluationDashboard from './pages/EvaluationDashboard';

// function App() {
//   const [token, setToken] = useState(localStorage.getItem('token') || null);
//   const [route, setRoute] = useState(window.location.hash.replace('#', '') || '/');
//   const [showDashboard, setShowDashboard] = useState(false);
//   const { i18n } = useTranslation();

//   useEffect(() => {
//     function onHashChange() {
//       setRoute(window.location.hash.replace('#', '') || '/');
//     }
//     window.addEventListener('hashchange', onHashChange);
//     return () => window.removeEventListener('hashchange', onHashChange);
//   }, []);

//   useEffect(() => {
//     if (token) localStorage.setItem('token', token);
//     else localStorage.removeItem('token');
//   }, [token]);

//   const { t } = useTranslation();

//   // If logged in, always show dashboard regardless of hash
//   if (token && showDashboard) {
//     return (
//       <>
//         <Navbar token={token} setToken={setToken} />
//         <button onClick={() => setShowDashboard(false)} style={{ margin: 20 }}>{t('app.back_to_chat')}</button>
//         <EvaluationDashboard token={token} />
//       </>
//     );
//   }

//   if (token) {
//     return (
//       <>
//         <Navbar token={token} setToken={setToken} />
//         <button onClick={() => setShowDashboard(true)} style={{ position: 'fixed', top: 80, right: 20, zIndex: 50 }}>
//           {t('app.evaluations_button')}
//         </button>
//         <Dashboard token={token} setToken={setToken} />
//       </>
//     );
//   }

//   // Not logged in: route between landing, login, register
//   return (
//     <>
//       <Navbar token={token} setToken={setToken} />
//       {route === '/login' && <Login setToken={setToken} />}
//       {route === '/register' && <Register />}
//       {(route === '/' || route === '') && <LandingPage />}
//       {/* fallback */}
//       {route !== '/' && route !== '/login' && route !== '/register' && <LandingPage />}
//     </>
//   );
// }

// export default App;





import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import EvaluationDashboard from "./pages/EvaluationDashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [route, setRoute] = useState(window.location.hash.replace("#", "") || "/");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const { i18n } = useTranslation();

  // Sync hash route
  useEffect(() => {
    function onHashChange() {
      setRoute(window.location.hash.replace("#", "") || "/");
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Persist token and user info
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  // Logged in routes
  if (token) {
    if (route === "/evaluations") {
      return (
        <>
          <Navbar token={token} setToken={setToken} user={user} />
          <EvaluationDashboard token={token} />
        </>
      );
    }
    return (
      <>
        <Navbar token={token} setToken={setToken} user={user} />
        <Dashboard token={token} setToken={setToken} user={user} setUser={setUser} />
      </>
    );
  }

  // Not logged in routes
  return (
    <>
      <Navbar token={token} setToken={setToken} user={user} />
      {route === "/login" && <Login setToken={setToken} setUser={setUser} />}
      {route === "/register" && <Register />}
      {/* {(route === "/" || route === "") && <LandingPage />}
      {route !== "/" && route !== "/login" && route !== "/register" && <LandingPage />}
   */}
    {route === "/" && <LandingPage />}
    </>
  );
}

export default App;
