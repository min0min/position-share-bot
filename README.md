# Position Share Bot v2.1 UI Perfect

반영 내용:
- LONG: 🟢📈 / SHORT: 🔴📉 표시
- 마크가 문구 제거, 현재가로 표기
- 현재 포지션 Dashboard 카드형 UI 개선
- 신규진입 / 추가진입 / 부분청산 / 전체청산 / 손절 알림 UI 개선
- 손절 시 손절 금액 표기
- 기본 스캔 주기 2초, PnL 업데이트 30초/2USDT 기준

배포:
1. 기존 GitHub 파일 덮어쓰기
2. Commit
3. Railway 자동 배포
4. /status 테스트

선택 변수:
- POLL_INTERVAL_MS=2000
- PNL_UPDATE_INTERVAL_MS=30000
- PNL_UPDATE_THRESHOLD_USDT=2
