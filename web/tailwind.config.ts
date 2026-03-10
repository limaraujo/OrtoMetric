import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        secondary: "hsl(var(--secondary))",
        "muted-foreground": "hsl(var(--muted-foreground))",
      },
    },
  },
} satisfies Config;
