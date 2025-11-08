/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37', // ذهبي
        cocoa: '#5A4632', // بني
        ink: '#111111',  // أسود نصوص
        base: '#FAFAFA', // خلفية فاتحة
        card: '#FFFFFF',
        line: '#EAE7E1',
        mute: '#6B7280'
      },
      boxShadow: {
        soft: '0 8px 24px rgba(17,17,17,0.06)'
      },
      borderRadius: { xl2: '1rem' },
      fontFamily: { sans: ['Inter','ui-sans-serif','system-ui'] }
    },
  },
  plugins: [],
}
