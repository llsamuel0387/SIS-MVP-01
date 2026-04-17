# Student Information System — MVP

학교용 **Student Information System** MVP입니다.  
Next.js(App Router) + Prisma(SQLite) + 서버 측 권한 검증을 기준으로 합니다.  
코딩·리뷰·에이전트 작업 시 저장소 규칙은 **[AGENTS.md](./AGENTS.md)** 를 함께 따릅니다.

---

## 기술 스택 (현재)

| 구분 | 내용 |
| --- | --- |
| 프레임워크 | **Next.js 15** (App Router), **React 19** |
| 언어 | TypeScript (`tsc --noEmit`로 타입 검사) |
| ORM / DB | **Prisma 6**, **SQLite** (`prisma/schema.prisma`의 `provider = "sqlite"`) |
| 인증 | 쿠키 `session_token` + DB `Session`, Argon2id 비밀번호 |
| 스타일 | Tailwind CSS 4 |
| 테스트 | **Vitest** — 기본 설정(단위 등) + `vitest.integration.config.ts`(Prisma·API 통합), **Playwright**(E2E) |

---

## 선행 조건

| 항목 | 권장 |
| --- | --- |
| Node.js | **22** (저장소 루트 [`.nvmrc`](./.nvmrc). `nvm use` / Volta 등으로 맞추면 `npm run dev`가 동일 런타임으로 실행됩니다.) |
| npm | 9 이상 (일반적으로 Node 22와 함께 제공) |
| Git | 클론·브랜치 작업용 |

`npm run dev`는 Node 메이저가 **18 / 20 / 22가 아니면** `npx -y node@22`로 Next 개발 서버를 띄웁니다.  
로컬과 CI를 맞추려면 **Node 22 사용**을 권장합니다.

---

## 개발 서버와 Next 산출물 (요약)

| 항목 | 설명 |
| --- | --- |
| `npm run dev` | Next 기본 출력 디렉터리 **`.next`** 를 사용합니다. (과거에 쓰이던 **`.next-dev`** 는 더 이상 `npm run dev`에서 쓰이지 않습니다.) |
| 단일 인스턴스 PID | **`.sis-dev/.dev-server.pid`** — `.next` 삭제와 분리되어 있습니다. |
| `npm run test:e2e` | Playwright가 **`.next-e2e`** 로 별도 `next dev`(포트 **3100**)를 띄워, 로컬 `npm run dev`(3000)와 **`.next`를 두고 싸우지 않게** 합니다. |
| 파일 폴링 (Docker 볼륨 등) | 기본은 끔. 필요 시 **`SIS_DEV_FILE_POLLING=1 npm run dev`** |

---

## 처음 실행하기 (빠른 시작)

> 아래 순서대로 따라하면 로컬에서 바로 로그인 화면을 볼 수 있습니다.

### 1단계 — 저장소 클론

```bash
git clone <저장소-URL>
cd <프로젝트-폴더>
```

### 2단계 — 패키지 설치

```bash
npm install
```

`npm run test:e2e` 또는 `npm run test:all` 까지 돌릴 계획이면, **한 번** `npm run playwright:install` 으로 Playwright용 Chromium을 받아 두세요. (`npm install`에는 브라우저 바이너리가 포함되지 않습니다.)

### 3단계 — 환경 변수 파일 만들기

```bash
cp .env.example .env
```

