// ============================================================
// PERFORM 評価システム — Google Apps Script バックエンド
// ベータ版 Phase 2（匿名化アーキテクチャ対応）
// ============================================================
//
// 【重要な変更点】
// このバージョンから、スプレッドシートを2つに分離しています。
//
// ■ IDENTITY_SHEET_ID（本人情報スプレッドシート・アクセス制限推奨）
//   実名・メールアドレス・PIN・背景情報など、個人が特定できる情報を保持。
//   タブ：users, facilities
//
// ■ SHEET_ID（データスプレッドシート・研究データ本体）
//   症例評価データ・コメント。実名は保持せず、匿名ラベル（学習者A、指導医1など）
//   のみを保持する。
//   タブ：evaluations, comments
//
// 実名を知る必要があるのはアプリの画面表示（ログイン中の本人・指導医⇔学習者間の
// 表示）だけなので、表示時にIDENTITY側を都度参照して実名を解決する設計にしている。
// これにより、SHEET_ID側（データ本体）を直接開いても実名が出てこない。
//
// -------------------------------------------------------------
// 【セットアップ手順】
// 1. スプレッドシートを2つ新規作成する
//    - 本人情報用（例：「PERFORM_本人情報」）→ IDENTITY_SHEET_ID に設定
//    - データ用（例：「PERFORM_評価データ」）→ SHEET_ID に設定
// 2. REG_CODE を任意の文字列に変更
// 3. 本人情報スプレッドシートに以下2枚のシートを作成し、1行目にヘッダーを入れる
//
// ■ users シート（IDENTITY側）
//   A:facility_code  B:user_id  C:name  D:role  E:pin  F:email
//   G:facility_name  H:department  I:registered_at  J:failed_attempts  K:lockout_until
//   L:anon_label（学習者A／指導医1などの匿名ラベル）
//   M:gender  N:board_certified  O:pgy  P:proc_experience  Q:teaching_years  R:other_notes
//
// ■ facilities シート（IDENTITY側。施設の匿名ラベル管理）
//   A:facility_code  B:facility_name  C:anon_label（施設A、施設Bなど）  D:registered_at
//
// 4. データスプレッドシートに以下2枚のシートを作成し、1行目にヘッダーを入れる
//
// ■ evaluations シート（DATA側。症例1件＝1行）
//   A:id  B:facility_code  C:learner_id  D:learner_label（匿名ラベル）
//   E:evaluator_id  F:evaluator_label（匿名ラベル）  G:procedure  H:case_no
//   I:status（draft / pending / reviewed）
//   J:created_at  K:submitted_at  L:reviewed_at
//   M:autonomy_L  N:performance_L  O:difficulty_L
//   P:ts1_L Q:ts2_L R:ts3_L S:ts4_L T:ts5_L
//   U:feedback_good_L  V:feedback_goal_L
//   W:learner_comment_submitted_at  X:learner_comment_edited_at
//   Y:autonomy_E  Z:performance_E  AA:difficulty_E
//   AB:ts1_E AC:ts2_E AD:ts3_E AE:ts4_E AF:ts5_E
//   AG:feedback_good_E  AH:feedback_goal_E
//   AI:evaluator_comment_submitted_at  AJ:evaluator_comment_edited_at
//   AK:pre_op_goal  AL:goal_entry_mode（preop / bundled）  AM:pre_op_goal_set_at
//   AN:comment_rating  AO:comment_rating_at
//   AP:reminder_sent_at
//   AQ:feedback_viewed_at（学習者が指導医のフィードバックを最初に閲覧した日時。NEWバッジ判定用）
//
// ■ comments シート（DATA側）
//   A:id  B:evaluation_id  C:facility_code
//   D:author_role（learner / evaluator）  E:author_id  F:author_label（匿名ラベル）
//   G:body  H:posted_at  I:likes  J:target（learner / evaluator）
//
// 5. デプロイ → ウェブアプリ、実行：自分、アクセス：全員
// 6. setupDailyTrigger() を1回手動実行
// ============================================================

const IDENTITY_SHEET_ID = 'YOUR_IDENTITY_SPREADSHEET_ID_HERE';
const SHEET_ID           = 'YOUR_DATA_SPREADSHEET_ID_HERE';
const REG_CODE = 'PERFORM2026';
const MAX_FAILED = 5;
const LOCKOUT_MIN = 30;
const EDIT_WINDOW_MS = 72 * 60 * 60 * 1000;

// evaluations列インデックス（0始まり）
const EV = {
  id:0, facilityCode:1, learnerId:2, learnerLabel:3, evaluatorId:4, evaluatorLabel:5,
  procedure:6, caseNo:7, status:8, createdAt:9, submittedAt:10, reviewedAt:11,
  autoL:12, perfL:13, diffL:14, ts1L:15, ts2L:16, ts3L:17, ts4L:18, ts5L:19,
  fbGoodL:20, fbGoalL:21, lCommentSubmittedAt:22, lCommentEditedAt:23,
  autoE:24, perfE:25, diffE:26, ts1E:27, ts2E:28, ts3E:29, ts4E:30, ts5E:31,
  fbGoodE:32, fbGoalE:33, eCommentSubmittedAt:34, eCommentEditedAt:35,
  preOpGoal:36, goalEntryMode:37, preOpGoalSetAt:38,
  commentRating:39, commentRatingAt:40, reminderSentAt:41, feedbackViewedAt:42
};
const EV_COLS = 43;

const CM = { id:0, evaluationId:1, facilityCode:2, authorRole:3, authorId:4, authorLabel:5, body:6, postedAt:7, likes:8, target:9 };

