const SUPABASE_URL = "https://wqdpanvjvxqdcopbdkxq.supabase.co";
const SUPABASE_KEY = "sb_publishable_I1PrbJxtb3bZsgKNTQ4PbA_mW_T45B5";

let modoCadastro = false;

// Cache local para guardar as lições carregadas da API e calcular o XP
let licoesCache = [];

// Espera o HTML carregar completamente para executar o script
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se já existe um usuário salvo no localStorage
    const usuarioSalvo = localStorage.getItem("pyschool_usuario");
    if (usuarioSalvo) {
        // Usa o nome salvo no login anterior para exibição; cai para o e-mail se não houver
        iniciarApp(localStorage.getItem("pyschool_nome") || usuarioSalvo);
    }

    // Adiciona o evento de submit no formulário de login
    const formLogin = document.getElementById('form-login');
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita o recarregamento da página
        const nome = document.getElementById('campo-nome').value.trim();
        const email = document.getElementById('campo-email').value.trim();
        const senha = document.getElementById('campo-senha').value;
        mostrarMensagemLogin('');
        if (modoCadastro && !nome) {
            mostrarMensagemLogin('Digite o seu nome');
            return;
        }
        const resultado = await verificarLogin(email, senha, nome);
        if (resultado === 'ok') {
            iniciarApp(email);
        } else if (resultado === 'cadastro-falhou') {
            mostrarMensagemLogin('Não foi possível criar a conta. Esse e-mail já pode ter conta.');
        } else {
            mostrarMensagemLogin('E-mail ou senha incorretos');
        }
    });
});

// Chama uma função do banco e trata falhas da requisição.
async function chamarRpc(nomeFuncao, corpo) {
    try {
        const response = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + nomeFuncao, {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(corpo)
        });
        if (!response.ok) {
            console.error('Erro ao chamar RPC:', nomeFuncao, response.status);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao chamar RPC:', nomeFuncao, error);
        return null;
    }
}

// Confere a senha no banco e salva o e-mail retornado.
async function verificarLogin(email, senha, nome) {
    if (modoCadastro) {
        const cadastro = await chamarRpc('pyschool_cadastrar', {
            p_nome: nome,
            p_email: email,
            p_senha: senha
        });
        if (cadastro !== true) return 'cadastro-falhou';
    }
    const linhas = await chamarRpc('pyschool_entrar', {
        p_email: email,
        p_senha: senha
    });
    if (!Array.isArray(linhas) || linhas.length === 0) {
        return modoCadastro ? 'cadastro-falhou' : 'senha-incorreta';
    }
    localStorage.setItem("pyschool_usuario", linhas[0].email);
    return 'ok';
}

// Alterna a tela entre entrar e criar conta.
function alternarCadastro() {
    modoCadastro = !modoCadastro;
    document.getElementById('campo-nome').style.display = modoCadastro ? 'block' : 'none';
    document.getElementById('botao-entrar').textContent = modoCadastro ? 'Criar conta' : 'Entrar no PySchool';
    document.getElementById('link-cadastro').textContent = modoCadastro ? 'Já tenho conta. Quero entrar' : 'Primeira vez? Crie sua conta';
    mostrarMensagemLogin('');
}

// Exibe a mensagem no parágrafo existente na tela de login.
function mostrarMensagemLogin(texto) {
    document.getElementById('msg-login').textContent = texto;
}

// Função para iniciar o app após o login
function iniciarApp(nome) {
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('nome-usuario').textContent = nome;
    document.getElementById('perfil-nome').textContent = nome;
    
    // Inicia na tela inicial e carrega os dados
    mostrarTela('inicio');
    carregarLicoes();
    atualizarProgresso();
}

// Função para sair do app (logout)
function sair() {
    localStorage.removeItem("pyschool_usuario");
    localStorage.removeItem("pyschool_nome"); // Limpa também o nome de exibição salvo no login
    document.getElementById('app').style.display = 'none';
    document.getElementById('tela-login').style.display = 'flex';
    document.getElementById('form-login').reset();
    if (modoCadastro) alternarCadastro();
}

// Função para alternar entre as telas (seções) do app
function mostrarTela(nome) {
    // Esconde todas as seções
    document.getElementById('tela-inicio').style.display = 'none';
    document.getElementById('tela-progresso').style.display = 'none';
    document.getElementById('tela-perfil').style.display = 'none';
    
    // Mostra apenas a seção solicitada
    document.getElementById('tela-' + nome).style.display = 'block';
}

// Busca o progresso no Supabase e devolve a lista de IDs concluídos
async function carregarProgresso() {
    const nome = localStorage.getItem("pyschool_usuario");
    if (!nome) return [];
    try {
        // Monta a URL com o filtro do aluno e selecionando apenas o licao_id
        const url = SUPABASE_URL + "/rest/v1/pyschool_progresso?aluno=eq." + encodeURIComponent(nome) + "&select=licao_id";
        const response = await fetch(url, {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + SUPABASE_KEY
            }
        });
        const dados = await response.json();
        // Mapeia o resultado para extrair apenas os IDs em uma lista
        return dados.map(item => item.licao_id);
    } catch (error) {
        console.error('Erro ao carregar progresso:', error);
        return [];
    }
}

