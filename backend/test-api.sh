#!/bin/bash

BASE_URL="http://localhost:3001/api"

echo "🧪 Tests de l'API Backend"
echo "========================="

# Test 1: Health check
echo "1. Test Health Check"
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test 2: Créer un utilisateur test
echo "2. Créer un utilisateur test"
curl -s -X POST "$BASE_URL/test/user" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Test",
    "email": "john.test@example.com",
    "password": "password123",
    "plan": "pro",
    "credits": 50
  }' | jq '.'
echo ""

# Test 3: Lister les utilisateurs
echo "3. Lister les utilisateurs"
curl -s "$BASE_URL/test/users?page=1&limit=5" | jq '.'
echo ""

# Test 4: Test de la base de données
echo "4. Test base de données"
curl -s "$BASE_URL/test/database" | jq '.'
echo ""

echo "✅ Tests terminés!"