// Configuração da API
const API_BASE_URL = 'http://localhost:8000/api/excel';

// Salvar dados no servidor
export const saveToServer = async (data, versionName = null, autoSaveEnabled = true) => {
  if (!autoSaveEnabled) return { success: false, message: 'Auto-save desabilitado' };
  
  try {
    const response = await fetch(`${API_BASE_URL}/versions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: versionName || `Auto-save ${new Date().toLocaleString()}`,
        data: JSON.stringify(data),
        user: 'User'
      })
    });
    
    if (response.ok) {
      console.log('✅ Dados salvos no servidor');
      return { success: true, message: 'Dados salvos com sucesso' };
    } else {
      console.error('❌ Erro ao salvar no servidor');
      return { success: false, message: 'Erro ao salvar no servidor' };
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    return { success: false, message: 'Erro de conexão' };
  }
};

// Carregar dados do servidor
export const loadFromServer = async (versionId = null) => {
  try {
    const url = versionId 
      ? `${API_BASE_URL}/versions/${versionId}/`
      : `${API_BASE_URL}/versions/`;
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const latestVersion = data[0]; // Versão mais recente
        const parsedData = JSON.parse(latestVersion.data);
        console.log('✅ Dados carregados do servidor');
        return { 
          success: true, 
          data: parsedData, 
          timestamp: latestVersion.timestamp 
        };
      }
    }
    return { success: false, message: 'Nenhum dado encontrado' };
  } catch (error) {
    console.error('❌ Erro ao carregar do servidor:', error);
    return { success: false, message: 'Erro de conexão' };
  }
};

// Enviar mensagem para o chat
export const sendChatMessage = async (message) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: 'User',
        message: message
      })
    });
    
    if (response.ok) {
      // Recarregar mensagens do chat
      const chatResponse = await fetch(`${API_BASE_URL}/chat/`);
      if (chatResponse.ok) {
        const messages = await chatResponse.json();
        return { success: true, messages };
      }
    }
    return { success: false, message: 'Erro ao enviar mensagem' };
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    return { success: false, message: 'Erro de conexão' };
  }
};

// Carregar mensagens do chat
export const loadChatMessages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/`);
    if (response.ok) {
      const messages = await response.json();
      return { success: true, messages };
    }
    return { success: false, message: 'Erro ao carregar mensagens' };
  } catch (error) {
    console.error('❌ Erro ao carregar mensagens:', error);
    return { success: false, message: 'Erro de conexão' };
  }
};

// Verificar status da conexão
export const checkConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/versions/`);
    return response.ok ? 'connected' : 'error';
  } catch (error) {
    return 'disconnected';
  }
}; 