1. **`.env`를 연다.**  
2. **암호화 키** — 아래처럼 `openssl rand -base64 32`로 만든 **한 줄짜리 출력**을 그대로 따옴표 안 값으로 넣는다. (`openssl` 출력은 항상 Base64로 디코드 시 **32바이트**라서 앱과 호환된다.)

   ```bash
   openssl rand -base64 32
   ```

   - 첫 번째 출력 → `PERSON_DATA_KEY_BASE64="…여기…"`  
   - 두 번째 출력(다시 명령 실행) → `PII_INDEX_KEY_BASE64="…여기…"`  
   - `PII_INDEX_KEY_BASE64` **변수 줄 전체를 삭제**해도 된다. 그러면 앱이 `PERSON_DATA_KEY_BASE64`만 재사용한다. (`PII_INDEX_KEY_BASE64=""` 처럼 **빈 문자열만 두면 안 된다.**)

   한 번에 두 줄을 만들어 붙여 넣고 싶다면:

   ```bash
   printf 'PERSON_DATA_KEY_BASE64="%s"\nPII_INDEX_KEY_BASE64="%s"\n' "$(openssl rand -base64 32)" "$(openssl rand -base64 32)"
   ```

   `.env.example`에 들어 있는 예시 키를 **그대로 두어도 로컬은 동작**한다. 다만 본인 PC 전용·운영 전에는 위처럼 `openssl`으로 바꾸는 것을 권장한다.

3. **나머지 변수** — 아래 표를 참고해 `JWT_*` 등을 채운다(로컬은 표의 대로 비워도 되는 항목이 있다).

| 변수 | 설명 | 예시 |
| --- | --- | --- |
| `DATABASE_URL` | SQLite 파일 경로 (그대로 두면 됩니다) | `file:./dev.db` |
| `PERSON_DATA_KEY_BASE64` | 32바이트 암호화 키 (`openssl rand -base64 32` 한 줄) | (명령 출력 붙여넣기) |
| `PII_INDEX_KEY_BASE64` | 32바이트 HMAC 키 (선택, 줄 삭제 시 데이터 키 재사용) | (또는 명령 출력) |
| `JWT_ACCESS_SECRET` | 로컬은 비워도 됨(개발 폴백). 운영은 32자 이상 | — |
| `JWT_REFRESH_SECRET` | 위와 동일 | — |
| `SECURE_COOKIES` | 로컬 개발은 `false`, HTTPS 배포는 `true` | `false` |

> ⚠️ `.env` 파일은 Git에 올라가지 않습니다.  
> 임의의 문장을 키로 넣지 말 것: **반드시** `openssl rand -base64 32`처럼 **32바이트를 Base64로 인코딩한 값**만 사용한다. (아니면 `.env.example`의 예시 키를 유지한다.)

### 4단계 — Prisma 클라이언트 생성

```bash
npm run db:generate
```

### 5단계 — DB 스키마 반영

```bash
npm run db:push
```

> 이 명령이 `prisma/dev.db` 파일을 생성합니다. 

### 6단계 — 초기 데이터(시드) 삽입

```bash
npm run db:seed
```

> 이 명령을 실행해야 아래 샘플 계정이 생깁니다. **이 단계를 건너뛰면 로그인이 불가능합니다.**

### 7단계 — 개발 서버 시작

```bash
npm run dev
```

브라우저에서 아래 주소로 접속하세요.

| 역할 | 주소 |
| --- | --- |
| 관리자 | http://127.0.0.1:3000/admin/login |
| 학생 | http://127.0.0.1:3000/studentportal/login |
| 교직원 | http://127.0.0.1:3000/staffportal/login |

---

## 시드 직후 샘플 계정

시드 실행 후 아래 계정으로 로그인할 수 있습니다.  
**운영·공유 환경에서는 반드시 비밀번호를 변경하세요.**

| 역할 | 로그인 ID | 초기 비밀번호 | 비고 |
| --- | --- | --- | --- |
| 관리자 | `admin` | `AdminDemo#1` | |
| 학생 | `studentdemo` | `StudentDemo#1` | 학번 `SEED-DEMO-S-001` |
| 교직원 | `staffdemo` | `StaffDemo#1` | 사번 `SEED-DEMO-T-001`, 시드 학생에게 `StudentAssignment`(유형 `DEMO_SEED`) |

추가 계정은 관리자로 로그인 후 **`/admin/accounts/create`** 또는 API **`POST /api/admin/accounts`** / **`POST /api/users`** 로 만들 수 있습니다.

---

## 자주 막히는 이슈

