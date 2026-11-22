// 푸시 알림용 VAPID 키 한 쌍과 발송 주소 보호용 비밀값을 만든다.
// 출력된 값은 Vercel 환경 변수에만 넣고, 채팅·저장소에 붙여넣지 마세요.
const webpush = require('web-push');
const { randomBytes } = require('node:crypto');

const keys = webpush.generateVAPIDKeys();
console.log('Vercel 환경 변수(Production)에 아래 4개를 넣으세요:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:본인이메일@example.com');
console.log(`CRON_SECRET=${randomBytes(24).toString('hex')}`);
console.log('\n그리고 SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API 의 service_role) 도 넣으세요.');
console.log('GitHub 저장소 Secrets 에는 APP_URL 과 CRON_SECRET(위와 같은 값)을 넣으세요.');
