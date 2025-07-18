import React, { useEffect, useRef, useState } from 'react';
import './ChatBox.css';

const API_URL = '/api/excel/chat/';

export default function ChatBox({ username = 'Usuário' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Busca mensagens do backend
  async function fetchMessages() {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, message: input })
      });
      setInput('');
      fetchMessages();
    } catch (e) {}
    setLoading(false);
  }

  return (
    <div className="chatbox">
      <div className="chatbox-header">Chat</div>
      <div className="chatbox-messages">
        {messages.map(msg => (
          <div key={msg.id} className={msg.user === username ? 'chatbox-msg self' : 'chatbox-msg'}>
            <span className="chatbox-user">{msg.user}:</span> {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chatbox-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite uma mensagem..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>Enviar</button>
      </form>
    </div>
  );
}
