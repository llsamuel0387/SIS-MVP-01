# School SIS

학교용 **Student Information System (SIS)** 프로젝트입니다.  
현재 저장소는 단순 데모 페이지가 아니라, **계정/권한 관리**, **학생·교직원 포털**, **프로필 및 사진 관리**, **정보 변경 요청 승인**, **증명서 발급 기본 흐름**, **감사 로그**, **SSO 설정 기반**까지 포함한 운영형 베이스를 목표로 합니다.

코드 구조와 보안 규칙은 반드시 [AGENTS.md](./AGENTS.md)도 함께 참고하세요.

## 현재 포함된 기능

- 관리자
  - 계정 생성
  - 계정 관리
  - 상태 변경, 비밀번호 재설정, 삭제
  - 학생/교직원 프로필 열람 및 수정
  - 프로필 사진 추가, 교체, 삭제
  - 저장하지 않은 변경 이탈 경고
  - 정보 변경 요청 검토
  - 로그인 시도 / 감사 로그 확인
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
  - 세션 기반 인증
  - Argon2id 비밀번호 해시
  - AES-256-GCM 기반 개인정보 섹션 암호화
  - CSRF 보호
  - 감사 로그
  - PostgreSQL + Prisma 마이그레이션 기반 개발 흐름

## 기술 스택

| 항목 | 내용 |
| --- | --- |
| Framework | Next.js 15 App Router |
| Language | TypeScript strict |
| DB | PostgreSQL |
| ORM | Prisma 6 |
| Auth | Session cookie + DB session |
| Password | Argon2id |
| Encryption | AES-256-GCM (`PersonSection`) |
| Test | Vitest, Playwright |

## 먼저 필요한 것

아래가 설치되어 있어야 처음부터 막히지 않습니다.

- `git`
- `node` 22 계열 권장
- `npm`
- `PostgreSQL` 16 이상 권장
- `openssl`

확인 예시:

```bash
git --version
node -v
npm -v
psql --version
openssl version
```

`.nvmrc` 기준으로는 **Node 22**를 권장합니다.

## 처음 클론해서 바로 실행하는 방법

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

기본 예시는 아래입니다.

```env
DATABASE_URL="postgresql://127.0.0.1:5432/sis_mvp_dev?schema=public"
SECURE_COOKIES=false
PERSON_DATA_KEY_BASE64="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
PII_INDEX_KEY_BASE64="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
JWT_ACCESS_SECRET="REPLACE_WITH_UNIQUE_RANDOM_SECRET_AT_LEAST_32_CHARS"
JWT_REFRESH_SECRET="REPLACE_WITH_UNIQUE_RANDOM_SECRET_AT_LEAST_32_CHARS"
```

다음 값들은 실제 랜덤값으로 바꾸는 것을 권장합니다.

```bash
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 48
openssl rand -base64 48
```

각각 다음 변수에 넣으면 됩니다.

- 첫 번째 32바이트 값: `PERSON_DATA_KEY_BASE64`
- 두 번째 32바이트 값: `PII_INDEX_KEY_BASE64`
- 첫 번째 48바이트 값: `JWT_ACCESS_SECRET`
- 두 번째 48바이트 값: `JWT_REFRESH_SECRET`

로컬 HTTP 개발에서는 보통 아래처럼 둡니다.

```env
SECURE_COOKIES=false
```

## PostgreSQL 셋업

가장 많이 막히는 부분이 여기입니다.

이 프로젝트는 SQLite가 아니라 **PostgreSQL 전용**입니다.

### 가장 쉬운 로컬 전제

- PostgreSQL 서버가 로컬에서 실행 중
- `127.0.0.1:5432` 접속 가능
- 현재 OS 사용자명으로 DB 생성/접속 가능

이 전제가 맞으면 `.env.example` 기본값 그대로도 대부분 동작합니다.

### 만약 기본 접속이 안 되면

`DATABASE_URL`을 본인 환경에 맞게 직접 바꾸세요. 예:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/sis_mvp_dev?schema=public"
```

또는 개발 스크립트가 쓰는 로컬 기본 DB 경로를 명시적으로 맞출 수도 있습니다.

```bash
export SIS_POSTGRES_USER=postgres
export SIS_POSTGRES_PASSWORD=postgres
export SIS_POSTGRES_HOST=127.0.0.1
export SIS_POSTGRES_PORT=5432
```

중요한 점:

- `npm run db:migrate`
- `npm run db:seed`
- `npm run dev`

이 흐름은 로컬 개발용 PostgreSQL DB를 기준으로 함께 동작합니다.

## 처음 실행 순서

아래 순서 그대로 진행하면 됩니다.

### 4. Prisma client 생성

```bash
npm run db:generate
```

### 5. 개발용 DB 생성 + 마이그레이션 적용

```bash
npm run db:migrate
```

이 명령은:

- 개발용 PostgreSQL DB가 없으면 생성 시도
- `prisma/migrations`의 현재 마이그레이션 적용

를 수행합니다.

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

## 샘플 계정

`npm run db:seed` 이후 바로 사용할 수 있습니다.

| 역할 | loginId | password |
| --- | --- | --- |
| Admin | `admin` | `AdminDemo#1` |
| Student | `studentdemo` | `StudentDemo#1` |
| Staff | `staffdemo` | `StaffDemo#1` |

## 개발 서버 관련 중요 사항

