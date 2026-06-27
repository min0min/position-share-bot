# Position Share Bot v3.0 FINAL

텔레그램 비공개 그룹에서 Bitget USDT Futures 포지션을 공유하는 봇입니다.

## 포함 기능

- Bitget API 연결
- Telegram 그룹 알림
- `/status`, `/today`, `/week`, `/month`, `/history`, `/equity`, `/help`
- 신규 진입 알림
- 추가진입 알림
- 부분청산/포지션 축소 알림
- 전체청산 알림
- 손절/익절 UI 분리
- 홀딩 중 단순 PnL 변화 반복 알림 없음
- LONG: 🟢📈 / SHORT: 🔴📉
- `마크가` 대신 `현재가` 표기
- 카드형 텔레그램 UI

## Railway Variables

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
BITGET_API_KEY=
BITGET_API_SECRET=
BITGET_API_PASSPHRASE=
BITGET_PRODUCT_TYPE=USDT-FUTURES
BITGET_MARGIN_COIN=USDT
SCAN_INTERVAL_MS=2000
```

기존 변수명 `BITGET_SECRET_KEY`, `BITGET_PASSPHRASE`도 호환됩니다.

## GitHub 업로드

기존 파일을 전부 지우고 이 ZIP을 푼 안쪽 파일들을 루트에 올리세요.

정상 구조:

```text
src/
package.json
package-lock.json 또는 없음
tsconfig.json
README.md
.env.example
```

잘못된 구조:

```text
position-share-bot-v3-final/src/
position-share-bot-v2_3-final/
position-share-bot/
```
