import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { MdUndo, MdRedo, MdPrint, MdFormatPaint, MdAttachMoney, MdPercent, MdExposureNeg1, MdExposurePlus1, MdFormatBold, MdFormatItalic, MdStrikethroughS, MdFormatColorText, MdFormatColorFill, MdBorderAll, MdMergeType, MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdWrapText, MdInsertLink, MdInsertComment, MdInsertChart, MdFilterList } from 'react-icons/md';
import './MainContent.css';
import './Modal.css';
import ChatBox from './ChatBox';
import './ChatBox.css';

// Função utilitária para criar matriz vazia
const columns = ['A','B','C', 'D','E','F','G','H','I','J','K'];
const rows = Array.from({length: 100}, (_, i) => i + 1);
function createEmptyData() {
  return Array.from({ length: rows.length }, () => Array(columns.length).fill(''));
}

export default function MainContent() {
  const [cellData, setCellData] = useState(createEmptyData());
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
    'Modo de exibição': handleModoExibicao,
    'Congelar': handleCongelar,
    'Ocultar linhas': handleOcultarLinhas,
    'Ocultar colunas': handleOcultarColunas,
    'Mostrar fórmulas': handleMostrarFormulas,
    'Zoom': handleZoom
  };
  const [clipboard, setClipboard] = useState('');
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const fileInputRef = useRef(null);

  // Novo: limpa a tabela, mas pede confirmação se houver dados
  function handleNovo() {
    const hasData = cellData.some(row => row.some(cell => cell !== ''));
    if (hasData) {
      if (!window.confirm('Os dados não salvos serão perdidos. Deseja continuar?')) {
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

  // Fazer uma cópia: salva cópia em memória (simples)
  const [copias, setCopias] = useState([]); // [{nome, data}]
  function handleFazerCopia() {
    const nome = window.prompt('Nome da cópia:', 'Cópia de Book1');
    if (!nome) return;
    setCopias([...copias, { nome, data: JSON.parse(JSON.stringify(cellData)) }]);
    window.alert('Cópia salva em memória!');
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
        // Sobrescreve tudo
        const newData = createEmptyData();
        for (let r = 0; r < Math.min(sheetData.length, rows.length); r++) {
          for (let c = 0; c < Math.min(sheetData[r].length, columns.length); c++) {
            newData[r][c] = sheetData[r][c] !== undefined ? String(sheetData[r][c]) : '';
          }
        }
        setCellData(newData);
      } else if (mode === 'importar') {
        // Mescla dados: só preenche células vazias
        const newData = cellData.map(arr => [...arr]);
        for (let r = 0; r < Math.min(sheetData.length, rows.length); r++) {
          for (let c = 0; c < Math.min(sheetData[r].length, columns.length); c++) {
            if (newData[r][c] === '' && sheetData[r][c] !== undefined && sheetData[r][c] !== '') {
              newData[r][c] = String(sheetData[r][c]);
            }
          }
        }
        setCellData(newData);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Histórico para desfazer/refazer
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
    setClipboard(cellData[row][col]);
    const newData = cellData.map(arr => [...arr]);
    newData[row][col] = '';
    pushHistory(newData);
  }
  function handleCopiar() {
    const { row, col } = selectedCell;
    setClipboard(cellData[row][col]);
  }
  function handleColar() {
    const { row, col } = selectedCell;
    const newData = cellData.map(arr => [...arr]);
    newData[row][col] = clipboard;
    pushHistory(newData);
  }
  function handleColarEspecial() {
    window.prompt('Colar especial (simulação): valor no clipboard =', clipboard);
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

  // Salvar versão no backend
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
      alert('Versão salva com sucesso!');
      fetchVersions();
    } else {
      alert('Erro ao salvar versão.');
    }
  }

  // Buscar versões do backend
  async function fetchVersions() {
    setLoadingVersions(true);
    const res = await fetch('/api/excel/versions/');
    if (res.ok) {
      const data = await res.json();
      setVersions(data);
    }
    setLoadingVersions(false);
  }

  // Abrir modal de versões
  function handleShowVersions() {
    setShowVersions(true);
    fetchVersions();
  }

  // Restaurar versão
  function handleRestaurarVersao(version) {
    try {
      const data = JSON.parse(version.data);
      setCellData(data);
      setShowVersions(false);
      alert('Versão restaurada!');
    } catch {
      alert('Erro ao restaurar versão.');
    }
  }

  // Enviar planilha por e-mail
  async function handleEnviarEmail() {
    const to_email = window.prompt('Digite o e-mail de destino:');
    if (!to_email) return;
    // Monta dados como array de arrays (igual exportação)
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

  // Handlers para as opções do menu Arquivo
  const fileMenuHandlers = {
    'Novo': handleNovo,
    'Abrir': handleAbrir,
    'Importar': handleImportar,
    'Fazer uma cópia': handleFazerCopia,
    'Baixar': handleBaixar,
    'E-mail': handleEnviarEmail,
    'Histórico de versões': handleShowVersions,
    'Salvar versão': handleSalvarVersao,
    'Renomear': handleRenomear,
    'Detalhes': () => setShowDetails(true),
    'Configurações': () => setShowConfig(true),
    'Sair': async () => {
      const hasData = cellData.some(row => row.some(cell => cell !== ''));
      if (hasData) {
        const op = window.confirm('Você tem dados não salvos. Deseja salvar antes de sair?');
        if (op) {
          await fileMenuHandlers['Salvar versão']();
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
    setMacroText('Simulação: Macro gravada para copiar dados da coluna A para B.');
    setShowMacroModal(true);
  }
  function handleEditorScripts() {
    setScriptText('// Simulação: Script para somar valores da coluna C.\nfunction somaColunaC() { /* ... */ }');
    setShowScriptModal(true);
  }
  function handleRevisao() {
    setReviewText('Simulação: Nenhuma alteração pendente. Todas as células revisadas.');
    setShowReviewModal(true);
  }
  function handleAcessibilidade() {
    setShowAccessibilityModal(true);
  }
  const toolsMenuHandlers = {
    'Criar formulário': handleCriarFormulario,
    'Macros': handleMacros,
    'Editor de scripts': handleEditorScripts,
    'Revisão': handleRevisao,
    'Acessibilidade': handleAcessibilidade
  };
const menuOptions = {
  'Arquivo': [
    'Novo',
    'Abrir',
    'Importar',
    'Fazer uma cópia',
    'Baixar',
    'Salvar versão',
    'E-mail',
    'Histórico de versões',
    'Renomear',
    'Detalhes',
    'Configurações',
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
    'Modo de exibição',
    'Congelar',
    'Ocultar linhas',
    'Ocultar colunas',
    'Mostrar fórmulas',
    'Zoom'
  ],
  'Inserir': [
    'Linha acima',
    'Linha abaixo',
    'Coluna à esquerda',
    'Coluna à direita',
    'Células',
    'Imagem',
    'Gráfico',
    'Caixa de seleção',
    'Link',
    'Comentário',
    'Nota'
  ],
  'Formatar': [
    'Negrito',
    'Itálico',
    'Sublinhado',
    'Tachado',
    'Cor do texto',
    'Cor de preenchimento',
    'Formatar como moeda',
    'Formatar como porcentagem',
    'Formatar como número',
    'Alinhar',
    'Quebra de texto',
    'Mesclar células'
  ],
  'Dados': [
    'Classificar',
    'Criar filtro',
    'Validação de dados',
    'Remover duplicatas',
    'Dividir texto em colunas',
    'Proteger intervalo'
  ],
  'Ferramentas': [
    'Criar formulário',
    'Macros',
    'Editor de scripts',
    'Revisão',
    'Acessibilidade'
  ],
};

const menuItems = Object.keys(menuOptions);

  // Handlers para o menu Inserir
  const insertMenuHandlers = {
    'Linha acima': () => alert('Inserir linha acima (simulação)'),
    'Linha abaixo': () => alert('Inserir linha abaixo (simulação)'),
    'Coluna à esquerda': () => alert('Inserir coluna à esquerda (simulação)'),
    'Coluna à direita': () => alert('Inserir coluna à direita (simulação)'),
    'Células': () => alert('Inserir células (simulação)'),
    'Imagem': () => alert('Inserir imagem (simulação)'),
    'Gráfico': () => setShowChartModal(true),
    'Caixa de seleção': () => alert('Inserir caixa de seleção (simulação)'),
    'Link': () => alert('Inserir link (simulação)'),
    'Comentário': () => alert('Inserir comentário (simulação)'),
    'Nota': () => alert('Inserir nota (simulação)')
  };

  // Handlers para o menu Formatar
  const formatMenuHandlers = {
    'Negrito': () => alert('Formatar como negrito (simulação)'),
    'Itálico': () => alert('Formatar como itálico (simulação)'),
    'Sublinhado': () => alert('Formatar como sublinhado (simulação)'),
    'Tachado': () => alert('Formatar como tachado (simulação)'),
    'Cor do texto': () => alert('Alterar cor do texto (simulação)'),
    'Cor de preenchimento': () => alert('Alterar cor de preenchimento (simulação)'),
    'Formatar como moeda': () => alert('Formatar como moeda (simulação)'),
    'Formatar como porcentagem': () => alert('Formatar como porcentagem (simulação)'),
    'Formatar como número': () => alert('Formatar como número (simulação)'),
    'Alinhar': () => alert('Alterar alinhamento (simulação)'),
    'Quebra de texto': () => alert('Alterar quebra de texto (simulação)'),
    'Mesclar células': () => alert('Mesclar células (simulação)')
  };

  // Handlers para o menu Dados
  const dataMenuHandlers = {
    'Classificar': () => alert('Classificar dados (simulação)'),
    'Criar filtro': () => alert('Criar filtro (simulação)'),
    'Validação de dados': () => alert('Validação de dados (simulação)'),
    'Remover duplicatas': () => alert('Remover duplicatas (simulação)'),
    'Dividir texto em colunas': () => alert('Dividir texto em colunas (simulação)'),
    'Proteger intervalo': () => alert('Proteger intervalo (simulação)')
  };


  return (
    <div className="main-content">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div className="title">
        <span className="logo-inline">?? DataMergeAI</span>
        <span style={{ marginLeft: 16 }}>{sheetName} - Excel</span>
      </div>
      <div className="menu-bar">
        {menuItems.map((val) => (
          <div key={val} className="menu-dropdown">
            <span>{val}</span>
            <div className="dropdown-content">
              {menuOptions[val].map((opt, i) => (
                <button
                  className="menu-action"
                  key={i}
                  onClick={
                    val === 'Arquivo' && fileMenuHandlers[opt] ? fileMenuHandlers[opt] :
                    val === 'Editar' && editMenuHandlers[opt] ? editMenuHandlers[opt] :
                    val === 'Ver' && viewMenuHandlers[opt] ? viewMenuHandlers[opt] :
                    val === 'Inserir' && insertMenuHandlers[opt] ? insertMenuHandlers[opt] :
                    val === 'Formatar' && formatMenuHandlers[opt] ? formatMenuHandlers[opt] :
                    val === 'Dados' && dataMenuHandlers[opt] ? dataMenuHandlers[opt] :
                    val === 'Ferramentas' && toolsMenuHandlers[opt] ? toolsMenuHandlers[opt] :
                    undefined
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="menu-send">
          <span>Send</span>
          <div className="send-dropdown">
            <button className="menu-action">Upload</button>
            <button className="menu-action">Exportar</button>
            <button className="menu-action">Enviar por E-mail</button>
          </div>
        </div>
      </div>
      <div className="cell-content">
        <div>fx</div>
        <div></div>
      </div>
      <div className="icon-bar">
        {/* Barra de ferramentas com react-icons */}
        <button className="icon-btn" title="Desfazer"><MdUndo /></button>
        <button className="icon-btn" title="Refazer"><MdRedo /></button>
        <button className="icon-btn" title="Imprimir"><MdPrint /></button>
        <button className="icon-btn" title="Pintar formatação"><MdFormatPaint /></button>
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
        <select className="icon-select" title="Fonte" defaultValue="Padrão (Arial)">
          <option>Padrão (Arial)</option>
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
        <button className="icon-btn" title="Itálico"><MdFormatItalic /></button>
        <button className="icon-btn" title="Tachar"><MdStrikethroughS /></button>
        <button className="icon-btn" title="Cor do texto"><MdFormatColorText /></button>
        <button className="icon-btn" title="Cor de preenchimento"><MdFormatColorFill /></button>
        <button className="icon-btn" title="Bordas"><MdBorderAll /></button>
        <button className="icon-btn" title="Mesclar células"><MdMergeType /></button>
        <button className="icon-btn" title="Alinhar à esquerda"><MdFormatAlignLeft /></button>
        <button className="icon-btn" title="Alinhar ao centro"><MdFormatAlignCenter /></button>
        <button className="icon-btn" title="Alinhar à direita"><MdFormatAlignRight /></button>
        <button className="icon-btn" title="Ajuste de texto"><MdWrapText /></button>
        <button className="icon-btn" title="Inserir link"><MdInsertLink /></button>
        <button className="icon-btn" title="Inserir comentário"><MdInsertComment /></button>
        <button className="icon-btn" title="Inserir gráfico"><MdInsertChart /></button>
        <button className="icon-btn" title="Filtro"><MdFilterList /></button>
      </div>
      <div className="cells">
        <div className="cells__spacer"></div>
        {columns.map(col => (
          <div className="cells__alphabet" key={col}>{col}</div>
        ))}
        {rows.map(row => (
          <div className="cells__number" key={row}>{row}</div>
        ))}
        {rows.map((row, rIdx) =>
          hiddenRows.includes(rIdx) ? null :
          columns.map((col, cIdx) => {
            if (hiddenCols.includes(cIdx)) return null;
            const cellKey = `${rIdx}-${cIdx}`;
            const cellType = cellTypes[cellKey]?.type;
            const cellValue = cellTypes[cellKey]?.value;
            // Renderização com estilos
            const styleObj = cellStyles[cellKey] || {};
            let displayValue = cellData[rIdx][cIdx];
            if (styleObj.format === 'moeda') displayValue = `R$ ${displayValue}`;
            if (styleObj.format === 'porcentagem') displayValue = `${displayValue}%`;
            if (styleObj.format === 'numero') displayValue = Number(displayValue).toLocaleString();
            return (
              <div style={{ position: 'relative', display: styleObj.merged ? 'none' : 'inline-block' }} key={cellKey}>
                {cellType === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={!!cellValue}
                    className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '')}
                    style={{ zoom, background: styleObj.bg, color: styleObj.color, fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined }}
                    onClick={() => { setSelectedCell({ row: rIdx, col: cIdx }); handleToggleCheckbox(rIdx, cIdx); }}
                    readOnly={readOnly}
                  />
                ) : cellType === 'link' ? (
                  <a
                    href={cellValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '')}
                    style={{ zoom, background: styleObj.bg, color: styleObj.color, fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined, display: 'inline-block', width: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                  >{cellValue}</a>
                ) : cellType === 'comment' ? (
                  <>
                    <input
                      className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '')}
                      style={{ zoom, background: styleObj.bg, color: styleObj.color, fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined }}
                      value={displayValue}
                      readOnly={readOnly}
                      onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                      onChange={e => {
                        const newData = cellData.map(arr => [...arr]);
                        newData[rIdx][cIdx] = e.target.value;
                        pushHistory(newData);
                      }}
                    />
                    <span title={cellValue} style={{ position: 'absolute', right: 2, top: 2, fontSize: 14, color: '#f90', cursor: 'pointer' }}>💬</span>
                  </>
                ) : cellType === 'note' ? (
                  <>
                    <input
                      className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '')}
                      style={{ zoom, background: styleObj.bg, color: styleObj.color, fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined }}
                      value={displayValue}
                      readOnly={readOnly}
                      onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                      onChange={e => {
                        const newData = cellData.map(arr => [...arr]);
                        newData[rIdx][cIdx] = e.target.value;
                        pushHistory(newData);
                      }}
                    />
                    <span title={cellValue} style={{ position: 'absolute', right: 2, bottom: 2, fontSize: 14, color: '#09f', cursor: 'pointer' }}>📝</span>
                  </>
                ) : cellType === 'chart' ? (
                  <button
                    className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '')}
                    style={{ zoom, background: '#e3f2fd', border: '1px solid #90caf9', cursor: 'pointer', fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined }}
                    onClick={() => setShowChartModal(true)}
                  >📊 Gráfico</button>
                ) : (
                  <input
                    className={'cells__input' + (selectedCell.row === rIdx && selectedCell.col === cIdx ? ' selected' : '') + (frozen.row && rIdx === 0 ? ' frozen-row' : '') + (frozen.col && cIdx === 0 ? ' frozen-col' : '')}
                    key={rIdx + '-' + cIdx}
                    value={showFormulas ? `=VALOR(${displayValue})` : displayValue}
                    style={{ zoom, background: styleObj.bg, color: styleObj.color, fontWeight: styleObj.bold ? 'bold' : undefined, fontStyle: styleObj.italic ? 'italic' : undefined, textDecoration: `${styleObj.underline ? 'underline ' : ''}${styleObj.strike ? 'line-through' : ''}`, textAlign: styleObj.align, whiteSpace: styleObj.wrap ? 'pre-wrap' : undefined }}
                    readOnly={readOnly}
                    onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                    onChange={e => {
                      const newData = cellData.map(arr => [...arr]);
                      newData[rIdx][cIdx] = e.target.value;
                      pushHistory(newData);
                    }}
                  />
                )}
                {cellStyles[cellKey]?.protected && (
                  <span title="Protegida" style={{ position: 'absolute', left: 2, top: 2, fontSize: 12, color: '#c00' }}>🔒</span>
                )}
              </div>
            );
          })
        )}
      {/* Modal de gráfico fake */}
      {showChartModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowChartModal(false)}>
          <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
            <h3>Gráfico (simulação)</h3>
            <div style={{ height: 120, background: '#e3f2fd', border: '1px solid #90caf9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
              📊
            </div>
            <div style={{ marginTop: 12, fontSize: 14, color: '#555' }}>Dados: {chartData}</div>
            <button style={{ marginTop: 16 }} onClick={() => setShowChartModal(false)}>Fechar</button>
          </div>
        </div>
      )}
      {/* Modal Criar Formulário */}
      {showFormModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowFormModal(false)}>
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
            <button style={{ marginTop: 16 }} onClick={() => setShowFormModal(false)}>Fechar</button>
          </div>
        </div>
      )}
      {/* Modal Macros */}
      {showMacroModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2410, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowMacroModal(false)}>
          <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
            <h3>Macros (simulação)</h3>
            <div style={{ fontSize: 14, color: '#555' }}>{macroText}</div>
            <button style={{ marginTop: 16 }} onClick={() => setShowMacroModal(false)}>Fechar</button>
          </div>
        </div>
      )}
      {/* Modal Editor de Scripts */}
      {showScriptModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2420, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowScriptModal(false)}>
          <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
            <h3>Editor de Scripts (simulação)</h3>
            <textarea style={{ width: '100%', minHeight: 80 }} value={scriptText} readOnly />
            <button style={{ marginTop: 16 }} onClick={() => setShowScriptModal(false)}>Fechar</button>
          </div>
        </div>
      )}
      {/* Modal Revisão */}
      {showReviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2430, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowReviewModal(false)}>
          <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
            <h3>Revisão (simulação)</h3>
            <div style={{ fontSize: 14, color: '#555' }}>{reviewText}</div>
            <button style={{ marginTop: 16 }} onClick={() => setShowReviewModal(false)}>Fechar</button>
          </div>
        </div>
      )}
      {/* Modal Acessibilidade */}
      {showAccessibilityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2440, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAccessibilityModal(false)}>
          <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
            <h3>Acessibilidade (simulação)</h3>
            <div style={{ fontSize: 14, color: '#555' }}>Recursos de acessibilidade simulados: alto contraste, navegação por teclado, descrição de células.</div>
            <button style={{ marginTop: 16 }} onClick={() => setShowAccessibilityModal(false)}>Fechar</button>
          </div>
        </div>
      )}
      {/* Modal Pesquisar e Substituir */}
      {showFindReplace && (
        <div className="modal" onClick={() => setShowFindReplace(false)}>
          <div className="modal-content" style={{maxWidth:400}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">Pesquisar e substituir</div>
            <div>
              <input placeholder="Pesquisar por..." value={findValue} onChange={e => setFindValue(e.target.value)} />
            </div>
            <div style={{ marginTop: 8 }}>
              <input placeholder="Substituir por..." value={replaceValue} onChange={e => setReplaceValue(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button onClick={doFindReplace}>Substituir tudo</button>
              <button onClick={() => setShowFindReplace(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      </div>
      {/* ChatBox integrado ao rodapé da planilha */}
      <div style={{ width: '100%', marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        <ChatBox username={sheetName} />
      </div>

      {/* Modal de versões */}
      {showVersions && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowVersions(false)}>
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
                      <button style={{ marginTop: 6 }} onClick={() => handleRestaurarVersao(v)}>Restaurar</button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button style={{ marginTop: 12 }} onClick={() => setShowVersions(false)}>Fechar</button>
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      {showDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDetails(false)}>
          <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
            <h3>Detalhes do arquivo</h3>
            <div><b>Nome:</b> {sheetName}</div>
            <div><b>Linhas:</b> {rows.length}</div>
            <div><b>Colunas:</b> {columns.length}</div>
            <div><b>Última modificação:</b> {new Date().toLocaleString()}</div>
            <button style={{ marginTop: 16 }} onClick={() => setShowDetails(false)}>Fechar</button>
          </div>
        </div>
      )}

      {/* Modal de configurações */}
      {showConfig && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowConfig(false)}>
          <div style={{ background: '#fff', borderRadius: 10, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
            <h3>Configurações</h3>
            <div>Configurações futuras podem ser adicionadas aqui.</div>
            <button style={{ marginTop: 16 }} onClick={() => setShowConfig(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
