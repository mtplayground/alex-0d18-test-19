import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#152026",
        meadow: "#2f7d57",
        coral: "#d85c46",
        mist: "#eff5f2"
      }
    }
  },
  plugins: []
} satisfies Config;
