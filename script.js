// ============================================================================
// 1. FUNÇÕES UTILITÁRIAS
// ============================================================================
function getInitials(name) {
    if (typeof name !== "string") return "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase();
}

// ============================================================================
// 2. MODAL DE PERFIL
// ============================================================================
const modalOverlay = document.getElementById('profile-modal');
const closeModalBtn = document.querySelector('.close-btn');
const modalAvatar = document.getElementById('modal-avatar');
const modalName = document.getElementById('modal-name');
const modalRole = document.getElementById('modal-role');
const modalBody = document.getElementById('modal-body');

function openModal(pessoa, cargo) {
    modalAvatar.innerHTML = '';
    modalBody.innerHTML = '';
    modalName.innerText = pessoa.nome || '';
    modalRole.innerText = cargo || '';

    if (pessoa.foto) {
        const img = document.createElement('img');
        img.src = pessoa.foto;
        img.onerror = () => modalAvatar.innerText = getInitials(pessoa.nome);
        modalAvatar.appendChild(img);
    } else {
        modalAvatar.innerText = getInitials(pessoa.nome);
    }

    const campos = [
        ['matricula', 'Matrícula'],
        ['email', 'E-mail'],
        ['telefone', 'Telefone'],
        ['nascimento', 'Nascimento'],
        ['admissao', 'Admissão'],
        ['descricao', 'Descrição']
    ];

    let hasInfo = false;

    campos.forEach(([key, label]) => {
        if (!pessoa[key]) return;
        hasInfo = true;

        const row = document.createElement('div');
        row.className = 'info-row';

        if (key === 'descricao') {
            row.classList.add('info-row-descricao');
            row.innerHTML = `
                <span class="info-label">${label}</span>
                <p class="descricao-text">${String(pessoa[key]).replace(/^<br\s*\/?>/i, '')}</p>
            `;
        } else {
            row.innerHTML = `
                <span class="info-label">${label}</span>
                <span class="info-value">${pessoa[key]}</span>
            `;
        }

        modalBody.appendChild(row);
    });

    if (!hasInfo) {
        modalBody.innerHTML = `<p style="color:#999;font-style:italic;">Nenhuma informação cadastrada.</p>`;
    }

    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

closeModalBtn?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
});

function createCard(pessoa, cargo, index) {
    const card = document.createElement('div');
    card.className = 'card';

    const storageKey = `org_${cargo}_${index}`;

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'avatar';

    if (pessoa.foto) {
        const img = document.createElement('img');
        img.src = pessoa.foto;
        img.onerror = () => avatar.innerText = getInitials(pessoa.nome);
        avatar.appendChild(img);
    } else {
        avatar.innerText = getInitials(pessoa.nome || '');
    }

    // Input de nome
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Preencher nome';
    nameInput.className = 'card-name-input';

    // Valor inicial (localStorage > JSON)
    const savedName = localStorage.getItem(storageKey);
    if (savedName) {
        nameInput.value = savedName;
    } else if (pessoa.nome && pessoa.nome !== 'vaga em aberto') {
        nameInput.value = pessoa.nome.replace(/\s*\((Dia|Noite)\)/i, '');
    }

    // Salvar automaticamente ao digitar
    nameInput.addEventListener('input', () => {
        localStorage.setItem(storageKey, nameInput.value);
    });

    // Cargo
    const roleEl = document.createElement('div');
    roleEl.className = 'role-tag';
    roleEl.innerText = cargo;

    card.appendChild(avatar);
    card.appendChild(nameInput);
    card.appendChild(roleEl);

    // Abrir modal sem conflitar com input
    card.addEventListener('click', (e) => {
        if (e.target.tagName.toLowerCase() === 'input') return;
        openModal(pessoa, cargo);
    });

    return card;
}


// ============================================================================
// 4. RENDERIZAÇÃO DA ÁRVORE PRINCIPAL
// ============================================================================
function createNodeElement(data) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = `node level-${data.nivel}`;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-container';
    if (data.layout === 'vertical') groupDiv.classList.add('vertical-layout');

    // ===== CASO ESPECIAL: OP. MONITORAMENTO =====
    if (data.cargo === 'Op. Monitoramento') {
        const wrapper = document.createElement('div');
        wrapper.className = 'monitoramento-columns';

        const colDia = document.createElement('div');
        colDia.className = 'monitoramento-col';
        colDia.innerHTML = '<h4>Operadores – Dia</h4>';

        const colNoite = document.createElement('div');
        colNoite.className = 'monitoramento-col';
        colNoite.innerHTML = '<h4>Operadores – Noite</h4>';

        data.nomes.forEach(pessoa => {
            const card = createCard(pessoa, data.cargo);
            const turno = (pessoa.turno || '').toLowerCase();

            if (turno === 'noite') colNoite.appendChild(card);
            else colDia.appendChild(card);
        });

        wrapper.appendChild(colDia);
        wrapper.appendChild(colNoite);
        groupDiv.appendChild(wrapper);

    } else if (Array.isArray(data.nomes)) {
        data.nomes.forEach(pessoa => {
            groupDiv.appendChild(createCard(pessoa, data.cargo));
        });
    }

    nodeDiv.appendChild(groupDiv);

    // Filhos
    if (Array.isArray(data.filhos) && data.filhos.length > 0) {
        const children = document.createElement('div');
        children.className = 'children';

        data.filhos.forEach(filho => {
            children.appendChild(createNodeElement(filho));
        });

        nodeDiv.appendChild(children);
    }

    return nodeDiv;
}

// ============================================================================
// 5. APOIO (SEM LINHAS)
// ============================================================================
function renderSupportGroups(grupos) {
    const container = document.getElementById('support-container');
    container.innerHTML = '';

    grupos.forEach(grupo => {
        const wrapper = document.createElement('div');
        wrapper.className = 'support-group';

        grupo.nomes.forEach(pessoa => {
            wrapper.appendChild(createCard(pessoa, grupo.cargo));
        });

        container.appendChild(wrapper);
    });
}

// ============================================================================
// 6. CARREGAMENTO DO JSON
// ============================================================================
const mainContainer = document.getElementById('org-container');

fetch('dados.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
        const arvore = data.principal ?? data;
        mainContainer.innerHTML = '';
        mainContainer.appendChild(createNodeElement(arvore));

        if (data.apoio) renderSupportGroups(data.apoio);
    })
    .catch(err => {
        console.error(err);
        mainContainer.innerHTML = '<p style="color:red;text-align:center;">Erro ao carregar dados.</p>';
    });

// ============================================================================
// 7. SPLASH SCREEN
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash?.classList.add('hidden');
        setTimeout(() => splash?.remove(), 1000);
    }, 3000);
});

// ============================================================================
// 8. ADMIN
// ============================================================================
document.getElementById('btn-admin-access')?.addEventListener('click', () => {
    const senha = prompt('Digite a senha de administrador:');
    if (senha === '123') window.location.href = 'Admin/admin.html';
    else if (senha !== null) alert('Senha incorreta!');
});