// -------------------------------------------------------
// エントリーポイント
// -------------------------------------------------------
function doPost(e) {
  // リクエストごとにキャッシュをリセット（GASが実行コンテキストを使い回した場合でも
  // 古いデータを次のリクエストに持ち越さないため）
  _ssCache = null; _identitySsCache = null; _usersCache = null;
  try {
    const data = JSON.parse(e.postData.contents);
    let result;
    switch (data.action) {
      case 'register':            result = register(data);            break;
      case 'login':               result = login(data);               break;
      case 'getEvaluators':       result = getEvaluators(data);       break;

      case 'startCase':           result = startCase(data);           break;
      case 'getMyDrafts':         result = getMyDrafts(data);         break;
      case 'submitLearner':       result = submitLearner(data);       break;
      case 'saveLearnerDraft':    result = saveLearnerDraft(data);    break;
      case 'editLearnerComment':  result = editLearnerComment(data);  break;

      case 'getPending':          result = getPending(data);          break;
      case 'getRecord':           result = getRecord(data);           break;
      case 'submitEvaluator':     result = submitEvaluator(data);     break;
      case 'saveEvaluatorDraft':  result = saveEvaluatorDraft(data);  break;
      case 'editEvaluatorComment':result = editEvaluatorComment(data);break;

      case 'getResults':          result = getResults(data);          break;
      case 'getLearnerSummary':   result = getLearnerSummary(data);   break;
      case 'markFeedbackViewed':  result = markFeedbackViewed(data);  break;

      case 'getComments':         result = getComments(data);         break;
      case 'addComment':          result = addComment(data);          break;
      case 'toggleLike':          result = toggleLike(data);          break;

      case 'rateEvaluatorComment':result = rateEvaluatorComment(data);break;

      default: result = { success: false, error: '不明なアクション' };
    }
    return respond(result);
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------
// パフォーマンス対策：スプレッドシートの再オープン・再読み込みを防ぐキャッシュ
// （GASの1回のリクエスト処理中はグローバル変数が保持されるため、
//   同一実行内での重複したopenById()・getDataRange()呼び出しを避ける）
// -------------------------------------------------------
let _ssCache = null, _identitySsCache = null, _usersCache = null;

function getSheet(name) {
  if (!_ssCache) _ssCache = SpreadsheetApp.openById(SHEET_ID);
  return _ssCache.getSheetByName(name);
}
function getIdentitySheet(name) {
  if (!_identitySsCache) _identitySsCache = SpreadsheetApp.openById(IDENTITY_SHEET_ID);
  return _identitySsCache.getSheetByName(name);
}
// usersシートの全行を1回のリクエスト処理内でキャッシュ（findUser/resolveNameの繰り返し呼び出し対策）
function getAllUserRows() {
  if (!_usersCache) _usersCache = getIdentitySheet('users').getDataRange().getValues();
  return _usersCache;
}

// users列インデックス（IDENTITY側、0始まり）
function parseUser(r) {
  return {
    facilityCode: r[0], userId: r[1], name: r[2], role: r[3],
    pin: r[4], email: r[5], facilityName: r[6]||'', department: r[7]||'',
    failedAttempts: Number(r[9])||0, lockoutUntil: r[10]||'', anonLabel: r[11]||'',
    gender: r[12]||'', boardCertified: r[13]||'', pgy: r[14]||'', procExperience: r[15]||'',
    teachingYears: r[16]||'', otherNotes: r[17]||''
  };
}

function findUser(facilityCode, userId) {
  const rows = getAllUserRows();
  for (let i = 1; i < rows.length; i++) {
    const u = parseUser(rows[i]);
    if (u.facilityCode === facilityCode && u.userId === userId) return u;
  }
  return null;
}

// 実名解決：学習者・指導医の表示名は常にIDENTITY側から都度取得する
// （DATA側の evaluations/comments には匿名ラベルしか保存しないため）
function resolveName(facilityCode, userId, fallbackLabel) {
  const u = findUser(facilityCode, userId);
  return u ? u.name : (fallbackLabel || '(不明)');
}

// -------------------------------------------------------
// 匿名ラベルの割り当て
// -------------------------------------------------------
function nextLetterLabel(n) {
  // 0->A, 1->B, ..., 25->Z, 26->AA, ...
  let s = '';
  n = n;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function getOrCreateFacilityLabel(facilityCode, facilityName) {
  const sheet = getIdentitySheet('facilities');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === facilityCode) return rows[i][2];
  }
  const label = '施設' + nextLetterLabel(rows.length - 1 < 0 ? 0 : rows.length - 1);
  sheet.appendRow([facilityCode, facilityName, label, new Date().toISOString()]);
  return label;
}

function getNextUserLabel(facilityCode, role) {
  const rows = getIdentitySheet('users').getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === facilityCode && rows[i][3] === role) count++;
  }
  return role === 'learner' ? ('学習者' + nextLetterLabel(count)) : ('指導医' + (count + 1));
}

// -------------------------------------------------------
// 登録（指導医が自分自身・および担当学習者を登録する運用を想定）
// -------------------------------------------------------
function register({ regCode, facilityCode, facilityName, department, name, email, role,
                     gender, boardCertified, pgy, procExperience, teachingYears, otherNotes }) {
  if (regCode !== REG_CODE) return { success: false, error: '登録コードが正しくありません' };
  if (!facilityName || !department || !name || !email || !role)
    return { success: false, error: '全項目を入力してください' };

  const sheet = getIdentitySheet('users');
  const rows  = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][6] === facilityName && rows[i][2] === name && rows[i][3] === role)
      return { success: false, error: `「${name}」はすでに登録されています` };
  }

  let fc = facilityCode || '';
  if (!fc) {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][6] === facilityName) { fc = rows[i][0]; break; }
    }
  }
  if (!fc) {
    const nums = rows.slice(1).map(r => String(r[0])).filter(c => /^FAC\d+$/.test(c)).map(c => parseInt(c.slice(3)));
    fc = 'FAC' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
  }

  const prefix = role === 'learner' ? 'L' : 'E';
  const existIds = rows.slice(1).filter(r => r[1]?.toString().startsWith(prefix)).map(r => parseInt(r[1].toString().slice(1)) || 0);
  const userId = prefix + String((existIds.length ? Math.max(...existIds) : 0) + 1).padStart(3, '0');

  const pin = String(Math.floor(100000 + Math.random() * 900000));

  getOrCreateFacilityLabel(fc, facilityName);
  const anonLabel = getNextUserLabel(fc, role);

  sheet.appendRow([
    fc, userId, name, role, pin, email, facilityName, department,
    new Date().toISOString(), 0, '', anonLabel,
    gender || '', boardCertified || '', pgy || '', procExperience || '',
    role === 'evaluator' ? (teachingYears || '') : '', otherNotes || ''
  ]);

  const roleJp = role === 'learner' ? '学習者' : '指導医';
  MailApp.sendEmail({
    to: email,
    subject: '【PERFORM】登録完了 — ログイン情報',
    body:
      `${name} 様\n\nPERFORMシステムへの登録が完了しました。\n\n` +
      `■ ログイン情報\n役割：${roleJp}\n施設名：${facilityName}\n診療科：${department}\n` +
      `施設コード：${fc}\n氏名：${name}\nPINコード：${pin}\n\n` +
      `※ PINコードは第三者に教えないでください。\n※ このメールは自動送信です。`
  });

  return { success: true, facilityCode: fc, userId, role: roleJp, anonLabel };
}

// -------------------------------------------------------
// 認証
// -------------------------------------------------------
function login({ facilityCode, name, pin }) {
  const sheet = getIdentitySheet('users');
  const rows  = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const u = parseUser(rows[i]);
    const fcMatch = facilityCode ? u.facilityCode === facilityCode : true;
    if (!fcMatch || u.name !== name) continue;

    const row = i + 1;
    if (u.lockoutUntil && new Date() < new Date(u.lockoutUntil)) {
      const mins = Math.ceil((new Date(u.lockoutUntil) - new Date()) / 60000);
      return { success: false, error: `ログインがロックされています。あと ${mins} 分お待ちください。` };
    }

    if (String(u.pin) === String(pin)) {
      sheet.getRange(row, 10).setValue(0);
      sheet.getRange(row, 11).setValue('');
      return {
        success: true, role: u.role, userId: u.userId, name: u.name,
        facilityCode: u.facilityCode, facilityName: u.facilityName,
        department: u.department, email: u.email
      };
    } else {
      const newCount = u.failedAttempts + 1;
      sheet.getRange(row, 10).setValue(newCount);
      if (newCount >= MAX_FAILED) {
        const lockUntil = new Date(Date.now() + LOCKOUT_MIN * 60000).toISOString();
        sheet.getRange(row, 11).setValue(lockUntil);
        return { success: false, error: `パスワードを${MAX_FAILED}回間違えました。${LOCKOUT_MIN}分間ロックします。` };
      }
      return { success: false, error: `PINが正しくありません（残り${MAX_FAILED - newCount}回）` };
    }
  }
  return { success: false, error: '氏名または施設コードが一致しません' };
}

function verify(facilityCode, userId, pin) {
  const rows = getIdentitySheet('users').getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === facilityCode && rows[i][1] === userId && String(rows[i][4]) === String(pin)) return true;
  }
  return false;
}

// -------------------------------------------------------
// 指導医リスト取得（学習者が症例開始時に選ぶ用。実名を返す）
// -------------------------------------------------------
function getEvaluators({ facilityCode, userId, pin }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const rows = getIdentitySheet('users').getDataRange().getValues();
  const evaluators = [];
  for (let i = 1; i < rows.length; i++) {
    const u = parseUser(rows[i]);
    if (u.facilityCode === facilityCode && u.role === 'evaluator')
      evaluators.push({ userId: u.userId, name: u.name, department: u.department });
  }
  return { success: true, evaluators };
}

