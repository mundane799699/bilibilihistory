import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // 中文优先走系统字体，避免 Inter 落到中文字形上显得单薄
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        biliPink: "#fb7299",
        biliBlue: "#00a1d6",
        biliLightBlue: "#b3e5fc",
        biliDarkBlue: "#0076a8",
        biliLightPink: "#ffd6e7",
        biliGray: "#f6f7f8",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.05)",
        hover: "0 8px 30px rgba(0, 0, 0, 0.12)",
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px -12px rgba(16, 24, 40, 0.10)",
        lift: "0 2px 4px rgba(16, 24, 40, 0.04), 0 16px 40px -16px rgba(16, 24, 40, 0.16)",
      },
      // 参考站的字号层级：超大标题 + 克制的正文
      fontSize: {
        "display": ["clamp(2.75rem, 6vw, 5rem)", { lineHeight: "1.04", letterSpacing: "-0.04em", fontWeight: "600" }],
        "headline": ["clamp(2rem, 3.6vw, 3rem)", { lineHeight: "1.14", letterSpacing: "-0.03em", fontWeight: "600" }],
        "subhead": ["1.0625rem", { lineHeight: "1.75" }],
        "eyebrow": ["0.8125rem", { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "500" }],
      },
      maxWidth: {
        page: "1200px",
        prose: "760px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
