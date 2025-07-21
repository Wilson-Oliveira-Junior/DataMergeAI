import React from 'react';

export default function FindReplaceModal({ show, onClose, findValue, setFindValue, replaceValue, setReplaceValue, onReplaceAll }) {
  if (!show) return null;
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" style={{maxWidth:400}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">Pesquisar e substituir</div>
        <div>
          <input placeholder="Pesquisar por..." value={findValue} onChange={e => setFindValue(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <input placeholder="Substituir por..." value={replaceValue} onChange={e => setReplaceValue(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button onClick={onReplaceAll}>Substituir tudo</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
} 