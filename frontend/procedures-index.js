// ============================================================
// PERFORM 術式マスター 索引データ（軽量・常時読み込み）
// 各診療科の実データは procedures/<slug>.json に分割されており、
// 診療科が選択されたタイミングでfetchして読み込む（NCD_PROCEDURESにキャッシュ）。
// PERFORM_術式マスターリスト_暫定版.xlsx から自動生成。更新はExcel側で行う。
// ============================================================

const NCD_INDEX = {
  "消化器外科": {
    "reliability": "A",
    "slug": "gi",
    "count": 188
  },
  "乳腺外科": {
    "reliability": "C",
    "slug": "breast",
    "count": 12
  },
  "産婦人科": {
    "reliability": "A/B混在",
    "slug": "gyn",
    "count": 137
  },
  "呼吸器外科": {
    "reliability": "A",
    "slug": "resp",
    "count": 449
  },
  "泌尿器科": {
    "reliability": "A",
    "slug": "uro",
    "count": 260
  },
  "形成外科": {
    "reliability": "B",
    "slug": "plastic",
    "count": 15
  },
  "小児外科": {
    "reliability": "A",
    "slug": "peds",
    "count": 1476
  },
  "整形外科": {
    "reliability": "B",
    "slug": "ortho",
    "count": 928
  },
  "耳鼻咽喉科・頭頸部外科": {
    "reliability": "C",
    "slug": "ent",
    "count": 6
  },
  "救急科・外傷外科": {
    "reliability": "C",
    "slug": "er",
    "count": 6
  }
};

// fetchしたデータのキャッシュ置き場（診療科名をキーに procedures 配列を格納）
const NCD_PROCEDURES = {};
