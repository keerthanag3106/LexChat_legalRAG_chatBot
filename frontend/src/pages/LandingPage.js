// import React from 'react';
// import { useTranslation } from 'react-i18next';
//  import { Link } from 'react-router-dom';

// export default function LandingPage() {
//   const { t } = useTranslation();
//   return (
//     <div className="landing-root">
//       <header className="hero">
//         <div className="hero-inner hero-grid">
//           <div className="hero-copy">
//             <div className="eyebrow">{t('nav.brand')}</div>
//             <h1 className="hero-title">{t('hero.title')}</h1>
//             <p className="subtitle hero-sub">{t('hero.subtitle')}</p>
//             <div className="hero-actions">
//               {/* <a href="#/login" className="btn btn-primary hero-cta">{t('hero.login')}</a>
//               <a href="#/register" className="btn btn-secondary hero-cta-outline">{t('hero.register')}</a> */}
             

//             </div>
//             <div className="hero-note">{t('features.docs.title')} • {t('features.multiturn.title')} • {t('features.evaluation.title')}</div>
//           </div>

//           <div className="hero-visual" aria-hidden>
//             <div className="chat-preview">
//               <div className="chat-preview-header">
//                 <div className="chat-preview-title">{t('hero.title')}</div>
//                 <div className="preview-dots">
//                   <span className="dot" />
//                   <span className="dot" />
//                   <span className="dot" />
//                 </div>
//               </div>
//               <div className="chat-preview-messages">
//                 <div className="preview-message user">
//                   <div className="preview-bubble">{t('hero.sample_question')}</div>
//                 </div>
//                 <div className="preview-message assistant">
//                   <div className="preview-bubble">{t('hero.sample_answer')}</div>
//                 </div>
//               </div>
//             </div>
//             <div className="preview-features">
//               <div className="preview-feature">
//                 <span className="preview-icon">🔍</span>
//                 <span>{t('features.docs.title')}</span>
//               </div>
//               <div className="preview-feature">
//                 <span className="preview-icon">💬</span>
//                 <span>{t('features.multiturn.title')}</span>
//               </div>
//               <div className="preview-feature">
//                 <span className="preview-icon">⚖️</span>
//                 <span>{t('features.evaluation.title')}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </header>

//       <section id="features" className="features">
//         <div className="feature">
//           <h3>{t('features.docs.title')}</h3>
//           <p>{t('features.docs.desc')}</p>
//         </div>
//         <div className="feature">
//           <h3>{t('features.multiturn.title')}</h3>
//           <p>{t('features.multiturn.desc')}</p>
//         </div>
//         <div className="feature">
//           <h3>{t('features.evaluation.title')}</h3>
//           <p>{t('features.evaluation.desc')}</p>
//         </div>
//       </section>

//       <footer id="contact" className="landing-footer">
//         <div>© {new Date().getFullYear()} {t('nav.brand')}</div>
//       </footer>
//     </div>
//   );
// }



import React from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, MessageSquare, Scale } from "lucide-react";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="landing-root">
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1 className="hero-title">{t("hero.title")}</h1>
            <p className="subtitle hero-sub">{t("hero.subtitle")}</p>
          </div>

          <div className="hero-visual" aria-hidden>
            <div className="chat-preview">
              <div className="chat-preview-header">
                <div className="chat-preview-title">{t("hero.title")}</div>
                <div className="preview-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
              <div className="chat-preview-messages">
                <div className="preview-message user">
                  <div className="preview-bubble">{t("hero.sample_question")}</div>
                </div>
                <div className="preview-message assistant">
                  <div className="preview-bubble">{t("hero.sample_answer")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="feature">
          <div className="feature-icon-box">
            <BookOpen className="feature-icon book" />
          </div>
          <h3>{t("features.docs.title")}</h3>
          <p>{t("features.docs.desc")}</p>
        </div>

        <div className="feature">
          <div className="feature-icon-box">
            <MessageSquare className="feature-icon chat" />
          </div>
          <h3>{t("features.multiturn.title")}</h3>
          <p>{t("features.multiturn.desc")}</p>
        </div>

        <div className="feature">
          <div className="feature-icon-box">
            <Scale className="feature-icon balance" />
          </div>
          <h3>{t("features.evaluation.title")}</h3>
          <p>{t("features.evaluation.desc")}</p>
        </div>
      </section>

      <footer id="contact" className="landing-footer">
        <div>© {new Date().getFullYear()} {t("nav.brand")}</div>
      </footer>
    </div>
  );
}
