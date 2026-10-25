/*************************************************************************
 * 1. OFFICIAL PPSC 10 SUBJECTS & CODE NORMALIZER (Instruction #7)
 * Strips trailing numbers after tags like "GK-1" -> "GK"
 *************************************************************************/
const PPSC_SUBJECTS = [
  { id: 1, name: 'Basic Computer Studies', code: 'COM', defaultWeight: 10, aliases: ['COM', 'COMP', 'COMPUTER', 'IT', 'CS', 'BASIC COMPUTER', 'BASIC COMPUTER STUDIES'] },
  { id: 2, name: 'Basic Mathematics',      code: 'MTH', defaultWeight: 10, aliases: ['MTH', 'MATH', 'MATHS', 'MATHEMATICS', 'BASIC MATHEMATICS', 'QUANT', 'ARITHMETIC'] },
  { id: 3, name: 'Current-Affairs',        code: 'CA',  defaultWeight: 10, aliases: ['CA', 'CURRENT AFFAIRS', 'CURRENT-AFFAIRS', 'AFFAIRS', 'WORLD AFFAIRS'] },
  { id: 4, name: 'English',                code: 'ENG', defaultWeight: 10, aliases: ['ENG', 'ENGLISH', 'VOCAB', 'GRAMMAR'] },
  { id: 5, name: 'Everyday-Science',       code: 'EDS', defaultWeight: 10, aliases: ['EDS', 'EVERYDAY SCIENCE', 'EVERYDAY-SCIENCE', 'SCIENCE', 'GEN SCIENCE', 'GSC'] },
  { id: 6, name: 'General-Knowledge',      code: 'GK',  defaultWeight: 10, aliases: ['GK', 'GENERAL KNOWLEDGE', 'GENERAL-KNOWLEDGE', 'GEN KNOWLEDGE', 'G.K'] },
  { id: 7, name: 'Geography',              code: 'GEO', defaultWeight: 10, aliases: ['GEO', 'GEOGRAPHY'] },
  { id: 8, name: 'Islamic-Studies',        code: 'ISM', defaultWeight: 10, aliases: ['ISM', 'ISLAMIC', 'ISLAMIC STUDIES', 'ISLAMIC-STUDIES', 'ISLAMIAT', 'ISLAMIYAT', 'ISL'] },
  { id: 9, name: 'Pakistan-Studies',       code: 'PKS', defaultWeight: 10, aliases: ['PKS', 'PAK STUDIES', 'PAKISTAN STUDIES', 'PAKISTAN-STUDIES', 'PAK', 'PS', 'PST'] },
  { id: 10, name: 'Urdu',                  code: 'UDU', defaultWeight: 10, aliases: ['UDU', 'URDU', 'URD'] }
];

const SUBJECT_MAP = {};
PPSC_SUBJECTS.forEach(s => { SUBJECT_MAP[s.code] = s; });

/**
 * Normalizes raw tags like "GK-1", "GK-104", "COM_2", "Everyday-Science-3" -> official code ("GK", "COM", "EDS")
 */
