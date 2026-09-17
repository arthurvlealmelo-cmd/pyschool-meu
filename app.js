const SUPABASE_URL = "https://wqdpanvjvxqdcopbdkxq.supabase.co";
const SUPABASE_KEY = "sb_publishable_I1PrbJxtb3bZsgKNTQ4PbA_mW_T45B5";

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
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita o recarregamento da página
        // Lê nome, e-mail (que agora é o login) e senha do formulário
        const nome = document.getElementById('campo-nome').value;
        const email = document.getElementById('campo-email').value.trim();
        const senha = document.getElementById('campo-senha').value;
        fazerLogin(nome, email, senha);
    });
});

// Função nova: faz o login pelo e-mail conferindo a senha na tabela pyschool_alunos (cadastra o aluno se ainda não existir)
async function fazerLogin(nome, email, senha) {
    // Sem e-mail não há o que verificar
    if (!email) return;

    // Limpa a mensagem de erro de tentativas anteriores
    mostrarMensagemLogin('');

    // Senha vazia não entra nem cadastra
    if (!senha) {
        mostrarMensagemLogin('Digite uma senha');
        return;
    }

    try {
        // Consulta o aluno pelo e-mail para descobrir se ele já tem cadastro
        const url = SUPABASE_URL + "/rest/v1/pyschool_alunos?email=eq." + encodeURIComponent(email) + "&select=nome,senha";
        const response = await fetch(url, {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + SUPABASE_KEY
            }
        });

        // Se o Supabase recusar a consulta, avisa na tela em vez de tratar como aluno novo
        if (!response.ok) {
            console.error('Erro ao consultar pyschool_alunos:', response.status);
            mostrarMensagemLogin('Erro ao verificar o e-mail (código ' + response.status + ')');
            return;
        }

        const dados = await response.json();

        // Nenhuma linha veio: é cadastro, grava nome, e-mail e senha digitados
        if (!Array.isArray(dados) || dados.length === 0) {
            // O nome só é obrigatório na criação do cadastro
            if (!nome) {
                mostrarMensagemLogin('Digite seu nome para criar o cadastro');
                return;
            }

            const respostaCadastro = await fetch(SUPABASE_URL + "/rest/v1/pyschool_alunos", {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: "Bearer " + SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome: nome, email: email, senha: senha })
            });

            if (!respostaCadastro.ok) {
                // 409 significa e-mail duplicado (o índice lower(email) bloqueia variações de maiúsculas/minúsculas)
                if (respostaCadastro.status === 409) {
                    mostrarMensagemLogin('Este e-mail já está cadastrado');
                } else {
                    const detalhe = await respostaCadastro.text();
                    console.error('Erro ao cadastrar aluno:', respostaCadastro.status, detalhe);
                    mostrarMensagemLogin('Erro ao cadastrar o aluno (código ' + respostaCadastro.status + ')');
                }
                return;
            }

            // Guarda o e-mail como identificador do progresso e o nome para exibição
            localStorage.setItem("pyschool_usuario", email);
            localStorage.setItem("pyschool_nome", nome);
            iniciarApp(nome);
        } else if (dados[0].senha !== senha) {
            // Aluno existe e a senha não bate: mostra o erro e não entra
            mostrarMensagemLogin('Senha incorreta');
        } else {
            // Senha conferida: guarda o e-mail como identificador e o nome do banco para exibição
            localStorage.setItem("pyschool_usuario", email);
            localStorage.setItem("pyschool_nome", dados[0].nome);
            iniciarApp(dados[0].nome || email);
        }
    } catch (error) {
        console.error('Erro no login:', error);
        mostrarMensagemLogin('Erro de conexão ao verificar a senha');
    }
}

// Função nova: exibe uma mensagem de erro na tela de login
function mostrarMensagemLogin(texto) {
    let msg = document.getElementById('mensagem-login');
    // Cria o elemento da mensagem na primeira exibição, já que o HTML não tem um campo pronto para isso
    if (!msg) {
        msg = document.createElement('p');
        msg.id = 'mensagem-login';
        msg.style.color = '#c0392b';
        document.getElementById('tela-login').appendChild(msg);
    }
    msg.textContent = texto;
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