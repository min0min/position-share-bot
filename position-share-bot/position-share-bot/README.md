# Position Share Bot v1.4 + Phase 2

Bitget USDT Futures 포지션을 텔레그램 비공개 그룹에 공유하는 봇입니다.

## 포함 기능

- 신규 진입 알림
- 추가진입 알림
- 포지션 축소 알림
- 전체 청산 알림
- 시드 대비 비중 %
- 리스크 게이지
- 미실현손익 변화 업데이트
- `/status`, `/today`, `/week`, `/month`, `/history`, `/equity`, `/chatid`, `/help`

## Railway Variables

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
BITGET_API_KEY=
BITGET_API_SECRET=
BITGET_API_PASSPHRASE=
BITGET_PRODUCT_TYPE=USDT-FUTURES
BITGET_MARGIN_COIN=USDT
POLL_INTERVAL_MS=3000
PNL_UPDATE_INTERVAL_MS=60000
PNL_UPDATE_THRESHOLD_USDT=5
TIMEZONE=Asia/Seoul
```

기존에 `BITGET_SECRET_KEY`, `BITGET_PASSPHRASE`로 넣어도 코드에서 자동 인식합니다.

## 실행

```bash
npm install
npm run build
npm run start
```

## 주의

Bitget API는 Read-only만 사용하세요. 출금 권한은 절대 켜지 마세요.