function normalizeSubjectCode(rawInput, fallbackText = '', sheetNameHint = '') {
  // 1. Try direct or prefix match on rawInput (e.g. "GK-1", "PKS-2", "EDS-4", "UDU-1")
  const tryMatchCode = (val) => {
    if (val === undefined || val === null) return null;
    const rawStr = String(val).trim();
    if (!rawStr) return null;

    // Direct regex for code + optional number: e.g. "GK-1", "COM-14", "EDS 3", "PKS.2"
    const codeTagMatch = rawStr.match(/^(COM|MTH|MATH|CA|ENG|EDS|GK|GEO|ISM|ISL|PKS|PAK|PS|UDU|URD|COMP|CS|IT|GSC)[-_.\s#]*\d*\.?$/i);
    if (codeTagMatch) {
      const token = codeTagMatch[1].toUpperCase();
      for (const subj of PPSC_SUBJECTS) {
        if (subj.code === token || subj.aliases.includes(token)) return subj.code;
      }
    }

    // Strip trailing numbers/hyphens/dots like "GK-1.", "GK-23", "GK_02", "GK 14"
    const cleaned = rawStr.toUpperCase().replace(/[-_.\s#]*\d+\.?$/g, '').replace(/\./g, '').trim();
    for (const subj of PPSC_SUBJECTS) {
      if (cleaned === subj.code || subj.aliases.includes(cleaned)) {
        return subj.code;
      }
    }

    // Prefix check for patterns like "GK-1 (General)" or "PKS/04"
    for (const subj of PPSC_SUBJECTS) {
      const prefixRegex = new RegExp(`^(${subj.code}|${subj.aliases.join('|')})([-_\\s/\\d.]|$)`, 'i');
      if (prefixRegex.test(rawStr)) {
        return subj.code;
      }
    }
    return null;
  };

  const direct = tryMatchCode(rawInput);
  if (direct) return direct;

  // 2. Check if sheet tab name itself indicates the subject (e.g. Tab named "Computer", "COM", "English")
  const fromSheet = tryMatchCode(sheetNameHint);
  if (fromSheet) return fromSheet;

  // 3. Check if an inline tag like [GK-1] or (COM-2) exists in rawInput or fallbackText
  const combinedText = `${rawInput || ''} ${fallbackText || ''} ${sheetNameHint || ''}`;
  const inlineMatch = combinedText.match(/\b(COM|MTH|CA|ENG|EDS|GK|GEO|ISM|PKS|UDU)[-_.\s]*\d+\b/i);
  if (inlineMatch) {
    return inlineMatch[1].toUpperCase();
  }

  // 4. Detect Arabic/Urdu script characters -> UDU if predominantly Urdu
  const urduChars = (String(fallbackText).match(/[\u0600-\u06FF]/g) || []).length;
  if (urduChars > 5) return 'UDU';

  // 5. Smart topic keyword matcher for descriptive end-tags (like "History and Important Inventions" in Computer sheets)
  const lowerTag = `${rawInput || ''} ${sheetNameHint || ''}`.toLowerCase();
  const lowerQ = String(fallbackText || '').toLowerCase();
  if (/\b(computer|software|hardware|ms word|excel|powerpoint|internet|binary|cpu|ram|rom|abacus|babbage|turing|eniac|univac|windows|shortcut|\.docx|\.xls)\b/.test(lowerTag + ' ' + lowerQ)) {
    return 'COM';
  }
  if (/\b(islam|quran|prophet|hadith|namaz|zakat|hajj|sahaba|hijri|ghazwa|surah|caliph)\b/.test(lowerTag + ' ' + lowerQ)) {
    return 'ISM';
  }
  if (/\b(pakistan|quaid|iqbal|lahore resolution|1947|1956|1962|1973|indus|karachi|islamabad|governor general|mughal)\b/.test(lowerTag + ' ' + lowerQ)) {
    return 'PKS';
  }
  if (/\b(vitamin|element|wavelength|microscope|radioactivity|cyanobacteria|blood|planet|solar|acid|gas|cell|enzyme|physics|chemistry|biology)\b/.test(lowerTag + ' ' + lowerQ)) {
    return 'EDS';
  }
  if (/\b(continent|ocean|river|mountain|desert|rainforest|equator|latitude|glacier|strait|capital of)\b/.test(lowerTag + ' ' + lowerQ)) {
    return 'GEO';
  }
  if (/\b(synonym|antonym|preposition|idiom|grammar|tense|passive voice|narration|stitch in time)\b/.test(lowerTag + ' ' + lowerQ) || /_{3,}/.test(String(fallbackText))) {
    return 'ENG';
  }
  if (/\b(average|percentage|ratio|algebra|triangle|circle|speed|jump in \d+ minutes|km\/h|profit|loss)\b/.test(lowerTag + ' ' + lowerQ)) {
    return 'MTH';
  }

  return 'GK'; // Default fallback to General-Knowledge
}

/*************************************************************************
 * 2. APPLICATION STATE (Zero Pre-filled Garbage Data!)
 * Default Subject Weights = Official PPSC Pattern (Total 100%)
 *************************************************************************/
let rawWorkbookRef = null; // Stores last uploaded SheetJS workbook for custom re-mapping
let customColumnMap = null; // Optional manual column mapping

const appState = {
  loadedFiles: [],      // Names of uploaded .xlsx files
  questions: [],        // Array of normalized question objects extracted from Excel
  papers: [],           // Array of { name, totalQuestions, subjectBreakdown }
  repeatedGroups: [],   // Array of repeated question groups across tabs
  // Default to Standard PPSC Pattern (Total = 100%)
  subjectWeights: {
    GK: 20, PKS: 15, ENG: 15, CA: 10, EDS: 10,
    COM: 10, ISM: 5, MTH: 5, UDU: 5, GEO: 5
  },
  quizSize: 100,        // Default 100 MCQs, min 20 MCQs
  // Memory-efficient tag history & edits map
  tagMap: {},           // { "Paper 165-GK-Q23": { s: seenCount, w: wrongCount } }
  editsMap: {},         // { "Paper 165-GK-Q23": { text, options, correct, subject, explanation, userNote } }
  examHistory: [],      // Sequential records: { id, monthYear: "Oct-2026", examName: "exam-1", date, total, correct, wrong, skipped, score, pct, wrongRefs: [[refTag, chosenIdx]] }
  activeQuiz: null,     // Current running exam state
  lastResult: null,     // Last completed exam result for review
  resultFilter: 'wrong',// 'wrong' | 'all'
  inspectedPaper: null  // Currently opened paper in Paper Tabs Explorer
};

/*************************************************************************
 * 3. INITIALIZATION & UI HELPERS
 *************************************************************************/
window.addEventListener('DOMContentLoaded', () => {
  renderSubjectDashboard();
  renderModalSubjectSliders();
  updateNextExamBadge();
  updateDashboardStats();
  populateSubjectFilterDropdown();
  populateEditModalSubjectDropdown();
  renderPermanentVaultList();
  // Auto-load ./pakppsc-db.json if hosted alongside index.html on PakPPSC.com
  autoLoadStaticHostedDb();
});

/**
 * Automatically loads ./pakppsc-db.json if placed in the same hosting folder (public_html)
 * on Northwest Registered Agent hosting for PakPPSC.com.
 */
async function autoLoadStaticHostedDb() {
  try {
    const res = await fetch('./pakppsc-db.json', { cache: 'no-store' });
    if (!res.ok) return;
    const parsed = await res.json();
    mergeImportedDatabase(parsed, 'pakppsc-db.json (Hosted Master DB)');
  } catch (e) {
    // Silent when running locally without pakppsc-db.json in same folder
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const bgClass = type === 'error' ? 'bg-rose-700 border-rose-800' : 'bg-slate-900 border-slate-700';
  toast.className = `pointer-events-auto px-4 py-3 rounded-xl border ${bgClass} text-white text-xs sm:text-sm font-medium shadow-lg flex items-center justify-between gap-3`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4200);
}

function switchTab(tabName) {
  const views = ['dashboard', 'quiz', 'result', 'papers', 'repeated', 'history', 'hosting'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.toggle('hidden', v !== tabName);
    const navBtn = document.getElementById(`nav-${v}`);
    if (navBtn) {
      if (v === tabName) {
        navBtn.className = 'nav-btn px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-emerald-700 text-white';
      } else {
        navBtn.className = 'nav-btn px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100';
      }
    }
  });

  if (tabName === 'dashboard') {
    renderSubjectDashboard();
    updateDashboardStats();
    updateNextExamBadge();
  } else if (tabName === 'papers') {
    renderPaperTabsView();
  } else if (tabName === 'repeated') {
    renderRepeatedQuestionsView();
  } else if (tabName === 'history') {
    renderHistoryView();
  } else if (tabName === 'hosting') {
    updateHostingMeter();
    renderPermanentVaultList();
  }
}

function getCurrentMonthYearLabel(dateObj = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[dateObj.getMonth()]}-${dateObj.getFullYear()}`;
}

function getNextSequentialExamName(monthYear) {
  const existingInMonth = appState.examHistory.filter(e => e.monthYear === monthYear);
  return `exam-${existingInMonth.length + 1}`;
}

function updateNextExamBadge() {
  const my = getCurrentMonthYearLabel();
  const nextExam = getNextSequentialExamName(my);
  const badge = document.getElementById('next-exam-badge');
  if (badge) badge.textContent = `${my} / ${nextExam}`;
}

/*************************************************************************
 * 4. MULTI-FILE EXCEL (.XLSX) WORKBOOK PARSER & COMPLETE FILE SCANNER
 * - Automatically skips Content / Outline / Index tabs
 * - Automatically skips PAPER #172 / PAPER# banner rows from questions
 *************************************************************************/
async function handleExcelUpload(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  if (typeof XLSX === 'undefined') {
    showToast('Excel parser library is still loading. Please check your internet connection and try again.', 'error');
    return;
  }

  let newlyExtractedCount = 0;

  for (const file of files) {
    try {
      const buffer = await file.arrayBuffer();
      let workbook = null;
      try {
        const data = new Uint8Array(buffer);
        workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: false });
      } catch (readErr) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        workbook = XLSX.read(binary, { type: 'binary' });
      }

      if (workbook && workbook.SheetNames && workbook.SheetNames.length > 0) {
        rawWorkbookRef = workbook;
        customColumnMap = null;
        const added = extractAllQuestionsFromWorkbook(workbook, file.name, true);
        newlyExtractedCount += added;
        if (!appState.loadedFiles.includes(file.name)) {
          appState.loadedFiles.push(file.name);
        }
      }
    } catch (err) {
      console.error('Error reading file:', file.name, err);
      showToast(`Could not read ${file.name}. Ensure it is a valid .xlsx or .xls file.`, 'error');
    }
  }

  // Reset file input so the same or additional files can be selected again anytime
  event.target.value = '';

  if (appState.questions.length > 0) {
    rebuildPapersAndRepetitions();
    // Permanently save newly uploaded papers & metadata into the non-deletable database
    if (typeof window.syncPermanentCloudDatabase === 'function') {
      window.syncPermanentCloudDatabase();
    }
    showToast(`Permanently added ${files.length} file(s) (+${newlyExtractedCount} MCQs) to Database! Total: ${appState.questions.length} MCQs across ${appState.papers.length} papers.`);
  } else {
    showToast('No valid MCQs detected in the uploaded file(s). Opening Column Mapper.', 'error');
    if (rawWorkbookRef) openColumnMapperModal();
  }
}

/**
 * Renders the Permanent Non-Deletable Vault list inside the Hosting & DB tab
 */
function renderPermanentVaultList() {
  const listEl = document.getElementById('permanent-vault-list');
  const countBadge = document.getElementById('vault-files-count');
  if (!listEl || !countBadge) return;

  countBadge.textContent = `${appState.loadedFiles.length} Locked File(s) • ${appState.papers.length} Papers`;

  if (appState.papers.length === 0) {
    listEl.innerHTML = `
      <div class="col-span-full p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
        No Excel files uploaded yet. Once you upload a file, it is permanently locked into the database here and cannot be deleted.
      </div>
    `;
    return;
  }

  listEl.innerHTML = appState.papers.map(p => `
    <div class="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
      <div>
        <span class="text-xs font-bold text-slate-900 block">${escapeHtml(p.name)}</span>
        <span class="text-[11px] text-slate-500">${p.totalQuestions} MCQs Stored</span>
      </div>
      <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
        🔒 Permanent
      </span>
    </div>
  `).join('');
}

/**
 * Checks if a worksheet tab is a Content / Outline / Index / TOC page that must be skipped
 */
function isNonQuestionSheetTab(sheetName) {
  const clean = String(sheetName || '').trim().toLowerCase();
  if (!clean) return true;
  return /^(content|contents|outline|outlines|index|toc|table\s*of\s*contents?|summary|overview|syllabus|menu|home|main|cover|front|dashboard|list|paper\s*list|papers\s*list|instructions|info|about)\b/i.test(clean) ||
    /\b(content\s*page|outline\s*page|table\s*of\s*content|index\s*page)\b/i.test(clean);
}

/**
 * Checks if a row or cell text is merely a Paper Name / Banner (like "PAPER #172", "PAPER# 167")
 * or navigation row rather than an actual MCQ.
 */
function isPaperBannerOrHeaderText(str) {
  const s = String(str || '').trim();
  if (!s) return true;
  // Match "PAPER #172", "PAPER# 167", "Paper 172", "PAPER NO. 172", etc.
  if (/^(paper|test|exam)\s*#?\s*(no\.?\s*)?\d+\b/i.test(s)) return true;
  if (/\bpaper\s*#\s*\d+\b/i.test(s) && s.length < 90) return true;
  // Match navigation/outline cells
  if (/^(←|⬅|→|➡|back|home|index|content|contents|outline|sr\.?\s*no|q\.?\s*no|question\s*statement)$/i.test(s)) return true;
  return false;
}

/**
 * Format paper name consistently so references look like: Paper 165, Paper 167, etc.
 */
function formatPaperName(rawName) {
  const trimmed = String(rawName || 'Paper 1').trim();
  const match = trimmed.match(/paper\s*#?\s*(\d+)/i);
  if (match) {
    return `Paper ${match[1]}`;
  }
  if (/^\d+$/.test(trimmed)) {
    return `Paper ${trimmed}`;
  }
  return trimmed;
}

/**
 * Scans all tabs in a workbook and extracts genuine MCQs while skipping Content/Outline tabs
 * and skipping PAPER #172 / PAPER# banner rows.
 */
function extractAllQuestionsFromWorkbook(workbook, fileName = 'Uploaded Workbook', appendMode = true) {
  const existingById = new Map();
  if (appendMode) {
    appState.questions.forEach(q => existingById.set(q.id, q));
  } else {
    appState.questions = [];
  }

  let newlyAddedCount = 0;

  workbook.SheetNames.forEach(sheetName => {
    // 1. Skip Content, Outline, Index, or Summary tabs automatically
    if (isNonQuestionSheetTab(sheetName)) {
      return;
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows || rows.length === 0) return;

    let activePaperName = formatPaperName(sheetName);
    const sheetQuestionsStartIdx = appState.questions.length;

    // Pre-scan sheet for PAPER # banner rows (e.g. "PAPER# 167" or "PAPER #172")
    const paperBanners = [];
    rows.forEach((r, rIdx) => {
      if (!Array.isArray(r)) return;
      const uniqueCells = Array.from(new Set(r.map(c => String(c ?? '').trim()).filter(Boolean)));
      const joined = uniqueCells.join(' | ');
      const bannerMatch = joined.match(/\bPAPER\s*#?\s*(\d+)\b/i);
      if (bannerMatch && uniqueCells.length <= 4) {
        paperBanners.push({
          rowIndex: rIdx,
          paperName: `Paper ${bannerMatch[1]}`,
          fullText: joined
        });
      }
    });

    if (paperBanners.length === 1 && !/paper\s*#?\s*\d+/i.test(sheetName)) {
      activePaperName = paperBanners[0].paperName;
    }

    const colMap = customColumnMap || detectSheetColumns(rows);
    let paperQuestionCounter = 0;

    for (let r = colMap.startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      // Deduplicate merged cell values across the row to accurately detect PAPER #172 banner rows
      const nonEmptyCells = row.map(c => String(c ?? '').trim()).filter(Boolean);
      if (nonEmptyCells.length === 0) continue;
      const uniqueRowCells = Array.from(new Set(nonEmptyCells));
      const rowJoined = uniqueRowCells.join(' ');

      // Detect if this row is a PAPER # banner row (e.g., "PAPER #172", "PAPER# 167 | Assistant Director...")
      const inlinePaperMatch = rowJoined.match(/\bPAPER\s*#?\s*(\d+)\b/i);
      if (inlinePaperMatch && (uniqueRowCells.length <= 4 || isPaperBannerOrHeaderText(row[colMap.text]))) {
        const detectedPaper = `Paper ${inlinePaperMatch[1]}`;
        if (paperBanners.length === 1 && appState.questions.length > sheetQuestionsStartIdx) {
          for (let qi = sheetQuestionsStartIdx; qi < appState.questions.length; qi++) {
            const eq = appState.questions[qi];
            if (eq.rawSheet === sheetName && eq.paper !== detectedPaper) {
              existingById.delete(eq.id);
              eq.paper = detectedPaper;
              eq.id = `${detectedPaper}-${eq.subject}-Q${eq.qNo}`;
              eq.refTag = `(${detectedPaper}-${eq.subject}-Q${eq.qNo})`;
              existingById.set(eq.id, eq);
            }
          }
        }
        activePaperName = detectedPaper;
        paperQuestionCounter = 0;
        continue;
      }

      const rawText = colMap.text !== -1 ? String(row[colMap.text] ?? '').trim() : '';
      const optA = colMap.optA !== -1 ? String(row[colMap.optA] ?? '').trim() : '';
      const optB = colMap.optB !== -1 ? String(row[colMap.optB] ?? '').trim() : '';
      const optC = colMap.optC !== -1 ? String(row[colMap.optC] ?? '').trim() : '';
      const optD = colMap.optD !== -1 ? String(row[colMap.optD] ?? '').trim() : '';

      // Strictly skip blank rows, mid-sheet headers, Content/Outline rows, or PAPER #172 title rows
      if (!rawText || rawText.length < 3) continue;
      if (isPaperBannerOrHeaderText(rawText)) continue;
      if (/^(question|questions|statement|q\.?\s*no|sr\.?\s*no|mcq|#|paper\s*name|post\s*name|department|year)$/i.test(rawText)) continue;
      if (optA.toUpperCase() === 'A' && optB.toUpperCase() === 'B' && optC.toUpperCase() === 'C') continue;

      // Ensure there are genuine options (at least 2 non-empty options and not just merged banner text)
      const nonEmptyOpts = [optA, optB, optC, optD].filter(o => o !== '' && !isPaperBannerOrHeaderText(o));
      if (nonEmptyOpts.length < 2) continue;
      // If all 4 options are identical (happens in merged banner rows across columns C-F), skip it
      if (new Set(nonEmptyOpts.map(o => o.toLowerCase())).size < 2) continue;

      paperQuestionCounter++;

      // 1. Extract real question number (# column)
      let rawQNo = colMap.qNo !== -1 ? String(row[colMap.qNo] ?? '').trim() : '';
      let numericQNo = rawQNo.replace(/[^0-9]/g, '');
      if (!numericQNo) numericQNo = String(paperQuestionCounter);

      // 2. Smart Tag Extraction (Checks BOTH Beginning of row AND End of row)
      let rawStartTag = colMap.sub !== -1 ? String(row[colMap.sub] ?? '').trim() : '';
      let rawEndTag = colMap.endTag !== undefined && colMap.endTag !== -1 ? String(row[colMap.endTag] ?? '').trim() : '';

      let discoveredCodeTag = '';
      for (let c = 0; c < row.length; c++) {
        if (c === colMap.text || c === colMap.optA || c === colMap.optB || c === colMap.optC || c === colMap.optD || c === colMap.ans) continue;
        const cellVal = String(row[c] ?? '').trim();
        if (/^(COM|MTH|MATH|CA|ENG|EDS|GK|GEO|ISM|ISL|PKS|PAK|PS|UDU|URD)[-_.\s#]*\d+$/i.test(cellVal)) {
          discoveredCodeTag = cellVal;
          break;
        }
      }

      const primaryTagCandidate = discoveredCodeTag || rawStartTag || rawEndTag;
      const subjectCode = normalizeSubjectCode(primaryTagCandidate, rawText, sheetName);

      let subTopic = '';
      if (rawEndTag && !/^(COM|MTH|CA|ENG|EDS|GK|GEO|ISM|PKS|UDU)[-_.\s#]*\d*$/i.test(rawEndTag)) {
        subTopic = rawEndTag;
      }

      // 3. Determine Correct Answer Index (0=A, 1=B, 2=C, 3=D)
      const options = [
        optA !== '' ? optA : 'Option A',
        optB !== '' ? optB : 'Option B',
        optC !== '' ? optC : 'Option C',
        optD !== '' ? optD : 'Option D'
      ];

      let rawAns = colMap.ans !== -1 ? String(row[colMap.ans] ?? '').trim() : '';
      if (!rawAns && colMap.optD !== -1) {
        for (let c = colMap.optD + 1; c < row.length; c++) {
          const val = String(row[c] ?? '').trim();
          if (/^[A-Da-d]$/.test(val)) {
            rawAns = val;
            break;
          }
        }
      }
      const correctIndex = resolveCorrectOptionIndex(rawAns, options);

      // 4. Optional Explanation column (Exp)
      const explanation = (colMap.exp !== undefined && colMap.exp !== -1) ? String(row[colMap.exp] ?? '').trim() : '';

      // 5. Strict Reference Tag: (Paper 165-GK-Q23)
      const compactId = `${activePaperName}-${subjectCode}-Q${numericQNo}`;
      const refTag = `(${compactId})`;

      // Apply any previously saved user edits / personal notes for this question ID
      const savedEdit = appState.editsMap[compactId];
      const finalStatement = savedEdit?.text || rawText;
      const finalOptions = savedEdit?.options || options;
      const finalCorrect = savedEdit?.correct !== undefined ? savedEdit.correct : correctIndex;
      const finalSubject = savedEdit?.subject || subjectCode;
      const finalExp = savedEdit?.explanation !== undefined ? savedEdit.explanation : explanation;
      const finalNote = savedEdit?.userNote || '';

      const questionObj = {
        id: compactId,
        refTag: refTag,
        rawSheet: sheetName,
        sourceFile: fileName,
        paper: activePaperName,
        subject: finalSubject,
        subTopic: subTopic,
        qNo: numericQNo,
        text: finalStatement,
        options: finalOptions,
        correct: finalCorrect,
        explanation: finalExp,
        userNote: finalNote,
        fingerprint: createQuestionFingerprint(finalStatement),
        repeatCount: 1,
        repeatedRefs: [refTag]
      };

      if (existingById.has(compactId)) {
        const idx = appState.questions.findIndex(item => item.id === compactId);
        if (idx !== -1) appState.questions[idx] = questionObj;
      } else {
        appState.questions.push(questionObj);
        existingById.set(compactId, questionObj);
        newlyAddedCount++;
      }
    }
  });

  return newlyAddedCount;
}

/**
 * Rebuilds paper summaries, re-runs repetition scanner, and refreshes UI after file uploads or MCQ edits
 */
function rebuildPapersAndRepetitions() {
  // Filter out any accidental paper header rows if present
  appState.questions = appState.questions.filter(q => !isPaperBannerOrHeaderText(q.text));

  const papersMap = new Map();
  appState.questions.forEach(q => {
    if (!papersMap.has(q.paper)) {
      papersMap.set(q.paper, {
        name: q.paper,
        totalQuestions: 0,
        subjectBreakdown: {}
      });
    }
    const pObj = papersMap.get(q.paper);
    pObj.totalQuestions++;
    pObj.subjectBreakdown[q.subject] = (pObj.subjectBreakdown[q.subject] || 0) + 1;
  });

  appState.papers = Array.from(papersMap.values());
  scanRepeatedQuestions(appState.questions);

  // Update status banner
  const fileCount = appState.loadedFiles.length || 1;
  const filesLabel = appState.loadedFiles.length > 0 ? appState.loadedFiles.join(', ') : 'Permanent Database Active';
  document.getElementById('db-status-dot').className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0';
  document.getElementById('db-status-title').textContent = `${fileCount} File(s) Permanently Stored (${filesLabel})`;
  document.getElementById('db-status-subtitle').textContent = `${appState.questions.length} MCQs across ${appState.papers.length} Papers locked in DB (${appState.repeatedGroups.length} Repeated MCQs).`;
  document.getElementById('empty-workbook-card').classList.add('hidden');
  document.getElementById('btn-remap-columns').classList.remove('hidden');

  populatePaperDropdown();
  renderSubjectDashboard();
  renderModalSubjectSliders();
  updateDashboardStats();
  renderPermanentVaultList();
}

/**
 * Auto-detects column indices from header row AND cell content patterns.
 */
function detectSheetColumns(rows) {
  let headerRowIdx = 0;
  let bestScore = -1;

  // 1. Locate the header row within the first 25 rows
  const scanLimit = Math.min(25, rows.length);
  for (let i = 0; i < scanLimit; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    let score = 0;
    r.forEach(cell => {
      const val = String(cell ?? '').trim().toLowerCase();
      if (val === 'question' || val === 'questions' || val === 'statement') score += 5;
      if (val === 'a' || val === 'opt a' || val === 'option a') score += 3;
      if (val === 'b' || val === 'opt b' || val === 'option b') score += 3;
      if (val === 'c' || val === 'opt c' || val === 'option c') score += 3;
      if (val === 'd' || val === 'opt d' || val === 'option d') score += 3;
      if (val === '#' || val === '&' || val === 'tags' || val === 'exp') score += 2;
    });
    if (score > bestScore) {
      bestScore = score;
      headerRowIdx = i;
    }
  }

  const header = (rows[headerRowIdx] || []).map(h => String(h ?? '').trim().toLowerCase());
  let map = {
    startRow: headerRowIdx + 1,
    qNo: -1,
    sub: -1,
    endTag: -1,
    text: -1,
    optA: -1,
    optB: -1,
    optC: -1,
    optD: -1,
    ans: -1,
    exp: -1
  };

  // 2. Match explicit header labels (including '&' for start tags and 'tags' for end tags)
  header.forEach((h, idx) => {
    if (map.qNo === -1 && /^(#|q\.?\s*no|q#|sr\.?\s*no|sr#|s\.no|no\.?|id)$/.test(h)) map.qNo = idx;
    else if (map.sub === -1 && /^(&|tag|subject|code|cat|section)$/.test(h)) map.sub = idx;
    else if (map.endTag === -1 && /^(tags|topic|topics|category|subtopic)$/.test(h)) map.endTag = idx;
    else if (map.text === -1 && /(question|statement|mcq|stem|particular)/.test(h)) map.text = idx;
    else if (map.optA === -1 && /^(a|opt\s*a|option\s*a|\(a\)|choice\s*a)$/.test(h)) map.optA = idx;
    else if (map.optB === -1 && /^(b|opt\s*b|option\s*b|\(b\)|choice\s*b)$/.test(h)) map.optB = idx;
    else if (map.optC === -1 && /^(c|opt\s*c|option\s*c|\(c\)|choice\s*c)$/.test(h)) map.optC = idx;
    else if (map.optD === -1 && /^(d|opt\s*d|option\s*d|\(d\)|choice\s*d)$/.test(h)) map.optD = idx;
    else if (map.ans === -1 && /^(ans|answer|correct|key|right)$/.test(h)) map.ans = idx;
    else if (map.exp === -1 && /^(exp|explanation|detail|details|solution)$/.test(h)) map.exp = idx;
  });

  // 3. If Question & Options A-D were found, check if Answer column has a BLANK header
  const sampleRows = rows.slice(map.startRow, map.startRow + 25).filter(r => Array.isArray(r) && r.some(c => String(c ?? '').trim() !== ''));
  const maxCols = sampleRows.reduce((max, r) => Math.max(max, r.length), header.length);

  if (map.text !== -1 && map.optA === -1 && maxCols >= map.text + 5) {
    map.optA = map.text + 1;
    map.optB = map.text + 2;
    map.optC = map.text + 3;
    map.optD = map.text + 4;
  }

  // Auto-detect blank-header Answer Key column by inspecting data rows for single-letter [A, B, C, D] values
  if (map.ans === -1 && sampleRows.length > 0) {
    const searchStartCol = map.optD !== -1 ? map.optD + 1 : 0;
    let bestAnsCol = -1;
    let bestAnsRatio = 0;

    for (let c = searchStartCol; c < maxCols; c++) {
      if (c === map.text || c === map.optA || c === map.optB || c === map.optC || c === map.optD || c === map.qNo || c === map.sub) continue;
      let validABCD = 0;
      let nonEmpty = 0;
      sampleRows.forEach(r => {
        const val = String(r[c] ?? '').trim();
        if (val !== '') {
          nonEmpty++;
          if (/^[A-Da-d]$/.test(val)) validABCD++;
        }
      });
      if (nonEmpty > 0) {
        const ratio = validABCD / nonEmpty;
        if (ratio >= 0.6 && ratio > bestAnsRatio) {
          bestAnsRatio = ratio;
          bestAnsCol = c;
        }
      }
    }
    if (bestAnsCol !== -1) {
      map.ans = bestAnsCol;
    }
  }

  // 4. Auto-detect Start Tag column or End Tag column from data values if header didn't specify
  if (sampleRows.length > 0) {
    for (let c = 0; c < maxCols; c++) {
      if (c === map.text || c === map.optA || c === map.optB || c === map.optC || c === map.optD || c === map.ans || c === map.qNo || c === map.exp) continue;
      let codePatternHits = 0;
      let textTagHits = 0;
      sampleRows.forEach(r => {
        const val = String(r[c] ?? '').trim();
        if (/^(COM|MTH|MATH|CA|ENG|EDS|GK|GEO|ISM|ISL|PKS|PAK|PS|UDU|URD)[-_.\s#]*\d+$/i.test(val)) {
          codePatternHits++;
        } else if (val.length > 2 && !/^\d+$/.test(val)) {
          textTagHits++;
        }
      });
      if (codePatternHits >= Math.max(1, sampleRows.length * 0.25)) {
        if (map.sub === -1) map.sub = c;
      } else if (c > (map.optD !== -1 ? map.optD : 4) && textTagHits >= Math.max(1, sampleRows.length * 0.3)) {
        if (map.endTag === -1) map.endTag = c;
      }
    }
  }

  // 5. Fallback if the sheet has no header row at all
  if (map.text === -1 || map.optA === -1) {
    const firstRow = rows[0] || [];
    const firstCell = String(firstRow[0] ?? '').trim();
    const looksLikeData = /^\d+$/.test(firstCell) || /^[a-z]{2,3}[-_]\d+/i.test(firstCell);
    if (looksLikeData) map.startRow = 0;

    if (maxCols >= 8 && /^[a-z]{2,3}[-_]\d+/i.test(String((rows[map.startRow] || [])[0] ?? '').trim())) {
      map.sub = 0; map.qNo = 1; map.text = 2;
      map.optA = 3; map.optB = 4; map.optC = 5; map.optD = 6; map.ans = 7;
    } else if (maxCols >= 7) {
      map.qNo = 0; map.text = 1;
      map.optA = 2; map.optB = 3; map.optC = 4; map.optD = 5; map.ans = 6;
      if (maxCols >= 9) map.endTag = 8;
    } else if (maxCols === 6) {
      map.text = 0; map.optA = 1; map.optB = 2; map.optC = 3; map.optD = 4; map.ans = 5;
    }
  }

  // If sub was not set at beginning, allow endTag to serve as sub
  if (map.sub === -1 && map.endTag !== -1) {
    map.sub = map.endTag;
  }

  return map;
}

function resolveCorrectOptionIndex(rawAns, options) {
  if (!rawAns) return 0;
  const clean = String(rawAns).trim();
  const upper = clean.toUpperCase().replace(/[().\s]/g, '');

  if (upper === 'A' || upper === '1' || upper === 'OPTIONA') return 0;
  if (upper === 'B' || upper === '2' || upper === 'OPTIONB') return 1;
  if (upper === 'C' || upper === '3' || upper === 'OPTIONC') return 2;
  if (upper === 'D' || upper === '4' || upper === 'OPTIOND') return 3;

  // Match against option text if the answer cell stores the actual text
  const lowerClean = clean.toLowerCase();
  for (let i = 0; i < options.length; i++) {
    if (String(options[i]).trim().toLowerCase() === lowerClean) return i;
  }

  // Check if starts with "A:", "(B)", etc.
  const prefix = clean.match(/^[(\s]*([A-Da-d])[)\s.:-]/);
  if (prefix) {
    return 'ABCD'.indexOf(prefix[1].toUpperCase());
  }
  return 0;
}

function createQuestionFingerprint(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Scans all extracted questions across all tabs to find repeated questions (Instruction #2)
 * Explicitly skips any PAPER #172 / paper title strings so only real questions are counted.
 */
function scanRepeatedQuestions(questions) {
  const map = new Map();
  questions.forEach(q => {
    if (!q.fingerprint || q.fingerprint.length < 8) return;
    if (isPaperBannerOrHeaderText(q.text)) return;
    if (!map.has(q.fingerprint)) {
      map.set(q.fingerprint, []);
    }
    map.get(q.fingerprint).push(q);
  });

  const repeatedGroups = [];
  map.forEach((group) => {
    const count = group.length;
    const allRefs = group.map(item => item.refTag);
    group.forEach(item => {
      item.repeatCount = count;
      item.repeatedRefs = allRefs;
    });
    if (count >= 2) {
      repeatedGroups.push({
        representative: group[0],
        count: count,
        refs: allRefs
      });
    }
  });

  repeatedGroups.sort((a, b) => b.count - a.count);
  appState.repeatedGroups = repeatedGroups;
}

/*************************************************************************
 * 5. INTERACTIVE COLUMN MAPPER MODAL
 *************************************************************************/
function openColumnMapperModal() {
  if (!rawWorkbookRef || rawWorkbookRef.SheetNames.length === 0) {
    showToast('Please upload an Excel (.xlsx) file first.', 'error');
    return;
  }
  const firstSheet = rawWorkbookRef.Sheets[rawWorkbookRef.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
  const detected = customColumnMap || detectSheetColumns(rows);
  const maxCols = Math.max(8, ...rows.slice(0, 5).map(r => (r ? r.length : 0)));

  const selects = [
    { id: 'map-col-qno', val: detected.qNo, allowNone: true },
    { id: 'map-col-sub', val: detected.sub, allowNone: true },
    { id: 'map-col-text', val: detected.text, allowNone: false },
    { id: 'map-col-opta', val: detected.optA, allowNone: false },
    { id: 'map-col-optb', val: detected.optB, allowNone: false },
    { id: 'map-col-optc', val: detected.optC, allowNone: false },
    { id: 'map-col-optd', val: detected.optD, allowNone: false },
    { id: 'map-col-ans', val: detected.ans, allowNone: false }
  ];

  const headerRow = rows[0] || [];
  selects.forEach(sel => {
    const el = document.getElementById(sel.id);
    el.innerHTML = '';
    if (sel.allowNone) {
      const noneOpt = document.createElement('option');
      noneOpt.value = -1;
      noneOpt.textContent = '-- Auto / None --';
      el.appendChild(noneOpt);
    }
    for (let c = 0; c < maxCols; c++) {
      const opt = document.createElement('option');
      opt.value = c;
      const colLetter = String.fromCharCode(65 + c);
      const headerSample = String(headerRow[c] ?? '').slice(0, 22);
      opt.textContent = `Col ${colLetter} (${headerSample || 'Column ' + (c + 1)})`;
      if (c === sel.val) opt.selected = true;
      el.appendChild(opt);
    }
  });

  const previewBox = document.getElementById('mapper-preview-box');
  previewBox.innerHTML = rows.slice(0, 3).map((r, i) => {
    const cells = (r || []).map((val, cIdx) => `<span class="px-1.5 py-0.5 bg-white border border-slate-200 rounded"><b>${String.fromCharCode(65 + cIdx)}:</b> ${escapeHtml(String(val).slice(0, 30))}</span>`).join(' ');
    return `<div>Row ${i + 1}: ${cells}</div>`;
  }).join('');

  document.getElementById('column-mapper-modal').classList.remove('hidden');
}

function closeColumnMapperModal() {
  document.getElementById('column-mapper-modal').classList.add('hidden');
}

function applyCustomColumnMapping() {
  customColumnMap = {
    startRow: 1,
    qNo: parseInt(document.getElementById('map-col-qno').value, 10),
    sub: parseInt(document.getElementById('map-col-sub').value, 10),
    text: parseInt(document.getElementById('map-col-text').value, 10),
    optA: parseInt(document.getElementById('map-col-opta').value, 10),
    optB: parseInt(document.getElementById('map-col-optb').value, 10),
    optC: parseInt(document.getElementById('map-col-optc').value, 10),
    optD: parseInt(document.getElementById('map-col-optd').value, 10),
    ans: parseInt(document.getElementById('map-col-ans').value, 10)
  };
  closeColumnMapperModal();
  if (rawWorkbookRef) {
    extractAllQuestionsFromWorkbook(rawWorkbookRef, 'Remapped Workbook', false);
    rebuildPapersAndRepetitions();
  }
}

/*************************************************************************
 * 6. SUBJECT DASHBOARD, AUTO-BALANCING TOPIC % & QUIZ SETUP POP-UP
 *************************************************************************/
function renderSubjectDashboard() {
  const tbody = document.getElementById('subject-dashboard-tbody');
  if (!tbody) return;

  const subjCounts = {};
  const subjAttempted = {};
  const subjCorrect = {};
  PPSC_SUBJECTS.forEach(s => {
    subjCounts[s.code] = 0;
    subjAttempted[s.code] = 0;
    subjCorrect[s.code] = 0;
  });

  appState.questions.forEach(q => {
    subjCounts[q.subject] = (subjCounts[q.subject] || 0) + 1;
    const tag = appState.tagMap[q.id];
    if (tag && tag.s > 0) {
      subjAttempted[q.subject] += tag.s;
      subjCorrect[q.subject] += Math.max(0, tag.s - (tag.w || 0));
    }
  });

  tbody.innerHTML = PPSC_SUBJECTS.map(subj => {
    const count = subjCounts[subj.code] || 0;
    const weight = appState.subjectWeights[subj.code] ?? 0;
    const att = subjAttempted[subj.code] || 0;
    const acc = att > 0 ? Math.round((subjCorrect[subj.code] / att) * 100) + '%' : '—';

    return `
      <tr class="hover:bg-slate-50">
        <td class="py-2.5 pr-2 font-mono text-slate-400">${subj.id}</td>
        <td class="py-2.5 px-2 font-medium text-slate-800">${subj.name}</td>
        <td class="py-2.5 px-2">
          <span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-xs font-semibold text-slate-700">${subj.code}</span>
        </td>
        <td class="py-2.5 px-2 text-right font-mono font-semibold text-slate-700">${count}</td>
        <td class="py-2.5 px-2 text-right font-mono text-slate-600">${acc}</td>
        <td class="py-2.5 pl-2 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button type="button" onclick="setSingleSubject100('${subj.code}')" title="Study only ${subj.name} (100%)"
              class="px-2 py-1 rounded text-[10px] font-semibold ${weight === 100 ? 'bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200'}">
              Only 100%
            </button>
            <input type="number" min="0" max="100" value="${weight}"
              onchange="updateSubjectWeightAutoBalance('${subj.code}', this.value)"
              class="w-14 text-right px-1.5 py-1 rounded border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:border-emerald-600" />
            <span class="text-xs text-slate-500">%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  updateTotalWeightBadge();
}

/**
 * Renders the interactive sliders inside the Quiz Setup Pop-up Modal
 */
function renderModalSubjectSliders() {
  const container = document.getElementById('modal-subject-sliders-list');
  if (!container) return;

  const subjCounts = {};
  PPSC_SUBJECTS.forEach(s => { subjCounts[s.code] = 0; });
  appState.questions.forEach(q => {
    subjCounts[q.subject] = (subjCounts[q.subject] || 0) + 1;
  });

  container.innerHTML = PPSC_SUBJECTS.map(subj => {
    const weight = appState.subjectWeights[subj.code] ?? 0;
    const count = subjCounts[subj.code] || 0;
    return `
      <div class="py-2 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2">
        <div class="w-44">
          <span class="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">${subj.code}</span>
          <span class="text-xs font-semibold text-slate-800 ml-1">${subj.name}</span>
          <span class="block text-[10px] text-slate-400">${count} MCQs in file</span>
        </div>
        <div class="flex-1 flex items-center gap-2 min-w-[180px]">
          <input type="range" min="0" max="100" step="1" value="${weight}"
            oninput="updateSubjectWeightAutoBalance('${subj.code}', this.value)"
            class="flex-1 h-1.5 bg-slate-200 rounded-lg cursor-pointer" />
          <input type="number" min="0" max="100" value="${weight}"
            onchange="updateSubjectWeightAutoBalance('${subj.code}', this.value)"
            class="w-14 text-right px-1.5 py-1 rounded border border-slate-300 text-xs font-mono font-bold" />
          <span class="text-xs text-slate-500">%</span>
          <button type="button" onclick="setSingleSubject100('${subj.code}')"
            class="px-2 py-1 rounded text-[10px] font-bold ${weight === 100 ? 'bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border border-slate-200'}">
            100%
          </button>
        </div>
      </div>
    `;
  }).join('');

  updateTotalWeightBadge();
}

/**
 * Automatically rebalances all other 9 subjects when one subject's percentage is changed
 */
function updateSubjectWeightAutoBalance(changedCode, rawValue) {
  const targetVal = Math.max(0, Math.min(100, Math.round(Number(rawValue) || 0)));
  const remainingToDistribute = 100 - targetVal;
  const otherCodes = PPSC_SUBJECTS.map(s => s.code).filter(c => c !== changedCode);

  appState.subjectWeights[changedCode] = targetVal;

  if (remainingToDistribute === 0) {
    otherCodes.forEach(c => { appState.subjectWeights[c] = 0; });
  } else {
    const currentOthersSum = otherCodes.reduce((sum, c) => sum + (appState.subjectWeights[c] || 0), 0);
    let allocated = 0;

    otherCodes.forEach((c, idx) => {
      if (idx === otherCodes.length - 1) {
        appState.subjectWeights[c] = Math.max(0, remainingToDistribute - allocated);
      } else {
        let share = 0;
        if (currentOthersSum > 0) {
          share = Math.round(((appState.subjectWeights[c] || 0) / currentOthersSum) * remainingToDistribute);
        } else {
          share = Math.round(remainingToDistribute / otherCodes.length);
        }
        share = Math.min(share, remainingToDistribute - allocated);
        appState.subjectWeights[c] = share;
        allocated += share;
      }
    });
  }

  renderSubjectDashboard();
  renderModalSubjectSliders();
}

function setSingleSubject100(targetCode) {
  PPSC_SUBJECTS.forEach(s => {
    appState.subjectWeights[s.code] = (s.code === targetCode) ? 100 : 0;
  });
  renderSubjectDashboard();
  renderModalSubjectSliders();
  const subjObj = SUBJECT_MAP[targetCode];
  showToast(`Set ${subjObj ? subjObj.name : targetCode} to 100% (all other subjects set to 0%).`);
}

function openQuizSetupModal() {
  renderModalSubjectSliders();
  document.getElementById('quiz-setup-modal').classList.remove('hidden');
}

function closeQuizSetupModal() {
  document.getElementById('quiz-setup-modal').classList.add('hidden');
}

function updateTotalWeightBadge() {
  const total = Object.values(appState.subjectWeights).reduce((acc, v) => acc + v, 0);
  const badge = document.getElementById('weight-total-badge');
  if (badge) {
    badge.textContent = `${total}%`;
    badge.className = total === 100
      ? 'font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200'
      : 'font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200';
  }
  const modalBadge = document.getElementById('modal-weight-total-badge');
  if (modalBadge) {
    modalBadge.textContent = `${total}%`;
  }
}

function applyWeightPreset(mode) {
  if (mode === 'equal') {
    PPSC_SUBJECTS.forEach(s => { appState.subjectWeights[s.code] = 10; });
  } else if (mode === 'ppsc') {
    appState.subjectWeights = {
      GK: 20, PKS: 15, ENG: 15, CA: 10, EDS: 10,
      COM: 10, ISM: 5, MTH: 5, UDU: 5, GEO: 5
    };
  } else if (mode === 'proportional') {
    const total = appState.questions.length;
    if (total === 0) {
      showToast('Upload your Excel file first to calculate proportional subject weights.', 'error');
      return;
    }
    let sum = 0;
    PPSC_SUBJECTS.forEach((s, idx) => {
      const count = appState.questions.filter(q => q.subject === s.code).length;
      if (idx === PPSC_SUBJECTS.length - 1) {
        appState.subjectWeights[s.code] = Math.max(0, 100 - sum);
      } else {
        const pct = Math.round((count / total) * 100);
        appState.subjectWeights[s.code] = pct;
        sum += pct;
      }
    });
  }
  renderSubjectDashboard();
  renderModalSubjectSliders();
}

function updateQuizSize(val) {
  const clamped = Math.max(20, Math.min(100, parseInt(val, 10) || 20));
  appState.quizSize = clamped;
  const range1 = document.getElementById('quiz-size-range');
  if (range1) range1.value = clamped;
  const disp1 = document.getElementById('quiz-size-display');
  if (disp1) disp1.textContent = `${clamped} MCQs`;
  const range2 = document.getElementById('modal-quiz-size-range');
  if (range2) range2.value = clamped;
  const disp2 = document.getElementById('modal-quiz-size-badge');
  if (disp2) disp2.textContent = `${clamped} MCQs`;
}

function populatePaperDropdown() {
  const sel = document.getElementById('paper-filter-select');
  sel.innerHTML = `<option value="ALL">All Paper Tabs Combined (${appState.papers.length} Tabs / ${appState.questions.length} MCQs)</option>`;
  appState.papers.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = `${p.name} (${p.totalQuestions} MCQs)`;
    sel.appendChild(opt);
  });
}

