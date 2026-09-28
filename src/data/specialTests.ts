import type { ConditionTag } from '@/types'

/**
 * 증상/질환별 특수검사(special test) 라이브러리.
 *
 * 여기 실린 검사들은 정형/PT 임상에서 널리 통용되는 표준 검사(SLR, Neer, Hawkins-Kennedy,
 * Empty can, Apprehension test, Tinel's sign 등)로, 특정 교재의 서술을 옮긴 것이 아니라
 * 검사 방법·판정 기준에 대한 일반 지식을 바탕으로 새로 설명을 작성했다.
 *
 * 주의:
 * - 이 앱은 영상/특수 진단 장비가 없는 상태에서 PT가 스크리닝 목적으로 참고하는 도구다.
 *   특수검사 결과는 확진이 아니라 "다음 단계(정밀검사·전문의 의뢰)가 필요한지"를 가늠하는
 *   참고 자료로만 쓰여야 한다는 점을 화면에도 함께 안내한다.
 * - 검사 자체가 통증·증상을 유발할 수 있으므로, 통증이 심하거나 급성기인 경우 검사를 미루고
 *   전문의 의뢰를 우선하라는 주의사항을 포함한다.
 */
export interface SpecialTest {
  id: string
  name: string
  /** 검사 대상 부위 (환자에게 안내할 때 쓰는 간단한 라벨) */
  targetArea: string
  /** 이 검사로 확인하려는 것 */
  purpose: string
  /** 검사 시행 단계 */
  method: string[]
  /** 시행 전/중 주의사항 */
  precautions: string[]
  /** 양성일 때 나타나는 소견 */
  positiveFinding: string
  /** 양성일 때 시사하는 것 */
  positiveMeaning: string
  /** 음성일 때 나타나는 소견 */
  negativeFinding: string
  /** 음성일 때 시사하는 것 */
  negativeMeaning: string
}

