// Configuration
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load content for the selected tab
        loadTabContent(tabName);
    });
});

// Schedule checkbox toggle
document.getElementById('enable-schedule').addEventListener('change', (e) => {
    const scheduleConfig = document.getElementById('schedule-config');
    scheduleConfig.style.display = e.target.checked ? 'block' : 'none';
});

// New search form submission
document.getElementById('new-search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createSearch();
});

// Load content based on active tab
async function loadTabContent(tabName) {
    switch (tabName) {
        case 'searches':
            await loadSearches();
            break;
        case 'scheduler':
            await loadScheduler();
            break;
        case 'stats':
            await loadStats();
            break;
    }
}

// Load searches
async function loadSearches() {
    const container = document.getElementById('searches-list');
    container.innerHTML = '<div class="loading">Cargando búsquedas</div>';

    try {
        const response = await fetch(`${API_URL}/searches`);
        const data = await response.json();

        if (!data.success || data.searches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No hay búsquedas configuradas todavía</div>
                </div>
            `;
            return;
        }

        container.innerHTML = data.searches.map(search => renderSearchCard(search)).join('');

        // Add event listeners for actions
        addSearchActionListeners();
    } catch (error) {
        container.innerHTML = `<div class="error">Error al cargar búsquedas: ${error.message}</div>`;
    }
}

// Render search card
function renderSearchCard(search) {
    const lastExecuted = search.lastExecuted
        ? new Date(search.lastExecuted).toLocaleString()
        : 'Nunca';

    const scheduleStatus = search.schedule?.enabled
        ? `<span class="badge badge-success">Programada: ${search.schedule.cron}</span>`
        : `<span class="badge badge-warning">No programada</span>`;

    return `
        <div class="search-card" data-id="${search.id}">
            <div class="search-card-header">
                <div class="search-card-title">${search.name}</div>
                <div class="search-card-actions">
                    <button class="btn btn-success btn-small execute-btn" data-id="${search.id}">
                        ▶ Ejecutar
                    </button>
                    <button class="btn btn-danger btn-small delete-btn" data-id="${search.id}">
                        🗑 Eliminar
                    </button>
                </div>
            </div>
            <div class="search-card-info">
                <div class="info-item">
                    <div class="info-label">Portal</div>
                    <div class="info-value">${search.portal}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tipo</div>
                    <div class="info-value">${search.searchType === 'rent' ? 'Alquiler' : 'Venta'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Ubicación</div>
                    <div class="info-value">${search.filters.location || '-'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Precio</div>
                    <div class="info-value">
                        ${search.filters.priceMin || 0}€ - ${search.filters.priceMax || '∞'}€
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Última ejecución</div>
                    <div class="info-value">${lastExecuted}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Estado</div>
                    <div class="info-value">${scheduleStatus}</div>
                </div>
            </div>
        </div>
    `;
}

// Add event listeners for search actions
function addSearchActionListeners() {
    document.querySelectorAll('.execute-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            await executeSearch(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar esta búsqueda?')) {
                await deleteSearch(id);
            }
        });
    });
}

// Create new search
async function createSearch() {
    const formData = {
        name: document.getElementById('search-name').value,
        portal: document.getElementById('portal').value,
        searchType: document.getElementById('search-type').value,
        filters: {
            searchType: document.getElementById('search-type').value,
            location: document.getElementById('location').value,
            zone: document.getElementById('zone').value || undefined,
            priceMin: parseInt(document.getElementById('price-min').value) || undefined,
            priceMax: parseInt(document.getElementById('price-max').value) || undefined,
            rooms: document.getElementById('rooms').value
                ? document.getElementById('rooms').value.split(',').map(n => parseInt(n.trim()))
                : undefined,
            propertyType: document.getElementById('property-type').value || undefined,
        },
        scraper: {
            engine: 'puppeteer',
            useProxy: document.getElementById('use-proxy').checked,
            headless: true,
            scrapeDetails: document.getElementById('scrape-details').checked,
            scrapeContactInfo: document.getElementById('scrape-contact').checked,
            rateLimitMs: 2000,
        },
        schedule: {
            enabled: document.getElementById('enable-schedule').checked,
            cron: document.getElementById('cron-expression').value || undefined,
        },
        output: {
            googleSheetsUrl: document.getElementById('sheets-url').value || undefined,
        },
    };

    try {
        const response = await fetch(`${API_URL}/searches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
            alert('Búsqueda creada correctamente');
            document.getElementById('new-search-form').reset();
            // Switch to searches tab
            document.querySelector('[data-tab="searches"]').click();
        } else {
            alert('Error al crear búsqueda: ' + data.error);
        }
    } catch (error) {
        alert('Error al crear búsqueda: ' + error.message);
    }
}

// Execute search
async function executeSearch(id) {
    try {
        const response = await fetch(`${API_URL}/searches/${id}/execute`, {
            method: 'POST',
        });

        const data = await response.json();

        if (data.success) {
            alert('Búsqueda ejecutada. Los resultados se guardarán en Google Sheets.');
        } else {
            alert('Error al ejecutar búsqueda: ' + data.error);
        }
    } catch (error) {
        alert('Error al ejecutar búsqueda: ' + error.message);
    }
}

// Delete search
async function deleteSearch(id) {
    try {
        const response = await fetch(`${API_URL}/searches/${id}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
            alert('Búsqueda eliminada');
            await loadSearches();
        } else {
            alert('Error al eliminar búsqueda: ' + data.error);
        }
    } catch (error) {
        alert('Error al eliminar búsqueda: ' + error.message);
    }
}

// Load scheduler
async function loadScheduler() {
    const container = document.getElementById('scheduler-list');
    container.innerHTML = '<div class="loading">Cargando tareas programadas</div>';

    try {
        const response = await fetch(`${API_URL}/scheduler/jobs`);
        const data = await response.json();

        if (!data.success || data.jobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⏰</div>
                    <div class="empty-state-text">No hay tareas programadas</div>
                </div>
            `;
            return;
        }

        container.innerHTML = data.jobs.map(job => `
            <div class="search-card">
                <div class="search-card-header">
                    <div class="search-card-title">${job.name}</div>
                    <div class="search-card-actions">
                        <button class="btn btn-warning btn-small pause-btn" data-id="${job.id}">
                            ⏸ Pausar
                        </button>
                    </div>
                </div>
                <div class="search-card-info">
                    <div class="info-item">
                        <div class="info-label">Portal</div>
                        <div class="info-value">${job.portal}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Programación</div>
                        <div class="info-value">${job.cron}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Estado</div>
                        <div class="info-value">
                            <span class="badge badge-success">Activa</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<div class="error">Error al cargar tareas: ${error.message}</div>`;
    }
}

// Load stats
async function loadStats() {
    const container = document.getElementById('stats-content');
    container.innerHTML = '<div class="loading">Cargando estadísticas</div>';

    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();

        if (!data.success) {
            container.innerHTML = `<div class="error">Error al cargar estadísticas</div>`;
            return;
        }

        const stats = data.stats;

        let portalStats = '';
        for (const [portal, count] of Object.entries(stats.byPortal)) {
            portalStats += `
                <div class="stat-card">
                    <div class="stat-value">${count}</div>
                    <div class="stat-label">${portal}</div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.totalListings}</div>
                <div class="stat-label">Total de inmuebles scrapeados</div>
            </div>
            ${portalStats}
        `;
    } catch (error) {
        container.innerHTML = `<div class="error">Error al cargar estadísticas: ${error.message}</div>`;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadSearches();
});
