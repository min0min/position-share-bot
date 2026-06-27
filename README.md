# Position Share Bot v3.2 FINAL

실사용형 텔레그램 포지션 공유봇입니다.

## 핵심 반영
- /status는 기존처럼 요약 + 종목별 메시지 분리
- 종목명은 H/O가 아니라 HUSDT/OUSDT처럼 전체 심볼 표기
- 신규진입 / 추가진입 / 부분청산 / 익절 / 손절 이벤트 알림
- 단순 홀딩 중 반복 업데이트 없음
- 중복 알림 방지 쿨다운 적용
- 마크가 대신 현재가 표기

## Railway Variables
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
- BITGET_API_KEY
- BITGET_API_SECRET 또는 BITGET_SECRET_KEY
- BITGET_API_PASSPHRASE 또는 BITGET_PASSPHRASE
- BITGET_PRODUCT_TYPE=USDT-FUTURES
- BITGET_MARGIN_COIN=USDT
