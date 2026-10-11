import { CONDITION_SPECIAL_TESTS, getSpecialTest } from '@/data/specialTests'
import type { ConditionTag } from '@/types'

interface Props {
  symptomTags: ConditionTag[]
}

/**
 * 선택된 증상 태그에 맞는 특수검사(special test)를 안내하는 패널.
 * 검사가 없는 증상(라운드숄더·거북목처럼 관찰 중심이거나, 고관절수술후·무릎관절염처럼
 * 특수검사보다 영상·수술기록 확인이 우선인 경우)은 그 이유를 함께 보여준다.
 */
export default function SpecialTestPanel({ symptomTags }: Props) {
  if (symptomTags.length === 0) return null

  const withTests = symptomTags.filter((tag) => (CONDITION_SPECIAL_TESTS[tag as Exclude<ConditionTag, 'general'>]?.length ?? 0) > 0)
  const withoutTests = symptomTags.filter((tag) => !(CONDITION_SPECIAL_TESTS[tag as Exclude<ConditionTag, 'general'>]?.length))

  if (withTests.length === 0) return null

  return (
    <div className="rounded-lg bg-clinical-50 p-3">
      <p className="label-caption mb-2">선택한 증상별 참고 — 특수검사(special test)</p>
      <div className="space-y-3">
        {withTests.map((tag) => {
          const testIds = CONDITION_SPECIAL_TESTS[tag as Exclude<ConditionTag, 'general'>] ?? []
          return (
            <div key={tag}>
              <p className="mb-1 text-sm font-medium text-clinical-800">{tag}</p>
              <div className="space-y-2">
                {testIds.map((id) => {
                  const test = getSpecialTest(id)
                  if (!test) return null
                  return (
                    <details key={id} className="group rounded border border-clinical-200 bg-white p-2.5">
                      <summary className="cursor-pointer list-none text-xs font-semibold text-clinical-800">
                        <div className="flex items-center justify-between">
                          <span>
                            {test.name} <span className="font-normal text-clinical-400">· {test.targetArea}</span>
                          </span>
                          <span className="text-clinical-400 group-open:rotate-180">▾</span>
                        </div>
                      </summary>
                      <div className="mt-2 space-y-1.5 text-xs text-clinical-600">
                        <p>
                          <span className="font-medium text-clinical-700">목적</span> {test.purpose}
                        </p>
                        <div>
                          <span className="font-medium text-clinical-700">방법</span>
                          <ol className="mt-0.5 list-inside list-decimal space-y-0.5">
                            {test.method.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        <div>
                          <span className="font-medium text-alert-amber">주의사항</span>
                          <ul className="mt-0.5 list-inside list-disc space-y-0.5">
                            {test.precautions.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="rounded bg-clinical-50 p-1.5">
                          <span className="font-medium text-alert-red">양성 소견</span> {test.positiveFinding}
                          <br />
                          <span className="text-clinical-500">→ {test.positiveMeaning}</span>
                        </p>
                        <p className="rounded bg-clinical-50 p-1.5">
                          <span className="font-medium text-clinical-700">음성 소견</span> {test.negativeFinding}
                          <br />
                          <span className="text-clinical-500">→ {test.negativeMeaning}</span>
                        </p>
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {withoutTests.length > 0 && (
        <p className="mt-2 text-xs text-clinical-400">
          {withoutTests.join(', ')}은(는) 판정 기준이 뚜렷한 특수검사보다 자세 관찰이나 영상·수술기록 확인이 더
          중요한 항목이라 목록에서 제외했습니다.
        </p>
      )}
      <p className="mt-2 text-xs text-clinical-400">
        특수검사 결과는 확진이 아니라 정밀검사·전문의 의뢰가 필요한지 가늠하는 참고 자료입니다. 검사 자체가
        통증을 유발할 수 있으니 통증이 심하거나 급성기라면 무리하게 시행하지 마세요.
      </p>
    </div>
  )
}
