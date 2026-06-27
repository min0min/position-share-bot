# Position Share Bot v2.0-1

Bitget USDT Futures 포지션을 텔레그램 비공개 그룹에 공유하는 봇입니다.

## v2.0-1 반영 기능

- `/status` 현재 포지션 상세 출력
- Equity / 총 증거금 / 총 비중 / 총 미실현손익 표시
- 포지션별 LONG/SHORT, 평균가, 마크가, 수량, 레버리지 표시
- 포지션별 시드 대비 비중 % + 게이지 표시
- 포지션별 미실현손익 및 ROI 표시
- 보유시간 표시

## Railway Variables

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
BITGET_API_KEY=
BITGET_API_SECRET=
BITGET_API_PASSPHRASE=
BITGET_PRODUCT_TYPE=USDT-FUTURES
BITGET_MARGIN_COIN=USDT
POLL_INTERVAL_MS=5000
PNL_UPDATE_INTERVAL_MS=300000
PNL_UPDATE_THRESHOLD_USDT=5
```

## 명령어

- `/status` 현재 포지션 상세
- `/today` 오늘 청산 손익
- `/week` 최근 7일 청산 손익
- `/month` 최근 30일 청산 손익
- `/history` 최근 청산 10개
- `/equity` 계좌 Equity 요약
- `/chatid` 현재 방 chat_id 확인


## v2.0-2
- 그룹에서 `/today@botusername` 형태로 들어오는 명령어까지 인식하도록 수정
- 명령어 수신 시 Railway 로그에 `[command]` 기록
- `/today`, `/week`, `/month`, `/history`, `/equity`, `/help` 응답 안정화
