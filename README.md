# Position Share Bot v3.3 Event Fix

텔레그램 비공개 그룹에서 Bitget USDT Futures 포지션을 공유하는 봇입니다.

## v3.3 수정 사항

- 추가진입/부분청산 오탐 수정
- 수량이 변하지 않으면 알림을 보내지 않음
- 증거금, 현재가, 미실현손익만 변하는 경우는 조용히 상태만 갱신
- `추가 수량: 0`, `축소 수량: 0` 알림 방지
- 중복 알림 방지 유지
- `/status` UI는 v3.2 형태 유지

## 배포

GitHub 루트에 이 ZIP 안쪽 파일들을 올리고 Railway에서 재배포하세요.

필요 환경변수:

```
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
BITGET_API_KEY=
BITGET_API_SECRET=
BITGET_API_PASSPHRASE=
BITGET_PRODUCT_TYPE=USDT-FUTURES
SCAN_INTERVAL_MS=2000
```


## v3.4 multi-chat

- `TELEGRAM_CHAT_IDS` 지원 추가
- 예: `TELEGRAM_CHAT_IDS=-5321098136,-5461219317`
- 기존 `TELEGRAM_CHAT_ID`도 fallback으로 지원
- 명령어는 등록된 그룹에서만 응답
- 알림은 등록된 모든 그룹으로 전송
