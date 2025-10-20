# Configuración de GitHub

## Comandos para Subir el Proyecto

El proyecto ya está listo con git inicializado. Solo necesitas crear el repositorio en GitHub y hacer push.

### Método 1: Manual (más simple)

1. **Crear repositorio en GitHub**:
   - Ve a: https://github.com/new
   - Repository name: `Scrapper-Inmobiliario`
   - Description: `Sistema automatizado de scraping inmobiliario con soporte para múltiples portales`
   - Public ✓
   - NO marques "Add a README file"
   - Click "Create repository"

2. **Conectar y subir** (copia la URL que te da GitHub):
   ```bash
   cd /root/arcaneclaude/Scrapper-Inmobiliario
   git remote add origin https://github.com/TU-USUARIO/Scrapper-Inmobiliario.git
   git branch -M main
   git push -u origin main
   ```

### Método 2: Con GitHub CLI (si está instalado)

```bash
cd /root/arcaneclaude/Scrapper-Inmobiliario

# Instalar gh CLI si no está
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Autenticarse
gh auth login

# Crear repo y subir
gh repo create Scrapper-Inmobiliario --public --source=. --remote=origin --push
```

### Verificar

Después del push, verifica en GitHub que todos los archivos estén ahí:
- ✓ backend/
- ✓ frontend/
- ✓ config/
- ✓ README.md
- ✓ Dockerfile
- ✓ docker-compose.yml
- ✓ .gitignore

## URL del Repositorio

Una vez creado, tu repositorio estará en:
```
https://github.com/TU-USUARIO/Scrapper-Inmobiliario
```

Esta URL la necesitarás para configurar Coolify.

## Próximos Commits

Para futuros cambios:
```bash
cd /root/arcaneclaude/Scrapper-Inmobiliario
git add .
git commit -m "Descripción del cambio"
git push
```

Coolify detectará automáticamente los cambios y puede hacer redeploy automático si lo configuras.
