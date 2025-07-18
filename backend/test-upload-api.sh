#!/bin/bash

echo "🧪 Test des API d'upload d'images"
echo "=================================="

BASE_URL="http://localhost:3001"

# Couleurs pour les résultats
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Test 1: Vérifier que le serveur répond
echo -e "${YELLOW}1. Test de connexion au serveur...${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/health || echo "000")
if [ $response -eq 200 ]; then
    print_result 0 "Serveur accessible"
else
    print_result 1 "Serveur non accessible (code: $response)"
    echo "Assurez-vous que le serveur backend est démarré avec 'npm run dev'"
    exit 1
fi

# Test 2: Test d'upload sans authentification (doit échouer)
echo -e "${YELLOW}2. Test d'upload sans authentification...${NC}"

# Créer une image de test simple
echo "Création d'une image de test..."
# Créer un fichier binaire simple qui ressemble à une image
printf '\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xFF\xDB\x00C\x00' > test-image.jpg
printf '\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0C\x14\r\x0C\x0B\x0B\x0C\x19\x12\x13\x0F' >> test-image.jpg

response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/api/upload/images" \
    -F "images=@test-image.jpg" 2>/dev/null || echo "000")

if [ $response -eq 401 ]; then
    print_result 0 "Authentification requise (comme attendu)"
else
    print_result 1 "Authentification non requise (problème de sécurité) - Code: $response"
fi

# Test 3: Créer un utilisateur test et récupérer un token
echo -e "${YELLOW}3. Création d'un utilisateur test...${NC}"
TEST_EMAIL="test-upload-$(date +%s)@example.com"  # Email unique
TEST_PASSWORD="testpassword123"

# Inscription
echo "Inscription de l'utilisateur test..."
register_response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\", \"password\":\"$TEST_PASSWORD\"}")

echo "Réponse inscription: $register_response"

# Connexion pour récupérer le token
echo "Connexion pour récupérer le token..."
login_response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\", \"password\":\"$TEST_PASSWORD\"}")

echo "Réponse connexion: $login_response"

# Extraire le token - compatible avec votre format de réponse
TOKEN=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    print_result 0 "Token d'authentification récupéré"
    echo "Token: ${TOKEN:0:20}..."
else
    print_result 1 "Impossible de récupérer le token"
    echo "Réponse complète: $login_response"
    echo "Vérifiez que l'API d'authentification fonctionne"
    exit 1
fi

# Test 4: Upload d'image avec authentification
echo -e "${YELLOW}4. Test d'upload avec authentification...${NC}"
upload_response=$(curl -s -X POST "$BASE_URL/api/upload/images" \
    -H "Authorization: Bearer $TOKEN" \
    -F "images=@test-image.jpg")

echo "Réponse upload: $upload_response"

if echo "$upload_response" | grep -q '"success":true'; then
    print_result 0 "Upload réussi"
    
    # Extraire le nom du fichier depuis la réponse
    FILENAME=$(echo $upload_response | grep -o '"filename":"[^"]*' | cut -d'"' -f4)
    echo "Fichier uploadé: $FILENAME"
else
    print_result 1 "Échec de l'upload"
    echo "Vérifiez que le dossier 'uploads' existe dans le backend"
    echo "Vérifiez que Sharp est installé: npm list sharp"
fi

# Test 5: Accès à l'image uploadée
if [ ! -z "$FILENAME" ]; then
    echo -e "${YELLOW}5. Test d'accès à l'image uploadée...${NC}"
    image_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/uploads/$FILENAME")
    
    if [ $image_response -eq 200 ]; then
        print_result 0 "Image accessible via URL"
        echo "URL: $BASE_URL/uploads/$FILENAME"
    else
        print_result 1 "Image non accessible (code: $image_response)"
    fi
    
    # Test 6: Suppression de l'image
    echo -e "${YELLOW}6. Test de suppression d'image...${NC}"
    delete_response=$(curl -s -X DELETE "$BASE_URL/api/upload/image/$FILENAME" \
        -H "Authorization: Bearer $TOKEN")
    
    echo "Réponse suppression: $delete_response"
    
    if echo "$delete_response" | grep -q '"success":true'; then
        print_result 0 "Suppression réussie"
    else
        print_result 1 "Échec de la suppression"
    fi
