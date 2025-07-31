import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { MdUndo, MdRedo, MdPrint, MdFormatPaint, MdAttachMoney, MdPercent, MdExposureNeg1, MdExposurePlus1, MdFormatBold, MdFormatItalic, MdStrikethroughS, MdFormatColorText, MdFormatColorFill, MdBorderAll, MdMergeType, MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdWrapText, MdInsertLink, MdInsertComment, MdInsertChart, MdFilterList } from 'react-icons/md';
import './MainContent.css';
import './Modal.css';
import ChatBox from './ChatBox';
import './ChatBox.css';
import ChartModal from './modals/ChartModal';
import FormModal from './modals/FormModal';
import MacroModal from './modals/MacroModal';
import ScriptModal from './modals/ScriptModal';
import ReviewModal from './modals/ReviewModal';
import AccessibilityModal from './modals/AccessibilityModal';
import FindReplaceModal from './modals/FindReplaceModal';
import VersionsModal from './modals/VersionsModal';
import DetailsModal from './modals/DetailsModal';
import ConfigModal from './modals/ConfigModal';
import ExcelMenuBar from './ExcelMenuBar';
import ConnectionStatus from './ConnectionStatus';
import { saveToServer, loadFromServer, sendChatMessage, loadChatMessages, checkConnection } from '../utils/api';

