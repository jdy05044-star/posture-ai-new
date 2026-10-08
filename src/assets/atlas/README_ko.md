# PosturePT SVG atlas v0.1

앱용으로 새로 그린 골격·근육 SVG 6개입니다. 투명 배경, viewBox="0 0 600 1200". 정면·후면·우측면 각 방향에 골격/근육 파일이 있습니다. 상세 해부학 도판을 그대로 복제하거나 트레이싱한 자산이 아닙니다.

## 파일

- skeleton_front.svg / skeleton_back.svg / skeleton_right_side.svg
- muscle_front.svg / muscle_back.svg / muscle_right_side.svg
- atlas_manifest.json: 부위 ID, 한글명, 대상자 좌우, 심부 여부, 표시용 기준점
- atlas_renderer.js: 웹용 색상·선택·심부·골격 오버레이 연결 예시
- preview.html: 인터넷 없이 여는 미리보기. 파일을 선택하고 부위·상태·심부층을 시험할 수 있습니다.

## 상태 변경

근육 그룹 예: `<g id="upper_trapezius_right" class="muscle" data-muscle-id="upper_trapezius" data-side="right" data-state="unassessed">`.

data-state를 assessment_candidate / tightness_suspected / weakness_suspected로 바꾸면 노랑 / 빨강 사선 / 파랑 점 패턴이 적용됩니다. 기본값 unassessed는 미평가이며 정상 판정이 아닙니다. data-selected="true"는 선택 테두리를 표시합니다.

웹에서는 SVG를 inline DOM으로 넣고 atlas_renderer.js의 applyMuscleStates(svg, snapshot.muscle_hypotheses), selectRegion(svg, id)를 호출합니다. CSS.escape를 제공하는 브라우저를 사용합니다. `<img>`는 표시만 가능하고 내부 그룹 선택은 불가합니다. 여러 자산을 한 페이지에 동시에 inline으로 넣으면 title/pattern/layer ID와 url(#...) 참조를 자산별 접두사로 바꿔 충돌을 피해야 합니다. preview.html은 한 자산만 넣어 충돌을 방지합니다.

React는 SVG를 컴포넌트로 변환하거나 SVG 문자열을 신뢰된 로컬 자산에서 로드해 사용합니다. Flutter/React Native의 SVG 라이브러리에서는 CSS 선택자·pattern 지원이 다를 수 있습니다. 모바일 네이티브 구현은 선택된 그룹 내부 muscle-surface path의 fill/stroke를 직접 변경하고 접근 가능한 부위 목록을 별도로 제공합니다. SVG 파일만 넣으면 네이티브 클릭 이벤트가 자동으로 생기는 것은 아닙니다.

## 좌우와 방향

- 모든 left/right는 대상자 해부학적 좌우입니다.
- 정면: 대상자 오른쪽이 화면 왼쪽입니다.
- 후면: 대상자 오른쪽이 화면 오른쪽입니다.
- 우측면: 대상자의 오른쪽 면을 보고 있으며 얼굴은 화면 오른쪽을 향합니다.
- 좌측면 자산은 이번 패키지에 포함하지 않았습니다. 화면 반전만으로 우측면의 data-side를 좌측으로 자동 변경하지 마세요.

## 레이어

base_outline → superficial_layer → deep_layer → landmark_anchors → analysis_overlay.

deep_layer는 기본 display="none"입니다. 심부 영역은 투영된 위치를 나타내는 도식입니다. 피부 위에서 보이는 실제 근육처럼 표현하지 마세요. showDeepLayer는 표재층을 흐리게 하고 심부층을 따로 표시합니다. 전면의 내복사근·복횡근은 서로 겹치는 깊이 층이므로 개별 부위를 선택해 해당 그룹만 표시하는 방식이 더 적합합니다. 개별 심부 근육에 대한 정밀 단면 모델은 포함하지 않았습니다.

아킬레스건은 data-kind="tendon", 장경인대는 data-kind="fascia"입니다. applyMuscleStates는 이 영역에 근육 상태를 칠하지 않습니다. 근육군과 개별 근육은 manifest의 name_ko를 확인하세요.

## 골격 표시와 기준점

landmark_anchors는 모델에서의 표시용 기준점입니다. pose_proxy_display와 manual_marker_display를 구분했습니다. 실제 사진의 검출 좌표나 실측값이 아닙니다. analysis_overlay에 선·화살표·라벨을 추가하세요. renderer의 각도 표시선은 읽기 쉬운 도식으로 12° 범위에서 그림 변위를 제한하며 라벨에는 원래 수치를 남깁니다. 실제 신체 구조를 변형하거나 촬영 각도를 재현하는 기능이 아닙니다.

앞서 만든 snapshot과의 연결: finding.region="shoulder"는 shoulder anchors에, hip proxy는 region="hip"에 연결합니다. ASIS/PSIS 골반뼈 경사는 수동 표지점 입력으로 별도 구현하세요. 우측면은 좌우 pair가 없어 어깨 높이 오버레이가 적용되지 않습니다. 머리 전후 이동 등 측면 오버레이는 별도 구현해야 합니다.

## 범위와 검수

이 자산은 앱 개발에 사용할 수 있는 **1차 도식 모델**입니다. 모든 골격·근육을 망라하지 않고 자세 UI에 필요한 주요 영역을 제공하며, 심부 영역과 부착점·뼈 곡선은 단순화했습니다. 임상용 정밀 모델 또는 검수 완료 자산이라고 표시하지 마세요. 적용 전에 해부학 전문가에게 근육 경계·깊이·좌우·부착점·기준점 위치를 검수받고 asset_version을 올리세요.

참고 확인: 사용자 제공 Modern Pilates p28/p31/p33/p35의 명칭·배치. OpenStax Anatomy and Physiology 2e 11.4/11.6의 용어와 층 구분을 확인했으며 원본 그림은 이 패키지에 포함하거나 추적하지 않았습니다.

## 확인한 사항

SVG 6개 XML 파싱, 파일 내 ID 유일성, manifest 참조, 표재/심부와 좌우 일관성, 미평가 기본값, 근육/건/근막 구분, SVG 6개 PNG 렌더링 및 육안 점검. 브라우저/앱별 터치 이벤트는 통합 환경에서 별도 확인해야 합니다.
