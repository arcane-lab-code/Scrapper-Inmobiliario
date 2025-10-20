# Guía de Despliegue - Scrapper Inmobiliario

## 🚀 Despliegue Completo

### Paso 1: Crear Repositorio en GitHub

**Opción A: Manual (recomendado)**

1. Ve a https://github.com/new
2. Nombre: `Scrapper-Inmobiliario`
3. Descripción: `Sistema automatizado de scraping inmobiliario`
4. Público
5. NO marques "Add a README"
6. Crea el repositorio

Luego ejecuta:
```bash
cd /root/arcaneclaude/Scrapper-Inmobiliario
git remote add origin https://github.com/TU-USUARIO/Scrapper-Inmobiliario.git
git branch -M main
git push -u origin main
```

**Opción B: Usando gh CLI**
```bash
cd /root/arcaneclaude/Scrapper-Inmobiliario
gh repo create Scrapper-Inmobiliario --public --source=. --remote=origin --push
```

### Paso 2: Configurar Google Sheets API

1. **Google Cloud Console**: https://console.cloud.google.com
2. Crear nuevo proyecto: "Scrapper Inmobiliario"
3. Habilitar API:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Sheets API"
   - Click "Enable"
4. Crear Service Account:
   - "APIs & Services" > "Credentials"
   - "Create Credentials" > "Service Account"
   - Nombre: "scrapper-service"
   - Click "Create and Continue"
   - Rol: "Editor" (o "Sheets Editor")
   - Click "Done"
5. Descargar credenciales:
   - Click en la service account creada
   - Tab "Keys"
   - "Add Key" > "Create new key"
   - Tipo: JSON
   - Descargar y guardar como `google-credentials.json`

### Paso 3: Configurar en Coolify

#### 3.1 Crear Nueva Aplicación

En el panel de Coolify:

1. **Applications** > **+ New Application**
2. **Source**: GitHub/Git Repository
3. **Repository URL**: `https://github.com/TU-USUARIO/Scrapper-Inmobiliario`
4. **Branch**: `main`
5. **Build Pack**: Dockerfile
6. **Name**: `scrapper-inmobiliario`
7. **Domain**: `scrapper-inmobiliario.tudominio.com` (o usar IP)

#### 3.2 Configurar Variables de Entorno

En la sección **Environment Variables** de la aplicación:

```env
NODE_ENV=production
PORT=3000
GOOGLE_CREDENTIALS_PATH=/app/config/google-credentials.json
```

**Opcional - Configurar Proxies:**
```env
PROXY_LIST=[{"enabled":true,"host":"proxy1.example.com","port":8080,"username":"user","password":"pass"}]
```

#### 3.3 Configurar Volúmenes (Persistencia)

Para mantener la base de datos y configuración entre despliegues:

```
Source: /root/scrapper-data
Destination: /app/data
```

```
Source: /root/scrapper-config
Destination: /app/config
```

#### 3.4 Subir Credenciales de Google

Desde el servidor donde está Coolify:

```bash
# Crear directorio de configuración
mkdir -p /root/scrapper-config

# Subir el archivo de credenciales
# (copia google-credentials.json al servidor primero)
cp /path/to/google-credentials.json /root/scrapper-config/
```

#### 3.5 Deploy

Click en **Deploy** en Coolify. El proceso:
1. Clone del repositorio
2. Build de la imagen Docker
3. Start del contenedor
4. Health check

### Paso 4: Verificar Despliegue

```bash
# Health check
curl https://scrapper-inmobiliario.tudominio.com/health

# Info del sistema
curl https://scrapper-inmobiliario.tudominio.com/api/info
```

Deberías ver:
```json
{
  "name": "Scrapper Inmobiliario API",
  "version": "1.0.0",
  "availableEngines": ["puppeteer"],
  "availablePortals": ["idealista"]
}
```

### Paso 5: Acceder al Frontend

Abre en tu navegador:
```
https://scrapper-inmobiliario.tudominio.com
```

O si usas IP:
```
http://IP_DEL_SERVIDOR:3000
```

## 📊 Crear Primera Búsqueda

### Opción A: Desde el Frontend

