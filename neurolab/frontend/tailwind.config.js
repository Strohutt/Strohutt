/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#1b1814",
        panel2: "#242019",
        edge: "#39322a",
        accent: "#e6a23c",
        accent2: "#9aa7b0",
        danger: "#cf4b2c",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