// FunÃ§Ã£o utilitÃ¡ria para gerar cabeÃ§alhos de coluna estilo Excel
function getColumnLabel(n) {
  let label = '';
  while (n >= 0) {
    label = String.fromCharCode((n % 26) + 65) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

export default function MainContent() {
  const [numRows, setNumRows] = useState(1000);
  const [numCols, setNumCols] = useState(100);
  const columns = Array.from({ length: numCols }, (_, i) => getColumnLabel(i));
  const rows = Array.from({ length: numRows }, (_, i) => i + 1);
  function createEmptyData(rowsLen = numRows, colsLen = numCols) {
    return Array.from({ length: rowsLen }, () => Array(colsLen).fill(''));
  }
  const [cellData, setCellData] = useState(createEmptyData());
  
  // Função para garantir que cellData tenha o tamanho correto
  function ensureCellDataSize() {
    if (cellData.length !== numRows || cellData[0]?.length !== numCols) {
      const newData = createEmptyData(numRows, numCols);
      // Copiar dados existentes
      for (let r = 0; r < Math.min(cellData.length, numRows); r++) {
        for (let c = 0; c < Math.min(cellData[r]?.length || 0, numCols); c++) {
          newData[r][c] = cellData[r]?.[c] || '';
        }
      }
      setCellData(newData);
    }
  }
  
  // Garantir que cellData esteja sincronizado quando numRows/numCols mudarem
  useEffect(() => {
    ensureCellDataSize();
  }, [numRows, numCols]);


  const [cellTypes, setCellTypes] = useState({});
  const [cellStyles, setCellStyles] = useState({});
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartData, setChartData] = useState('');
  const [sheetName, setSheetName] = useState('Book1');
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [readOnly, setReadOnly] = useState(false);
  const [frozen, setFrozen] = useState({ row: false, col: false });
  const [hiddenRows, setHiddenRows] = useState([]);
  const [hiddenCols, setHiddenCols] = useState([]);
  const [showFormulas, setShowFormulas] = useState(false);
  const [zoom, setZoom] = useState(1);
  // Handlers para o menu Ver
  function handleModoExibicao() {
    setReadOnly(r => !r);
  }
  function handleCongelar() {
    setFrozen(f => ({ row: !f.row, col: !f.col }));
  }
  function handleOcultarLinhas() {
    const linha = window.prompt('Ocultar qual linha? (1-100)');
    if (linha) setHiddenRows(r => [...r, Number(linha) - 1]);
  }
  function handleOcultarColunas() {
    const coluna = window.prompt('Ocultar qual coluna? (A-K)');
    const idx = columns.indexOf(coluna);
    if (idx >= 0) setHiddenCols(c => [...c, idx]);
  }
  function handleMostrarFormulas() {
    setShowFormulas(f => !f);
  }
  function handleZoom() {
    const z = window.prompt('Zoom (ex: 1 = 100%, 1.5 = 150%)', zoom);
    if (z && !isNaN(Number(z))) setZoom(Number(z));
  }
  const viewMenuHandlers = {
    'Modo de exibiÃ§Ã£o': handleModoExibicao,
    'Congelar': handleCongelar,
    'Ocultar linhas': handleOcultarLinhas,
    'Ocultar colunas': handleOcultarColunas,
    'Mostrar fÃ³rmulas': handleMostrarFormulas,
    'Zoom': handleZoom
  };
  const [clipboard, setClipboard] = useState('');
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const fileInputRef = useRef(null);
  
  // Estados para integração com backend
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // useEffect para verificar conexão com backend
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const status = await checkConnection();
        setConnectionStatus(status);
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        setConnectionStatus('disconnected');
      }
    };

    // Verificar conexão inicial
    checkBackendConnection();

    // Verificar conexão a cada 30 segundos
    const intervalId = setInterval(checkBackendConnection, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // useEffect para auto-save
  useEffect(() => {
    if (!autoSaveEnabled || connectionStatus !== 'connected') return;

    const autoSave = async () => {
      try {
        setIsSaving(true);
        const result = await saveToServer(cellData, null, autoSaveEnabled);
        if (result.success) {
          setLastSaved(new Date());
        }
        setIsSaving(false);
      } catch (error) {
        console.error('Erro no auto-save:', error);
        setIsSaving(false);
      }
    };
    
    // Debounce de 2 segundos
    const timeoutId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [cellData, autoSaveEnabled, connectionStatus]);

  // Novo: limpa a tabela, mas pede confirmaÃ§Ã£o se houver dados
  function handleNovo() {
    const hasData = cellData.some(row => row.some(cell => cell !== ''));
    if (hasData) {
      if (!window.confirm('Os dados nÃ£o salvos serÃ£o perdidos. Deseja continuar?')) {
        return;
      }
    }
    setCellData(createEmptyData());
  }


  // Abrir: importa Excel (sobrescreve tudo)
  function handleAbrir() {
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current.dataset.mode = 'abrir';
    fileInputRef.current?.click();
  }

  // Importar: importa Excel e mescla dados
  function handleImportar() {
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current.dataset.mode = 'importar';
    fileInputRef.current?.click();
  }

  // Fazer uma cÃ³pia: salva cÃ³pia em memÃ³ria (simples)
  const [copias, setCopias] = useState([]); // [{nome, data}]
  function handleFazerCopia() {
    const nome = window.prompt('Nome da cÃ³pia:', 'CÃ³pia de Book1');
    if (!nome) return;
    setCopias([...copias, { nome, data: JSON.parse(JSON.stringify(cellData)) }]);
    window.alert('CÃ³pia salva em memÃ³ria!');
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const mode = e.target.dataset.mode;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      if (mode === 'abrir') {
        // Sobrescreve tudo - expande o grid se necessário
        const requiredRows = Math.max(sheetData.length, numRows);
        const requiredCols = Math.max(Math.max(...sheetData.map(row => row ? row.length : 0)), numCols);
        
        // Expandir grid se necessário
        if (requiredRows > numRows) {
          setNumRows(requiredRows);
        }
        if (requiredCols > numCols) {
          setNumCols(requiredCols);
        }
        
        const newData = createEmptyData(requiredRows, requiredCols);
        for (let r = 0; r < sheetData.length; r++) {
          for (let c = 0; c < (sheetData[r] ? sheetData[r].length : 0); c++) {
            newData[r][c] = sheetData[r][c] !== undefined ? String(sheetData[r][c]) : '';
          }
        }
        setCellData(newData);
      } else if (mode === 'importar') {
        // Mescla dados: sÃ³ preenche cÃ©lulas vazias
        const requiredRows = Math.max(sheetData.length, cellData.length);
        const requiredCols = Math.max(
          Math.max(...sheetData.map(row => row ? row.length : 0)), 
          Math.max(...cellData.map(row => row ? row.length : 0))
        );
        
        // Expandir grid se necessário
        if (requiredRows > numRows) {
          setNumRows(requiredRows);
        }
        if (requiredCols > numCols) {
          setNumCols(requiredCols);
        }
        
        const newData = createEmptyData(requiredRows, requiredCols);
        
        // Copiar dados existentes
        for (let r = 0; r < cellData.length; r++) {
          for (let c = 0; c < (cellData[r]?.length || 0); c++) {
            newData[r][c] = cellData[r]?.[c] || '';
          }
        }
        
        // Mesclar novos dados apenas em células vazias
        for (let r = 0; r < sheetData.length; r++) {
          for (let c = 0; c < (sheetData[r] ? sheetData[r].length : 0); c++) {
            if ((!newData[r] || newData[r][c] === '') && sheetData[r][c] !== undefined && sheetData[r][c] !== '') {
              newData[r][c] = String(sheetData[r][c]);
            }
          }
        }
        setCellData(newData);
        
        // Mostrar informações sobre a importação
        const totalRows = sheetData.length;
        const totalCols = Math.max(...sheetData.map(row => row ? row.length : 0));
        console.log(`✅ Planilha importada com sucesso!`);
        console.log(`📊 Dimensões: ${totalRows} linhas x ${totalCols} colunas`);
        console.log(`🔧 Grid expandido para: ${requiredRows} linhas x ${requiredCols} colunas`);
        
        // Mostrar alerta se a planilha for muito grande
        if (totalRows > 1000) {
          alert(`⚠️ Planilha grande importada: ${totalRows} linhas x ${totalCols} colunas\n\nO sistema pode ficar mais lento com planilhas muito grandes.`);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // HistÃ³rico para desfazer/refazer
  function pushHistory(newData) {
    setHistory(h => [...h, cellData]);
    setFuture([]);
    setCellData(newData);
  }

  // Baixar: exporta Excel
  function handleBaixar() {
    const ws = XLSX.utils.aoa_to_sheet(cellData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planilha1');
    XLSX.writeFile(wb, 'DataMergeAI.xlsx');
  }
  // Editar: desfazer/refazer/cortar/copiar/colar/excluir/pesquisar
  function handleDesfazer() {
    if (history.length > 0) {
      setFuture(f => [cellData, ...f]);
      setCellData(history[history.length - 1]);
      setHistory(history.slice(0, -1));
    }
  }
  function handleRefazer() {
    if (future.length > 0) {
      setHistory(h => [...h, cellData]);
      setCellData(future[0]);
      setFuture(future.slice(1));
    }
  }
  function handleCortar() {
    const { row, col } = selectedCell;
    setClipboard(cellData[row]?.[col] || '');
    const newData = cellData.map(arr => [...arr]);
    newData[row][col] = '';
    pushHistory(newData);
  }
  function handleCopiar() {
    const { row, col } = selectedCell;
    setClipboard(cellData[row]?.[col] || '');
  }
  function handleColar() {
    const { row, col } = selectedCell;
    const newData = cellData.map(arr => [...arr]);
    newData[row][col] = clipboard;
    pushHistory(newData);
  }
  function handleColarEspecial() {
    window.prompt('Colar especial (simulaÃ§Ã£o): valor no clipboard =', clipboard);
  }
  function handleExcluir() {
    const { row, col } = selectedCell;
    const newData = cellData.map(arr => [...arr]);
    newData[row][col] = '';
    pushHistory(newData);
  }
  function handlePesquisarSubstituir() {
    setShowFindReplace(true);
  }
  function doFindReplace() {
    const newData = cellData.map(row => row.map(cell => cell === findValue ? replaceValue : cell));
    pushHistory(newData);
    setShowFindReplace(false);
    setFindValue('');
    setReplaceValue('');
  }

  // Renomear: altera nome da planilha
  function handleRenomear() {
    const novoNome = window.prompt('Novo nome da planilha:', sheetName);
    if (novoNome && novoNome.trim()) setSheetName(novoNome.trim());
  }

  // Salvar versÃ£o no backend
  async function handleSalvarVersao() {
    const payload = {
      name: `${sheetName} (${new Date().toLocaleString()})`,
      data: JSON.stringify(cellData),
      user: sheetName,
    };
    const res = await fetch('/api/excel/versions/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert('VersÃ£o salva com sucesso!');
      fetchVersions();
    } else {
      alert('Erro ao salvar versÃ£o.');
    }
  }

  // Buscar versÃµes do backend
  async function fetchVersions() {
    setLoadingVersions(true);
    const res = await fetch('/api/excel/versions/');
    if (res.ok) {
      const data = await res.json();
      setVersions(data);
    }
    setLoadingVersions(false);
  }

  // Abrir modal de versÃµes
  function handleShowVersions() {
    setShowVersions(true);
    fetchVersions();
  }

  // Restaurar versÃ£o
  function handleRestaurarVersao(version) {
    try {
      const data = JSON.parse(version.data);
      setCellData(data);
      setShowVersions(false);
      alert('VersÃ£o restaurada!');
    } catch {
      alert('Erro ao restaurar versÃ£o.');
    }
  }

  // Enviar planilha por e-mail
  async function handleEnviarEmail() {
    const to_email = window.prompt('Digite o e-mail de destino:');
    if (!to_email) return;
    // Monta dados como array de arrays (igual exportaÃ§Ã£o)
    const data = cellData;
    // Envia para backend
    const res = await fetch('/api/excel/exportar-email/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: JSON.stringify(data),
        to_email,
        sheet_name: sheetName
      })
    });
    if (res.ok) {
      alert('Planilha enviada por e-mail com sucesso!');
    } else {
      const err = await res.json().catch(() => ({}));
      alert('Erro ao enviar e-mail: ' + (err.error || 'Erro desconhecido.'));
    }
  }

  // Handlers para as opÃ§Ãµes do menu Arquivo
  const fileMenuHandlers = {
    'Novo': handleNovo,
    'Abrir': handleAbrir,
    'Importar': handleImportar,
    'Fazer uma cÃ³pia': handleFazerCopia,
    'Baixar': handleBaixar,
    'E-mail': handleEnviarEmail,
    'HistÃ³rico de versÃµes': handleShowVersions,
    'Salvar versÃ£o': handleSalvarVersao,
    'Renomear': handleRenomear,
    'Detalhes': () => setShowDetails(true),
    'ConfiguraÃ§Ãµes': () => setShowConfig(true),
    'Sair': async () => {
      const hasData = cellData.some(row => row.some(cell => cell !== ''));
      if (hasData) {
        const op = window.confirm('VocÃª tem dados nÃ£o salvos. Deseja salvar antes de sair?');
        if (op) {
          await fileMenuHandlers['Salvar versÃ£o']();
        }
      }
      window.location.reload();
    }
  };

  // Handlers para o menu Editar
  const editMenuHandlers = {
    'Desfazer': handleDesfazer,
    'Refazer': handleRefazer,
    'Cortar': handleCortar,
    'Copiar': handleCopiar,
    'Colar': handleColar,
    'Colar especial': handleColarEspecial,
    'Excluir': handleExcluir,
    'Pesquisar e substituir': handlePesquisarSubstituir
  };
  const [showFormModal, setShowFormModal] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [macroText, setMacroText] = useState('');
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptText, setScriptText] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);

  function handleCriarFormulario() {
    setFormFields(['Nome', 'E-mail', 'Telefone']);
    setShowFormModal(true);
  }
  function handleMacros() {
    setMacroText('SimulaÃ§Ã£o: Macro gravada para copiar dados da coluna A para B.');
    setShowMacroModal(true);
  }
  function handleEditorScripts() {
    setScriptText('// SimulaÃ§Ã£o: Script para somar valores da coluna C.\nfunction somaColunaC() { /* ... */ }');
    setShowScriptModal(true);
  }
  function handleRevisao() {
    setReviewText('SimulaÃ§Ã£o: Nenhuma alteraÃ§Ã£o pendente. Todas as cÃ©lulas revisadas.');
    setShowReviewModal(true);
  }
  function handleAcessibilidade() {
    setShowAccessibilityModal(true);
  }
  // Ferramentas: Criar formulÃ¡rio real
  function handleCriarFormulario() {
    const campos = window.prompt('Quais campos? (separados por vÃ­rgula)', 'Nome, E-mail, Telefone');
    if (!campos) return;
    const fields = campos.split(',').map(f => f.trim());
    const values = fields.map(f => window.prompt(`Valor para ${f}:`, ''));
    // Adiciona nova linha na planilha
    setCellData(data => {
      const newRow = Array(numCols).fill('');
      for (let i = 0; i < fields.length && i < numCols; i++) newRow[i] = values[i];
      return [...data, newRow];
    });
    setNumRows(r => r + 1);
  }

  // Ferramentas: Macros (gravar e executar)
  const [macro, setMacro] = useState([]);
  const [gravandoMacro, setGravandoMacro] = useState(false);
  function handleMacros() {
    if (!gravandoMacro) {
      setMacro([]);
      setGravandoMacro(true);
      alert('GravaÃ§Ã£o de macro iniciada. Todas as ediÃ§Ãµes serÃ£o gravadas. Clique novamente para parar.');
    } else {
      setGravandoMacro(false);
      alert('Macro gravada! Clique em "Executar macro" para rodar.');
    }
  }
  function executarMacro() {
    macro.forEach(({ r, c, v }) => {
      setCellData(data => {
        const newData = data.map(arr => [...arr]);
        newData[r][c] = v;
        return newData;
      });
    });
  }
  // Hook para gravar ediÃ§Ãµes na macro
  React.useEffect(() => {
    if (!gravandoMacro) return;
    const lastEdit = history[history.length - 1];
    if (!lastEdit) return;
    const diffs = [];
    for (let r = 0; r < cellData.length; r++) {
      for (let c = 0; c < (cellData[r]?.length || 0); c++) {
        if (cellData[r]?.[c] !== lastEdit[r]?.[c]) {
          diffs.push({ r, c, v: cellData[r]?.[c] || '' });
        }
      }
    }
    if (diffs.length > 0) setMacro(m => [...m, ...diffs]);
    // eslint-disable-next-line
  }, [cellData]);

  // Ferramentas: Editor de scripts
  function handleEditorScripts() {
    const script = window.prompt('Digite um JS para rodar nas cÃ©lulas selecionadas. Use value para o valor da cÃ©lula. Ex: value*2');
    if (!script) return;
    if (!selection.anchor || !selection.end) return;
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const minCol = Math.min(selection.anchor.col, selection.end.col);
    const maxCol = Math.max(selection.anchor.col, selection.end.col);
    setCellData(data => {
      const newData = data.map(arr => [...arr]);
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          try {
            // eslint-disable-next-line no-eval
            newData[r][c] = eval(script.replace(/value/g, JSON.stringify(newData[r][c])));
          } catch {}
        }
      }
      return newData;
    });
  }

  // Ferramentas: RevisÃ£o
  function handleRevisao() {
    if (!selection.anchor || !selection.end) return;
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const minCol = Math.min(selection.anchor.col, selection.end.col);
    const maxCol = Math.max(selection.anchor.col, selection.end.col);
    setCellStyles(prev => {
      const newStyles = { ...prev };
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newStyles[`${r}-${c}`] = { ...newStyles[`${r}-${c}`], reviewed: true };
        }
      }
      return newStyles;
    });
  }

  // Ferramentas: Acessibilidade (alto contraste)
  const [altoContraste, setAltoContraste] = useState(false);
  function handleAcessibilidade() {
    setAltoContraste(a => !a);
    document.body.style.background = altoContraste ? '#f5f5f5' : '#000';
    document.body.style.color = altoContraste ? '#222' : '#fff';
  }

  // Atualizar toolsMenuHandlers
  const toolsMenuHandlers = {
    'Criar formulÃ¡rio': handleCriarFormulario,
    'Macros': handleMacros,
    'Editor de scripts': handleEditorScripts,
    'RevisÃ£o': handleRevisao,
    'Acessibilidade': handleAcessibilidade
  };
