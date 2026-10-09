/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 프리미엄 의료·피트니스 톤: 화이트 배경 + 딥네이비 메인 (요청 팔레트 기준)
        clinical: {
          50: '#f8fafc', // 배경
          100: '#eef2f6',
          200: '#d9e1e8',
          300: '#b7c4cf',
          400: '#8798a8',
          500: '#5c7086',
          600: '#3e5468',
          700: '#142d3e', // 메인 딥네이비
          800: '#0f2330',
          900: '#0b1a24',
          950: '#060e13'
        },
        mint: {
          50: '#eaf7f5',
          100: '#d1eee9',
          200: '#a8ded4',
          300: '#7bcbbe',
          400: '#52b6a6',
          500: '#36a69a', // 포인트 민트
          600: '#2b8a80',
          700: '#216b64',
          800: '#184e49',
          900: '#0f332f'
        },
        alert: {
          amber: '#b7791f',
          // 요청하신 코랄(#e88978)은 흰 배경 위 작은 글자에는 명도대비가 부족해(WCAG AA 미달),
          // 글자색은 같은 코랄 계열에서 조금 더 짙은 톤을 쓰고, 배경 틴트·포인트용으로 원래 톤을 별도로 둔다.
          red: '#c2503c',
          coral: '#e88978',
          // 약화 가능 근육 표시용 파랑 (딥네이비와 구분되도록 한 단계 밝은 톤)
          blue: '#2f6fb5'
        }
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
