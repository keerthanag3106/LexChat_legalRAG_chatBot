// import React, { useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import { post } from '../services/api';

// export default function Login({ setToken }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { i18n, t } = useTranslation();

//   const submit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res = await post('/auth/login', { email, password });
//       if (res.token) {
//         // Set user's language preference
//         if (res.user.language) {
//           await i18n.changeLanguage(res.user.language);
//         }
//         setToken(res.token);
//         window.location.hash = '/';
//       } else {
//         alert(res.message || t('common.error'));
//       }
//     } catch (err) {
//   alert(err.message || t('common.error'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-page">
//       <div className="auth-panel">
//         <div className="auth-brand">
//           <h2>{t('auth_ui.welcome_back')}</h2>
//           <p className="auth-sub">{t('auth_ui.signin_sub')}</p>
//         </div>

//         <form onSubmit={submit} className="auth-form">
//           <label className="auth-label">{t('auth.email')}</label>
//           <input
//             className="auth-input"
//             placeholder="you@domain.com"
//             value={email}
//             onChange={e => setEmail(e.target.value)}
//             required
//             type="email"
//           />

//           <label className="auth-label">{t('auth.password')}</label>
//           <input
//             className="auth-input"
//             placeholder="Your password"
//             type="password"
//             value={password}
//             onChange={e => setPassword(e.target.value)}
//             required
//           />

//           <div className="auth-actions">
//             <button className="auth-submit" type="submit" disabled={loading}>
//               {loading ? t('auth_ui.signing_in') : t('auth.login')}
//             </button>
//               <a className="auth-link" href="#/register">{t('auth_ui.create_account')}</a>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }




import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { post } from '../services/api';

export default function Login({ setToken, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { i18n, t } = useTranslation();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await post('/auth/login', { email, password });
      if (res.token) {
        if (res.user.language) {
          await i18n.changeLanguage(res.user.language);
        }
        // Save token & user info
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        window.location.hash = '/';
      } else {
        alert(res.message || t('common.error'));
      }
    } catch (err) {
      alert(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-brand">
          <h2>{t('auth_ui.welcome_back')}</h2>
          <p className="auth-sub">{t('auth_ui.signin_sub')}</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-label">{t('auth.email')}</label>
          <input
            className="auth-input"
            placeholder="you@domain.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            type="email"
          />

          <label className="auth-label">{t('auth.password')}</label>
          <input
            className="auth-input"
            placeholder="Your password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <div className="auth-actions">
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? t('auth_ui.signing_in') : t('auth.login')}
            </button>
            <a className="auth-link" href="#/register">
              {t('auth_ui.create_account')}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
