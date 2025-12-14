// app.js - Lógica principal da aplicação

// Estado centralizado
let state = {
    responsaveis: [],
    tarefas: [],
    ui: {
        modalMode: null, // 'create' ou 'edit'
        currentTaskId: null,
        draggedTaskId: null
    }
};

// Controle de edição de responsável
let editingResponsavel = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    state = await loadState();
    initEventListeners();
    renderAll();
    
    // Monitorar mudanças em tempo real (Firebase)
    if (typeof watchStateChanges === 'function') {
        watchStateChanges((newData) => {
            state.responsaveis = newData.responsaveis;
            state.tarefas = newData.tarefas;
            renderAll();
        });
    }
});

function initEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Botão Nova Tarefa
    const btnNovaTarefa = document.getElementById('btn-nova-tarefa');
    if (btnNovaTarefa) {
        btnNovaTarefa.addEventListener('click', (e) => {
            e.preventDefault();
            openTaskModal('create');
        });
    }

    // Modal
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalOverlay = document.querySelector('.modal-overlay');
    const taskModalForm = document.getElementById('task-modal-form');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');
    
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeTaskModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeTaskModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeTaskModal);
    if (taskModalForm) taskModalForm.addEventListener('submit', handleTaskModalSubmit);
    if (modalDeleteBtn) modalDeleteBtn.addEventListener('click', handleTaskDelete);

    // Formulário de Responsáveis
    const responsavelForm = document.getElementById('responsavel-form');
    const responsavelCancelBtn = document.getElementById('responsavel-cancel-btn');
    
    if (responsavelForm) responsavelForm.addEventListener('submit', handleResponsavelSubmit);
    if (responsavelCancelBtn) responsavelCancelBtn.addEventListener('click', cancelResponsavelEdit);

    // Filtros
    const filterResponsavel = document.getElementById('filter-responsavel');
    const filterSearch = document.getElementById('filter-search');
    
    if (filterResponsavel) filterResponsavel.addEventListener('change', applyFilters);
    if (filterSearch) filterSearch.addEventListener('input', applyFilters);
}

