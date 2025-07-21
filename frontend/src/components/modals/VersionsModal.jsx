import React from 'react';

export default function VersionsModal({ show, onClose, loadingVersions, versions, onRestoreVersion }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 10, minWidth: 340, maxWidth: 500, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.13)', padding: 24 }} onClick={e => e.stopPropagation()}>
        <h3>Histórico de versões</h3>
        {loadingVersions ? <div>Carregando...</div> : (
          <>
            {versions.length === 0 && <div>Nenhuma versão salva.</div>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {versions.map(v => (
                <li key={v.id} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                  <div><b>{v.name}</b></div>
                  <div style={{ fontSize: 12, color: '#888' }}>{new Date(v.timestamp).toLocaleString()} {v.user && `por ${v.user}`}</div>
                  <button style={{ marginTop: 6 }} onClick={() => onRestoreVersion(v)}>Restaurar</button>
                </li>
              ))}
            </ul>
          </>
        )}
        <button style={{ marginTop: 12 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
} 