| 증상 | 조치 |
| --- | --- |
| 로그인 시 계정 없음 / 401 오류 | `npm run db:seed` 를 실행했는지 확인하세요 |
| `Port 3000 is already in use` | 다른 프로세스가 3000번 포트를 사용 중입니다. 해당 프로세스를 종료 후 다시 `npm run dev` |
| `db:wipe-dev` 후 500 오류 | 개발 서버를 **완전히 종료**한 뒤 다시 `npm run dev` |
| 화면이 맨 위 HTML만 보이거나 버튼·레이아웃이 깨짐 | ① 주소는 **`http://127.0.0.1:3000`** (스크립트가 이 호스트에 묶입니다). ② DevTools → Network에서 **`/_next/static/`** CSS·JS가 **404**인지 확인. ③ **`npm run dev:clean`** 으로 `.next` 등을 지운 뒤 dev 재시작. ④ 브라우저 **강력 새로고침**(Cmd+Shift+R) |
| E2E 테스트 실패 / `Executable doesn't exist` … `playwright` | `npm install`만 하면 브라우저 바이너리는 내려받지 않습니다. **`npm run playwright:install`** (또는 `npx playwright install chromium`) 후 다시 `npm run test:e2e` 또는 `npm run test:all`. ([`playwright.config.ts`](./playwright.config.ts): **`127.0.0.1:3100`**, 산출물 **`.next-e2e`**) |
| `.env` 에 키가 없어서 오류 | 3단계로 돌아가 모든 필수 변수를 채워주세요 |

---

## DATABASE_URL과 실제 DB 파일 위치

- `.env.example` 의 `DATABASE_URL="file:./dev.db"` 는 Prisma가 `schema.prisma` 가 있는 디렉터리(`prisma/`)를 기준으로 해석합니다.  
  따라서 실제 파일 위치는 **`prisma/dev.db`** 입니다. (루트의 `./dev.db` 가 아닙니다.)
- `npm run db:push` / `npm run db:seed` 는 항상 **`prisma/dev.db`** 를 사용합니다.
- `npm run dev` 도 기본으로 **`prisma/dev.db`** 의 절대 경로를 씁니다.  
  다른 DB 파일을 쓰려면 **`SIS_DEV_DATABASE_URL`** 환경변수만 설정하면 됩니다.
- **`prisma/dev.db` 는 Git에 포함되지 않습니다.** 클론 후 5~6단계를 직접 실행해야 합니다.

---