// ========== TABS ==========
function switchTab(tabName) {
    // Remove active de todos os botões e conteúdos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Ativa o tab selecionado
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// ========== TOAST ==========
function showToast(type, message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========== RESPONSÁVEIS - CRUD ==========
function handleResponsavelSubmit(e) {
    e.preventDefault();
    
    const nome = document.getElementById('responsavel-nome').value.trim();
    
    if (!nome) {
        showToast('error', 'Nome do responsável é obrigatório');
        return;
    }

    if (editingResponsavel) {
        // Atualizar
        const responsavel = state.responsaveis.find(r => r.id === editingResponsavel);
        if (responsavel) {
            responsavel.nome = nome;
            showToast('success', 'Responsável atualizado com sucesso');
        }
        editingResponsavel = null;
    } else {
        // Criar
        const novoResponsavel = {
            id: Date.now().toString(),
            nome: nome
        };
        state.responsaveis.push(novoResponsavel);
        showToast('success', 'Responsável cadastrado com sucesso');
    }

    saveState(state);
    document.getElementById('responsavel-form').reset();
    cancelResponsavelEdit();
    renderAll();
}

function editResponsavel(id) {
    const responsavel = state.responsaveis.find(r => r.id === id);
    if (!responsavel) return;

    editingResponsavel = id;
    document.getElementById('responsavel-nome').value = responsavel.nome;
    document.getElementById('responsavel-form-title').textContent = 'Editar Responsável';
    document.getElementById('responsavel-submit-btn').textContent = 'Salvar Alterações';
    document.getElementById('responsavel-cancel-btn').style.display = 'inline-flex';
}

function deleteResponsavel(id) {
    // Verificar se há tarefas atribuídas
    const tarefasAtribuidas = state.tarefas.filter(t => t.responsavelId === id);
    
    if (tarefasAtribuidas.length > 0) {
        showToast('error', `Não é possível excluir: existem ${tarefasAtribuidas.length} tarefa(s) atribuída(s) a este responsável`);
        return;
    }

    if (confirm('Deseja realmente excluir este responsável?')) {
        state.responsaveis = state.responsaveis.filter(r => r.id !== id);
        saveState(state);
        showToast('success', 'Responsável excluído com sucesso');
        renderAll();
    }
}

function cancelResponsavelEdit() {
    editingResponsavel = null;
    document.getElementById('responsavel-form-title').textContent = 'Novo Responsável';
    document.getElementById('responsavel-submit-btn').textContent = 'Adicionar Responsável';
    document.getElementById('responsavel-cancel-btn').style.display = 'none';
    document.getElementById('responsavel-form').reset();
}

// ========== MODAL DE TAREFA ==========
function openTaskModal(mode, taskId = null) {
    console.log('openTaskModal chamado:', mode, taskId);
    
    state.ui.modalMode = mode;
    state.ui.currentTaskId = taskId;
    
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('modal-delete-btn');
    const submitBtn = document.getElementById('modal-submit-btn');
    const form = document.getElementById('task-modal-form');
    
    if (!modal || !form) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    // Limpar form e alerta
    form.reset();
    hideModalAlert();
    
    // Verificar se existem responsáveis
    if (state.responsaveis.length === 0) {
        modal.classList.add('show');
        showModalAlert('warning', 'Cadastre um responsável antes de criar uma tarefa.');
        setTimeout(() => {
            closeTaskModal();
            switchTab('responsaveis');
            showToast('warning', 'Cadastre um responsável primeiro');
        }, 2000);
        return;
    }
    
    // Atualizar select de responsáveis no modal
    updateModalResponsaveisSelect();
    
    if (mode === 'create') {
        modalTitle.textContent = 'Nova Tarefa';
        submitBtn.textContent = 'Criar Tarefa';
        deleteBtn.style.display = 'none';
        document.getElementById('modal-status').value = 'A fazer';
    } else if (mode === 'edit' && taskId) {
        const tarefa = state.tarefas.find(t => t.id === taskId);
        if (!tarefa) {
            console.error('Tarefa não encontrada:', taskId);
            return;
        }
        
        modalTitle.textContent = 'Editar Tarefa';
        submitBtn.textContent = 'Salvar Alterações';
        deleteBtn.style.display = 'inline-flex';
        
        document.getElementById('modal-titulo').value = tarefa.titulo || '';
        document.getElementById('modal-descricao').value = tarefa.descricao || '';
        document.getElementById('modal-responsavel').value = tarefa.responsavelId || '';
        document.getElementById('modal-status').value = tarefa.status || 'A fazer';
        document.getElementById('modal-data-inicio').value = tarefa.dataInicio || '';
        document.getElementById('modal-data-prazo').value = tarefa.dataPrazo || '';
    }
    
    console.log('Abrindo modal...');
    modal.classList.add('show');
}

function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.remove('show');
    state.ui.modalMode = null;
    state.ui.currentTaskId = null;
}

function handleTaskModalSubmit(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('modal-titulo').value.trim();
    const descricao = document.getElementById('modal-descricao').value.trim();
    const responsavelId = document.getElementById('modal-responsavel').value;
    const status = document.getElementById('modal-status').value;
    const dataInicio = document.getElementById('modal-data-inicio').value;
    const dataPrazo = document.getElementById('modal-data-prazo').value;
    
    if (!titulo) {
        showModalAlert('error', 'Título é obrigatório');
        return;
    }
    
    if (!responsavelId) {
        showModalAlert('error', 'Selecione um responsável');
        return;
    }
    
    if (!dataPrazo) {
        showModalAlert('error', 'Prazo é obrigatório');
        return;
    }
    
    const now = new Date().toISOString();
    
    if (state.ui.modalMode === 'edit') {
        const tarefa = state.tarefas.find(t => t.id === state.ui.currentTaskId);
        if (tarefa) {
            tarefa.titulo = titulo;
            tarefa.descricao = descricao;
            tarefa.responsavelId = responsavelId;
            tarefa.status = status;
            tarefa.dataInicio = dataInicio;
            tarefa.dataPrazo = dataPrazo;
            tarefa.updatedAt = now;
            showToast('success', 'Tarefa atualizada com sucesso');
        }
    } else {
        const novaTarefa = {
            id: Date.now().toString(),
            titulo,
            descricao,
            responsavelId,
            status,
            dataInicio,
            dataPrazo,
            createdAt: now,
            updatedAt: now
        };
        state.tarefas.push(novaTarefa);
        showToast('success', 'Tarefa criada com sucesso');
    }
    
    saveState(state);
    closeTaskModal();
    renderAll();
}

function handleTaskDelete() {
    if (!state.ui.currentTaskId) return;
    
    if (confirm('Deseja realmente excluir esta tarefa?')) {
        state.tarefas = state.tarefas.filter(t => t.id !== state.ui.currentTaskId);
        saveState(state);
        showToast('success', 'Tarefa excluída com sucesso');
        closeTaskModal();
        renderAll();
    }
}

function showModalAlert(type, message) {
    const alert = document.getElementById('modal-alert');
    alert.textContent = message;
    alert.className = `modal-alert ${type} show`;
}

function hideModalAlert() {
    const alert = document.getElementById('modal-alert');
    alert.className = 'modal-alert';
}

// ========== RENDER ==========
function renderAll() {
    renderSummary();
    renderResponsaveis();
    updateResponsaveisSelects();
    applyFilters();
}

function renderSummary() {
    const total = state.tarefas.length;
    const afazer = state.tarefas.filter(t => t.status === 'A fazer').length;
    const fazendo = state.tarefas.filter(t => t.status === 'Fazendo').length;
    const concluido = state.tarefas.filter(t => t.status === 'Concluido').length;

    document.getElementById('total-tarefas').textContent = total;
    document.getElementById('total-afazer').textContent = afazer;
    document.getElementById('total-fazendo').textContent = fazendo;
    document.getElementById('total-concluido').textContent = concluido;
}

function renderResponsaveis() {
    const container = document.getElementById('responsaveis-list');
    
    if (state.responsaveis.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum responsável cadastrado</div>';
        return;
    }

    container.innerHTML = state.responsaveis.map(r => `
        <div class="responsavel-item">
            <span class="responsavel-name">${escapeHtml(r.nome)}</span>
            <div class="responsavel-actions">
                <button class="btn btn-sm btn-secondary" onclick="editResponsavel('${r.id}')">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteResponsavel('${r.id}')">Excluir</button>
            </div>
        </div>
    `).join('');
}

function updateResponsaveisSelects() {
    const selectFilter = document.getElementById('filter-responsavel');
    const currentValueFilter = selectFilter.value;

    // Atualizar select de filtro
    selectFilter.innerHTML = '<option value="">Todos</option>' +
        state.responsaveis.map(r => 
            `<option value="${r.id}">${escapeHtml(r.nome)}</option>`
        ).join('');
    selectFilter.value = currentValueFilter;
}

function updateModalResponsaveisSelect() {
    const selectModal = document.getElementById('modal-responsavel');
    const currentValue = selectModal.value;
    
    selectModal.innerHTML = '<option value="">Selecione um responsável</option>' +
        state.responsaveis.map(r => 
            `<option value="${r.id}">${escapeHtml(r.nome)}</option>`
        ).join('');
    selectModal.value = currentValue;
}

function renderBoard(tarefas) {
    const statuses = ['A fazer', 'Fazendo', 'Concluido'];
    
    statuses.forEach(status => {
        const tarefasStatus = tarefas.filter(t => t.status === status);
        const columnId = `column-${status.toLowerCase().replace(' ', '')}`;
        const countId = `count-${status.toLowerCase().replace(' ', '')}`;
        const column = document.getElementById(columnId);
        const count = document.getElementById(countId);
        
        if (!column || !count) return;
        
        count.textContent = tarefasStatus.length;
        
        if (tarefasStatus.length === 0) {
            column.innerHTML = '<div class="empty-column">Nenhuma tarefa</div>';
            return;
        }
        
        column.innerHTML = tarefasStatus.map(t => {
            const responsavel = state.responsaveis.find(r => r.id === t.responsavelId);
            return createKanbanCard(t, responsavel);
        }).join('');
        
        // Adicionar event listeners aos cards
        column.querySelectorAll('.kanban-card').forEach(card => {
            setupCardDragAndDrop(card);
            card.addEventListener('click', (e) => {
                // No mobile, só abre modal se clicar no título
                if (window.innerWidth <= 900) {
                    const clickedTitle = e.target.classList.contains('kanban-card-title');
                    if (clickedTitle) {
                        e.stopPropagation();
                        openTaskModal('edit', card.dataset.taskId);
                    }
                } else {
                    // Desktop: abre normalmente
                    e.stopPropagation();
                    openTaskModal('edit', card.dataset.taskId);
                }
            });
        });
    });
    
    // Setup das colunas para drop
    setupColumnDropZones();
}

// ========== KANBAN CARD ==========
function createKanbanCard(tarefa, responsavel) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let atrasado = false;
    let classeAtrasado = '';
    let classePrazo = '';
    
    if (tarefa.dataPrazo) {
        const prazo = new Date(tarefa.dataPrazo + 'T00:00:00');
        if (prazo < hoje && tarefa.status !== 'Concluido') {
            atrasado = true;
            classeAtrasado = ' atrasado';
            classePrazo = ' atrasado';
        }
    }
    
    let datesHTML = '';
    if (tarefa.dataInicio || tarefa.dataPrazo) {
        datesHTML = '<div class="kanban-card-dates">';
        
        if (tarefa.dataInicio) {
            datesHTML += `
                <div class="kanban-card-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Início: ${formatDateBR(tarefa.dataInicio)}
                </div>
            `;
        }
        
        if (tarefa.dataPrazo) {
            const prazoTexto = atrasado ? 'ATRASADO!' : 'Prazo';
            datesHTML += `
                <div class="kanban-card-date prazo${classePrazo}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${prazoTexto}: ${formatDateBR(tarefa.dataPrazo)}
                </div>
            `;
        }
        
        datesHTML += '</div>';
    }
    
    // Prazo visível sempre
    let prazoHTML = '';
    if (tarefa.dataPrazo) {
        const prazoTexto = atrasado ? '⚠️ ATRASADO' : '📅';
        prazoHTML = `
            <div class="kanban-card-prazo${classePrazo}">
                ${prazoTexto} ${formatDateBR(tarefa.dataPrazo)}
            </div>
        `;
    }
    
    // Botões rápidos de ação (visíveis no mobile)
    const statuses = ['A fazer', 'Fazendo', 'Concluido'];
    const botoesStatus = statuses
        .filter(s => s !== tarefa.status)
        .map(s => `<button class="btn-quick" onclick="quickChangeStatus('${tarefa.id}', '${s}'); event.stopPropagation();">${s}</button>`)
        .join('');
    
    const acoesHTML = `
        <div class="kanban-card-actions">
            ${botoesStatus}
            <button class="btn-quick" onclick="openTaskModal('edit', '${tarefa.id}'); event.stopPropagation();">Editar</button>
        </div>
    `;
    
    return `
        <div class="kanban-card${classeAtrasado}" draggable="true" data-task-id="${tarefa.id}">
            <div class="kanban-card-title">${escapeHtml(tarefa.titulo)}</div>
            <div class="kanban-card-responsavel">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                ${responsavel ? escapeHtml(responsavel.nome) : 'Não encontrado'}
            </div>
            ${prazoHTML}
            ${acoesHTML}
        </div>
    `;
}

