#!/bin/bash
# test-elevenlabs.sh - Script de test pour ElevenLabs

echo "🎙️ Test ElevenLabs Audio Generation"
echo "=================================="

# Configuration
API_URL="http://localhost:3001/api"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODc4ZmI2MDdhMWEwNjdlZGEzODhjYWEiLCJlbWFpbCI6Im1heGltZUBlbWFpbC5jb20iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU0MzE1MjEwLCJleHAiOjE3NTQ5MjAwMTB9.1_B2g9QP6DaJOGjSsWiZ3p8EsPTIVu_5MXMlGN-id80"  # Remplacez par un vrai token

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test 1: Santé du service
test_service_health() {
    log_info "Test 1: Service Health Check"
    
    response=$(curl -s -X GET \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_URL/audio/health")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Service is healthy"
        echo "$response" | jq '.'
    else
        log_error "Service health check failed"
        echo "$response"
    fi
    echo ""
}

# Test 2: Liste des voix
test_available_voices() {
    log_info "Test 2: Available Voices"
    
    response=$(curl -s -X GET \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_URL/audio/voices")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Voices retrieved successfully"
        echo "$response" | jq '.data.voices[] | {name, language, gender, voice_id}'
    else
        log_error "Failed to get voices"
        echo "$response"
    fi
    echo ""
}

# Test 3: Estimation de coût
test_cost_estimation() {
    log_info "Test 3: Cost Estimation"
    
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "text": "Bonjour, ceci est un test de génération audio pour notre SaaS de création vidéo e-commerce."
        }' \
        "$API_URL/audio/estimate")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Cost estimation successful"
        echo "$response" | jq '.data'
    else
        log_error "Cost estimation failed"
        echo "$response"
    fi
    echo ""
}

# Test 4: Génération audio simple
test_simple_generation() {
    log_info "Test 4: Simple Audio Generation"
    
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "text": "Bonjour et bienvenue dans notre test de génération audio.",
            "voiceId": "FRENCH_FEMALE_1",
            "preset": "COMMERCIAL"
        }' \
        "$API_URL/audio/generate")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Audio generation successful"
        audio_url=$(echo "$response" | jq -r '.data.audioUrl')
        duration=$(echo "$response" | jq -r '.data.duration')
        credits=$(echo "$response" | jq -r '.data.creditsUsed')
        
        echo "Audio URL: $audio_url"
        echo "Duration: ${duration}s"
        echo "Credits used: $credits"
    else
        log_error "Audio generation failed"
        echo "$response"
    fi
    echo ""
}

# Test 5: Génération avec settings personnalisés
test_custom_settings() {
    log_info "Test 5: Custom Voice Settings"
    
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "text": "Ce test utilise des paramètres de voix personnalisés pour une meilleure qualité audio.",
            "voiceId": "ENGLISH_MALE_1",
            "settings": {
                "stability": 0.9,
                "similarity_boost": 0.8,
                "style": 0.3,
                "use_speaker_boost": true
            }
        }' \
        "$API_URL/audio/generate")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Custom settings generation successful"
        echo "$response" | jq '.data | {audioUrl, duration, creditsUsed, voiceUsed}'
    else
        log_error "Custom settings generation failed"
        echo "$response"
    fi
    echo ""
}

# Test 6: Preview (texte court)
test_preview() {
    log_info "Test 6: Audio Preview"
    
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "text": "Aperçu rapide de la voix.",
            "voiceId": "SPANISH_MALE_1"
        }' \
        "$API_URL/audio/preview")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Preview generation successful"
        echo "$response" | jq '.data'
    else
        log_error "Preview generation failed"
        echo "$response"
    fi
    echo ""
}

# Test 7: Test endpoint
test_builtin_test() {
    log_info "Test 7: Built-in Test Endpoint"
    
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "voiceId": "ENGLISH_FEMALE_1",
            "text": "This is an automated test of the ElevenLabs integration."
        }' \
        "$API_URL/audio/test")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Built-in test successful"
        echo "$response" | jq '.data'
    else
        log_error "Built-in test failed"
        echo "$response"
    fi
    echo ""
}

# Test 8: Métriques du service
test_metrics() {
    log_info "Test 8: Service Metrics"
    
    response=$(curl -s -X GET \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_URL/audio/metrics")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Metrics retrieved successfully"
        echo "$response" | jq '.data'
    else
        log_error "Failed to get metrics"
        echo "$response"
    fi
    echo ""
}

# Test de validation d'erreurs
test_validation_errors() {
    log_info "Test 9: Validation Errors"
    
    # Texte trop long
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "text": "'"$(printf 'A%.0s' {1..6000})"'",
            "voiceId": "ENGLISH_FEMALE_1"
        }' \
        "$API_URL/audio/generate")
    
    if echo "$response" | grep -q '"error"'; then
        log_success "Validation correctly rejected long text"
    else
        log_error "Validation should have rejected long text"
    fi
    
    # VoiceId manquant
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "text": "Test sans voiceId"
        }' \
        "$API_URL/audio/generate")
    
    if echo "$response" | grep -q '"error"'; then
        log_success "Validation correctly rejected missing voiceId"
    else
        log_error "Validation should have rejected missing voiceId"
    fi
    echo ""
}

# Fonction principale
main() {
    if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" = "your-jwt-token-here" ]; then
        log_error "Please set a valid AUTH_TOKEN in the script"
        echo "You can get a token by logging in and copying it from the browser dev tools"
        exit 1
    fi
    
    log_info "Starting ElevenLabs API tests..."
    echo "API URL: $API_URL"
    echo ""
    
    test_service_health
    test_available_voices
    test_cost_estimation
    test_simple_generation
    test_custom_settings
    test_preview
    test_builtin_test
    test_metrics
    test_validation_errors
    
    log_success "🎉 All tests completed!"
    echo ""
    echo "Next steps:"
    echo "1. Check the generated audio files in uploads/audio/"
    echo "2. Test audio playback in your frontend"
    echo "3. Integrate with your video generation pipeline"
    echo "4. Monitor credit usage and cache performance"
}

# Exécution
main "$@"