# Position Share Bot v2.0-3

Bitget USDT Futures 포지션을 Telegram 비공개 그룹에 공유하는 봇입니다.

## v2.0-3 반영

- 신규 진입 / 추가진입 / 포지션 축소 / 전체청산 감지 안정화
- 재배포 직후 불필요한 미실현손익 업데이트 스팸 방지
- /positions 별칭 추가
- /resetstate 저장 기록 초기화 명령어 추가
- /status 메시지에 전체 리스크 라벨 추가
- 미실현손익 업데이트에 리스크 라벨 추가

## 필수 환경변수

TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
BITGET_API_KEY
BITGET_API_SECRET 또는 BITGET_SECRET_KEY
BITGET_API_PASSPHRASE 또는 BITGET_PASSPHRASE
BITGET_PRODUCT_TYPE=USDT-FUTURES

## 선택 환경변수

POLL_INTERVAL_MS=3000
PNL_UPDATE_INTERVAL_MS=60000
PNL_UPDATE_THRESHOLD_USDT=5
TELEGRAM_ALLOWED_USER_IDS=텔레그램유저ID,텔레그램유저ID
