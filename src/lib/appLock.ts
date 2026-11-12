// 앱 잠금: 이 기기의 화면 잠금이다. 기록 자체는 Supabase 로그인으로 보호되고, 이 잠금은 같은 기기를 다른 사람이
// 집어 들었을 때 일기가 바로 보이지 않게 하는 용도다. 설정은 기기(브라우저)마다 따로 저장한다.

const PIN_KEY = 'lifelog:lock:pin'; // { salt, hash }
const BIO_KEY = 'lifelog:lock:credential'; // WebAuthn 자격 증명 id (base64url)
const FAIL_KEY = 'lifelog:lock:fail'; // { count, until }
const SESSION_KEY = 'lifelog:lock:open'; // 이 탭 세션에서 이미 해제했는지

export const LOCK_EVENT = 'lifelog:lock-changed';
export const LOCK_NOW_EVENT = 'lifelog:lock-now';
/** 화면을 떠났다가 이 시간(ms) 넘게 지나 돌아오면 다시 잠근다 */
export const RELOCK_AFTER_MS = 60_000;
export const PIN_MIN = 4;
export const PIN_MAX = 8;
const MAX_FAILS = 5;
const COOLDOWN_MS = 30_000;
const ITERATIONS = 100_000;

interface StoredPin {
  salt: string;
  hash: string;
}

function read<T>(storage: Storage | undefined, key: string): T | null {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: Storage | undefined, key: string, value: unknown | null) {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, JSON.stringify(value));
  } catch {
    // 저장소를 못 쓰는 환경에서는 잠금을 켤 수 없다 (설정 화면에서 안내)
  }
}

const local = () => (typeof window === 'undefined' ? undefined : window.localStorage);
const session = () => (typeof window === 'undefined' ? undefined : window.sessionStorage);

function notify() {
  window.dispatchEvent(new Event(LOCK_EVENT));
}

// ----------------------------------------------------------------------------- 인코딩
const toB64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))));
const fromB64 = (s: string) => new Uint8Array(Array.from(atob(s), (c) => c.charCodeAt(0)));
const toB64Url = (buf: ArrayBuffer) => toB64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64Url = (s: string) => fromB64(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '='));

async function hashPin(pin: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return toB64(bits);
}

// ----------------------------------------------------------------------------- PIN
export const isValidPin = (pin: string) => new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin);

export function isLockEnabled(): boolean {
  return !!read<StoredPin>(local(), PIN_KEY);
}

export async function setPin(pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  write(local(), PIN_KEY, { salt: toB64(salt), hash: await hashPin(pin, salt) } satisfies StoredPin);
  write(local(), FAIL_KEY, null);
  markUnlocked(); // 방금 설정한 사람이 바로 다시 잠기지 않게 한다
  notify();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = read<StoredPin>(local(), PIN_KEY);
  if (!stored) return true;
  const ok = (await hashPin(pin, fromB64(stored.salt))) === stored.hash;
  if (ok) write(local(), FAIL_KEY, null);
  else registerFailure();
  return ok;
}

export function disableLock(): void {
  write(local(), PIN_KEY, null);
  write(local(), BIO_KEY, null);
  write(local(), FAIL_KEY, null);
  write(session(), SESSION_KEY, null);
  notify();
}

// ----------------------------------------------------------------------------- 연속 실패 지연
function registerFailure() {
  const cur = read<{ count: number; until: number }>(local(), FAIL_KEY) ?? { count: 0, until: 0 };
  const count = cur.count + 1;
  write(local(), FAIL_KEY, count >= MAX_FAILS ? { count: 0, until: Date.now() + COOLDOWN_MS } : { count, until: 0 });
}

/** 연속 실패로 잠시 막혀 있으면 남은 초, 아니면 0 */
export function cooldownSeconds(): number {
  const cur = read<{ count: number; until: number }>(local(), FAIL_KEY);
  return cur && cur.until > Date.now() ? Math.ceil((cur.until - Date.now()) / 1000) : 0;
}

// ----------------------------------------------------------------------------- 세션 해제 표시
export const isUnlockedThisSession = () => session()?.getItem(SESSION_KEY) === '1';
export function markUnlocked() {
  try {
    session()?.setItem(SESSION_KEY, '1');
  } catch {
    // 무시
  }
}
export function markLocked() {
  try {
    session()?.removeItem(SESSION_KEY);
  } catch {
    // 무시
  }
}

// ----------------------------------------------------------------------------- 생체 인증 (WebAuthn 플랫폼 인증기)
export async function isBiometricSupported(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential || !window.isSecureContext) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export const isBiometricEnabled = () => !!read<string>(local(), BIO_KEY);

/** 지문·얼굴 인식 등록. 성공하면 true. 사용자가 취소하면 false. */
export async function enableBiometric(): Promise<boolean> {
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'LifeLog' },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'lifelog', displayName: 'LifeLog' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    write(local(), BIO_KEY, toB64Url(cred.rawId));
    notify();
    return true;
  } catch {
    return false;
  }
}

export function disableBiometric(): void {
  write(local(), BIO_KEY, null);
  notify();
}

/** 지문·얼굴 인식으로 확인. 기기가 본인 확인에 성공하면 true. */
export async function verifyBiometric(): Promise<boolean> {
  const id = read<string>(local(), BIO_KEY);
  if (!id) return false;
  try {
    const result = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: fromB64Url(id), transports: ['internal'] }],
        userVerification: 'required',
        timeout: 60_000,
      },
    });
    return !!result;
  } catch {
    return false;
  }
}
