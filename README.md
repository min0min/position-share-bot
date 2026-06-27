# Position Share Bot v3.1 Simple Final

복잡한 카드형 UI를 버리고, 텔레그램에서 바로 읽기 편한 실사용형 UI로 정리한 버전입니다.

## 핵심
- /status: 요약 1개 + 종목별 메시지 분리
- 홀딩 중 단순 업데이트 알림 중지
- 신규진입 / 추가진입 / 부분청산 / 전체청산 / 손절 / 익절 이벤트 때만 알림
- LONG: 🟢📈, SHORT: 🔴📉
- 마크가 대신 현재가 표기
- 손절/익절 금액 표시
- 보유시간은 Bitget 포지션 openTime/cTime이 있으면 반영

## Railway 변수
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
- BITGET_API_KEY
- BITGET_API_SECRET
- BITGET_API_PASSPHRASE
- BITGET_PRODUCT_TYPE=USDT-FUTURES
