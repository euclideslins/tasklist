// storage.js - Módulo para gerenciar dados com Firebase

const USE_FIREBASE = typeof firebase !== 'undefined' && firebase.apps.length > 0;

/**
 * Carrega o estado do Firebase ou localStorage
 * @returns {Promise<Object>} Estado com responsaveis e tarefas
 */
async function loadState() {
    const defaultState = {
        responsaveis: [],
        tarefas: [],
        distribuicaoHistorico: {},
        ui: {
            modalMode: null,
            currentTaskId: null,
            draggedTaskId: null,
            diaSelecionado: new Date().toISOString().split('T')[0]
        }
    };

    if (USE_FIREBASE) {
        try {
            const snapshot = await database.ref('tarefas-app').once('value');
            const data = snapshot.val();
            
            if (data) {
                return {
                    responsaveis: data.responsaveis || [],
                    tarefas: data.tarefas || [],
                    distribuicaoHistorico: data.distribuicaoHistorico || {},
                    ui: defaultState.ui
                };
            }
        } catch (error) {
            console.error('Erro ao carregar do Firebase:', error);
        }
    } else {
        // Fallback para localStorage
        try {
            const data = localStorage.getItem('tarefas-app-state');
            if (data) {
                const parsed = JSON.parse(data);
                return {
                    responsaveis: parsed.responsaveis || [],
                    tarefas: parsed.tarefas || [],
                    distribuicaoHistorico: parsed.distribuicaoHistorico || {},
                    ui: defaultState.ui
                };
            }
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
        }
    }
    
    return defaultState;
}

/**
 * Salva o estado no Firebase ou localStorage
 * @param {Object} state - Estado a ser salvo
 */
function saveState(state) {
    const dataToSave = {
        responsaveis: state.responsaveis,
        tarefas: state.tarefas,
        distribuicaoHistorico: state.distribuicaoHistorico || {}
    };

    if (USE_FIREBASE) {
        database.ref('tarefas-app').set(dataToSave)
            .then(() => {
                console.log('Dados salvos no Firebase');
            })
            .catch((error) => {
                console.error('Erro ao salvar no Firebase:', error);
            });
    } else {
        // Fallback para localStorage
        try {
            localStorage.setItem('tarefas-app-state', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    }
}

/**
 * Monitora mudanças em tempo real no Firebase
 * @param {Function} callback - Função chamada quando houver alterações
 */
function watchStateChanges(callback) {
    if (USE_FIREBASE) {
        database.ref('tarefas-app').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && callback) {
                callback({
                    responsaveis: data.responsaveis || [],
                    tarefas: data.tarefas || [],
                    distribuicaoHistorico: data.distribuicaoHistorico || {}
                });
            }
        });
    }
}
