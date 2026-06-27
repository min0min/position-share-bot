# Position Share Bot v1

Bitget USDT futures position changes -> Telegram group alerts.

## Features
- 신규 진입 알림
- 추가진입 알림
- 부분축소 알림
- 전체청산 알림
- 전체 시드 대비 포지션 비중 %
- 비중 게이지
- `/status`, `/today`, `/week`, `/month`, `/help`, `/chatid`

## Railway deploy
1. GitHub에 이 폴더 업로드
2. Railway > New Project > Deploy from GitHub
3. Variables에 `.env.example` 값 입력
4. 첫 실행 후 텔레그램 그룹에서 `/chatid` 입력
5. Railway 로그에 나온 chat_id를 `TELEGRAM_CHAT_ID`에 넣고 재배포

## Safety
Bitget API는 Read-only만 사용하세요. Withdraw 권한은 절대 켜지 마세요.
