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
            padding: 20,
            headerHeight: 80,
            sectionMinHeight: 120,
            borderRadius: 8,
            fontSize: 12,
            headerFontSize: 18,
            titleFontSize: 14,
            lineHeight: 18,
            sectionTitleSize: 12, // Reduced to fit long titles
            iconSize: 16
        };
        
        // Color scheme - Soft and transparent professional colors
        this.colors = {
            // Section colors with transparency - soft pastels
            'key-partnerships': 'rgba(255, 159, 67, 0.6)',       // Soft orange
            'key-activities': 'rgba(116, 102, 204, 0.6)',        // Soft purple
            'key-resources': 'rgba(106, 176, 139, 0.6)',         // Soft green
            'value-propositions': 'rgba(255, 206, 84, 0.6)',     // Soft yellow
            'customer-relationships': 'rgba(129, 207, 224, 0.6)', // Soft cyan
            'channels': 'rgba(255, 195, 160, 0.6)',              // Soft peach
            'customer-segments': 'rgba(161, 196, 253, 0.6)',     // Soft blue
            'cost-structure': 'rgba(129, 207, 224, 0.6)',        // Soft cyan
            'revenue-streams': 'rgba(255, 154, 162, 0.6)',       // Soft pink
            
            // UI colors
            background: '#ffffff',
            text: '#2c3e50',
            title: '#2c3e50',
            sectionTitle: '#34495e',
            border: 'rgba(52, 73, 94, 0.2)',
            headerBg: 'rgba(255, 255, 255, 0.95)',
            shadow: 'rgba(0, 0, 0, 0.08)'
        };
        
        // Icons for each section (more subtle)
        this.icons = {
            'key-partnerships': '🤝',
            'key-activities': '⚡',
            'key-resources': '🔑',
            'value-propositions': '💡',
            'customer-relationships': '❤️',
            'channels': '📱',
            'customer-segments': '👥',
            'cost-structure': '💰',
            'revenue-streams': '💰'
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
        this.layout.padding = Math.max(15, 20 * scaleFactor);
        this.layout.fontSize = Math.max(10, 12 * scaleFactor);
        this.layout.headerFontSize = Math.max(14, 18 * scaleFactor);
        this.layout.titleFontSize = Math.max(11, 14 * scaleFactor);
        this.layout.sectionTitleSize = Math.max(10, 12 * scaleFactor); // Reduced scaling
        this.layout.lineHeight = Math.max(16, 18 * scaleFactor);
        this.layout.iconSize = Math.max(12, 16 * scaleFactor);
    }

    async render(data) {
        try {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Set clean background
            this.drawBackground();
            
            // Draw main title and description
            this.drawMainHeader(data);
            
            // Define BMC grid layout (5 columns x 3 rows) - exact methodology
            const gridWidth = this.canvas.width - (this.layout.margin * 2);
            const gridHeight = this.canvas.height - this.layout.headerHeight - (this.layout.margin * 2);
            
            // Calculate section dimensions without gaps (following BMC standard)
            const sectionWidth = gridWidth / 5; // 5 columns, no gaps
            const sectionHeight = gridHeight / 3; // 3 rows, no gaps
            
            // Draw all sections
            this.drawSections(data, sectionWidth, sectionHeight);
            
            console.log('Canvas rendered successfully');
        } catch (error) {
            console.error('Rendering error:', error);
            this.drawError('Error rendering canvas: ' + error.message);
        }
    }

    drawBackground() {
        // Clean white background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawMainHeader(data) {
        const y = this.layout.margin;
        
        // Draw header background with subtle transparency
        this.ctx.fillStyle = this.colors.headerBg;
        this.ctx.fillRect(
            this.layout.margin, 
            y, 
            this.canvas.width - (this.layout.margin * 2), 
            this.layout.headerHeight - 10
        );
        
        // Draw title with better typography
        this.ctx.fillStyle = this.colors.title;
        this.ctx.font = `600 ${this.layout.headerFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            data.title || i18n.t('business-model-canvas'),
            this.canvas.width / 2,
            y + 35
        );
        
        // Draw description with lighter color
        if (data.description) {
            this.ctx.fillStyle = '#7f8c8d';
            this.ctx.font = `400 ${this.layout.titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
            this.ctx.fillText(
                data.description,
                this.canvas.width / 2,
                y + 58
            );
        }
    }

    drawSections(data, sectionWidth, sectionHeight) {
        const startY = this.layout.headerHeight + this.layout.margin;
        const startX = this.layout.margin;
        
        // Define section positions following exact BMC methodology (no gaps)
        const sections = [
            // Row 1 (Top)
            { id: 'key-partnerships', x: 0, y: 0, width: 1, height: 2 },
            { id: 'key-activities', x: 1, y: 0, width: 1, height: 1 },
            { id: 'value-propositions', x: 2, y: 0, width: 1, height: 2 },
            { id: 'customer-relationships', x: 3, y: 0, width: 1, height: 1 },
            { id: 'customer-segments', x: 4, y: 0, width: 1, height: 2 },
            
            // Row 2 (Middle)
            { id: 'key-resources', x: 1, y: 1, width: 1, height: 1 },
            { id: 'channels', x: 3, y: 1, width: 1, height: 1 },
            
            // Row 3 (Bottom) - Full width sections
            { id: 'cost-structure', x: 0, y: 2, width: 2.5, height: 1 },
            { id: 'revenue-streams', x: 2.5, y: 2, width: 2.5, height: 1 }
        ];
        
        sections.forEach(section => {
            const x = startX + (section.x * sectionWidth);
            const y = startY + (section.y * sectionHeight);
            const width = (sectionWidth * section.width);
            const height = (sectionHeight * section.height);
            
            this.drawSection(
                section.id,
                i18n.t(section.id),
                data.sections[section.id] || [],
                x,
                y,
                width,
                height
            );
        });
    }

    drawSection(sectionId, title, items, x, y, width, height) {
        // Draw section background with transparency
        this.ctx.fillStyle = this.colors[sectionId] || 'rgba(248, 249, 250, 0.6)';
        this.ctx.fillRect(x, y, width, height);
        
        // Draw subtle section border
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw section icon before title
        const icon = this.icons[sectionId];
        if (icon) {
            this.ctx.fillStyle = this.colors.sectionTitle;
            this.ctx.font = `${this.layout.iconSize}px Arial, sans-serif`;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                icon, 
                x + this.layout.padding, 
                y + this.layout.padding + (this.layout.sectionTitleSize / 2)
            );
        }
        
        // Draw section title (more elegant and larger) - positioned after icon
        this.ctx.fillStyle = this.colors.sectionTitle;
        this.ctx.font = `700 ${this.layout.sectionTitleSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
        
        // Calculate available width for title
        const titleStartX = x + this.layout.padding + (icon ? this.layout.iconSize + 8 : 0);
        const titleMaxWidth = width - this.layout.padding - (icon ? this.layout.iconSize + 8 : 0) - this.layout.padding;
        
        // Check if title fits in one line
        const titleWidth = this.ctx.measureText(title).width;
        if (titleWidth <= titleMaxWidth) {
            // Title fits in one line
            this.ctx.fillText(
                title, 
                titleStartX, 
                y + this.layout.padding + this.layout.sectionTitleSize
            );
        } else {
            // Title needs to be broken into multiple lines
            const titleLines = this.wrapTitle(title, titleMaxWidth);
            titleLines.forEach((line, index) => {
                this.ctx.fillText(
                    line, 
                    titleStartX, 
                    y + this.layout.padding + this.layout.sectionTitleSize + (index * (this.layout.sectionTitleSize + 2))
                );
            });
        }
        
        // Calculate title height for proper spacing
        const titleLines = titleWidth <= titleMaxWidth ? 1 : this.wrapTitle(title, titleMaxWidth).length;
        const titleHeight = titleLines * (this.layout.sectionTitleSize + 2) - 2; // Remove extra spacing from last line
        
        // Draw placeholder text if no items
        if (items.length === 0) {
            this.ctx.fillStyle = 'rgba(149, 165, 166, 0.7)';
            this.ctx.font = `400 ${this.layout.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
            this.ctx.fillText(
                i18n.t('write-here'), 
                x + this.layout.padding, 
                y + this.layout.padding + titleHeight + 25
            );
        }
        
        // Draw section items with better typography
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `400 ${this.layout.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        
        let itemY = y + this.layout.padding + titleHeight + 25;
        const maxWidth = width - (this.layout.padding * 2);
        
        items.forEach((item, index) => {
            if (itemY + this.layout.lineHeight > y + height - this.layout.padding) {
                return; // Skip items that don't fit
            }
            
            // Draw subtle bullet point
            this.ctx.fillStyle = this.colors.sectionTitle;
            this.ctx.beginPath();
            this.ctx.arc(x + this.layout.padding + 6, itemY - 4, 1.5, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw item text with word wrapping
            this.ctx.fillStyle = this.colors.text;
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
        
        this.ctx.font = `400 ${this.layout.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        
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

    wrapTitle(title, maxWidth) {
        const words = title.split(' ');
        const lines = [];
        let currentLine = '';
        
        // Use title font for measurement
        this.ctx.font = `700 ${this.layout.sectionTitleSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        
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
        this.ctx.font = `600 ${this.layout.headerFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Erro ao renderizar',
            this.canvas.width / 2,
            this.canvas.height / 2 - 20
        );
        
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `400 ${this.layout.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
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