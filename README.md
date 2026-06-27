# Position Share Bot v2.0-4

Bitget Futures 포지션 공유 텔레그램 봇.

## v2.0-4 변경사항

- `/today`, `/week`, `/month`가 봇 내부 기록이 아니라 Bitget 과거 포지션 히스토리를 조회합니다.
- `/history`가 Bitget 최근 30일 청산 기록 기준으로 표시됩니다.
- 실현손익은 `netProfit` 기준으로 집계합니다.
- 수수료, 펀딩, 총 PnL도 함께 표시합니다.

## 명령어

- `/status` 현재 포지션
- `/positions` 현재 포지션 alias
- `/today` 오늘 청산 손익
- `/week` 최근 7일 청산 손익
- `/month` 최근 30일 청산 손익
- `/history` Bitget 최근 30일 청산 10개
- `/equity` 계좌 Equity 요약
- `/help` 도움말

## Railway Variables

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `BITGET_API_KEY`
- `BITGET_API_SECRET`
- `BITGET_API_PASSPHRASE`
- `BITGET_PRODUCT_TYPE=USDT-FUTURES`
