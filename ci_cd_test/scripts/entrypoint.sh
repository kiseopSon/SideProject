#!/bin/sh
set -e
# DB 초기화 (없으면 생성)
node src/db/init.js
exec "$@"
