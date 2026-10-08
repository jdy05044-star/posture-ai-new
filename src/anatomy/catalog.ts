import type { AssessmentDomain, ProposedTarget } from './types'

/**
 * 평가 후보 규칙이 쓰는 근육 그룹 → 해부학 모델(atlas)의 근육 id.
 * 모델에 없는 근육은 만들어 넣지 않는다 (예: 견갑 안정근, 사각근 등은 이번 규칙에서 제외).
 */
export interface MuscleGroup {
  nameKo: string
  nameEn: string
  atlasMuscleIds: string[]
}

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
  upper_trapezius: { nameKo: '상부 승모근', nameEn: 'Upper trapezius', atlasMuscleIds: ['upper_trapezius'] },
  levator_scapulae: { nameKo: '견갑거근', nameEn: 'Levator scapulae', atlasMuscleIds: ['levator_scapulae'] },
  deep_neck_flexors: { nameKo: '깊은 목 굴곡근', nameEn: 'Deep neck flexors', atlasMuscleIds: ['deep_neck_flexors'] },
  suboccipitals: { nameKo: '후두하근군', nameEn: 'Suboccipital muscles', atlasMuscleIds: ['suboccipitals'] },
  iliopsoas: { nameKo: '장요근', nameEn: 'Iliopsoas', atlasMuscleIds: ['iliopsoas'] },
  rectus_femoris: { nameKo: '대퇴직근', nameEn: 'Rectus femoris', atlasMuscleIds: ['rectus_femoris'] },
  gluteus_maximus: { nameKo: '대둔근', nameEn: 'Gluteus maximus', atlasMuscleIds: ['gluteus_maximus'] },
  abdominals: {
    nameKo: '복부근',
    nameEn: 'Abdominal muscles',
    atlasMuscleIds: ['rectus_abdominis', 'external_oblique', 'internal_oblique', 'transversus_abdominis']
  },
  hamstrings: {
    nameKo: '햄스트링',
    nameEn: 'Hamstrings',
    atlasMuscleIds: ['biceps_femoris', 'semitendinosus', 'semimembranosus']
  },
  hip_abductors: {
    nameKo: '고관절 외전근군',
    nameEn: 'Hip abductors',
    atlasMuscleIds: ['gluteus_medius', 'tensor_fasciae_latae']
  }
}

export const TARGET_LABEL: Record<ProposedTarget, string> = {
  tightness: '긴장·길이 평가',
  function: '기능(근력·조절) 평가'
}

export const DOMAIN_LABEL: Record<AssessmentDomain, string> = {
  tone_length: '근긴장·길이 평가',
  strength_endurance: '근력·지구력 평가',
  movement_control: '움직임 조절 평가',
  range_of_motion: '관절가동범위 평가'
}

export const SIDE_LABEL = { left: '좌', right: '우' } as const