// -------------------------------------------------------
// 症例番号の採番（学習者×術式ごとの通し番号）
// -------------------------------------------------------
function nextCaseNo(facilityCode, learnerId, procedure) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = getSheet('evaluations').getDataRange().getValues();
    let max = 0;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (r[EV.facilityCode] === facilityCode && r[EV.learnerId] === learnerId && r[EV.procedure] === procedure) {
        const n = parseInt(String(r[EV.caseNo]).replace(/\D/g, '')) || 0;
        if (n > max) max = n;
      }
    }
    return String(max + 1).padStart(3, '0');
  } finally {
    lock.releaseLock();
  }
}

function emptyRow(len) { return new Array(len).fill(''); }

// -------------------------------------------------------
// 症例の開始（術前）
// -------------------------------------------------------
function startCase({ facilityCode, userId, pin, procedure, evaluatorId, goal }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  if (!procedure || !evaluatorId) return { success: false, error: '術式と指導医を選択してください' };

  const learner = findUser(facilityCode, userId);
  const evaluator = findUser(facilityCode, evaluatorId);
  if (!evaluator) return { success: false, error: '指導医が見つかりません' };

  const caseNo = nextCaseNo(facilityCode, userId, procedure);
  const id = 'EV' + Date.now();
  const now = new Date().toISOString();
  const hasGoal = !!(goal && goal.trim());

  const row = emptyRow(EV_COLS);
  row[EV.id] = id; row[EV.facilityCode] = facilityCode;
  row[EV.learnerId] = userId; row[EV.learnerLabel] = learner ? learner.anonLabel : '';
  row[EV.evaluatorId] = evaluatorId; row[EV.evaluatorLabel] = evaluator.anonLabel;
  row[EV.procedure] = procedure; row[EV.caseNo] = caseNo;
  row[EV.status] = 'draft'; row[EV.createdAt] = now;
  if (hasGoal) { row[EV.preOpGoal] = goal.trim(); row[EV.goalEntryMode] = 'preop'; row[EV.preOpGoalSetAt] = now; }
  getSheet('evaluations').appendRow(row);

  if (hasGoal && evaluator.email) {
    MailApp.sendEmail({
      to: evaluator.email,
      subject: `【PERFORM】術前目標が設定されました：${procedure}（症例No.${caseNo}）`,
      body: `${evaluator.name} 先生\n\n${learner ? learner.name : ''} さんが術前目標を設定しました。\n\n術式：${procedure}\n症例No.：${caseNo}\n\n■ 設定された目標\n${goal.trim()}\n\n術後の評価が届いた際にあわせてご確認ください。`
    });
  }
  return { success: true, id, caseNo };
}

// -------------------------------------------------------
// 学習者：進行中（下書き）症例の一覧
// -------------------------------------------------------
function getMyDrafts({ facilityCode, userId, pin }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const rows = getSheet('evaluations').getDataRange().getValues();
  const drafts = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[EV.facilityCode] === facilityCode && r[EV.learnerId] === userId && r[EV.status] === 'draft') {
      drafts.push({
        id: r[EV.id], caseNo: r[EV.caseNo], procedure: r[EV.procedure],
        evaluatorId: r[EV.evaluatorId], evaluatorName: resolveName(facilityCode, r[EV.evaluatorId], r[EV.evaluatorLabel]),
        preOpGoal: r[EV.preOpGoal] || '', goalEntryMode: r[EV.goalEntryMode] || '', createdAt: r[EV.createdAt],
        autonomy: r[EV.autoL] || null, performance: r[EV.perfL] || null, difficulty: r[EV.diffL] || null,
        ts1: r[EV.ts1L] || null, ts2: r[EV.ts2L] || null, ts3: r[EV.ts3L] || null, ts4: r[EV.ts4L] || null, ts5: r[EV.ts5L] || null,
        feedbackGood: r[EV.fbGoodL] || '', feedbackGoal: r[EV.fbGoalL] || ''
      });
    }
  }
  drafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { success: true, drafts };
}

// -------------------------------------------------------
// 学習者：評価の一時保存（送信はせず、下書きとして保持）
// -------------------------------------------------------
function saveLearnerDraft({ facilityCode, userId, pin, recordId, procedure, evaluatorId, goal, record }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const sheet = getSheet('evaluations');
  const now = new Date().toISOString();
  let rowIdx, row;

  if (recordId) {
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][EV.id]) === String(recordId) && rows[i][EV.facilityCode] === facilityCode && rows[i][EV.learnerId] === userId) {
        rowIdx = i + 1; row = rows[i]; break;
      }
    }
    if (!row) return { success: false, error: '症例が見つかりません' };
    if (goal !== undefined && goal.trim() && !row[EV.preOpGoal]) {
      sheet.getRange(rowIdx, EV.preOpGoal + 1).setValue(goal.trim());
      sheet.getRange(rowIdx, EV.goalEntryMode + 1).setValue('bundled');
    }
  } else {
    // まだ症例自体が存在しない新規一気入力の場合、ここで症例を作成（statusはdraftのまま）
    if (!procedure || !evaluatorId) return { success: false, error: '術式と指導医を選択してください' };
    const evaluator = findUser(facilityCode, evaluatorId);
    if (!evaluator) return { success: false, error: '指導医が見つかりません' };
    const learner = findUser(facilityCode, userId);
    const caseNo = nextCaseNo(facilityCode, userId, procedure);
    const id = 'EV' + Date.now();
    row = emptyRow(EV_COLS);
    row[EV.id] = id; row[EV.facilityCode] = facilityCode;
    row[EV.learnerId] = userId; row[EV.learnerLabel] = learner ? learner.anonLabel : '';
    row[EV.evaluatorId] = evaluatorId; row[EV.evaluatorLabel] = evaluator.anonLabel;
    row[EV.procedure] = procedure; row[EV.caseNo] = caseNo;
    row[EV.status] = 'draft'; row[EV.createdAt] = now;
    if (goal && goal.trim()) { row[EV.preOpGoal] = goal.trim(); row[EV.goalEntryMode] = 'bundled'; }
    sheet.appendRow(row);
    rowIdx = sheet.getLastRow();
  }

  const vals = [record.autonomy || '', record.performance || '', record.difficulty || '',
    record.ts1 || '', record.ts2 || '', record.ts3 || '', record.ts4 || '', record.ts5 || '',
    record.feedbackGood || '', record.feedbackGoal || ''];
  vals.forEach((v, j) => sheet.getRange(rowIdx, EV.autoL + 1 + j).setValue(v));
  // statusは変更しない（一時保存のため、送信＝pending化とは区別する）

  return {
    success: true,
    id: sheet.getRange(rowIdx, EV.id + 1).getValue(),
    caseNo: sheet.getRange(rowIdx, EV.caseNo + 1).getValue()
  };
}

