// admin.js - Lógica do Painel Administrativo (Versão Atualizada para Nova Estrutura)

let globalData = null; // Armazena o JSON completo { principal: {}, apoio: [] }
let selectedNode = null; // O nó (grupo/cargo) selecionado
let selectedParent = null; // O pai do nó selecionado (para exclusão de cargos)
let selectedIndex = -1; // Índice da pessoa dentro do array 'nomes'
let selectedContext = null; // 'principal' ou 'apoio' para saber onde estamos mexendo

// Elementos do DOM
const treeView = document.getElementById('tree-view');
const editorPlaceholder = document.getElementById('editor-placeholder');
const editForm = document.getElementById('edit-form');
const btnSaveJson = document.getElementById('btn-save-json');
const btnAddChild = document.getElementById('btn-add-child');
const btnDelete = document.getElementById('btn-delete');

// --- 1. CARREGAR DADOS ---
// Use o link RAW do GitHub para garantir que pegamos a versão online, 
// ou 'dados.json' se estiver rodando local com Live Server.
const DATA_URL = 'https://raw.githubusercontent.com/segurancaeletronicabrasfort/Organograma/refs/heads/main/dados.json';

fetch(DATA_URL)
    .then(r => r.json())
    .then(data => {
        // Proteção: Se o arquivo for antigo (sem 'principal'), cria a estrutura nova na memória
        if (!data.principal) {
            globalData = {
                principal: data, // O que veio é a árvore principal
                apoio: []        // Cria lista de apoio vazia
            };
        } else {
            globalData = data;
        }
        renderTree();
    })
    .catch(err => {
        console.error(err);
        alert("Erro ao carregar dados.json. Verifique o console (F12) para detalhes.");
    });

// --- 2. RENDERIZAR ÁRVORE NA LATERAL ---
function renderTree() {
    treeView.innerHTML = '';

    // A) Seção Principal (Árvore)
    const labelMain = document.createElement('h4');
    labelMain.innerText = "ORGANOGRAMA PRINCIPAL";
    labelMain.style.cssText = "padding: 10px; color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 1px;";
    treeView.appendChild(labelMain);

    const mainUl = document.createElement('ul');
    if (globalData.principal) {
        buildTreeItem(globalData.principal, mainUl, null);
    }
    treeView.appendChild(mainUl);

    // B) Seção de Apoio (Lista Solta)
    if (globalData.apoio && globalData.apoio.length > 0) {
        const labelSupport = document.createElement('h4');
        labelSupport.innerText = "APOIO & APRENDIZADO";
        labelSupport.style.cssText = "padding: 20px 10px 10px; color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 1px; border-top: 1px solid #e2e8f0; margin-top: 10px;";
        treeView.appendChild(labelSupport);

        const supportUl = document.createElement('ul');
        globalData.apoio.forEach((grupo) => {
            // Tratamos cada grupo de apoio como um nó raiz independente
            buildTreeItem(grupo, supportUl, 'APOIO_ROOT');
        });
        treeView.appendChild(supportUl);
    }
}

