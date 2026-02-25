// Sistema de autenticação para login.html
class AuthManager {
    constructor() {
        this.apiBaseUrl = '/api'; // Usar proxy do Nginx
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingAuth();
    }

    setupEventListeners() {
        // Botão de alternar entre login e registro
        const switchBtn = document.getElementById('switchAuthMode');
        if (switchBtn) {
            switchBtn.addEventListener('click', () => this.toggleAuthMode());
        }

        // Botão de submit
        const submitBtn = document.getElementById('submitAuth');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => this.handleSubmit(e));
        }

        // Enter nos campos
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSubmit(e);
                }
            });
        });
    }

    checkExistingAuth() {
        const token = localStorage.getItem('bmcgen_auth_token');
        if (token) {
            // Se já está logado, redirecionar para o app
            window.location.href = '/';
        }
    }

    toggleAuthMode() {
        const isLogin = document.getElementById('nameGroup').style.display === 'none';
        
        if (isLogin) {
            // Mudar para registro
            document.getElementById('nameGroup').style.display = 'block';
            document.getElementById('authMessage').textContent = 'Crie sua conta';
            document.getElementById('switchAuthMode').textContent = 'Já tem conta? Faça login';
            document.getElementById('submitAuth').textContent = 'Registrar';
        } else {
            // Mudar para login
            document.getElementById('nameGroup').style.display = 'none';
            document.getElementById('authMessage').textContent = 'Faça login para continuar';
            document.getElementById('switchAuthMode').textContent = 'Não tem conta? Registre-se';
            document.getElementById('submitAuth').textContent = 'Entrar';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const isLogin = document.getElementById('nameGroup').style.display === 'none';
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const name = document.getElementById('authName').value;

        if (!email || !password) {
            this.showError('Preencha todos os campos obrigatórios');
            return;
        }

        if (!isLogin && !name) {
            this.showError('Nome completo é obrigatório');
            return;
        }

        try {
            if (isLogin) {
                await this.login(email, password);
            } else {
                await this.register(name, email, password);
            }
        } catch (error) {
            console.error('Erro na autenticação:', error);
            this.showError('Erro de conexão. Tente novamente.');
        }
    }

    async login(email, password) {
        const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro no login');
        }

        const data = await response.json();
        console.log('Login response:', data);
        
        // Verificar se a resposta tem o formato esperado
        if (!data.data || !data.data.token) {
            throw new Error('Resposta inválida do servidor');
        }
        
        // Salvar token e dados do usuário
        localStorage.setItem('bmcgen_auth_token', data.data.token);
        localStorage.setItem('bmcgen_user', JSON.stringify(data.data.user));
        
        console.log('Token salvo:', data.data.token.substring(0, 50) + '...');
        
        // Redirecionar para o app
        window.location.href = '/';
    }

    async register(name, email, password) {
        const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro no registro');
        }

        const data = await response.json();
        
        // Mostrar mensagem de sucesso
        this.showSuccess('Conta criada! Verifique seu email para ativar a conta.');
        
        // Voltar para o login
        setTimeout(() => {
            this.toggleAuthMode();
        }, 2000);
    }

    showError(message) {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.color = 'green';
            errorDiv.style.display = 'block';
        }
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});