// -------------------------------------------------------
// 学習者：評価送信
// -------------------------------------------------------
function submitLearner({ facilityCode, userId, pin, recordId, evaluatorId, procedure, goal, record }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };

  const sheet = getSheet('evaluations');
  const now = new Date().toISOString();
  let row, rowIdx, evaluator;

  if (recordId) {
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][EV.id]) === String(recordId) && rows[i][EV.facilityCode] === facilityCode && rows[i][EV.learnerId] === userId) {
        rowIdx = i + 1; row = rows[i]; break;
      }
    }
    if (!row) return { success: false, error: '症例が見つかりません' };
    evaluator = findUser(facilityCode, row[EV.evaluatorId]);
    if (!row[EV.preOpGoal] && goal && goal.trim()) {
      sheet.getRange(rowIdx, EV.preOpGoal + 1).setValue(goal.trim());
      sheet.getRange(rowIdx, EV.goalEntryMode + 1).setValue('bundled');
    }
  } else {
    if (!procedure || !evaluatorId) return { success: false, error: '術式と指導医を選択してください' };
    evaluator = findUser(facilityCode, evaluatorId);
    if (!evaluator) return { success: false, error: '指導医が見つかりません' };
    const learner = findUser(facilityCode, userId);
    const caseNo = nextCaseNo(facilityCode, userId, procedure);
    const id = 'EV' + Date.now();
    row = emptyRow(EV_COLS);
    row[EV.id] = id; row[EV.facilityCode] = facilityCode;
    row[EV.learnerId] = userId; row[EV.learnerLabel] = learner ? learner.anonLabel : '';
    row[EV.evaluatorId] = evaluatorId; row[EV.evaluatorLabel] = evaluator.anonLabel;
    row[EV.procedure] = procedure; row[EV.caseNo] = caseNo;
    row[EV.createdAt] = now;
    if (goal && goal.trim()) { row[EV.preOpGoal] = goal.trim(); row[EV.goalEntryMode] = 'bundled'; }
    sheet.appendRow(row);
    rowIdx = sheet.getLastRow();
  }

  const vals = [record.autonomy, record.performance, record.difficulty, record.ts1, record.ts2, record.ts3, record.ts4, record.ts5,
    record.feedbackGood || '', record.feedbackGoal || ''];
  vals.forEach((v, j) => sheet.getRange(rowIdx, EV.autoL + 1 + j).setValue(v));
  sheet.getRange(rowIdx, EV.status + 1).setValue('pending');
  sheet.getRange(rowIdx, EV.submittedAt + 1).setValue(now);
  sheet.getRange(rowIdx, EV.lCommentSubmittedAt + 1).setValue(now);

  const caseNoFinal = sheet.getRange(rowIdx, EV.caseNo + 1).getValue();
  const procFinal   = sheet.getRange(rowIdx, EV.procedure + 1).getValue();

  if (evaluator && evaluator.email) {
    MailApp.sendEmail({
      to: evaluator.email,
      subject: `【PERFORM】評価依頼：${procFinal}（症例No.${caseNoFinal}）`,
      body: `${evaluator.name} 先生\n\n学習者から評価が送信されました。\n\n術式：${procFinal}\n症例No.：${caseNoFinal}\n\nPERFORMシステムにログインして評価を入力してください。\n※ 学習者の自己評価は評価完了まで非表示です（ブラインド）。\n※ 3日以内に評価がない場合、リマインドをお送りします。`
    });
  }
  return { success: true, id: sheet.getRange(rowIdx, EV.id + 1).getValue(), caseNo: caseNoFinal };
}

// -------------------------------------------------------
// 学習者：コメント編集（送信後72時間以内）
// -------------------------------------------------------
function editLearnerComment({ facilityCode, userId, pin, recordId, feedbackGood, feedbackGoal }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const sheet = getSheet('evaluations');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[EV.id]) === String(recordId) && r[EV.facilityCode] === facilityCode && r[EV.learnerId] === userId) {
      const submittedAt = r[EV.lCommentSubmittedAt];
      if (!submittedAt) return { success: false, error: 'まだコメントが送信されていません' };
      if (Date.now() - new Date(submittedAt).getTime() > EDIT_WINDOW_MS)
        return { success: false, error: '編集可能な期間（送信後72時間）を過ぎています' };
      const rowIdx = i + 1;
      sheet.getRange(rowIdx, EV.fbGoodL + 1).setValue(feedbackGood || '');
      sheet.getRange(rowIdx, EV.fbGoalL + 1).setValue(feedbackGoal || '');
      sheet.getRange(rowIdx, EV.lCommentEditedAt + 1).setValue(new Date().toISOString());
      return { success: true };
    }
  }
  return { success: false, error: '記録が見つかりません' };
}

// -------------------------------------------------------
// 指導医：担当案件リスト（実名で返す）
// -------------------------------------------------------
function getPending({ facilityCode, userId, pin }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const rows = getSheet('evaluations').getDataRange().getValues();
  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[EV.facilityCode] === facilityCode && r[EV.evaluatorId] === userId && r[EV.status] !== 'draft') {
      records.push({
        id: r[EV.id], caseNo: r[EV.caseNo],
        learnerName: resolveName(facilityCode, r[EV.learnerId], r[EV.learnerLabel]),
        procedure: r[EV.procedure], status: r[EV.status], submittedAt: r[EV.submittedAt], hasGoal: !!r[EV.preOpGoal]
      });
    }
  }
  records.sort((a, b) => a.status === 'pending' ? -1 : 1);
  return { success: true, records };
}

// -------------------------------------------------------
// 1件取得（ブラインド制御・編集可否フラグ・実名解決）
// -------------------------------------------------------
function getRecord({ facilityCode, userId, pin, recordId }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const rows = getSheet('evaluations').getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[EV.id]) !== String(recordId) || r[EV.facilityCode] !== facilityCode) continue;
    const isLearner   = r[EV.learnerId]   === userId;
    const isEvaluator = r[EV.evaluatorId] === userId;
    if (!isLearner && !isEvaluator) continue;

    const now = Date.now();
    const canEditL = r[EV.lCommentSubmittedAt] && (now - new Date(r[EV.lCommentSubmittedAt]).getTime() <= EDIT_WINDOW_MS);
    const canEditE = r[EV.eCommentSubmittedAt] && (now - new Date(r[EV.eCommentSubmittedAt]).getTime() <= EDIT_WINDOW_MS);

    const rec = {
      id: r[EV.id], caseNo: r[EV.caseNo], procedure: r[EV.procedure], status: r[EV.status],
      learnerName: resolveName(facilityCode, r[EV.learnerId], r[EV.learnerLabel]),
      evaluatorName: resolveName(facilityCode, r[EV.evaluatorId], r[EV.evaluatorLabel]),
      preOpGoal: r[EV.preOpGoal] || '', goalEntryMode: r[EV.goalEntryMode] || '',
      evaluatorAutonomy: r[EV.autoE]||null, evaluatorPerformance: r[EV.perfE]||null, evaluatorDifficulty: r[EV.diffE]||null,
      evaluatorTS: { ts1:r[EV.ts1E]||null, ts2:r[EV.ts2E]||null, ts3:r[EV.ts3E]||null, ts4:r[EV.ts4E]||null, ts5:r[EV.ts5E]||null },
      evaluatorFeedbackGood: r[EV.fbGoodE]||'', evaluatorFeedbackGoal: r[EV.fbGoalE]||'',
      canEditEvaluatorComment: isEvaluator ? canEditE : false
    };

    if (r[EV.status] === 'reviewed' || isLearner) {
      rec.learnerAutonomy = r[EV.autoL]; rec.learnerPerformance = r[EV.perfL]; rec.learnerDifficulty = r[EV.diffL];
      rec.learnerTS = { ts1:r[EV.ts1L],ts2:r[EV.ts2L],ts3:r[EV.ts3L],ts4:r[EV.ts4L],ts5:r[EV.ts5L] };
      rec.learnerFeedbackGood = r[EV.fbGoodL]||''; rec.learnerFeedbackGoal = r[EV.fbGoalL]||'';
      rec.canEditLearnerComment = isLearner ? canEditL : false;
    }

    // 学習者が評価済み結果を閲覧したら既読を記録（NEWバッジ判定用）
    if (isLearner && r[EV.status] === 'reviewed' && !r[EV.feedbackViewedAt] && facilityCode !== 'DEMO') {
      getSheet('evaluations').getRange(i + 1, EV.feedbackViewedAt + 1).setValue(new Date().toISOString());
    }
    return { success: true, record: rec };
  }
  return { success: false, error: '記録が見つかりません' };
}