function populateSubjectFilterDropdown() {
  const sel = document.getElementById('repeat-subject-filter');
  if (!sel) return;
  sel.innerHTML = `<option value="ALL">All 10 Subjects</option>` +
    PPSC_SUBJECTS.map(s => `<option value="${s.code}">${s.code} — ${s.name}</option>`).join('');
}

/*************************************************************************
 * 7. QUIZ GENERATOR & EXAM ENGINE (20 to 100 MCQs)
 *************************************************************************/
function startGeneratedQuiz(forcedPaperName = null, forcedMode = null) {
  if (appState.questions.length === 0) {
    showToast('Please upload your PPSC Past Paper Excel (.xlsx) file first.', 'error');
    return;
  }

  const targetSize = Math.max(20, Math.min(100, appState.quizSize));
  const selectedMode = forcedMode || document.querySelector('input[name="quiz-mode"]:checked')?.value || 'random';
  const selectedPaper = forcedPaperName || document.getElementById('paper-filter-select').value;

  let pool = selectedPaper === 'ALL'
    ? [...appState.questions]
    : appState.questions.filter(q => q.paper === selectedPaper);

  if (pool.length === 0) {
    showToast('No questions found in the selected filter.', 'error');
    return;
  }

  let chosenQuestions = [];

  if (selectedMode === 'repeated') {
    const sorted = [...pool].sort((a, b) => (b.repeatCount - a.repeatCount) || (Math.random() - 0.5));
    const seenFp = new Set();
    for (const q of sorted) {
      if (!seenFp.has(q.fingerprint)) {
        seenFp.add(q.fingerprint);
        chosenQuestions.push(q);
        if (chosenQuestions.length >= targetSize) break;
      }
    }
  } else if (selectedMode === 'unseen') {
    const unseenPool = pool.filter(q => !appState.tagMap[q.id]?.s);
    chosenQuestions = shuffleArray(unseenPool).slice(0, targetSize);
    if (chosenQuestions.length < targetSize) {
      const remainder = shuffleArray(pool.filter(q => !chosenQuestions.includes(q))).slice(0, targetSize - chosenQuestions.length);
      chosenQuestions = chosenQuestions.concat(remainder);
    }
  } else if (selectedMode === 'mistakes') {
    const wrongPool = pool.filter(q => (appState.tagMap[q.id]?.w || 0) > 0);
    if (wrongPool.length === 0) {
      showToast('No previously incorrect questions tagged yet! Switching to random selection.', 'error');
      chosenQuestions = selectBySubjectWeights(pool, targetSize);
    } else {
      chosenQuestions = shuffleArray(wrongPool).slice(0, targetSize);
    }
  } else {
    chosenQuestions = selectBySubjectWeights(pool, targetSize);
  }

  const monthYear = getCurrentMonthYearLabel();
  const examName = getNextSequentialExamName(monthYear);

  appState.activeQuiz = {
    monthYear: monthYear,
    examName: examName,
    questions: chosenQuestions,
    answers: new Array(chosenQuestions.length).fill(null),
    currentIndex: 0,
    startTime: Date.now(),
    elapsedSeconds: 0,
    negativeMarking: document.getElementById('opt-negative-marking').checked,
    instantFeedback: document.getElementById('opt-instant-feedback').checked,
    timerInterval: null
  };

  if (appState.activeQuiz.timerInterval) clearInterval(appState.activeQuiz.timerInterval);
  appState.activeQuiz.timerInterval = setInterval(() => {
    if (!appState.activeQuiz) return;
    appState.activeQuiz.elapsedSeconds++;
    const mins = String(Math.floor(appState.activeQuiz.elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(appState.activeQuiz.elapsedSeconds % 60).padStart(2, '0');
    const timerEl = document.getElementById('quiz-timer-display');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);

  switchTab('quiz');
  renderActiveQuizQuestion();
}

function selectBySubjectWeights(pool, targetSize) {
  const totalWeight = Object.values(appState.subjectWeights).reduce((a, b) => a + b, 0) || 100;
  const selected = [];
  const usedIds = new Set();

  PPSC_SUBJECTS.forEach(subj => {
    const weight = appState.subjectWeights[subj.code] || 0;
    const quota = Math.round((weight / totalWeight) * targetSize);
    if (quota <= 0) return;

    const subjPool = shuffleArray(pool.filter(q => q.subject === subj.code && !usedIds.has(q.id)));
    const pick = subjPool.slice(0, quota);
    pick.forEach(q => {
      usedIds.add(q.id);
      selected.push(q);
    });
  });

  if (selected.length < targetSize) {
    const remainingPool = shuffleArray(pool.filter(q => !usedIds.has(q.id)));
    for (const q of remainingPool) {
      if (selected.length >= targetSize) break;
      selected.push(q);
    }
  } else if (selected.length > targetSize) {
    selected.length = targetSize;
  }

  return shuffleArray(selected);
}

function renderActiveQuizQuestion() {
  const quiz = appState.activeQuiz;
  if (!quiz) return;

  const idx = quiz.currentIndex;
  const q = quiz.questions[idx];
  const total = quiz.questions.length;
  const answeredCount = quiz.answers.filter(a => a !== null).length;

  document.getElementById('active-exam-title').textContent = `${quiz.monthYear} / ${quiz.examName}`;
  document.getElementById('quiz-current-num').textContent = idx + 1;
  document.getElementById('quiz-total-num').textContent = total;
  document.getElementById('quiz-answered-count').textContent = answeredCount;
  document.getElementById('quiz-remaining-count').textContent = total - answeredCount;

  const subjInfo = SUBJECT_MAP[q.subject] || { code: q.subject, name: q.subject };
  document.getElementById('q-card-subject').textContent = `${subjInfo.code} — ${subjInfo.name}`;
  document.getElementById('q-card-reftag').textContent = q.refTag;

  const subTopicBadge = document.getElementById('q-card-subtopic');
  if (subTopicBadge) {
    if (q.subTopic) {
      subTopicBadge.classList.remove('hidden');
      subTopicBadge.textContent = q.subTopic;
    } else {
      subTopicBadge.classList.add('hidden');
    }
  }

  const repeatBadge = document.getElementById('q-card-repeat-badge');
  if (q.repeatCount > 1) {
    repeatBadge.classList.remove('hidden');
    repeatBadge.textContent = `Repeated ${q.repeatCount}x in Workbook`;
  } else {
    repeatBadge.classList.add('hidden');
  }

  const statementEl = document.getElementById('q-card-statement');
  const isUrdu = q.subject === 'UDU' || /[\u0600-\u06FF]{4,}/.test(q.text);
  statementEl.className = isUrdu
    ? 'text-lg sm:text-xl font-semibold text-slate-900 urdu-text text-right'
    : 'text-base sm:text-lg font-semibold text-slate-900 leading-relaxed';
  statementEl.dir = isUrdu ? 'rtl' : 'ltr';
  statementEl.textContent = q.text;

  // Personal Note display
  const noteBox = document.getElementById('q-card-note-box');
  const noteText = document.getElementById('q-card-note-text');
  if (noteBox && noteText) {
    if (q.userNote && q.userNote.trim() !== '') {
      noteBox.classList.remove('hidden');
      noteText.textContent = q.userNote;
    } else {
      noteBox.classList.add('hidden');
      noteText.textContent = '';
    }
  }

  // Render Options
  const optionsContainer = document.getElementById('q-card-options');
  const chosen = quiz.answers[idx];
  const letters = ['A', 'B', 'C', 'D'];

  optionsContainer.innerHTML = q.options.map((optText, optIdx) => {
    const isSelected = chosen === optIdx;
    let borderClass = 'border-slate-200 hover:border-slate-300 bg-white text-slate-800';
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

    if (isSelected) {
      if (quiz.instantFeedback) {
        if (optIdx === q.correct) {
          borderClass = 'border-emerald-600 bg-emerald-50 text-emerald-950';
          badgeClass = 'bg-emerald-700 text-white border-emerald-700';
        } else {
          borderClass = 'border-rose-600 bg-rose-50 text-rose-950';
          badgeClass = 'bg-rose-600 text-white border-rose-600';
        }
      } else {
        borderClass = 'border-emerald-700 bg-emerald-50/70 text-slate-900';
        badgeClass = 'bg-emerald-700 text-white border-emerald-700';
      }
    } else if (quiz.instantFeedback && chosen !== null && optIdx === q.correct) {
      borderClass = 'border-emerald-500 bg-emerald-50/40 text-emerald-900';
      badgeClass = 'bg-emerald-600 text-white border-emerald-600';
    }

    return `
      <button type="button" onclick="selectQuizOption(${optIdx})"
        class="w-full text-left p-3.5 rounded-xl border-2 ${borderClass} flex items-center gap-3">
        <span class="w-7 h-7 rounded-lg border ${badgeClass} flex items-center justify-center text-xs font-bold shrink-0">
          ${letters[optIdx]}
        </span>
        <span class="text-sm sm:text-base font-medium flex-1 ${isUrdu ? 'urdu-text text-right' : ''}" dir="${isUrdu ? 'rtl' : 'ltr'}">
          ${escapeHtml(optText)}
        </span>
      </button>
    `;
  }).join('');

  document.getElementById('btn-prev-q').disabled = idx === 0;
  document.getElementById('btn-next-q').textContent = idx === total - 1 ? 'Finish & Submit' : 'Next \u2192';

  renderQuizPalette();
}

function selectQuizOption(optIdx) {
  if (!appState.activeQuiz) return;
  appState.activeQuiz.answers[appState.activeQuiz.currentIndex] = optIdx;
  renderActiveQuizQuestion();
}

function clearCurrentSelection() {
  if (!appState.activeQuiz) return;
  appState.activeQuiz.answers[appState.activeQuiz.currentIndex] = null;
  renderActiveQuizQuestion();
}

function navigateQuestion(delta) {
  const quiz = appState.activeQuiz;
  if (!quiz) return;
  const nextIdx = quiz.currentIndex + delta;
  if (nextIdx >= quiz.questions.length) {
    submitActiveQuiz();
    return;
  }
  if (nextIdx >= 0 && nextIdx < quiz.questions.length) {
    quiz.currentIndex = nextIdx;
    renderActiveQuizQuestion();
  }
}

function jumpToQuestion(idx) {
  if (!appState.activeQuiz) return;
  appState.activeQuiz.currentIndex = idx;
  renderActiveQuizQuestion();
}

function renderQuizPalette() {
  const quiz = appState.activeQuiz;
  const grid = document.getElementById('quiz-palette-grid');
  if (!quiz || !grid) return;

  grid.innerHTML = quiz.questions.map((_, i) => {
    const isCurrent = i === quiz.currentIndex;
    const isAnswered = quiz.answers[i] !== null;
    let cls = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
    if (isAnswered) cls = 'bg-emerald-600 text-white border-emerald-600';
    if (isCurrent) cls += ' ring-2 ring-offset-1 ring-slate-900 font-bold';

    return `
      <button type="button" onclick="jumpToQuestion(${i})"
        class="h-8 rounded-lg border text-xs font-mono ${cls}">
        ${i + 1}
      </button>
    `;
  }).join('');
}

/*************************************************************************
 * 8. EXAM SUBMISSION, REFERENCE REPORT & MEMORY-EFFICIENT TAG LOGGING
 *************************************************************************/
function submitActiveQuiz() {
  const quiz = appState.activeQuiz;
  if (!quiz) return;

  if (quiz.timerInterval) clearInterval(quiz.timerInterval);

  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  const wrongRefsCompact = [];
  const detailedItems = [];

  quiz.questions.forEach((q, idx) => {
    const chosen = quiz.answers[idx];
    if (!appState.tagMap[q.id]) {
      appState.tagMap[q.id] = { s: 0, w: 0 };
    }
    appState.tagMap[q.id].s += 1;

    if (chosen === null) {
      skipped++;
      detailedItems.push({ q, chosen: null, status: 'skipped' });
    } else if (chosen === q.correct) {
      correct++;
      detailedItems.push({ q, chosen, status: 'correct' });
    } else {
      wrong++;
      appState.tagMap[q.id].w += 1;
      wrongRefsCompact.push([q.id, chosen]);
      detailedItems.push({ q, chosen, status: 'wrong' });
    }
  });

  const rawScore = quiz.negativeMarking ? Math.max(0, correct - wrong * 0.25) : correct;
  const scoreFormatted = Number(rawScore.toFixed(2));
  const total = quiz.questions.length;
  const pct = Math.round((scoreFormatted / total) * 100);

  const examRecord = {
    id: `${quiz.monthYear}-${quiz.examName}`,
    monthYear: quiz.monthYear,
    examName: quiz.examName,
    date: new Date().toLocaleString(),
    total: total,
    correct: correct,
    wrong: wrong,
    skipped: skipped,
    score: scoreFormatted,
    pct: pct,
    wrongRefs: wrongRefsCompact
  };

  appState.examHistory.unshift(examRecord);
  appState.lastResult = {
    record: examRecord,
    items: detailedItems
  };
  appState.activeQuiz = null;

  updateDashboardStats();
  if (typeof window.syncPermanentCloudMetaOnly === 'function') {
    window.syncPermanentCloudMetaOnly();
  }
  renderResultView();
  switchTab('result');
}

function renderResultView() {
  const res = appState.lastResult;
  if (!res) return;

  const rec = res.record;
  document.getElementById('res-exam-label').textContent = `${rec.monthYear} / ${rec.examName}`;
  document.getElementById('res-timestamp').textContent = rec.date;
  document.getElementById('res-score-val').textContent = `${rec.score} / ${rec.total}`;
  document.getElementById('res-pct-val').textContent = `${rec.pct}%`;
  document.getElementById('res-correct-val').textContent = rec.correct;
  document.getElementById('res-wrong-val').textContent = rec.wrong;
  document.getElementById('res-skipped-val').textContent = rec.skipped;

  filterResultReview('wrong');
}

function filterResultReview(mode) {
  appState.resultFilter = mode;
  const btnWrong = document.getElementById('btn-res-filter-wrong');
  const btnAll = document.getElementById('btn-res-filter-all');

  if (mode === 'wrong') {
    btnWrong.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white';
    btnAll.className = 'px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200';
  } else {
    btnWrong.className = 'px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200';
    btnAll.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white';
  }

  const container = document.getElementById('result-review-list');
  const res = appState.lastResult;
  if (!res || !container) return;

  const filtered = mode === 'wrong'
    ? res.items.filter(item => item.status !== 'correct')
    : res.items;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-sm font-medium">
        Flawless score! You had 0 incorrect or skipped questions in this exam.
      </div>
    `;
    return;
  }

  const letters = ['A', 'B', 'C', 'D'];
  container.innerHTML = filtered.map((item, idx) => {
    const q = item.q;
    const statusBadge = item.status === 'wrong'
      ? `<span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-semibold">Incorrect</span>`
      : item.status === 'skipped'
      ? `<span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-semibold">Unanswered</span>`
      : `<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">Correct</span>`;

    const userChoiceText = item.chosen !== null
      ? `${letters[item.chosen]}. ${escapeHtml(q.options[item.chosen])}`
      : 'Skipped / Not Answered';
    const correctChoiceText = `${letters[q.correct]}. ${escapeHtml(q.options[q.correct])}`;

    return `
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            ${statusBadge}
            <span class="text-xs font-semibold text-slate-600">${q.subject}</span>
            ${q.repeatCount > 1 ? `<span class="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">Repeated ${q.repeatCount}x</span>` : ''}
          </div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-900">
              ${escapeHtml(q.refTag)}
            </span>
            <button type="button" onclick="openEditMcqModal('${escapeJsString(q.id)}')" class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold">
              Edit / Add Note
            </button>
          </div>
        </div>

        <p class="text-sm sm:text-base font-semibold text-slate-900">${escapeHtml(q.text)}</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          <div class="p-2.5 rounded-lg ${item.status === 'correct' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-rose-50 border border-rose-200 text-rose-900'}">
            <span class="font-semibold block uppercase text-[10px] opacity-75">Your Answer:</span>
            <span class="font-medium">${userChoiceText}</span>
          </div>
          <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
            <span class="font-semibold block uppercase text-[10px] opacity-75">Correct Key ${escapeHtml(q.refTag)}:</span>
            <span class="font-bold">${correctChoiceText}</span>
          </div>
        </div>
        ${q.explanation ? `<div class="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700"><span class="font-semibold text-slate-900">Explanation:</span> ${escapeHtml(q.explanation)}</div>` : ''}
        ${q.userNote ? `<div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950"><span class="font-bold text-amber-900">My Note:</span> ${escapeHtml(q.userNote)}</div>` : ''}
      </div>
    `;
  }).join('');
}

/*************************************************************************
 * 9. PAPER TABS EXPLORER, MCQ INSPECTOR/EDITOR & REPEATED QUESTIONS VIEW
 *************************************************************************/
function renderPaperTabsView() {
  const container = document.getElementById('papers-grid-container');
  const query = (document.getElementById('search-papers-input')?.value || '').trim().toLowerCase();

  if (appState.papers.length === 0) {
    container.innerHTML = `<div class="col-span-full p-8 text-center text-sm text-slate-500">No paper tabs loaded yet. Upload your .xlsx file(s) above to view all past paper tabs.</div>`;
    return;
  }

  const filtered = appState.papers.filter(p => p.name.toLowerCase().includes(query));
  container.innerHTML = filtered.map(p => {
    const badges = Object.entries(p.subjectBreakdown)
      .map(([code, cnt]) => `<span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700">${code}: ${cnt}</span>`)
      .join(' ');

    return `
      <div class="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between space-y-4">
        <div>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-900">${escapeHtml(p.name)}</h3>
            <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              ${p.totalQuestions} MCQs
            </span>
          </div>
          <div class="flex flex-wrap gap-1 mt-3">
            ${badges}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="openPaperQuestionsInspector('${escapeJsString(p.name)}')" class="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold">
            View / Edit MCQs
          </button>
          <button onclick="startPaperSpecificQuiz('${escapeJsString(p.name)}')" class="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold">
            Attempt Paper Quiz
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (appState.inspectedPaper) {
    renderPaperQuestionsInspector();
  }
}

function openPaperQuestionsInspector(paperName) {
  appState.inspectedPaper = paperName;
  const panel = document.getElementById('paper-questions-inspector');
  if (panel) {
    panel.classList.remove('hidden');
    document.getElementById('inspector-paper-badge').textContent = paperName;
    renderPaperQuestionsInspector();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function closePaperQuestionsInspector() {
  appState.inspectedPaper = null;
  const panel = document.getElementById('paper-questions-inspector');
  if (panel) panel.classList.add('hidden');
}

function renderPaperQuestionsInspector() {
  const paperName = appState.inspectedPaper;
  const listEl = document.getElementById('inspector-questions-list');
  if (!paperName || !listEl) return;

  const filterText = (document.getElementById('inspector-search-input')?.value || '').trim().toLowerCase();
  const paperQuestions = appState.questions.filter(q => {
    if (q.paper !== paperName) return false;
    if (!filterText) return true;
    return q.text.toLowerCase().includes(filterText) ||
           q.refTag.toLowerCase().includes(filterText) ||
           (q.userNote && q.userNote.toLowerCase().includes(filterText));
  });

  if (paperQuestions.length === 0) {
    listEl.innerHTML = `<div class="p-6 text-center text-xs text-slate-500">No matching questions found in ${escapeHtml(paperName)}.</div>`;
    return;
  }

  const letters = ['A', 'B', 'C', 'D'];
  listEl.innerHTML = paperQuestions.map(q => {
    const optsHtml = q.options.map((opt, idx) => {
      const isCorrect = idx === q.correct;
      return `<div class="px-2.5 py-1.5 rounded-lg border text-xs ${isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-slate-200 text-slate-700'}">
        ${letters[idx]}. ${escapeHtml(opt)}
      </div>`;
    }).join('');

    return `
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-900">${escapeHtml(q.refTag)}</span>
            <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">${q.subject}</span>
          </div>
          <button type="button" onclick="openEditMcqModal('${escapeJsString(q.id)}')" class="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1">
            Edit MCQ / Add Note
          </button>
        </div>
        <p class="text-sm font-semibold text-slate-900">${escapeHtml(q.text)}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          ${optsHtml}
        </div>
        ${q.explanation ? `<div class="p-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600"><b>Explanation:</b> ${escapeHtml(q.explanation)}</div>` : ''}
        ${q.userNote ? `<div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950"><b>My Note:</b> ${escapeHtml(q.userNote)}</div>` : ''}
      </div>
    `;
  }).join('');
}

function startPaperSpecificQuiz(paperName) {
  const paperObj = appState.papers.find(p => p.name === paperName);
  if (paperObj) {
    updateQuizSize(Math.min(100, Math.max(20, paperObj.totalQuestions)));
  }
  startGeneratedQuiz(paperName, 'random');
}

function renderRepeatedQuestionsView() {
  const container = document.getElementById('repeated-questions-list');
  const subjFilter = document.getElementById('repeat-subject-filter')?.value || 'ALL';

  if (appState.repeatedGroups.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-sm text-slate-500">No repeated questions detected yet, or no Excel file uploaded.</div>`;
    return;
  }

  const filtered = subjFilter === 'ALL'
    ? appState.repeatedGroups
    : appState.repeatedGroups.filter(g => g.representative.subject === subjFilter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-sm text-slate-500">No repeated questions found for subject code ${subjFilter}.</div>`;
    return;
  }

  const letters = ['A', 'B', 'C', 'D'];
  container.innerHTML = filtered.map(group => {
    const q = group.representative;
    const refBadges = group.refs.map(r => `<span class="font-mono text-[11px] px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">${escapeHtml(r)}</span>`).join(' ');

    return `
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded bg-emerald-700 text-white text-xs font-bold">Repeated ${group.count} Times</span>
            <span class="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-xs font-semibold">${q.subject}</span>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            ${refBadges}
            <button type="button" onclick="openEditMcqModal('${escapeJsString(q.id)}')" class="ml-1 px-2.5 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700">
              Edit / Note
            </button>
          </div>
        </div>
        <p class="text-sm sm:text-base font-semibold text-slate-900">${escapeHtml(q.text)}</p>
        <p class="text-xs text-emerald-800 font-semibold">
          Correct Answer: ${letters[q.correct]}. ${escapeHtml(q.options[q.correct])}
        </p>
        ${q.userNote ? `<div class="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950"><b>My Note:</b> ${escapeHtml(q.userNote)}</div>` : ''}
      </div>
    `;
  }).join('');
}

function startRepeatedQuizNow() {
  startGeneratedQuiz('ALL', 'repeated');
}

/*************************************************************************
 * 9B. EDIT MCQ & PERSONAL QUESTION NOTES MODAL LOGIC
 *************************************************************************/
function populateEditModalSubjectDropdown() {
  const sel = document.getElementById('edit-mcq-subject');
  if (!sel) return;
  sel.innerHTML = PPSC_SUBJECTS.map(s => `<option value="${s.code}">${s.code} — ${s.name}</option>`).join('');
}

function openEditMcqModalFromActiveQuiz() {
  if (!appState.activeQuiz) return;
  const q = appState.activeQuiz.questions[appState.activeQuiz.currentIndex];
  if (q) openEditMcqModal(q.id);
}

function openEditMcqModal(questionId) {
  const q = appState.questions.find(item => item.id === questionId);
  if (!q) {
    showToast('Question not found in current workbook.', 'error');
    return;
  }

  document.getElementById('edit-mcq-id').value = q.id;
  document.getElementById('edit-mcq-ref-badge').textContent = q.refTag;
  document.getElementById('edit-mcq-subject').value = q.subject;
  document.getElementById('edit-mcq-correct').value = String(q.correct);
  document.getElementById('edit-mcq-statement').value = q.text;
  document.getElementById('edit-mcq-opta').value = q.options[0] || '';
  document.getElementById('edit-mcq-optb').value = q.options[1] || '';
  document.getElementById('edit-mcq-optc').value = q.options[2] || '';
  document.getElementById('edit-mcq-optd').value = q.options[3] || '';
  document.getElementById('edit-mcq-exp').value = q.explanation || '';
  document.getElementById('edit-mcq-note').value = q.userNote || '';

  document.getElementById('edit-mcq-modal').classList.remove('hidden');
}

function closeEditMcqModal() {
  document.getElementById('edit-mcq-modal').classList.add('hidden');
}

function saveEditedMcq() {
  const qId = document.getElementById('edit-mcq-id').value;
  const q = appState.questions.find(item => item.id === qId);
  if (!q) return;

  const newSubj = document.getElementById('edit-mcq-subject').value;
  const newCorrect = parseInt(document.getElementById('edit-mcq-correct').value, 10) || 0;
  const newStatement = document.getElementById('edit-mcq-statement').value.trim();
  const newOptions = [
    document.getElementById('edit-mcq-opta').value.trim() || 'Option A',
    document.getElementById('edit-mcq-optb').value.trim() || 'Option B',
    document.getElementById('edit-mcq-optc').value.trim() || 'Option C',
    document.getElementById('edit-mcq-optd').value.trim() || 'Option D'
  ];
  const newExp = document.getElementById('edit-mcq-exp').value.trim();
  const newNote = document.getElementById('edit-mcq-note').value.trim();

  if (!newStatement) {
    showToast('Question statement cannot be empty.', 'error');
    return;
  }

  q.subject = newSubj;
  q.correct = newCorrect;
  q.text = newStatement;
  q.options = newOptions;
  q.explanation = newExp;
  q.userNote = newNote;
  q.fingerprint = createQuestionFingerprint(newStatement);

  appState.editsMap[q.id] = {
    subject: newSubj,
    correct: newCorrect,
    text: newStatement,
    options: newOptions,
    explanation: newExp,
    userNote: newNote
  };

  closeEditMcqModal();
  rebuildPapersAndRepetitions();

  if (typeof window.syncSinglePaperToCloudDb === 'function') {
    window.syncSinglePaperToCloudDb(q.paper);
  }

  if (appState.activeQuiz) renderActiveQuizQuestion();
  if (appState.lastResult) renderResultView();
  if (appState.inspectedPaper) renderPaperQuestionsInspector();
  renderRepeatedQuestionsView();

  showToast(`Permanently saved changes & note for ${q.refTag}`);
}

/*************************************************************************
 * 10. SEQUENTIAL MONTHLY ATTEMPTS HISTORY (Oct-2026 -> exam-1, exam-2)
 *************************************************************************/
function renderHistoryView() {
  const container = document.getElementById('history-months-container');
  if (appState.examHistory.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-sm text-slate-500">No exams attempted yet. Complete an exam to see sequential monthly records (e.g., Oct-2026 &rarr; exam-1, exam-2).</div>`;
    return;
  }

  const groups = {};
  appState.examHistory.forEach(rec => {
    if (!groups[rec.monthYear]) groups[rec.monthYear] = [];
    groups[rec.monthYear].push(rec);
  });

  container.innerHTML = Object.entries(groups).map(([monthYear, exams]) => {
    const rowsHtml = exams.map(ex => `
      <div class="p-4 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              ${escapeHtml(ex.monthYear)} / ${escapeHtml(ex.examName)}
            </span>
            <span class="text-xs text-slate-400">${escapeHtml(ex.date)}</span>
          </div>
          <p class="text-xs text-slate-600 pt-1">
            Total: <b>${ex.total}</b> &bull; Correct: <b class="text-emerald-700">${ex.correct}</b> &bull; Wrong: <b class="text-rose-600">${ex.wrong}</b> &bull; Skipped: <b>${ex.skipped}</b>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <span class="block text-sm font-bold text-slate-900">${ex.score} / ${ex.total} (${ex.pct}%)</span>
            <span class="block text-[11px] text-slate-400">${ex.wrongRefs.length} mistake tags stored</span>
          </div>
          <button onclick="reopenHistoricalExam('${escapeJsString(ex.id)}')" class="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700">
            View Mistakes
          </button>
        </div>
      </div>
    `).join('');

    return `
      <div class="space-y-2.5">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700">${escapeHtml(monthYear)} Combined Papers</h3>
          <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">${exams.length} Exams</span>
        </div>
        <div class="space-y-2">${rowsHtml}</div>
      </div>
    `;
  }).join('');
}

function reopenHistoricalExam(examId) {
  const rec = appState.examHistory.find(e => e.id === examId);
  if (!rec) return;

  const qLookup = new Map();
  appState.questions.forEach(q => qLookup.set(q.id, q));

  const reconstructedItems = rec.wrongRefs.map(([qId, chosenIdx]) => {
    const foundQ = qLookup.get(qId) || {
      id: qId,
      refTag: `(${qId})`,
      subject: normalizeSubjectCode(qId.split('-')[1] || 'GK'),
      text: `Question ${qId} (Load corresponding Excel workbook to view full statement)`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: 0,
      repeatCount: 1
    };
    return { q: foundQ, chosen: chosenIdx, status: 'wrong' };
  });

  appState.lastResult = {
    record: rec,
    items: reconstructedItems
  };
  renderResultView();
  switchTab('result');
}

/*************************************************************************
 * 11. STATS, MEMORY FOOTPRINT & 250MB HOSTING DB EXPORT/IMPORT
 *************************************************************************/
function updateDashboardStats() {
  const totalQ = appState.questions.length;
  const totalPapers = appState.papers.length;
  const repeatedCount = appState.repeatedGroups.length;
  const seenCount = Object.values(appState.tagMap).filter(t => t.s > 0).length;
  const wrongCount = Object.values(appState.tagMap).filter(t => t.w > 0).length;

  document.getElementById('stat-total-q').textContent = totalQ;
  document.getElementById('stat-total-papers').textContent = totalPapers;
  document.getElementById('stat-repeated-q').textContent = repeatedCount;
  document.getElementById('stat-seen-q').textContent = seenCount;
  document.getElementById('stat-wrong-q').textContent = wrongCount;

  document.getElementById('nav-count-papers').textContent = totalPapers;
  document.getElementById('nav-count-repeated').textContent = repeatedCount;
  document.getElementById('nav-count-history').textContent = appState.examHistory.length;

  const bytes = estimateMemoryBytes();
  const kb = (bytes / 1024).toFixed(1);
  document.getElementById('stat-memory-used').textContent = `${kb} KB`;
}

function estimateMemoryBytes() {
  const payload = JSON.stringify({
    q: appState.questions.map(q => [q.id, q.text, q.options, q.correct]),
    t: appState.tagMap,
    h: appState.examHistory
  });
  return new Blob([payload]).size;
}

function updateHostingMeter() {
  const bytes = estimateMemoryBytes() + 45000;
  const kb = Math.round(bytes / 1024);
  const maxKb = 250 * 1024;
  const pct = Math.min(100, ((kb / maxKb) * 100)).toFixed(3);
  document.getElementById('hosting-size-label').textContent = `${kb.toLocaleString()} KB / 256,000 KB (${pct}%)`;
  document.getElementById('hosting-size-bar').style.width = `${Math.max(1, Math.min(100, (kb / maxKb) * 100))}%`;
}

function exportCompactDatabaseJson() {
  if (appState.questions.length === 0) {
    showToast('Upload your Excel (.xlsx) file first before exporting the database.', 'error');
    return;
  }
  const exportPayload = {
    version: 2,
    domain: 'PakPPSC.com',
    exportedAt: new Date().toISOString(),
    loadedFiles: appState.loadedFiles,
    questions: appState.questions,
    papers: appState.papers,
    tagMap: appState.tagMap,
    editsMap: appState.editsMap,
    examHistory: appState.examHistory
  };
  downloadJsonFile(exportPayload, 'pakppsc-db.json');
  showToast('Downloaded compact pakppsc-db.json (includes all MCQs, edits & personal notes)!');
}

function exportHistoryBackup() {
  const payload = {
    version: 2,
    domain: 'PakPPSC.com',
    tagMap: appState.tagMap,
    editsMap: appState.editsMap,
    examHistory: appState.examHistory
  };
  downloadJsonFile(payload, 'pakppsc-history-tags.json');
  showToast('Exported memory-efficient attempt tags & notes (.json).');
}

function handleJsonDbUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      mergeImportedDatabase(parsed, file.name);
      if (typeof window.syncPermanentCloudDatabase === 'function') {
        window.syncPermanentCloudDatabase();
      }
      showToast('Permanently merged saved JSON database & notes into your vault!');
    } catch (err) {
      showToast('Invalid JSON database file.', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function mergeImportedDatabase(parsed, sourceLabel = '') {
  if (!parsed || typeof parsed !== 'object') return;

  if (parsed.tagMap && typeof parsed.tagMap === 'object') {
    Object.entries(parsed.tagMap).forEach(([k, v]) => {
      if (!appState.tagMap[k]) {
        appState.tagMap[k] = v;
      } else {
        appState.tagMap[k].s = Math.max(appState.tagMap[k].s || 0, v.s || 0);
        appState.tagMap[k].w = Math.max(appState.tagMap[k].w || 0, v.w || 0);
      }
    });
  }

  if (parsed.editsMap && typeof parsed.editsMap === 'object') {
    Object.assign(appState.editsMap, parsed.editsMap);
  }

  if (Array.isArray(parsed.examHistory)) {
    const existingExamIds = new Set(appState.examHistory.map(e => e.id));
    parsed.examHistory.forEach(ex => {
      if (ex && ex.id && !existingExamIds.has(ex.id)) {
        appState.examHistory.push(ex);
        existingExamIds.add(ex.id);
      }
    });
  }

  if (Array.isArray(parsed.loadedFiles)) {
    parsed.loadedFiles.forEach(fn => {
      if (fn && !appState.loadedFiles.includes(fn)) {
        appState.loadedFiles.push(fn);
      }
    });
  }
  if (sourceLabel && !appState.loadedFiles.includes(sourceLabel)) {
    appState.loadedFiles.push(sourceLabel);
  }

  if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
    const existingById = new Map();
    appState.questions.forEach((q, idx) => existingById.set(q.id, idx));

    parsed.questions.forEach(q => {
      if (!q || !q.id) return;
      const savedEdit = appState.editsMap[q.id];
      if (savedEdit) {
        q.text = savedEdit.text || q.text;
        q.options = savedEdit.options || q.options;
        if (savedEdit.correct !== undefined) q.correct = savedEdit.correct;
        q.subject = savedEdit.subject || q.subject;
        if (savedEdit.explanation !== undefined) q.explanation = savedEdit.explanation;
        q.userNote = savedEdit.userNote || q.userNote || '';
      }
      if (existingById.has(q.id)) {
        appState.questions[existingById.get(q.id)] = q;
      } else {
        existingById.set(q.id, appState.questions.length);
        appState.questions.push(q);
      }
    });

    rebuildPapersAndRepetitions();
  } else {
    renderSubjectDashboard();
    updateDashboardStats();
    renderPermanentVaultList();
  }
}

function downloadTemplateExcel() {
  const wb = XLSX.utils.book_new();
  const sampleRowsPaper162 = [
    ['Q.No', 'Subject Tag', 'Question Statement', 'Option A', 'Option B', 'Option C', 'Option D', 'Answer'],
    [1, 'GK-1', 'Headquarters of the International Court of Justice (ICJ) is located in which city?', 'Geneva', 'The Hague', 'Vienna', 'New York', 'B'],
    [2, 'COM-1', 'Which shortcut key is used to insert a hyperlink in MS Word?', 'Ctrl + H', 'Ctrl + K', 'Ctrl + L', 'Ctrl + M', 'B'],
    [3, 'PKS-1', 'When was the Objective Resolution passed by the Constituent Assembly of Pakistan?', '12 March 1949', '14 August 1948', '23 March 1956', '8 June 1962', 'A']
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sampleRowsPaper162);
  XLSX.utils.book_append_sheet(wb, ws1, 'Paper 162');

  const sampleRowsPaper165 = [
    ['Q.No', 'Subject Tag', 'Question Statement', 'Option A', 'Option B', 'Option C', 'Option D', 'Answer'],
    [23, 'GK-4', 'Headquarters of the International Court of Justice (ICJ) is located in which city?', 'Geneva', 'The Hague', 'Vienna', 'New York', 'B'],
    [24, 'EDS-2', 'Which vitamin plays a vital role in blood clotting?', 'Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin K', 'D']
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(sampleRowsPaper165);
  XLSX.utils.book_append_sheet(wb, ws2, 'Paper 165');

  XLSX.writeFile(wb, 'PakPPSC_Format_Template.xlsx');
  showToast('Downloaded PakPPSC_Format_Template.xlsx');
}

/*************************************************************************
 * 12. UTILITY FUNCTIONS
 *************************************************************************/
function downloadJsonFile(obj, filename) {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsString(str) {
  return String(str ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}