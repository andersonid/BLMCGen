// BMC Markdown Parser
class BMCParser {
    constructor() {
        this.sections = [
            'customer-segments',
            'value-propositions', 
            'channels',
            'customer-relationships',
            'revenue-streams',
            'key-resources',
            'key-activities',
            'key-partnerships',
            'cost-structure'
        ];
    }

    parse(code) {
        try {
            const lines = code.split('\n');
            const result = {
                title: '',
                description: '',
                sections: {}
            };

            // Initialize all sections
            this.sections.forEach(section => {
                result.sections[section] = [];
            });

            let currentSection = null;
            let isInBMC = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Skip empty lines and comments
                if (!line || line.startsWith('#')) {
                    continue;
                }

                // Check for BMC start
                if (line === 'bmc') {
                    isInBMC = true;
                    continue;
                }

                if (!isInBMC) {
                    continue;
                }

                // Parse title
                if (line.startsWith('title:')) {
                    result.title = line.substring(6).trim();
                    continue;
                }

                // Parse description
                if (line.startsWith('description:')) {
                    result.description = line.substring(12).trim();
                    continue;
                }

                // Parse section headers
                if (line.endsWith(':') && this.sections.includes(line.slice(0, -1))) {
                    currentSection = line.slice(0, -1);
                    continue;
                }

                // Parse section items
                if (currentSection && (line.startsWith('- ') || line.startsWith('* '))) {
                    const item = line.substring(2).trim();
                    if (item) {
                        result.sections[currentSection].push(item);
                    }
                }
            }

            return result;
        } catch (error) {
            throw new Error('Parser error: ' + error.message);
        }
    }

    format(code) {
        try {
            const data = this.parse(code);
            let formatted = 'bmc\n';

            if (data.title) {
                formatted += `title: ${data.title}\n`;
            }

            if (data.description) {
                formatted += `description: ${data.description}\n`;
            }

            formatted += '\n';

            // Format sections in the correct order
            this.sections.forEach(section => {
                if (data.sections[section] && data.sections[section].length > 0) {
                    formatted += `${section}:\n`;
                    data.sections[section].forEach(item => {
                        formatted += `  - ${item}\n`;
                    });
                    formatted += '\n';
                }
            });

            return formatted;
        } catch (error) {
            // If parsing fails, return original code
            return code;
        }
    }

    validate(code) {
        try {
            const data = this.parse(code);
            const errors = [];

            // Check if at least one section has content
            const hasContent = this.sections.some(section => 
                data.sections[section] && data.sections[section].length > 0
            );

            if (!hasContent) {
                errors.push('At least one section must have content');
            }

            // Check for empty sections that should have content
            const criticalSections = ['customer-segments', 'value-propositions'];
            criticalSections.forEach(section => {
                if (!data.sections[section] || data.sections[section].length === 0) {
                    errors.push(`Section '${section}' should have at least one item`);
                }
            });

            return {
                valid: errors.length === 0,
                errors: errors,
                data: data
            };
        } catch (error) {
            return {
                valid: false,
                errors: [error.message],
                data: null
            };
        }
    }

    getSectionDisplayName(section) {
        const names = {
            'customer-segments': 'Segmentos de Clientes',
            'value-propositions': 'Proposições de Valor',
            'channels': 'Canais',
            'customer-relationships': 'Relacionamento com Clientes',
            'revenue-streams': 'Fontes de Receita',
            'key-resources': 'Recursos-Chave',
            'key-activities': 'Atividades-Chave',
            'key-partnerships': 'Parcerias-Chave',
            'cost-structure': 'Estrutura de Custos'
        };
        return names[section] || section;
    }

    getSectionColor(section) {
        const colors = {
            'customer-segments': '#FF6B6B',
            'value-propositions': '#4ECDC4',
            'channels': '#45B7D1',
            'customer-relationships': '#96CEB4',
            'revenue-streams': '#FFEAA7',
            'key-resources': '#DDA0DD',
            'key-activities': '#98D8C8',
            'key-partnerships': '#F7DC6F',
            'cost-structure': '#BB8FCE'
        };
        return colors[section] || '#CCCCCC';
    }

    getTemplate() {
        return `bmc
title: Meu Modelo de Negócio
description: Descrição do modelo de negócio

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
  - Custo 2`;
    }
} 