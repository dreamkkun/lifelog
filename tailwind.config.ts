import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // TYPE_META 의 도트/뱃지 색 클래스가 lib 에 있어 스캔 대상에 포함해야 한다
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        // 날짜·제목·인용구용 명조 (본문은 시스템 한글 산세리프)
        serif: ["var(--font-serif)", "Noto Serif KR", "Batang", "AppleMyungjo", "serif"],
      },
      keyframes: {
        "slide-up": {
          from: { opacity: "0", transform: "translateY(1.5rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 300ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
