lucide.createIcons();

function rebuildExerciseSelect() {
    exerciseSelect.innerHTML = '';
    exercises.forEach((_, idx) => {
        const ex = getLocalizedExercise(idx);
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = ex.title;
        exerciseSelect.appendChild(opt);
    });
    exerciseSelect.value = state.currentExercise;
}

function applyLanguage(lang) {
    currentLang = lang;
    const flags = { it: '🇮🇹', en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷', pt: '🇵🇹', ro: '🇷🇴', sq: '🇦🇱', uk: '🇺🇦', ru: '🇷🇺', ar: '🇸🇦', ur: '🇵🇰', hi: '🇮🇳', ne: '🇳🇵', bn: '🇧🇩', zh: '🇨🇳' };
    const langFlag = document.getElementById('current-lang-flag');
    if (langFlag) langFlag.textContent = flags[lang] || '🌐';
    const langBadge = document.getElementById('current-lang-badge');
    if (langBadge) langBadge.textContent = lang.toUpperCase();
    document.documentElement.lang = lang;
    const isRtl = (lang === 'ar' || lang === 'ur');
    ['welcome-screen', 'tab-exercise', 'guide-modal-body', 'vlearn-explanation', 'vclip-subtitle', 'settings-modal', 'console-output'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.dir = isRtl ? 'rtl' : 'ltr';
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        const active = btn.dataset.lang === lang;
        btn.classList.toggle('bg-zinc-900', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('border-zinc-900', active);
        btn.classList.toggle('font-bold', active);
        btn.classList.toggle('bg-white', !active);
        btn.classList.toggle('text-zinc-800', !active);
        btn.classList.toggle('border-stone-300', !active);
        btn.classList.toggle('font-semibold', !active);
    });

    document.getElementById('welcome-title').innerHTML = t('welcomeTitle');
    document.getElementById('btn-start-text').textContent = t('startBtn');
    document.getElementById('header-title').innerHTML = t('headerTitle');
    document.getElementById('header-subtitle').textContent = t('headerSubtitle');
    document.getElementById('lbl-view-phone').textContent = t('viewPhone');
    document.getElementById('lbl-learn-short').textContent = t('learnShort');
    document.getElementById('lbl-learn-full').textContent = t('learnFull');
    document.getElementById('lbl-code-btn').textContent = t('codeBtn');
    document.getElementById('lbl-go-write').textContent = t('goWrite');
    document.getElementById('lbl-hint-btn').textContent = t('hintBtn');
    document.getElementById('lbl-solution-btn').textContent = t('solutionBtn');
    document.getElementById('lbl-editor-header').innerHTML = t('editorHeader');
    document.getElementById('lbl-clear-btn').textContent = t('clearBtn');
    document.getElementById('lbl-enter-key').textContent = t('enterKey');
    codeEditor.placeholder = t('editorPlaceholder');
    document.getElementById('lbl-coach-colors').textContent = t('coachColors');
    document.getElementById('lbl-run-btn').textContent = t('runBtn');
    document.getElementById('lbl-verify-btn').textContent = t('verifyBtn');
    document.getElementById('lbl-grid-chk').textContent = t('gridChk');
    document.getElementById('btn-reset-view').textContent = t('resetView');
    document.getElementById('lbl-canvas-replay').textContent = t('canvasReplay');
    document.getElementById('nav-tab-1').textContent = t('navTab1');
    document.getElementById('nav-tab-2').textContent = t('navTab2');
    document.getElementById('nav-tab-3').textContent = t('navTab3');
    const settingsBtnLbl = document.getElementById('lbl-settings-btn');
if (settingsBtnLbl) settingsBtnLbl.textContent = (lang === 'it') ? 'Impostazioni' : (lang === 'ne') ? 'सेटिङहरू' : 'Settings';    document.getElementById('btn-apply-settings').textContent = t('applySettings');
    document.getElementById('lbl-settings-cmd').textContent = t('settingsCmd');
    document.getElementById('lbl-settings-colors').textContent = t('settingsColors');
    document.getElementById('lbl-settings-show-label').textContent = t('settingsShowLabel');
    document.getElementById('lbl-settings-offset').textContent = t('settingsOffset');
    document.getElementById('lbl-settings-speed').textContent = t('settingsSpeed');

    document.getElementById('guide-modal-title').textContent = t('guideModalTitle');
    document.getElementById('guide-modal-body').innerHTML = t('guideHtml');
    document.getElementById('btn-close-guide-bottom').textContent = t('guideModalClose');

    document.getElementById('vlearn-modal-title').textContent = t('vlearnModalTitle');
    document.getElementById('btn-close-visual-bottom').textContent = t('vlearnClose');
    document.getElementById('lbl-vmode-lab').textContent = t('vmodeLab');
    document.getElementById('lbl-vmode-video').textContent = t('vmodeVideo');
    document.getElementById('lbl-vlearn-replay').textContent = t('vlearnReplay');
    document.getElementById('btn-vclip-restart').textContent = t('restartClipBtn');

    const vtabs = t('vtabs');
    Object.keys(vtabs).forEach(k => {
        const el = document.getElementById(`vtab-${k}`);
        if (el) el.textContent = vtabs[k];
    });

    rebuildExerciseSelect();
    loadExercise(state.currentExercise);
    if (state.drawList.length === 0 && consoleOutput) {
        consoleOutput.innerHTML = `<span class="text-stone-500">${t('consoleReady')}</span>`;
    }
    if (!visualModal.classList.contains('hidden')) {
        selectVisualTopic(currentVTopic);
    }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
});

