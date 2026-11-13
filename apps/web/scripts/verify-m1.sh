#!/usr/bin/env bash
#
# Manual M1 end-to-end verification (cahier des charges, group 8.1).
#
# Prerequisites: the dev server must be running (npm run dev in apps/web).
# The script creates its own fresh records (prefixed "M1 Verify") and
# checks that balances are coherent after the full flow:
#   CHF account → fixed charge → transfer phase 1 → phase 2 → balances.
#
# Usage: scripts/verify-m1.sh [baseUrl]
#   baseUrl defaults to http://localhost:3000

set -euo pipefail

BASE="${1:-http://localhost:3000}"
FAILURES=0

# assert_eq <label> <expected> <actual>
assert_eq() {
  if [ "$2" = "$3" ]; then
    echo "PASS $1 ($3)"
  else
    echo "FAIL $1 — expected $2, got $3"
    FAILURES=$((FAILURES + 1))
  fi
}

status_of() {
  curl -s -o /dev/null -w '%{http_code}' "$@"
}

# account_balance <accountId> <openingBalance> — computed like the UI does
# (opening balance + signed transactions), through /api/transactions.
account_balance() {
  curl -s "$BASE/api/transactions?limit=500" | python3 -c "
import json,sys
rows=json.load(sys.stdin)['data']
print(round(sum(t['amount'] for t in rows if t['accountId']=='$1') + $2, 2))"
}

echo "== 0. Server reachable =="
assert_eq "GET /api/members" "200" "$(status_of "$BASE/api/members")"

echo "== 1. CHF source account (opening 5000 CHF) =="
source_id=$(curl -s -X POST "$BASE/api/accounts" -H "Content-Type: application/json" \
  -d '{"name":"M1 Verify CHF","currency":"CHF","accountType":"CURRENT","openingBalance":5000}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
assert_eq "source account readable" "200" "$(status_of "$BASE/api/accounts/$source_id")"

echo "== 2. EUR target account =="
target_id=$(curl -s -X POST "$BASE/api/accounts" -H "Content-Type: application/json" \
  -d '{"name":"M1 Verify EUR","currency":"EUR","accountType":"SAVINGS","openingBalance":0}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
assert_eq "target account readable" "200" "$(status_of "$BASE/api/accounts/$target_id")"

echo "== 3. Fixed recurring charge on the source account =="
charge_id=$(curl -s -X POST "$BASE/api/charges" -H "Content-Type: application/json" \
  -d "{\"label\":\"M1 Verify Loyer\",\"type\":\"FIXED_RECURRING\",\"amount\":1800,\"currency\":\"CHF\",\"accountId\":\"$source_id\",\"category\":\"Logement\",\"startDate\":\"2026-11-01\",\"endDate\":null,\"frequency\":\"monthly\",\"installments\":null,\"provisioned\":false}" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
assert_eq "charge readable" "200" "$(status_of "$BASE/api/charges/$charge_id")"

echo "== 4. Transfer phase 1 (ESTIMATED, debit on source) =="
transfer_id=$(curl -s -X POST "$BASE/api/transfers" -H "Content-Type: application/json" \
  -d "{\"sourceAccountId\":\"$source_id\",\"targetAccountId\":\"$target_id\",\"amountSent\":1500,\"rateEstimated\":1.0634,\"rateDate\":\"2026-11-12\",\"sentAt\":\"2026-11-12\",\"memo\":null}" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
transfer_status=$(curl -s "$BASE/api/transfers/$transfer_id" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['status'])")
assert_eq "transfer status ESTIMATED" "ESTIMATED" "$transfer_status"

# Charges do NOT create transactions in M1 (payments only); the debit
# from phase 1 does. Source = 5000 - 1500 = 3500.
assert_eq "source balance after phase 1 (5000 - 1500)" "3500" \
  "$(account_balance "$source_id" 5000)"

echo "== 5. Transfer phase 2 (COMPLETED, credit on target) =="
curl -s -o /dev/null -X PATCH "$BASE/api/transfers/$transfer_id" -H "Content-Type: application/json" \
  -d '{"amountReceived":1403.6,"receivedAt":"2026-11-13"}'
transfer_status=$(curl -s "$BASE/api/transfers/$transfer_id" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['status'])")
assert_eq "transfer status COMPLETED" "COMPLETED" "$transfer_status"

assert_eq "target balance after phase 2 (+1403.60)" "1403.6" \
  "$(account_balance "$target_id" 0)"

echo "== 6. Phase 2 replay rejected with 409 =="
assert_eq "replay PATCH returns 409" "409" \
  "$(status_of -X PATCH "$BASE/api/transfers/$transfer_id" -H 'Content-Type: application/json' -d '{"amountReceived":100,"receivedAt":"2026-11-14"}')"

echo
if [ "$FAILURES" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
else
  echo "$FAILURES CHECK(S) FAILED"
  exit 1
fi
