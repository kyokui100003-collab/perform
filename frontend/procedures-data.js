// ============================================================
// PERFORM 術式マスターデータ（NCD準拠・暫定版）
// PERFORM_術式マスターリスト_暫定版.xlsx から自動生成。
// 更新する場合はExcel側を直し、変換スクリプトで再生成してください。
// 構造：NCD_PROCEDURES[診療科] = { reliability, procedures: [{name, subcategories[], methods[], ncdCode}] }
// reliability: A=学会公式CRF/対応表に基づく高信頼度、B=NCD公式マスターからの抽出、C=参考程度（各科に要確認）
// ============================================================

const NCD_PROCEDURES = {
  "消化器外科": {
    "reliability": "A",
    "procedures": [
      {
        "name": "食道悪性腫瘍切除術（消化管再建を伴う）",
        "subcategories": [],
        "methods": [
          "開胸",
          "胸腔鏡下",
          "縦隔鏡下",
          "経裂孔",
          "非開胸",
          "ロボット支援下手術"
        ],
        "ncdCode": "NQ0713〜NQ0719／OQ0043／NQ0595・NQ0596／NQ0720〜NQ0722／NQ0609／SQ0047"
      },
      {
        "name": "胃切除術（悪性以外）",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OQ0123"
      },
      {
        "name": "胃悪性腫瘍手術（切除）",
        "subcategories": [
          "単純切除",
          "広汎切除"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0134／OQ0135／OQ0140"
      },
      {
        "name": "胃全摘術",
        "subcategories": [
          "良性",
          "悪性（単純全摘）",
          "悪性（広汎全摘）"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下"
        ],
        "ncdCode": "OQ0127／OQ0136／OQ0137・OQ0138／OQ0141"
      },
      {
        "name": "噴門側胃切除術",
        "subcategories": [
          "良性",
          "悪性（単純）",
          "悪性（広汎）"
        ],
        "methods": [
          "（開腹が基本）",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0128（良性）／NQ0605（悪性）／NQ0740（広汎噴門側胃切除術）"
      },
      {
        "name": "幽門保存胃切除術",
        "subcategories": [],
        "methods": [
          "（開腹が基本）",
          "ロボット支援下手術"
        ],
        "ncdCode": "NQ0736"
      },
      {
        "name": "残胃切除術・残胃全摘術",
        "subcategories": [
          "切除",
          "全摘"
        ],
        "methods": [
          "（開腹が基本）",
          "ロボット支援下手術"
        ],
        "ncdCode": "NQ0611（切除）／NQ0610（全摘）"
      },
      {
        "name": "胃瘻造設術・閉鎖術",
        "subcategories": [
          "造設",
          "閉鎖"
        ],
        "methods": [
          "開腹",
          "内視鏡下",
          "経皮的"
        ],
        "ncdCode": "OQ0155／OQ0156（造設）、OQ0157／OQ0158（閉鎖）、OQ0412（経皮的造設）"
      },
      {
        "name": "小腸切除術",
        "subcategories": [
          "良性",
          "悪性（単純切除",
          "広汎切除）"
        ],
        "methods": [
          "腹腔鏡下",
          "開腹"
        ],
        "ncdCode": "OQ0298／OQ0299（良性）、NQ0547／NQ0549／OQ0325（悪性）"
      },
      {
        "name": "消化管瘻・人工肛門閉鎖術（ストマ閉鎖）",
        "subcategories": [
          "人工肛門",
          "小腸瘻",
          "結腸瘻"
        ],
        "methods": [
          "腸管切除なし",
          "腸管切除を伴う",
          "ハルトマン手術後"
        ],
        "ncdCode": "OQ0344／OQ0345／OQ0346（人工肛門）、OQ0340／OQ0341（小腸瘻）、OQ0342／OQ0343（結腸瘻）"
      },
      {
        "name": "腸管癒着症手術（腸閉塞解除術）",
        "subcategories": [],
        "methods": [
          "腹腔鏡下",
          "開腹"
        ],
        "ncdCode": "OQ0294／OQ0295"
      },
      {
        "name": "虫垂切除術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下（簡単・複雑）"
        ],
        "ncdCode": "OQ0305／OQ0306／OQ0307"
      },
      {
        "name": "回盲部切除術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0310（開腹）／OQ0311（腹腔鏡下）"
      },
      {
        "name": "結腸右半切除術",
        "subcategories": [
          "良性",
          "悪性（単純切除",
          "広汎切除）"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0312（開腹）／OQ0323・OQ0326（腹腔鏡下）／NQ0548・NQ0550（悪性）"
      },
      {
        "name": "結腸左半切除術",
        "subcategories": [
          "良性",
          "悪性（単純切除",
          "広汎切除）"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0312（開腹）／OQ0323・OQ0326（腹腔鏡下）／NQ0548・NQ0550（悪性）"
      },
      {
        "name": "S状結腸切除術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0310（開腹）／OQ0311（腹腔鏡下）"
      },
      {
        "name": "結腸切除術（亜全摘・全切除）／大腸全摘術",
        "subcategories": [
          "亜全摘",
          "全切除",
          "大腸全摘"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "NQ0541（亜全摘）／NQ0542（全切除）／OQ0314（大腸全摘・腹腔鏡下）"
      },
      {
        "name": "人工肛門造設術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OQ0332"
      },
      {
        "name": "直腸切除術（高位前方切除術）",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0367（広汎切除・高位）／NQ0665（腹腔鏡下高位前方切除術）"
      },
      {
        "name": "直腸切除術（低位前方切除術）",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0368（広汎切除・低位）／NQ0685（腹腔鏡下低位前方切除術）"
      },
      {
        "name": "直腸切除術（単純切除）",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OQ0366／OQ0371"
      },
      {
        "name": "直腸切除術（超低位前方切除術／TaTME・ISR等を含む）",
        "subcategories": [],
        "methods": [
          "経肛門的（TaTME）",
          "経腹＋経肛門合併",
          "括約筋間直腸切除術（ISR）等"
        ],
        "ncdCode": "OQ0369（超低位直腸前方切除術・経肛門的結腸嚢肛門吻合）"
      },
      {
        "name": "直腸切断術（悪性・マイルズ手術）",
        "subcategories": [
          "単純",
          "広汎（仙骨合併切除）"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OQ0373／NQ0469／NQ0744"
      },
      {
        "name": "直腸脱手術",
        "subcategories": [],
        "methods": [
          "経肛門"
        ],
        "ncdCode": "OQ0376"
      },
      {
        "name": "痔核手術",
        "subcategories": [],
        "methods": [
          "硬化療法",
          "四段階注射法",
          "結紮術",
          "焼灼術",
          "血栓摘出術",
          "根治手術",
          "PPH"
        ],
        "ncdCode": "OQ0382／OQ0383／NQ0557〜NQ0561"
      },
      {
        "name": "痔瘻根治手術",
        "subcategories": [
          "単純",
          "複雑"
        ],
        "methods": [],
        "ncdCode": "OQ0390／OQ0391"
      },
      {
        "name": "肛門周囲膿瘍切開術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OQ0387"
      },
      {
        "name": "肝切除術（部分切除）",
        "subcategories": [
          "切除深度・箇所数等で細分"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "NQ0768〜NQ0774"
      },
      {
        "name": "胆嚢摘出術",
        "subcategories": [],
        "methods": [
          "腹腔鏡下",
          "開腹"
        ],
        "ncdCode": "OQ0181／OQ0182"
      },
      {
        "name": "膵頭十二指腸切除術",
        "subcategories": [
          "標準",
          "合併切除",
          "血行再建",
          "リンパ節郭清"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0269／OQ0271／OQ0272／NQ0729／NQ0521／NQ0580"
      },
      {
        "name": "膵体尾部切除術（悪性）",
        "subcategories": [
          "脾摘・合併切除・血行再建あり",
          "なし"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下（脾摘を伴う）",
          "ロボット支援下手術"
        ],
        "ncdCode": "NQ0784〜NQ0791"
      },
      {
        "name": "膵中央切除術",
        "subcategories": [],
        "methods": [
          "（開腹が基本）",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0274"
      },
      {
        "name": "膵腫瘍核出術（膵腫瘍摘出術）",
        "subcategories": [],
        "methods": [
          "（開腹が基本）",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0258"
      },
      {
        "name": "膵全摘術",
        "subcategories": [
          "血行再建なし",
          "あり"
        ],
        "methods": [
          "（開腹が基本）",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0275（血行再建なし）／NQ0572（動脈もしくは門脈同時再建を伴う）"
      },
      {
        "name": "鼠径ヘルニア手術",
        "subcategories": [],
        "methods": [
          "直視下",
          "腹腔鏡下",
          "ロボット支援下手術"
        ],
        "ncdCode": "OQ0074／OQ0073"
      },
      {
        "name": "腹壁瘢痕ヘルニア手術",
        "subcategories": [],
        "methods": [
          "腹腔鏡下",
          "直視下"
        ],
        "ncdCode": "OA0108／OA0109"
      },
      {
        "name": "限局性腹腔膿瘍手術（腹腔内膿瘍ドレナージ）",
        "subcategories": [
          "横隔膜下",
          "ダグラス窩",
          "虫垂周囲",
          "その他"
        ],
        "methods": [],
        "ncdCode": "OQ0084／OQ0085／OQ0086／OQ0087"
      }
    ]
  },
  "乳腺外科": {
    "reliability": "C",
    "procedures": [
      {
        "name": "乳腺腫瘍摘出術（良性）",
        "subcategories": [
          "長径5cm未満",
          "5cm以上"
        ],
        "methods": [],
        "ncdCode": "NP0185／NP0186"
      },
      {
        "name": "乳管腺葉区域切除術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "NP0285"
      },
      {
        "name": "乳腺組織試験採取術",
        "subcategories": [],
        "methods": [
          "針穿刺による",
          "試験切開による"
        ],
        "ncdCode": "OP0016／OP0017"
      },
      {
        "name": "画像ガイド下吸引式乳腺生検術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OP0023"
      },
      {
        "name": "乳房切除術（良性病変）",
        "subcategories": [],
        "methods": [],
        "ncdCode": "NP0187"
      },
      {
        "name": "乳腺悪性腫瘍手術（乳房部分切除）",
        "subcategories": [],
        "methods": [
          "腋窩部郭清を伴う",
          "伴わない"
        ],
        "ncdCode": "OP0028／OP0029"
      },
      {
        "name": "乳腺悪性腫瘍手術（乳房切除術）",
        "subcategories": [
          "腋窩郭清を伴わない",
          "腋窩鎖骨下部郭清（胸筋切除なし）",
          "同（胸筋切除あり）",
          "拡大乳房切除"
        ],
        "methods": [],
        "ncdCode": "NP0188／OP0030／OP0031／NP0294"
      },
      {
        "name": "センチネルリンパ節生検術（乳腺悪性腫瘍）",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OV0002"
      },
      {
        "name": "乳房再建術（一期的）",
        "subcategories": [],
        "methods": [
          "人工乳房による",
          "自家組織による"
        ],
        "ncdCode": "NP0189／NP0190"
      },
      {
        "name": "乳房再建術（二期的）",
        "subcategories": [],
        "methods": [
          "人工乳房",
          "自家組織による"
        ],
        "ncdCode": "OP0039／NP0191"
      },
      {
        "name": "乳頭形成術",
        "subcategories": [],
        "methods": [
          "陥没乳頭の形成",
          "再建乳房乳頭形成"
        ],
        "ncdCode": "OP0035／OP0036"
      },
      {
        "name": "乳腺膿瘍切開術・乳輪下膿瘍根治術",
        "subcategories": [],
        "methods": [
          "膿瘍切開",
          "乳輪下膿瘍根治"
        ],
        "ncdCode": "OP0014／OP0015"
      }
    ]
  },
  "産婦人科": {
    "reliability": "A/B混在",
    "procedures": [
      {
        "name": "子宮全摘出術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腟式",
          "腟式腹腔鏡下"
        ],
        "ncdCode": "NS0361／NS0362／OS0274"
      },
      {
        "name": "子宮筋腫核出術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腟式",
          "腹腔鏡下"
        ],
        "ncdCode": "NS0359／NS0360／OS0267"
      },
      {
        "name": "子宮悪性腫瘍手術",
        "subcategories": [
          "単純",
          "拡大",
          "準広汎",
          "広汎"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OS0276／NS0363／NS0364／OS0278／SS0279"
      },
      {
        "name": "卵巣腫瘍摘出術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OS0298／OS0299"
      },
      {
        "name": "卵巣部分切除術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OS0295／OS0296"
      },
      {
        "name": "子宮付属器腫瘍摘出術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OS0301／OS0302"
      },
      {
        "name": "子宮付属器悪性腫瘍手術",
        "subcategories": [
          "（区分未確認）"
        ],
        "methods": [],
        "ncdCode": "OS0303／OS0304"
      },
      {
        "name": "子宮内膜症病巣除去術",
        "subcategories": [
          "軽症",
          "複雑"
        ],
        "methods": [
          "腹腔鏡下"
        ],
        "ncdCode": "OS0247／OS0248"
      },
      {
        "name": "卵管結紮術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "NS0374／NS0375"
      },
      {
        "name": "卵管全摘除術等",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "NS0376／NS0377"
      },
      {
        "name": "腟断端挙上術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腟式"
        ],
        "ncdCode": "NS0355／NS0356"
      },
      {
        "name": "子宮脱手術（骨盤臓器脱）",
        "subcategories": [
          "ルフォール",
          "マンチェスター",
          "ハルバン・シャウタ等"
        ],
        "methods": [
          "開腹・腟式（術式により異なる）"
        ],
        "ncdCode": "OS0257〜OS0260／NS0357／NS0358"
      },
      {
        "name": "子宮外妊娠手術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OW0036／OW0037"
      }
    ]
  },
  "呼吸器外科": {
    "reliability": "A",
    "procedures": [
      {
        "name": "肺切除術（楔状部分切除・良性）",
        "subcategories": [
          "1箇所",
          "2箇所以上"
        ],
        "methods": [
          "開胸",
          "胸腔鏡下"
        ],
        "ncdCode": "NP0209／OP0094／OP0095／OP0103／OP0104"
      },
      {
        "name": "肺悪性腫瘍手術（楔状部分切除）",
        "subcategories": [
          "1箇所",
          "2箇所以上"
        ],
        "methods": [
          "開胸",
          "胸腔鏡下"
        ],
        "ncdCode": "NP0141／NP0142／NP0153／NP0154／NP0259／OP0113／OP0114"
      },
      {
        "name": "肺悪性腫瘍手術（区域切除術）",
        "subcategories": [
          "郭清あり",
          "なし"
        ],
        "methods": [
          "開胸",
          "胸腔鏡下"
        ],
        "ncdCode": "NP0143／NP0144／NP0155／NP0156／OP0096／OP0105／OP0115"
      },
      {
        "name": "肺悪性腫瘍手術（肺葉切除・肺全摘）",
        "subcategories": [
          "肺葉切除",
          "肺全摘、郭清あり",
          "なし"
        ],
        "methods": [
          "開胸",
          "胸腔鏡下"
        ],
        "ncdCode": "NP0149〜NP0152／NP0161〜NP0164／OP0097〜OP0099・OP0101・OP0106・OP0107・OP0109・OP0112・OP0116／SP0111"
      },
      {
        "name": "気管支・気管形成を伴う肺切除術",
        "subcategories": [
          "気管支形成",
          "気管分岐部形成"
        ],
        "methods": [
          "開胸",
          "胸腔鏡下"
        ],
        "ncdCode": "NP0139・NP0140・NP0145・NP0146・NP0157・NP0158・NP0206・NP0218・NP0219／OP0100・OP0127〜OP0131 等"
      },
      {
        "name": "肺悪性腫瘍手術（隣接臓器合併切除）",
        "subcategories": [
          "胸壁・横隔膜・心膜・上大静脈・大動脈・椎体・食道の各合併切除"
        ],
        "methods": [
          "開胸",
          "胸腔鏡下"
        ],
        "ncdCode": "NP0147・NP0165〜NP0182・NP0207・NP0233・NP0234・NP0237・NP0238／OP0074・OP0108・OP0110 等"
      },
      {
        "name": "肺悪性腫瘍手術（胸膜肺全摘術）",
        "subcategories": [],
        "methods": [
          "開胸",
          "胸腔鏡下"
        ],
        "ncdCode": "NP0148／NP0160／NP0274／NP0275／OP0046"
      },
      {
        "name": "肺容量減少手術・肺縫縮術",
        "subcategories": [],
        "methods": [
          "開胸",
          "胸腔鏡下",
          "胸骨正中切開"
        ],
        "ncdCode": "NP0208／NP0212／NP0213／NP0281／OP0042／OP0102／OP0123〜OP0126"
      },
      {
        "name": "縦隔・胸膜腫瘍摘出術",
        "subcategories": [
          "縦隔腫瘍",
          "胸腺摘出",
          "胸膜腫瘍",
          "食道良性腫瘍（縦隔操作分）"
        ],
        "methods": [
          "開胸",
          "胸腔鏡下",
          "非開胸",
          "縦隔鏡下"
        ],
        "ncdCode": "NP0196〜NP0200／NP0224〜NP0228／NP0242／NP0251／NQ0477／OQ0026／OQ0031／OP0059・OP0060・OP0070〜OP0073 等"
      },
      {
        "name": "胸郭成形術（膿胸手術）",
        "subcategories": [
          "肋骨切除主体",
          "胸膜胼胝切除併施"
        ],
        "methods": [
          "胸腔鏡下 等"
        ],
        "ncdCode": "OH0358〜OH0362／OP0045／OP0049〜OP0057／OP0120／OP0121"
      },
      {
        "name": "高度技術認定：肺移植・大血管合併切除・先天性疾患等（代表例）",
        "subcategories": [
          "死体肺移植",
          "生体肺部分移植",
          "胸部大動脈関連",
          "甲状腺・頸部合併術式 等"
        ],
        "methods": [
          "術式ごとに異なる"
        ],
        "ncdCode": "NP0183・NP0184（死体肺移植）／NP0210・NP0211（生体肺部分移植）／NT0237〜NT0261（胸部大動脈関連）／ND0580〜ND0586（甲状腺・頸部合併術式）ほか多数"
      }
    ]
  },
  "泌尿器科": {
    "reliability": "A",
    "procedures": [
      {
        "name": "副腎摘除術",
        "subcategories": [
          "良性",
          "褐色細胞腫",
          "悪性"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "腹腔鏡下小切開",
          "ロボット支援腹腔鏡下"
        ],
        "ncdCode": "OS0002／OS0003／OS0004／NS0380／HS0002／HS0003／OS0005／OS0006／OS0009／OS0010／HS0145／HS0146／HS0147"
      },
      {
        "name": "単純腎摘除術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OS0030／OS0031／NS0325／HS0007／HS0061／NS0329／NS0331／OS0048"
      },
      {
        "name": "根治的腎摘除術",
        "subcategories": [
          "広汎摘出"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援腹腔鏡下"
        ],
        "ncdCode": "OS0032／NS0327／NS0329／HS0140"
      },
      {
        "name": "腎部分切除術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "腹腔鏡下小切開",
          "ロボット支援腹腔鏡下"
        ],
        "ncdCode": "OS0023／HS0099／HS0004／HS0005／HS0006"
      },
      {
        "name": "腎盂形成術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援腹腔鏡下"
        ],
        "ncdCode": "OS0045／OS0046／HS0136"
      },
      {
        "name": "経皮的腎砕石術（PNL）",
        "subcategories": [],
        "methods": [
          "経皮的"
        ],
        "ncdCode": "OS0018／HS0084"
      },
      {
        "name": "経尿道的尿管砕石術（TUL）",
        "subcategories": [],
        "methods": [
          "経尿道"
        ],
        "ncdCode": "OS0053／NS0367"
      },
      {
        "name": "腎移植術",
        "subcategories": [
          "同種",
          "自家",
          "バックテーブル",
          "ドナー摘出"
        ],
        "methods": [
          "開腹（同種・自家）",
          "腹腔鏡下（ドナー摘出）"
        ],
        "ncdCode": "OS0049（同種）／OS0050（自家）／HS0070（バックテーブル）、ドナー腎摘出：NS0333・NS0334・OS0048"
      },
      {
        "name": "経尿道的膀胱腫瘍切除術（TURBT）",
        "subcategories": [
          "良性",
          "悪性"
        ],
        "methods": [
          "経尿道"
        ],
        "ncdCode": "NS0378／OS0093／OS0104"
      },
      {
        "name": "膀胱全摘除術",
        "subcategories": [
          "尿路非変更",
          "回腸導管",
          "代用膀胱"
        ],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援腹腔鏡下"
        ],
        "ncdCode": "HS0008〜HS0013／HS0018〜HS0020／NS0343・NS0344／OS0088・OS0089・OS0091／OS0098〜OS0103"
      },
      {
        "name": "経尿道的前立腺切除術等（BPH手術群）",
        "subcategories": [
          "各種デバイス別"
        ],
        "methods": [
          "経尿道"
        ],
        "ncdCode": "OS0198／OS0199／OS0200／NS0368／HS0031／HS0134／HS0148／HS0150"
      },
      {
        "name": "前立腺全摘除術",
        "subcategories": [],
        "methods": [
          "腹腔鏡下",
          "小切開内視鏡下",
          "ロボット支援腹腔鏡下"
        ],
        "ncdCode": "OS0204／OS0205／HS0017／HS0108"
      },
      {
        "name": "精巣摘除術（高位精巣摘除を含む）",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OS0170／OS0173／OS0174／OS0176／OS0177"
      },
      {
        "name": "精索静脈瘤根治術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "顕微鏡下"
        ],
        "ncdCode": "OS0178／OS0179／OS0180／HS0085・HS0086"
      },
      {
        "name": "尿失禁・臓器脱根治術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下",
          "ロボット支援腹腔鏡下"
        ],
        "ncdCode": "OS0142・OS0143／OS0094・SS0095／HS0016／HS0144"
      }
    ]
  },
  "形成外科": {
    "reliability": "B",
    "procedures": [
      {
        "name": "分層植皮術",
        "subcategories": [
          "面積区分別（25c㎡未満",
          "25〜100",
          "100〜200",
          "200以上）"
        ],
        "methods": [],
        "ncdCode": "OA0059〜OA0062"
      },
      {
        "name": "全層植皮術",
        "subcategories": [
          "面積区分別（同上）"
        ],
        "methods": [],
        "ncdCode": "OA0063〜OA0066"
      },
      {
        "name": "皮弁作成術・移動術（局所皮弁）",
        "subcategories": [
          "部位（露出部",
          "粘膜部",
          "関節部）・面積区分別"
        ],
        "methods": [],
        "ncdCode": "OA0074〜OA0076／NA0149〜NA0157"
      },
      {
        "name": "遊離皮弁移植術",
        "subcategories": [],
        "methods": [
          "通常",
          "自動吻合器使用"
        ],
        "ncdCode": "OA0081／OA0082"
      },
      {
        "name": "有茎筋皮弁移植術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "NA0161"
      },
      {
        "name": "皮膚再建術（組織拡張器）",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OA0092"
      },
      {
        "name": "瘢痕拘縮形成術",
        "subcategories": [
          "一般",
          "顔面",
          "指"
        ],
        "methods": [],
        "ncdCode": "OA0058／OA0057／OA0102"
      },
      {
        "name": "眼瞼下垂手術",
        "subcategories": [],
        "methods": [
          "挙筋前転法",
          "筋膜移植法",
          "その他"
        ],
        "ncdCode": "OD0040／OD0041／OD0042"
      },
      {
        "name": "眼瞼形成術・眼瞼再建術",
        "subcategories": [],
        "methods": [
          "形成術",
          "再建術"
        ],
        "ncdCode": "OD0029／OD0030"
      },
      {
        "name": "口唇裂手術",
        "subcategories": [
          "片側",
          "両側、鼻形成併施の有無で細分"
        ],
        "methods": [],
        "ncdCode": "OD0426〜OD0431"
      },
      {
        "name": "顎口蓋裂手術",
        "subcategories": [
          "軟口蓋のみ",
          "硬口蓋に及ぶ",
          "顎裂を伴う",
          "両側"
        ],
        "methods": [],
        "ncdCode": "OD0383〜OD0386"
      },
      {
        "name": "乳房再建術（一期的）",
        "subcategories": [],
        "methods": [
          "人工乳房",
          "自家組織"
        ],
        "ncdCode": "NP0189／NP0190"
      },
      {
        "name": "乳房再建術（二期的）",
        "subcategories": [],
        "methods": [
          "人工乳房",
          "自家組織"
        ],
        "ncdCode": "OP0039／NP0191"
      },
      {
        "name": "神経血管柄つき植皮術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OH0301"
      },
      {
        "name": "腹壁形成術（腹壁破裂・臍帯ヘルニア）",
        "subcategories": [],
        "methods": [],
        "ncdCode": "NQ0577"
      }
    ]
  },
  "小児外科": {
    "reliability": "A",
    "procedures": [
      {
        "name": "食道閉鎖根治術",
        "subcategories": [],
        "methods": [
          "開胸",
          "胸腔鏡下"
        ],
        "ncdCode": "NQ0478／NQ0479／NQ0706／NQ0480"
      },
      {
        "name": "腸閉鎖手術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "NQ0659／NQ0660／NQ0661 ほか計8コード"
      },
      {
        "name": "横隔膜ヘルニア修復",
        "subcategories": [
          "直接縫合",
          "人工膜使用"
        ],
        "methods": [
          "経胸",
          "経腹",
          "胸腔鏡下",
          "腹腔鏡下"
        ],
        "ncdCode": "NP0286〜NP0293／NQ0471"
      },
      {
        "name": "臍帯ヘルニア（腹壁破裂）初回手術",
        "subcategories": [
          "一期的",
          "多期的（1回目）"
        ],
        "methods": [],
        "ncdCode": "NQ0577／NH0985"
      },
      {
        "name": "Ｈ病根治術（先天性巨大結腸症＝ヒルシュスプルング病）",
        "subcategories": [],
        "methods": [
          "開腹",
          "Martin法",
          "腹腔鏡下"
        ],
        "ncdCode": "NQ0683／NQ0684／NQ0682"
      },
      {
        "name": "高位鎖肛根治術",
        "subcategories": [],
        "methods": [
          "仙骨会陰式",
          "腹会陰式",
          "PSARP",
          "腹腔鏡下"
        ],
        "ncdCode": "NQ0694／NQ0696／NQ0700／NQ0698"
      },
      {
        "name": "中間位鎖肛根治術",
        "subcategories": [],
        "methods": [
          "会陰形成術",
          "仙骨会陰式",
          "腹会陰式",
          "PSARP",
          "腹腔鏡下"
        ],
        "ncdCode": "NQ0692／NQ0695／NQ0697／NQ0701／NQ0699"
      },
      {
        "name": "胆道閉鎖根治術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OQ0202／NQ0732"
      },
      {
        "name": "腸回転異常症手術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OQ0348／OQ0349"
      },
      {
        "name": "虫垂切除術",
        "subcategories": [],
        "methods": [
          "開腹",
          "腹腔鏡下"
        ],
        "ncdCode": "OQ0305／OQ0306／OQ0307／OQ0308／OQ0309"
      },
      {
        "name": "肥厚性幽門狭窄症手術（幽門筋切開術）",
        "subcategories": [],
        "methods": [],
        "ncdCode": "NQ0576"
      },
      {
        "name": "腸重積症整復術（観血的）",
        "subcategories": [],
        "methods": [
          "観血的",
          "腹腔鏡下"
        ],
        "ncdCode": "NQ0765／NQ0766"
      },
      {
        "name": "鼠径ヘルニア（類縁疾患）手術",
        "subcategories": [
          "鼠径ヘルニア",
          "陰嚢水腫"
        ],
        "methods": [
          "直視下",
          "腹腔鏡下"
        ],
        "ncdCode": "OQ0074・OQ0076／OQ0073・OQ0075／OS0181・NS0389"
      },
      {
        "name": "臍ヘルニア手術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OQ0072"
      },
      {
        "name": "精巣捻転手術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OS0189／OS0190／OS0191・OS0192"
      }
    ]
  },
  "整形外科": {
    "reliability": "C",
    "procedures": [
      {
        "name": "人工関節置換術",
        "subcategories": [
          "肩",
          "股",
          "膝",
          "肘",
          "手",
          "足"
        ],
        "methods": [],
        "ncdCode": "NH0897（肩）／NH0898（股）／NH0899（膝）／NH0901（肘）／NH0902（手）／NH0903（足）"
      },
      {
        "name": "骨折観血的整復固定術（大腿骨）",
        "subcategories": [],
        "methods": [],
        "ncdCode": "NH0496"
      },
      {
        "name": "関節内骨折観血的手術",
        "subcategories": [
          "肩・股・膝・肘・手・足等の関節別"
        ],
        "methods": [],
        "ncdCode": "NH0794〜NH0803"
      },
      {
        "name": "半月板切除術／縫合術（関節鏡下）",
        "subcategories": [],
        "methods": [
          "切除",
          "縫合"
        ],
        "ncdCode": "OH0173／OH0174"
      },
      {
        "name": "関節鏡下手術（滑膜切除・異物除去等）",
        "subcategories": [
          "関節部位別。組合せが非常に多い"
        ],
        "methods": [],
        "ncdCode": "NH0733〜NH0779"
      },
      {
        "name": "脊椎固定術",
        "subcategories": [],
        "methods": [
          "開放",
          "内視鏡下",
          "前方後方同時",
          "体外式"
        ],
        "ncdCode": "OF0054〜OF0058／OF0062／OF0064"
      }
    ]
  },
  "耳鼻咽喉科・頭頸部外科": {
    "reliability": "C",
    "procedures": [
      {
        "name": "口蓋扁桃摘出術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OD0305／OD0306"
      },
      {
        "name": "鼓室形成術",
        "subcategories": [
          "乳突非削開",
          "後部鼓室開放",
          "乳突削開",
          "外耳道再建"
        ],
        "methods": [],
        "ncdCode": "OD0191〜OD0194"
      },
      {
        "name": "内視鏡下副鼻腔手術",
        "subcategories": [],
        "methods": [
          "マイクロデブリッダー",
          "ナビゲーション下",
          "汎副鼻腔手術"
        ],
        "ncdCode": "OD0241／SD0242／OD0261"
      },
      {
        "name": "喉頭摘出術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OD0330"
      },
      {
        "name": "頸部郭清術",
        "subcategories": [
          "片側",
          "両側"
        ],
        "methods": [],
        "ncdCode": "OD0541／OD0542"
      },
      {
        "name": "人工内耳埋込術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OD0205"
      }
    ]
  },
  "救急科・外傷外科": {
    "reliability": "C",
    "procedures": [
      {
        "name": "創傷処理（筋・臓器に達する／達しない、長径別）",
        "subcategories": [
          "長径5cm未満",
          "5〜10cm",
          "10cm以上"
        ],
        "methods": [],
        "ncdCode": "OA0001〜OA0003／OH0001〜OH0003"
      },
      {
        "name": "腎破裂縫合術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OS0011"
      },
      {
        "name": "膀胱破裂閉鎖術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "OS0078"
      },
      {
        "name": "胸部大動脈損傷・縫合止血術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "NT0252"
      },
      {
        "name": "開胸止血術",
        "subcategories": [],
        "methods": [],
        "ncdCode": "NQ0565"
      },
      {
        "name": "骨折創外固定術（大腿骨等）",
        "subcategories": [
          "部位別"
        ],
        "methods": [],
        "ncdCode": "NH0483"
      }
    ]
  }
};
