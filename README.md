# School SIS

학교용 **Student Information System (SIS)** 프로젝트입니다.  
단순 데모 페이지가 아니라, **계정/권한 관리**, **학생·교직원 포털**, **프로필 및 사진 관리**, **정보 변경 요청 승인**, **증명서 발급 기본 흐름**, **감사 로그**, **SSO 설정 기반**까지 포함한 운영형 베이스를 목표로 합니다.

코드 구조와 보안 규칙은 반드시 [AGENTS.md](./AGENTS.md)도 함께 참고하세요.

## 현재 포함된 기능

- 관리자
  - 계정 생성
  - 계정 관리 (상태 변경, 비밀번호 재설정, 삭제)
  - 학생/교직원 프로필 열람 및 수정
  - 프로필 사진 추가, 교체, 삭제
  - 저장하지 않은 변경 이탈 경고
  - 정보 변경 요청 검토
  - 로그인 시도 / 감사 로그 확인 (날짜·액션·계정별 필터)
  - SSO 제공자 설정 화면
- 학생 포털
  - 본인 정보 조회
  - 정보 변경 요청
  - 증명서 요청 기본 흐름
- 교직원 포털
  - 배정된 학생 조회
  - 교직원 목록 조회
  - 세그멘테이션 설정 기본 흐름
- 공통
  - 세션 기반 인증 (서버사이드 DB 세션)
  - Argon2id 비밀번호 해시
  - AES-256-GCM 기반 개인정보 섹션 암호화
  - HMAC-SHA256 이메일 인덱싱 (평문 노출 없음)
  - CSRF 보호
  - 감사 로그
  - PostgreSQL + Prisma 마이그레이션 기반 개발 흐름

## 기술 스택

| 항목 | 내용 |
| --- | --- |
| Framework | Next.js 15 App Router |
| Language | TypeScript strict |
| DB | PostgreSQL 16+ |
| ORM | Prisma 6 |
| Auth | Session cookie + DB session |
| Password | Argon2id |
| Encryption | AES-256-GCM (`PersonSection`) |
| Test | Vitest, Playwright |

---

## 처음 클론해서 실행하는 방법

### 사전 준비

아래가 모두 설치되어 있어야 합니다.

- `git`
- `node` 22 이상 (`.nvmrc` 기준 Node 22)
- `npm`
- `PostgreSQL` 16 이상 — **CLI 도구(`psql`, `createdb`)도 PATH에 있어야 합니다**
- `openssl`

확인:

```bash
git --version
node -v          # v22.x.x 권장
npm -v
psql --version   # PostgreSQL 클라이언트 CLI
createdb --version
openssl version
```

> `psql`과 `createdb`는 PostgreSQL 설치 시 함께 제공됩니다.  
> macOS(Homebrew): `brew install postgresql@16`  
> Ubuntu/Debian: `sudo apt install postgresql-client`  
> 이 두 명령이 PATH에 없으면 `npm run db:migrate`가 실패합니다.

---

### 1. 저장소 받기

```bash
git clone <REPO_URL>
cd SIS_Develop
```

### 2. 패키지 설치

```bash
npm install
```

### 3. `.env` 만들기

```bash
cp .env.example .env
```

그런 다음 아래 명령으로 키 4개를 생성해서 `.env`에 채웁니다.  
**이 단계를 건너뛰면 앱이 시작되지 않습니다.**

```bash
printf 'PERSON_DATA_KEY_BASE64="%s"\n' "$(openssl rand -base64 32)"
printf 'PII_INDEX_KEY_BASE64="%s"\n'   "$(openssl rand -base64 32)"
printf 'JWT_ACCESS_SECRET="%s"\n'      "$(openssl rand -base64 48)"
printf 'JWT_REFRESH_SECRET="%s"\n'     "$(openssl rand -base64 48)"
```

각 출력값을 `.env`의 해당 항목에 붙여넣으면 됩니다.