// -------------------------------------------------------
// 学習者：フィードバック既読マーク（結果一覧からの明示マーク用）
// -------------------------------------------------------
function markFeedbackViewed({ facilityCode, userId, pin, recordId }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const sheet = getSheet('evaluations');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[EV.id]) === String(recordId) && r[EV.facilityCode] === facilityCode && r[EV.learnerId] === userId) {
      if (!r[EV.feedbackViewedAt] && facilityCode !== 'DEMO') sheet.getRange(i + 1, EV.feedbackViewedAt + 1).setValue(new Date().toISOString());
      return { success: true };
    }
  }
  return { success: false, error: '記録が見つかりません' };
}

// -------------------------------------------------------
// 指導医：評価保存
// -------------------------------------------------------
function submitEvaluator({ facilityCode, userId, pin, recordId, evaluation }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const sheet = getSheet('evaluations');
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[EV.id]) === String(recordId) && r[EV.facilityCode] === facilityCode && r[EV.evaluatorId] === userId) {
      const rowIdx = i + 1;
      const now = new Date().toISOString();
      const vals = [evaluation.autonomy, evaluation.performance, evaluation.difficulty,
        evaluation.ts1, evaluation.ts2, evaluation.ts3, evaluation.ts4, evaluation.ts5,
        evaluation.feedbackGood || '', evaluation.feedbackGoal || ''];
      vals.forEach((v, j) => sheet.getRange(rowIdx, EV.autoE + 1 + j).setValue(v));
      sheet.getRange(rowIdx, EV.status + 1).setValue('reviewed');
      sheet.getRange(rowIdx, EV.reviewedAt + 1).setValue(now);
      sheet.getRange(rowIdx, EV.eCommentSubmittedAt + 1).setValue(now);

      const learner = findUser(facilityCode, r[EV.learnerId]);
      if (learner && learner.email) {
        MailApp.sendEmail({
          to: learner.email,
          subject: `【PERFORM】評価が完了しました：${r[EV.procedure]}（症例No.${r[EV.caseNo]}）`,
          body: `${learner.name} さん\n\n指導医が評価を完了しました。\n\n術式：${r[EV.procedure]}\n症例No.：${r[EV.caseNo]}\n\nPERFORMシステムの「結果」タブから確認してください。`
        });
      }
      return { success: true };
    }
  }
  return { success: false, error: '記録が見つかりません' };
}

// -------------------------------------------------------
// 指導医：評価の一時保存（送信はせず、入力内容のみ保持）
// -------------------------------------------------------
function saveEvaluatorDraft({ facilityCode, userId, pin, recordId, evaluation }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const sheet = getSheet('evaluations');
  const rows  = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[EV.id]) === String(recordId) && r[EV.facilityCode] === facilityCode && r[EV.evaluatorId] === userId) {
      const rowIdx = i + 1;
      const vals = [evaluation.autonomy || '', evaluation.performance || '', evaluation.difficulty || '',
        evaluation.ts1 || '', evaluation.ts2 || '', evaluation.ts3 || '', evaluation.ts4 || '', evaluation.ts5 || '',
        evaluation.feedbackGood || '', evaluation.feedbackGoal || ''];
      vals.forEach((v, j) => sheet.getRange(rowIdx, EV.autoE + 1 + j).setValue(v));
      // statusは変更しない（送信＝reviewed化とは区別し、pendingのまま保持する）
      return { success: true };
    }
  }
  return { success: false, error: '記録が見つかりません' };
}

// -------------------------------------------------------
// 指導医：コメント編集
// -------------------------------------------------------
function editEvaluatorComment({ facilityCode, userId, pin, recordId, feedbackGood, feedbackGoal }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const sheet = getSheet('evaluations');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[EV.id]) === String(recordId) && r[EV.facilityCode] === facilityCode && r[EV.evaluatorId] === userId) {
      const submittedAt = r[EV.eCommentSubmittedAt];
      if (!submittedAt) return { success: false, error: 'まだコメントが送信されていません' };
      if (Date.now() - new Date(submittedAt).getTime() > EDIT_WINDOW_MS)
        return { success: false, error: '編集可能な期間（送信後72時間）を過ぎています' };
      const rowIdx = i + 1;
      sheet.getRange(rowIdx, EV.fbGoodE + 1).setValue(feedbackGood || '');
      sheet.getRange(rowIdx, EV.fbGoalE + 1).setValue(feedbackGoal || '');
      sheet.getRange(rowIdx, EV.eCommentEditedAt + 1).setValue(new Date().toISOString());
      return { success: true };
    }
  }
  return { success: false, error: '記録が見つかりません' };
}

// -------------------------------------------------------
// 結果一覧
// -------------------------------------------------------
function getResults({ facilityCode, userId, pin, role }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const rows = getSheet('evaluations').getDataRange().getValues();
  const results = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[EV.facilityCode] !== facilityCode || r[EV.status] !== 'reviewed') continue;
    const mine = role === 'learner' ? r[EV.learnerId] === userId : r[EV.evaluatorId] === userId;
    if (!mine) continue;
    results.push({
      id: r[EV.id], caseNo: r[EV.caseNo], procedure: r[EV.procedure],
      learnerName: resolveName(facilityCode, r[EV.learnerId], r[EV.learnerLabel]),
      evaluatorName: resolveName(facilityCode, r[EV.evaluatorId], r[EV.evaluatorLabel]),
      reviewedAt: r[EV.reviewedAt], preOpGoal: r[EV.preOpGoal] || '',
      learnerAutonomy: r[EV.autoL], learnerPerformance: r[EV.perfL], learnerDifficulty: r[EV.diffL],
      learnerTS: { ts1:r[EV.ts1L],ts2:r[EV.ts2L],ts3:r[EV.ts3L],ts4:r[EV.ts4L],ts5:r[EV.ts5L] },
      learnerFeedbackGood: r[EV.fbGoodL]||'', learnerFeedbackGoal: r[EV.fbGoalL]||'',
      evaluatorAutonomy: r[EV.autoE], evaluatorPerformance: r[EV.perfE], evaluatorDifficulty: r[EV.diffE],
      evaluatorTS: { ts1:r[EV.ts1E],ts2:r[EV.ts2E],ts3:r[EV.ts3E],ts4:r[EV.ts4E],ts5:r[EV.ts5E] },
      evaluatorFeedbackGood: r[EV.fbGoodE]||'', evaluatorFeedbackGoal: r[EV.fbGoalE]||'',
      commentRating: role === 'learner' ? (r[EV.commentRating] || null) : null,
      isNew: role === 'learner' ? !r[EV.feedbackViewedAt] : false
    });
  }
  results.sort((a, b) => Number(String(a.id).replace(/\D/g,'')) - Number(String(b.id).replace(/\D/g,'')));
  return { success: true, results };
}

