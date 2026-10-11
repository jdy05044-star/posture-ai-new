// 빌드 전에 실행됩니다. 번호가 붙은 묶음 폴더(1번_기본파일, 2번_components와_assets, 3~5번_사진)에 들어 있는
// src 와 public 을 저장소 맨 위의 src, public 으로 옮겨 앱이 읽을 수 있게 합니다.
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const nfc = (s) => s.normalize('NFC')
const parts = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((n) => /^[1-5]번_/.test(nfc(n)) && !nfc(n).includes('web') && !nfc(n).includes('설정'))
  .sort()

console.log('[assemble] 묶음 폴더:', parts.map(nfc).join(', ') || '(없음)')
if (parts.length === 0) {
  console.log('[assemble] 묶음 폴더가 없어 기존 src, public 을 그대로 사용합니다.')
  process.exit(0)
}

fs.rmSync(path.join(root, 'src'), { recursive: true, force: true })
fs.rmSync(path.join(root, 'public'), { recursive: true, force: true })

for (const p of parts) {
  for (const sub of ['src', 'public']) {
    const from = path.join(root, p, sub)
    if (fs.existsSync(from)) {
      fs.cpSync(from, path.join(root, sub), { recursive: true, force: true })
      console.log('[assemble] 복사:', nfc(p) + '/' + sub, '->', sub)
    }
  }
}

const must = [
  'src/main.tsx',
  'src/App.tsx',
  'src/lib/version.ts',
  'src/components/ExerciseCard.tsx',
  'src/components/ExercisePanel.tsx',
  'src/library/MusclePhotoToggle.tsx',
  'src/assets/atlas/muscle_front.svg',
  'public/favicon.svg',
  'public/images/exercises/ex041.webp',
  'public/images/exercises/anatomy/ex041-target.webp'
]
const missing = must.filter((f) => !fs.existsSync(path.join(root, f)))
const count = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { recursive: true }).length : 0)
console.log('[assemble] src 항목 수:', count('src'), '/ public 항목 수:', count('public'))
if (missing.length) {
  console.error('[assemble] 빠진 파일:', missing.join(', '))
  process.exit(1)
}
console.log('[assemble] 완료')
