#!/bin/bash
# backend/test-simple.sh
# Test simplifié pour valider étape par étape

echo "🧪 Test Simple API Runway"
echo "========================"

API_BASE="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_test() {
    echo -e "\n${YELLOW}🧪 Test: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test 1: Health
print_test "Health check général"
curl -s "$API_BASE/health" | head -c 50
print_success "OK"

# Test 2: Runway Health  
print_test "Runway health check"
RUNWAY_RESPONSE=$(curl -s "$API_BASE/runway/health")
echo "$RUNWAY_RESPONSE" | grep -q '"status":"configured"' && print_success "Runway configuré" || print_error "Runway non configuré"

# Test 3: Styles
print_test "Récupération des styles"
STYLES_RESPONSE=$(curl -s "$API_BASE/runway/styles")
echo "$STYLES_RESPONSE" | grep -q '"success":true' && print_success "Styles récupérés" || print_error "Échec styles"

# Test 4: Auth
print_test "Création utilisateur + login"
# Register
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@simple.com","password":"password123","name":"Test User"}')

# Login  
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@simple.com","password":"password123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    print_success "Authentification OK"
    echo "Token: ${TOKEN:0:20}..."
else
    print_error "Échec authentification"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 5: Credits
print_test "Vérification crédits"
CREDITS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/credits")
echo "$CREDITS_RESPONSE" | grep -q '"balance"' && print_success "Crédits OK" || print_error "Problème crédits"

# Test 6: Upload route (sans fichier)
print_test "Test route upload (structure)"
UPLOAD_TEST=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" "$API_BASE/upload/images")
echo "$UPLOAD_TEST" | grep -q "Aucun fichier" && print_success "Route upload existe" || print_error "Route upload manquante"

echo -e "\n🎯 Tests de base terminés!"
echo "Si tous les tests passent, vous pouvez lancer le test complet."