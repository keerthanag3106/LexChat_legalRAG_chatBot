// import React, { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next';
// import { updateLanguage } from '../services/api';

// export default function Navbar({ token, setToken }) {
//   const { t, i18n } = useTranslation();
//   const [theme, setTheme] = useState(() => {
//     try { return localStorage.getItem('theme') || 'default'; } catch (e) { return 'default'; }
//   });

//   useEffect(() => {
//     try { localStorage.setItem('theme', theme); } catch (e) {}
//     const root = document.documentElement;
//     if (theme === 'glass') {
//       root.classList.add('theme-glass');
//     } else {
//       root.classList.remove('theme-glass');
//     }
//   }, [theme]);
  
//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     setToken(null);
//     window.location.hash = '/';
//   };

//   const handleLanguageChange = async (e) => {
//     const newLang = e.target.value;
//     try {
//       // Persist in localStorage (so LanguageDetector picks it up reliably)
//       try { localStorage.setItem('i18nextLng', newLang); } catch (e) {}

//       if (token) {
//         // Only update in backend if user is logged in
//         await updateLanguage(newLang, token);
//       }

//       // Normalize and change UI language (use two-letter code)
//       const normalized = (newLang || 'en').split('-')[0];
//       await i18n.changeLanguage(normalized);
//     } catch (error) {
//       console.error('Failed to update language:', error);
//       // Revert the select value on error
//       try { e.target.value = (i18n.language || 'en').split('-')[0]; } catch (e) {}
//     }
//   };

//   return (
//     <nav className="site-nav">
//       <div className="nav-inner">
//         <div className="brand">{t('nav.brand')}</div>
//         <div className="nav-actions">
//            {/* /* Theme toggle
//           <button
//             title={theme === 'glass' ? 'Glass theme active' : 'Enable glass theme'}
//             className="small"
//             onClick={() => setTheme(prev => prev === 'glass' ? 'default' : 'glass')}
//             style={{ marginRight: 6 }}
//           >
//             {theme === 'glass' ? '✨ Glass' : '💎 Glass'}
//           </button> */  }
//           {/* Language Selector */}
//           <select 
//             value={(i18n.language || 'en').split('-')[0]}
//             onChange={handleLanguageChange}
//             className="nav-select"
//             aria-label={t('common.language')}
//           >
//             {Object.keys(i18n.options.resources || {}).map(code => {
//               const labels = {
//                 en: 'English',
//                 hi: 'हिन्दी',
//                 bn: 'বাংলা',
//                 ta: 'தமிழ்',
//                 te: 'తెలుగు',
//                 mr: 'मराठी',
//                 gu: 'ગુજરાતી',
//                 kn: 'ಕನ್ನಡ',
//                 ml: 'മലയാളം',
//                 pa: 'ਪੰਜਾਬੀ',
//                 or: 'ଓଡ଼ିଆ',
//                 as: 'অসমীয়া'
//               };
//               return <option key={code} value={code}>{labels[code] || code}</option>;
//             })}
//           </select>

//           {!token ? (
//             <>
//               <a href="#/" className="nav-link">{t('nav.home')}</a>
//               <a href="#/login" className="nav-link">{t('auth.login')}</a>
//               <a href="#/register" className="nav-link">{t('auth.register')}</a>
//             </>
//           ) : (
//             <>
//               <button className="nav-cta" onClick={handleLogout}>{t('auth.logout')}</button>
//             </>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// }




import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Navbar({ token, setToken, user }) {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState("");
  const [language, setLanguage] = useState(localStorage.getItem("i18nextLng") || "en");

  useEffect(() => {
    if (user?.name) setUsername(user.name);
    else {
      const stored = localStorage.getItem("username");
      if (stored) setUsername(stored);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
    setToken(null);
    window.location.hash = "/";
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
    i18n.changeLanguage(lang);
  };

  const languageLabels = {
    en: "English",
    hi: "हिन्दी",
    bn: "বাংলা",
    ta: "தமிழ்",
    te: "తెలుగు",
    mr: "मराठी",
    gu: "ગુજરાતી",
    kn: "ಕನ್ನಡ",
    ml: "മലയാളം",
    pa: "ਪੰਜਾਬੀ",
    or: "ଓଡ଼ିଆ",
    as: "অসমীয়া",
  };

  return (
    <nav
      style={{
        background: "linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        padding: "12px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          fontSize: "1.3rem",
          fontWeight: "700",
          color: "#1e3a8a",
          cursor: "pointer",
        }}
        onClick={() => (window.location.hash = "/")}
      >
        Legal RAG Chatbot
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Language selector */}
        <select
          value={language}
          onChange={handleLanguageChange}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: "0.95rem",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease-in-out",
          }}
          onMouseOver={(e) => (e.target.style.boxShadow = "0 3px 8px rgba(0,0,0,0.15)")}
          onMouseOut={(e) => (e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)")}
        >
          {Object.keys(languageLabels).map((key) => (
            <option key={key} value={key}>
              {languageLabels[key]}
            </option>
          ))}
        </select>

        {!token ? (
          <>
            <a href="#/" style={{ textDecoration: "none", color: "#1e3a8a", fontWeight: 500 }}>
              Home
            </a>
            <a href="#/login" style={{ textDecoration: "none", color: "#1e3a8a", fontWeight: 500 }}>
              Login
            </a>
            <a href="#/register" style={{ textDecoration: "none", color: "#1e3a8a", fontWeight: 500 }}>
              Register
            </a>
          </>
        ) : (
          <>
            <span
              style={{
                fontWeight: "600",
                color: "#1e3a8a",
                background: "#e0f2fe",
                padding: "6px 12px",
                borderRadius: "6px",
              }}
            >
              Hello {username || "User"}
            </span>

            <a
              href="#/evaluations"
              style={{
                textDecoration: "none",
                backgroundColor: "#2563eb",
                color: "white",
                padding: "7px 13px",
                borderRadius: "8px",
                fontWeight: 500,
                transition: "0.3s",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#1e40af")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#2563eb")}
            >
              📊 Evaluations
            </a>

            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "#1e3a8a",
                color: "white",
                border: "none",
                padding: "7px 13px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 500,
                transition: "0.3s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#172554")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#1e3a8a")}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
