// BMC Canvas Renderer
class BMCRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.canvasWidth = 1200;
        this.canvasHeight = 800;
        
        // Layout configuration
        this.layout = {
            margin: 30,
            padding: 15,
            headerHeight: 80,
            sectionMinHeight: 120,
            borderRadius: 8,
            fontSize: 11,
            headerFontSize: 18,
            titleFontSize: 14,
            lineHeight: 16,
            sectionTitleSize: 13,
            iconSize: 16
        };
        
        // Color scheme - Professional BMC colors
        this.colors = {
            // Section colors matching professional BMC
            'key-partnerships': '#FF9F43',       // Orange
            'key-activities': '#5F27CD',         // Purple
            'key-resources': '#5F27CD',          // Purple
            'value-propositions': '#0984e3',     // Blue
            'customer-relationships': '#00b894', // Teal
            'channels': '#00cec9',               // Cyan
            'customer-segments': '#e17055',      // Coral
            'cost-structure': '#d63031',         // Red
            'revenue-streams': '#00b894',        // Green
            
            // UI colors
            background: '#f8f9fa',
            text: '#2d3436',
            title: '#2d3436',
            border: '#ddd',
            headerBg: '#ffffff',
            shadow: 'rgba(0, 0, 0, 0.1)'
        };
        
        // Icons for each section (Unicode symbols)
        this.icons = {
            'key-partnerships': '🤝',
            'key-activities': '⚡',
            'key-resources': '🔑',
            'value-propositions': '💎',
            'customer-relationships': '❤️',
            'channels': '📱',
            'customer-segments': '👥',
            'cost-structure': '💰',
            'revenue-streams': '💵'
        };
    }

    updateCanvasSize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Update layout based on canvas size
        const scaleFactor = Math.min(width / 1200, height / 800);
        this.layout.margin = Math.max(20, 30 * scaleFactor);
        this.layout.padding = Math.max(12, 15 * scaleFactor);
        this.layout.fontSize = Math.max(10, 11 * scaleFactor);
        this.layout.headerFontSize = Math.max(14, 18 * scaleFactor);
        this.layout.titleFontSize = Math.max(11, 14 * scaleFactor);
        this.layout.sectionTitleSize = Math.max(10, 13 * scaleFactor);
        this.layout.lineHeight = Math.max(14, 16 * scaleFactor);
        this.layout.iconSize = Math.max(12, 16 * scaleFactor);
    }

    async render(data) {
        try {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Set background with gradient
            this.drawBackground();
            
            // Draw main title and description
            this.drawMainHeader(data);
            
            // Define BMC grid layout (5 columns x 3 rows)
            const gridWidth = this.canvas.width - (this.layout.margin * 2);
            const gridHeight = this.canvas.height - this.layout.headerHeight - (this.layout.margin * 2);
            
            // Calculate section dimensions for proper 3-row layout
            const sectionWidth = (gridWidth - 40) / 5; // 5 columns
            const sectionHeight = (gridHeight - 40) / 3; // 3 rows (corrected!)
            
            // Draw all sections
            this.drawSections(data, sectionWidth, sectionHeight);
            
            console.log('Canvas rendered successfully');
        } catch (error) {
            console.error('Rendering error:', error);
            this.drawError('Error rendering canvas: ' + error.message);
        }
    }

    drawBackground() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawMainHeader(data) {
        const y = this.layout.margin;
        
        // Draw header background
        this.ctx.fillStyle = this.colors.headerBg;
        this.ctx.fillRect(
            this.layout.margin, 
            y, 
            this.canvas.width - (this.layout.margin * 2), 
            this.layout.headerHeight - 10
        );
        
        // Add subtle shadow
        this.ctx.shadowColor = this.colors.shadow;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetY = 2;
        
        // Draw title
        this.ctx.fillStyle = this.colors.title;
        this.ctx.font = `bold ${this.layout.headerFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            data.title || 'Business Model Canvas',
            this.canvas.width / 2,
            y + 35
        );
        
        // Draw description
        if (data.description) {
            this.ctx.fillStyle = '#6c757d';
            this.ctx.font = `${this.layout.titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
            this.ctx.fillText(
                data.description,
                this.canvas.width / 2,
                y + 58
            );
        }
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;
    }

    drawSections(data, sectionWidth, sectionHeight) {
        const startY = this.layout.headerHeight + this.layout.margin;
        const startX = this.layout.margin;
        
        // Define section positions in correct BMC layout (3 rows)
        const sections = [
            // Row 1
            { id: 'key-partnerships', x: 0, y: 0, width: 1, height: 1, title: 'Parcerias-Chave' },
            { id: 'key-activities', x: 1, y: 0, width: 1, height: 1, title: 'Atividades-Chave' },
            { id: 'value-propositions', x: 2, y: 0, width: 1, height: 2, title: 'Proposições de Valor' },
            { id: 'customer-relationships', x: 3, y: 0, width: 1, height: 1, title: 'Relacionamento com Clientes' },
            { id: 'customer-segments', x: 4, y: 0, width: 1, height: 1, title: 'Segmentos de Clientes' },
            
            // Row 2
            { id: 'key-resources', x: 1, y: 1, width: 1, height: 1, title: 'Recursos-Chave' },
            { id: 'channels', x: 3, y: 1, width: 1, height: 1, title: 'Canais' },
            
            // Row 3 - Bottom sections (full width)
            { id: 'cost-structure', x: 0, y: 2, width: 2.5, height: 1, title: 'Estrutura de Custos' },
            { id: 'revenue-streams', x: 2.5, y: 2, width: 2.5, height: 1, title: 'Fontes de Receita' }
        ];
        
        sections.forEach(section => {
            const x = startX + (section.x * (sectionWidth + 10));
            const y = startY + (section.y * (sectionHeight + 10));
            const width = (sectionWidth * section.width) + ((section.width - 1) * 10);
            const height = (sectionHeight * section.height) + ((section.height - 1) * 10);
            
            this.drawSection(
                section.id,
                section.title,
                data.sections[section.id] || [],
                x,
                y,
                width,
                height
            );
        });
    }

    drawSection(sectionId, title, items, x, y, width, height) {
        // Add subtle shadow
        this.ctx.shadowColor = this.colors.shadow;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Draw section background with rounded corners
        this.ctx.fillStyle = this.colors[sectionId] || '#F8F9FA';
        this.drawRoundedRect(x, y, width, height, 8);
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Draw section border
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 1;
        this.drawRoundedRect(x, y, width, height, 8);
        this.ctx.stroke();
        
        // Draw section icon and title
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = `${this.layout.iconSize}px Arial, sans-serif`;
        this.ctx.textAlign = 'left';
        
        const icon = this.icons[sectionId] || '📋';
        this.ctx.fillText(icon, x + this.layout.padding, y + this.layout.padding + this.layout.iconSize);
        
        // Draw section title
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.font = `bold ${this.layout.sectionTitleSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        this.ctx.fillText(
            title, 
            x + this.layout.padding + this.layout.iconSize + 8, 
            y + this.layout.padding + this.layout.sectionTitleSize
        );
        
        // Draw section items
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.font = `${this.layout.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        
        let itemY = y + this.layout.padding + this.layout.sectionTitleSize + 25;
        const maxWidth = width - (this.layout.padding * 2);
        
        items.forEach((item, index) => {
            if (itemY + this.layout.lineHeight > y + height - this.layout.padding) {
                return; // Skip items that don't fit
            }
            
            // Draw modern bullet point
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(x + this.layout.padding + 6, itemY - 2, 3, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw item text with word wrapping
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const lines = this.wrapText(item, maxWidth - 20);
            lines.forEach(line => {
                if (itemY + this.layout.lineHeight > y + height - this.layout.padding) {
                    return;
                }
                this.ctx.fillText(line, x + this.layout.padding + 18, itemY);
                itemY += this.layout.lineHeight;
            });
            
            itemY += 4; // Small gap between items
        });
    }

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        this.ctx.font = `${this.layout.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = this.ctx.measureText(testLine).width;
            
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    drawError(message) {
        this.drawBackground();
        
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = `${this.layout.headerFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Erro ao renderizar',
            this.canvas.width / 2,
            this.canvas.height / 2 - 20
        );
        
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${this.layout.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        this.ctx.fillText(
            message,
            this.canvas.width / 2,
            this.canvas.height / 2 + 20
        );
    }

    // Utility methods for future enhancements
    setZoom(zoom) {
        this.zoom = zoom;
    }

    setOffset(x, y) {
        this.offsetX = x;
        this.offsetY = y;
    }

    exportAsPNG() {
        return this.canvas.toDataURL('image/png');
    }

    exportAsJPEG(quality = 0.8) {
        return this.canvas.toDataURL('image/jpeg', quality);
    }
} 