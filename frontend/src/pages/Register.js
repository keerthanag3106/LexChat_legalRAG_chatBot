import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { post } from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await post('/auth/register', { name, email, password });
      if (res.message) {
        alert(t('auth_ui.registered_success'));
        window.location.hash = '#/login';
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
          <h2>{t('auth_ui.create_account')}</h2>
          <p className="auth-sub">{t('auth_ui.create_account_desc')}</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-label">{t('auth_ui.full_name')}</label>
          <input
            className="auth-input"
            placeholder={t('auth_ui.full_name')}
            value={name}
            onChange={e=>setName(e.target.value)}
            required
          />

          <label className="auth-label">{t('auth.email')}</label>
          <input
            className="auth-input"
            placeholder="you@domain.com"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            type="email"
          />

          <label className="auth-label">{t('auth.password')}</label>
          <input
            className="auth-input"
            placeholder="Create a password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
            type="password"
          />

          <div className="auth-actions">
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? t('auth_ui.registering') : t('auth_ui.create_account')}
            </button>
              <a className="auth-link" href="#/login">{t('auth_ui.already_account')}</a>
          </div>
        </form>
      </div>
    </div>
  );
}