이 프로젝트는 개발 중에 Next dev manifest 문제가 반복되어서, 현재는 **기본 dev 서버를 Webpack 경로로 안정성 우선 실행**하도록 맞춰져 있습니다.

기본 사용:

```bash
npm run dev
```

필요할 때만 Turbopack:

```bash
npm run dev:turbo
```

개발 서버가 꼬였을 때는:

```bash
npm run dev:clean
```

이 명령은 `.next` 등 개발 산출물을 지우고 dev 서버를 다시 띄웁니다.

## 자주 쓰는 명령

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 기본 개발 서버 실행. 현재는 안정성 우선 경로 |
| `npm run dev:turbo` | Turbopack으로 개발 서버 실행 |
| `npm run dev:clean` | `.next`, `.sis-dev` 등을 지우고 dev 재시작 |
| `npm run build` | production build |
| `npm run test` | 단위 + 통합 테스트 |
| `npm run test:e2e` | Playwright E2E |
| `npm run db:generate` | Prisma client 생성 |
| `npm run db:migrate` | 개발 DB 생성 보장 + 마이그레이션 적용 |
| `npm run db:deploy` | 커밋된 마이그레이션만 적용 |
| `npm run db:seed` | 시드 삽입 |
| `npm run db:wipe-dev` | 개발 DB 초기화 후 마이그레이션/시드 재적용 |
| `npm run clean:dev` | 로컬 개발 산출물과 dev/test DB를 거의 초기 상태로 정리 |
| `npm run check:mutation-audit` | 쓰기 API 감사 로그 누락 검사 |

## 추천 개발 루틴

보통은 아래 순서면 됩니다.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

작업 마무리 전에는:

```bash
npm run build
npm run test
npm run check:mutation-audit
```

## DB 관련 정리

현재 저장소는 PostgreSQL 전환이 반영되어 있습니다.

- Prisma datasource: PostgreSQL
- 커밋된 마이그레이션 존재
- 개발/통합 테스트 모두 PostgreSQL 기준
- `db push`보다 **`db:migrate` / `db:deploy` 중심 흐름**을 권장

`db:push`가 완전히 금지된 것은 아니지만, 처음 셋업과 일반 개발 흐름에서는 `db:migrate`를 기준으로 이해하는 편이 안전합니다.

## 초기화/복구 명령

### 개발 DB만 완전히 다시 만들고 싶을 때

```bash
npm run db:wipe-dev
```

이 명령은:

- 개발용 DB drop/create
- 마이그레이션 재적용
- 시드 재삽입

까지 수행합니다.

주의:

- 포트 `3000`에서 dev 서버가 돌고 있으면 먼저 끄고 실행하세요.

### 로컬 상태를 거의 새 클론처럼 만들고 싶을 때

```bash
npm run clean:dev
```

이 명령은:

- `node_modules`
- `.next`
- `.sis-dev`
- 로컬 dev/test DB
- 각종 테스트 산출물

등을 정리합니다.

정리 후 다시 시작:

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## 테스트

### 단위 + 통합

```bash
npm run test
```

통합 테스트는 별도 PostgreSQL DB(`sis_mvp_integration`)를 사용합니다.

### E2E

처음 한 번:

```bash
npm run playwright:install
```

그 다음:

```bash
npm run test:e2e
```

## 현재 프로젝트 범위

이 저장소는 이미 쓸 만한 학교용 SIS 기반이지만, 아직 “완전한 학교 ERP 전체”는 아닙니다.

현재 강한 영역:

- 계정/권한 관리
- 학생/교직원 프로필 관리
- 사진 관리
- 정보 변경 승인
- 감사/보안 기반

아직 확장이 필요한 영역:

- 수업/과목/학기/시간표
- 출결
- 성적/평가
- 보호자 포털
- 등록금/수납
- 더 깊은 결재/행정 워크플로

## 문제 해결

### 1. `internal server error`가 개발 중 반복될 때

먼저:

```bash
npm run dev:clean
```

현재는 dev 안정성을 높이기 위해 기본 `npm run dev`가 Webpack 기반 경로를 사용합니다. 그래도 dev 서버가 꼬이면 위 명령으로 대부분 복구됩니다.

### 2. `Port 3000 is already in use`

기존 dev 서버가 살아 있는 상태입니다. 그 프로세스를 종료한 뒤 다시 실행하세요.

### 3. 로그인 안 됨

아래를 순서대로 확인하세요.

```bash
npm run db:migrate
npm run db:seed
```

### 4. PostgreSQL 접속 실패

보통은 아래 중 하나입니다.

- PostgreSQL 서버가 안 떠 있음
- `DATABASE_URL` 사용자/비밀번호 불일치
- 로컬 계정으로 DB 생성 권한 없음

이 경우 `DATABASE_URL`을 본인 환경에 맞는 명시적 URL로 바꾸는 게 가장 빠릅니다.

## 참고 파일

- [AGENTS.md](./AGENTS.md)
- [prisma/schema.prisma](./prisma/schema.prisma)
- [prisma/seed.ts](./prisma/seed.ts)
- [scripts/dev-runtime.mjs](./scripts/dev-runtime.mjs)
- [scripts/prisma-migrate-dev.mjs](./scripts/prisma-migrate-dev.mjs)
- [scripts/wipe-dev-db.mjs](./scripts/wipe-dev-db.mjs)
- [playwright.config.ts](./playwright.config.ts)
