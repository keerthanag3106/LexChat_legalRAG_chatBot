import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { get, post, del } from '../services/api';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

export default function Dashboard({ token, setToken }) {
  const { t } = useTranslation();
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  // Load chats from server
  async function loadChats() {
    setLoading(true);
    try {
      const data = await get('/chats', token);
      if (Array.isArray(data)) {
        setChats(data);
        // Set active only if none selected
        setActive(prev => {
          if (prev && data.find(c => c._id === prev._id)) {
            return prev; // keep existing active if still present
          }
          return data.length ? data[0] : null;
        });
      } else {
        console.warn('Unexpected chats response', data);
        setChats([]);
        setActive(null);
      }
    } catch (err) {
      console.error('Error loading chats:', err);
      // api helper may have already cleared token on 401 and reloaded
      alert(err.message || 'Failed to load chats');
      setChats([]);
      setActive(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChats();
  }, [token]); // reload when token changes

  async function createChat() {
      try {
      const res = await post('/chats', { title: t('nav.new_chat') }, token);
      if (res && res._id) {
        setChats(prev => [res, ...prev]);
        setActive(res);
      } else {
        alert(t('alerts.create_failed'));
      }
    } catch (err) {
      console.error('Create chat error', err);
      alert(err.message || t('alerts.create_failed'));
    }
  }

  // New delete handler
  async function deleteChat(chatId) {
    if (!window.confirm(t('alerts.delete_confirm'))) return;
    try {
      await del(`/chats/${chatId}`, token);
      // remove from state
      setChats(prev => prev.filter(c => c._id !== chatId));
      setActive(prev => {
        if (prev && prev._id === chatId) {
          // choose first remaining or null
          const remaining = chats.filter(c => c._id !== chatId);
          return remaining.length ? remaining[0] : null;
        }
        return prev;
      });
    } catch (err) {
      console.error('Delete chat error', err);
      alert(err.message || t('alerts.delete_failed'));
    }
  }

  return (
    <div className="dashboard layout">
      <div className={`sidebar-panel ${panelOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>{t('dashboard.chats')}</h2>
          <div className="sidebar-controls">
            <button className="small" onClick={createChat}>+ {t('dashboard.new')}</button>
            <button className="small" onClick={() => setPanelOpen(false)}>{t('dashboard.hide')}</button>
          </div>
        </div>
        <div className="sidebar-body">
          {loading ? <div>{t('common.loading')}</div> : <ChatList chats={chats} setActive={setActive} onDelete={deleteChat} />}
        </div>
      </div>

      <main className="main-panel">
        <div className="main-header">
          <button className="small" onClick={() => setPanelOpen(!panelOpen)}>
            {panelOpen ? t('dashboard.hide_chats') : t('dashboard.show_chats')}
          </button>
          <div className="spacer" />
        </div>

        <div className="main-content">
          {active ? <ChatWindow chat={active} token={token} refreshChats={loadChats} /> : <div className="empty">{t('dashboard.select_create')}</div>}
        </div>
      </main>
    </div>
  );
}
