import React from 'react';
import './ConnectionStatus.css';

const ConnectionStatus = ({ status, isSaving, lastSaved }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'disconnected':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'error':
        return 'Erro';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="connection-status">
      <div 
        className="status-indicator" 
        style={{ backgroundColor: getStatusColor() }}
        title={`Status: ${getStatusText()}`}
      />
      {isSaving && <span className="saving-text">Salvando...</span>}
      {lastSaved && (
        <span className="last-saved">
          Último salvamento: {lastSaved.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus; 