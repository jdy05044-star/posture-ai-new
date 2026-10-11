/**
 * 운동 소개 카드 6종(브릿지·클램셸·버드독·턱 당기기·견갑골 모으기·숏풋).
 * 문구·근육·횟수는 사용자가 전달한 시안 이미지에서 옮긴 "AI 초안"이며 PT 검수 전이다.
 * 횟수·세트·유지 시간은 처방이 아니라 시안의 예시 값이다. PT가 확인하기 전에는 회원에게 처방으로 쓰지 않는다.
 * 사진·해부도는 같은 시안에서 잘라낸 AI 생성 이미지다. 고화질 원본이 있으면 같은 파일명으로 교체한다.
 */
export interface ShowcaseExercise {
  slug: string
  no: number
  name: string
  nameEn: string
  level: string
  tags: string[]
  purpose: string
  roles: { primary: string[]; secondary: string[]; stabilizer: string[]; overuse: string[]; overuseNote?: string }
  steps: string[]
  points: string[]
  reps: string
  sets: string
  hold: string
}

export const SHOWCASE_IMAGE_DIR = '/images/exercises/showcase'

export const SHOWCASE: ShowcaseExercise[] = [
  {
    slug: 'bridge', no: 1, name: '브릿지', nameEn: 'Bridge', level: '초급', tags: ['골반', '코어'],
    purpose: '골반 안정성과 둔근 활성화',
    roles: { primary: ['대둔근', '햄스트링'], secondary: ['중둔근', '척추기립근', '복횡근'], stabilizer: ['복횡근', '다열근'], overuse: ['요추기립근'], overuseNote: '허리만 과하게 쓰는 경우' },
    steps: ['무릎을 세우고 바르게 눕습니다.', '복부에 힘을 주고 엉덩이를 들어 올립니다.', '어깨-골반-무릎이 일직선이 되게 유지합니다.', '천천히 내려옵니다.'],
    points: ['엉덩이 뒤쪽에 힘이 들어와야 합니다.', '허리가 과하게 꺾이지 않게 합니다.'],
    reps: '10-12회', sets: '2-3세트', hold: '2-3초 유지'
  },
  {
    slug: 'clamshell', no: 2, name: '클램셸', nameEn: 'Clamshell', level: '초급', tags: ['골반', '둔근'],
    purpose: '엉덩이 옆 근육 활성화로 골반 안정화',
    roles: { primary: ['중둔근', '소둔근'], secondary: ['대둔근', '대퇴근막장근'], stabilizer: ['복부 근육'], overuse: ['허리 근육'], overuseNote: '골반이 뒤로 넘어가는 경우' },
    steps: ['옆으로 누워 무릎을 90도로 구부립니다.', '허리가 움직이지 않도록 유지합니다.', '위쪽 무릎을 천천히 열었다가 닫습니다.', '반대쪽도 동일하게 실시합니다.'],
    points: ['엉덩이 옆쪽에 자극이 와야 합니다.', '골반이 뒤로 넘어가지 않게 합니다.'],
    reps: '12-15회 (각 측)', sets: '2-3세트', hold: '2초 유지'
  },
  {
    slug: 'birddog', no: 3, name: '버드독', nameEn: 'Bird Dog', level: '초급', tags: ['코어', '허리'],
    purpose: '코어 안정성과 척추·골반 제어',
    roles: { primary: ['다열근', '복횡근'], secondary: ['둔근', '어깨 안정근'], stabilizer: ['복사근', '골반저근'], overuse: ['허리 근육'], overuseNote: '요추 과신전' },
    steps: ['네발기기 자세를 취합니다.', '복부에 힘을 주고 한쪽 팔과 반대쪽 다리를 쭉 뻗습니다.', '몸통이 흔들리지 않게 유지하고 천천히 돌아옵니다.', '반복 후 반대쪽도 실시합니다.'],
    points: ['허리가 꺾이지 않도록 합니다.', '몸통이 흔들리지 않게 유지합니다.'],
    reps: '8-10회 (각 측)', sets: '2-3세트', hold: '3초 유지'
  },
  {
    slug: 'chintuck', no: 4, name: '턱 당기기', nameEn: 'Chin Tuck / Nose Nod', level: '초급', tags: ['목', '자세교정'],
    purpose: '거북목 교정 및 심부목굽힘근 활성화',
    roles: { primary: ['심부목굽힘근'], secondary: ['경추 안정근'], stabilizer: ['하부승모근', '전거근'], overuse: ['흉쇄유돌근', '상부승모근'] },
    steps: ['바르게 앉거나 누운 자세에서 턱을 가볍게 당깁니다.', '목을 숙이지 말고 수평으로 당기듯이 움직입니다.', '3초 유지 후 천천히 이완합니다.', '반복합니다.'],
    points: ['목 앞쪽이 길어지는 느낌이 납니다.', '턱이 아래로 떨어지지 않게 합니다.'],
    reps: '10-15회', sets: '2-3세트', hold: '3초 유지'
  },
  {
    slug: 'scapular', no: 5, name: '견갑골 모으기', nameEn: 'Scapular Retraction', level: '초급', tags: ['어깨', '자세교정'],
    purpose: '견갑 안정성과 어깨 정렬 개선',
    roles: { primary: ['중부승모근', '하부승모근', '능형근'], secondary: ['후면삼각근'], stabilizer: ['전거근'], overuse: ['상부승모근'], overuseNote: '어깨를 올리는 경우' },
    steps: ['바르게 앉거나 선 자세에서 어깨를 편안하게 둡니다.', '견갑골을 뒤로 모으고 아래로 내립니다.', '2-3초 유지 후 천천히 이완합니다.', '반복합니다.'],
    points: ['어깨가 올라가지 않게 합니다.', '등 중앙이 조이는 느낌이어야 합니다.'],
    reps: '10-12회', sets: '2-3세트', hold: '2-3초 유지'
  },
  {
    slug: 'shortfoot', no: 6, name: '숏풋', nameEn: 'Short Foot', level: '초급', tags: ['발', '안정화'],
    purpose: '발 아치 활성화 및 발 안정화',
    roles: { primary: ['내재근 (족저근)', '후경골근'], secondary: ['장/단비골근', '종아리 근육'], stabilizer: ['발목 주변 근육'], overuse: ['발가락 과굴곡'], overuseNote: '발가락으로만 힘 주는 경우' },
    steps: ['서거나 앉은 자세에서 발을 바닥에 둡니다.', '발가락을 구부리지 않고 발 아치를 들어 올립니다.', '3초 유지 후 천천히 이완합니다.', '반복합니다.'],
    points: ['발 안쪽 아치가 올라가는 느낌이 나야 합니다.', '발가락이 말리지 않게 합니다.'],
    reps: '10-15회', sets: '2-3세트', hold: '3초 유지'
  }
]
