"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "uz" | "ko";
const STORAGE_KEY = "lang";

const dict = {
  en: {
    // Nav
    "nav.cogging": "Cogging Program",
    "nav.processing_map": "Processing Map",
    "nav.preform_3d": "3D Preform",
    "nav.compare": "Model Comparison",
    "nav.history": "History",
    "nav.messages": "Messages",
    "nav.logout": "Logout",
    "nav.help": "Help",
    "nav.leave_message": "Leave message",
    "nav.language": "Language",

    // Sample buttons
    "sample.try": "Try with sample",
    "sample.loading": "Loading sample...",
    "sample.first_run_3d": "Sample run uses a 218 MB U-Net model — first call may take 30-60s.",

    // Welcome
    "welcome.title": "Welcome to ForgeIQ",
    "welcome.subtitle": "A short guide to get you started. You can re-open this from the help menu.",
    "welcome.cogging_desc": "Train a model from your cogging Excel, correct training data, and compute optimal pass schedules.",
    "welcome.pmap_desc": "2D / 3D processing-map graphs with optional Simufact and DEFORM particle overlays.",
    "welcome.preform_desc": "Convert voxel predictions into smooth STL geometry for downstream simulation.",
    "welcome.tip": "Every form has a yellow Try with sample button — click it to see results without uploading any of your own files.",
    "welcome.skip": "Skip",
    "welcome.got_it": "Got it",

    // Common
    "common.generate": "Generate",
    "common.loading": "Loading...",
    "common.download": "Download",
    "common.email": "Email",
    "common.password": "Password",
    "common.name": "Full name",
    "common.login": "Login",
    "common.register": "Register",
    "common.dont_have_account": "Don't have an account",
    "common.have_account": "I have an account",
    "common.login_creds": "Login with your credentials",
    "common.create_account": "Create new account",

    // History
    "history.title": "Computation history",
    "history.subtitle": "Every computation you run is saved here so you can review parameters later. Only you can see this list.",
    "history.empty": "No computations yet",
    "history.empty_sub": "Run a service and it will appear here.",
    "history.open_cogging": "Open Cogging",
    "history.open_pmap": "Open Processing Map",
    "history.open_preform": "Open 3D Preform",
    "history.compare": "Compare",
    "history.compare_cancel": "Cancel",
    "history.compare_select": "Select another entry to compare",

    // Service labels (shared with backend names)
    "svc.train_model": "Train Model",
    "svc.gradient_boosting": "Train Model (GB)",
    "svc.train_correction": "Train Data Correction",
    "svc.pass_schedule": "Pass Schedule",
    "svc.main_graph": "Main Graph",
    "svc.plot_vs_strain": "Plot vs Strain",
    "svc.collect_for_strain": "Collect for Strain",
    "svc.pinn_surrogate": "PINN Surrogate",
    "svc.preform_3d": "3D Preform",
    "svc.display_3d": "Display 3D Model",

    // Mode toggle
    "mode.quick": "Quick",
    "mode.advanced": "Advanced (upload files)",
    "mode.quick_label": "Quick mode:",
    "mode.advanced_label": "Advanced mode:",
    "mode.quick_banner": "just fill in the parameters below — the platform will use a bundled reference dataset to run the calculation. No files needed.",
    "mode.advanced_banner": "upload your own data files for the most accurate, project-specific results.",

    // Program hero — shared
    "hero.hide": "Hide",
    "hero.show": "Show intro",

    // Hero — Cogging
    "hero.cogging.badge": "Program 01 · Cogging",
    "hero.cogging.title1": "Train. Correct.",
    "hero.cogging.title2": "Optimize the schedule.",
    "hero.cogging.desc": "A neural-network ENE predictor and a trust-region optimizer team up to design your 7-pass cogging schedule. Pick <strong>Quick mode</strong> to see results in seconds with built-in data, or <strong>Advanced</strong> to upload your own.",
    "hero.cogging.kpi1_v": "7",
    "hero.cogging.kpi1_l": "passes optimized",
    "hero.cogging.kpi2_v": "< 5 s",
    "hero.cogging.kpi2_l": "schedule time",
    "hero.cogging.kpi3_v": "100%",
    "hero.cogging.kpi3_l": "void closure target",

    // Hero — Processing Map
    "hero.pmap.badge": "Program 02 · Processing Map",
    "hero.pmap.title1": "Find your",
    "hero.pmap.title2": "hot-working window.",
    "hero.pmap.desc": "Power dissipation η and Prasad instability ξ rendered across the entire temperature × strain-rate domain. Overlay <strong>Simufact</strong> or <strong>DEFORM</strong> particle trajectories to validate against your simulations.",
    "hero.pmap.kpi1_v": "2D / 3D",
    "hero.pmap.kpi1_l": "visualization",
    "hero.pmap.kpi2_v": "16",
    "hero.pmap.kpi2_l": "strain/stress points",
    "hero.pmap.kpi3_v": "ξ ≤ 0",
    "hero.pmap.kpi3_l": "instability zones",

    // Hero — 3D Preform
    "hero.preform.badge": "Program 03 · 3D Preform",
    "hero.preform.title1": "From voxels",
    "hero.preform.title2": "to printable STL.",
    "hero.preform.desc": "A 3D U-Net predicts your optimal pre-forging geometry. Marching cubes meshing, Taubin smoothing, and a Three.js viewer — all in one click. Pick <strong>Quick mode</strong> to skip every file and just generate.",
    "hero.preform.kpi1_v": "128³",
    "hero.preform.kpi1_l": "voxel resolution",
    "hero.preform.kpi2_v": "218 MB",
    "hero.preform.kpi2_l": "U-Net cached in RAM",
    "hero.preform.kpi3_v": "~5 s",
    "hero.preform.kpi3_l": "cached inference",

    // Bookmarks
    "bookmark.save": "Save as bookmark",
    "bookmark.list": "Bookmarks",
    "bookmark.empty": "No bookmarks yet",
    "bookmark.name_prompt": "Name this bookmark",
    "bookmark.saved": "Bookmark saved",
    "bookmark.loaded": "Bookmark loaded",
    "bookmark.deleted": "Bookmark deleted",
    "bookmark.apply": "Apply",

    // PDF
    "pdf.export": "Export PDF",
    "pdf.exporting": "Generating PDF...",
  },
  uz: {
    "nav.cogging": "Cogging Dasturi",
    "nav.processing_map": "Processing Map",
    "nav.preform_3d": "3D Preform",
    "nav.compare": "Model Solishtirish",
    "nav.history": "Tarix",
    "nav.messages": "Xabarlar",
    "nav.logout": "Chiqish",
    "nav.help": "Yordam",
    "nav.leave_message": "Xabar qoldirish",
    "nav.language": "Til",

    "sample.try": "Namuna bilan sinash",
    "sample.loading": "Namuna yuklanmoqda...",
    "sample.first_run_3d": "Namuna 218 MB U-Net modelini ishlatadi — birinchi marta 30-60s ketadi.",

    "welcome.title": "ForgeIQ ga xush kelibsiz",
    "welcome.subtitle": "Boshlash uchun qisqacha qo'llanma. Buni yordam menyusidan qayta ochishingiz mumkin.",
    "welcome.cogging_desc": "Cogging Excel'ingizdan model o'qiting, train ma'lumotni tuzating va optimal pass schedule hisoblang.",
    "welcome.pmap_desc": "Simufact va DEFORM zarrachalari bilan 2D / 3D processing-map grafiklari.",
    "welcome.preform_desc": "Voxel bashoratlarini silliq STL geometriyaga aylantiring.",
    "welcome.tip": "Har bir formada sariq 'Namuna bilan sinash' tugmasi bor — fayllaringiz bo'lmasa ham natijani ko'rishingiz mumkin.",
    "welcome.skip": "O'tkazib yuborish",
    "welcome.got_it": "Tushundim",

    "common.generate": "Yaratish",
    "common.loading": "Yuklanmoqda...",
    "common.download": "Yuklab olish",
    "common.email": "Email",
    "common.password": "Parol",
    "common.name": "Ism familiya",
    "common.login": "Kirish",
    "common.register": "Ro'yxatdan o'tish",
    "common.dont_have_account": "Akkountim yo'q",
    "common.have_account": "Akkountim bor",
    "common.login_creds": "Akkount ma'lumotlari bilan kiring",
    "common.create_account": "Yangi akkount yarating",

    "history.title": "Hisob tarixi",
    "history.subtitle": "Har bir hisob bu yerda saqlanadi. Faqat siz ko'rasiz.",
    "history.empty": "Hali hech qanday hisob yo'q",
    "history.empty_sub": "Xizmatni ishga tushiring va u bu yerda paydo bo'ladi.",
    "history.open_cogging": "Cogging'ni ochish",
    "history.open_pmap": "Processing Map'ni ochish",
    "history.open_preform": "3D Preform'ni ochish",
    "history.compare": "Solishtirish",
    "history.compare_cancel": "Bekor qilish",
    "history.compare_select": "Solishtirish uchun yana bittasini tanlang",

    "svc.train_model": "Model o'qitish",
    "svc.gradient_boosting": "Model o'qitish (GB)",
    "svc.train_correction": "Train ma'lumotni tuzatish",
    "svc.pass_schedule": "Pass Schedule",
    "svc.main_graph": "Asosiy grafik",
    "svc.plot_vs_strain": "Strain bo'yicha grafik",
    "svc.collect_for_strain": "Strain qiymatlari",
    "svc.pinn_surrogate": "PINN surrogati",
    "svc.preform_3d": "3D Preform",
    "svc.display_3d": "3D modelni ko'rsatish",

    "mode.quick": "Tezkor",
    "mode.advanced": "Kengaytirilgan (fayl yuklash)",
    "mode.quick_label": "Tezkor rejim:",
    "mode.advanced_label": "Kengaytirilgan rejim:",
    "mode.quick_banner": "faqat parametrlarni kiriting — platforma o'rnatilgan namuna ma'lumotlardan foydalanadi. Fayl kerak emas.",
    "mode.advanced_banner": "eng aniq, loyihaga xos natijalar uchun o'z fayllaringizni yuklang.",

    "hero.hide": "Yashirish",
    "hero.show": "Kirish so'zini ko'rsatish",

    "hero.cogging.badge": "01-Dastur · Cogging",
    "hero.cogging.title1": "O'qitish. Tuzatish.",
    "hero.cogging.title2": "Jadvalni optimallashtirish.",
    "hero.cogging.desc": "Neyron tarmoq ENE bashoratchisi va trust-region optimizatori birgalikda sizning 7-pass cogging jadvalingizni loyihalashtirishadi. <strong>Tezkor rejim</strong>ni tanlang — o'rnatilgan ma'lumotlar bilan soniyalarda natija; yoki <strong>Kengaytirilgan</strong> — o'z fayllaringizni yuklang.",
    "hero.cogging.kpi1_v": "7",
    "hero.cogging.kpi1_l": "optimallashtirilgan pass",
    "hero.cogging.kpi2_v": "< 5 s",
    "hero.cogging.kpi2_l": "jadval vaqti",
    "hero.cogging.kpi3_v": "100%",
    "hero.cogging.kpi3_l": "void closure maqsadi",

    "hero.pmap.badge": "02-Dastur · Processing Map",
    "hero.pmap.title1": "O'zingizning",
    "hero.pmap.title2": "issiq ishlov oynangizni toping.",
    "hero.pmap.desc": "Quvvat dissipatsiyasi η va Prasad nostabilligi ξ butun harorat × strain-rate domenida ko'rsatiladi. Simulyatsiyalarni tasdiqlash uchun <strong>Simufact</strong> yoki <strong>DEFORM</strong> zarrachalar trayektoriyalarini qo'shing.",
    "hero.pmap.kpi1_v": "2D / 3D",
    "hero.pmap.kpi1_l": "vizualizatsiya",
    "hero.pmap.kpi2_v": "16",
    "hero.pmap.kpi2_l": "strain/stress nuqtalar",
    "hero.pmap.kpi3_v": "ξ ≤ 0",
    "hero.pmap.kpi3_l": "nostabillik zonalari",

    "hero.preform.badge": "03-Dastur · 3D Preform",
    "hero.preform.title1": "Voxellardan",
    "hero.preform.title2": "chop etiladigan STL gacha.",
    "hero.preform.desc": "3D U-Net optimal pre-forging geometriyasini bashorat qiladi. Marching cubes meshing, Taubin smoothing, va Three.js viewer — barchasi bir bosishda. <strong>Tezkor rejim</strong> har qanday faylni o'tkazib generatsiya qiladi.",
    "hero.preform.kpi1_v": "128³",
    "hero.preform.kpi1_l": "voxel aniqligi",
    "hero.preform.kpi2_v": "218 MB",
    "hero.preform.kpi2_l": "U-Net RAM-da",
    "hero.preform.kpi3_v": "~5 s",
    "hero.preform.kpi3_l": "keshlangan inference",

    "bookmark.save": "Bookmark sifatida saqlash",
    "bookmark.list": "Bookmarklar",
    "bookmark.empty": "Hali bookmark yo'q",
    "bookmark.name_prompt": "Bookmark nomini kiriting",
    "bookmark.saved": "Bookmark saqlandi",
    "bookmark.loaded": "Bookmark yuklandi",
    "bookmark.deleted": "Bookmark o'chirildi",
    "bookmark.apply": "Qo'llash",

    "pdf.export": "PDF eksport",
    "pdf.exporting": "PDF yaratilmoqda...",
  },
  ko: {
    "nav.cogging": "코깅 프로그램",
    "nav.processing_map": "프로세싱 맵",
    "nav.preform_3d": "3D 프리폼",
    "nav.compare": "모델 비교",
    "nav.history": "기록",
    "nav.messages": "메시지",
    "nav.logout": "로그아웃",
    "nav.help": "도움말",
    "nav.leave_message": "메시지 남기기",
    "nav.language": "언어",

    "sample.try": "샘플로 시도",
    "sample.loading": "샘플 로딩 중...",
    "sample.first_run_3d": "샘플은 218MB U-Net 모델을 사용합니다 — 첫 호출은 30-60초 소요됩니다.",

    "welcome.title": "ForgeIQ에 오신 것을 환영합니다",
    "welcome.subtitle": "시작을 위한 간단한 가이드입니다. 도움말 메뉴에서 다시 열 수 있습니다.",
    "welcome.cogging_desc": "코깅 Excel에서 모델을 학습하고 학습 데이터를 보정하며 최적의 패스 스케줄을 계산합니다.",
    "welcome.pmap_desc": "선택적 Simufact 및 DEFORM 입자 오버레이가 포함된 2D/3D 프로세싱 맵 그래프.",
    "welcome.preform_desc": "복셀 예측을 매끄러운 STL 지오메트리로 변환합니다.",
    "welcome.tip": "모든 폼에 노란색 '샘플로 시도' 버튼이 있습니다 — 자신의 파일을 업로드하지 않고도 결과를 확인할 수 있습니다.",
    "welcome.skip": "건너뛰기",
    "welcome.got_it": "알겠습니다",

    "common.generate": "생성",
    "common.loading": "로딩 중...",
    "common.download": "다운로드",
    "common.email": "이메일",
    "common.password": "비밀번호",
    "common.name": "이름",
    "common.login": "로그인",
    "common.register": "회원가입",
    "common.dont_have_account": "계정이 없습니다",
    "common.have_account": "이미 계정이 있습니다",
    "common.login_creds": "자격 증명으로 로그인",
    "common.create_account": "새 계정 만들기",

    "history.title": "계산 기록",
    "history.subtitle": "실행한 모든 계산이 여기에 저장됩니다. 본인만 볼 수 있습니다.",
    "history.empty": "아직 계산이 없습니다",
    "history.empty_sub": "서비스를 실행하면 여기에 표시됩니다.",
    "history.open_cogging": "코깅 열기",
    "history.open_pmap": "프로세싱 맵 열기",
    "history.open_preform": "3D 프리폼 열기",
    "history.compare": "비교",
    "history.compare_cancel": "취소",
    "history.compare_select": "비교할 다른 항목을 선택하세요",

    "svc.train_model": "모델 학습",
    "svc.gradient_boosting": "모델 학습 (GB)",
    "svc.train_correction": "학습 데이터 보정",
    "svc.pass_schedule": "패스 스케줄",
    "svc.main_graph": "메인 그래프",
    "svc.plot_vs_strain": "변형률 플롯",
    "svc.collect_for_strain": "변형률 값 수집",
    "svc.pinn_surrogate": "PINN 대리 모델",
    "svc.preform_3d": "3D 프리폼",
    "svc.display_3d": "3D 모델 표시",

    "mode.quick": "빠른",
    "mode.advanced": "고급 (파일 업로드)",
    "mode.quick_label": "빠른 모드:",
    "mode.advanced_label": "고급 모드:",
    "mode.quick_banner": "아래 매개변수만 입력하세요 — 플랫폼이 내장 참조 데이터셋을 사용하여 계산을 실행합니다. 파일이 필요 없습니다.",
    "mode.advanced_banner": "프로젝트별로 가장 정확한 결과를 얻으려면 자신의 데이터 파일을 업로드하세요.",

    "hero.hide": "숨기기",
    "hero.show": "소개 보기",

    "hero.cogging.badge": "프로그램 01 · 코깅",
    "hero.cogging.title1": "학습. 보정.",
    "hero.cogging.title2": "스케줄 최적화.",
    "hero.cogging.desc": "신경망 ENE 예측기와 신뢰 영역 최적화기가 협력하여 7-패스 코깅 스케줄을 설계합니다. <strong>빠른 모드</strong>를 선택하여 내장 데이터로 몇 초 만에 결과를 확인하거나 <strong>고급</strong>에서 직접 업로드하세요.",
    "hero.cogging.kpi1_v": "7",
    "hero.cogging.kpi1_l": "최적화된 패스",
    "hero.cogging.kpi2_v": "< 5 초",
    "hero.cogging.kpi2_l": "스케줄 시간",
    "hero.cogging.kpi3_v": "100%",
    "hero.cogging.kpi3_l": "공극 폐쇄 목표",

    "hero.pmap.badge": "프로그램 02 · 프로세싱 맵",
    "hero.pmap.title1": "당신의",
    "hero.pmap.title2": "열간 가공 영역을 찾으세요.",
    "hero.pmap.desc": "전력 소산 η 및 Prasad 불안정성 ξ가 전체 온도 × 변형률 영역에 걸쳐 렌더링됩니다. 시뮬레이션을 검증하려면 <strong>Simufact</strong> 또는 <strong>DEFORM</strong> 입자 궤적을 오버레이하세요.",
    "hero.pmap.kpi1_v": "2D / 3D",
    "hero.pmap.kpi1_l": "시각화",
    "hero.pmap.kpi2_v": "16",
    "hero.pmap.kpi2_l": "변형률/응력 포인트",
    "hero.pmap.kpi3_v": "ξ ≤ 0",
    "hero.pmap.kpi3_l": "불안정성 영역",

    "hero.preform.badge": "프로그램 03 · 3D 프리폼",
    "hero.preform.title1": "복셀에서",
    "hero.preform.title2": "출력 가능한 STL까지.",
    "hero.preform.desc": "3D U-Net이 최적의 사전 단조 지오메트리를 예측합니다. Marching cubes 메싱, Taubin 스무딩 및 Three.js 뷰어 — 모두 한 번의 클릭으로. <strong>빠른 모드</strong>를 선택하여 모든 파일을 건너뛰고 바로 생성하세요.",
    "hero.preform.kpi1_v": "128³",
    "hero.preform.kpi1_l": "복셀 해상도",
    "hero.preform.kpi2_v": "218 MB",
    "hero.preform.kpi2_l": "RAM에 캐시된 U-Net",
    "hero.preform.kpi3_v": "~5 초",
    "hero.preform.kpi3_l": "캐시된 추론",

    "bookmark.save": "북마크로 저장",
    "bookmark.list": "북마크",
    "bookmark.empty": "북마크가 없습니다",
    "bookmark.name_prompt": "북마크 이름 입력",
    "bookmark.saved": "북마크 저장됨",
    "bookmark.loaded": "북마크 불러옴",
    "bookmark.deleted": "북마크 삭제됨",
    "bookmark.apply": "적용",

    "pdf.export": "PDF 내보내기",
    "pdf.exporting": "PDF 생성 중...",
  },
} as const;

type DictKey = keyof typeof dict["en"];

const I18nCtx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
}>({ lang: "en", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && ["en", "uz", "ko"].includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: DictKey): string => (dict[lang] as Record<string, string>)[key] || (dict.en as Record<string, string>)[key] || key;

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useT() {
  return useContext(I18nCtx);
}

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  uz: "O'zbekcha",
  ko: "한국어",
};