const menuOptions = {
  'Arquivo': [
    'Novo',
    'Abrir',
    'Importar',
    'Fazer uma cÃ³pia',
    'Baixar',
    'Salvar versÃ£o',
    'E-mail',
    'HistÃ³rico de versÃµes',
    'Renomear',
    'Detalhes',
    'ConfiguraÃ§Ãµes',
    'Sair'
  ],
  'Editar': [
    'Desfazer',
    'Refazer',
    'Cortar',
    'Copiar',
    'Colar',
    'Colar especial',
    'Excluir',
    'Pesquisar e substituir'
  ],
  'Ver': [
    'Modo de exibiÃ§Ã£o',
    'Congelar',
    'Ocultar linhas',
    'Ocultar colunas',
    'Mostrar fÃ³rmulas',
    'Zoom'
  ],
  'Inserir': [
    'Linha acima',
    'Linha abaixo',
    'Coluna Ã  esquerda',
    'Coluna Ã  direita',
    'CÃ©lulas',
    'Imagem',
    'GrÃ¡fico',
    'Caixa de seleÃ§Ã£o',
    'Link',
    'ComentÃ¡rio',
    'Nota'
  ],
  'Formatar': [
    'Negrito',
    'ItÃ¡lico',
    'Sublinhado',
    'Tachado',
    'Cor do texto',
    'Cor de preenchimento',
    'Formatar como moeda',
    'Formatar como porcentagem',
    'Formatar como nÃºmero',
    'Alinhar',
    'Quebra de texto',
    'Mesclar cÃ©lulas'
  ],
  'Dados': [
    'Classificar',
    'Criar filtro',
    'ValidaÃ§Ã£o de dados',
    'Remover duplicatas',
    'Dividir texto em colunas',
    'Proteger intervalo'
  ],
  'Ferramentas': [
    'Criar formulÃ¡rio',
    'Macros',
    'Editor de scripts',
    'RevisÃ£o',
    'Acessibilidade'
  ],
};

