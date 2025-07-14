# Changelog - BLMCGen

## [v2.1.1] - 2024-12-28

### 🔧 Correções (Bugfixes)
- **PDF Export**: ✅ **RESOLVIDO** - Exportação para PDF funcionando perfeitamente
  - Identificado e corrigido problema na detecção da biblioteca jsPDF
  - Implementada lógica de detecção baseada em `window.jspdf.jsPDF`
  - Testado e validado com testes isolados bem-sucedidos
  - Aplicada mesma lógica funcional na aplicação principal
  - Mantido fallback automático para PNG em caso de falha

- **Favicon**: ✅ **RESOLVIDO** - Eliminado erro 404 do favicon
  - Adicionado favicon personalizado usando emoji 📊 em formato SVG inline
  - Console limpo sem erros de resource not found

### ⚡ Melhorias (Enhancements)
- **Exportação PDF**: Cálculos de dimensão aprimorados para A4 landscape
- **Console**: Menos erros e warnings no console do navegador
- **Performance**: Detecção mais eficiente da biblioteca jsPDF
- **Robustez**: Sistema de carregamento dinâmico em caso de falha
- **Debug**: Logs detalhados para diagnóstico de problemas
- **Timing**: Verificações periódicas durante carregamento da página

### 📚 Documentação
- Atualizado README.md com correções implementadas
- Adicionado changelog para rastrear mudanças
- Documentadas tecnologias utilizadas

---

## [v2.1.0] - 2024-12-27

### ✨ Funcionalidades Principais
- Editor Monaco com syntax highlighting
- Suporte completo a BMC e LMC
- Sistema de múltiplas abas de código
- Exportação para PNG, JPEG e PDF
- Interface responsiva e multi-idioma
- Exemplos educativos integrados 