1. Accede a la web
2. Tab "Nueva Búsqueda"
3. Completa el formulario:
   - **Nombre**: Madrid Centro Alquiler
   - **Portal**: Idealista
   - **Tipo**: Alquiler
   - **Ubicación**: madrid-ciudad
   - **Zona**: dentro-m30
   - **Precio**: 800 - 1500€
   - **Habitaciones**: 2,3
   - **URL Google Sheets**: (tu spreadsheet)
4. Marcar "Programar ejecución automática"
5. Cron: `0 9 * * *` (todos los días a las 9:00)
6. Click "Crear Búsqueda"

### Opción B: Via API

```bash
curl -X POST https://scrapper-inmobiliario.tudominio.com/api/searches \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Madrid Centro Alquiler",
    "portal": "idealista",
    "searchType": "rent",
    "filters": {
      "searchType": "rent",
      "location": "madrid-ciudad",
      "zone": "dentro-m30",
      "priceMin": 800,
      "priceMax": 1500,
      "rooms": [2, 3]
    },
    "scraper": {
      "engine": "puppeteer",
      "useProxy": false,
      "headless": true,
      "scrapeDetails": true,
      "scrapeContactInfo": false,
      "rateLimitMs": 2000
    },
    "schedule": {
      "enabled": true,
      "cron": "0 9 * * *"
    },
    "output": {
      "googleSheetsUrl": "https://docs.google.com/spreadsheets/d/TU_SPREADSHEET_ID/edit"
    }
  }'
```

### Opción C: Usando archivo de configuración

1. Edita `config/search-config.example.json`
2. Sube via API:

```bash
curl -X POST https://scrapper-inmobiliario.tudominio.com/api/searches \
  -H "Content-Type: application/json" \
  -d @config/search-config.example.json
```

## 🔧 Mantenimiento

### Ver Logs
```bash
docker logs -f CONTAINER_ID
```

O desde Coolify:
- Applications > scrapper-inmobiliario > Logs

### Limpiar Base de Datos de Duplicados
```bash
# Entrar al contenedor
docker exec -it CONTAINER_ID sh

# Limpiar entradas antiguas (más de 90 días)
# Se hará automáticamente en futuras versiones
```

### Actualizar Código
1. Push cambios a GitHub
2. En Coolify: Click "Redeploy"
3. Se construirá nueva imagen y desplegará

### Backup de Datos
```bash
# Base de datos
cp /root/scrapper-data/searches.db /backup/
cp /root/scrapper-data/deduplication.db /backup/

# Configuraciones
cp /root/scrapper-config/* /backup/
```

## 🎯 Próximos Pasos

### Añadir Más Portales

Para añadir Fotocasa, Tecnocasa, etc:

1. Crear nuevo scraper en `backend/src/scrapers/portals/fotocasa.scraper.ts`
2. Implementar interfaz `PortalScraper`
3. Registrar en el hub (`backend/src/scrapers/hub.ts`)
4. Deploy

### Configurar Proxies

Para usar proxies y ocultar IP:

1. Contratar servicio de proxies (ej: BrightData, Oxylabs)
2. Añadir a variable de entorno `PROXY_LIST`
3. En búsquedas, marcar "Usar proxy"

### Añadir Notificaciones

Modificar `backend/src/services/scheduler.service.ts` para:
- Enviar email cuando encuentra nuevos inmuebles
- Webhook a Telegram/Slack
- Alertas de precio

## 📚 Recursos

- **Documentación Coolify**: https://coolify.io/docs
- **Google Sheets API**: https://developers.google.com/sheets/api
- **Puppeteer**: https://pptr.dev
- **Cron Syntax**: https://crontab.guru

## 🆘 Troubleshooting

### Error: Google Sheets credentials not found
```bash
# Verificar que el archivo existe en el volumen
docker exec CONTAINER_ID ls -la /app/config/
```

### Error: Puppeteer browser launch failed
Aumentar memoria del contenedor en Coolify (mínimo 1GB recomendado)

### No se scrapen datos
- Verificar que Idealista no haya cambiado su HTML
- Revisar logs para errores específicos
- Probar con proxy si hay bloqueo de IP

### Base de datos bloqueada (SQLite)
Reiniciar el contenedor soluciona este problema temporal
