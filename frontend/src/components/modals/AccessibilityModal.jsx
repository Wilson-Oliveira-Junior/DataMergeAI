import React from 'react';

export default function AccessibilityModal({ show, onClose }) {
  if (!show) return null;
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 500, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
        <h3>Acessibilidade</h3>
        <div style={{ marginBottom: 16 }}>
          <h4>Atalhos de Teclado</h4>
          <ul>
            <li><strong>Tab</strong> - Navegar entre células</li>
            <li><strong>Enter</strong> - Mover para célula abaixo</li>
            <li><strong>Shift + Enter</strong> - Mover para célula acima</li>
            <li><strong>Ctrl + C</strong> - Copiar</li>
            <li><strong>Ctrl + V</strong> - Colar</li>
            <li><strong>Ctrl + Z</strong> - Desfazer</li>
            <li><strong>Ctrl + Y</strong> - Refazer</li>
          </ul>
        </div>
        <div style={{ marginBottom: 16 }}>
          <h4>Navegação por Teclado</h4>
          <p>Use Tab para navegar entre células e menus. Use Enter para editar células.</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <h4>Contraste</h4>
          <p>O sistema suporta modo escuro e claro para melhor contraste.</p>
        </div>
        <button style={{ marginTop: 16 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}