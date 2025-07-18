#!/bin/bash

# Variables
API_URL="http://localhost:3001/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODc4ZmI2MDdhMWEwNjdlZGEzODhjYWEiLCJlbWFpbCI6Im1heGltZUBlbWFpbC5jb20iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUyODMwMTQ3LCJleHAiOjE3NTI4MzM3NDd9.0GhRKQjH7wZJOUfvxTe8BqTySS4kFunPYuNed4JE8ts"

echo "=== Test API Crédits ==="

echo "1. Test solde actuel..."
curl -s -X GET "$API_URL/credits" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n2. Test consommation crédits..."
curl -s -X POST "$API_URL/credits/consume" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":2,"reason":"Test génération vidéo"}' | jq

echo -e "\n3. Test historique..."
curl -s -X GET "$API_URL/credits/history?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n=== Tests terminés ==="