import React, { useEffect, useRef, useState } from 'react';
import './ChatBox.css';

const API_URL = '/api/excel/chat/';

export default function ChatBox({ username = 'Usuário' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  async function handleNewChat() {
    setLoading(true);
    try {
      await fetch('/api/excel/chat/clear/', { method: 'POST' });
      setMessages([]);
      setInput('');
    } catch {}
    setLoading(false);
  }

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
      <div className="chatbox-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span>Chat</span>
        <span style={{marginLeft:12, fontSize:13, color:'#1976d2', fontWeight:'bold'}}>Você: {username}</span>
        <button style={{marginLeft:8,padding:'2px 10px',fontSize:13,borderRadius:6,border:'none',background:'#1976d2',color:'#fff',cursor:'pointer'}} onClick={handleNewChat} disabled={loading}>Novo Chat</button>
      </div>
      <div className="chatbox-messages" style={{background:'#e3f2fd'}}>
        {messages.map(msg => (
          <div key={msg.id} className={msg.user === username ? 'chatbox-msg self' : 'chatbox-msg'} style={{background:msg.user === username ? '#bbdefb' : '#e3f2fd',color:'#222'}}>
            <span className="chatbox-user">{msg.user === username ? 'Você' : msg.user}:</span> {msg.message}
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
