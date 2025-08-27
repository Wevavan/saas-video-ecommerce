#!/bin/bash
# backend/test-runway-simple.sh
# Test Runway avec création automatique d'utilisateur

echo "🧪 Test Runway avec Image Publique"
echo "=================================="

API_BASE="http://localhost:3001/api"

# Fonction d'authentification avec création d'utilisateur
echo "👤 Création d'utilisateur de test..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "runway-test@example.com",
        "password": "test123456",
        "firstName": "Runway",
        "lastName": "Test"
    }')

echo "📋 Réponse création:"
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extraction du token depuis la réponse de register
JWT_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Si pas de token depuis register, essayer login
if [ -z "$JWT_TOKEN" ]; then
    echo "🔐 Tentative de login..."
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "runway-test@example.com",
            "password": "test123456"
        }')
    
    echo "📋 Réponse login:"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$JWT_TOKEN" ]; then
    echo "❌ Échec authentification complet"
    echo "Réponse register: $REGISTER_RESPONSE"
    echo "Réponse login: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Authentifié avec succès"
echo "🔑 Token: ${JWT_TOKEN:0:20}..."

# Vérifier les crédits
echo "💳 Vérification des crédits..."
CREDITS_RESPONSE=$(curl -s "$API_BASE/credits" \
    -H "Authorization: Bearer $JWT_TOKEN")

echo "📋 Crédits:"
echo "$CREDITS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREDITS_RESPONSE"

# Test direct avec image publique
echo "🎬 Test génération avec image publique..."

GENERATION_REQUEST='{
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons_(cropped).jpg",
    "prompt": "A cinematic video showcasing this iconic monument with smooth camera movements and dramatic lighting",
    "style": "cinematic",
    "duration": 5,
    "aspectRatio": "16:9"
}'

echo "📋 Requête envoyée:"
echo "$GENERATION_REQUEST" | python3 -m json.tool 2>/dev/null || echo "$GENERATION_REQUEST"

GENERATION_RESPONSE=$(curl -s -X POST "$API_BASE/runway/generate" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$GENERATION_REQUEST")

echo "📋 Réponse génération:"
echo "$GENERATION_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$GENERATION_RESPONSE"

if echo "$GENERATION_RESPONSE" | grep -q '"success":true'; then
    echo "🎉 SUCCÈS! Génération démarrée!"
    
    # Extraire l'ID du job
    VIDEO_ID=$(echo "$GENERATION_RESPONSE" | grep -o '"videoId":"[^"]*"' | cut -d'"' -f4)
    JOB_ID=$(echo "$GENERATION_RESPONSE" | grep -o '"runwayJobId":"[^"]*"' | cut -d'"' -f4)
    
    echo "📊 Video ID: $VIDEO_ID"
    echo "📊 Job ID: $JOB_ID"
    
    if [ -n "$JOB_ID" ]; then
        echo "⏳ Attente 10 secondes puis vérification du statut..."
        sleep 10
        
        STATUS_RESPONSE=$(curl -s "$API_BASE/runway/status/$JOB_ID" \
            -H "Authorization: Bearer $JWT_TOKEN")
            
        echo "📊 Statut après 10s:"
        echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
        
        STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo "🎬 Statut: $STATUS"
        
        if [ "$STATUS" = "RUNNING" ] || [ "$STATUS" = "PROCESSING" ] || [ "$STATUS" = "SUCCEEDED" ]; then
            echo "✅ PREMIÈRE VIDÉO EN COURS DE GÉNÉRATION!"
            echo "🎬 La génération Runway fonctionne parfaitement!"
        fi
    fi
    
else
    echo "❌ Échec de la génération"
    
    # Analyser l'erreur
    if echo "$GENERATION_RESPONSE" | grep -q "metadata"; then
        echo "🔍 Problème d'image - métadonnées non lisibles"
    elif echo "$GENERATION_RESPONSE" | grep -q "403"; then
        echo "🔍 Problème d'autorisation API"
    elif echo "$GENERATION_RESPONSE" | grep -q "404"; then
        echo "🔍 Endpoint non trouvé"
    else
        echo "🔍 Autre erreur"
    fi
fi

echo "=================================="
echo "🧪 Test terminé - $(date)"