> **중요:** `PERSON_DATA_KEY_BASE64`와 `PII_INDEX_KEY_BASE64`는 반드시 직접 생성한 값을 사용해야 합니다.  
> 빈 값(`""`)이거나 기본값 그대로면 앱 시작 시 즉시 종료되며 아래와 같은 오류가 나타납니다.
> ```
> Error: PERSON_DATA_KEY_BASE64 must be a valid base64-encoded 32-byte key
> ```
> DB 연결 문제처럼 보일 수 있지만 실제로는 키 누락 문제입니다.

완성된 `.env` 예시:

```env
DATABASE_URL="postgresql://127.0.0.1:5432/sis_mvp_dev?schema=public"
SECURE_COOKIES=false
PERSON_DATA_KEY_BASE64="<openssl rand -base64 32 출력값>"
PII_INDEX_KEY_BASE64="<openssl rand -base64 32 출력값>"
JWT_ACCESS_SECRET="<openssl rand -base64 48 출력값>"
JWT_REFRESH_SECRET="<openssl rand -base64 48 출력값>"
```

---

## PostgreSQL 셋업

이 프로젝트는 SQLite가 아닌 **PostgreSQL 전용**입니다.

### 기본 전제 (로컬)

- PostgreSQL 서버가 로컬에서 실행 중
- `127.0.0.1:5432` 접속 가능
- 현재 OS 사용자가 DB 생성 권한 보유 (`CREATEDB` 권한)

이 전제가 맞으면 `.env.example` 기본 `DATABASE_URL` 그대로 동작합니다.

### DATABASE_URL에 사용자/비밀번호 지정

기본 `DATABASE_URL`에는 사용자명과 비밀번호가 없습니다. 비밀번호를 설정한 PostgreSQL이거나 Linux 환경이라면 인증 실패가 납니다. 이 경우 명시적으로 지정하세요.

```env
DATABASE_URL="postgresql://postgres:비밀번호@127.0.0.1:5432/sis_mvp_dev?schema=public"
```

또는 스크립트 환경변수로 제공할 수도 있습니다.

```bash
export SIS_POSTGRES_USER=postgres
export SIS_POSTGRES_PASSWORD=postgres
export SIS_POSTGRES_HOST=127.0.0.1
export SIS_POSTGRES_PORT=5432
```

### Linux에서 pg_hba.conf 인증 오류

Linux 기본 설치에서 `peer` 인증이 설정된 경우 OS 사용자명과 DB 사용자명이 일치해야 연결됩니다. 불일치하면 아래 오류가 납니다.

```
FATAL: Peer authentication failed for user "postgres"
```

해결 방법 중 하나: `/etc/postgresql/16/main/pg_hba.conf`에서 로컬 연결을 `peer` 대신 `md5` 또는 `trust`로 변경 후 PostgreSQL 재시작. 또는 현재 OS 사용자명과 동일한 DB 사용자를 사용하세요.

### DB 생성 권한 없음

`npm run db:migrate`가 내부적으로 `createdb` 명령을 실행합니다. DB 사용자에게 `CREATEDB` 권한이 없으면 실패합니다.

```sql
-- psql에서 권한 부여
ALTER ROLE 사용자명 CREATEDB;
```

---

### 4. Prisma client 생성

```bash
npm run db:generate
```

### 5. 개발용 DB 생성 + 마이그레이션 적용

```bash
npm run db:migrate
```

이 명령은:

1. `psql`로 개발용 DB(`sis_mvp_dev`) 존재 여부 확인
2. 없으면 `createdb`로 생성
3. `prisma migrate dev`로 마이그레이션 적용

`psql`이나 `createdb`가 PATH에 없으면 이 단계에서 실패합니다.

### 6. 시드 데이터 넣기

```bash
npm run db:seed
```

이 단계를 건너뛰면 로그인용 샘플 계정이 없습니다.

### 7. 개발 서버 실행

```bash
npm run dev
```

접속 주소:

