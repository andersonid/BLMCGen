# CONCEPT — BLMCGen / BMCMarkdown

## O que é
Ferramenta web para criar Business Model Canvas (BMC) e Lean Model Canvas (LMC) usando uma sintaxe inspirada em markdown, com preview em tempo real.

## Modos de uso
- **Simples**: abrir `index.html` no navegador (sem servidor); dados em localStorage.
- **Com backend**: Docker Compose sobe Nginx + API + PostgreSQL; API oferece auth (JWT), CRUD de canvas, perfil e sessões.

## Objetivos
- Experiência rápida e leve no frontend.
- Possibilidade de persistência/autenticação via backend quando necessário.
