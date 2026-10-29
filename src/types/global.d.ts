// 서드파티 모듈 및 브라우저 전역 객체 타입 증강 (이 파일은 import/export 가 없는 전역 선언 파일이다)

interface Navigator {
  /** iOS Safari 전용: 홈 화면에서 standalone 으로 실행 중이면 true */
  standalone?: boolean;
}
