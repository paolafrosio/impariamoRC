// ==========================================
// GESTIONE CANVAS, GRIGLIA E RENDERING
// ==========================================
const canvasWrapper = document.getElementById('canvas-wrapper');

function isMobileLayout() {
    return window.innerWidth < 1024 || document.body.classList.contains('phone-preview-mode');
}

function getDefaultScale() {
    return isMobileLayout() ? 28 : 38;
}

const state = {
    currentExercise: 0,
    scale: getDefaultScale(),
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    objects: {},
    drawList: [],
    animFrameId: null,
    isAnimating: false,
    lineSettings: {},
    namedSettings: {},
    hasShownColorCoach: false
};

function resizeCanvas() {
    const rect = canvasWrapper ? canvasWrapper.getBoundingClientRect() : canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(100, rect.width || window.innerWidth);
    const h = Math.max(100, rect.height || window.innerHeight * 0.65);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

if (typeof ResizeObserver !== 'undefined' && canvasWrapper) {
    const ro = new ResizeObserver(() => {
        resizeCanvas();
        render();
    });
    ro.observe(canvasWrapper);
}

function getOrigin() {
    const rect = canvasWrapper ? canvasWrapper.getBoundingClientRect() : canvas.getBoundingClientRect();
    const w = rect.width || canvas.width / (window.devicePixelRatio || 1);
    const h = rect.height || canvas.height / (window.devicePixelRatio || 1);
    return {
        ox: w / 2 + state.offsetX,
        oy: h / 2 + state.offsetY,
        w,
        h
    };
}

function toScreenX(x) {
    return getOrigin().ox + x * state.scale;
}

function toScreenY(y) {
    return getOrigin().oy - y * state.scale;
}

function toMathX(sx) {
    return (sx - getOrigin().ox) / state.scale;
}

function toMathY(sy) {
    return (getOrigin().oy - sy) / state.scale;
}

function drawGrid() {
    const { ox, oy, w, h } = getOrigin();
    const showGrid = document.getElementById('toggle-grid').checked;
    const s = state.scale;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    if (showGrid) {
        const startX = Math.floor(-ox / s);
        const endX = Math.ceil((w - ox) / s);
        const startY = Math.floor((oy - h) / s);
        const endY = Math.ceil(oy / s);

        ctx.lineWidth = 1;
        for (let gx = startX; gx <= endX; gx++) {
            if (gx === 0) continue;
            const sx = ox + gx * s;
            ctx.strokeStyle = gx % 5 === 0 ? '#E4E4E7' : '#F4F4F5';
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);
            ctx.stroke();
        }

        for (let gy = startY; gy <= endY; gy++) {
            if (gy === 0) continue;
            const sy = oy - gy * s;
            ctx.strokeStyle = gy % 5 === 0 ? '#E4E4E7' : '#F4F4F5';
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(w, sy);
            ctx.stroke();
        }
    }

    // Assi cartesiani principali
    ctx.strokeStyle = '#52525B';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(w, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, h);
    ctx.stroke();

    // Numeri sugli assi
    ctx.fillStyle = '#71717A';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const step = s < 24 ? 2 : 1;
    const minX = Math.floor(-ox / s);
    const maxX = Math.ceil((w - ox) / s);
    for (let gx = minX; gx <= maxX; gx += step) {
        if (gx === 0) continue;
        const sx = ox + gx * s;
        if (sx > 14 && sx < w - 14) {
            ctx.fillText(String(gx), sx, Math.min(Math.max(oy + 5, 4), h - 16));
        }
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const minY = Math.floor((oy - h) / s);
    const maxY = Math.ceil(oy / s);
    for (let gy = minY; gy <= maxY; gy += step) {
        if (gy === 0) continue;
        const sy = oy - gy * s;
        if (sy > 14 && sy < h - 14) {
            ctx.fillText(String(gy), Math.min(Math.max(ox - 6, 22), w - 6), sy);
        }
    }

    // Origine (0,0)
    ctx.fillText('0', Math.min(Math.max(ox - 6, 16), w - 6), Math.min(Math.max(oy + 11, 12), h - 10));
}

function drawGeometricObject(obj, progress = 1) {
    ctx.save();
    const activeColor = obj.customColor || null;
    const sw = obj.strokeWidth || null;

    if (obj.type === 'point') {
        const sx = toScreenX(obj.x);
        const sy = toScreenY(obj.y);
        const baseR = sw ? Math.max(3, sw * 1.4) : 5;
        const r = baseR * Math.min(1, progress * 1.4);
        ctx.fillStyle = activeColor || '#EA580C';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#18181B';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const showLbl = obj.showLabel !== false;
        if (obj.name && showLbl && progress >= 0.6) {
            const offX = (obj.labelOffsetX || 0) * 16;
            const offY = (obj.labelOffsetY || 0) * 16;
            ctx.fillStyle = activeColor || '#18181B';
            ctx.font = '700 13px "Space Grotesk", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            const labelText = `${obj.name}(${Number(obj.x.toFixed(1))}, ${Number(obj.y.toFixed(1))})`;
            const textW = ctx.measureText(labelText).width;
            const { w: canvasW } = getOrigin();
            let drawX = sx + 8 + offX;
            let drawY = sy - 6 - offY;
            if (drawX + textW > canvasW - 6) drawX = sx - 8 - textW + offX;
            if (drawY < 16) drawY = sy + 18 - offY;
            ctx.fillText(labelText, drawX, drawY);
        }
    } else if (obj.type === 'line') {
        const sx1 = toScreenX(obj.x1);
        const sy1 = toScreenY(obj.y1);
        const sx2 = toScreenX(obj.x1 + (obj.x2 - obj.x1) * progress);
        const sy2 = toScreenY(obj.y1 + (obj.y2 - obj.y1) * progress);

        ctx.strokeStyle = activeColor || '#18181B';
        ctx.lineWidth = sw || 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();

        // Righello virtuale durante l'animazione
        if (progress < 1) {
            ctx.fillStyle = '#EA580C';
            ctx.beginPath();
            ctx.arc(sx2, sy2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (obj.type === 'arc') {
        const scx = toScreenX(obj.cx);
        const scy = toScreenY(obj.cy);
        const sr = obj.r * state.scale;
        const startRad = (-obj.startDeg * Math.PI) / 180;
        const currentSweep = obj.sweep * progress;
        const endRad = (-(obj.startDeg + currentSweep) * Math.PI) / 180;
        const strokeCol = activeColor || '#2563EB';

        const isFullCircle = Math.abs(currentSweep) >= 359.99;

        if (obj.fillOpacity && obj.fillOpacity > 0 && progress >= 0.98) {
            ctx.save();
            ctx.globalAlpha = obj.fillOpacity;
            ctx.fillStyle = strokeCol;
            ctx.beginPath();
            if (Math.abs(obj.sweep) < 359.99) ctx.moveTo(scx, scy);
            if (isFullCircle) {
                ctx.arc(scx, scy, sr, 0, Math.PI * 2, false);
            } else {
                ctx.arc(scx, scy, sr, startRad, endRad, currentSweep >= 0);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = sw || 2.2;
        ctx.beginPath();
        if (isFullCircle) {
            ctx.arc(scx, scy, sr, 0, Math.PI * 2, false);
        } else {
            ctx.arc(scx, scy, sr, startRad, endRad, currentSweep >= 0);
        }
        ctx.stroke();

        // Compasso virtuale durante l'animazione
        if (progress < 1) {
            const px = scx + sr * Math.cos(endRad);
            const py = scy + sr * Math.sin(endRad);
            ctx.strokeStyle = 'rgba(234, 88, 12, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(scx, scy);
            ctx.lineTo(px, py);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#EA580C';
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (obj.type === 'polygon' && obj.points.length >= 3) {
        const strokeCol = activeColor || '#18181B';
        ctx.save();
        ctx.globalAlpha = typeof obj.fillOpacity === 'number' ? obj.fillOpacity : 0.14;
        ctx.fillStyle = activeColor || '#EA580C';
        ctx.beginPath();
        obj.points.forEach((p, idx) => {
            const sx = toScreenX(p.x);
            const sy = toScreenY(p.y);
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = sw || 2.2;
        ctx.beginPath();
        obj.points.forEach((p, idx) => {
            const sx = toScreenX(p.x);
            const sy = toScreenY(p.y);
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        });
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
}

function render(animStepIndex = -1, animStepProgress = 1) {
    drawGrid();
    if (animStepIndex === -1) {
        state.drawList.forEach(obj => drawGeometricObject(obj, 1));
    } else {
        for (let i = 0; i < animStepIndex; i++) {
            drawGeometricObject(state.drawList[i], 1);
        }
        if (state.drawList[animStepIndex]) {
            drawGeometricObject(state.drawList[animStepIndex], animStepProgress);
        }
    }
}

function executeCode(animated = true, autoSwitchMobile = false) {
    if (state.animFrameId) {
        cancelAnimationFrame(state.animFrameId);
        state.animFrameId = null;
    }
    state.isAnimating = false;
    toolBanner.classList.add('hidden');

    try {
        const { objs, drawList } = parseProgram(codeEditor.value);
        state.objects = objs;
        state.drawList = drawList;

        consoleOutput.innerHTML = `<span class="text-emerald-700 font-semibold">${t('consoleOk')(drawList.length)}</span>`;

        if (autoSwitchMobile && isMobileLayout()) {
            switchMobileTab('tab-canvas');
        }

        if (!animated || drawList.length === 0) {
            render();
            return;
        }

        // Animazione passo-passo
        state.isAnimating = true;
        toolBanner.classList.remove('hidden');
        let currentStep = 0;
        let startTime = null;

        function animateStep(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const currentObj = state.drawList[currentStep];
            const speedMult = (currentObj && currentObj.speed) ? currentObj.speed : 1;
            const stepDuration = 650 / speedMult;
            const progress = Math.min(1, elapsed / stepDuration);

            if (currentObj) {
                const label = currentObj.name ? ` (${currentObj.name})` : '';
                const typeLabel = currentObj.type === 'point' ? t('animPoint') : currentObj.type === 'line' ? t('animLine') : t('animArc');
                toolStatusText.textContent = `${typeLabel}${label}...`;
            }

            render(currentStep, progress);

            if (progress < 1) {
                state.animFrameId = requestAnimationFrame(animateStep);
            } else {
                currentStep++;
                startTime = null;
                if (currentStep < state.drawList.length) {
                    state.animFrameId = requestAnimationFrame(animateStep);
                } else {
                    state.isAnimating = false;
                    toolBanner.classList.add('hidden');
                    render();
                }
            }
        }

        state.animFrameId = requestAnimationFrame(animateStep);
    } catch (err) {
        consoleOutput.innerHTML = `<span class="text-rose-700 font-semibold">⚠ ${err.message}</span>`;
    }
}

function launchCelebration() {
    const existing = document.getElementById('celebration-canvas');
    if (existing) existing.remove();

    const celebCanvas = document.createElement('canvas');
    celebCanvas.id = 'celebration-canvas';
    celebCanvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
    document.body.appendChild(celebCanvas);
    const cctx = celebCanvas.getContext('2d');
    celebCanvas.width = window.innerWidth;
    celebCanvas.height = window.innerHeight;

    const colors = ['#EA580C', '#16A34A', '#2563EB', '#EAB308', '#DB2777', '#9333EA', '#10B981', '#F59E0B'];
    const particles = [];

    // Fuochi d'artificio + coriandoli in più esplosioni
    const bursts = [
        { x: celebCanvas.width * 0.25, y: celebCanvas.height * 0.36, count: 48 },
        { x: celebCanvas.width * 0.50, y: celebCanvas.height * 0.28, count: 60 },
        { x: celebCanvas.width * 0.75, y: celebCanvas.height * 0.36, count: 48 }
    ];

    bursts.forEach((b, bIdx) => {
        for (let i = 0; i < b.count; i++) {
            const angle = (Math.PI * 2 * i) / b.count + (Math.random() - 0.5) * 0.22;
            const speed = 2.8 + Math.random() * 6.5;
            particles.push({
                x: b.x,
                y: b.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.6,
                size: 5 + Math.random() * 6,
                color: colors[(i + bIdx) % colors.length],
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 14,
                alpha: 1,
                delay: bIdx * 6,
                shape: i % 3 // 0: cerchio/scintilla, 1: coriandolo rettangolare, 2: stella/rombo
            });
        }
    });

    let tick = 0;
    function frame() {
        tick++;
        cctx.clearRect(0, 0, celebCanvas.width, celebCanvas.height);
        let alive = false;

        for (const p of particles) {
            if (tick < p.delay) {
                alive = true;
                continue;
            }
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.13; // gravità
            p.vx *= 0.985;
            p.rotation += p.vRot;
            p.alpha -= 0.012;

            if (p.alpha > 0) {
                alive = true;
                cctx.save();
                cctx.globalAlpha = Math.max(0, p.alpha);
                cctx.translate(p.x, p.y);
                cctx.rotate((p.rotation * Math.PI) / 180);
                cctx.fillStyle = p.color;

                if (p.shape === 0) {
                    cctx.beginPath();
                    cctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
                    cctx.fill();
                } else if (p.shape === 1) {
                    cctx.fillRect(-p.size * 0.6, -p.size * 0.35, p.size * 1.2, p.size * 0.7);
                } else {
                    cctx.beginPath();
                    cctx.moveTo(0, -p.size * 0.7);
                    cctx.lineTo(p.size * 0.55, 0);
                    cctx.lineTo(0, p.size * 0.7);
                    cctx.lineTo(-p.size * 0.55, 0);
                    cctx.closePath();
                    cctx.fill();
                }
                cctx.restore();
            }
        }

        if (alive) {
            requestAnimationFrame(frame);
        } else {
            celebCanvas.remove();
        }
    }

    requestAnimationFrame(frame);
}

// Controlli foglio: Griglia, Zoom, Centra e Trascinamento (Mouse & Touch)
document.getElementById('toggle-grid').addEventListener('change', () => render());
document.getElementById('btn-zoom-in').addEventListener('click', () => {
    state.scale = Math.min(90, state.scale + 6);
    render();
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
    state.scale = Math.max(14, state.scale - 6);
    render();
});
document.getElementById('btn-reset-view').addEventListener('click', () => {
    state.scale = getDefaultScale();
    state.offsetX = 0;
    state.offsetY = 0;
    render();
});

function updateMouseCoords(clientX, clientY) {
    const coordsEl = document.getElementById('mouse-coords');
    if (!coordsEl) return;
    const rect = canvas.getBoundingClientRect();
    const mx = Math.round(toMathX(clientX - rect.left) * 10) / 10;
    const my = Math.round(toMathY(clientY - rect.top) * 10) / 10;
    coordsEl.textContent = `x: ${mx}, y: ${my}`;
}

canvas.addEventListener('mousedown', (e) => {
    state.isDragging = true;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
    if (state.isDragging) {
        state.offsetX += e.clientX - state.lastMouseX;
        state.offsetY += e.clientY - state.lastMouseY;
        state.lastMouseX = e.clientX;
        state.lastMouseY = e.clientY;
        render();
    }
    if (e.target === canvas) updateMouseCoords(e.clientX, e.clientY);
});

window.addEventListener('mouseup', () => {
    state.isDragging = false;
});

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        state.isDragging = true;
        state.lastMouseX = e.touches[0].clientX;
        state.lastMouseY = e.touches[0].clientY;
        updateMouseCoords(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    if (state.isDragging && e.touches.length === 1) {
        const tx = e.touches[0].clientX;
        const ty = e.touches[0].clientY;
        state.offsetX += tx - state.lastMouseX;
        state.offsetY += ty - state.lastMouseY;
        state.lastMouseX = tx;
        state.lastMouseY = ty;
        updateMouseCoords(tx, ty);
        render();
    }
}, { passive: true });

canvas.addEventListener('touchend', () => {
    state.isDragging = false;
});
