import React from 'react';

export default function ConfigModal({ show, onClose }) {
  if (!show) return null;
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 500, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
        <h3>Configurações</h3>
        <div style={{ marginBottom: 16 }}>
          <h4>Geral</h4>
          <div style={{ marginBottom: 8 }}>
            <label>
              <input type="checkbox" defaultChecked /> Auto-save
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              <input type="checkbox" defaultChecked /> Mostrar linhas de grade
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>
              <input type="checkbox" /> Modo escuro
            </label>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <h4>Editor</h4>
          <div style={{ marginBottom: 8 }}>
            <label>
              Tamanho da fonte:
              <select defaultValue="12">
                <option value="10">10px</option>
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
              </select>
            </label>
          </div>
        </div>
        <button style={{ marginTop: 16 }} onClick={onClose}>Salvar</button>
      </div>
    </div>
  );
} 