const menuItems = Object.keys(menuOptions);

  // Inserir linha acima
  function handleInserirLinhaAcima() {
    const { row } = selectedCell;
    const newData = [...cellData];
    newData.splice(row, 0, Array(numCols).fill(''));
    setCellData(newData);
    setNumRows(r => r + 1);
    setSelectedCell({ row: row, col: selectedCell.col });
  }
  // Inserir linha abaixo
  function handleInserirLinhaAbaixo() {
    const { row } = selectedCell;
    const newData = [...cellData];
    newData.splice(row + 1, 0, Array(numCols).fill(''));
    setCellData(newData);
    setNumRows(r => r + 1);
    setSelectedCell({ row: row + 1, col: selectedCell.col });
  }
  // Inserir coluna Ã  esquerda
  function handleInserirColunaEsquerda() {
    const { col } = selectedCell;
    const newData = cellData.map(row => {
      const newRow = [...row];
      newRow.splice(col, 0, '');
      return newRow;
    });
    setCellData(newData);
    setNumCols(c => c + 1);
    setSelectedCell({ row: selectedCell.row, col: col });
  }
  // Inserir coluna Ã  direita
  function handleInserirColunaDireita() {
    const { col } = selectedCell;
    const newData = cellData.map(row => {
      const newRow = [...row];
      newRow.splice(col + 1, 0, '');
      return newRow;
    });
    setCellData(newData);
    setNumCols(c => c + 1);
    setSelectedCell({ row: selectedCell.row, col: col + 1 });
  }
  // Inserir cÃ©lula (shift para baixo)
  function handleInserirCelula() {
    const { row, col } = selectedCell;
    const newData = cellData.map(arr => [...arr]);
    for (let r = numRows - 1; r > row; r--) {
      newData[r][col] = newData[r - 1][col];
    }
    newData[row][col] = '';
    setCellData(newData);
  }
  // Inserir caixa de seleÃ§Ã£o
  function handleInserirCheckbox() {
    const { row, col } = selectedCell;
    setCellTypes(prev => ({ ...prev, [`${row}-${col}`]: { type: 'checkbox', value: false } }));
  }
  // Inserir link
  function handleInserirLink() {
    const { row, col } = selectedCell;
    const url = window.prompt('Digite a URL do link:');
    if (url) setCellTypes(prev => ({ ...prev, [`${row}-${col}`]: { type: 'link', value: url } }));
  }
  // Inserir comentÃ¡rio
  function handleInserirComentario() {
    const { row, col } = selectedCell;
    const comentario = window.prompt('Digite o comentÃ¡rio:');
    if (comentario) setCellTypes(prev => ({ ...prev, [`${row}-${col}`]: { type: 'comment', value: comentario } }));
  }
  // Inserir nota
  function handleInserirNota() {
    const { row, col } = selectedCell;
    const nota = window.prompt('Digite a nota:');
    if (nota) setCellTypes(prev => ({ ...prev, [`${row}-${col}`]: { type: 'note', value: nota } }));
  }

  // Handlers para o menu Inserir
  const insertMenuHandlers = {
    'Linha acima': handleInserirLinhaAcima,
    'Linha abaixo': handleInserirLinhaAbaixo,
    'Coluna Ã  esquerda': handleInserirColunaEsquerda,
    'Coluna Ã  direita': handleInserirColunaDireita,
    'CÃ©lulas': handleInserirCelula,
    'Imagem': handleInserirImagem,
    'GrÃ¡fico': handleInserirGrafico,
    'Caixa de seleÃ§Ã£o': handleInserirCheckbox,
    'Link': handleInserirLink,
    'ComentÃ¡rio': handleInserirComentario,
    'Nota': handleInserirNota
  };

  const imageInputRef = useRef(null);

  function handleInserirImagem() {
    if (imageInputRef.current) imageInputRef.current.value = '';
    imageInputRef.current?.click();
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const { row, col } = selectedCell;
      setCellTypes(prev => ({
        ...prev,
        [`${row}-${col}`]: { type: 'image', value: evt.target.result }
      }));
    };
    reader.readAsDataURL(file);
  }

  // Formatar: Negrito
  function handleNegrito() {
    const { row, col } = selectedCell;
    setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], bold: !prev[`${row}-${col}`]?.bold }
    }));
  }
  // Formatar: ItÃ¡lico
  function handleItalico() {
    const { row, col } = selectedCell;
    setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], italic: !prev[`${row}-${col}`]?.italic }
    }));
  }
  // Formatar: Sublinhado
  function handleSublinhado() {
    const { row, col } = selectedCell;
    setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], underline: !prev[`${row}-${col}`]?.underline }
    }));
  }
  // Formatar: Tachado
  function handleTachado() {
    const { row, col } = selectedCell;
    setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], strike: !prev[`${row}-${col}`]?.strike }
    }));
  }
  // Formatar: Cor do texto
  function handleCorTexto() {
    const { row, col } = selectedCell;
    const color = window.prompt('Digite a cor do texto (ex: #ff0000 ou red):');
    if (color) setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], color }
    }));
  }
  // Formatar: Cor de preenchimento
  function handleCorPreenchimento() {
    const { row, col } = selectedCell;
    const bg = window.prompt('Digite a cor de preenchimento (ex: #ffff00 ou yellow):');
    if (bg) setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], bg }
    }));
  }
  // Formatar: Moeda
  function handleMoeda() {
    const { row, col } = selectedCell;
    setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], format: prev[`${row}-${col}`]?.format === 'moeda' ? undefined : 'moeda' }
    }));
  }
  // Formatar: Porcentagem
  function handlePorcentagem() {
    const { row, col } = selectedCell;
    setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], format: prev[`${row}-${col}`]?.format === 'porcentagem' ? undefined : 'porcentagem' }
    }));
  }
  // Formatar: NÃºmero
  function handleNumero() {
    const { row, col } = selectedCell;
    setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], format: prev[`${row}-${col}`]?.format === 'numero' ? undefined : 'numero' }
    }));
  }
  // Formatar: Alinhar
  function handleAlinhar() {
    const { row, col } = selectedCell;
    const align = window.prompt('Alinhar: left, center, right?', 'left');
    if (align) setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], align }
    }));
  }
  // Formatar: Quebra de texto
  function handleQuebraTexto() {
    const { row, col } = selectedCell;
    setCellStyles(prev => ({
      ...prev,
      [`${row}-${col}`]: { ...prev[`${row}-${col}`], wrap: !prev[`${row}-${col}`]?.wrap }
    }));
  }
  // SeleÃ§Ã£o mÃºltipla de cÃ©lulas estilo Excel
  const [selection, setSelection] = useState({ anchor: null, end: null });

  function handleCellMouseDown(rIdx, cIdx) {
    setSelection({ anchor: { row: rIdx, col: cIdx }, end: { row: rIdx, col: cIdx } });
    setSelectedCell({ row: rIdx, col: cIdx });
  }
  function handleCellMouseOver(rIdx, cIdx) {
    if (selection.anchor) {
      setSelection(sel => ({ ...sel, end: { row: rIdx, col: cIdx } }));
    }
  }
  function handleCellMouseUp() {
    // Nada extra por enquanto
  }
  function isCellSelected(rIdx, cIdx) {
    if (!selection.anchor || !selection.end) return false;
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const minCol = Math.min(selection.anchor.col, selection.end.col);
    const maxCol = Math.max(selection.anchor.col, selection.end.col);
    return rIdx >= minRow && rIdx <= maxRow && cIdx >= minCol && cIdx <= maxCol;
  }
  function handleCellClick(rIdx, cIdx, e) {
    if (e.shiftKey && selection.anchor) {
      setSelection(sel => ({ anchor: sel.anchor, end: { row: rIdx, col: cIdx } }));
      setSelectedCell({ row: rIdx, col: cIdx });
    } else {
      setSelection({ anchor: { row: rIdx, col: cIdx }, end: { row: rIdx, col: cIdx } });
      setSelectedCell({ row: rIdx, col: cIdx });
    }
  }

  // Corrigir seleÃ§Ã£o mÃºltipla estilo Excel
  function handleCellKeyDown(e, rIdx, cIdx) {
    let nextRow = rIdx;
    let nextCol = cIdx;
    let expand = e.shiftKey;
    if (e.key === 'Enter') {
      if (e.shiftKey) nextRow = Math.max(0, rIdx - 1);
      else nextRow = Math.min(numRows - 1, rIdx + 1);
      e.preventDefault();
    } else if (e.key === 'Tab') {
      if (e.shiftKey) nextCol = Math.max(0, cIdx - 1);
      else nextCol = Math.min(numCols - 1, cIdx + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      nextRow = Math.min(numRows - 1, rIdx + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      nextRow = Math.max(0, rIdx - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      nextCol = Math.max(0, cIdx - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      nextCol = Math.min(numCols - 1, cIdx + 1);
      e.preventDefault();
    } else if (e.key === 'Home') {
      nextCol = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      nextCol = numCols - 1;
      e.preventDefault();
    } else if (e.key === 'PageDown') {
      nextRow = Math.min(numRows - 1, rIdx + 10);
      e.preventDefault();
    } else if (e.key === 'PageUp') {
      nextRow = Math.max(0, rIdx - 10);
      e.preventDefault();
    }
    if (nextRow !== rIdx || nextCol !== cIdx) {
      if (expand && selection.anchor) {
        setSelection(sel => ({ anchor: sel.anchor, end: { row: nextRow, col: nextCol } }));
        setSelectedCell({ row: nextRow, col: nextCol });
      } else {
        setSelection({ anchor: { row: nextRow, col: nextCol }, end: { row: nextRow, col: nextCol } });
        setSelectedCell({ row: nextRow, col: nextCol });
      }
    }
  }

  // Menu Inserir > GrÃ¡fico gera grÃ¡fico real com base na seleÃ§Ã£o
  function handleInserirGrafico() {
    if (!selection.anchor || !selection.end) {
      alert('Selecione um intervalo de cÃ©lulas para gerar o grÃ¡fico.');
      return;
    }
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const minCol = Math.min(selection.anchor.col, selection.end.col);
    const maxCol = Math.max(selection.anchor.col, selection.end.col);
    // Coletar dados do intervalo (primeira coluna como label, segunda como valor)
    const labels = [];
    const data = [];
    for (let r = minRow; r <= maxRow; r++) {
      let label = cellData[r]?.[minCol] || '';
      let val = parseFloat(cellData[r]?.[maxCol] || '0');
      if (!isNaN(val)) {
        labels.push(label);
        data.push(val);
      }
    }
    if (labels.length === 0) {
      alert('Selecione um intervalo de cÃ©lulas com pelo menos uma coluna de texto e uma de nÃºmeros.');
      return;
    }
    setChartData({
      labels,
      datasets: [{ label: 'Valores', data, backgroundColor: '#42a5f5' }]
    });
    setShowChartModal(true);
  }

  // Mesclar cÃ©lulas real
  function handleMesclarCelulas() {
    if (!selection.anchor || !selection.end) return;
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const minCol = Math.min(selection.anchor.col, selection.end.col);
    const maxCol = Math.max(selection.anchor.col, selection.end.col);
    if (minRow === maxRow && minCol === maxCol) return; // sÃ³ uma cÃ©lula
    // Salvar conteÃºdo da cÃ©lula superior esquerda
    const mainValue = cellData[minRow]?.[minCol] || '';
    // Limpar as outras cÃ©lulas
    const newData = cellData.map((row, r) =>
      row.map((cell, c) =>
        (r >= minRow && r <= maxRow && c >= minCol && c <= maxCol && !(r === minRow && c === minCol)) ? '' : cell
      )
    );
    setCellData(newData);
    // Marcar mesclagem no estado de estilos
    setCellStyles(prev => {
      const newStyles = { ...prev };
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newStyles[`${r}-${c}`] = {
            ...newStyles[`${r}-${c}`],
            merged: !(r === minRow && c === minCol),
            mergeRoot: r === minRow && c === minCol,
            mergeRows: maxRow - minRow + 1,
            mergeCols: maxCol - minCol + 1
          };
        }
      }
      return newStyles;
    });
  }
  // Desfazer mesclagem (ao clicar na cÃ©lula mesclada)
  function handleDesfazerMesclagem(rIdx, cIdx) {
    const style = cellStyles[`${rIdx}-${cIdx}`];
    if (!style?.mergeRoot) return;
    const { mergeRows, mergeCols } = style;
    setCellStyles(prev => {
      const newStyles = { ...prev };
      for (let r = rIdx; r < rIdx + mergeRows; r++) {
        for (let c = cIdx; c < cIdx + mergeCols; c++) {
          newStyles[`${r}-${c}`] = { ...newStyles[`${r}-${c}`] };
          delete newStyles[`${r}-${c}`].merged;
          delete newStyles[`${r}-${c}`].mergeRoot;
          delete newStyles[`${r}-${c}`].mergeRows;
          delete newStyles[`${r}-${c}`].mergeCols;
        }
      }
      return newStyles;
    });
  }

  // Handlers para o menu Formatar
  const formatMenuHandlers = {
    'Negrito': handleNegrito,
    'ItÃ¡lico': handleItalico,
    'Sublinhado': handleSublinhado,
    'Tachado': handleTachado,
    'Cor do texto': handleCorTexto,
    'Cor de preenchimento': handleCorPreenchimento,
    'Formatar como moeda': handleMoeda,
    'Formatar como porcentagem': handlePorcentagem,
    'Formatar como nÃºmero': handleNumero,
    'Alinhar': handleAlinhar,
    'Quebra de texto': handleQuebraTexto,
    'Mesclar cÃ©lulas': handleMesclarCelulas
  };

  // Classificar linhas pela coluna selecionada
  function handleClassificar() {
    if (!selection.anchor || !selection.end) return;
    const col = selectedCell.col;
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const sorted = [...cellData];
    const toSort = sorted.slice(minRow, maxRow + 1).sort((a, b) => {
      const va = a[col];
      const vb = b[col];
      const na = parseFloat(va);
      const nb = parseFloat(vb);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(va).localeCompare(String(vb));
    });
    for (let i = minRow; i <= maxRow; i++) sorted[i] = toSort[i - minRow];
    setCellData(sorted);
  }

  // Remover duplicatas na seleÃ§Ã£o
  function handleRemoverDuplicatas() {
    if (!selection.anchor || !selection.end) return;
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const minCol = Math.min(selection.anchor.col, selection.end.col);
    const maxCol = Math.max(selection.anchor.col, selection.end.col);
    const seen = new Set();
    const newData = cellData.filter((row, rIdx) => {
      if (rIdx < minRow || rIdx > maxRow) return true;
      const key = row.slice(minCol, maxCol + 1).join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Preencher linhas removidas com vazios para manter o tamanho
    while (newData.length < cellData.length) newData.push(Array(numCols).fill(''));
    setCellData(newData);
  }

  // Dividir texto em colunas (por vÃ­rgula)
  function handleDividirTexto() {
    if (!selection.anchor || !selection.end) return;
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const col = selectedCell.col;
    const newData = cellData.map(arr => [...arr]);
    for (let r = minRow; r <= maxRow; r++) {
      const parts = String(newData[r][col]).split(',');
      for (let i = 0; i < parts.length && col + i < numCols; i++) {
        newData[r][col + i] = parts[i].trim();
      }
    }
    setCellData(newData);
  }

  // Filtro real: exibir/ocultar linhas por critÃ©rio
  function handleCriarFiltro() {
    if (!selection.anchor || !selection.end) return;
    const col = selectedCell.col;
    const criterio = window.prompt('Filtrar: mostrar apenas linhas que contenham (texto ou nÃºmero):');
    if (criterio === null) return;
    const newHiddenRows = [];
    for (let r = 0; r < cellData.length; r++) {
      if (r < selection.anchor.row || r > selection.end.row) continue;
      const val = String(cellData[r]?.[col] || '');
      if (!val.includes(criterio)) newHiddenRows.push(r);
    }
    setHiddenRows(newHiddenRows);
  }

  // ValidaÃ§Ã£o de dados: impedir valores invÃ¡lidos (ex: sÃ³ nÃºmeros)
  function handleValidacaoDados() {
    if (!selection.anchor || !selection.end) return;
    const tipo = window.prompt('Tipo de validaÃ§Ã£o: "numero" para sÃ³ nÃºmeros, "texto" para sÃ³ texto:');
    if (!tipo) return;
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const minCol = Math.min(selection.anchor.col, selection.end.col);
    const maxCol = Math.max(selection.anchor.col, selection.end.col);
    setCellStyles(prev => {
      const newStyles = { ...prev };
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newStyles[`${r}-${c}`] = { ...newStyles[`${r}-${c}`], validation: tipo };
        }
      }
      return newStyles;
    });
  }

  // Proteger intervalo: bloquear ediÃ§Ã£o de cÃ©lulas selecionadas
  function handleProtegerIntervalo() {
    if (!selection.anchor || !selection.end) return;
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const minCol = Math.min(selection.anchor.col, selection.end.col);
    const maxCol = Math.max(selection.anchor.col, selection.end.col);
    setCellStyles(prev => {
      const newStyles = { ...prev };
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newStyles[`${r}-${c}`] = { ...newStyles[`${r}-${c}`], protected: true };
        }
      }
      return newStyles;
    });
  }

  // Atualizar dataMenuHandlers
  const dataMenuHandlers = {
    'Classificar': handleClassificar,
    'Criar filtro': handleCriarFiltro,
    'ValidaÃ§Ã£o de dados': handleValidacaoDados,
    'Remover duplicatas': handleRemoverDuplicatas,
    'Dividir texto em colunas': handleDividirTexto,
    'Proteger intervalo': handleProtegerIntervalo
  };

  // Expande linhas/colunas ao rolar para o fim
  const cellsContainerRef = useRef(null);
  function handleCellsScroll(e) {
    const el = e.target;
    // Se chegou perto do fim das colunas, adiciona mais
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 50) {
      setNumCols(c => {
        if (c < 500) return c + 10; // Limite de seguranÃ§a
        return c;
      });
      setCellData(data => data.map(row => [...row, ...Array(10).fill('')]));
    }
    // Se chegou perto do fim das linhas, adiciona mais
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      setNumRows(r => {
        if (r < 1000) return r + 20; // Limite de seguranÃ§a
        return r;
      });
      setCellData(data => [...data, ...Array(20).fill().map(() => Array(numCols).fill(''))]);
    }
  }

  // Refs para inputs das cÃ©lulas
  const cellRefs = useRef({});

  // Foco automÃ¡tico na cÃ©lula selecionada
  React.useEffect(() => {
    const key = `${selectedCell.row}-${selectedCell.col}`;
    if (cellRefs.current[key]) {
      cellRefs.current[key].focus();
    }
  }, [selectedCell]);

  // PersistÃªncia automÃ¡tica no localStorage (corrigida)
  const [initialized, setInitialized] = useState(false);
  React.useEffect(() => {
    if (!initialized) return;
    const save = {
      cellData,
      cellTypes,
      cellStyles,
      sheetName
    };
    localStorage.setItem('excelData', JSON.stringify(save));
  }, [cellData, cellTypes, cellStyles, sheetName, initialized]);

  React.useEffect(() => {
    const saved = localStorage.getItem('excelData');
    if (saved) {
      try {
        const { cellData, cellTypes, cellStyles, sheetName } = JSON.parse(saved);
        if (cellData) setCellData(cellData);
        if (cellTypes) setCellTypes(cellTypes);
        if (cellStyles) setCellStyles(cellStyles);
        if (sheetName) setSheetName(sheetName);
      } catch {}
    }
    setInitialized(true);
  }, []);

  // Imagens flutuantes
  function getCellPosition(row, col) {
    // Calcula a posiÃ§Ã£o absoluta da cÃ©lula na grade (ajuste conforme seu layout)
    const top = 28 + row * 28; // 28px header + 28px por linha
    const left = 40 + col * 100; // 40px num col + 100px por coluna
    return { top, left };
  }

  // Remover imagem da cÃ©lula
  function handleRemoverImagem(row, col) {
    setCellTypes(prev => {
      const newTypes = { ...prev };
      if (newTypes[`${row}-${col}`]?.type === 'image') delete newTypes[`${row}-${col}`];
      return newTypes;
    });
  }

  // Substituir imagem ao clicar duas vezes
  function handleTrocarImagem(row, col) {
    setSelectedCell({ row, col });
    handleInserirImagem();
  }

  // Gerar grÃ¡fico real a partir do intervalo selecionado
  function handleGerarGrafico() {
    if (!selection.anchor || !selection.end) return;
    const minRow = Math.min(selection.anchor.row, selection.end.row);
    const maxRow = Math.max(selection.anchor.row, selection.end.row);
    const minCol = Math.min(selection.anchor.col, selection.end.col);
    const maxCol = Math.max(selection.anchor.col, selection.end.col);
    // Coletar dados do intervalo
    const labels = [];
    const data = [];
    for (let r = minRow; r <= maxRow; r++) {
      let label = rows[r];
      let val = parseFloat(cellData[r]?.[minCol] || '0');
      if (!isNaN(val)) {
        labels.push(label);
        data.push(val);
      }
    }
    if (labels.length === 0) {
      alert('Selecione um intervalo de cÃ©lulas numÃ©ricas para gerar o grÃ¡fico.');
      return;
    }
    setChartData({
      labels,
      datasets: [{ label: 'Valores', data, backgroundColor: '#42a5f5' }]
    });
    setShowChartModal(true);
  }

  return (
    <div className="main-content">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      {/* Inserir imagem (deve estar antes do insertMenuHandlers) */}
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        ref={imageInputRef}
        onChange={handleImageChange}
      />
      <div className="title">
        <span className="logo-inline">?? DataMergeAI</span>
        <span style={{ marginLeft: 16 }}>{sheetName} - Excel</span>
      </div>
      <ExcelMenuBar
        menuOptions={menuOptions}
        menuHandlers={{
          'Arquivo': fileMenuHandlers,
          'Editar': editMenuHandlers,
          'Ver': viewMenuHandlers,
          'Inserir': insertMenuHandlers,
          'Formatar': formatMenuHandlers,
          'Dados': dataMenuHandlers,
          'Ferramentas': toolsMenuHandlers
        }}
      />
      <div className="cell-content">
        <div>fx</div>
        <div></div>
      </div>
      <div className="icon-bar">
        {/* Barra de ferramentas com react-icons */}
        <button className="icon-btn" title="Desfazer"><MdUndo /></button>
        <button className="icon-btn" title="Refazer"><MdRedo /></button>
        <button className="icon-btn" title="Imprimir"><MdPrint /></button>
        <button className="icon-btn" title="Pintar formataÃ§Ã£o"><MdFormatPaint /></button>
        <select className="icon-select" title="Zoom" defaultValue="100%">
          <option>50%</option>
          <option>75%</option>
          <option>100%</option>
          <option>125%</option>
          <option>150%</option>
        </select>
        <button className="icon-btn" title="Moeda"><MdAttachMoney /></button>
        <button className="icon-btn" title="Porcentagem"><MdPercent /></button>
        <button className="icon-btn" title="Diminuir casas decimais"><MdExposureNeg1 /></button>
        <button className="icon-btn" title="Aumentar casas decimais"><MdExposurePlus1 /></button>
        <select className="icon-select" title="Fonte" defaultValue="PadrÃ£o (Arial)">
          <option>PadrÃ£o (Arial)</option>
          <option>Times New Roman</option>
          <option>Calibri</option>
        </select>
        <select className="icon-select" title="Tamanho da fonte" defaultValue="12">
          <option>10</option>
          <option>12</option>
          <option>14</option>
          <option>16</option>
        </select>
        <button className="icon-btn" title="Negrito"><MdFormatBold /></button>
        <button className="icon-btn" title="ItÃ¡lico"><MdFormatItalic /></button>
        <button className="icon-btn" title="Tachar"><MdStrikethroughS /></button>
        <button className="icon-btn" title="Cor do texto"><MdFormatColorText /></button>
        <button className="icon-btn" title="Cor de preenchimento"><MdFormatColorFill /></button>
        <button className="icon-btn" title="Bordas"><MdBorderAll /></button>
        <button className="icon-btn" title="Mesclar cÃ©lulas"><MdMergeType /></button>
        <button className="icon-btn" title="Alinhar Ã  esquerda"><MdFormatAlignLeft /></button>
        <button className="icon-btn" title="Alinhar ao centro"><MdFormatAlignCenter /></button>
        <button className="icon-btn" title="Alinhar Ã  direita"><MdFormatAlignRight /></button>
        <button className="icon-btn" title="Ajuste de texto"><MdWrapText /></button>
        <button className="icon-btn" title="Inserir link"><MdInsertLink /></button>
        <button className="icon-btn" title="Inserir comentÃ¡rio"><MdInsertComment /></button>
        <button className="icon-btn" title="Inserir grÃ¡fico"><MdInsertChart /></button>
        <button className="icon-btn" title="Filtro"><MdFilterList /></button>
      </div>
      {/* Planilha estilo Excel */}
      <div className="excel-container" style={{ position: 'relative', border: '1px solid #ccc', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }} onScroll={handleCellsScroll}>
          <div style={{ minWidth: columns.length * 100 + 40, minHeight: (rows.length + 1) * 28, position: 'relative', width: 'fit-content', height: 'fit-content' }}>
            {/* CabeÃ§alho de colunas e nÃºmeros de linha juntos */}
            <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3 }}>
              {/* Canto superior esquerdo */}
              <div style={{ width: 40, height: 28, background: '#e0e0e0', borderRight: '1.5px solid #bdbdbd', borderBottom: '1.5px solid #bdbdbd', position: 'sticky', left: 0, zIndex: 4 }}></div>
              {columns.map((col, cIdx) => (
                hiddenCols.includes(cIdx) ? null :
                <div key={col} style={{ width: 100, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', borderRight: '1px solid #ccc', borderBottom: '1.5px solid #bdbdbd', background: '#f5f5f5', position: 'relative', zIndex: 3, boxSizing: 'border-box' }}>{col}</div>
              ))}
            </div>
            {/* Linhas da planilha */}
            {rows.map((row, rIdx) => (
              hiddenRows.includes(rIdx) ? null :
              <div key={rIdx} style={{ display: 'flex' }}>
                {/* NÃºmero da linha sticky Ã  esquerda */}
                <div style={{ width: 40, minWidth: 40, maxWidth: 40, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', borderRight: '1.5px solid #bdbdbd', borderBottom: '1px solid #ccc', background: '#f5f5f5', position: 'sticky', left: 0, zIndex: 2 }}>{row}</div>
                {columns.map((col, cIdx) => {
                  if (hiddenCols.includes(cIdx)) return null;
                  const cellKey = `${rIdx}-${cIdx}`;
                  const cellType = cellTypes[cellKey]?.type;
                  const cellValue = cellTypes[cellKey]?.value;
                  const styleObj = cellStyles[cellKey] || {};
                  let displayValue = cellData[rIdx]?.[cIdx] || '';
                  if (styleObj.format === 'moeda') displayValue = `R$ ${displayValue}`;
                  if (styleObj.format === 'porcentagem') displayValue = `${displayValue}%`;
                  if (styleObj.format === 'numero') displayValue = Number(displayValue).toLocaleString();
                  return (
                    <div
                      className={
                        (isCellSelected(rIdx, cIdx) ? 'cells__selected ' : '') +
                        (selectedCell.row === rIdx && selectedCell.col === cIdx ? 'cells__active ' : '')
                      }
                      style={{ width: 100, height: 28, border: '1px solid #e0e0e0', background: styleObj.reviewed ? '#e0ffe0' : isCellSelected(rIdx, cIdx) ? '#d1eaff' : '#fff', display: cellStyles[cellKey]?.merged ? 'none' : 'flex', alignItems: 'center', position: 'relative', boxSizing: 'border-box' }}
                      key={cellKey}
                      onMouseDown={() => handleCellMouseDown(rIdx, cIdx)}
                      onMouseOver={e => { if (e.buttons === 1) handleCellMouseOver(rIdx, cIdx); }}
                      onMouseUp={handleCellMouseUp}
                      onClick={e => {
                        handleCellClick(rIdx, cIdx, e);
                        if (cellStyles[cellKey]?.mergeRoot) handleDesfazerMesclagem(rIdx, cIdx);
                      }}
                    >
                      {/* RenderizaÃ§Ã£o da cÃ©lula, igual antes */}
                      {cellType === 'image' ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onDoubleClick={() => handleTrocarImagem(rIdx, cIdx)}>
                          <img src={cellValue} alt="img" style={{ maxWidth: 200, maxHeight: 100, display: 'block', borderRadius: 4 }} />
                          <button
                            style={{ position: 'absolute', top: 2, right: 2, background: '#fff', border: '1px solid #ccc', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, opacity: 0.8 }}
                            title="Remover imagem"
                            onClick={e => { e.stopPropagation(); handleRemoverImagem(rIdx, cIdx); }}
                          >â</button>
                        </div>
                      ) : cellType === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={!!cellValue}
                          className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '')}
                          style={{ background: styleObj.bg, color: styleObj.color, fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined }}
                          onClick={() => { setSelectedCell({ row: rIdx, col: cIdx }); handleToggleCheckbox(rIdx, cIdx); }}
                          readOnly={readOnly}
                        />
                      ) : cellType === 'link' ? (
                        <a
                          href={cellValue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '')}
                          style={{ background: styleObj.bg, color: styleObj.color, fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined, display: 'inline-block', width: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                        >{cellValue}</a>
                      ) : cellType === 'comment' ? (
                        <>
                          <input
                            className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '')}
                            style={{ background: styleObj.bg, color: styleObj.color, fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined }}
                            value={displayValue}
                            readOnly={readOnly}
                            onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                            onChange={e => {
                              const newData = cellData.map(arr => [...arr]);
                              newData[rIdx][cIdx] = e.target.value;
                              pushHistory(newData);
                            }}
                          />
                          <span title={cellValue} style={{ position: 'absolute', right: 2, top: 2, fontSize: 14, color: '#f90', cursor: 'pointer' }}>ð¬</span>
                        </>
                      ) : cellType === 'note' ? (
                        <>
                          <input
                            className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '')}
                            style={{ background: styleObj.bg, color: styleObj.color, fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined }}
                            value={displayValue}
                            readOnly={readOnly}
                            onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                            onChange={e => {
                              const newData = cellData.map(arr => [...arr]);
                              newData[rIdx][cIdx] = e.target.value;
                              pushHistory(newData);
                            }}
                          />
                          <span title={cellValue} style={{ position: 'absolute', right: 2, bottom: 2, fontSize: 14, color: '#09f', cursor: 'pointer' }}>ð</span>
                        </>
                      ) : cellType === 'chart' ? (
                        <button
                          className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '')}
                          style={{ background: '#e3f2fd', border: '1px solid #90caf9', cursor: 'pointer', fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined }}
                          onClick={() => setShowChartModal(true)}
                        >ð GrÃ¡fico</button>
                      ) : (
                        <input
                          ref={el => { cellRefs.current[`${rIdx}-${cIdx}`] = el; }}
                          className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '') + (frozen.row && rIdx === 0 ? ' frozen-row' : '') + (frozen.col && cIdx === 0 ? ' frozen-col' : '')}
                          key={rIdx + '-' + cIdx}
                          value={showFormulas ? `=VALOR(${displayValue})` : displayValue}
                          style={{ background: styleObj.bg, color: styleObj.color, fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined, width: '100%', height: '100%' }}
                          readOnly={readOnly || styleObj.protected}
                          onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                          onChange={e => {
                            if (styleObj.validation === 'numero' && isNaN(Number(e.target.value))) {
                              alert('Apenas nÃºmeros sÃ£o permitidos nesta cÃ©lula.');
                              return;
                            }
                            if (styleObj.validation === 'texto' && /\d/.test(e.target.value)) {
                              alert('Apenas texto Ã© permitido nesta cÃ©lula.');
                              return;
                            }
                            const newData = cellData.map(arr => [...arr]);
                            newData[rIdx][cIdx] = e.target.value;
                            pushHistory(newData);
                          }}
                          onKeyDown={e => handleCellKeyDown(e, rIdx, cIdx)}
                        />
                      )}
                      {cellStyles[cellKey]?.protected && (
                        <span title="Protegida" style={{ position: 'absolute', left: 2, top: 2, fontSize: 12, color: '#c00' }}>ð</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {/* RetÃ¢ngulo de seleÃ§Ã£o mÃºltipla - sÃ³ se anchor e end forem diferentes */}
            {selection.anchor && selection.end && (selection.anchor.row !== selection.end.row || selection.anchor.col !== selection.end.col) && (() => {
              const minRow = Math.min(selection.anchor.row, selection.end.row);
              const maxRow = Math.max(selection.anchor.row, selection.end.row);
              const minCol = Math.min(selection.anchor.col, selection.end.col);
              const maxCol = Math.max(selection.anchor.col, selection.end.col);
              const top = 28 + minRow * 28;
              const left = 40 + minCol * 100;
              const width = (maxCol - minCol + 1) * 100;
              const height = (maxRow - minRow + 1) * 28;
              return <div className="cells__selection-rect" style={{ position: 'absolute', top, left, width, height, zIndex: 1000, pointerEvents: 'none' }} />;
            })()}
          </div>
        </div>
      </div>
      {macro.length > 0 && !gravandoMacro && (
        <button style={{ position: 'fixed', top: 120, right: 40, zIndex: 2000, background: '#673ab7', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px #0002' }}
          onClick={executarMacro}
        >Executar macro</button>
      )}
      {/* Modal de grÃ¡fico fake */}
      <ChartModal show={showChartModal} onClose={() => setShowChartModal(false)} chartData={chartData} />
      {/* Modal Criar FormulÃ¡rio */}
      <FormModal show={showFormModal} onClose={() => setShowFormModal(false)} formFields={formFields} />
      {/* Modal Macros */}
      <MacroModal show={showMacroModal} onClose={() => setShowMacroModal(false)} macroText={macroText} />
      {/* Modal Editor de Scripts */}
      <ScriptModal show={showScriptModal} onClose={() => setShowScriptModal(false)} scriptText={scriptText} />
      {/* Modal RevisÃ£o */}
      <ReviewModal show={showReviewModal} onClose={() => setShowReviewModal(false)} reviewText={reviewText} />
      {/* Modal Acessibilidade */}
      <AccessibilityModal show={showAccessibilityModal} onClose={() => setShowAccessibilityModal(false)} />
      {/* Modal Pesquisar e Substituir */}
      <FindReplaceModal show={showFindReplace} onClose={() => setShowFindReplace(false)} findValue={findValue} setFindValue={setFindValue} replaceValue={replaceValue} setReplaceValue={setReplaceValue} onReplaceAll={doFindReplace} />
      {/* Modal de versÃµes */}
      <VersionsModal show={showVersions} onClose={() => setShowVersions(false)} loadingVersions={loadingVersions} versions={versions} onRestoreVersion={handleRestaurarVersao} />
      {/* Modal de detalhes */}
      <DetailsModal show={showDetails} onClose={() => setShowDetails(false)} sheetName={sheetName} rows={rows} columns={columns} />
      {/* Modal de configuraÃ§Ãµes */}
      <ConfigModal show={showConfig} onClose={() => setShowConfig(false)} />

      {/* ChatBox flutuante */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 3000, boxShadow: '0 2px 12px rgba(0,0,0,0.13)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        <ChatBox username={sheetName} />
      </div>
      
      {/* Status de conexão com o backend */}
      <ConnectionStatus 
        status={connectionStatus}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />
      {/* Imagens flutuantes */}
      {Object.entries(cellTypes).filter(([k, v]) => v.type === 'image').map(([key, v]) => {
        const [row, col] = key.split('-').map(Number);
        const pos = getCellPosition(row, col);
        return (
          <div
            key={key}
            style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 10, cursor: 'move', userSelect: 'none' }}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('text/plain', key);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDoubleClick={() => handleTrocarImagem(row, col)}
          >
            <img src={v.value} alt="img" style={{ maxWidth: 200, maxHeight: 100, borderRadius: 4, boxShadow: '0 2px 8px #0002' }} />
            <button
              style={{ position: 'absolute', top: 2, right: 2, background: '#fff', border: '1px solid #ccc', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, opacity: 0.8 }}
              title="Remover imagem"
              onClick={e => { e.stopPropagation(); handleRemoverImagem(row, col); }}
            >â</button>
          </div>
        );
      })}
    </div>
  );
}
