# Changelog - BLMCGen

## [v2.1.1] - 2024-12-28

### Correções
- **Exportação PDF**: Resolvido problema na exportação para PDF.
  - Corrigida a detecção da biblioteca jsPDF.
  - Implementada lógica de detecção baseada em `window.jspdf.jsPDF`.
  - Mantido fallback automático para PNG em caso de falha.

- **Favicon**: Eliminado erro 404 do favicon.
  - Adicionado um favicon SVG personalizado.

### Melhorias
- **Exportação PDF**: Aprimorados os cálculos de dimensão para A4 paisagem.
- **Console**: Reduzidos os erros e avisos no console do navegador.
- **Performance**: Detecção mais eficiente da biblioteca jsPDF.
- **Robustez**: Adicionado sistema de carregamento dinâmico em caso de falha.
- **Debug**: Adicionados logs detalhados para diagnóstico.

### Documentação
- Atualizado README.md com as correções implementadas.
- Adicionado changelog para rastrear mudanças.
- Documentadas as tecnologias utilizadas.

---

## [v2.1.0] - 2024-12-27

### Funcionalidades Principais
- Editor Monaco com syntax highlighting.
- Suporte completo a BMC e LMC.
- Sistema de múltiplas abas de código.
- Exportação para PNG, JPEG e PDF.
- Interface responsiva e multi-idioma.
- Exemplos educativos integrados.