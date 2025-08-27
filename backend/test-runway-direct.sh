#!/bin/bash
# backend/test-runway-direct.sh
# Test direct de l'API Runway

echo "🧪 Test Direct API Runway"
echo "========================"

# Récupérer la clé depuis .env
API_KEY=$(grep RUNWAY_API_KEY .env | cut -d'=' -f2)

if [ -z "$API_KEY" ]; then
    echo "❌ RUNWAY_API_KEY non trouvée dans .env"
    exit 1
fi

echo "✅ Clé API trouvée (longueur: ${#API_KEY})"

# Test 1: Vérifier l'authentification
echo -e "\n🧪 Test 1: Authentification API"
AUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -H "Authorization: Bearer $API_KEY" \
    -H "X-Runway-Version: 2024-11-06" \
    https://api.dev.runwayml.com/v1/tasks)

echo "Réponse:"
echo "$AUTH_RESPONSE"

# Extraire le code HTTP
HTTP_CODE=$(echo "$AUTH_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "✅ Authentification OK (code $HTTP_CODE)"
else
    echo "❌ Authentification échouée (code $HTTP_CODE)"
    exit 1
fi

# Test 2: Essayer une génération avec une image publique
echo -e "\n🧪 Test 2: Génération test avec image publique"

GENERATION_REQUEST='{
  "promptImage": "https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons_(cropped).jpg",
  "promptText": "A smooth camera movement around this iconic structure",
  "model": "gen4_turbo",
  "ratio": "1280:720",
  "duration": 5
}'

echo "Requête envoyée:"
echo "$GENERATION_REQUEST" | python3 -m json.tool 2>/dev/null || echo "$GENERATION_REQUEST"

GENERATION_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST https://api.dev.runwayml.com/v1/image_to_video \
    -H "Authorization: Bearer $API_KEY" \
    -H "X-Runway-Version: 2024-11-06" \
    -H "Content-Type: application/json" \
    -d "$GENERATION_REQUEST")

echo -e "\nRéponse:"
echo "$GENERATION_RESPONSE"

# Extraire le code HTTP
GEN_HTTP_CODE=$(echo "$GENERATION_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)

if [ "$GEN_HTTP_CODE" = "200" ] || [ "$GEN_HTTP_CODE" = "201" ]; then
    echo "🎉 Génération lancée avec succès!"
    
    # Extraire l'ID de la tâche
    TASK_ID=$(echo "$GENERATION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TASK_ID" ]; then
        echo "✅ Task ID: $TASK_ID"
        
        # Vérifier le statut
        echo -e "\n🧪 Test 3: Vérification statut"
        STATUS_RESPONSE=$(curl -s \
            -H "Authorization: Bearer $API_KEY" \
            -H "X-Runway-Version: 2024-11-06" \
            https://api.dev.runwayml.com/v1/tasks/$TASK_ID)
        
        echo "Statut:"
        echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
    fi
else
    echo "❌ Génération échouée (code $GEN_HTTP_CODE)"
    
    # Analyser l'erreur
    ERROR_MSG=$(echo "$GENERATION_RESPONSE" | grep -v "HTTP_CODE:" | python3 -m json.tool 2>/dev/null)
    echo "Détails de l'erreur:"
    echo "$ERROR_MSG"
fi

echo -e "\n=================================="
echo "🧪 Test direct terminé"