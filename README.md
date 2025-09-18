# BLMCGen v2.1.2

**Business & Lean Model Canvas Generator**

Uma ferramenta web moderna para criar Business Model Canvas (BMC) e Lean Model Canvas (LMC) de forma rápida e visual usando sintaxe markdown, inspirada no Mermaid.

## 🚀 Funcionalidades Implementadas v2.1.2

- ✅ **Editor de código** com Monaco Editor (mesmo do VS Code)
- ✅ **Suporte duplo**: Business Model Canvas (BMC) e Lean Model Canvas (LMC)
- ✅ **Detecção automática** do tipo de canvas baseado no conteúdo
- ✅ **Visualização em tempo real** com renderização em Canvas HTML5
- ✅ **Interface split-screen** estilo Mermaid Live Editor
- ✅ **Sistema de múltiplas abas de código** - NOVO! 🎉
  - Criar, renomear e fechar abas de código
  - Auto-save em localStorage
  - Troca entre abas preservando conteúdo
- ✅ **Sistema de abas**: Código (editável), Exemplo BMC (readonly), Exemplo LMC (readonly)
- ✅ **Proteção de código do usuário** - exemplos não sobrescrevem código editável
- ✅ **Exportação PDF REAL** - FUNCIONANDO PERFEITAMENTE! 🎯
  - Geração de PDF verdadeiro usando jsPDF
  - Formato A4 landscape otimizado
  - Resolução de conflitos AMD com Monaco Editor
  - Fallback inteligente para PNG A4 se necessário
- ✅ **Exportação PNG/JPEG** em alta qualidade
- ✅ **Zoom** e controles de visualização
- ✅ **Suporte multi-idioma** (Português, Inglês, Espanhol)
- ✅ **Layout responsivo** para mobile e desktop com suporte a zoom alto (125%+)
- ✅ **Exemplos educativos** com explicações e perguntas orientadoras
- ✅ **Persistência automática** de código em localStorage
- ✅ **Favicon personalizado** com emoji 📊

## 📋 Sintaxe Suportada

### Business Model Canvas (BMC)
```bmc
bmc
title: Nome do seu negócio
description: Breve descrição do modelo de negócio

customer-segments:
  - Segmento de cliente 1
  - Segmento de cliente 2

value-propositions:
  - Proposta de valor 1
  - Proposta de valor 2

channels:
  - Canal 1
  - Canal 2

customer-relationships:
  - Tipo de relacionamento 1
  - Tipo de relacionamento 2

revenue-streams:
  - Fonte de receita 1
  - Fonte de receita 2

key-resources:
  - Recurso-chave 1
  - Recurso-chave 2

key-activities:
  - Atividade-chave 1
  - Atividade-chave 2

key-partnerships:
  - Parceria-chave 1
  - Parceria-chave 2

cost-structure:
  - Custo 1
  - Custo 2
```

### Lean Model Canvas (LMC)
```lmc
lmc
title: Nome da sua startup
description: Breve descrição da solução

problem:
  - Problema 1
  - Problema 2

solution:
  - Solução 1
  - Solução 2

unique-value-proposition:
  - Proposta única de valor

unfair-advantage:
  - Vantagem competitiva 1
  - Vantagem competitiva 2

customer-segments:
  - Segmento de cliente 1
  - Segmento de cliente 2

key-metrics:
  - Métrica-chave 1
  - Métrica-chave 2

channels:
  - Canal 1
  - Canal 2

cost-structure:
  - Custo 1
  - Custo 2

revenue-streams:
  - Fonte de receita 1
  - Fonte de receita 2
```

## 🎯 Componentes dos Canvas

### Business Model Canvas (9 blocos)
| Componente | Descrição |
|------------|-----------|
| **customer-segments** | Segmentos de Clientes - Para quem criamos valor? |
| **value-propositions** | Proposições de Valor - Que valor entregamos? |
| **channels** | Canais - Como chegamos aos clientes? |
| **customer-relationships** | Relacionamento com Clientes - Que tipo de relacionamento? |
| **revenue-streams** | Fontes de Receita - Como geramos receita? |
| **key-resources** | Recursos-Chave - Quais recursos são essenciais? |
| **key-activities** | Atividades-Chave - Quais atividades são essenciais? |
| **key-partnerships** | Parcerias-Chave - Quem são nossos parceiros? |
| **cost-structure** | Estrutura de Custos - Quais são os custos principais? |

