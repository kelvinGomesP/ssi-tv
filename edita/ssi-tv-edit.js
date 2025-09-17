// Variáveis globais
let contentItems = [];
let dragItem = null;
let editingItemId = null; // Guarda o ID do item que estamos editando

// Carregar dados salvos ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    setupTabNavigation();
    setupDateTime();
    updatePreview();
    document.getElementById('image-upload').addEventListener('change', handleImageUpload);
});

// Configurar data e hora
function setupDateTime() {
    function updateDateTime() {
        const now = new Date();
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        document.getElementById('datetime').textContent = now.toLocaleDateString('pt-BR', options);
    }
    setInterval(updateDateTime, 1000);
    updateDateTime();
}

// Configurar navegação por abas
function setupTabNavigation() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            openTab(this.getAttribute('data-tab'));
        });
    });
}

// FUNÇÃO CORRIGIDA
function openViewPage() {
    saveContent();
    if (contentItems.length === 0) {
        showNotification('Adicione conteúdo antes de abrir a visualização!', 'error');
        return;
    }
    // CORREÇÃO: Adicionado ../ para voltar uma pasta antes de entrar na pasta view
    const viewPage = window.open('../view/ssi-tv-view.html', '_blank');
    if (viewPage) viewPage.focus();
    else showNotification('Permita pop-ups para abrir a visualização!', 'error');
}

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-tab') === tabId);
    });
    if (tabId === 'preview-tab') {
        updatePreview();
    }
}

// Lógica de Adicionar/Salvar Notícia
function addNews() {
    const title = document.getElementById('news-title').value.trim();
    if (!title) {
        showNotification('Por favor, informe o título da notícia.', 'error');
        return;
    }

    const newsData = {
        type: 'news',
        title: title,
        description: document.getElementById('news-description').value.trim(),
        imageUrl: document.getElementById('news-image').value.trim(),
        displayTime: parseInt(document.getElementById('display-time').value) || 15,
        startDate: document.getElementById('news-start-date').value,
        endDate: document.getElementById('news-end-date').value
    };

    if (editingItemId !== null) {
        const index = contentItems.findIndex(item => item.id === editingItemId);
        if (index > -1) {
            contentItems[index] = { ...contentItems[index], ...newsData };
            showNotification('Notícia atualizada com sucesso!');
        }
        cancelEdit();
    } else {
        newsData.id = Date.now();
        contentItems.push(newsData);
        showNotification('Notícia adicionada com sucesso!');
    }
    
    saveContent();
    clearNewsForm();
}

// Lógica de Adicionar/Salvar Dashboard
function addDashboard() {
    const url = document.getElementById('dashboard-url').value.trim();
    if (!url) {
        showNotification('Por favor, informe a URL do dashboard.', 'error');
        return;
    }
    
    const dashboardData = {
        type: 'dashboard',
        url: url,
        title: document.getElementById('dashboard-title').value.trim() || 'Dashboard',
        displayTime: parseInt(document.getElementById('dashboard-time').value) || 30,
        startDate: document.getElementById('dashboard-start-date').value,
        endDate: document.getElementById('dashboard-end-date').value
    };

    if (editingItemId !== null) {
        const index = contentItems.findIndex(item => item.id === editingItemId);
        if (index > -1) {
            contentItems[index] = { ...contentItems[index], ...dashboardData };
            showNotification('Dashboard atualizado com sucesso!');
        }
        cancelEdit();
    } else {
        dashboardData.id = Date.now();
        contentItems.push(dashboardData);
        showNotification('Dashboard adicionado com sucesso!');
    }

    saveContent();
    clearDashboardForm();
}

// Função para entrar no modo de edição
function editItem(id) {
    const item = contentItems.find(item => item.id === id);
    if (!item) return;

    editingItemId = id;

    if (item.type === 'news') {
        document.getElementById('news-title').value = item.title;
        document.getElementById('news-description').value = item.description;
        document.getElementById('news-image').value = item.imageUrl;
        document.getElementById('display-time').value = item.displayTime;
        document.getElementById('news-start-date').value = item.startDate || '';
        document.getElementById('news-end-date').value = item.endDate || '';
        
        const btn = document.getElementById('btn-add-news');
        btn.textContent = 'Salvar Alterações';
        btn.onclick = addNews;
    } else if (item.type === 'dashboard') {
        document.getElementById('dashboard-url').value = item.url;
        document.getElementById('dashboard-title').value = item.title;
        document.getElementById('dashboard-time').value = item.displayTime;
        document.getElementById('dashboard-start-date').value = item.startDate || '';
        document.getElementById('dashboard-end-date').value = item.endDate || '';

        const btn = document.getElementById('btn-add-dashboard');
        btn.textContent = 'Salvar Alterações';
        btn.onclick = addDashboard;
    }

    const clearBtnId = item.type === 'news' ? 'btn-clear-news' : 'btn-clear-dashboard';
    document.getElementById(clearBtnId).textContent = "Cancelar Edição";
    document.getElementById(clearBtnId).onclick = cancelEdit;

    openTab('edit-tab');
}

