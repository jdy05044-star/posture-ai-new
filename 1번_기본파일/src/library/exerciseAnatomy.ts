import type { ExerciseEnrichment } from './types'

/**
 * 운동 자료의 한글 근육 이름 → 해부도(atlas)의 근육 id.
 * 해부도에 없는 근육(예: 소둔근, 깊은 외회전근, 복횡근 이외의 심부근)은 그림에 칠하지 않고 이름 칩으로만 보여준다.
 * 표기가 모호한 이름은 억지로 연결하지 않는다.
 */
export const MUSCLE_NAME_TO_ATLAS: Record<string, string[]> = {
  대둔근: ['gluteus_maximus'],
  중둔근: ['gluteus_medius'],
  햄스트링: ['biceps_femoris', 'semitendinosus', 'semimembranosus'],
  복횡근: ['transversus_abdominis'],
  '복부 안정화 근육': ['transversus_abdominis', 'internal_oblique', 'external_oblique', 'rectus_abdominis'],
  복근: ['rectus_abdominis', 'external_oblique', 'internal_oblique', 'transversus_abdominis'],
  복직근: ['rectus_abdominis'],
  복사근: ['external_oblique', 'internal_oblique'],
  척추기립근: ['erector_spinae'],
  요추기립근: ['erector_spinae'],
  요방형근: ['quadratus_lumborum'],
  대퇴근막장근: ['tensor_fasciae_latae'],
  장요근: ['iliopsoas'],
  대퇴직근: ['rectus_femoris'],
  '상부 승모근': ['upper_trapezius'],
  상부승모근: ['upper_trapezius'],
  하부승모근: ['lower_trapezius'],
  견갑거근: ['levator_scapulae'],
  능형근: ['rhomboids'],
  전거근: ['serratus_anterior'],
  광배근: ['latissimus_dorsi'],
  삼각근: ['deltoid'],
  흉근: ['pectoralis_major', 'pectoralis_minor'],
  삼두근: ['triceps_brachii'],
  '목 굴곡 조절': ['deep_neck_flexors']
}

export type MuscleRole = 'primary' | 'secondary' | 'stabilizer' | 'overuse'

/** 같은 근육이 여러 역할에 있으면 앞선 역할이 이긴다. */
export const ROLE_ORDER: MuscleRole[] = ['primary', 'secondary', 'stabilizer', 'overuse']

export const ROLE_LABEL: Record<MuscleRole, string> = {
  primary: '주 타깃',
  secondary: '보조',
  stabilizer: '안정화',
  overuse: '과사용 주의'
}

export const ROLE_COLOR: Record<MuscleRole, string> = {
  primary: '#e8888f', // 코랄
  secondary: '#efcb73', // 노랑
  stabilizer: '#8cb7e1', // 파랑
  overuse: '#a98bd4' // 보라
}

export interface AnatomyPlan {
  /** atlas 근육 id → 역할 */
  roleByAtlasId: Record<string, MuscleRole>
  /** 그림에 칠할 수 없는(해부도에 없는) 근육 이름 */
  unmapped: { name: string; role: MuscleRole }[]
}

export function planAnatomy(e: ExerciseEnrichment): AnatomyPlan {
  const roleByAtlasId: Record<string, MuscleRole> = {}
  const unmapped: AnatomyPlan['unmapped'] = []
  for (const role of ROLE_ORDER) {
    for (const name of e[role]) {
      const ids = MUSCLE_NAME_TO_ATLAS[name]
      if (!ids) {
        unmapped.push({ name, role })
        continue
      }
      for (const id of ids) if (!(id in roleByAtlasId)) roleByAtlasId[id] = role
    }
  }
  return { roleByAtlasId, unmapped }
}
