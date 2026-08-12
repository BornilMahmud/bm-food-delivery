#!/usr/bin/env bash
set -euo pipefail
BASE='https://firestore.googleapis.com/v1/projects/bm-food-d04b1/databases/(default)/documents'
run_query() {
  local name="$1"
  local body="$2"
  local out="/tmp/bm-food-${name}.json"
  local status
  status=$(curl -sS -o "$out" -w '%{http_code}' -X POST -H 'Content-Type: application/json' "${BASE}:runQuery" -d "$body")
  local count
  count=$(grep -o '"document"' "$out" | wc -l | tr -d ' ')
  printf '%s status=%s documents=%s\n' "$name" "$status" "$count"
}
run_query restaurants '{"structuredQuery":{"from":[{"collectionId":"restaurants"}],"where":{"fieldFilter":{"field":{"fieldPath":"status"},"op":"EQUAL","value":{"stringValue":"active"}}}}}'
run_query categories '{"structuredQuery":{"from":[{"collectionId":"categories"}],"where":{"fieldFilter":{"field":{"fieldPath":"isActive"},"op":"EQUAL","value":{"booleanValue":true}}}}}'
run_query foods '{"structuredQuery":{"from":[{"collectionId":"foods"}],"where":{"fieldFilter":{"field":{"fieldPath":"isAvailable"},"op":"EQUAL","value":{"booleanValue":true}}}}}'
run_query banners '{"structuredQuery":{"from":[{"collectionId":"banners"}],"where":{"fieldFilter":{"field":{"fieldPath":"isActive"},"op":"EQUAL","value":{"booleanValue":true}}}}}'
run_query reviews '{"structuredQuery":{"from":[{"collectionId":"reviews"}],"where":{"fieldFilter":{"field":{"fieldPath":"isVisible"},"op":"EQUAL","value":{"booleanValue":true}}},"limit":3}}'
for path in 'settings/general' 'homepageCollections/todays'; do
  out="/tmp/bm-food-${path//\//-}.json"
  status=$(curl -sS -o "$out" -w '%{http_code}' "${BASE}/${path}")
  printf '%s status=%s\n' "$path" "$status"
done
