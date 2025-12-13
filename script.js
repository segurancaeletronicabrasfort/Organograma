// --- UTILITÁRIOS ---
function getInitials(name) {
  if (typeof name !== "string") return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";

  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

// --- LÓGICA DO MODAL ---
const modalOverlay = document.getElementById('profile-modal');
const closeModalBtn = document.querySelector('.close-btn');

const modalAvatar = document.getElementById('modal-avatar');
const modalName = document.getElementById('modal-name');
const modalRole = document.getElementById('modal-role');
const modalBody = document.getElementById('modal-body');

function openModal(pessoaDados, cargoTitulo) {
  modalBody.innerHTML = '';
  modalAvatar.innerHTML = '';

  modalName.innerText = pessoaDados.nome || '';
  const cargoFinal = pessoaDados.cargo || cargoTitulo || '';
  modalRole.innerText = cargoFinal;

  if (pessoaDados.foto) {
    const img = document.createElement('img');
    img.src = pessoaDados.foto;
    img.onerror = () => {
      modalAvatar.innerText = getInitials(pessoaDados.nome);
    };
    modalAvatar.appendChild(img);
  } else {
    modalAvatar.innerText = getInitials(pessoaDados.nome);
  }

  const campos = [
    { key: 'matricula', label: 'Matrícula' },
    { key: 'email', label: 'E-mail' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'nascimento', label: 'Data de Nascimento' },
    { key: 'admissao', label: 'Data de Admissão' },
    { key: 'descricao', label: 'Descrição' }
  ];

  let hasInfo = false;

  campos.forEach(campo => {
    const valor = pessoaDados[campo.key];
    if (!valor) return;

    hasInfo = true;
    const row = document.createElement('div');
    row.className = 'info-row';

    if (campo.key === 'descricao') {
      row.classList.add('info-row-descricao');
      const textoDescricao = String(valor).replace(/^<br\s*\/?>/i, '');
      row.innerHTML = `
        <span class="info-label">${campo.label}</span>
        <p class="info-value descricao-text">${textoDescricao}</p>
      `;
    } else {
      row.innerHTML = `
        <span class="info-label">${campo.label}</span>
        <span class="info-value">${valor}</span>
      `;
    }
    modalBody.appendChild(row);
  });

  if (pessoaDados.descricaoDetalhada) {
    hasInfo = true;
    const wrapper = document.createElement('div');
    wrapper.className = 'descricao-detalhada-wrapper';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-detalhes-descricao';
    btn.textContent = 'Ver descrição detalhada';

    const detailCard = document.createElement('div');
    detailCard.className = 'descricao-detalhada-card hidden';

    const textoLongo = String(pessoaDados.descricaoDetalhada).replace(/^<br\s*\/?>/i, '');
    detailCard.innerHTML = `<p>${textoLongo}</p>`;

    btn.addEventListener('click', () => {
      const isHidden = detailCard.classList.contains('hidden');
      detailCard.classList.toggle('hidden', !isHidden);
      btn.textContent = isHidden
        ? 'Ocultar descrição detalhada'
        : 'Ver descrição detalhada';
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(detailCard);
    modalBody.appendChild(wrapper);
  }

  if (!hasInfo) {
    modalBody.innerHTML = '<p style="color:#999; font-style:italic;">Nenhuma informação adicional cadastrada.</p>';
  }

  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// --- RENDERIZAÇÃO DO ORGANOGRAMA ---
function createNodeElement(data) {
  const nodeDiv = document.createElement('div');
  nodeDiv.className = `node level-${data.nivel}`;

  const groupDiv = document.createElement('div');
  groupDiv.className = 'group-container';
  if (data.layout === "vertical") groupDiv.classList.add("vertical-layout");

  if (data.nomes && data.nomes.length > 0) {
    data.nomes.forEach(pessoa => {
      let dados = (typeof pessoa === 'object') ? pessoa : { nome: pessoa };

      const card = document.createElement('div');
      card.className = 'card';

      const avatarMini = document.createElement('div');
      avatarMini.className = 'avatar';
      if (dados.foto) {
        const img = document.createElement('img');
        img.src = dados.foto;
        avatarMini.appendChild(img);
      } else {
        avatarMini.innerText = getInitials(dados.nome);
      }

      const nameEl = document.createElement('h3');
      nameEl.innerText = dados.nome;

      const roleEl = document.createElement('div');
      roleEl.className = 'role-tag';
      roleEl.innerText = data.cargo;

      card.appendChild(avatarMini);
      card.appendChild(nameEl);
      card.appendChild(roleEl);

      card.addEventListener('click', () => openModal(dados, data.cargo));
      groupDiv.appendChild(card);
    });
  }

  nodeDiv.appendChild(groupDiv);

  if (Array.isArray(data.filhos) && data.filhos.length > 0) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'children';
    if (data.filhos.length === 1) {
      childrenContainer.classList.add('single-child');
    }
    data.filhos.forEach(filho => {
      if (!filho || typeof filho !== "object") return;
      const childEl = createNodeElement(filho);
      if (childEl instanceof Node) {
        childrenContainer.appendChild(childEl);
      }
    });
    nodeDiv.appendChild(childrenContainer);
  }
  return nodeDiv;
}

// --- CARREGAMENTO DOS DADOS (JSON) ---
const container = document.getElementById('org-container');

// Aqui está a mágica: Busca o arquivo dados.json
fetch('https://raw.githubusercontent.com/segurancaeletronicabrasfort/Organograma/refs/heads/main/dados.json')
  .then(response => response.json())
  .then(data => {
    if (container) {
      container.innerHTML = '';
      container.appendChild(createNodeElement(data));
    }
  })
  .catch(error => {
    console.error('Erro ao carregar o JSON:', error);
    if(container) container.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar dados.json</p>';
  });

// --- SPLASH SCREEN ---
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if(splash) {
      splash.classList.add('hidden');
      setTimeout(() => {
        splash.remove();
      }, 1000);
    }
  }, 3000);
});

// --- LÓGICA DE ACESSO ADMINISTRATIVO ---
const btnAdmin = document.getElementById('btn-admin-access');

if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
        // Pede a senha
        const senha = prompt("Digite a senha de administrador para editar:");
        
        // Verifica a senha
        if (senha === "123497") {
            // Se correta, manda para o editor
            window.location.href = "Admin/admin.html";
        } else if (senha !== null) {
            // Se errada (e não clicou em cancelar)
            alert("Senha incorreta! Acesso negado.");
        }
    });
}
