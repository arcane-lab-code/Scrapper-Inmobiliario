# 🚀 Inicio Rápido - Scrapper Inmobiliario

## ⚡ Despliegue en 5 Minutos

### Paso 1: Subir a GitHub (2 minutos)

```bash
cd /root/arcaneclaude/Scrapper-Inmobiliario

# Ejecutar script de configuración (reemplaza TU-USUARIO)
./setup-github.sh TU-USUARIO-GITHUB
```

Luego:
1. Ve a https://github.com/new
2. Nombre: `Scrapper-Inmobiliario`
3. Público
4. **NO marques** "Add a README"
5. Click "Create repository"
6. Ejecuta: `git push -u origin main`

✅ **Listo!** Tu código está en GitHub.

---

### Paso 2: Deploy en Coolify (3 minutos)

#### 2.1 Crear Aplicación

En Coolify:
1. **New Application**
2. **Repository**: `https://github.com/TU-USUARIO/Scrapper-Inmobiliario`
3. **Branch**: `main`
4. **Build Pack**: Dockerfile
5. **Name**: `scrapper-inmobiliario`
6. **Port**: `3000`

#### 2.2 Variables de Entorno

Añade estas variables:
```
NODE_ENV=production
PORT=3000
```

#### 2.3 Volúmenes (opcional pero recomendado)

Para persistir datos entre deploys:
- `/root/scrapper-data` → `/app/data`
- `/root/scrapper-config` → `/app/config`

#### 2.4 Deploy

Click **Deploy** y espera 2-3 minutos.

✅ **Listo!** Tu app está online.

---

### Paso 3: Configurar Google Sheets (opcional - 5 minutos)

**Solo si quieres exportar a Google Sheets:**

1. Ve a https://console.cloud.google.com
2. Crea proyecto "Scrapper Inmobiliario"
3. Habilita "Google Sheets API"
4. Crea "Service Account"
5. Descarga credenciales JSON
6. Sube al servidor:
   ```bash
   mkdir -p /root/scrapper-config
   # Copia tu google-credentials.json aquí
   ```
7. En Coolify, añade variable:
   ```
   GOOGLE_CREDENTIALS_PATH=/app/config/google-credentials.json
   ```
8. Redeploy

---

## 🎯 Crear Primera Búsqueda

### Opción 1: Desde el Frontend (más fácil)

1. Abre: `http://TU-DOMINIO:3000`
2. Tab **"Nueva Búsqueda"**
3. Completa:
   - Nombre: "Madrid Centro"
   - Portal: Idealista
   - Ubicación: `madrid-ciudad`
   - Precio: 800-1500€
   - Habitaciones: `2,3`
4. ✓ Programar: `0 9 * * *` (diario 9am)
5. **Crear Búsqueda**
6. Click **▶ Ejecutar** para probar

### Opción 2: Via API (más rápido)

```bash
curl -X POST http://TU-DOMINIO:3000/api/searches \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Madrid Centro Alquiler",
    "portal": "idealista",
    "searchType": "rent",
    "filters": {
      "searchType": "rent",
      "location": "madrid-ciudad",
      "priceMin": 800,
      "priceMax": 1500,
      "rooms": [2, 3]
    },
    "scraper": {
      "engine": "puppeteer",
      "useProxy": false,
      "headless": true
    },
    "schedule": {
      "enabled": true,
      "cron": "0 9 * * *"
    }
  }'
```

---

## 🧪 Verificar que Funciona

### Health Check
```bash
curl http://TU-DOMINIO:3000/health
```

Debería responder:
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T...",
  "uptime": 123.45
}
```

### Info del Sistema
```bash
curl http://TU-DOMINIO:3000/api/info
```

Debería mostrar:
```json
{
  "name": "Scrapper Inmobiliario API",
  "availableEngines": ["puppeteer"],
  "availablePortals": ["idealista"],
  "scheduledJobs": []
}
```

### Ejecutar Búsqueda Manual

1. Ve a `http://TU-DOMINIO:3000`
2. Tab "Búsquedas"
3. Click **▶ Ejecutar** en tu búsqueda
4. Revisa logs en Coolify para ver el progreso

---

## 📊 Expresiones Cron Útiles

```bash
0 9 * * *      # Todos los días a las 9:00
0 */6 * * *    # Cada 6 horas
0 9,18 * * *   # 9:00 y 18:00 diarias
0 9 * * 1-5    # 9:00 de lunes a viernes
0 0 1 * *      # Primer día de cada mes
```

Usa https://crontab.guru para crear expresiones personalizadas.

---

## 🎨 Capturas de Pantalla

### Panel Principal
El frontend te permite:
- ✅ Ver todas tus búsquedas
- ✅ Crear nuevas búsquedas con filtros
- ✅ Ejecutar búsquedas manualmente
- ✅ Ver estadísticas de inmuebles
- ✅ Gestionar tareas programadas

### Campos de Búsqueda
- **Portal**: Idealista (más portales próximamente)
- **Tipo**: Alquiler o Venta
- **Ubicación**: madrid-ciudad, barcelona-ciudad, etc.
- **Zona**: dentro-m30, centro, etc. (opcional)
- **Precio**: Mín y Máx
- **Habitaciones**: Lista separada por comas (ej: 2,3,4)
- **Tipo inmueble**: Piso, casa, chalet, ático, estudio

### Opciones Avanzadas
- ✓ Usar proxy para ocultar IP
- ✓ Scrapear detalles completos
- ✓ Scrapear información de contacto
- ✓ Programar ejecución automática

---

## 🔧 Comandos Útiles

### Ver Logs
```bash
docker logs -f $(docker ps -q -f name=scrapper)
```

O desde Coolify: Applications → scrapper-inmobiliario → Logs

### Reiniciar
En Coolify: Click **Restart**

### Actualizar Código
1. Haz cambios en tu código
2. `git add . && git commit -m "mensaje" && git push`
3. En Coolify: Click **Redeploy**

### Backup
```bash
# Backup de base de datos
docker cp $(docker ps -q -f name=scrapper):/app/data ./backup/
```

---

## 🆘 Problemas Comunes

### "Cannot connect to server"
- Verifica que el puerto 3000 esté abierto en el firewall
- Revisa logs de Coolify para errores

### "No listings found"
- Idealista puede haber cambiado su HTML
- Verifica la URL de búsqueda manualmente
- Considera usar proxy si hay bloqueo de IP

### "Google Sheets not configured"
Es normal si no has configurado Google Sheets API.
El scraping funciona igual, solo no exporta a Sheets.

### El scraper tarda mucho
- Puppeteer en modo headless necesita tiempo
- Aumenta `rateLimitMs` para ser más gentil con el portal
- Usa proxy para evitar rate limits

---

## 📚 Documentación Completa

- **DEPLOYMENT.md**: Guía completa de despliegue paso a paso
- **GITHUB-SETUP.md**: Detalles sobre configuración de GitHub
- **README.md**: Información general del proyecto

---

## 🎉 ¡Listo para Usar!

Tu sistema de scraping inmobiliario está configurado. Ahora puedes:

1. ✅ Scrapear Idealista automáticamente
2. ✅ Exportar a Google Sheets
3. ✅ Programar búsquedas recurrentes
4. ✅ Gestionar todo desde el frontend web
5. ✅ Evitar duplicados automáticamente

**Próximos pasos sugeridos:**
- Añade más portales (Fotocasa, Tecnocasa)
- Configura notificaciones por email/Telegram
- Añade filtros personalizados
- Integra con tu CRM inmobiliario
