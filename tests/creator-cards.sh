#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass=0
fail=0

function assert() {
  local name="$1"
  local expected_status="$2"
  local expected_code="$3"
  local actual_status="$4"
  local actual_body="$5"

  local actual_code
  actual_code=$(echo "$actual_body" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("code",""))' 2>/dev/null || echo "")

  if [[ "$actual_status" == "$expected_status" && "$actual_code" == "$expected_code" ]]; then
    echo -e "${GREEN}PASS${NC}: $name (status=$actual_status, code=$actual_code)"
    ((pass++)) || true
  else
    echo -e "${RED}FAIL${NC}: $name"
    echo "  expected: status=$expected_status code=$expected_code"
    echo "  actual:   status=$actual_status code=$actual_code"
    echo "  body:     $actual_body"
    ((fail++)) || true
  fi
}

function assert_status_only() {
  local name="$1"
  local expected_status="$2"
  local actual_status="$3"
  local actual_body="$4"

  if [[ "$actual_status" == "$expected_status" ]]; then
    echo -e "${GREEN}PASS${NC}: $name (status=$actual_status)"
    ((pass++)) || true
  else
    echo -e "${RED}FAIL${NC}: $name"
    echo "  expected: status=$expected_status"
    echo "  actual:   status=$actual_status"
    echo "  body:     $actual_body"
    ((fail++)) || true
  fi
}

# Test 1: Full creation
echo "=== Test 1: Full creation ==="
resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/creator-cards" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "George Cooks",
    "description": "Weekly cooking podcast",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "links": [{"title": "YouTube", "url": "https://youtube.com/@georgecooks"}],
    "service_rates": {
      "currency": "NGN",
      "rates": [{"name": "IG Story Post", "description": "One story mention", "amount": 5000000}]
    },
    "status": "published"
  }')
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert_status_only "Test 1 - Full creation" "200" "$status" "$body"

# Test 2: Slug auto-generation
echo "=== Test 2: Slug auto-generation ==="
resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/creator-cards" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ada Designs Things",
    "creator_reference": "crt_a1b2c3d4e5f6g7h8",
    "status": "published"
  }')
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert_status_only "Test 2 - Slug auto-generation" "200" "$status" "$body"
slug_ada=$(echo "$body" | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["slug"])' 2>/dev/null || echo "")
echo "  generated slug: $slug_ada"

# Test 3: Private card creation
echo "=== Test 3: Private card creation ==="
resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/creator-cards" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "VIP Rate Card",
    "creator_reference": "crt_x9y8z7w6v5u4t3s2",
    "status": "published",
    "access_type": "private",
    "access_code": "A1B2C3"
  }')
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert_status_only "Test 3 - Private card creation" "200" "$status" "$body"

# Test 4: Retrieve public published card
echo "=== Test 4: Retrieve public published card ==="
resp=$(curl -s -w "\n%{http_code}" "$BASE_URL/creator-cards/george-cooks")
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert_status_only "Test 4 - Retrieve public card" "200" "$status" "$body"

# Test 5: Retrieve private card with correct pin
echo "=== Test 5: Retrieve private card with correct pin ==="
resp=$(curl -s -w "\n%{http_code}" "$BASE_URL/creator-cards/vip-rate-card?access_code=A1B2C3")
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert_status_only "Test 5 - Private card correct pin" "200" "$status" "$body"

# Test 6: Delete a card
echo "=== Test 6: Delete a card ==="
resp=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/creator-cards/$slug_ada" \
  -H "Content-Type: application/json" \
  -d '{"creator_reference": "crt_a1b2c3d4e5f6g7h8"}')
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert_status_only "Test 6 - Delete card" "200" "$status" "$body"

# Test 7: Duplicate slug
echo "=== Test 7: Duplicate slug ==="
resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/creator-cards" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Another George",
    "slug": "george-cooks",
    "creator_reference": "crt_m1n2b3v4c5x6z7l8",
    "status": "published"
  }')
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert "Test 7 - Duplicate slug" "400" "SL02" "$status" "$body"

# Test 8: Missing access_code on private card
echo "=== Test 8: Missing access_code on private card ==="
resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/creator-cards" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Secret Card",
    "creator_reference": "crt_q1w2e3r4t5y6u7i8",
    "status": "published",
    "access_type": "private"
  }')
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert "Test 8 - Missing access_code" "400" "AC01" "$status" "$body"

# Test 9: access_code on public card
echo "=== Test 9: access_code on public card ==="
resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/creator-cards" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Public Card",
    "creator_reference": "crt_q1w2e3r4t5y6u7i8",
    "status": "published",
    "access_type": "public",
    "access_code": "A1B2C3"
  }')
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert "Test 9 - access_code on public" "400" "AC05" "$status" "$body"

# Test 10: Framework validation failure
echo "=== Test 10: Framework validation failure ==="
resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/creator-cards" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bad Status Card",
    "creator_reference": "crt_q1w2e3r4t5y6u7i8",
    "status": "archived"
  }')
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert_status_only "Test 10 - Framework validation" "400" "$status" "$body"

# Test 11: Non-existent card
echo "=== Test 11: Non-existent card ==="
resp=$(curl -s -w "\n%{http_code}" "$BASE_URL/creator-cards/does-not-exist-123")
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert "Test 11 - Non-existent card" "404" "NF01" "$status" "$body"

# Test 12: Draft card
echo "=== Test 12: Draft card ==="
curl -s -X POST "$BASE_URL/creator-cards" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Draft Card",
    "slug": "my-draft-card",
    "creator_reference": "crt_d1e2f3g4h5i6j7k8",
    "status": "draft"
  }' > /dev/null
resp=$(curl -s -w "\n%{http_code}" "$BASE_URL/creator-cards/my-draft-card")
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert "Test 12 - Draft card" "404" "NF02" "$status" "$body"

# Test 13: Private without pin
echo "=== Test 13: Private without pin ==="
resp=$(curl -s -w "\n%{http_code}" "$BASE_URL/creator-cards/vip-rate-card")
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert "Test 13 - Private without pin" "403" "AC03" "$status" "$body"

# Test 14: Wrong pin
echo "=== Test 14: Wrong pin ==="
resp=$(curl -s -w "\n%{http_code}" "$BASE_URL/creator-cards/vip-rate-card?access_code=WRONG1")
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert "Test 14 - Wrong pin" "403" "AC04" "$status" "$body"

# Test 15: Delete non-existent card
echo "=== Test 15: Delete non-existent card ==="
resp=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/creator-cards/does-not-exist-123" \
  -H "Content-Type: application/json" \
  -d '{"creator_reference": "crt_q1w2e3r4t5y6u7i8"}')
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert "Test 15 - Delete non-existent" "404" "NF01" "$status" "$body"

# Test 16: Retrieve deleted card
echo "=== Test 16: Retrieve deleted card ==="
resp=$(curl -s -w "\n%{http_code}" "$BASE_URL/creator-cards/$slug_ada")
status=$(echo "$resp" | tail -1)
body=$(echo "$resp" | sed '$d')
assert "Test 16 - Retrieve deleted card" "404" "NF01" "$status" "$body"

echo ""
echo "=============================="
echo "Passed: $pass"
echo "Failed: $fail"
echo "=============================="

if [[ $fail -gt 0 ]]; then
  exit 1
fi
