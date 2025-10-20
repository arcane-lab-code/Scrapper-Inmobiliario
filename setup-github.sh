#!/bin/bash

# Script de configuración automática para GitHub
# Uso: ./setup-github.sh TU-USUARIO-GITHUB

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar tu usuario de GitHub"
    echo "Uso: ./setup-github.sh TU-USUARIO-GITHUB"
    exit 1
fi

GITHUB_USER=$1
REPO_NAME="Scrapper-Inmobiliario"
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo "🚀 Configurando repositorio GitHub..."
echo "Usuario: ${GITHUB_USER}"
echo "Repo: ${REPO_NAME}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "README.md" ] || [ ! -d ".git" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio del proyecto"
    exit 1
fi

# Verificar si ya existe remote origin
if git remote | grep -q "origin"; then
    echo "⚠️  Remote 'origin' ya existe. Eliminando..."
    git remote remove origin
fi

# Añadir remote
echo "📡 Añadiendo remote origin..."
git remote add origin "${REPO_URL}"

# Cambiar a main branch
echo "🌿 Cambiando a branch main..."
git branch -M main

# Mostrar estado
echo ""
echo "✅ Configuración completada!"
echo ""
echo "📋 Próximo paso:"
echo "1. Crea el repositorio en GitHub: https://github.com/new"
echo "   - Name: ${REPO_NAME}"
echo "   - Public repository"
echo "   - NO añadas README, .gitignore, ni license"
echo ""
echo "2. Ejecuta el push:"
echo "   git push -u origin main"
echo ""
echo "🌐 URL del repositorio: ${REPO_URL}"
echo ""
