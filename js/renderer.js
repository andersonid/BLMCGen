// BMC Canvas Renderer
class BMCRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.canvasWidth = 1190;
        this.canvasHeight = 841;
        
        // Layout configuration
        this.layout = {
            margin: 30,
            padding: 12,
            headerHeight: 80,
            sectionMinHeight: 140,
            borderRadius: 8,
            fontSize: 11,
            headerFontSize: 16,
            titleFontSize: 13,
            lineHeight: 16,
            sectionTitleSize: 12
        };
        
        // Color scheme
        this.colors = {
            // Section colors matching the business model canvas
            'key-partnerships': '#FFE066',      // Yellow
            'key-activities': '#B19CD9',        // Purple
            'key-resources': '#B19CD9',         // Purple
            'value-propositions': '#66B3FF',    // Blue
            'customer-relationships': '#66FFB3', // Green
            'channels': '#66FFB3',              // Green
            'customer-segments': '#FF6B6B',     // Red
            'cost-structure': '#FFB366',        // Orange
            'revenue-streams': '#66FFB3',       // Green
            
            // UI colors
            background: '#FFFFFF',
            text: '#2C3E50',
            title: '#1A252F',
            border: '#BDC3C7',
            headerBg: '#F8F9FA'
        };
    }

    updateCanvasSize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Update layout based on canvas size
        const scaleFactor = Math.min(width / 1190, height / 841);
        this.layout.margin = Math.max(20, 30 * scaleFactor);
        this.layout.padding = Math.max(8, 12 * scaleFactor);
        this.layout.fontSize = Math.max(9, 11 * scaleFactor);
        this.layout.headerFontSize = Math.max(12, 16 * scaleFactor);
        this.layout.titleFontSize = Math.max(10, 13 * scaleFactor);
        this.layout.sectionTitleSize = Math.max(9, 12 * scaleFactor);
        this.layout.lineHeight = Math.max(12, 16 * scaleFactor);
    }

    async render(data) {
        try {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Set background
            this.ctx.fillStyle = this.colors.background;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw main title and description
            this.drawMainHeader(data);
            
            // Define BMC grid layout (3x3 main grid)
            const gridWidth = this.canvas.width - (this.layout.margin * 2);
            const gridHeight = this.canvas.height - this.layout.headerHeight - (this.layout.margin * 2);
            
            // Calculate section dimensions
            const sectionWidth = (gridWidth - 40) / 5; // 5 columns
            const sectionHeight = (gridHeight - 20) / 2; // 2 rows
            
            // Draw all sections
            this.drawSections(data, sectionWidth, sectionHeight);
            
            console.log('Canvas rendered successfully');
        } catch (error) {
            console.error('Rendering error:', error);
            this.drawError('Error rendering canvas: ' + error.message);
        }
    }

    drawMainHeader(data) {
        const y = this.layout.margin;
        
        // Draw title
        this.ctx.fillStyle = this.colors.title;
        this.ctx.font = `bold ${this.layout.headerFontSize}px Arial, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            data.title || 'Business Model Canvas',
            this.canvas.width / 2,
            y + 25
        );
        
        // Draw description
        if (data.description) {
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = `${this.layout.titleFontSize}px Arial, sans-serif`;
            this.ctx.fillText(
                data.description,
                this.canvas.width / 2,
                y + 50
            );
        }
        
        // Draw separator line
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.layout.margin, y + 65);
        this.ctx.lineTo(this.canvas.width - this.layout.margin, y + 65);
        this.ctx.stroke();
    }

    drawSections(data, sectionWidth, sectionHeight) {
        const startY = this.layout.headerHeight + this.layout.margin;
        const startX = this.layout.margin;
        
        // Define section positions in BMC layout
        const sections = [
            // Top row
            { id: 'key-partnerships', x: 0, y: 0, width: 1, height: 1, title: 'Parcerias-Chave' },
            { id: 'key-activities', x: 1, y: 0, width: 1, height: 1, title: 'Atividades-Chave' },
            { id: 'value-propositions', x: 2, y: 0, width: 1, height: 2, title: 'Proposições de Valor' },
            { id: 'customer-relationships', x: 3, y: 0, width: 1, height: 1, title: 'Relacionamento com Clientes' },
            { id: 'customer-segments', x: 4, y: 0, width: 1, height: 1, title: 'Segmentos de Clientes' },
            
            // Bottom row  
            { id: 'key-resources', x: 1, y: 1, width: 1, height: 1, title: 'Recursos-Chave' },
            { id: 'channels', x: 3, y: 1, width: 1, height: 1, title: 'Canais' },
            
            // Full width sections
            { id: 'cost-structure', x: 0, y: 2, width: 2.5, height: 0.7, title: 'Estrutura de Custos' },
            { id: 'revenue-streams', x: 2.5, y: 2, width: 2.5, height: 0.7, title: 'Fontes de Receita' }
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
        // Draw section background
        this.ctx.fillStyle = this.colors[sectionId] || '#F8F9FA';
        this.ctx.fillRect(x, y, width, height);
        
        // Draw section border
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw section title
        this.ctx.fillStyle = this.colors.title;
        this.ctx.font = `bold ${this.layout.sectionTitleSize}px Arial, sans-serif`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(title, x + this.layout.padding, y + this.layout.padding + this.layout.sectionTitleSize);
        
        // Draw section items
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${this.layout.fontSize}px Arial, sans-serif`;
        
        let itemY = y + this.layout.padding + this.layout.sectionTitleSize + 15;
        const maxWidth = width - (this.layout.padding * 2);
        
        items.forEach((item, index) => {
            if (itemY + this.layout.lineHeight > y + height - this.layout.padding) {
                return; // Skip items that don't fit
            }
            
            // Draw bullet point
            this.ctx.fillStyle = this.colors.text;
            this.ctx.beginPath();
            this.ctx.arc(x + this.layout.padding + 5, itemY - 3, 2, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw item text with word wrapping
            const lines = this.wrapText(item, maxWidth - 15);
            lines.forEach(line => {
                if (itemY + this.layout.lineHeight > y + height - this.layout.padding) {
                    return;
                }
                this.ctx.fillText(line, x + this.layout.padding + 15, itemY);
                itemY += this.layout.lineHeight;
            });
            
            itemY += 3; // Small gap between items
        });
    }

    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        this.ctx.font = `${this.layout.fontSize}px Arial, sans-serif`;
        
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
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = `${this.layout.headerFontSize}px Arial, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Erro ao renderizar',
            this.canvas.width / 2,
            this.canvas.height / 2 - 20
        );
        
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${this.layout.fontSize}px Arial, sans-serif`;
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