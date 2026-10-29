const path = require('path');

// next lint 는 프로젝트 루트 기준 상대 경로를 받는다. (Windows 에서는 역슬래시를 슬래시로 통일)
const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f).split(path.sep).join('/'))
    .join(' --file ')}`;

// 키 순서대로 실행된다(훅에서 --concurrent false): eslint --fix 가 끝난 코드를 tsc 가 검사한다.
module.exports = {
  // 1. 변경된 JS/TS 파일: Next.js Linter (자동 수정 포함)
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],

  // 2. 전체 프로젝트 타입 무결성 검증. tsc 는 파일 단위 검사를 지원하지 않으므로
  //    함수형 task 로 파일 인자 없이 전체를 1회만 실행한다.
  '*.{ts,tsx}': () => 'tsc --noEmit',

  // 3. JSON/Markdown 포맷팅
  '*.{json,md}': ['prettier --write'],
};
