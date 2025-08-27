#!/bin/bash
# backend/test-first-video.sh
# Script simple pour tester la première génération vidéo

echo "🎬 Test Première Vidéo Runway"
echo "============================="

# Configuration
API_BASE="http://localhost:3001/api"
TEST_EMAIL="test@runway.com"
TEST_PASSWORD="password123"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}📋 Étape: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Étape 1: Vérifier que le serveur backend est accessible
print_step "Vérification du serveur backend"
if curl -s "$API_BASE/health" > /dev/null; then
    print_success "Serveur backend accessible"
else
    print_error "Serveur backend non accessible"
    echo "Démarrez le backend avec: cd backend && npm run dev"
    exit 1
fi

# Étape 2: Login ou création d'utilisateur
print_step "Authentification utilisateur"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

JWT_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
    print_info "Utilisateur n'existe pas, création en cours..."
    
    REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\",
            \"name\": \"Test Runway User\"
        }")
    
    # Retry login
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")
    
    JWT_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -n "$JWT_TOKEN" ]; then
    print_success "Authentification réussie"
    print_info "Token: ${JWT_TOKEN:0:20}..."
else
    print_error "Échec authentification"
    echo "Réponse: $LOGIN_RESPONSE"
    exit 1
fi

# Étape 3: Vérifier les crédits utilisateur
print_step "Vérification des crédits utilisateur"
CREDITS_RESPONSE=$(curl -s -X GET "$API_BASE/credits" \
    -H "Authorization: Bearer $JWT_TOKEN")

CREDITS=$(echo $CREDITS_RESPONSE | grep -o '"balance":[0-9]*' | cut -d':' -f2)

if [ "$CREDITS" -ge 10 ]; then
    print_success "Crédits suffisants: $CREDITS crédits"
else
    print_info "Crédits insuffisants ($CREDITS), ajout de crédits de test..."
    
    # Ajouter des crédits via API admin (simulation)
    curl -s -X POST "$API_BASE/credits/add" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"amount\": 100, \"source\": \"test\"}" > /dev/null
    
    print_success "100 crédits de test ajoutés"
fi

# Étape 4: Vérifier la santé du service Runway
print_step "Vérification service Runway"
RUNWAY_HEALTH=$(curl -s -X GET "$API_BASE/runway/health")

# Debug: afficher la réponse complète
print_info "Réponse Runway Health:"
echo "$RUNWAY_HEALTH" | python3 -m json.tool 2>/dev/null || echo "$RUNWAY_HEALTH"

# Méthode de parsing plus robuste
RUNWAY_STATUS=""
if command -v jq &> /dev/null; then
    # Si jq est disponible
    RUNWAY_STATUS=$(echo "$RUNWAY_HEALTH" | jq -r '.status' 2>/dev/null)
else
    # Fallback sans jq
    RUNWAY_STATUS=$(echo "$RUNWAY_HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
fi

# Vérifier aussi si API configurée
API_CONFIGURED=$(echo "$RUNWAY_HEALTH" | grep -o '"configured":[^,}]*' | cut -d':' -f2)

print_info "Status détecté: '$RUNWAY_STATUS'"
print_info "API configurée: '$API_CONFIGURED'"

case $RUNWAY_STATUS in
    "configured")
        print_success "Service Runway configuré et opérationnel"
        ;;
    "not_configured")
        print_error "Service Runway non configuré"
        echo "Ajoutez RUNWAY_API_KEY dans votre fichier .env"
        echo "Voir les instructions dans le README"
        exit 1
        ;;
    *)
        print_error "Service Runway en erreur ou status non reconnu: '$RUNWAY_STATUS'"
        print_info "Vérification manuelle recommandée:"
        echo "curl http://localhost:3001/api/runway/health"
        
        # Continuons quand même si l'API semble configurée
        if [[ "$API_CONFIGURED" == *"true"* ]]; then
            print_info "L'API semble configurée, continuation du test..."
        else
            print_error "API non configurée, arrêt du test"
            exit 1
        fi
        ;;
esac

# Étape 5: Créer une image de test
print_step "Création d'une image de test"

# Créer une image PNG simple (carré bleu 100x100)
echo "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANeSURBVHic7Z29axRBFMafJBqwsLGwsLBQsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsLGwsEND" | base64 -d > test_product.png

print_success "Image de test créée"

# Étape 6: Upload de l'image
print_step "Upload de l'image de test"

UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/upload/images" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -F "images=@test_product.png")

# Debug: afficher la réponse
print_info "Réponse upload:"
echo "$UPLOAD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Extraire l'URL de l'image (nouvelle structure de réponse)
IMAGE_URL=""
if command -v jq &> /dev/null; then
    # Si jq est disponible
    IMAGE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.images[0].url' 2>/dev/null)
else
    # Fallback sans jq - chercher dans le tableau images
    IMAGE_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -n "$IMAGE_URL" ] && [ "$IMAGE_URL" != "null" ]; then
    print_success "Image uploadée avec succès"
    print_info "URL: $IMAGE_URL"