// Busca as lições na API e monta os cards na tela inicial
async function carregarLicoes() {
    try {
        const response = await fetch('/api/licoes');
        const licoes = await response.json();
        licoesCache = licoes; // Salva no cache para uso no cálculo do XP
        
        // Busca as lições já concluídas para marcar na tela
        const idsConcluidos = await carregarProgresso();
        
        const container = document.getElementById('lista-licoes');
        container.innerHTML = ''; // Limpa a lista antes de renderizar

        licoes.forEach(licao => {
            const concluida = idsConcluidos.includes(licao.id);
            // Cria o elemento do card
            const card = document.createElement('div');
            // Adiciona a classe 'concluida' se a lição já tiver sido feita
            card.className = 'card' + (concluida ? ' concluida' : '');

            // Troca o selo de concluída pelo botão Desfazer; lição não concluída mantém o botão Concluir
            const botaoAcao = concluida
                ? `<button onclick="desconcluirLicao(${licao.id})">Desfazer</button>`
                : `<button onclick="concluirLicao(${licao.id})">Concluir</button>`;

            // Monta o HTML interno do card
            card.innerHTML = `
                <div>
                    <h3 class="titulo-licao">${licao.titulo}</h3>
                    <p>${licao.descricao}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="badge">${licao.xp} XP</span>
                    ${botaoAcao}
                </div>
            `;
            container.appendChild(card);
        });
        
        // Atualiza a interface de progresso depois de montar as lições
        atualizarProgresso();
    } catch (error) {
        console.error('Erro ao carregar lições:', error);
    }
}

// Envia requisição para o Supabase para concluir uma lição específica
async function concluirLicao(id) {
    const nome = localStorage.getItem("pyschool_usuario");
    if (!nome) return;
    try {
        await fetch(SUPABASE_URL + "/rest/v1/pyschool_progresso", {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=ignore-duplicates' // Evita erro de duplicidade no banco
            },
            body: JSON.stringify({ aluno: nome, licao_id: id })
        });
        // Recarrega a tela para refletir a mudança
        carregarLicoes();
        atualizarProgresso();
    } catch (error) {
        console.error('Erro ao concluir lição:', error);
    }
}

// Função nova: desfaz a conclusão de uma lição removendo o registro do aluno no Supabase
async function desconcluirLicao(id) {
    const nome = localStorage.getItem("pyschool_usuario");
    if (!nome) return;
    try {
        // Requisição DELETE filtrando pelo aluno e pelo id da lição
        const response = await fetch(SUPABASE_URL + "/rest/v1/pyschool_progresso?aluno=eq." + encodeURIComponent(nome) + "&licao_id=eq." + id, {
            method: 'DELETE',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + SUPABASE_KEY,
                // Pede ao Supabase para devolver as linhas removidas, permitindo confirmar a exclusão
                'Prefer': 'return=representation'
            }
        });

        // Se o Supabase recusar a operação (ex: 401/403), mostra o motivo em vez de falhar em silêncio
        if (!response.ok) {
            const detalhe = await response.text();
            console.error('Supabase recusou o DELETE:', response.status, detalhe);
            alert('Não foi possível desfazer a lição (erro ' + response.status + '). Veja o console para detalhes.');
            return;
        }

        // Confere quantas linhas realmente foram removidas
        const removidas = await response.json().catch(() => []);
        // Se nenhuma linha saiu, o banco bloqueou a exclusão — normalmente falta a política de DELETE no RLS
        if (!Array.isArray(removidas) || removidas.length === 0) {
            console.error('Nenhuma linha foi removida: verifique se a tabela pyschool_progresso tem política de DELETE no RLS.');
            alert('O banco não permitiu remover o registro. Verifique a política de DELETE (RLS) da tabela pyschool_progresso.');
            return;
        }

        // Recarrega a tela para refletir a mudança, igual concluirLicao faz
        carregarLicoes();
        atualizarProgresso();
    } catch (error) {
        console.error('Erro ao desfazer conclusão da lição:', error);
    }
}

// Atualiza a interface com o progresso do aluno
async function atualizarProgresso() {
    try {
        // Busca os IDs das lições concluídas
        const idsConcluidos = await carregarProgresso();
        
        let xpTotal = 0;
        let totalConcluidas = 0;
        const totalLicoes = licoesCache.length;

        // Soma o XP das lições cujo ID está na lista de concluídos
        licoesCache.forEach(licao => {
            if (idsConcluidos.includes(licao.id)) {
                xpTotal += licao.xp;
                totalConcluidas++;
            }
        });

        // Atualiza os textos de XP e contadores
        document.getElementById('xp-total').textContent = xpTotal;
        document.getElementById('perfil-xp').textContent = xpTotal;
        document.getElementById('contador-licoes').textContent = `${totalConcluidas} de ${totalLicoes}`;

        // Calcula a porcentagem para a barra de progresso
        const porcentagem = totalLicoes > 0 ? (totalConcluidas / totalLicoes) * 100 : 0;
        document.getElementById('barra-progresso').style.width = `${porcentagem}%`;
    } catch (error) {
        console.error('Erro ao atualizar progresso:', error);
    }
}