// Função Recursiva para desenhar os itens
function buildTreeItem(node, container, parent) {
    // 1. Renderiza as pessoas deste cargo
    if (node.nomes && node.nomes.length > 0) {
        node.nomes.forEach((pessoa, index) => {
            const li = document.createElement('li');
            const div = document.createElement('div');
            div.className = 'tree-item';
            
            // Ícone + Nome + Cargo
            let nomeTexto = typeof pessoa === 'object' ? pessoa.nome : pessoa;
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="material-icons-round" style="font-size:16px;">person</span> 
                    <span>${nomeTexto}</span>
                </div>
                <small style="color:#94a3b8; font-size:11px;">${node.cargo}</small>
            `;
            
            // Clique para editar
            div.onclick = () => selectItem(node, index, parent, div);
            
            li.appendChild(div);

            // Se for a Árvore Principal, renderiza os filhos (subordinados)
            // Apenas renderiza os filhos abaixo da PRIMEIRA pessoa do cargo para não duplicar visualmente na árvore
            if (index === 0 && node.filhos && node.filhos.length > 0) {
                const ulChildren = document.createElement('ul');
                node.filhos.forEach(filho => buildTreeItem(filho, ulChildren, node));
                li.appendChild(ulChildren);
            }

            container.appendChild(li);
        });
    } else {
        // Caso raro: Nó sem pessoas (apenas cargo vazio)
        const li = document.createElement('li');
        const div = document.createElement('div');
        div.className = 'tree-item empty';
        div.innerHTML = `<span style="color:red">[Vazio]</span> ${node.cargo}`;
        // Permite selecionar para adicionar alguém
        div.onclick = () => selectItem(node, -1, parent, div);
        li.appendChild(div);
        
        // Renderiza filhos mesmo se estiver vazio
        if (node.filhos && node.filhos.length > 0) {
            const ulChildren = document.createElement('ul');
            node.filhos.forEach(filho => buildTreeItem(filho, ulChildren, node));
            li.appendChild(ulChildren);
        }
        container.appendChild(li);
    }
}

// --- 3. SELECIONAR ITEM ---
function selectItem(node, index, parent, element) {
    // Visual: destaca o item clicado
    document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    // Estado Global
    selectedNode = node;       // Objeto do Cargo
    selectedIndex = index;     // Qual pessoa da lista 'nomes' (-1 se for novo)
    selectedParent = parent;   // Objeto pai (para deletar nó inteiro se precisar)

    // Preenche o formulário
    if (index >= 0) {
        const pessoa = node.nomes[index];
        populateForm(typeof pessoa === 'object' ? pessoa : { nome: pessoa });
        document.getElementById('form-title').innerText = "Editando: " + (pessoa.nome || "Colaborador");
    } else {
        // Nó vazio
        populateForm({});
        document.getElementById('form-title').innerText = "Novo Colaborador em " + node.cargo;
    }

    // Mostra o formulário
    editorPlaceholder.classList.add('hidden');
    editForm.classList.remove('hidden');
}

// --- 4. PREENCHER FORMULÁRIO ---
function populateForm(dados) {
    const f = document.forms['edit-form'];
    
    // Dados Pessoais
    f['nome'].value = dados.nome || '';
    f['cargo_display'].value = selectedNode.cargo || ''; 
    f['foto'].value = dados.foto || '';
    f['email'].value = dados.email || '';
    f['matricula'].value = dados.matricula || '';
    f['telefone'].value = dados.telefone || '';
    f['nascimento'].value = dados.nascimento || '';
    f['admissao'].value = dados.admissao || '';
    
    // Descrições
    f['descricao'].value = dados.descricao || '';
    f['descricaoDetalhada'].value = dados.descricaoDetalhada || '';
}

// --- 5. SALVAR ALTERAÇÕES (MEMÓRIA) ---
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedNode) return;

    const f = document.forms['edit-form'];
    
    // 1. Captura os dados do form
    const novosDados = {
        nome: f['nome'].value,
        foto: f['foto'].value,
        email: f['email'].value,
        matricula: f['matricula'].value,
        telefone: f['telefone'].value,
        nascimento: f['nascimento'].value,
        admissao: f['admissao'].value,
        descricao: f['descricao'].value,
        descricaoDetalhada: f['descricaoDetalhada'].value
    };

    // Remove campos vazios para limpar o JSON
    Object.keys(novosDados).forEach(key => {
        if (!novosDados[key]) delete novosDados[key];
    });

    // 2. Atualiza ou Adiciona
    if (selectedIndex >= 0) {
        // Editando existente
        selectedNode.nomes[selectedIndex] = novosDados;
    } else {
        // Adicionando em nó vazio
        if (!selectedNode.nomes) selectedNode.nomes = [];
        selectedNode.nomes.push(novosDados);
    }
    
    // 3. Atualiza nome do Cargo (afeta todos no nó)
    if(f['cargo_display'].value) {
        selectedNode.cargo = f['cargo_display'].value;
    }

    alert('Salvo na memória! Clique em "Baixar JSON" para gerar o arquivo final.');
    renderTree(); // Reconstrói a árvore para mostrar mudanças
});

// --- 6. ADICIONAR SUBORDINADO ---
btnAddChild.addEventListener('click', () => {
    if (!selectedNode) return;

    // Se estivermos editando um grupo de APOIO, adicionar subordinado não faz sentido hierárquico na árvore visual
    // (a menos que criemos uma lógica para isso), mas vamos permitir criar um novo cargo abaixo.
    
    const nomeNovo = prompt("Nome do novo colaborador:");
    if (!nomeNovo) return;
    
    const cargoNovo = prompt("Cargo do novo setor:");
    if (!cargoNovo) return;

    // Cria novo nó
    const novoNo = {
        cargo: cargoNovo,
        nomes: [{ nome: nomeNovo }],
        // Calcula nível automaticamente (se for árvore principal)
        nivel: (selectedNode.nivel || 1) + 1, 
        filhos: []
    };

    if (!selectedNode.filhos) selectedNode.filhos = [];
    selectedNode.filhos.push(novoNo);
    
    renderTree();
    alert("Subordinado criado! Ele apareceu na árvore à esquerda.");
});

// --- 7. EXCLUIR ---
btnDelete.addEventListener('click', () => {
    if (!selectedNode || selectedIndex === -1) return;
    
    const nome = selectedNode.nomes[selectedIndex].nome || 'este item';

    if (confirm(`Tem certeza que deseja excluir ${nome}?`)) {
        
        // Remove a pessoa da lista
        selectedNode.nomes.splice(selectedIndex, 1);

        // Se a lista de nomes ficou vazia...
        if (selectedNode.nomes.length === 0) {
            // Se tiver filhos, o nó fica "Vazio" mas não some (para não perder os filhos)
            if (selectedNode.filhos && selectedNode.filhos.length > 0) {
                alert("O colaborador foi removido, mas o cargo permanece pois possui subordinados.");
            } else {
                // Se não tem filhos e não tem nomes, podemos remover o nó inteiro
                if (selectedParent && selectedParent !== 'APOIO_ROOT') {
                    // Remove da lista de filhos do pai
                    const indexNoPai = selectedParent.filhos.indexOf(selectedNode);
                    if (indexNoPai > -1) selectedParent.filhos.splice(indexNoPai, 1);
                } else if (selectedParent === 'APOIO_ROOT') {
                    // Se for um grupo de apoio raiz e ficou vazio, removemos da lista de apoio
                    const indexApoio = globalData.apoio.indexOf(selectedNode);
                    if (indexApoio > -1) globalData.apoio.splice(indexApoio, 1);
                }
            }
        }

        renderTree();
        editForm.classList.add('hidden');
        editorPlaceholder.classList.remove('hidden');
    }
});

// --- 8. BAIXAR JSON (EXPORTAR) ---
btnSaveJson.addEventListener('click', () => {
    // Formata o JSON com indentação de 2 espaços para ficar legível
    const dataStr = JSON.stringify(globalData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "dados.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
});
