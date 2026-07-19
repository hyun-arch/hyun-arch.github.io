# 🔴 `_secret/` — 로컬 전용 비밀 데이터

이 폴더는 **배포에 절대 올라가지 않는** 데이터를 담습니다. 재무제표·매출 같은 회사 기밀이 여기 삽니다.

## 어떻게 안전한가

1. **git에 안 올라감** — `.gitignore`가 이 폴더의 실제 파일을 제외합니다
   (커밋되는 건 `README.md`와 `*.example.js` 템플릿뿐).
2. **배포 빌드에서 제외됨** — `src/lib/tiers.js`가 `import.meta.env.DEV`로 게이팅해서,
   `npm run build`(프로덕션) 산출물(`dist/`)에는 이 데이터가 **물리적으로 들어가지 않습니다**.
3. **로컬에서만 보임** — 오직 내 PC에서 `npm run dev`로 띄웠을 때만 화면에 나타납니다.

## 실제 데이터 넣는 법

```
1. finance.example.js  →  finance.js 로 복사
2. finance.js 값을 실제 수치로 채우기
3. 끝. (finance.js 는 커밋·배포되지 않음)
```

## 하면 안 되는 것

- ❌ 실제 수치를 `*.example.js`에 쓰지 마세요 — example은 커밋됩니다.
- ❌ 이 데이터를 `src/pages/`에서 무조건 렌더하지 마세요 — 반드시 `tiers.js`의 로더/게이트를 거치세요.
- ✅ 검증: `npm run build` 후 `dist/`를 grep 해서 비밀 문자열이 0건인지 확인.