// ========== MUDANÇA RÁPIDA DE STATUS ==========
function quickChangeStatus(taskId, newStatus) {
    const tarefa = state.tarefas.find(t => t.id === taskId);
    if (!tarefa) return;
    
    tarefa.status = newStatus;
    tarefa.updatedAt = new Date().toISOString();
    saveState(state);
    showToast('success', `Tarefa movida para "${newStatus}"`);
    renderAll();
}

// ========== DRAG AND DROP ==========
function setupCardDragAndDrop(card) {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
    const taskId = e.currentTarget.dataset.taskId;
    state.ui.draggedTaskId = taskId;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    state.ui.draggedTaskId = null;
}

function setupColumnDropZones() {
    const columns = document.querySelectorAll('.kanban-column-content');
    
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
        column.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const column = e.currentTarget.closest('.kanban-column');
    if (!column) {
        console.error('Coluna não encontrada');
        return;
    }
    
    const newStatus = column.dataset.status;
    const taskId = state.ui.draggedTaskId;
    
    console.log('Drop - TaskID:', taskId, 'Novo Status:', newStatus);
    
    if (!taskId) {
        console.error('TaskId não encontrado no estado');
        return;
    }
    
    const tarefa = state.tarefas.find(t => t.id === taskId);
    if (!tarefa) {
        console.error('Tarefa não encontrada:', taskId);
        return;
    }
    
    if (tarefa.status !== newStatus) {
        console.log('Atualizando status de', tarefa.status, 'para', newStatus);
        tarefa.status = newStatus;
        tarefa.updatedAt = new Date().toISOString();
        saveState(state);
        showToast('success', `Tarefa movida para "${newStatus}"`);
        renderAll();
    }
    
    state.ui.draggedTaskId = null;
}

// ========== FILTROS ==========
function applyFilters() {
    const filterResponsavel = document.getElementById('filter-responsavel').value;
    const filterSearch = document.getElementById('filter-search').value.toLowerCase().trim();

    let tarefasFiltradas = state.tarefas;

    if (filterResponsavel) {
        tarefasFiltradas = tarefasFiltradas.filter(t => t.responsavelId === filterResponsavel);
    }

    if (filterSearch) {
        tarefasFiltradas = tarefasFiltradas.filter(t => 
            t.titulo.toLowerCase().includes(filterSearch)
        );
    }

    renderBoard(tarefasFiltradas);
}

// ========== UTILS ==========
function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatDateBR(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
