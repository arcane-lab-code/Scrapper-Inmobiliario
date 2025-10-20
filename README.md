# Scrapper Inmobiliario

Sistema automatizado de scraping de portales inmobiliarios con gestión centralizada en Google Sheets.

## Características

- 🔍 **Multi-portal**: Soporte para Idealista, Fotocasa, Tecnocasa, RedPiso, Gilmar, Engel & Voelkers y más
- 🔄 **Arquitectura modular**: Sistema de scraping intercambiable (Puppeteer, Playwright, etc.)
- 🌐 **Rotación de IPs**: Soporte para proxies y ocultación de IP del servidor
- 📊 **Google Sheets**: Almacenamiento centralizado de resultados
- 🎯 **Detección de duplicados**: Evita scrapear el mismo inmueble múltiples veces
- ⏰ **Scheduler**: Ejecución automática de búsquedas programadas
- 🖥️ **Frontend Web**: Interfaz para gestionar búsquedas y visualizar resultados
- ⚙️ **Configurable**: Filtros personalizables por usuario

## Estructura del Proyecto

```
Scrapper-Inmobiliario/
├── backend/          # API y sistema de scraping
├── frontend/         # Interfaz web de gestión
├── config/          # Archivos de configuración
└── data/            # Base de datos local
```

## Instalación

### Requisitos

- Node.js 18+
- Docker (opcional)
- Cuenta de Google Cloud con Sheets API habilitada

### Configuración

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/Scrapper-Inmobiliario.git
cd Scrapper-Inmobiliario
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. Configurar Google Sheets API:
   - Crear proyecto en Google Cloud Console
   - Habilitar Google Sheets API
   - Crear credenciales (Service Account)
   - Descargar JSON y guardar en `config/google-credentials.json`

### Instalación Local

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd ../frontend
npm install
npm start
```

### Instalación con Docker

```bash
docker-compose up -d
```

## Configuración de Búsquedas

Crear archivo de configuración en `config/searches/`:

```json
{
  "name": "Madrid Centro Alquiler",
  "portal": "idealista",
  "searchType": "rent",
  "filters": {
    "location": "madrid-ciudad",
    "zone": "dentro-m30",
    "priceMin": 800,
    "priceMax": 1500,
    "rooms": [2, 3],
    "propertyType": "piso"
  },
  "scraper": {
    "engine": "puppeteer",
    "useProxy": true,
    "headless": true
  },
  "schedule": {
    "enabled": true,
    "cron": "0 9 * * *"
  },
  "output": {
    "googleSheetsUrl": "https://docs.google.com/spreadsheets/d/..."
  }
}
```

## API Endpoints

### Búsquedas

- `GET /api/searches` - Listar búsquedas
- `POST /api/searches` - Crear búsqueda
- `PUT /api/searches/:id` - Actualizar búsqueda
- `DELETE /api/searches/:id` - Eliminar búsqueda
- `POST /api/searches/:id/execute` - Ejecutar búsqueda manualmente

### Resultados

- `GET /api/results` - Listar resultados
- `GET /api/results/:id` - Obtener resultado específico

### Scheduler

- `GET /api/scheduler/jobs` - Listar trabajos programados
- `POST /api/scheduler/jobs/:id/pause` - Pausar trabajo
- `POST /api/scheduler/jobs/:id/resume` - Reanudar trabajo

## Portales Soportados

| Portal | Estado | Filtros |
|--------|--------|---------|
| Idealista | ✅ Implementado | Ubicación, precio, habitaciones, tipo |
| Fotocasa | 🚧 En desarrollo | - |
| Tecnocasa | 📋 Planificado | - |
| RedPiso | 📋 Planificado | - |
| Gilmar | 📋 Planificado | - |
| Engel & Voelkers | 📋 Planificado | - |

## Desarrollo

### Añadir nuevo portal

1. Crear scraper en `backend/src/scrapers/portals/`:
```typescript
import { PortalScraper } from './portal.interface';

export class NuevoPortalScraper implements PortalScraper {
  // Implementar métodos...
}
```

2. Registrar en el hub:
```typescript
// backend/src/scrapers/hub.ts
import { NuevoPortalScraper } from './portals/nuevo-portal.scraper';

this.portals.set('nuevo-portal', new NuevoPortalScraper());
```

### Añadir nuevo motor de scraping

1. Crear engine en `backend/src/scrapers/engines/`:
```typescript
import { ScraperEngine } from './scraper.interface';

export class NuevoEngine implements ScraperEngine {
  // Implementar métodos...
}
```

## Despliegue en Coolify

1. Crear nueva aplicación en Coolify
2. Conectar con repositorio de GitHub
3. Configurar variables de entorno
4. Deploy automático desde main branch

## Licencia

MIT

## Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue o pull request.

## Soporte

Para reportar bugs o solicitar funcionalidades, abre un issue en GitHub.