export const SPECIAL_TESTS: SpecialTest[] = [
  {
    id: 'slr',
    name: '하지직거상 검사 (Straight Leg Raise, SLR test)',
    targetArea: '허리·다리',
    purpose: '허리 디스크로 인한 신경근 자극(좌골신경통) 여부를 확인합니다.',
    method: [
      '환자를 바로 눕게 한다.',
      '무릎을 편 상태로 검사자가 한쪽 다리를 천천히 들어올린다(고관절 굴곡).',
      '통증이나 저림이 나타나는 각도와 부위를 확인한다.'
    ],
    precautions: [
      '무릎이 굽혀지지 않도록 유지해야 정확하다.',
      '통증이 나타나면 즉시 동작을 멈추고 그 각도를 기록한다.',
      '급성 허리 통증이 매우 심한 경우에는 검사를 무리하게 진행하지 않는다.'
    ],
    positiveFinding: '다리를 30~70도 정도 들었을 때 엉덩이~다리 뒤쪽으로 저리거나 뻗치는 통증이 재현된다.',
    positiveMeaning: '신경근이 자극받고 있을 가능성을 시사하며, 디스크 등 정밀 평가가 필요할 수 있다고 알려져 있습니다.',
    negativeFinding: '다리를 들어올려도 허리 국소 통증 외에 다리로 뻗치는 저림이 나타나지 않는다.',
    negativeMeaning: '신경근 자극 가능성은 낮다고 참고할 수 있으나, 다른 원인의 허리 통증은 배제되지 않습니다.'
  },
  {
    id: 'slump',
    name: '슬럼프 검사 (Slump test)',
    targetArea: '허리·다리',
    purpose: 'SLR 검사와 함께 신경 조직의 긴장에 의한 증상 재현 여부를 확인합니다.',
    method: [
      '환자를 의자 끝에 앉게 한다.',
      '등을 둥글게 구부리고(slump), 고개를 숙이게 한 뒤 무릎을 편다.',
      '발목을 배굴(발끝을 몸 쪽으로 당김)시키며 증상 변화를 확인한다.'
    ],
    precautions: ['통증이 심해지면 즉시 자세를 풀어준다.', '단계별로 천천히 진행해 어느 단계에서 증상이 나타나는지 확인한다.'],
    positiveFinding: '자세를 진행하면서 다리 뒤쪽 저림·통증이 재현되고, 고개를 들면 증상이 줄어든다.',
    positiveMeaning: '신경 조직의 긴장과 관련된 증상일 가능성을 시사한다고 알려져 있습니다.',
    negativeFinding: '자세를 끝까지 진행해도 다리로 뻗치는 증상이 나타나지 않는다.',
    negativeMeaning: '신경 긴장에 의한 증상 가능성은 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'kemp',
    name: '켐프 검사 (Kemp\'s test)',
    targetArea: '허리',
    purpose: '허리를 신전·회전·측굴 했을 때 통증이 재현되는지 확인해 후관절(facet) 관련 문제를 참고합니다.',
    method: [
      '환자를 세우거나 앉힌 상태에서 허리를 뒤로 젖히면서 통증 있는 쪽으로 살짝 돌리고 옆으로 기울이게 한다.',
      '해당 동작에서 통증의 위치와 정도를 확인한다.'
    ],
    precautions: ['척추전방전위증·척추관협착증처럼 신전 동작 자체가 금기인 경우엔 이 검사도 신중하게 접근해야 한다.'],
    positiveFinding: '해당 동작에서 허리 국소(주로 한쪽) 통증이 뚜렷하게 재현된다.',
    positiveMeaning: '후관절이나 신경공 주변 구조물의 문제와 관련될 수 있다고 참고됩니다.',
    negativeFinding: '동작을 해도 특별한 통증 재현이 없다.',
    negativeMeaning: '후관절 관련 문제 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'stork',
    name: '스토크 검사 (Stork / one-leg standing extension test)',
    targetArea: '허리(척추 분리증·전방전위증 스크리닝)',
    purpose: '한 다리로 서서 허리를 젖힐 때 통증이 재현되는지 확인합니다.',
    method: ['환자를 한 다리로 서게 한다.', '그 상태로 허리를 뒤로 젖히게 한다.', '반대쪽 다리로도 반복해 좌우를 비교한다.'],
    precautions: ['균형을 잃지 않도록 옆에서 보조한다.', '허리를 젖히는 동작이라 이미 신전 시 통증이 심한 경우 무리하지 않는다.'],
    positiveFinding: '한 다리로 서서 허리를 젖힐 때 그 쪽 허리에 날카로운 통증이 재현된다.',
    positiveMeaning: '척추 분리증·전방전위증 등과 관련될 수 있다고 참고되며 정밀 검사가 필요할 수 있습니다.',
    negativeFinding: '양쪽 다 특별한 통증 없이 동작이 가능하다.',
    negativeMeaning: '해당 문제 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'schober',
    name: '쇼버 검사 (Schober test)',
    targetArea: '허리(가동성)',
    purpose: '허리를 굽힐 때 요추 분절의 가동성이 정상적으로 늘어나는지 확인합니다.',
    method: [
      '환자를 세운 상태에서 좌우 후상장골극(엉덩이 뒤 뼈 돌출부)을 잇는 선을 기준점으로 잡는다.',
      '기준점에서 위로 10cm 지점을 표시한다.',
      '환자가 허리를 최대한 굽히게 한 뒤, 두 지점 사이 거리가 얼마나 늘어나는지 잰다.'
    ],
    precautions: ['표시가 정확해야 신뢰도가 높다.', '통증으로 인한 제한과 관절 자체의 뻣뻣함을 구분해서 봐야 한다.'],
    positiveFinding: '허리를 굽혀도 두 지점 사이 거리가 기준치만큼 늘어나지 않는다(가동성 제한).',
    positiveMeaning: '강직성척추염 등에서 나타날 수 있는 척추 가동성 저하를 시사한다고 알려져 있습니다.',
    negativeFinding: '거리가 정상 범위만큼 늘어난다.',
    negativeMeaning: '척추 가동성 자체는 크게 제한되지 않았다고 참고할 수 있습니다.'
  },
  {
    id: 'faber',
    name: '페이버 검사 (FABER / Patrick test)',
    targetArea: '골반·고관절·천장관절',
    purpose: '고관절 또는 천장관절 문제로 인한 통증을 감별합니다.',
    method: [
      '환자를 바로 눕힌다.',
      '검사하는 쪽 다리를 굽히고(Flexion) 벌리고(Abduction) 바깥으로 돌려(External Rotation) 발목을 반대쪽 무릎 위에 얹는다.',
      '검사하는 쪽 무릎을 천천히 바닥 쪽으로 누르면서 통증 위치를 확인한다.'
    ],
    precautions: ['고관절 수술 후 등 해당 자세 자체가 금기인 경우 시행하지 않는다.', '무릎을 누르는 압력은 서서히 가한다.'],
    positiveFinding: '엉덩이 뒤쪽(천장관절 부위) 또는 사타구니 쪽에 통증이 재현된다.',
    positiveMeaning: '통증 위치에 따라 천장관절 기능부전이나 고관절 문제와 관련될 수 있다고 참고됩니다.',
    negativeFinding: '특별한 통증 없이 무릎이 바닥 가까이까지 내려간다.',
    negativeMeaning: '해당 부위 문제 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'gaenslen',
    name: '겐슬렌 검사 (Gaenslen\'s test)',
    targetArea: '천장관절',
    purpose: '천장관절에 반대 방향의 압박을 줘서 통증이 재현되는지 확인합니다.',
    method: [
      '환자를 바로 눕히고 검사하는 쪽 다리를 침대 밖으로 걸치듯 늘어뜨린다.',
      '반대쪽 다리는 무릎을 가슴 쪽으로 당기게 한다.',
      '늘어뜨린 다리를 아래로, 당긴 다리를 가슴 쪽으로 동시에 눌러 천장관절에 반대 방향 힘을 준다.'
    ],
    precautions: ['압력은 서서히, 환자 반응을 보며 가한다.'],
    positiveFinding: '엉덩이 뒤쪽 천장관절 부위에 통증이 재현된다.',
    positiveMeaning: '천장관절 기능부전과 관련될 수 있다고 참고됩니다.',
    negativeFinding: '특별한 통증이 재현되지 않는다.',
    negativeMeaning: '천장관절 문제 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'thigh-thrust',
    name: '대퇴 압박 검사 (Thigh Thrust test)',
    targetArea: '천장관절',
    purpose: '고관절을 통해 천장관절에 직접 압박을 주어 통증을 확인합니다.',
    method: [
      '환자를 바로 눕히고 검사하는 쪽 고관절·무릎을 90도로 굽힌다.',
      '무릎을 통해 대퇴골 방향으로 천천히 압박을 가한다.'
    ],
    precautions: ['압박은 급격하지 않게 서서히 가한다.'],
    positiveFinding: '엉덩이 뒤쪽 천장관절 부위에 통증이 재현된다.',
    positiveMeaning: '천장관절 기능부전과 관련될 수 있다고 참고됩니다.',
    negativeFinding: '특별한 통증이 재현되지 않는다.',
    negativeMeaning: '천장관절 문제 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'neer',
    name: '니어 검사 (Neer test)',
    targetArea: '어깨',
    purpose: '어깨를 들어올릴 때 회전근개나 견봉 아래 구조물이 충돌하며 통증이 생기는지 확인합니다.',
    method: [
      '환자의 팔을 편 상태로, 엄지가 아래를 향하게 한다.',
      '검사자가 환자의 팔을 수동으로 천천히 머리 위까지 들어올린다.'
    ],
    precautions: ['통증이 심하면 바로 멈춘다.', '어깨 탈구 경험이 있는 경우 다른 검사와 함께 신중히 해석한다.'],
    positiveFinding: '팔을 들어올리는 후반부(특히 어깨 높이 이상)에서 날카로운 통증이 나타난다.',
    positiveMeaning: '견봉하충돌증후군이나 회전근개 병변과 관련될 수 있다고 참고됩니다.',
    negativeFinding: '끝까지 들어올려도 특별한 통증이 없다.',
    negativeMeaning: '해당 문제 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'hawkins-kennedy',
    name: '호킨스-케네디 검사 (Hawkins-Kennedy test)',
    targetArea: '어깨',
    purpose: 'Neer 검사와 함께 견봉하충돌 여부를 다른 각도에서 확인합니다.',
    method: [
      '환자의 팔을 어깨 높이(90도)까지 들어올리고 팔꿈치를 90도로 굽힌다.',
      '검사자가 팔을 안쪽으로 돌리듯(내회전) 움직인다.'
    ],
    precautions: ['어깨 불안정성이 의심되면 동작 범위를 보수적으로 접근한다.'],
    positiveFinding: '내회전 동작에서 어깨 앞쪽·바깥쪽에 통증이 재현된다.',
    positiveMeaning: '견봉하충돌증후군과 관련될 수 있다고 참고됩니다.',
    negativeFinding: '특별한 통증 없이 동작이 가능하다.',
    negativeMeaning: '해당 문제 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'empty-can',
    name: '엠티 캔 검사 (Empty Can / Jobe\'s test)',
    targetArea: '어깨 (극상근)',
    purpose: '회전근개 중 극상근의 근력·통증 여부를 확인합니다.',
    method: [
      '환자가 팔을 옆으로 든 상태(약 90도, 앞으로 30도)에서 엄지가 아래를 향하게(캔을 비우듯) 자세를 잡는다.',
      '검사자가 아래로 누르는 힘에 저항하도록 한다.'
    ],
    precautions: ['이미 통증이 심한 어깨에는 강한 저항을 주지 않고 가볍게 확인한다.'],
    positiveFinding: '저항 시 통증이 나타나거나, 힘이 눈에 띄게 약해져 버틴다.',
    positiveMeaning: '극상근 관련 회전근개 병변을 시사한다고 참고됩니다.',
    negativeFinding: '통증 없이 저항을 잘 버틴다.',
    negativeMeaning: '극상근 문제 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'drop-arm',
    name: '드롭 암 검사 (Drop Arm test)',
    targetArea: '어깨 (회전근개)',
    purpose: '회전근개의 큰 파열 여부를 확인합니다.',
    method: [
      '검사자가 환자의 팔을 90도 옆으로 들어올려 지지해준다.',
      '지지를 놓으며 환자에게 그 자세를 스스로 유지해보게 한다.'
    ],
    precautions: ['갑자기 지지를 놓으면 팔이 떨어지며 다칠 수 있으니 천천히, 아래에서 받쳐줄 준비를 한 채 진행한다.'],
    positiveFinding: '팔을 스스로 유지하지 못하고 통증과 함께 툭 떨어진다.',
    positiveMeaning: '회전근개의 큰 파열 가능성을 시사한다고 알려져 있어 정밀 검사(영상)·전문의 의뢰가 필요할 수 있습니다.',
    negativeFinding: '팔을 스스로 조절하며 천천히 내릴 수 있다.',
    negativeMeaning: '큰 파열 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'apprehension',
    name: '불안 검사 (Apprehension test)',
    targetArea: '어깨 (불안정성)',
    purpose: '어깨가 앞으로 빠질 것 같은 불안정성이 있는지 확인합니다.',
    method: [
      '환자를 눕히거나 앉힌 상태에서 팔을 90도 벌리고 팔꿈치를 90도 굽힌다.',
      '검사자가 팔을 천천히 바깥으로 돌린다(외회전).'
    ],
    precautions: ['탈구 경험이 있는 환자에게는 특히 천천히, 환자가 멈추라고 하면 즉시 중단한다.'],
    positiveFinding: '동작 중 통증보다 "빠질 것 같다"는 불안감·방어적인 반응이 뚜렷하게 나타난다.',
    positiveMeaning: '어깨 앞쪽 불안정성을 시사한다고 알려져 있습니다.',
    negativeFinding: '불안감 없이 동작을 편하게 받아들인다.',
    negativeMeaning: '불안정성 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'relocation',
    name: '재정복 검사 (Relocation test)',
    targetArea: '어깨 (불안정성)',
    purpose: 'Apprehension test 양성일 때, 앞쪽에서 지지해주면 불안감이 줄어드는지 확인해 불안정성을 재확인합니다.',
    method: ['Apprehension test 자세에서 불안감이 나타나면, 검사자가 상완골 앞쪽을 뒤로 살짝 눌러 지지해준다.'],
    precautions: ['Apprehension test와 이어서 진행하며, 힘을 세게 주지 않는다.'],
    positiveFinding: '앞쪽을 지지해주면 불안감·통증이 눈에 띄게 줄어든다.',
    positiveMeaning: '앞쪽 불안정성일 가능성을 더 뒷받침한다고 참고됩니다.',
    negativeFinding: '지지해줘도 불안감에 큰 변화가 없다.',
    negativeMeaning: '다른 원인의 통증일 가능성도 함께 고려해볼 수 있습니다.'
  },
  {
    id: 'tinel-wrist',
    name: '티넬 징후 (Tinel\'s sign, 손목)',
    targetArea: '손목 (정중신경)',
    purpose: '손목 앞쪽 정중신경이 눌려있는지 확인합니다.',
    method: ['손목 앞쪽(수근관 부위)을 손가락이나 타진기로 가볍게 톡톡 두드린다.'],
    precautions: ['너무 세게 두드리지 않는다.'],
    positiveFinding: '두드릴 때 엄지·검지·중지 쪽으로 찌릿한 저림이 뻗친다.',
    positiveMeaning: '손목터널증후군(정중신경 압박)을 시사한다고 알려져 있습니다.',
    negativeFinding: '두드려도 저림 없이 국소적인 느낌만 있다.',
    negativeMeaning: '해당 부위 신경 압박 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'phalen',
    name: '팔렌 검사 (Phalen\'s test)',
    targetArea: '손목 (정중신경)',
    purpose: '손목을 굽힌 자세를 유지했을 때 신경 압박 증상이 나타나는지 확인합니다.',
    method: ['양쪽 손등을 맞대듯 손목을 최대한 굽힌 자세로 약 1분간 유지하게 한다.'],
    precautions: ['1분 정도의 시간이 필요하므로 환자에게 미리 안내한다.'],
    positiveFinding: '1분 이내에 엄지~중지 쪽으로 저림·찌릿함이 나타난다.',
    positiveMeaning: '손목터널증후군을 시사한다고 알려져 있습니다.',
    negativeFinding: '1분간 유지해도 저림이 나타나지 않는다.',
    negativeMeaning: '해당 문제 가능성은 상대적으로 낮다고 참고할 수 있습니다.'
  },
  {
    id: 'navicular-drop',
    name: '주상골 하강 검사 (Navicular Drop test)',
    targetArea: '발 (아치)',
    purpose: '체중을 실었을 때 발 안쪽 아치가 얼마나 내려앉는지 확인해 평발 경향을 참고합니다.',
    method: [
      '체중을 싣지 않은 상태에서 발 안쪽 주상골 위치의 높이를 표시·측정한다.',
      '자연스럽게 서서 체중을 실은 상태에서 같은 지점의 높이를 다시 측정한다.',
      '두 측정값의 차이를 비교한다.'
    ],
    precautions: ['같은 지점을 정확히 짚어야 신뢰도가 높다.'],
    positiveFinding: '체중을 실었을 때 주상골 높이가 기준치 이상으로 많이 내려앉는다.',
    positiveMeaning: '아치 지지력 저하(평발 경향)를 시사한다고 참고됩니다.',
    negativeFinding: '높이 변화가 크지 않다.',
    negativeMeaning: '아치 지지력은 비교적 유지되고 있다고 참고할 수 있습니다.'
  }
]

