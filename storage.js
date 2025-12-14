// storage.js - Módulo para gerenciar localStorage

const STORAGE_KEY = 'tarefas-app-state';

/**
 * Carrega o estado do localStorage
 * @returns {Object} Estado com responsaveis e tarefas
 */
function loadState() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Garantir que a estrutura ui existe
            return {
                responsaveis: parsed.responsaveis || [],
                tarefas: parsed.tarefas || [],
                ui: {
                    modalMode: null,
                    currentTaskId: null,
                    draggedTaskId: null
                }
            };
        }
    } catch (error) {
        console.error('Erro ao carregar estado:', error);
    }
    
    return {
        responsaveis: [],
        tarefas: [],
        ui: {
            modalMode: null,
            currentTaskId: null,
            draggedTaskId: null
        }
    };
}

/**
 * Salva o estado no localStorage
 * @param {Object} state - Estado a ser salvo
 */
function saveState(state) {
    try {
        // Salvar apenas dados persistentes, não o estado da UI
        const dataToSave = {
            responsaveis: state.responsaveis,
            tarefas: state.tarefas
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error('Erro ao salvar estado:', error);
    }
}
