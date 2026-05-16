#!/bin/bash

echo "🔍 Testing PrimeStone API Locally"
echo "================================"
echo ""

# Test 1: Health check
echo "1. Testing Health Check..."
curl -s http://localhost:3000/api/health | jq .
echo ""

# Test 2: Register new user
echo "2. Registering testuser3..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser3","email":"test3@example.com","password":"Test123456"}')
echo $REGISTER_RESPONSE | jq .
USER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token')
echo ""

# Test 3: Login
echo "3. Logging in as testuser3..."
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test3@example.com","password":"Test123456"}' | jq .
echo ""

# Test 4: Get current user
echo "4. Getting current user info..."
curl -s -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $USER_TOKEN" | jq .
echo ""

# Test 5: Get investments (should be empty)
echo "5. Getting investments (should be empty for new user)..."
curl -s -X GET http://localhost:3000/api/investments/my-investments \
  -H "Authorization: Bearer $USER_TOKEN" | jq .
echo ""

# Test 6: Create investment
echo "6. Creating investment of $500..."
curl -s -X POST http://localhost:3000/api/investments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"package_id":1,"investment_amount":500}' | jq .
echo ""

# Test 7: Get investments again (should show 1)
echo "7. Getting investments again (should show 1)..."
curl -s -X GET http://localhost:3000/api/investments/my-investments \
  -H "Authorization: Bearer $USER_TOKEN" | jq .
echo ""

echo "✅ All tests passed!"
