# DataMergeAI

DataMergeAI é uma plataforma de planilhas inteligente, inspirada no Excel/Google Sheets, com recursos avançados de edição, automação e integração com IA.

## Funcionalidades
- Edição de planilhas estilo Excel (atalhos, seleção múltipla, formatação, mesclar, filtros, validação, etc)
- Importação/exportação de arquivos Excel (.xlsx, .xls, .csv)
- Histórico de versões, desfazer/refazer, copiar/colar, fórmulas simples
- Inserção de imagens, gráficos reais, comentários, links, notas, caixas de seleção
- Ferramentas: formulário customizado, macros, scripts, revisão, acessibilidade
- Filtros, ordenação, validação de dados, remoção de duplicatas, dividir texto em colunas, proteção de intervalo
- Persistência automática no navegador (localStorage)
- Envio de planilhas por e-mail (backend)

### Funcionalidades de IA
- Integração com APIs de IA para análise de dados
- Sugestões inteligentes de fórmulas
- Autocompletar baseado em padrões

## Estrutura do Projeto
- **backend/**: API e processamento com Django
- **frontend/**: Interface do usuário com React (Vite)

## Como rodar o projeto

### 1. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Acesse em [http://localhost:5173](http://localhost:5173)

### 2. Backend (Django)
```bash
cd backend
python manage.py migrate
python manage.py runserver
```
Acesse a API em [http://localhost:8000](http://localhost:8000)

> **Obs:** Certifique-se de ter o Python 3.10+ e Django instalados. O backend espera um ambiente virtual (venv).

## Uso
- Use o menu superior para acessar todas as funções (Arquivo, Editar, Ver, Inserir, Formatar, Dados, Ferramentas).
- Atalhos de teclado: Enter, Tab, Shift+Seta, Ctrl+C/V, etc.
- Para gráficos, selecione o intervalo e use Inserir > Gráfico.
- Todas as edições são salvas automaticamente no navegador.
- Para enviar por e-mail, use Arquivo > E-mail.

## Contribuição
Pull requests são bem-vindos!
Sugestões de novas funcionalidades ou melhorias de UX/UI são muito apreciadas.