// -------------------------------------------------------
// 指導医：学習者別サマリー
// -------------------------------------------------------
function getLearnerSummary({ facilityCode, userId, pin }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const rows = getSheet('evaluations').getDataRange().getValues();
  const map  = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[EV.facilityCode] !== facilityCode || r[EV.evaluatorId] !== userId || r[EV.status] === 'draft') continue;
    const lid = r[EV.learnerId];
    if (!map[lid]) map[lid] = { learnerId: lid, learnerName: resolveName(facilityCode, lid, r[EV.learnerLabel]), total: 0, reviewed: 0, pending: 0, records: [] };
    map[lid].total++;
    if (r[EV.status] === 'reviewed') {
      map[lid].reviewed++;
      map[lid].records.push({
        id: r[EV.id], caseNo: r[EV.caseNo], procedure: r[EV.procedure],
        learnerAutonomy: r[EV.autoL], learnerPerformance: r[EV.perfL], learnerDifficulty: r[EV.diffL],
        learnerTS: { ts1:r[EV.ts1L],ts2:r[EV.ts2L],ts3:r[EV.ts3L],ts4:r[EV.ts4L],ts5:r[EV.ts5L] },
        evaluatorAutonomy: r[EV.autoE], evaluatorPerformance: r[EV.perfE], evaluatorDifficulty: r[EV.diffE],
        evaluatorTS: { ts1:r[EV.ts1E],ts2:r[EV.ts2E],ts3:r[EV.ts3E],ts4:r[EV.ts4E],ts5:r[EV.ts5E] }
      });
    } else {
      map[lid].pending++;
    }
  }
  const learners = Object.values(map).sort((a, b) => b.total - a.total);
  return { success: true, learners };
}

// -------------------------------------------------------
// ディスカッション（フィードバックへの追加コメント）
// -------------------------------------------------------
function checkRecordAccess(facilityCode, userId, recordId) {
  const rows = getSheet('evaluations').getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[EV.id]) === String(recordId) && r[EV.facilityCode] === facilityCode &&
        (r[EV.learnerId] === userId || r[EV.evaluatorId] === userId)) return r;
  }
  return null;
}

function getComments({ facilityCode, userId, pin, recordId }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  if (!checkRecordAccess(facilityCode, userId, recordId)) return { success: false, error: 'アクセス権がありません' };

  const rows = getSheet('comments').getDataRange().getValues();
  const my = 'u:' + userId;
  const comments = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[CM.evaluationId]) !== String(recordId)) continue;
    const likers = (r[CM.likes] || '').toString().split(',').filter(Boolean);
    comments.push({
      id: r[CM.id], authorRole: r[CM.authorRole],
      authorName: resolveName(facilityCode, r[CM.authorId], r[CM.authorLabel]),
      body: r[CM.body], postedAt: r[CM.postedAt], target: r[CM.target] || 'learner',
      likeCount: likers.length, likedByMe: likers.includes(my)
    });
  }
  comments.sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt));
  return { success: true, comments };
}

function addComment({ facilityCode, userId, pin, role, recordId, body, target }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  if (!body || !body.trim()) return { success: false, error: 'コメントを入力してください' };
  const record = checkRecordAccess(facilityCode, userId, recordId);
  if (!record) return { success: false, error: 'アクセス権がありません' };

  const user = findUser(facilityCode, userId);
  const id = 'CM' + Date.now() + '_' + Math.floor(Math.random()*1000);
  const now = new Date().toISOString();
  const tgt = (target === 'evaluator') ? 'evaluator' : 'learner';
  getSheet('comments').appendRow([id, recordId, facilityCode, role, userId, user ? user.anonLabel : '', body.trim(), now, '', tgt]);

  const isLearner = record[EV.learnerId] === userId;
  const otherId = isLearner ? record[EV.evaluatorId] : record[EV.learnerId];
  const other = findUser(facilityCode, otherId);
  if (other && other.email) {
    MailApp.sendEmail({
      to: other.email,
      subject: `【PERFORM】新しいコメント：${record[EV.procedure]}（症例No.${record[EV.caseNo]}）`,
      body: `${other.name} 様\n\n${user ? user.name : ''} さんからコメントが投稿されました。\n\n「${body.trim()}」\n\nPERFORMシステムから続きを確認・返信できます。`
    });
  }
  return { success: true, id };
}

function toggleLike({ facilityCode, userId, pin, commentId }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  const sheet = getSheet('comments');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][CM.id]) === String(commentId)) {
      const rowIdx = i + 1;
      const me = 'u:' + userId;
      let likers = (rows[i][CM.likes] || '').toString().split(',').filter(Boolean);
      if (likers.includes(me)) likers = likers.filter(x => x !== me); else likers.push(me);
      sheet.getRange(rowIdx, CM.likes + 1).setValue(likers.join(','));
      return { success: true, likeCount: likers.length, likedByMe: likers.includes(me) };
    }
  }
  return { success: false, error: 'コメントが見つかりません' };
}

// -------------------------------------------------------
// 学習者→指導医：コメント品質の5段階評価（指導医には非公開）
// -------------------------------------------------------
function rateEvaluatorComment({ facilityCode, userId, pin, recordId, rating }) {
  if (!verify(facilityCode, userId, pin)) return { success: false, error: '認証失敗' };
  if (!(rating >= 1 && rating <= 5)) return { success: false, error: '評価は1〜5で指定してください' };
  const sheet = getSheet('evaluations');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[EV.id]) === String(recordId) && r[EV.facilityCode] === facilityCode && r[EV.learnerId] === userId) {
      if (r[EV.status] !== 'reviewed') return { success: false, error: '指導医のコメントがまだありません' };
      const rowIdx = i + 1;
      sheet.getRange(rowIdx, EV.commentRating + 1).setValue(rating);
      sheet.getRange(rowIdx, EV.commentRatingAt + 1).setValue(new Date().toISOString());
      return { success: true };
    }
  }
  return { success: false, error: '記録が見つかりません' };
}

// -------------------------------------------------------
// リマインドメール（毎日自動実行）
// -------------------------------------------------------
function checkReminders() {
  const sheet = getSheet('evaluations');
  const rows  = sheet.getDataRange().getValues();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[EV.status] !== 'pending' || r[EV.reminderSentAt]) continue;
    const submittedAt = new Date(r[EV.submittedAt]);
    if (isNaN(submittedAt) || Date.now() - submittedAt < THREE_DAYS) continue;

    const evaluator = findUser(r[EV.facilityCode], r[EV.evaluatorId]);
    if (evaluator && evaluator.email) {
      MailApp.sendEmail({
        to: evaluator.email,
        subject: `【PERFORM リマインド】未評価の案件：${r[EV.procedure]}`,
        body: `${evaluator.name} 先生\n\n3日以上経過した未評価案件があります。\n\n術式：${r[EV.procedure]}\n症例No.：${r[EV.caseNo]}\n依頼日時：${r[EV.submittedAt]}\n\nPERFORMシステムにログインして評価を入力してください。`
      });
    }
    sheet.getRange(i + 1, EV.reminderSentAt + 1).setValue(new Date().toISOString());
  }
}

function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'checkReminders') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkReminders').timeBased().everyDays(1).atHour(8).create();
}