// Função para cancelar o modo de edição
function cancelEdit() {
    editingItemId = null;
    clearNewsForm();
    clearDashboardForm();

    document.getElementById('btn-add-news').textContent = 'Adicionar Notícia';
    const clearNewsBtn = document.getElementById('btn-clear-news');
    clearNewsBtn.textContent = 'Limpar Campos';
    clearNewsBtn.onclick = clearNewsForm;

    document.getElementById('btn-add-dashboard').textContent = 'Adicionar Dashboard';
    const clearDashBtn = document.getElementById('btn-clear-dashboard');
    clearDashBtn.textContent = 'Limpar Campos';
    clearDashBtn.onclick = clearDashboardForm;
}

function clearNewsForm() {
    document.getElementById('news-title').value = '';
    document.getElementById('news-description').value = '';
    document.getElementById('news-image').value = '';
    document.getElementById('display-time').value = '15';
    document.getElementById('news-start-date').value = '';
    document.getElementById('news-end-date').value = '';
    document.getElementById('image-upload').value = '';
}

function clearDashboardForm() {
    document.getElementById('dashboard-url').value = '';
    document.getElementById('dashboard-title').value = '';
    document.getElementById('dashboard-time').value = '30';
    document.getElementById('dashboard-start-date').value = '';
    document.getElementById('dashboard-end-date').value = '';
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('news-image').value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function updatePreview() {
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = '';
    
    if (contentItems.length === 0) {
        itemsList.innerHTML = '<div class="empty-state">Nenhum conteúdo adicionado ainda.</div>';
        return;
    }
    
    contentItems.forEach((item) => {
        const itemElement = document.createElement('div');
        itemElement.className = `preview-item ${item.type}-item`;
        itemElement.draggable = true;
        itemElement.dataset.id = item.id;

        let scheduleInfo = '';
        if (item.startDate || item.endDate) {
            const start = item.startDate ? new Date(item.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sempre';
            const end = item.endDate ? new Date(item.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sempre';
            scheduleInfo = `<br><span style="color: #007bff; font-size: 0.9em;">📅 Agendado: ${start} até ${end}</span>`;
        }

        itemElement.innerHTML = `
            <div class="preview-content">
                <div class="preview-title">${item.title}</div>
                <div class="preview-details">${item.type === 'news' ? 'Notícia' : 'Dashboard'} - ${item.displayTime} segundos ${scheduleInfo}</div>
            </div>
            <div class="preview-actions">
                <button onclick="editItem(${item.id})" class="secondary-btn" style="background-color: #ffc107; color: black;">Editar</button>
                <button onclick="deleteItem(${item.id})" class="delete-btn">Excluir</button>
            </div>
        `;
        
        itemElement.addEventListener('dragstart', dragStart);
        itemElement.addEventListener('dragover', e => e.preventDefault());
        itemElement.addEventListener('drop', drop);
        itemsList.appendChild(itemElement);
    });
}

function deleteItem(id) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        contentItems = contentItems.filter(item => item.id !== id);
        saveContent();
        updatePreview();
        showNotification('Item excluído com sucesso!');
    }
}

function saveOrder() {
    saveContent();
    showNotification('Ordem de exibição salva com sucesso!');
}

function dragStart(e) {
    dragItem = this;
    e.dataTransfer.effectAllowed = 'move';
}

function drop(e) {
    e.preventDefault();
    if (dragItem !== this) {
        const fromId = Number(dragItem.dataset.id);
        const toId = Number(this.dataset.id);
        const fromIndex = contentItems.findIndex(item => item.id === fromId);
        const toIndex = contentItems.findIndex(item => item.id === toId);

        const item = contentItems.splice(fromIndex, 1)[0];
        contentItems.splice(toIndex, 0, item);
        
        updatePreview();
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    
    if(messageElement) {
        messageElement.textContent = message;
    } else {
        notification.textContent = message;
    }
    
    notification.style.backgroundColor = type === 'error' ? '#dc3545' : '#52AE32';
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 3000);
}

function loadSavedData() {
    const savedContent = localStorage.getItem('tvContent');
    if (savedContent) contentItems = JSON.parse(savedContent);
}

function saveContent() {
    localStorage.setItem('tvContent', JSON.stringify(contentItems));
}