## npm 스크립트 전체 목록

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 시작 (`127.0.0.1:3000`, DB 경로 자동 고정, Next 산출물은 **`.next`**) |
| `npm run dev:clean` | **`.next`**, **`.next-dev`**(레거시), **`.next-e2e`**, **`.sis-dev`** 삭제 후 개발 서버 시작 (캐시·정적 404 의심 시) |
| `npm run dev:fast` | `next dev` 만 실행 (DB 경로 고정 없음; 산출물은 역시 **`.next`**) |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run db:generate` | Prisma 클라이언트 생성 |
| `npm run db:push` | 스키마를 `prisma/dev.db` 에 반영 |
| `npm run db:seed` | 초기 데이터 삽입 |
| `npm run db:wipe-dev` | 개발 DB 초기화 (아래 설명 참고) |
| `npm run db:migrate` | `prisma migrate dev` (마이그레이션 폴더 사용 시) |
| `npm run db:backfill:person-sections` | 기존 계정 Person/PersonSection 백필 |
| `npm run db:backfill:pii` | UserProfile 등 PII 암호화 백필 |
| `npm run test` | 단위 + 통합 테스트 (둘 다 통과해야 성공) |
| `npm run test:integration` | 통합 테스트만 단독 실행 |
| `npm run test:watch` | Vitest 워치 모드 |
| `npm run playwright:install` | Playwright **Chromium** 브라우저 다운로드 (`test:e2e` / `test:all` 전에 최초 1회 권장) |
| `npm run test:e2e` | Playwright E2E (`127.0.0.1:3100`, 산출물 **`.next-e2e`**, [`playwright.config.ts`](./playwright.config.ts)) |
| `npm run test:all` | `npm run test` + `npm run test:e2e` |
| `npm run check:mutation-audit` | 변이 API 감사 로그 누락 검사 |

---

## 개발 DB 초기화 (`db:wipe-dev`)

DB를 완전히 비우고 처음부터 다시 시작하고 싶을 때 사용합니다.

```bash
npm run db:wipe-dev
```

**포트 3000에 프로세스가 있으면** 이 명령은 바로 종료합니다. (실행 중인 `npm run dev`가 있으면 `.next` 등을 지우면서 Next가 깨질 수 있기 때문입니다.)

이 명령은 다음을 순서대로 실행합니다.

1. 로컬 SQLite 파일 삭제 (`prisma/dev.db` 등)
2. Next·보조 산출물 삭제: **`.next`**, **`.next-dev`**(레거시), **`.next-e2e`**, **`.sis-dev`**
3. `prisma db push` 로 스키마 재반영
4. `prisma/seed.ts` 로 초기 데이터 재삽입

> ⚠️ 빌드 산출물도 삭제되므로, **실행 전·후에 개발 서버(3000)를 끄고**, 완료 후 다시 **`npm run dev`** 를 실행하세요.

---

## PR 전 점검 (권장)

```bash
npm run build                  # 프로덕션 빌드 통과 여부
npm run test                   # 단위 + 통합 테스트
npm run check:mutation-audit   # 감사 로그 누락 여부
# (선택) CI와 동일하게 통합만 한 번 더: npm run test:integration
```

---

## 자동 테스트 구조

- **`npm run test`** — 두 단계 연속 실행:
  1. Vitest 기본 설정: `authz`, CSRF, 스키마 검증 등 (DB 불필요)
  2. `vitest.integration.config.ts`: `prisma/test-integration.db` 에 스키마 반영 후 시드 + 픽스처 데이터로 실제 DB 테스트
- **`npm run test:integration`** — 위 2번만 단독 실행 (통합만 디버깅할 때).
- **`npm run test:e2e`** — Playwright. [`playwright.config.ts`](./playwright.config.ts)가 **`npx next dev -p 3100 -H 127.0.0.1`** 로 서버를 띄우며, 환경변수 **`NEXT_DIST_DIR=.next-e2e`** 로 로컬 `npm run dev`의 **`.next`** 와 충돌하지 않습니다. **로컬에서 E2E를 처음 돌리기 전** `npm run playwright:install` (또는 `npx playwright install chromium`) — `npm install`만으로는 브라우저가 설치되지 않습니다. CI는 `chromium --with-deps`.

---

## GitHub Actions (CI)

[`.github/workflows/ci.yml`](.github/workflows/ci.yml)

워크플로 전역 `env`로 `DATABASE_URL=file:./prisma/ci.sqlite` 및 암호화·JWT 플레이스홀더가 설정됩니다.

**`verify` 잡 순서 (실제 스텝과 동일):**

1. `npm ci`
2. `npx prisma generate`
3. `npx prisma db push --accept-data-loss`
4. `npm run lint`
5. `npm run check:mutation-audit`
6. `npx tsc --noEmit`
7. `npm run test` — Vitest 기본 설정 + `vitest.integration.config.ts` **한 번에** 통과
8. `npm run test:integration` — 통합 스위트만 **한 번 더** 실행 (CI에서 이중 확인)
9. `npm run build`

**`e2e` 잡:** `npm ci` → `prisma generate` → `prisma db push --accept-data-loss` (동일 워크플로 `env`의 `ci.sqlite`) → `npx playwright install chromium --with-deps` → `npm run test:e2e`

---

## 환경 변수 상세

| 변수 | 로컬 개발 | 프로덕션 | 설명 |
| --- | --- | --- | --- |
| `DATABASE_URL` | 권장 설정 유지 | 배포 DB URL | `file:./dev.db` → 실제 파일은 **`prisma/dev.db`** (앞의 **DATABASE_URL과 실제 DB 파일 위치** 절 참고) |
| `PERSON_DATA_KEY_BASE64` | **필수** (임의 32바이트 base64) | **필수** | PersonSection·프로필 등 암호화 |
| `PII_INDEX_KEY_BASE64` | 선택 (미설정 시 앱이 `PERSON_DATA_KEY_BASE64` 재사용 가능) | **권장** | 이메일 HMAC 인덱스 |
| `JWT_ACCESS_SECRET` | 비워도 non-production에서 개발용 폴백 가능 (`src/lib/jwt.ts`) | **필수**, 32자 이상 | 미충족 시 기동 실패 |
| `JWT_REFRESH_SECRET` | 위와 동일 | **필수**, 32자 이상 | 위와 동일 |
| `SECURE_COOKIES` | `false` 권장 (`http://`) | HTTPS면 `true` | 쿠키 `Secure` 플래그 |
| `SESSION_MAX_AGE_SECONDS` | 선택 | 선택 | 세션 수명(초), 기본 8시간 |
| `SIS_DEV_DATABASE_URL` | 선택 | — | `npm run dev`만 다른 SQLite를 쓸 때 |
| `SIS_DEV_FILE_POLLING` | 선택 (`1`) | — | `1`이면 `npm run dev`에서 Watchpack/Chokidar 폴링 활성화 (Docker 볼륨 등 파일 이벤트가 안 올 때) |

