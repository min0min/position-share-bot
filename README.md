# Position Share Bot v2.3 Final

v2.2 Full UI + v2.3 Event-only notifications merged final build.

## 포함 기능

- Telegram Bot + Bitget USDT Futures API 연결
- `/status`, `/positions`, `/today`, `/week`, `/month`, `/history`, `/equity`, `/help`, `/chatid`, `/resetstate`
- 현재 포지션 상세 카드형 UI
- LONG: 🟢📈 / SHORT: 🔴📉
- 마크가 대신 현재가 표기
- 평균가, 현재가, 수량, 레버리지, 증거금, 시드 비중, 게이지, 손익, 보유시간 표시
- 신규 진입 알림
- 추가 진입 알림
- 부분 청산 알림
- 전체 청산 알림
- 손절/익절 알림 및 금액 표기
- 홀딩 중 단순 PnL/현재가 변화 반복 알림 중지
- 이벤트 발생 시에만 알림 발송

## Railway Variables

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
BITGET_API_KEY=
BITGET_API_SECRET=
BITGET_API_PASSPHRASE=
BITGET_PRODUCT_TYPE=USDT-FUTURES
```

## 배포

압축 해제 → GitHub 기존 파일 덮어쓰기 → Commit → Railway 재배포

## 참고

`/today`, `/week`, `/month`, `/history`는 Bitget 히스토리 API 조회를 우선 사용하며, 히스토리 API 응답이 없거나 권한/상품 타입 문제로 실패하면 봇 내부 감지 기록 기준으로 표시됩니다.