// ==========================================
// STATO APPLICAZIONE & RIFERIMENTI DOM
// ==========================================
const canvas = document.getElementById('geometry-canvas');
const ctx = canvas.getContext('2d');
const codeEditor = document.getElementById('code-editor');
const lineNumbers = document.getElementById('line-numbers');
const consoleOutput = document.getElementById('console-output');
const feedbackBox = document.getElementById('feedback-box');
const codeFeedbackBox = document.getElementById('code-feedback-box');
const exerciseSelect = document.getElementById('exercise-select');
const toolBanner = document.getElementById('tool-banner');
const toolStatusText = document.getElementById('tool-status-text');

// Popola il menu a discesa degli esercizi
exercises.forEach((ex, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = ex.title;
    exerciseSelect.appendChild(opt);
});

function getLineVarName(rawLine) {
    if (!rawLine) return null;
    const clean = rawLine.split('//')[0].trim();
    const eqIdx = clean.indexOf('=');
    if (eqIdx === -1) return null;
    const candidate = clean.slice(0, eqIdx).trim();
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(candidate) ? candidate : null;
}

function getEffectiveLineConfig(lineIdx, varName) {
    if (varName && state.namedSettings && state.namedSettings[varName]) {
        return state.namedSettings[varName];
    }
    return state.lineSettings[lineIdx] || null;
}

// Aggiorna i numeri di riga con l'ingranaggio Settings cliccabile accanto a ogni riga
function updateLineNumbers() {
    const lines = codeEditor.value.split('\n');
    const count = Math.max(1, lines.length);
    const isRainbowEx = exercises[state.currentExercise]?.badge === "Archi e stile";
    const rainbowTargets = ['a2', 'a3', 'a4', 'a5', 'a6', 'a7'];
    lineNumbers.innerHTML = Array.from({ length: count }, (_, i) => {
        const varName = getLineVarName(lines[i]);
        const cfg = getEffectiveLineConfig(i, varName);
        const dotColor = (cfg && cfg.color) ? cfg.color : '#52525B';
        const isTargetLine = varName ? rainbowTargets.includes(varName) : (i >= 2 && i <= 7);
        const shouldPulse = isRainbowEx && isTargetLine && !(cfg && cfg.color);
        return `<button type="button" data-settings-line="${i}" title="${t('lineWord')} ${i + 1}" class="line-gear-btn w-full h-7 flex items-center justify-end gap-1.5 px-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer">
            <span>${i + 1}</span>
            <span class="w-3.5 h-3.5 rounded-full border-2 border-zinc-400 shrink-0 ${shouldPulse ? 'color-dot-pulse' : ''}" style="background-color:${dotColor}"></span>
        </button>`;
    }).join('');

    lineNumbers.querySelectorAll('.line-gear-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            hideColorCoach();
            const idx = parseInt(btn.dataset.settingsLine, 10);
            openSettingsModal(idx);
        });
    });
}