// -------------------------------------------------------
// デモ用データの投入（1回だけ手動実行する）
// -------------------------------------------------------
function seedDemoData() {
  const usersSheet = getIdentitySheet('users');
  const facSheet   = getIdentitySheet('facilities');
  const evalSheet  = getSheet('evaluations');
  const commentsSheet = getSheet('comments');

  const existing = usersSheet.getDataRange().getValues();
  for (let i = 1; i < existing.length; i++) {
    if (existing[i][0] === 'DEMO') return 'すでにDEMOデータが存在します。何もしませんでした。';
  }

  const now = new Date();
  const iso = (offsetDays) => new Date(now.getTime() - offsetDays*24*60*60*1000).toISOString();
  const FC = 'DEMO';
  const LEARNER1_ID = 'LDEMO1', LEARNER1_NAME = 'デモ学習者1', LEARNER1_LABEL = '学習者A';
  const LEARNER2_ID = 'LDEMO2', LEARNER2_NAME = 'デモ学習者2', LEARNER2_LABEL = '学習者B';
  const EVAL_ID     = 'EDEMO1', EVAL_NAME     = 'デモ指導医',  EVAL_LABEL     = '指導医1';

  facSheet.appendRow([FC, 'デモ病院', '施設DEMO', iso(30)]);
  usersSheet.appendRow([FC, LEARNER1_ID, LEARNER1_NAME, 'learner',  '123456', '', 'デモ病院', '消化器外科', iso(30), 0, '', LEARNER1_LABEL, '女性', '', '2', '15件程度', '', '']);
  usersSheet.appendRow([FC, LEARNER2_ID, LEARNER2_NAME, 'learner',  '123456', '', 'デモ病院', '消化器外科', iso(25), 0, '', LEARNER2_LABEL, '男性', '', '4', '30件程度', '', '']);
  usersSheet.appendRow([FC, EVAL_ID,     EVAL_NAME,     'evaluator','123456', '', 'デモ病院', '消化器外科', iso(30), 0, '', EVAL_LABEL,     '男性', 'あり', '', '', '8', '']);

  const rows = [];
  function baseRow(idOffset, learnerId, learnerLabel, procedure, caseNo, status, createdDaysAgo) {
    const row = emptyRow(EV_COLS);
    row[EV.id] = 'EV' + (Date.now() + idOffset);
    row[EV.facilityCode] = FC;
    row[EV.learnerId] = learnerId; row[EV.learnerLabel] = learnerLabel;
    row[EV.evaluatorId] = EVAL_ID;  row[EV.evaluatorLabel] = EVAL_LABEL;
    row[EV.procedure] = procedure; row[EV.caseNo] = caseNo;
    row[EV.status] = status; row[EV.createdAt] = iso(createdDaysAgo);
    return row;
  }

  const PROC1 = '腹腔鏡下胆嚢摘出術';
  const PROC2 = '腹腔鏡下虫垂切除術';
  const PROC3 = '腹腔鏡下結腸切除術';

  // ===== PROC1（学習者1中心）=====
  let r = baseRow(1, LEARNER1_ID, LEARNER1_LABEL, PROC1, '001', 'reviewed', 14);
  r[EV.preOpGoal] = 'クリッピングの手技を安定させたい'; r[EV.goalEntryMode] = 'preop'; r[EV.preOpGoalSetAt] = iso(14);
  r[EV.submittedAt] = iso(13); r[EV.reviewedAt] = iso(12);
  r[EV.autoL]=2; r[EV.perfL]=2; r[EV.diffL]=2; r[EV.ts1L]=2; r[EV.ts2L]=2; r[EV.ts3L]=3; r[EV.ts4L]=2; r[EV.ts5L]=2;
  r[EV.fbGoodL]='視野展開は意識してできた。'; r[EV.fbGoalL]='クリッピングに時間がかかった。次はもっと落ち着いて行いたい。';
  r[EV.lCommentSubmittedAt] = iso(13);
  r[EV.autoE]=2; r[EV.perfE]=3; r[EV.diffE]=2; r[EV.ts1E]=3; r[EV.ts2E]=2; r[EV.ts3E]=3; r[EV.ts4E]=3; r[EV.ts5E]=3;
  r[EV.fbGoodE]='基本操作は良好でした。落ち着いて対応できていました。'; r[EV.fbGoalE]='視野展開の工夫を次回意識してみましょう。クリッピング角度の確認も。';
  r[EV.eCommentSubmittedAt] = iso(12);
  r[EV.commentRating] = 5; r[EV.commentRatingAt] = iso(11);
  r[EV.feedbackViewedAt] = iso(11);
  rows.push(r); const p1c1Id = r[EV.id];

  r = baseRow(2, LEARNER1_ID, LEARNER1_LABEL, PROC1, '002', 'reviewed', 9);
  r[EV.submittedAt] = iso(8); r[EV.reviewedAt] = iso(7);
  r[EV.autoL]=3; r[EV.perfL]=3; r[EV.diffL]=2; r[EV.ts1L]=3; r[EV.ts2L]=3; r[EV.ts3L]=3; r[EV.ts4L]=3; r[EV.ts5L]=3;
  r[EV.fbGoodL]='前回よりも落ち着いて操作できた。'; r[EV.fbGoalL]='もう少しスピードを意識したい。';
  r[EV.lCommentSubmittedAt] = iso(8);
  r[EV.autoE]=3; r[EV.perfE]=3; r[EV.diffE]=2; r[EV.ts1E]=3; r[EV.ts2E]=3; r[EV.ts3E]=4; r[EV.ts4E]=3; r[EV.ts5E]=3;
  r[EV.fbGoodE]='安定した操作でした。成長が見えます。'; r[EV.fbGoalE]='次は難易度の高い症例に挑戦してみましょう。';
  r[EV.eCommentSubmittedAt] = iso(7);
  // 未読のまま（NEWバッジのデモ用）
  rows.push(r); const p1c2Id = r[EV.id];

  r = baseRow(3, LEARNER1_ID, LEARNER1_LABEL, PROC1, '003', 'pending', 2);
  r[EV.submittedAt] = iso(1);
  r[EV.autoL]=3; r[EV.perfL]=3; r[EV.diffL]=3; r[EV.ts1L]=3; r[EV.ts2L]=3; r[EV.ts3L]=4; r[EV.ts4L]=3; r[EV.ts5L]=3;
  r[EV.fbGoodL]='難しい症例だったが落ち着いて対応できた。'; r[EV.fbGoalL]='次回はもっと自信を持って進めたい。';
  r[EV.lCommentSubmittedAt] = iso(1);
  rows.push(r);

  // 術前目標だけ入れて、これから評価を待っている症例（学会デモ用に学習者1で用意）
  r = baseRow(9, LEARNER1_ID, LEARNER1_LABEL, PROC1, '004', 'draft', 0);
  r[EV.preOpGoal] = '胆嚢管・胆嚢動脈の確認を丁寧に行いたい'; r[EV.goalEntryMode] = 'preop'; r[EV.preOpGoalSetAt] = iso(0);
  rows.push(r);

  // ===== PROC2（学習者1・学習者2 混在）=====
  r = baseRow(4, LEARNER1_ID, LEARNER1_LABEL, PROC2, '001', 'reviewed', 20);
  r[EV.submittedAt] = iso(19); r[EV.reviewedAt] = iso(18);
  r[EV.autoL]=2; r[EV.perfL]=2; r[EV.diffL]=1; r[EV.ts1L]=2; r[EV.ts2L]=3; r[EV.ts3L]=2; r[EV.ts4L]=2; r[EV.ts5L]=2;
  r[EV.fbGoodL]='初めてでしたが手順は理解できていた。'; r[EV.fbGoalL]='もっと手早く展開したい。';
  r[EV.lCommentSubmittedAt] = iso(19);
  r[EV.autoE]=2; r[EV.perfE]=2; r[EV.diffE]=1; r[EV.ts1E]=2; r[EV.ts2E]=3; r[EV.ts3E]=2; r[EV.ts4E]=2; r[EV.ts5E]=2;
  r[EV.fbGoodE]='初回にしては良い出来でした。'; r[EV.fbGoalE]='展開のスピードは経験を積めば上がります。';
  r[EV.eCommentSubmittedAt] = iso(18);
  r[EV.feedbackViewedAt] = iso(17);
  rows.push(r); const p2c1Id = r[EV.id];

  r = baseRow(5, LEARNER2_ID, LEARNER2_LABEL, PROC2, '001', 'reviewed', 6);
  r[EV.preOpGoal] = '虫垂根部の処理を丁寧に行いたい'; r[EV.goalEntryMode] = 'preop'; r[EV.preOpGoalSetAt] = iso(6);
  r[EV.submittedAt] = iso(5); r[EV.reviewedAt] = iso(4);
  r[EV.autoL]=3; r[EV.perfL]=4; r[EV.diffL]=2; r[EV.ts1L]=4; r[EV.ts2L]=4; r[EV.ts3L]=4; r[EV.ts4L]=4; r[EV.ts5L]=3;
  r[EV.fbGoodL]='根部の処理は落ち着いて行えた。'; r[EV.fbGoalL]='もう少し早く終わらせたい。';
  r[EV.lCommentSubmittedAt] = iso(5);
  r[EV.autoE]=3; r[EV.perfE]=4; r[EV.diffE]=2; r[EV.ts1E]=4; r[EV.ts2E]=4; r[EV.ts3E]=4; r[EV.ts4E]=4; r[EV.ts5E]=4;
  r[EV.fbGoodE]='安定していて自立度も高い印象でした。'; r[EV.fbGoalE]='次はより難易度の高い症例を任せられそうです。';
  r[EV.eCommentSubmittedAt] = iso(4);
  // 未読のまま（学習者2側でもNEWバッジを確認できるように）
  rows.push(r); const p2c2Id = r[EV.id];

  r = baseRow(6, LEARNER2_ID, LEARNER2_LABEL, PROC2, '002', 'pending', 1);
  r[EV.submittedAt] = iso(0);
  r[EV.autoL]=3; r[EV.perfL]=4; r[EV.diffL]=2; r[EV.ts1L]=4; r[EV.ts2L]=4; r[EV.ts3L]=3; r[EV.ts4L]=4; r[EV.ts5L]=4;
  r[EV.fbGoodL]='前回よりスムーズに進められた。'; r[EV.fbGoalL]='引き続き丁寧さを意識したい。';
  r[EV.lCommentSubmittedAt] = iso(0);
  rows.push(r);

  r = baseRow(10, LEARNER1_ID, LEARNER1_LABEL, PROC2, '002', 'pending', 0);
  r[EV.submittedAt] = iso(0);
  r[EV.autoL]=3; r[EV.perfL]=3; r[EV.diffL]=2; r[EV.ts1L]=3; r[EV.ts2L]=3; r[EV.ts3L]=3; r[EV.ts4L]=3; r[EV.ts5L]=3;
  r[EV.fbGoodL]='前回より早く展開できた。'; r[EV.fbGoalL]='止血の確認をもっと丁寧にしたい。';
  r[EV.lCommentSubmittedAt] = iso(0);
  rows.push(r);

  // ===== PROC3（学習者2中心）=====
  r = baseRow(7, LEARNER2_ID, LEARNER2_LABEL, PROC3, '001', 'reviewed', 11);
  r[EV.preOpGoal] = '吻合部の確認を丁寧に行う'; r[EV.goalEntryMode] = 'bundled';
  r[EV.submittedAt] = iso(10); r[EV.reviewedAt] = iso(9);
  r[EV.autoL]=2; r[EV.perfL]=3; r[EV.diffL]=3; r[EV.ts1L]=3; r[EV.ts2L]=2; r[EV.ts3L]=3; r[EV.ts4L]=3; r[EV.ts5L]=2;
  r[EV.fbGoodL]='難易度の高い症例だったが最後まで集中できた。'; r[EV.fbGoalL]='吻合部の確認手順をもっと素早くしたい。';
  r[EV.lCommentSubmittedAt] = iso(10);
  r[EV.autoE]=2; r[EV.perfE]=3; r[EV.diffE]=3; r[EV.ts1E]=3; r[EV.ts2E]=3; r[EV.ts3E]=3; r[EV.ts4E]=3; r[EV.ts5E]=3;
  r[EV.fbGoodE]='難しい症例に落ち着いて対応できていました。'; r[EV.fbGoalE]='吻合部確認の手順を一緒に振り返りましょう。';
  r[EV.eCommentSubmittedAt] = iso(9);
  r[EV.feedbackViewedAt] = iso(8);
  rows.push(r); const p3c1Id = r[EV.id];

  r = baseRow(8, LEARNER2_ID, LEARNER2_LABEL, PROC3, '002', 'draft', 0);
  r[EV.preOpGoal] = '腸管の授動をスムーズに行いたい'; r[EV.goalEntryMode] = 'preop'; r[EV.preOpGoalSetAt] = iso(0);
  rows.push(r);

  r = baseRow(11, LEARNER1_ID, LEARNER1_LABEL, PROC3, '001', 'reviewed', 16);
  r[EV.submittedAt] = iso(15); r[EV.reviewedAt] = iso(14);
  r[EV.autoL]=2; r[EV.perfL]=2; r[EV.diffL]=3; r[EV.ts1L]=2; r[EV.ts2L]=2; r[EV.ts3L]=2; r[EV.ts4L]=2; r[EV.ts5L]=2;
  r[EV.fbGoodL]='難易度の高い症例でしたが最後まで集中して臨めた。'; r[EV.fbGoalL]='もう少し落ち着いて手順を進めたい。';
  r[EV.lCommentSubmittedAt] = iso(15);
  r[EV.autoE]=2; r[EV.perfE]=2; r[EV.diffE]=3; r[EV.ts1E]=2; r[EV.ts2E]=2; r[EV.ts3E]=2; r[EV.ts4E]=3; r[EV.ts5E]=2;
  r[EV.fbGoodE]='難しい症例に果敢に取り組めていました。'; r[EV.fbGoalE]='手順の見通しを立てる練習を一緒にしましょう。';
  r[EV.eCommentSubmittedAt] = iso(14);
  r[EV.feedbackViewedAt] = iso(13);
  rows.push(r);

  rows.forEach(row => evalSheet.appendRow(row));

  commentsSheet.appendRow(['CM'+(Date.now()+100), p1c1Id, FC, 'evaluator', EVAL_ID, EVAL_LABEL, '視野展開のコツについて、次回一緒に確認しましょう。', iso(11), '', 'evaluator']);
  commentsSheet.appendRow(['CM'+(Date.now()+101), p1c1Id, FC, 'learner', LEARNER1_ID, LEARNER1_LABEL, 'ありがとうございます、ぜひお願いします！', iso(10), 'u:'+EVAL_ID, 'evaluator']);
  commentsSheet.appendRow(['CM'+(Date.now()+102), p1c2Id, FC, 'evaluator', EVAL_ID, EVAL_LABEL, 'スピードは経験とともに自然に上がってきます。焦らず今のペースを大事にしてください。', iso(8), '', 'learner']);
  commentsSheet.appendRow(['CM'+(Date.now()+103), p3c1Id, FC, 'evaluator', EVAL_ID, EVAL_LABEL, '吻合部確認の手順は次回一緒に流れを確認しましょう。', iso(9), '', 'evaluator']);

  return `デモデータを投入しました。\n施設コード：DEMO\n\n学習者1：${LEARNER1_NAME}（PIN 123456）\n学習者2：${LEARNER2_NAME}（PIN 123456）\n指導医：${EVAL_NAME}（PIN 123456）\n\n術式3種（${PROC1}／${PROC2}／${PROC3}）にまたがる計11症例（評価済み8・指導医未対応3・下書き2）を投入しました。\n学会デモは学習者1のログインのみを想定しているため、学習者1側に厚めにデータを入れています（術前目標のみの下書き症例も含む）。\n学習者1の症例No.002（${PROC1}）、学習者2の症例No.001（${PROC2}）は未読のままにしてあります（NEWバッジの確認用）。`;
}