- 관리자: [http://127.0.0.1:3000/admin/login](http://127.0.0.1:3000/admin/login)
- 학생: [http://127.0.0.1:3000/studentportal/login](http://127.0.0.1:3000/studentportal/login)
- 교직원: [http://127.0.0.1:3000/staffportal/login](http://127.0.0.1:3000/staffportal/login)

---

## 샘플 계정

`npm run db:seed` 이후 바로 사용할 수 있습니다.

| 역할 | loginId | password |
| --- | --- | --- |
| Admin | `admin` | `AdminDemo#1` |
| Student | `studentdemo` | `StudentDemo#1` |
| Staff | `staffdemo` | `StaffDemo#1` |

---

## 개발 서버 관련 사항

```bash
npm run dev        # 기본 개발 서버
npm run dev:turbo  # Turbopack으로 실행 (빠르지만 간헐적 불안정)
npm run dev:clean  # .next 등 빌드 캐시 삭제 후 재시작
```

개발 서버가 꼬이거나 `internal server error`가 반복될 때는 `npm run dev:clean`으로 대부분 복구됩니다.

---

## 자주 쓰는 명령

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run dev:turbo` | Turbopack으로 개발 서버 실행 |
| `npm run dev:clean` | 빌드 캐시 삭제 후 dev 재시작 |
| `npm run build` | production 빌드 |
| `npm run test` | 단위 + 통합 테스트 |
| `npm run test:e2e` | Playwright E2E 테스트 |
| `npm run db:generate` | Prisma client 생성 |
| `npm run db:migrate` | 개발 DB 생성 보장 + 마이그레이션 적용 |
| `npm run db:deploy` | 커밋된 마이그레이션만 적용 (운영 배포용) |
| `npm run db:seed` | 시드 삽입 |
| `npm run db:wipe-dev` | 개발 DB 초기화 후 마이그레이션/시드 재적용 |
| `npm run clean:dev` | 로컬 개발 산출물과 dev/test DB를 거의 초기 상태로 정리 |
| `npm run check:mutation-audit` | 쓰기 API 감사 로그 누락 검사 |
| `npm run db:reencrypt-pii` | 키 로테이션 후 전체 PII 재암호화 |

---

## 테스트

### 단위 + 통합

```bash
npm run test
```

통합 테스트는 별도 PostgreSQL DB(`sis_mvp_integration`)를 사용합니다. `npm run db:migrate`를 먼저 실행한 환경이어야 합니다.

### E2E

처음 한 번만:

```bash
npm run playwright:install
```

그 다음:

```bash
npm run test:e2e
```

---

## 암호화 키 로테이션

운영 중 `PERSON_DATA_KEY_BASE64`를 교체해야 할 때(키 유출 의심, 주기적 교체 등) 아래 절차를 따릅니다.

1. **DB 백업** — 재암호화 전 반드시 먼저
2. **앱 서버 중단** — 재암호화 중 새 데이터 쓰기 방지
3. **`.env` 수정**
   ```env
   PERSON_DATA_KEY_BASE64="<새로 생성한 키: openssl rand -base64 32>"
   PERSON_DATA_KEY_PREV_BASE64="<기존 키>"
   ```
4. **재암호화 실행**
   ```bash
   npm run db:reencrypt-pii
   ```
   실행 시 처리할 레코드 수를 보여주고 `reencrypt` 입력을 요구합니다. 실패하면 자동 롤백됩니다.
5. **앱 기동 후 정상 동작 확인** (로그인, 프로필 조회 등)
6. **확인 후** `.env`에서 `PERSON_DATA_KEY_PREV_BASE64` **제거**
   > 확인 전에 제거하면 구 키로 암호화된 데이터를 복호화할 수 없습니다.

---

## 운영 배포 시 주의사항

### TRUST_PROXY 설정 (필수)

nginx, AWS ALB, Cloudflare 등 리버스 프록시 뒤에서 실행할 경우 반드시 설정해야 합니다.

```env
TRUST_PROXY="1"
```

이 값이 없으면 모든 요청의 IP가 `"unknown"`으로 기록되어 **로그인·비밀번호 재설정의 IP 기반 rate limit이 동작하지 않습니다.** 단, 앱이 인터넷에 직접 노출되는 경우(프록시 없음)에는 설정하지 마세요.

### HTTPS 환경

```env
SECURE_COOKIES=true
```

HTTPS 배포 시 반드시 `true`로 설정해야 세션 쿠키에 `Secure` 플래그가 붙습니다.

---

## 초기화/복구 명령

### 개발 DB를 완전히 다시 만들고 싶을 때

```bash
npm run db:wipe-dev
```

개발용 DB drop → create → 마이그레이션 → 시드를 한 번에 수행합니다.  
실행 전 dev 서버(포트 3000)를 먼저 종료하세요.

### 로컬 상태를 새 클론처럼 만들고 싶을 때

```bash
npm run clean:dev
```

`node_modules`, `.next`, `.sis-dev`, 로컬 dev/test DB 등을 정리합니다. 이후 처음 셋업 순서대로 다시 진행하세요.

```bash
npm install
cp .env.example .env
# .env에 키 채우기
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

---

## 문제 해결

### DB 연결 인증 실패

가장 흔한 원인 세 가지를 순서대로 확인하세요.

**1. 암호화 키 누락**  
`.env`에서 `PERSON_DATA_KEY_BASE64`와 `PII_INDEX_KEY_BASE64`가 빈 값(`""`)이면 DB 연결 전에 앱이 종료됩니다. DB 문제처럼 보이지만 키 문제입니다. `openssl rand -base64 32`로 생성해서 채우세요.

**2. DATABASE_URL에 인증 정보 없음**  
기본 URL(`postgresql://127.0.0.1:5432/sis_mvp_dev?schema=public`)에는 사용자/비밀번호가 없습니다. 비밀번호를 설정한 PostgreSQL이라면 인증 실패합니다. 아래처럼 명시하세요.
```env
DATABASE_URL="postgresql://postgres:비밀번호@127.0.0.1:5432/sis_mvp_dev?schema=public"
```

**3. db:migrate를 실행하지 않음**  
`sis_mvp_dev` 데이터베이스가 없으면 연결 자체가 안 됩니다. `npm run db:migrate`를 먼저 실행하세요.

### `npm run db:migrate` 실패

- `psql: command not found` / `createdb: command not found` → PostgreSQL 클라이언트 CLI가 PATH에 없음. 설치 후 재시도
- `createdb: error: could not connect` → PostgreSQL 서버가 실행 중인지 확인
- `createdb: error: creation of new database failed: ERROR: permission denied` → DB 사용자에게 CREATEDB 권한 필요: `ALTER ROLE 사용자명 CREATEDB;`
- `FATAL: Peer authentication failed` → Linux pg_hba.conf 설정 문제. DATABASE_URL에 사용자/비밀번호 명시 또는 pg_hba.conf에서 `peer` → `md5` 변경

### 로그인 안 됨

시드가 없을 가능성이 높습니다.

```bash
npm run db:migrate
npm run db:seed
```

### `Port 3000 is already in use`

기존 dev 서버가 살아 있습니다. 해당 프로세스를 종료한 뒤 재실행하세요.

### `internal server error`가 반복될 때

```bash
npm run dev:clean
```

---

## 추천 개발 루틴

처음 셋업:

```bash
npm install
cp .env.example .env
# .env에 키 4개 채우기
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

작업 마무리 전:

```bash
npm run build
npm run test
npm run check:mutation-audit
```

---

## 참고 파일

- [AGENTS.md](./AGENTS.md)
- [prisma/schema.prisma](./prisma/schema.prisma)
- [prisma/seed.ts](./prisma/seed.ts)
- [scripts/dev-runtime.mjs](./scripts/dev-runtime.mjs)
- [scripts/prisma-migrate-dev.mjs](./scripts/prisma-migrate-dev.mjs)
- [scripts/wipe-dev-db.mjs](./scripts/wipe-dev-db.mjs)
- [playwright.config.ts](./playwright.config.ts)
