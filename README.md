# BLMCGen

**Business & Lean Model Canvas Generator**

Uma ferramenta web para criar Business Model Canvas de forma rápida e visual usando sintaxe markdown, inspirada no Mermaid.

## 🚀 Funcionalidades

- ✅ **Editor de código** com syntax highlighting
- ✅ **Visualização em tempo real** do Business Model Canvas
- ✅ **Sintaxe markdown** simples e intuitiva
- ✅ **Interface split-screen** estilo Mermaid Live Editor
- ✅ **Exportação** para PNG
- ✅ **Zoom** e controles de visualização
- ✅ **Responsivo** para mobile e desktop

## 📋 Sintaxe

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

## 🎯 Os 9 Componentes do Business Model Canvas

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

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura da aplicação
- **CSS3** - Estilização e layout responsivo
- **JavaScript (ES6+)** - Lógica da aplicação
- **Monaco Editor** - Editor de código (mesmo do VS Code)
- **Canvas HTML5** - Renderização do Business Model Canvas

## 🚀 Como Usar

1. **Clone o repositório**:
   ```bash
   git clone <repository-url>
   cd BMCMarkdown
   ```

2. **Abra o arquivo HTML**:
   ```bash
   # Abra index.html em um navegador
   # Ou use um servidor local:
   python -m http.server 8000
   # Acesse: http://localhost:8000
   ```

3. **Comece a usar**:
   - Digite sua sintaxe BMC no editor à esquerda
   - Veja o canvas sendo gerado em tempo real à direita
   - Use os botões para exportar, formatar código, etc.

## 📱 Interface

A interface é dividida em 3 partes principais:

- **Header**: Título, botões de ação (Export, Share, Save)
- **Editor Panel**: Editor de código com syntax highlighting
- **Preview Panel**: Visualização do Business Model Canvas

## 🎨 Cores das Seções

Cada seção do BMC tem uma cor específica para facilitar a identificação:

- 🔴 **Segmentos de Clientes**: Vermelho
- 🟢 **Proposições de Valor**: Verde-azulado
- 🔵 **Canais**: Azul
- 🟦 **Relacionamento**: Verde claro
- 🟡 **Fontes de Receita**: Amarelo
- 🟣 **Recursos-Chave**: Roxo
- 🟢 **Atividades-Chave**: Verde água
- 🟨 **Parcerias-Chave**: Amarelo dourado
- 🟪 **Estrutura de Custos**: Lilás

## 🎯 Roadmap

### Versão Atual (v1.0)
- [x] Editor básico com syntax highlighting
- [x] Renderização do BMC em Canvas
- [x] Exportação para PNG
- [x] Interface responsiva

### Próximas Versões
- [ ] **v1.1**: Salvar/Carregar projetos (localStorage)
- [ ] **v1.2**: Themes e personalização de cores
- [ ] **v1.3**: Exportação para PDF e SVG
- [ ] **v1.4**: Colaboração em tempo real
- [ ] **v2.0**: Backend e banco de dados
- [ ] **v2.1**: Autenticação de usuários
- [ ] **v2.2**: Galeria de templates
- [ ] **v2.3**: Integração com ferramentas externas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🎉 Inspiração

Este projeto foi inspirado no [Mermaid](https://mermaid-js.github.io/mermaid/#/) e na necessidade de uma ferramenta simples para criar Business Model Canvas de forma rápida e visual.

---

**Desenvolvido com ❤️ para a comunidade de empreendedores e desenvolvedores** 