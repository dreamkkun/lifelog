-- ==============================================================================
-- [LifeLog & Insight] 통합 데이터베이스 스크립트
-- Supabase SQL Editor 에 통째로 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
-- (이미 있는 테이블/인덱스는 건너뛰고, 정책은 지우고 다시 만들며, 제약은 최신으로 맞춥니다.)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 타입
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_type') THEN
        CREATE TYPE public.record_type AS ENUM ('DIARY', 'BOOK', 'LECTURE', 'MEMO');
    END IF;
END $$;

-- 이미 만들어진 타입에는 MEMO 값을 추가한다 (새로 만든 경우에는 이미 있어 건너뜀)
ALTER TYPE public.record_type ADD VALUE IF NOT EXISTS 'MEMO';

-- ------------------------------------------------------------------------------
-- 2. 테이블 (user_id 는 로그인한 사용자로 자동 채워진다: DEFAULT auth.uid())
-- ------------------------------------------------------------------------------

-- 성향 프로필 (MBTI, 띠, 별자리)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY DEFAULT auth.uid(),
    mbti VARCHAR(4) NOT NULL,
    zodiac_animal VARCHAR(10) NOT NULL,
    star_sign VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 멀티모달 기록 (일기, 독서, 강의)
CREATE TABLE IF NOT EXISTS public.records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    type public.record_type NOT NULL,
    target_date DATE DEFAULT CURRENT_DATE NOT NULL,
    content TEXT NOT NULL,
    image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- 독서(BOOK)
    book_title TEXT,
    book_author TEXT,
    quote TEXT,
    page_number INTEGER,

    -- 강의(LECTURE)
    lecture_title TEXT,
    speaker TEXT,
    ocr_extracted_text TEXT,

    -- 일기(DIARY)
    weather VARCHAR(20),

    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 생각/아이디어 메모(MEMO) 전용 컬럼: 핀 고정, 태그, 제목. 이미 만든 테이블에도 추가된다.
ALTER TABLE public.records
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS memo_title TEXT;

-- 일일 할 일
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    target_date DATE DEFAULT CURRENT_DATE NOT NULL,
    content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. 값 제약 (이미 만들어진 테이블에도 최신 규칙이 적용되도록 매번 다시 건다)
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_profiles ALTER COLUMN mbti SET NOT NULL;

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_mbti_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_mbti_check CHECK (
    mbti IN ('ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP',
             'ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ')
);

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_zodiac_animal_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_zodiac_animal_check CHECK (
    zodiac_animal IN ('쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지')
);

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_star_sign_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_star_sign_check CHECK (
    star_sign IN ('양자리','황소자리','쌍둥이자리','게자리','사자자리','처녀자리',
                  '천칭자리','전갈자리','사수자리','염소자리','물병자리','물고기자리')
);

-- ------------------------------------------------------------------------------
-- 4. 인덱스
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_records_user_date ON public.records(user_id, target_date DESC);
CREATE INDEX IF NOT EXISTS idx_records_user_type ON public.records(user_id, type);
CREATE INDEX IF NOT EXISTS idx_records_user_pinned ON public.records(user_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_records_tags ON public.records USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_todos_user_date ON public.todos(user_id, target_date DESC);
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON public.todos(user_id, is_completed);

-- 아카이브 검색(ilike '%검색어%')용 trigram 인덱스
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX IF NOT EXISTS idx_records_search_content ON public.records USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_records_search_book ON public.records USING gin (book_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_records_search_lecture ON public.records USING gin (lecture_title gin_trgm_ops);

-- ------------------------------------------------------------------------------
-- 5. Row Level Security: 내 행만 읽고 쓸 수 있다 (로그인한 사용자 전용)
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
CREATE POLICY "Users can manage their own profile"
    ON public.user_profiles FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can operate their own records" ON public.records; -- 이전 이름
DROP POLICY IF EXISTS "Users can manage their own records" ON public.records;
CREATE POLICY "Users can manage their own records"
    ON public.records FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own todos" ON public.todos;
CREATE POLICY "Users can manage their own todos"
    ON public.todos FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. Storage: 비공개 이미지 버킷 + 내 폴더({user_id}/…)만 접근
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'record-images',
    'record-images',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

DROP POLICY IF EXISTS "Individual user storage access" ON storage.objects; -- 이전 이름
DROP POLICY IF EXISTS "Individual User Storage Access" ON storage.objects;
CREATE POLICY "Individual User Storage Access"
    ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'record-images' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'record-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ------------------------------------------------------------------------------
-- 7. Realtime: 다른 기기의 변경을 즉시 반영.
--    테이블마다 따로 실행한다(한 테이블이 이미 등록돼 있어도 다음 테이블 등록이 건너뛰어지지 않도록).
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.records;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