---

## 더 읽을 곳 (아키텍처·운영)

온보딩·스크립트는 이 README에 두고, **코드 규칙·API 레이어·감사 요구**는 아래를 병행하면 됩니다.

| 문서 / 경로 | 내용 |
| --- | --- |
| [AGENTS.md](./AGENTS.md) | 라우트/서비스 구조, Prisma·트랜잭션, 감사·보안 체크리스트 |
| [`middleware.ts`](./middleware.ts) | `/api` CSRF, 포털 세션 없으면 로그인 리다이렉트 |
| [`src/lib/api-csrf-policy.ts`](./src/lib/api-csrf-policy.ts) | CSRF 예외 경로 (수정 시 주의) |

목록 API의 표시 이름 우선순위(`Person` identity vs `UserProfile`)는 코드의 **`getDisplayNameFromUser`** (`src/lib/user-admin.ts`)를 참고하면 됩니다.

---

## 핵심 보안 원칙

1. 기본 거부(default deny)
2. 서버 측 권한 검증 필수
3. 역할(Role) + 범위(Scope) + 소유권(Ownership) 동시 검증
4. 감사 로그(audit log) 필수 기록
5. 민감 정보 최소 노출

### 권한 모델 요약

| 역할 | 접근 범위 |
| --- | --- |
| **Student** | 본인 프로필·재학·증명서·공지, 비밀번호 변경 |
| **Staff** | 배정된 학생만 조회·상태·메모·증명서. 다른 교직원 인사정보 불가 |
| **Admin** | 계정·프로필·역할/권한, 감사·로그인 시도, 정보 변경 요청, SSO 설정 등 |

---

## 개인정보 암호화 저장 구조

- `User`(계정)와 `Person`(개인 단위) 1:1 관계
- 민감 데이터는 `PersonSection` (`identity.v1`, `student-address.v1`, `photo.v1` 등)에 **AES-256-GCM** 으로 저장
- 사진: 업로드 후 PNG 재인코딩·크기 제한 적용 (`sharp`)
- 백필: `npm run db:backfill:person-sections`, `npm run db:backfill:pii`

---

## 구 경로 리다이렉트

| 구 경로 | 새 경로 | 방식 |
| --- | --- | --- |
| `/administrative` | `/admin` | HTTP 308 |
| `/administrative/login` | `/admin/login` | HTTP 308 |

---

## 다음 추천 작업

1. 외부 SSO·운영 IdP와의 완전 연동
2. PDF 증명서 실제 파이프라인
3. 통합/E2E 커버리지 확대
4. **프로덕션 DB:** SQLite 한계를 넘을 때 PostgreSQL + `prisma migrate deploy` 전략
5. 운영 시크릿·백업 관리 — `db:wipe-dev` 류 스크립트를 **운영 DB에 절대 연결하지 않기**
