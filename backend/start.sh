#!/usr/bin/env bash
set -e
PORT="${PORT:-10000}"
echo "Starting Shushi backend on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