const colorCoachOverlay = document.getElementById('color-coach-overlay');
function showColorCoachIfNeeded() {
    const ex = exercises[state.currentExercise];
    if (ex && ex.badge === "Archi e stile" && !state.hasShownColorCoach && colorCoachOverlay) {
        state.hasShownColorCoach = true;
        colorCoachOverlay.classList.remove('hidden');
        lucide.createIcons({ root: colorCoachOverlay });
    }
}
function hideColorCoach() {
    if (colorCoachOverlay) colorCoachOverlay.classList.add('hidden');
}
document.getElementById('btn-coach-try-now')?.addEventListener('click', () => {
    hideColorCoach();
    openSettingsModal(2);
});

codeEditor.addEventListener('input', updateLineNumbers);
codeEditor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codeEditor.scrollTop;
});

// Carica un esercizio selezionato
function loadExercise(index) {
    state.currentExercise = Math.max(0, Math.min(exercises.length - 1, index));
    exerciseSelect.value = state.currentExercise;
    const ex = getLocalizedExercise(state.currentExercise);

    state.lineSettings = {};
    state.namedSettings = {};
    if (exercises[state.currentExercise].badge === "Archi e stile") {
        // Imposta solo il primo arco (violetto) come esempio: gli altri 6 li sceglie l'alunno!
        state.lineSettings[1] = { color: '#9333EA' };
        state.namedSettings['a1'] = { color: '#9333EA' };
    }

    document.getElementById('ex-badge').textContent = ex.badge;
    document.getElementById('ex-progress-text').textContent = `${String(state.currentExercise + 1).padStart(2, '0')} / ${String(exercises.length).padStart(2, '0')}`;
    document.getElementById('ex-title').textContent = ex.title;
    document.getElementById('ex-desc').innerHTML = ex.desc;
    const editorDesc = document.getElementById('editor-ex-desc');
    if (editorDesc) editorDesc.innerHTML = ex.desc;

    feedbackBox.classList.add('hidden');
    if (codeFeedbackBox) codeFeedbackBox.classList.add('hidden');
    codeEditor.value = ex.starter || "";
    updateLineNumbers();
    executeCode(false);
    if (!isMobileLayout()) {
        showColorCoachIfNeeded();
    } else {
        switchMobileTab('tab-exercise');
    }
}
// Gestione schede mobile (1. Esercizio, 2. Codice, 3. Foglio)
const mobileTabBtns = document.querySelectorAll('.mobile-tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const leftCol = document.getElementById('left-col');

function switchMobileTab(tabId) {
    if (leftCol) {
        const hideLeft = tabId === 'tab-canvas';
        leftCol.classList.toggle('hidden', hideLeft);
        leftCol.classList.toggle('flex', !hideLeft);
        leftCol.classList.toggle('mobile-hidden-col', hideLeft);
    }

    mobileTabBtns.forEach(btn => {
        const isTarget = btn.dataset.tab === tabId;
        btn.classList.toggle('bg-zinc-900', isTarget);
        btn.classList.toggle('text-white', isTarget);
        btn.classList.toggle('font-bold', isTarget);
        btn.classList.toggle('text-stone-600', !isTarget);
        btn.classList.toggle('font-semibold', !isTarget);
    });

    tabPanels.forEach(panel => {
        const isTarget = panel.id === tabId;
        panel.classList.toggle('active-mobile-panel', isTarget);
        panel.classList.toggle('hidden', !isTarget);
        if (isTarget) {
            panel.classList.add('flex');
        } else {
            panel.classList.remove('flex');
        }
    });

    if (tabId === 'tab-canvas') {
        requestAnimationFrame(() => {
            resizeCanvas();
            render();
        });
    } else if (tabId === 'tab-editor') {
        showColorCoachIfNeeded();
    }
}

mobileTabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchMobileTab(btn.dataset.tab));
});

document.getElementById('btn-go-write').addEventListener('click', () => {
    switchMobileTab('tab-editor');
    setTimeout(() => codeEditor.focus(), 100);
});