### Lean Model Canvas (9 blocos)
| Componente | Descrição |
|------------|-----------|
| **problem** | Problema - Quais problemas você está resolvendo? |
| **solution** | Solução - Como você resolve esses problemas? |
| **unique-value-proposition** | Proposta Única de Valor - O que te torna único? |
| **unfair-advantage** | Vantagem Competitiva - O que você tem que outros não podem copiar? |
| **customer-segments** | Segmentos de Clientes - Para quem você está construindo? |
| **key-metrics** | Métricas-Chave - Como você mede o sucesso? |
| **channels** | Canais - Como você alcança seus clientes? |
| **cost-structure** | Estrutura de Custos - Quais são seus custos principais? |
| **revenue-streams** | Fontes de Receita - Como você ganha dinheiro? |

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura da aplicação com favicon SVG
- **CSS3** - Estilização e layout responsivo
- **JavaScript (ES6+)** - Lógica da aplicação e módulos
- **Monaco Editor** - Editor de código profissional
- **Canvas HTML5** - Renderização dos canvas em alta qualidade
- **jsPDF** - Exportação para PDF com detecção robusta
- **Arquitetura modular** - Parser, Renderer e App separados

## 🚀 Como Usar

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/andersonid/BLMCGen.git
   cd BLMCGen
   ```

2. **Abra direto no navegador (recomendado)**
   - Abra o arquivo `index.html` no navegador.
   - Não é necessário rodar servidor web.

3. **(Opcional) Usar um servidor local**
   Caso prefira acessar via `http://localhost`, você pode usar:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js
   npx http-server

   # PHP
   php -S localhost:8000
   ```
   Depois acesse: `http://localhost:8000`

3. **Acesse no navegador**: `http://localhost:8000`

### 📝 Usando as Múltiplas Abas

1. **Criar nova aba de código**:
   - Clique no botão `+` ao lado das abas
   - Uma nova aba será criada automaticamente

2. **Renomear aba**:
   - Duplo clique no nome da aba
   - Digite o novo nome e pressione Enter

3. **Trabalhar com múltiplos projetos**:
   - Use cada aba para um projeto diferente
   - O conteúdo é salvo automaticamente
   - Abas são restauradas ao recarregar a página

4. **Ver exemplos**:
   - Clique em "BMC Example" para ver exemplo da Netflix
   - Clique em "LMC Example" para ver exemplo do Uber
   - Exemplos não afetam seu código nas abas editáveis

5. **Voltar ao seu código**:
   - Clique na aba "Code" para voltar às suas abas editáveis
   - Todo seu código estará preservado

## 📱 Interface

### Sistema de Abas
- **📝 Código**: Editor principal (editável) - preserva alterações do usuário
- **💼 Exemplo BMC**: Exemplo do Netflix (somente leitura)
- **🚀 Exemplo LMC**: Exemplo do Uber (somente leitura)

### Painel Principal
- **Header**: Título, seletor de idioma, controles de zoom, botões de exportação
- **Editor Panel**: Monaco Editor com syntax highlighting
- **Preview Panel**: Visualização do canvas com detecção automática de tipo

### Funcionalidades Avançadas
- **Detecção automática**: Identifica BMC vs LMC baseado nas seções utilizadas
- **Títulos dinâmicos**: Muda entre "Business Model Canvas" e "Lean Model Canvas"
- **Preservação de estado**: Código do usuário é mantido ao trocar abas
- **Exemplos educativos**: Incluem perguntas orientadoras e explicações

## 🎨 Cores das Seções

### Business Model Canvas
- 🔴 **Segmentos de Clientes**: Vermelho
- 🟢 **Proposições de Valor**: Verde-azulado  
- 🔵 **Canais**: Azul
- 🟦 **Relacionamento**: Verde claro
- 🟡 **Fontes de Receita**: Amarelo
- 🟣 **Recursos-Chave**: Roxo
- 🟢 **Atividades-Chave**: Verde água
- 🟨 **Parcerias-Chave**: Amarelo dourado
- 🟪 **Estrutura de Custos**: Lilás