/**
 * 증상(ConditionTag)별로 참고하면 좋은 특수검사 id 목록.
 * 모든 질환에 "양성/음성으로 판정하는 특수검사"가 있는 것은 아니다 — 라운드숄더·거북목처럼
 * 자세 관찰이 중심인 항목이나, 고관절수술후·무릎관절염처럼 특수검사보다 영상 검사·수술 기록
 * 확인이 우선인 항목은 목록에 포함하지 않고, 화면에서 그 이유를 함께 안내한다.
 */
export const CONDITION_SPECIAL_TESTS: Partial<Record<Exclude<ConditionTag, 'general'>, string[]>> = {
  요통: ['slr', 'kemp'],
  디스크: ['slr', 'slump'],
  척추전방전위증: ['stork'],
  척추관협착증: ['kemp'],
  강직성척추염: ['schober', 'faber'],
  회전근개병변: ['neer', 'hawkins-kennedy', 'empty-can', 'drop-arm'],
  오십견: ['hawkins-kennedy'],
  어깨불안정: ['apprehension', 'relocation'],
  손목터널증후군: ['tinel-wrist', 'phalen'],
  천장관절기능부전: ['faber', 'gaenslen', 'thigh-thrust'],
  평발: ['navicular-drop']
}

export function getSpecialTest(id: string): SpecialTest | undefined {
  return SPECIAL_TESTS.find((t) => t.id === id)
}
