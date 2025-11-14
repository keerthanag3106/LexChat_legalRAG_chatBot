import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ChatList({ chats, setActive, onDelete }) {
  const { t } = useTranslation();
  if (!Array.isArray(chats)) {
    return <div>{t('chat_list.no_chats_available')}</div>;
  }

  if (chats.length === 0) {
    return <div>{t('chat_list.no_chats_create')}</div>;
  }
  return (
    <div>
      {chats.map(c => (
        <div key={c._id} className="chat-item" onClick={() => setActive(c)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{c.title}</strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="small"
                title={t('chat_list.delete_title')}
                onClick={e => {
                  e.stopPropagation();
                  if (onDelete) onDelete(c._id);
                }}
              >
                🗑️
              </button>
            </div>
          </div>
          <div className="meta">{new Date(c.createdAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
