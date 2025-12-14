# 📋 Gerenciador de Tarefas - Kanban

Sistema de gerenciamento de tarefas com board Kanban, drag-and-drop e sincronização em tempo real.

## 🚀 Deploy no GitHub Pages

**URL:** https://euclideslins.github.io/tasklist/

## 🔥 Configurar Firebase (Necessário para sincronização)

### Passo 1: Criar projeto no Firebase

1. Acesse: https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Nome: `tasklist` (ou qualquer nome)
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

### Passo 2: Criar Realtime Database

1. No menu lateral, clique em **"Realtime Database"**
2. Clique em **"Criar banco de dados"**
3. Localização: **Estados Unidos (us-central1)**
4. Regras de segurança: Escolha **"Modo de teste"** (por enquanto)
5. Clique em **"Ativar"**

### Passo 3: Configurar Regras de Segurança

Na aba "Regras", cole isto:

```json
{
  "rules": {
    "tarefas-app": {
      ".read": true,
      ".write": true
    }
  }
}
```

⚠️ **ATENÇÃO:** Estas regras permitem leitura/escrita pública. Para produção, implemente autenticação!

### Passo 4: Obter Credenciais

1. Clique no ícone de **engrenagem** ⚙️ → **Configurações do projeto**
2. Role até **"Seus apps"**
3. Clique no ícone **</>** (Web)
4. Registre o app: `Gerenciador de Tarefas`
5. Copie as credenciais do `firebaseConfig`

### Passo 5: Adicionar Credenciais no Código

Edite o arquivo `firebase-config.js` e substitua:

```javascript
const firebaseConfig = {
    apiKey: "COLE_SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_ID",
    appId: "SEU_APP_ID"
};
```

### Passo 6: Fazer Deploy

```bash
git add .
git commit -m "Adicionar Firebase para sincronização em tempo real"
git push
```

Aguarde 1-2 minutos e acesse: https://euclideslins.github.io/tasklist/

## ✨ Funcionalidades

- ✅ Board Kanban com 3 colunas (A fazer, Fazendo, Concluído)
- ✅ Drag and Drop entre colunas
- ✅ Modal para criar/editar tarefas
- ✅ CRUD completo de Responsáveis
- ✅ Filtros por responsável e busca por título
- ✅ **Sincronização em tempo real** via Firebase
- ✅ Design responsivo (mobile-friendly)
- ✅ Persistência compartilhada entre todos os usuários

## 🛠️ Tecnologias

- HTML5
- CSS3
- JavaScript Vanilla
- Firebase Realtime Database

## 📱 Como Usar

1. Cadastre responsáveis na aba "Responsáveis"
2. Crie tarefas clicando em "+ Nova Tarefa"
3. Arraste os cards entre as colunas
4. Clique em um card para editar
5. Todos os usuários veem as mesmas informações em tempo real!

---

**Desenvolvido com ❤️ usando apenas JavaScript puro**