### Lean Model Canvas
- 🔴 **Problema**: Vermelho
- 🟢 **Solução**: Verde
- 🔵 **Proposta Única de Valor**: Azul
- 🟣 **Vantagem Competitiva**: Roxo
- 🟨 **Segmentos de Clientes**: Amarelo
- 🟦 **Métricas-Chave**: Azul claro
- 🟡 **Canais**: Amarelo
- 🟪 **Estrutura de Custos**: Lilás
- 🟩 **Fontes de Receita**: Verde claro

## 🔄 Sistema de Múltiplas Abas v2.1

### 📝 Abas de Código Editáveis
- **Criar nova aba**: Clique no botão `+`
- **Renomear aba**: Duplo clique no nome da aba
- **Fechar aba**: Clique no botão `×` (mínimo de 1 aba)
- **Trocar entre abas**: Clique simples na aba desejada
- **Auto-save**: Conteúdo salvo automaticamente no localStorage
- **Persistência**: Abas restauradas ao recarregar a página

### 📚 Abas de Exemplo (Somente Leitura)
- **BMC Example**: Exemplo completo da Netflix
- **LMC Example**: Exemplo completo do Uber
- **Proteção**: Exemplos não afetam código das abas editáveis
- **Educativo**: Inclui comentários explicativos e perguntas orientadoras

### 🔒 Proteção de Dados
- Código do usuário **nunca é sobrescrito** pelos exemplos
- Cada aba mantém seu conteúdo independente
- Auto-save funciona apenas nas abas de código editáveis
- Troca entre abas preserva todo o conteúdo

## 🌍 Suporte Multi-idioma

- **Português** (padrão)
- **English**
- **Español**

Tradução completa de:
- Interface do usuário
- Títulos das seções
- Exemplos educativos
- Mensagens do sistema

## 🎯 Roadmap

### ✅ Versão Atual (v2.1.1)
- [x] Editor Monaco com syntax highlighting
- [x] Suporte completo a BMC e LMC
- [x] Detecção automática de tipo
- [x] Sistema de múltiplas abas de código
- [x] Auto-save e persistência em localStorage
- [x] Proteção de código do usuário
- [x] Sistema de abas com exemplos
- [x] Exportação PDF/PNG/JPEG robusta
- [x] Suporte multi-idioma
- [x] Interface responsiva com suporte a zoom alto
- [x] Exemplos educativos
- [x] Favicon personalizado

#### 🔧 Correções v2.1.1
- **PDF Export**: Corrigida biblioteca jsPDF com detecção aprimorada
- **Favicon**: Adicionado favicon personalizado (📊) para eliminar erro 404
- **Qualidade**: Melhorada qualidade de exportação PDF
- **Robustez**: Fallback automático PNG quando PDF falha

### 🔄 Próximas Versões
- [ ] **v2.2**: Salvar/Carregar projetos nomeados
- [ ] **v2.3**: Themes e personalização de cores
- [ ] **v2.4**: Exportação para SVG

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença GNU GPL v3. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🎉 Inspiração

Este projeto foi inspirado no [Mermaid](https://mermaid-js.github.io/mermaid/#/) e na necessidade de uma ferramenta simples para criar Business Model Canvas e Lean Model Canvas de forma rápida e visual.

## 📈 Changelog

### v2.1.2 (2025-07-14)
- 🎯 **CORRIGIDO**: Exportação PDF real funcionando perfeitamente
- 🔧 **TÉCNICO**: Resolvido conflito AMD entre Monaco Editor e jsPDF
- ✅ **MELHORIA**: Detecção robusta da biblioteca jsPDF com fallbacks
- 📄 **NOVO**: PDF real em formato A4 landscape otimizado
- 🚀 **ESTABILIDADE**: Sistema de carregamento de bibliotecas mais robusto

### v2.1.1 (2025-07-13)
- 🎉 **NOVO**: Sistema de múltiplas abas de código
- 🔧 **CORRIGIDO**: Proteção de código do usuário
- ✅ **MELHORIA**: Interface responsiva aprimorada
- 📊 **NOVO**: Favicon personalizado

## 📚 Referências

- [Business Model Canvas](https://www.strategyzer.com/canvas/business-model-canvas) - Alexander Osterwalder
- [Lean Canvas](https://leanstack.com/lean-canvas) - Ash Maurya
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Microsoft

---

**Desenvolvido com ❤️ para a comunidade de empreendedores e desenvolvedores**

**🌟 Se este projeto foi útil para você, considere dar uma estrela no GitHub!** 