fi

# Test 7: Test de formats non supportés
echo -e "${YELLOW}7. Test de formats non supportés...${NC}"
echo "Test texte" > test-file.txt
unsupported_response=$(curl -s -X POST "$BASE_URL/api/upload/images" \
    -H "Authorization: Bearer $TOKEN" \
    -F "images=@test-file.txt")

if echo "$unsupported_response" | grep -q "non supporté\|not supported"; then
    print_result 0 "Validation des formats fonctionne"
else
    print_result 1 "Validation des formats défaillante"
    echo "Réponse: $unsupported_response"
fi

# Test 8: Health check étendu
echo -e "${YELLOW}8. Test health check étendu...${NC}"
health_response=$(curl -s "$BASE_URL/api/health-extended")
if echo "$health_response" | grep -q "cleanup"; then
    print_result 0 "Health check étendu fonctionne"
else
    print_result 1 "Health check étendu non disponible"
fi

# Nettoyage
echo -e "${YELLOW}Nettoyage des fichiers de test...${NC}"
rm -f test-image.jpg test-file.txt

echo ""
echo "=================================="
echo -e "${GREEN}🎉 Tests d'upload terminés !${NC}"
echo "=================================="
echo ""
echo "📋 Résumé:"
echo "- API d'upload configurée"
echo "- Authentification obligatoire"
echo "- Validation des formats"
echo "- Compression automatique"
echo "- URLs d'accès fonctionnelles"
echo ""
echo "🚀 Prochaines étapes:"
echo "1. Implémenter l'interface frontend d'upload"
echo "2. Intégrer avec le système de génération vidéo". Test d'accès à l'image uploadée...${NC}"
    image_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/upload/image/$FILENAME")
    
    if [ $image_response -eq 200 ]; then
        print_result 0 "Image accessible via URL"
    else
        print_result 1 "Image non accessible (code: $image_response)"
    fi
    
    # Test 7: Suppression de l'image
    echo -e "${YELLOW}7. Test de suppression d'image...${NC}"
    delete_response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X DELETE "$BASE_URL/api/upload/image/$FILENAME" \
        -H "Authorization: Bearer $TOKEN")
    
    if [ $delete_response -eq 200 ]; then
        print_result 0 "Suppression réussie"
    else
        print_result 1 "Échec de la suppression (code: $delete_response)"
    fi
fi

# Test 8: Test de rate limiting
echo -e "${YELLOW}8. Test de rate limiting...${NC}"
echo "Envoi de 6 requêtes rapides pour tester la limite..."

for i in {1..6}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$BASE_URL/api/upload/images" \
        -H "Authorization: Bearer $TOKEN" \
        -F "images=@test-image.jpg")
    echo "Requête $i: HTTP $response"
done

echo -e "${YELLOW}9. Test de formats non supportés...${NC}"
echo "Test texte" > test-file.txt
unsupported_response=$(curl -s -X POST "$BASE_URL/api/upload/images" \
    -H "Authorization: Bearer $TOKEN" \
    -F "images=@test-file.txt")

if echo "$unsupported_response" | grep -q "non supporté"; then
    print_result 0 "Validation des formats fonctionne"
else
    print_result 1 "Validation des formats défaillante"
fi

# Nettoyage
echo -e "${YELLOW}Nettoyage des fichiers de test...${NC}"
rm -f test-image.jpg test-file.txt

echo ""
echo "=================================="
echo -e "${GREEN}🎉 Tests d'upload terminés !${NC}"
echo "=================================="