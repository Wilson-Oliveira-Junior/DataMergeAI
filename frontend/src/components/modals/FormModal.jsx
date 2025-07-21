import React from 'react';

export default function FormModal({ show, onClose, formFields }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
        <h3>Criar Formulário (simulação)</h3>
        <form>
          {formFields.map((field, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <label>{field}: </label>
              <input type="text" placeholder={field} />
            </div>
          ))}
        </form>
        <button style={{ marginTop: 16 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
} 