// Tastierino rapido tattile
document.querySelectorAll('.quick-key').forEach(btn => {
    btn.addEventListener('click', () => {
        const insertText = btn.dataset.insert === '\\n' ? '\n' : btn.dataset.insert;
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        const val = codeEditor.value;
        codeEditor.value = val.slice(0, start) + insertText + val.slice(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + insertText.length;
        codeEditor.focus();
        updateLineNumbers();
    });
});

// Pulsanti navigazione esercizi, suggerimento e soluzione
exerciseSelect.addEventListener('change', (e) => loadExercise(parseInt(e.target.value, 10)));
document.getElementById('btn-prev-ex').addEventListener('click', () => loadExercise(state.currentExercise - 1));
document.getElementById('btn-next-ex').addEventListener('click', () => loadExercise(state.currentExercise + 1));

document.getElementById('btn-hint').addEventListener('click', () => {
    const ex = getLocalizedExercise(state.currentExercise);
    codeFeedbackBox.className = "p-2.5 rounded-xl text-xs sm:text-sm leading-relaxed border bg-amber-50 border-amber-300 text-amber-950";
    codeFeedbackBox.innerHTML = `<strong>${t('hintPrefix')}</strong> ${ex.hint}`;
    codeFeedbackBox.classList.remove('hidden');
});

document.getElementById('btn-solution').addEventListener('click', () => {
    const ex = getLocalizedExercise(state.currentExercise);
    codeEditor.value = ex.solution;
    if (exercises[state.currentExercise].badge === "Archi e stile") {
        const irisColors = ['#9333EA', '#4F46E5', '#2563EB', '#16A34A', '#EAB308', '#F97316', '#DC2626'];
        irisColors.forEach((hex, idx) => {
            const arcName = `a${idx + 1}`;
            state.lineSettings[idx + 1] = { ...(state.lineSettings[idx + 1] || {}), color: hex };
            state.namedSettings[arcName] = { ...(state.namedSettings[arcName] || {}), color: hex };
        });
        hideColorCoach();
    }
    updateLineNumbers();
    codeFeedbackBox.className = "p-2.5 rounded-xl text-xs sm:text-sm leading-relaxed border bg-stone-100 border-stone-300 text-zinc-900";
    codeFeedbackBox.innerHTML = `<div><strong>✓ ${t('solutionBtn')}</strong></div>`;
    codeFeedbackBox.classList.remove('hidden');
    executeCode(false);
});

document.getElementById('btn-clear').addEventListener('click', () => {
    codeEditor.value = "";
    updateLineNumbers();
    state.objects = {};
    state.drawList = [];
    render();
    consoleOutput.innerHTML = `<span class="text-stone-500">${t('consoleCleared')}</span>`;
});

function verifyCurrentExercise() {
            try {
                const { objs, drawList } = parseProgram(codeEditor.value);
                state.objects = objs;
                state.drawList = drawList;
                render();

                const ex = getLocalizedExercise(state.currentExercise);
                const res = ex.verify(objs);

                if (res.ok) {
                    launchCelebration();
                    const hasNext = state.currentExercise < exercises.length - 1;
                    feedbackBox.className = "mx-2.5 mb-2 p-4 rounded-2xl text-sm leading-relaxed border-2 bg-emerald-50 border-emerald-400 text-emerald-950 shadow-md z-10 shrink-0";
                    feedbackBox.innerHTML = `
                        <div class="font-display font-extrabold text-2xl sm:text-3xl text-emerald-700 tracking-tight flex items-center gap-2 mb-1">
                            <span>🎉 ${t('exactPrefix')}</span>
                        </div>
                        <div class="text-sm sm:text-base font-medium text-emerald-950">${res.msg}</div>
                        ${hasNext ? `
                            <button type="button" id="btn-feedback-next-ex" class="tactile-btn mt-3 w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer">
                                <span>${t('nextExBtn')}</span>
                                <i data-lucide="arrow-right" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                    `;
                    feedbackBox.classList.remove('hidden');
                    lucide.createIcons({ root: feedbackBox });
                    const nextBtn = document.getElementById('btn-feedback-next-ex');
                    if (nextBtn) {
nextBtn.addEventListener('click', () => { loadExercise(state.currentExercise + 1); switchMobileTab('tab-exercise'); });                    }
                    consoleOutput.innerHTML = `<span class="text-emerald-700 font-semibold">${t('consoleVerifyOk')}</span>`;
                } else {
                    feedbackBox.className = "mx-2.5 mb-2 p-3.5 rounded-xl text-sm leading-relaxed border bg-rose-50 border-rose-300 text-rose-950 shadow-sm z-10 shrink-0";
                    feedbackBox.innerHTML = `<strong>${t('almostPrefix')}</strong> ${res.msg}`;
                    feedbackBox.classList.remove('hidden');
                    consoleOutput.innerHTML = `<span class="text-rose-700 font-semibold">${t('consoleVerifyKo')}</span>`;
                }
            } catch (err) {
                feedbackBox.className = "mx-2.5 mb-2 p-3.5 rounded-xl text-sm leading-relaxed border bg-rose-50 border-rose-300 text-rose-950 shadow-sm z-10 shrink-0";
                feedbackBox.innerHTML = `<strong>⚠</strong> ${err.message}`;
                feedbackBox.classList.remove('hidden');
                consoleOutput.innerHTML = `<span class="text-rose-700 font-semibold">⚠ ${err.message}</span>`;
            }
        }

        // Pulsanti esecuzione e verifica
        document.getElementById('btn-run-animated').addEventListener('click', () => executeCode(true, true));
        document.getElementById('btn-verify').addEventListener('click', verifyCurrentExercise);
        document.getElementById('btn-canvas-replay').addEventListener('click', () => executeCode(true, false));

// ==========================================
// MODALE SETTINGS (PALETTE COLORI, LABEL, SPEED)
// ==========================================
const settingsModal = document.getElementById('settings-modal');
const settingsLineSelect = document.getElementById('settings-line-select');
const settingsPalette = document.getElementById('settings-palette');
let selectedSettingsLine = 0;

function populateSettingsForLine(lineIdx) {
    selectedSettingsLine = lineIdx;
    const lines = codeEditor.value.split('\n');
    const varName = getLineVarName(lines[lineIdx]);
    document.getElementById('settings-line-label').textContent = `${t('lineWord')} ${lineIdx + 1}${varName ? ` (${varName})` : ''}`;
    const cfg = getEffectiveLineConfig(lineIdx, varName) || {
        color: null,
        showLabel: true,
        labelOffsetX: 0,
        labelOffsetY: 0,
        speed: 1
    };

    document.getElementById('settings-show-label').checked = cfg.showLabel !== false;
    document.getElementById('settings-offset-x').value = cfg.labelOffsetX || 0;
    document.getElementById('settings-offset-y').value = cfg.labelOffsetY || 0;
    document.getElementById('settings-speed').value = cfg.speed || 1;
    document.getElementById('settings-speed-val').textContent = `${Number(cfg.speed || 1).toFixed(1)}x`;

    settingsPalette.innerHTML = '';
    ROBO_PALETTE.forEach(hex => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.backgroundColor = hex;
        btn.className = 'w-7 h-7 rounded-md border border-stone-300 flex items-center justify-center cursor-pointer transition hover:scale-105';
        if (cfg.color === hex) {
            btn.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-white drop-shadow"></i>';
        }
        btn.addEventListener('click', () => {
            const currentLines = codeEditor.value.split('\n');
            const vName = getLineVarName(currentLines[lineIdx]);
            state.lineSettings[lineIdx] = { ...(state.lineSettings[lineIdx] || {}), color: hex };
            if (vName) {
                state.namedSettings[vName] = { ...(state.namedSettings[vName] || {}), color: hex };
            }
            populateSettingsForLine(lineIdx);
            lucide.createIcons({ root: settingsPalette });
        });
        settingsPalette.appendChild(btn);
    });
    lucide.createIcons({ root: settingsPalette });
}

function openSettingsModal(forcedLineIdx = null) {
    const lines = codeEditor.value.split('\n');
    settingsLineSelect.innerHTML = '';
    let firstValid = 0;
    let foundValid = false;
    lines.forEach((raw, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${t('lineWord')} ${idx + 1}: ${raw.trim() || t('emptyLine')}`;
        settingsLineSelect.appendChild(opt);
        if (!foundValid && raw.trim()) {
            firstValid = idx;
            foundValid = true;
        }
    });
    // Se viene passata una riga specifica (es. clic sul pallino/ingranaggio di riga), usa quella
    const cursorLine = codeEditor.value.slice(0, codeEditor.selectionStart).split('\n').length - 1;
    const initialLine = (typeof forcedLineIdx === 'number')
        ? forcedLineIdx
        : (lines[cursorLine]?.trim() ? cursorLine : firstValid);
    settingsLineSelect.value = initialLine;
    populateSettingsForLine(initialLine);
    settingsModal.classList.remove('hidden');
}

settingsLineSelect.addEventListener('change', (e) => {
    populateSettingsForLine(parseInt(e.target.value, 10));
});
document.getElementById('settings-speed').addEventListener('input', (e) => {
    document.getElementById('settings-speed-val').textContent = `${Number(e.target.value).toFixed(1)}x`;
});
document.getElementById('btn-open-settings').addEventListener('click', () => openSettingsModal());
document.getElementById('btn-close-settings').addEventListener('click', () => settingsModal.classList.add('hidden'));
document.getElementById('btn-apply-settings').addEventListener('click', () => {
    const currentLines = codeEditor.value.split('\n');
    const vName = getLineVarName(currentLines[selectedSettingsLine]);
    const updatedCfg = {
        ...(getEffectiveLineConfig(selectedSettingsLine, vName) || {}),
        showLabel: document.getElementById('settings-show-label').checked,
        labelOffsetX: parseFloat(document.getElementById('settings-offset-x').value) || 0,
        labelOffsetY: parseFloat(document.getElementById('settings-offset-y').value) || 0,
        speed: parseFloat(document.getElementById('settings-speed').value) || 1
    };
    state.lineSettings[selectedSettingsLine] = updatedCfg;
    if (vName) {
        state.namedSettings[vName] = updatedCfg;
    }
    settingsModal.classList.add('hidden');
    updateLineNumbers();
    executeCode(false, false);
});

// ==========================================
// MODALE CODICE & GUIDA VISUALE INTERATTIVA
// ==========================================
const guideModal = document.getElementById('guide-modal');
document.getElementById('btn-open-guide').addEventListener('click', () => guideModal.classList.remove('hidden'));
document.getElementById('btn-close-guide').addEventListener('click', () => guideModal.classList.add('hidden'));
document.getElementById('btn-close-guide-bottom').addEventListener('click', () => guideModal.classList.add('hidden'));

// Anteprima PC / Telefono su desktop
const btnViewPc = document.getElementById('btn-view-pc');
const btnViewPhone = document.getElementById('btn-view-phone');

function setPreviewMode(mode) {
    const isPhone = mode === 'phone';
    document.body.classList.toggle('phone-preview-mode', isPhone);
    if (btnViewPc && btnViewPhone) {
        btnViewPc.classList.toggle('bg-zinc-900', !isPhone);
        btnViewPc.classList.toggle('text-white', !isPhone);
        btnViewPc.classList.toggle('text-stone-700', isPhone);
        btnViewPhone.classList.toggle('bg-zinc-900', isPhone);
        btnViewPhone.classList.toggle('text-white', isPhone);
        btnViewPhone.classList.toggle('text-stone-700', !isPhone);
    }
    if (!isPhone && leftCol) {
        leftCol.classList.remove('hidden', 'mobile-hidden-col');
        leftCol.classList.add('flex');
    }
    state.scale = getDefaultScale();
    state.offsetX = 0;
    state.offsetY = 0;
    requestAnimationFrame(() => {
        resizeCanvas();
        render();
    });
}

btnViewPc?.addEventListener('click', () => setPreviewMode('pc'));
btnViewPhone?.addEventListener('click', () => setPreviewMode('phone'));

// Avvio iniziale e ritorno alla pagina della lingua
const welcomeScreen = document.getElementById('welcome-screen');
const btnStartApp = document.getElementById('btn-start-app');
function openWelcomeScreen() {
    if (!welcomeScreen) return;
    welcomeScreen.classList.remove('hidden');
    requestAnimationFrame(() => {
        welcomeScreen.classList.remove('opacity-0', 'pointer-events-none');
    });
}
document.getElementById('btn-open-lang')?.addEventListener('click', openWelcomeScreen);
document.getElementById('btn-home-logo')?.addEventListener('click', openWelcomeScreen);

if (btnStartApp && welcomeScreen) {
    btnStartApp.addEventListener('click', () => {
        welcomeScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            welcomeScreen.classList.add('hidden');
            resizeCanvas();
            render();
        }, 280);
    });
}

window.addEventListener('resize', () => {
    resizeCanvas();
    render();
});

window.addEventListener('load', () => {
    setPreviewMode('pc');
    applyLanguage('it');
});
