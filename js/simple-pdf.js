// Canvas to PDF Generator - Implementação REAL de PDF com jsPDF
class CanvasPDFGenerator {
    static async loadJsPDF() {
        // Se já carregou, retorna
        if (window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
            console.log('✅ jsPDF já estava carregado');
            return window.jsPDF || window.jspdf.jsPDF;
        }

        // Lista de CDNs para tentar
        const cdnUrls = [
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
            'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
        ];

        for (const url of cdnUrls) {
            try {
                console.log(`🔄 Tentando carregar jsPDF de: ${url}`);
                await this.loadScript(url);
                
                // Aguardar um pouco para garantir que a biblioteca foi processada
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Verificar várias formas de acesso à biblioteca
                const jsPDF = window.jsPDF || 
                             (window.jspdf && window.jspdf.jsPDF) ||
                             (window.jspdf && window.jspdf.default) ||
                             window.jspdf;
                
                if (jsPDF) {
                    console.log('✅ jsPDF carregado com sucesso!', jsPDF);
                    return jsPDF;
                }
                
                // Aguardar mais um pouco se não encontrou
                console.warn(`⚠️ jsPDF não detectado imediatamente, aguardando...`);
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Tentar novamente
                const jsPDF2 = window.jsPDF || 
                              (window.jspdf && window.jspdf.jsPDF) ||
                              (window.jspdf && window.jspdf.default) ||
                              window.jspdf;
                
                if (jsPDF2) {
                    console.log('✅ jsPDF carregado após aguardar!', jsPDF2);
                    return jsPDF2;
                }
                
                console.warn(`❌ jsPDF não detectado após carregar ${url}`);
            } catch (error) {
                console.warn(`❌ Falha ao carregar de ${url}:`, error);
                continue;
            }
        }

        throw new Error('Não foi possível carregar a biblioteca jsPDF de nenhum CDN');
    }

    static loadScript(url) {
        return new Promise((resolve, reject) => {
            // Verificar se já existe um script com esta URL
            const existingScript = document.querySelector(`script[src="${url}"]`);
            if (existingScript) {
                console.log(`⚠️ Script ${url} já existe, reutilizando`);
                resolve();
                return;
            }

            // Salvar sistema AMD atual para evitar conflitos
            const originalDefine = window.define;
            const originalRequire = window.require;
            
            // Desabilitar AMD temporariamente
            if (window.define && window.define.amd) {
                console.log('🔄 Desabilitando AMD temporariamente...');
                window.define = undefined;
                window.require = undefined;
            }

            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
                console.log(`✅ Script carregado: ${url}`);
                
                // Restaurar sistema AMD
                if (originalDefine) {
                    console.log('🔄 Restaurando AMD...');
                    window.define = originalDefine;
                    window.require = originalRequire;
                }
                
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`❌ Erro ao carregar script: ${url}`, error);
                
                // Restaurar AMD mesmo em caso de erro
                if (originalDefine) {
                    window.define = originalDefine;
                    window.require = originalRequire;
                }
                
                reject(new Error(`Falha ao carregar script: ${url}`));
            };
            
            document.head.appendChild(script);
        });
    }

    static async generatePDF(canvas, filename) {
        try {
            console.log('🔄 Iniciando geração de PDF...');
            
            // Carregar jsPDF
            const jsPDF = await this.loadJsPDF();
            
            // Converter canvas para imagem de alta qualidade
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            // Criar documento PDF em formato A4 landscape
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Dimensões A4 landscape em mm
            const pageWidth = 297;
            const pageHeight = 210;
            const margin = 10;
            
            // Área útil
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2);
            
            // Calcular dimensões mantendo proporção
            const canvasRatio = canvas.width / canvas.height;
            const pageRatio = maxWidth / maxHeight;
            
            let imgWidth, imgHeight;
            
            if (canvasRatio > pageRatio) {
                // Canvas mais largo - ajustar pela largura
                imgWidth = maxWidth;
                imgHeight = maxWidth / canvasRatio;
            } else {
                // Canvas mais alto - ajustar pela altura
                imgHeight = maxHeight;
                imgWidth = maxHeight * canvasRatio;
            }
            
            // Centralizar na página
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;
            
            // Adicionar imagem ao PDF
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            
            // Salvar o PDF
            pdf.save(filename);
            
            console.log('✅ PDF gerado com sucesso!');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao gerar PDF:', error);
            throw error;
        }
    }
    
    // Método de fallback que gera PNG em formato A4
    static async downloadCanvasAsPNG(canvas, filename) {
        // Criar um canvas otimizado para A4
        const pdfCanvas = document.createElement('canvas');
        const ctx = pdfCanvas.getContext('2d');
        
        // Dimensões A4 landscape em pixels (300 DPI)
        const a4Width = 3508;  // 297mm * 300/25.4
        const a4Height = 2480; // 210mm * 300/25.4
        
        pdfCanvas.width = a4Width;
        pdfCanvas.height = a4Height;
        
        // Fundo branco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, a4Width, a4Height);
        
        // Calcular dimensões mantendo proporção
        const canvasRatio = canvas.width / canvas.height;
        const a4Ratio = a4Width / a4Height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (canvasRatio > a4Ratio) {
            // Canvas mais largo - ajustar pela largura
            drawWidth = a4Width * 0.9; // 90% da largura (margem)
            drawHeight = drawWidth / canvasRatio;
        } else {
            // Canvas mais alto - ajustar pela altura
            drawHeight = a4Height * 0.9; // 90% da altura (margem)
            drawWidth = drawHeight * canvasRatio;
        }
        
        // Centralizar
        drawX = (a4Width - drawWidth) / 2;
        drawY = (a4Height - drawHeight) / 2;
        
        // Desenhar canvas original no A4 canvas
        ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);
        
        // Converter para blob e fazer download
        return new Promise((resolve) => {
            pdfCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename.replace('.pdf', '-A4.png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                resolve();
            }, 'image/png', 1.0);
        });
    }
}

// Disponibilizar globalmente
window.CanvasPDFGenerator = CanvasPDFGenerator; 