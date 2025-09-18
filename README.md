# BLMCGen v2.1.2

**Business & Lean Model Canvas Generator**

Uma ferramenta web para criar Business Model Canvas (BMC) e Lean Model Canvas (LMC) usando uma sintaxe inspirada em markdown.

## Funcionalidades

*   **Suporte Duplo**: Criação de Business Model Canvas (BMC) e Lean Model Canvas (LMC).
*   **Pré-visualização em Tempo Real**: Renderização do canvas enquanto você digita.
*   **Interface com Abas**:
    *   Gerencie múltiplos projetos em abas.
    *   O conteúdo é salvo automaticamente no localStorage.
*   **Opções de Exportação**:
    *   Exportação para PDF.
    *   Exportação para PNG/JPEG.
*   **Suporte a Múltiplos Idiomas**: Disponível em Português, Inglês e Espanhol.
*   **Design Responsivo**: Funciona em dispositivos móveis e desktops.
*   **Exemplos Integrados**: Inclui exemplos para BMC (Netflix) e LMC (Uber).

## Como Usar

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/andersonid/BLMCGen.git
    cd BLMCGen
    ```
2.  **Abra no navegador**:
    *   Abra o arquivo `index.html` diretamente no seu navegador. Não é necessário um servidor web.

## Sintaxe

### Business Model Canvas (BMC)
```
bmc
title: Nome do seu negócio
description: Breve descrição do modelo de negócio

customer-segments:
  - Segmento de cliente 1
value-propositions:
  - Proposta de valor 1
channels:
  - Canal 1
customer-relationships:
  - Tipo de relacionamento 1
revenue-streams:
  - Fonte de receita 1
key-resources:
  - Recurso-chave 1
key-activities:
  - Atividade-chave 1
key-partnerships:
  - Parceria-chave 1
cost-structure:
  - Custo 1
```

### Lean Model Canvas (LMC)
```
lmc
title: Nome da sua startup
description: Breve descrição da solução

problem:
  - Problema 1
solution:
  - Solução 1
unique-value-proposition:
  - Proposta única de valor
unfair-advantage:
  - Vantagem competitiva 1
customer-segments:
  - Segmento de cliente 1
key-metrics:
  - Métrica-chave 1
channels:
  - Canal 1
cost-structure:
  - Custo 1
revenue-streams:
  - Fonte de receita 1
```

## Tecnologias Utilizadas

*   HTML5
*   CSS3
*   JavaScript (ES6+)
*   Monaco Editor
*   jsPDF

---