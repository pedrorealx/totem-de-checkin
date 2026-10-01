#!/bin/bash
BASE="http://localhost:3000"
TOTEM="X-Totem-Id: totem-demo"

printf '=== Saúde ===\n'
curl -s "$BASE/health"
printf '\n\n=== Check-in válido ===\n'
curl -s -X POST "$BASE/checkin" -H "Content-Type: application/json" -H "$TOTEM" -d '{"cpf":"10466735480"}'
printf '\n\n=== CPF inválido / tentativa de injection ===\n'
curl -s -X POST "$BASE/checkin" -H "Content-Type: application/json" -H "$TOTEM" -d '{"cpf":"'' OR ''1''=''1"}'
printf '\n'