else
    print_error "Échec upload image"
    echo "Réponse complète: $UPLOAD_RESPONSE"
    exit 1
fi

# Nettoyer le fichier temporaire
rm -f test_product.png

# Étape 7: Lancer la génération vidéo
print_step "Démarrage génération vidéo Runway"

GENERATION_REQUEST="{
    \"imageUrl\": \"$IMAGE_URL\",
    \"prompt\": \"Une vidéo marketing professionnelle de ce produit avec des transitions fluides et un zoom élégant. Le produit doit être mis en valeur avec un éclairage dynamique.\",
    \"style\": \"professional\",
    \"duration\": 10,
    \"aspectRatio\": \"16:9\"
}"

print_info "Requête de génération:"
echo "$GENERATION_REQUEST" | python3 -m json.tool 2>/dev/null || echo "$GENERATION_REQUEST"

GENERATION_RESPONSE=$(curl -s -X POST "$API_BASE/runway/generate" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$GENERATION_REQUEST")

JOB_ID=$(echo $GENERATION_RESPONSE | grep -o '"runwayJobId":"[^"]*"' | cut -d'"' -f4)
VIDEO_ID=$(echo $GENERATION_RESPONSE | grep -o '"videoId":"[^"]*"' | cut -d'"' -f4)
SUCCESS=$(echo $GENERATION_RESPONSE | grep -o '"success":[^,}]*' | cut -d':' -f2)

if [ "$SUCCESS" = "true" ] && [ -n "$JOB_ID" ]; then
    print_success "Génération démarrée avec succès!"
    print_info "Job ID: $JOB_ID"
    print_info "Video ID: $VIDEO_ID"
    
    # Étape 8: Suivi du statut en temps réel
    print_step "Suivi de la progression (max 5 minutes)"
    
    START_TIME=$(date +%s)
    MAX_WAIT=300  # 5 minutes
    CHECK_INTERVAL=10  # 10 secondes
    
    while true; do
        CURRENT_TIME=$(date +%s)
        ELAPSED=$((CURRENT_TIME - START_TIME))
        
        if [ $ELAPSED -gt $MAX_WAIT ]; then
            print_error "Timeout: génération trop longue (>5 minutes)"
            break
        fi
        
        STATUS_RESPONSE=$(curl -s -X GET "$API_BASE/runway/status/$JOB_ID")
        STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        PROGRESS=$(echo $STATUS_RESPONSE | grep -o '"progress":[0-9]*' | cut -d':' -f2)
        
        ELAPSED_MIN=$((ELAPSED / 60))
        ELAPSED_SEC=$((ELAPSED % 60))
        
        case $STATUS in
            "completed")
                print_success "🎉 Génération terminée avec succès!"
                VIDEO_URL=$(echo $STATUS_RESPONSE | grep -o '"videoUrl":"[^"]*"' | cut -d'"' -f4)
                THUMBNAIL_URL=$(echo $STATUS_RESPONSE | grep -o '"thumbnailUrl":"[^"]*"' | cut -d'"' -f4)
                
                echo ""
                echo "📹 Résultats:"
                echo "   Video URL: $VIDEO_URL"
                echo "   Thumbnail: $THUMBNAIL_URL"
                echo "   Durée totale: ${ELAPSED_MIN}m ${ELAPSED_SEC}s"
                echo ""
                
                print_success "✅ PREMIÈRE VIDÉO GÉNÉRÉE AVEC SUCCÈS!"
                break
                ;;
            "failed")
                ERROR_MSG=$(echo $STATUS_RESPONSE | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
                print_error "Génération échouée: $ERROR_MSG"
                break
                ;;
            "processing")
                printf "\r⏳ En cours de génération... ${PROGRESS:-0}%% (${ELAPSED_MIN}m ${ELAPSED_SEC}s)"
                ;;
            "queued")
                printf "\r📋 En attente dans la queue... (${ELAPSED_MIN}m ${ELAPSED_SEC}s)"
                ;;
            *)
                printf "\r🔄 Status: $STATUS (${ELAPSED_MIN}m ${ELAPSED_SEC}s)"
                ;;
        esac
        
        if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
            break
        fi
        
        sleep $CHECK_INTERVAL
    done
    
else
    print_error "Échec du démarrage de la génération"
    echo "Réponse complète:"
    echo "$GENERATION_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$GENERATION_RESPONSE"
    
    # Vérifier les crédits après échec
    CREDITS_AFTER=$(curl -s -X GET "$API_BASE/credits" \
        -H "Authorization: Bearer $JWT_TOKEN" | grep -o '"balance":[0-9]*' | cut -d':' -f2)
    
    print_info "Crédits après échec: $CREDITS_AFTER"
fi

echo ""
echo "=========================================="
echo "🎬 Test de première vidéo terminé"
echo "Timestamp: $(date)"
echo "=========================================="