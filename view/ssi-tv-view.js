// Variáveis globais
let allContentItems = [];
let activeContentItems = []; // NOVO: Apenas os itens que devem ser mostrados hoje
let currentSlideIndex = 0;
let slideTimeout;
let dateTimeInterval;

document.addEventListener('DOMContentLoaded', () => {
    loadContent();
    startPresentation();
});

function loadContent() {
    const savedContent = localStorage.getItem('tvContent');
    if (savedContent) {
        try {
            allContentItems = JSON.parse(savedContent);
        } catch (e) {
            console.error('Erro ao carregar conteúdo:', e);
            allContentItems = [];
        }
    }
}

// NOVO: Função para filtrar os itens agendados para hoje
function filterActiveContent() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas as datas

    activeContentItems = allContentItems.filter(item => {
        // Se não tem data de início nem de fim, mostrar sempre.
        if (!item.startDate && !item.endDate) {
            return true;
        }

        const startDate = item.startDate ? new Date(item.startDate + 'T00:00:00') : null;
        const endDate = item.endDate ? new Date(item.endDate + 'T23:59:59') : null;

        // Lógica de agendamento
        if (startDate && today < startDate) return false; // Ainda não começou
        if (endDate && today > endDate) return false;   // Já terminou

        return true; // Está dentro do período
    });
}


function startPresentation() {
    filterActiveContent(); // NOVO: Filtra o conteúdo antes de começar

    const tvView = document.getElementById('tv-view');

    if (!activeContentItems || activeContentItems.length === 0) {
        tvView.innerHTML = `
            <div class="slide active" style="justify-content: center; align-items: center; text-align: center;">
                <div>
                    <h1 style="font-size: 3em;">SSI TV</h1>
                    <p style="font-size: 1.5em; margin-top: 20px;">Nenhum conteúdo agendado para hoje.</p>
                </div>
            </div>`;
        return;
    }

    buildSlides();
    setupGlobalDateTime();
    showSlide(currentSlideIndex);
}

// ALTERADO: Usa a lista 'activeContentItems'
function buildSlides() {
    const tvView = document.getElementById('tv-view');
    tvView.innerHTML = '';

    activeContentItems.forEach((item, index) => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.dataset.displayTime = item.displayTime;

        let contentHTML = '';

        if (item.type === 'news') {
            const hasImage = item.imageUrl && item.imageUrl.trim() !== '';
            contentHTML = `
                <div class="tv-header">
                    <div class="header-title">SSI TV</div>
                    <div class="datetime"></div>
                </div>
                <div class="news-content">
                    ${hasImage ? `
                        <div class="image-section"><img src="${item.imageUrl}" alt="${item.title}" class="news-image"></div>
                        <div class="details-section"><h1 class="news-title">${item.title}</h1><div class="news-description">${item.description}</div></div>
                    ` : `
                        <div class="news-no-image"><h1 class="news-title">${item.title}</h1><div class="news-description">${item.description}</div></div>
                    `}
                </div>
            `;
        } else if (item.type === 'dashboard') {
            contentHTML = `<iframe class="dashboard-frame" src="${item.url}"></iframe>`;
        }

        slide.innerHTML = contentHTML + `
            <div class="slide-indicator">Slide ${index + 1} de ${activeContentItems.length}</div>
            <div class="controls"><button onclick="exitPresentation()">Sair (ESC)</button></div>
        `;

        tvView.appendChild(slide);
    });
}

function showSlide(index) {
    clearTimeout(slideTimeout);
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;

    slides.forEach(slide => slide.classList.remove('active', 'fade-in'));
    slides[index].classList.add('active');
    setTimeout(() => slides[index].classList.add('fade-in'), 10);

    currentSlideIndex = index;
    
    const displayTime = parseInt(slides[index].dataset.displayTime) * 1000;
    slideTimeout = setTimeout(() => {
        const nextIndex = (currentSlideIndex + 1) % slides.length;
        showSlide(nextIndex);
    }, displayTime);
}

function setupGlobalDateTime() {
    clearInterval(dateTimeInterval);
    dateTimeInterval = setInterval(() => {
        const activeSlide = document.querySelector('.slide.active');
        if (activeSlide) {
            const datetimeElement = activeSlide.querySelector('.datetime');
            if (datetimeElement) {
                const now = new Date();
                const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
                datetimeElement.textContent = now.toLocaleDateString('pt-BR', options);
            }
        }
    }, 1000);
}

function exitPresentation() {
    window.close();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        exitPresentation();
    }
});