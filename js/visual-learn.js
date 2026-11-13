const visualModal = document.getElementById('visual-learn-modal');
const vCanvas = document.getElementById('visual-learn-canvas');
const vCtx = vCanvas.getContext('2d');
let currentVTopic = 'point';
let vState = { x: 3, y: 2, radius: 3, startDeg: 0, sweep: 120, arcMode: 'radius', ratio: 0.5, lineLen: 6, parPx: -1, parPy: 2, perpPx: 0, perpPy: 0, strokeWidth: 4, fillOpacity: 0.35, colorHex: '#2563EB', progress: 1 };
let vAnimId = null;

function resizeVisualCanvas() {
    const rect = vCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    vCanvas.width = (rect.width || 460) * dpr;
    vCanvas.height = (rect.height || 240) * dpr;
    vCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawCurvedArrow(ctx2d, cx, cy, r, startRad, endRad, ccw, color) {
    if (Math.abs(endRad - startRad) < 0.08) return;
    ctx2d.save();
    ctx2d.strokeStyle = color;
    ctx2d.fillStyle = color;
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, r, startRad, endRad, ccw);
    ctx2d.stroke();

    // Punta della freccia lungo la tangente dell'arco
    const tipX = cx + r * Math.cos(endRad);
    const tipY = cy + r * Math.sin(endRad);
    const tangentAngle = endRad + (ccw ? -Math.PI / 2 : Math.PI / 2);
    const headLen = 7;
    ctx2d.beginPath();
    ctx2d.moveTo(tipX, tipY);
    ctx2d.lineTo(tipX - headLen * Math.cos(tangentAngle - 0.45), tipY - headLen * Math.sin(tangentAngle - 0.45));
    ctx2d.lineTo(tipX - headLen * Math.cos(tangentAngle + 0.45), tipY - headLen * Math.sin(tangentAngle + 0.45));
    ctx2d.closePath();
    ctx2d.fill();
    ctx2d.restore();
}

function renderVisualTopic() {
    const rect = vCanvas.getBoundingClientRect();
    const w = rect.width || 460;
    const h = rect.height || 240;
    const scale = 28;
    const ox = w / 2;
    const oy = h / 2 + 12;

    vCtx.clearRect(0, 0, w, h);
    vCtx.fillStyle = '#FFFFFF';
    vCtx.fillRect(0, 0, w, h);

    // Griglia cartesiana numerata
    vCtx.lineWidth = 1;
    for (let gx = -8; gx <= 8; gx++) {
        const sx = ox + gx * scale;
        vCtx.strokeStyle = gx === 0 ? '#52525B' : '#F4F4F5';
        vCtx.lineWidth = gx === 0 ? 1.5 : 1;
        vCtx.beginPath();
        vCtx.moveTo(sx, 0);
        vCtx.lineTo(sx, h);
        vCtx.stroke();
        if (gx !== 0 && Math.abs(gx) <= 6) {
            vCtx.fillStyle = '#71717A';
            vCtx.font = '600 10px "JetBrains Mono", monospace';
            vCtx.textAlign = 'center';
            vCtx.fillText(String(gx), sx, oy + 12);
        }
    }
    for (let gy = -4; gy <= 4; gy++) {
        const sy = oy - gy * scale;
        vCtx.strokeStyle = gy === 0 ? '#52525B' : '#F4F4F5';
        vCtx.lineWidth = gy === 0 ? 1.5 : 1;
        vCtx.beginPath();
        vCtx.moveTo(0, sy);
        vCtx.lineTo(w, sy);
        vCtx.stroke();
        if (gy !== 0 && Math.abs(gy) <= 3) {
            vCtx.fillStyle = '#71717A';
            vCtx.font = '600 10px "JetBrains Mono", monospace';
            vCtx.textAlign = 'right';
            vCtx.fillText(String(gy), ox - 5, sy + 3);
        }
    }
    vCtx.fillStyle = '#71717A';
    vCtx.font = '600 10px "JetBrains Mono", monospace';
    vCtx.textAlign = 'right';
    vCtx.fillText('0', ox - 5, oy + 12);

    const p = vState.progress;
    if (currentVTopic === 'point') {
        const tx = ox + vState.x * scale;
        const ty = oy - vState.y * scale;
        const phase1 = Math.min(1, p * 2);
        const phase2 = p <= 0.5 ? 0 : (p - 0.5) * 2;
        const curX = ox + (tx - ox) * phase1;
        const curY = oy + (ty - oy) * phase2;

        // Freccia orizzontale (x)
        vCtx.strokeStyle = '#2563EB';
        vCtx.lineWidth = 2.5;
        vCtx.beginPath();
        vCtx.moveTo(ox, oy);
        vCtx.lineTo(curX, oy);
        vCtx.stroke();
        if (phase1 > 0.1 && vState.x !== 0) {
            vCtx.fillStyle = '#2563EB';
            vCtx.font = '700 11px "Plus Jakarta Sans", sans-serif';
            vCtx.textAlign = 'center';
            vCtx.fillText(`x = ${vState.x}`, (ox + curX) / 2, oy + (vState.y >= 0 ? 22 : -8));
        }

        // Freccia verticale (y)
        if (phase2 > 0) {
            vCtx.strokeStyle = '#16A34A';
            vCtx.lineWidth = 2.5;
            vCtx.setLineDash([4, 3]);
            vCtx.beginPath();
            vCtx.moveTo(tx, oy);
            vCtx.lineTo(tx, curY);
            vCtx.stroke();
            vCtx.setLineDash([]);
            if (vState.y !== 0) {
                vCtx.fillStyle = '#16A34A';
                vCtx.font = '700 11px "Plus Jakarta Sans", sans-serif';
                vCtx.textAlign = vState.x >= 0 ? 'left' : 'right';
                vCtx.fillText(`y = ${vState.y}`, tx + (vState.x >= 0 ? 8 : -8), (oy + curY) / 2);
            }
        }

        // Punto finale A (luminoso e trascinabile)
        const pulsePt = 0.5 + 0.5 * Math.sin(Date.now() / 220);
        vCtx.fillStyle = `rgba(234, 88, 12, ${0.22 + 0.25 * pulsePt})`;
        vCtx.beginPath();
        vCtx.arc(curX, curY, 12 + 4 * pulsePt, 0, Math.PI * 2);
        vCtx.fill();

        vCtx.fillStyle = '#EA580C';
        vCtx.beginPath();
        vCtx.arc(curX, curY, 6.5, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.strokeStyle = '#FFFFFF';
        vCtx.lineWidth = 2;
        vCtx.stroke();

        vCtx.fillStyle = '#18181B';
        vCtx.font = '700 13px "Space Grotesk", sans-serif';
        vCtx.textAlign = 'left';
        vCtx.fillText(`A(${vState.x}, ${vState.y})`, curX + 10, curY - 10);
    } else if (currentVTopic === 'line') {
        const ax = ox - 3 * scale, ay = oy + 1 * scale;
        const bx = ox + 3 * scale, by = oy - 2 * scale;
        const cx = ax + (bx - ax) * p;
        const cy = ay + (by - ay) * p;

        // Righello semitrasparente lungo AB
        const angle = Math.atan2(by - ay, bx - ax);
        vCtx.save();
        vCtx.translate(ax, ay);
        vCtx.rotate(angle);
        const len = Math.hypot(bx - ax, by - ay);
        vCtx.fillStyle = 'rgba(251, 191, 36, 0.22)';
        vCtx.strokeStyle = 'rgba(217, 119, 6, 0.65)';
        vCtx.lineWidth = 1;
        vCtx.fillRect(-10, 4, len + 20, 16);
        vCtx.strokeRect(-10, 4, len + 20, 16);
        for (let t = 0; t <= len; t += 14) {
            vCtx.beginPath();
            vCtx.moveTo(t, 4);
            vCtx.lineTo(t, 10);
            vCtx.stroke();
        }
        vCtx.restore();

        // Segmento tracciato
        vCtx.strokeStyle = '#18181B';
        vCtx.lineWidth = 3;
        vCtx.lineCap = 'round';
        vCtx.beginPath();
        vCtx.moveTo(ax, ay);
        vCtx.lineTo(cx, cy);
        vCtx.stroke();

        // Punta matita
        if (p < 1) {
            vCtx.fillStyle = '#EA580C';
            vCtx.beginPath();
            vCtx.arc(cx, cy, 4.5, 0, Math.PI * 2);
            vCtx.fill();
        }

        [ { x: ax, y: ay, l: 'A(-3, -1)' }, { x: bx, y: by, l: 'B(3, 2)' } ].forEach(pt => {
            vCtx.fillStyle = '#EA580C';
            vCtx.beginPath();
            vCtx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2);
            vCtx.fill();
            vCtx.strokeStyle = '#18181B';
            vCtx.lineWidth = 1.5;
            vCtx.stroke();
            vCtx.fillStyle = '#18181B';
            vCtx.font = '700 12px "Space Grotesk", sans-serif';
            vCtx.textAlign = 'center';
            vCtx.fillText(pt.l, pt.x, pt.y - 10);
        });
    } else if (currentVTopic === 'arc') {
        const rPx = vState.radius * scale;
        const startRad = -(vState.startDeg * Math.PI) / 180;
        const currentSweep = vState.sweep * p;
        const endRad = -((vState.startDeg + currentSweep) * Math.PI) / 180;
        const fullEndRad = -((vState.startDeg + vState.sweep) * Math.PI) / 180;

        // Riferimenti angolari 0°, 90°, 180°
        vCtx.fillStyle = '#71717A';
        vCtx.font = '600 10px "JetBrains Mono", monospace';
        vCtx.textAlign = 'left';
        vCtx.fillText('0°', ox + rPx + 12, oy + 3);
        vCtx.textAlign = 'center';
        vCtx.fillText('90°', ox, oy - rPx - 10);
        vCtx.textAlign = 'right';
        vCtx.fillText('180°', ox - rPx - 12, oy + 3);

        // Raggio iniziale (verde) e raggio finale (arancione)
        const sx = ox + rPx * Math.cos(startRad);
        const sy = oy + rPx * Math.sin(startRad);
        const ex = ox + rPx * Math.cos(endRad);
        const ey = oy + rPx * Math.sin(endRad);

        vCtx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
        vCtx.lineWidth = 1.6;
        vCtx.setLineDash([4, 4]);
        vCtx.beginPath();
        vCtx.moveTo(ox, oy);
        vCtx.lineTo(sx, sy);
        vCtx.stroke();

        vCtx.strokeStyle = 'rgba(249, 115, 22, 0.75)';
        vCtx.beginPath();
        vCtx.moveTo(ox, oy);
        vCtx.lineTo(ex, ey);
        vCtx.stroke();
        vCtx.setLineDash([]);

        // Settore angolare leggero
        vCtx.save();
        vCtx.globalAlpha = 0.1;
        vCtx.fillStyle = '#2563EB';
        vCtx.beginPath();
        vCtx.moveTo(ox, oy);
        vCtx.arc(ox, oy, rPx, startRad, endRad, currentSweep >= 0);
        vCtx.closePath();
        vCtx.fill();
        vCtx.restore();

        // Arco principale
        vCtx.strokeStyle = '#2563EB';
        vCtx.lineWidth = 3.2;
        vCtx.beginPath();
        vCtx.arc(ox, oy, rPx, startRad, endRad, currentSweep >= 0);
        vCtx.stroke();

        // Freccia rossa curvilinea interna che mostra verso e apertura
        const arrowR = Math.max(22, rPx * 0.45);
        drawCurvedArrow(vCtx, ox, oy, arrowR, startRad, endRad, currentSweep >= 0, '#DC2626');

        // Centro O
        vCtx.fillStyle = '#18181B';
        vCtx.beginPath();
        vCtx.arc(ox, oy, 4.5, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.font = '700 12px "Space Grotesk", sans-serif';
        vCtx.textAlign = 'right';
        vCtx.fillText('O', ox - 7, oy + 14);

        // Alone luminoso pulsante sui due punti interattivi (inizio verde, fine arancione)
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 220);
        const fullEx = ox + rPx * Math.cos(fullEndRad);
        const fullEy = oy + rPx * Math.sin(fullEndRad);

        // Punto di inizio (verde)
        vCtx.fillStyle = `rgba(16, 185, 129, ${0.22 + 0.25 * pulse})`;
        vCtx.beginPath();
        vCtx.arc(sx, sy, 11 + 4 * pulse, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.fillStyle = '#10B981';
        vCtx.beginPath();
        vCtx.arc(sx, sy, 6.5, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.strokeStyle = '#FFFFFF';
        vCtx.lineWidth = 2;
        vCtx.stroke();

        // Punto di fine / apertura (arancione)
        vCtx.fillStyle = `rgba(249, 115, 22, ${0.22 + 0.25 * pulse})`;
        vCtx.beginPath();
        vCtx.arc(fullEx, fullEy, 11 + 4 * pulse, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.fillStyle = '#F97316';
        vCtx.beginPath();
        vCtx.arc(fullEx, fullEy, 6.5, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.strokeStyle = '#FFFFFF';
        vCtx.lineWidth = 2;
        vCtx.stroke();
    } else if (currentVTopic === 'interpolate') {
        const ax = ox - 4 * scale, ay = oy + 1 * scale;
        const bx = ox + 4 * scale, by = oy - 1 * scale;
        const tCur = vState.ratio * p;
        const mx = ax + (bx - ax) * tCur;
        const my = ay + (by - ay) * tCur;

        // Segmento completo AB
        vCtx.strokeStyle = '#A1A1AA';
        vCtx.lineWidth = 2;
        vCtx.beginPath();
        vCtx.moveTo(ax, ay);
        vCtx.lineTo(bx, by);
        vCtx.stroke();

        // Tratto percorso dalla frazione
        vCtx.strokeStyle = '#16A34A';
        vCtx.lineWidth = 3.5;
        vCtx.beginPath();
        vCtx.moveTo(ax, ay);
        vCtx.lineTo(mx, my);
        vCtx.stroke();

        [ { x: ax, y: ay, l: 'A' }, { x: bx, y: by, l: 'B' } ].forEach(pt => {
            vCtx.fillStyle = '#18181B';
            vCtx.beginPath();
            vCtx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
            vCtx.fill();
            vCtx.font = '700 12px "Space Grotesk", sans-serif';
            vCtx.textAlign = 'center';
            vCtx.fillText(pt.l, pt.x, pt.y + 16);
        });

        // Punto medio M (luminoso e trascinabile)
        const pulseMid = 0.5 + 0.5 * Math.sin(Date.now() / 220);
        vCtx.fillStyle = `rgba(22, 163, 74, ${0.22 + 0.25 * pulseMid})`;
        vCtx.beginPath();
        vCtx.arc(mx, my, 12 + 4 * pulseMid, 0, Math.PI * 2);
        vCtx.fill();

        vCtx.fillStyle = '#16A34A';
        vCtx.beginPath();
        vCtx.arc(mx, my, 6.5, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.strokeStyle = '#FFFFFF';
        vCtx.lineWidth = 2;
        vCtx.stroke();

        vCtx.fillStyle = '#18181B';
        vCtx.font = '700 13px "Space Grotesk", sans-serif';
        vCtx.textAlign = 'center';
        vCtx.fillText(`M (${Math.round(vState.ratio * 100)}%)`, mx, my - 13);
    } else if (currentVTopic === 'parallel') {
        const ax = ox - 4 * scale, ay = oy + 1.5 * scale;
        const bx = ox + 3 * scale, by = oy - 1 * scale;
        const px = ox + vState.parPx * scale;
        const py = oy - vState.parPy * scale;
        const dx = bx - ax, dy = by - ay;
        const len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        const half = (vState.lineLen * scale * p) / 2;

        // Retta di riferimento s1
        vCtx.strokeStyle = '#52525B';
        vCtx.lineWidth = 2.4;
        vCtx.beginPath();
        vCtx.moveTo(ax, ay);
        vCtx.lineTo(bx, by);
        vCtx.stroke();
        vCtx.fillStyle = '#52525B';
        vCtx.font = '700 11px "Space Grotesk", sans-serif';
        vCtx.fillText('s1', bx + 8, by + 4);

        // Retta parallela r1 passante per P
        vCtx.strokeStyle = '#2563EB';
        vCtx.lineWidth = 3;
        vCtx.beginPath();
        vCtx.moveTo(px - ux * half, py - uy * half);
        vCtx.lineTo(px + ux * half, py + uy * half);
        vCtx.stroke();

        // Punto luminoso P trascinabile
        const pulseP = 0.5 + 0.5 * Math.sin(Date.now() / 220);
        vCtx.fillStyle = `rgba(234, 88, 12, ${0.22 + 0.25 * pulseP})`;
        vCtx.beginPath();
        vCtx.arc(px, py, 12 + 4 * pulseP, 0, Math.PI * 2);
        vCtx.fill();

        vCtx.fillStyle = '#EA580C';
        vCtx.beginPath();
        vCtx.arc(px, py, 6.5, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.strokeStyle = '#FFFFFF';
        vCtx.lineWidth = 2;
        vCtx.stroke();

        vCtx.fillStyle = '#18181B';
        vCtx.font = '700 13px "Space Grotesk", sans-serif';
        vCtx.textAlign = 'left';
        vCtx.fillText(`P(${vState.parPx}, ${vState.parPy})`, px + 10, py - 10);
    } else if (currentVTopic === 'perp') {
        const ax = ox - 4 * scale, ay = oy + 1 * scale;
        const bx = ox + 4 * scale, by = oy - 1 * scale;
        const px = ox + vState.perpPx * scale;
        const py = oy - vState.perpPy * scale;
        const dx = bx - ax, dy = by - ay;
        const len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        const nx = -uy, ny = ux;
        const half = (vState.lineLen * scale * p) / 2;

        // Retta di riferimento s1
        vCtx.strokeStyle = '#52525B';
        vCtx.lineWidth = 2.4;
        vCtx.beginPath();
        vCtx.moveTo(ax, ay);
        vCtx.lineTo(bx, by);
        vCtx.stroke();
        vCtx.fillStyle = '#52525B';
        vCtx.font = '700 11px "Space Grotesk", sans-serif';
        vCtx.fillText('s1', bx + 8, by + 4);

        // Retta perpendicolare p1 passante per P
        vCtx.strokeStyle = '#16A34A';
        vCtx.lineWidth = 3;
        vCtx.beginPath();
        vCtx.moveTo(px - nx * half, py - ny * half);
        vCtx.lineTo(px + nx * half, py + ny * half);
        vCtx.stroke();

        // Proiezione su s1 per disegnare il quadratino dell'angolo retto a 90°
        const projT = ((px - ax) * ux + (py - ay) * uy);
        const footX = ax + projT * ux;
        const footY = ay + projT * uy;
        if (Math.hypot(px - footX, py - footY) > 6) {
            vCtx.strokeStyle = '#A1A1AA';
            vCtx.lineWidth = 1.2;
            vCtx.setLineDash([3, 3]);
            vCtx.beginPath();
            vCtx.moveTo(px, py);
            vCtx.lineTo(footX, footY);
            vCtx.stroke();
            vCtx.setLineDash([]);
        }

        const sq = 11;
        vCtx.strokeStyle = '#DC2626';
        vCtx.lineWidth = 1.8;
        vCtx.beginPath();
        vCtx.moveTo(footX + ux * sq, footY + uy * sq);
        vCtx.lineTo(footX + ux * sq + nx * sq, footY + uy * sq + ny * sq);
        vCtx.lineTo(footX + nx * sq, footY + ny * sq);
        vCtx.stroke();

        // Punto luminoso P trascinabile
        const pulsePerp = 0.5 + 0.5 * Math.sin(Date.now() / 220);
        vCtx.fillStyle = `rgba(234, 88, 12, ${0.22 + 0.25 * pulsePerp})`;
        vCtx.beginPath();
        vCtx.arc(px, py, 12 + 4 * pulsePerp, 0, Math.PI * 2);
        vCtx.fill();

        vCtx.fillStyle = '#EA580C';
        vCtx.beginPath();
        vCtx.arc(px, py, 6.5, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.strokeStyle = '#FFFFFF';
        vCtx.lineWidth = 2;
        vCtx.stroke();

        vCtx.fillStyle = '#18181B';
        vCtx.font = '700 13px "Space Grotesk", sans-serif';
        vCtx.textAlign = 'left';
        vCtx.fillText(`P(${vState.perpPx}, ${vState.perpPy})`, px + 10, py - 10);
    } else if (currentVTopic === 'style') {
        const rPx = 2.6 * scale;
        const curSweep = 360 * p;
        const endRad = -(curSweep * Math.PI) / 180;

        if (vState.fillOpacity > 0 && p > 0.2) {
            vCtx.save();
            vCtx.globalAlpha = vState.fillOpacity;
            vCtx.fillStyle = vState.colorHex;
            vCtx.beginPath();
            vCtx.arc(ox, oy, rPx, 0, endRad, true);
            vCtx.fill();
            vCtx.restore();
        }

        vCtx.strokeStyle = vState.colorHex;
        vCtx.lineWidth = vState.strokeWidth;
        vCtx.beginPath();
        vCtx.arc(ox, oy, rPx, 0, endRad, true);
        vCtx.stroke();

        vCtx.fillStyle = '#18181B';
        vCtx.beginPath();
        vCtx.arc(ox, oy, 4, 0, Math.PI * 2);
        vCtx.fill();
    }
}

function playVisualAnimation() {
    if (vAnimId) cancelAnimationFrame(vAnimId);
    vState.progress = 0;
    let start = null;
    function step(ts) {
        if (!start) start = ts;
        vState.progress = Math.min(1, (ts - start) / 900);
        renderVisualTopic();
        if (vState.progress < 1 || (!visualModal.classList.contains('hidden') && ['point', 'arc', 'interpolate', 'parallel', 'perp'].includes(currentVTopic))) {
            vAnimId = requestAnimationFrame(step);
        }
    }
    vAnimId = requestAnimationFrame(step);
}

function selectVisualTopic(topic) {
    currentVTopic = topic;
    document.querySelectorAll('.vtopic-btn').forEach(btn => {
        const active = btn.dataset.vtopic === topic;
        btn.classList.toggle('bg-zinc-900', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('bg-white', !active);
        btn.classList.toggle('text-stone-700', !active);
    });

    const expEl = document.getElementById('vlearn-explanation');
    const codeEl = document.getElementById('vlearn-live-code');
    const ctrlEl = document.getElementById('vlearn-controls');
    const hintBox = document.getElementById('vlearn-arc-hint');
    const hintText = document.getElementById('vlearn-hint-text');

    const hasDraggablePt = ['point', 'arc', 'interpolate', 'parallel', 'perp'].includes(topic);
    if (hintBox && hintText) {
        hintBox.classList.toggle('hidden', !hasDraggablePt);
        hintText.textContent = topic === 'arc' ? t('dragTwoPts') : t('dragOnePt');
    }

    const expMap = t('vlearnExp');
    const sl = t('sliders');

    if (topic === 'point') {
        expEl.innerHTML = expMap.point;
        codeEl.textContent = `A = point(${vState.x}, ${vState.y})`;
        ctrlEl.innerHTML = `
            <div class="grid grid-cols-2 gap-3 text-xs font-semibold">
                <label>${sl.x} <span id="lbl-vx" class="font-mono text-orange-600">${vState.x}</span>
                    <input id="sl-vx" type="range" min="-5" max="5" step="1" value="${vState.x}" class="w-full accent-orange-600 mt-1">
                </label>
                <label>${sl.y} <span id="lbl-vy" class="font-mono text-emerald-700">${vState.y}</span>
                    <input id="sl-vy" type="range" min="-3" max="4" step="1" value="${vState.y}" class="w-full accent-emerald-600 mt-1">
                </label>
            </div>`;
        document.getElementById('sl-vx').addEventListener('input', (e) => {
            vState.x = Number(e.target.value);
            document.getElementById('lbl-vx').textContent = vState.x;
            codeEl.textContent = `A = point(${vState.x}, ${vState.y})`;
            vState.progress = 1;
            renderVisualTopic();
        });
        document.getElementById('sl-vy').addEventListener('input', (e) => {
            vState.y = Number(e.target.value);
            document.getElementById('lbl-vy').textContent = vState.y;
            codeEl.textContent = `A = point(${vState.x}, ${vState.y})`;
            vState.progress = 1;
            renderVisualTopic();
        });
    } else if (topic === 'line') {
        expEl.innerHTML = expMap.line;
        codeEl.textContent = 's1 = line(A, B)';
        ctrlEl.innerHTML = `<div class="text-xs text-stone-600">${t('vlearnLineNote')}</div>`;
    } else if (topic === 'arc') {
        expEl.innerHTML = expMap.arc;
        codeEl.innerHTML = `a1 = arc(O, ${vState.radius}, <span class="text-emerald-300 font-semibold">${vState.startDeg}</span>, <span class="text-orange-300 font-semibold">${vState.sweep}</span>)`;
        ctrlEl.innerHTML = `
            <div class="grid grid-cols-3 gap-2 text-xs font-semibold">
                <label>${sl.r} <span id="lbl-vr" class="font-mono text-blue-600">${vState.radius}</span>
                    <input id="sl-vr" type="range" min="1" max="3.5" step="0.5" value="${vState.radius}" class="w-full accent-blue-600 mt-1">
                </label>
                <label>${sl.start} <span id="lbl-vstart" class="font-mono text-emerald-600">${vState.startDeg}°</span>
                    <input id="sl-vstart" type="range" min="0" max="330" step="15" value="${vState.startDeg}" class="w-full accent-emerald-600 mt-1">
                </label>
                <label>${sl.sweep} <span id="lbl-vs" class="font-mono text-orange-600">${vState.sweep}°</span>
                    <input id="sl-vs" type="range" min="-360" max="360" step="15" value="${vState.sweep}" class="w-full accent-orange-600 mt-1">
                </label>
            </div>`;
        const updateArcCode = (activePart = null) => {
            const startCls = activePart === 'start'
                ? 'bg-emerald-500 text-zinc-950 font-bold px-1.5 py-0.5 rounded shadow-[0_0_12px_rgba(16,185,129,0.95)]'
                : 'text-emerald-300 font-semibold';
            const sweepCls = activePart === 'end'
                ? 'bg-orange-500 text-zinc-950 font-bold px-1.5 py-0.5 rounded shadow-[0_0_12px_rgba(249,115,22,0.95)]'
                : 'text-orange-300 font-semibold';
            codeEl.innerHTML = `a1 = arc(O, ${vState.radius}, <span class="${startCls}">${vState.startDeg}</span>, <span class="${sweepCls}">${vState.sweep}</span>)`;
        };
        document.getElementById('sl-vr').addEventListener('input', (e) => {
            vState.radius = Number(e.target.value);
            document.getElementById('lbl-vr').textContent = vState.radius;
            updateArcCode();
            vState.progress = 1;
            renderVisualTopic();
        });
        document.getElementById('sl-vstart').addEventListener('input', (e) => {
            vState.startDeg = Number(e.target.value);
            document.getElementById('lbl-vstart').textContent = `${vState.startDeg}°`;
            updateArcCode('start');
            vState.progress = 1;
            renderVisualTopic();
        });
        document.getElementById('sl-vs').addEventListener('input', (e) => {
            vState.sweep = Number(e.target.value);
            document.getElementById('lbl-vs').textContent = `${vState.sweep}°`;
            updateArcCode('end');
            vState.progress = 1;
            renderVisualTopic();
        });
    } else if (topic === 'interpolate') {
        expEl.innerHTML = expMap.interpolate;
        codeEl.textContent = `M = point(interpolate(A, B, ${vState.ratio}))`;
        ctrlEl.innerHTML = `
            <label class="block text-xs font-semibold">${sl.ratio} <span id="lbl-vrat" class="font-mono text-emerald-700">${vState.ratio}</span>
                <input id="sl-vrat" type="range" min="0" max="1" step="0.1" value="${vState.ratio}" class="w-full accent-emerald-600 mt-1">
            </label>`;
        document.getElementById('sl-vrat').addEventListener('input', (e) => {
            vState.ratio = Number(e.target.value);
            document.getElementById('lbl-vrat').textContent = vState.ratio;
            codeEl.textContent = `M = point(interpolate(A, B, ${vState.ratio}))`;
            vState.progress = 1;
            renderVisualTopic();
        });
    } else if (topic === 'parallel') {
        expEl.innerHTML = expMap.parallel;
        codeEl.innerHTML = `P = point(${vState.parPx}, ${vState.parPy})<br>r1 = parallel(s1, P, ${vState.lineLen})`;
        ctrlEl.innerHTML = `
            <div class="grid grid-cols-3 gap-2 text-xs font-semibold">
                <label>P x: <span id="lbl-vparx" class="font-mono text-orange-600">${vState.parPx}</span>
                    <input id="sl-vparx" type="range" min="-5" max="5" step="0.5" value="${vState.parPx}" class="w-full accent-orange-600 mt-1">
                </label>
                <label>P y: <span id="lbl-vpary" class="font-mono text-orange-600">${vState.parPy}</span>
                    <input id="sl-vpary" type="range" min="-3" max="3.5" step="0.5" value="${vState.parPy}" class="w-full accent-orange-600 mt-1">
                </label>
                <label>${sl.len} <span id="lbl-vparlen" class="font-mono text-blue-600">${vState.lineLen}</span>
                    <input id="sl-vparlen" type="range" min="3" max="9" step="1" value="${vState.lineLen}" class="w-full accent-blue-600 mt-1">
                </label>
            </div>`;
        const syncPar = () => {
            codeEl.innerHTML = `P = point(${vState.parPx}, ${vState.parPy})<br>r1 = parallel(s1, P, ${vState.lineLen})`;
            vState.progress = 1;
            renderVisualTopic();
        };
        document.getElementById('sl-vparx').addEventListener('input', (e) => { vState.parPx = Number(e.target.value); document.getElementById('lbl-vparx').textContent = vState.parPx; syncPar(); });
        document.getElementById('sl-vpary').addEventListener('input', (e) => { vState.parPy = Number(e.target.value); document.getElementById('lbl-vpary').textContent = vState.parPy; syncPar(); });
        document.getElementById('sl-vparlen').addEventListener('input', (e) => { vState.lineLen = Number(e.target.value); document.getElementById('lbl-vparlen').textContent = vState.lineLen; syncPar(); });
    } else if (topic === 'perp') {
        expEl.innerHTML = expMap.perp;
        codeEl.innerHTML = `P = point(${vState.perpPx}, ${vState.perpPy})<br>p1 = perp(s1, P, ${vState.lineLen})`;
        ctrlEl.innerHTML = `
            <div class="grid grid-cols-3 gap-2 text-xs font-semibold">
                <label>P x: <span id="lbl-vperpx" class="font-mono text-orange-600">${vState.perpPx}</span>
                    <input id="sl-vperpx" type="range" min="-5" max="5" step="0.5" value="${vState.perpPx}" class="w-full accent-orange-600 mt-1">
                </label>
                <label>P y: <span id="lbl-vperpy" class="font-mono text-orange-600">${vState.perpPy}</span>
                    <input id="sl-vperpy" type="range" min="-3" max="3.5" step="0.5" value="${vState.perpPy}" class="w-full accent-orange-600 mt-1">
                </label>
                <label>${sl.len} <span id="lbl-vperplen" class="font-mono text-emerald-700">${vState.lineLen}</span>
                    <input id="sl-vperplen" type="range" min="3" max="9" step="1" value="${vState.lineLen}" class="w-full accent-emerald-600 mt-1">
                </label>
            </div>`;
        const syncPerp = () => {
            codeEl.innerHTML = `P = point(${vState.perpPx}, ${vState.perpPy})<br>p1 = perp(s1, P, ${vState.lineLen})`;
            vState.progress = 1;
            renderVisualTopic();
        };
        document.getElementById('sl-vperpx').addEventListener('input', (e) => { vState.perpPx = Number(e.target.value); document.getElementById('lbl-vperpx').textContent = vState.perpPx; syncPerp(); });
        document.getElementById('sl-vperpy').addEventListener('input', (e) => { vState.perpPy = Number(e.target.value); document.getElementById('lbl-vperpy').textContent = vState.perpPy; syncPerp(); });
        document.getElementById('sl-vperplen').addEventListener('input', (e) => { vState.lineLen = Number(e.target.value); document.getElementById('lbl-vperplen').textContent = vState.lineLen; syncPerp(); });
    } else if (topic === 'style') {
        expEl.innerHTML = expMap.style;
        codeEl.innerHTML = `stroke(c1, ${vState.strokeWidth})<br>fill(c1, ${vState.fillOpacity})`;
        ctrlEl.innerHTML = `
            <div class="grid grid-cols-2 gap-3 text-xs font-semibold">
                <label>${sl.sw} <span id="lbl-vsw" class="font-mono text-zinc-900">${vState.strokeWidth}</span>
                    <input id="sl-vsw" type="range" min="1" max="10" step="1" value="${vState.strokeWidth}" class="w-full accent-zinc-900 mt-1">
                </label>
                <label>${sl.fo} <span id="lbl-vfo" class="font-mono text-blue-600">${vState.fillOpacity}</span>
                    <input id="sl-vfo" type="range" min="0" max="0.8" step="0.1" value="${vState.fillOpacity}" class="w-full accent-blue-600 mt-1">
                </label>
            </div>`;
        document.getElementById('sl-vsw').addEventListener('input', (e) => {
            vState.strokeWidth = Number(e.target.value);
            document.getElementById('lbl-vsw').textContent = vState.strokeWidth;
            codeEl.innerHTML = `stroke(c1, ${vState.strokeWidth})<br>fill(c1, ${vState.fillOpacity})`;
            vState.progress = 1;
            renderVisualTopic();
        });
        document.getElementById('sl-vfo').addEventListener('input', (e) => {
            vState.fillOpacity = Number(e.target.value);
            document.getElementById('lbl-vfo').textContent = vState.fillOpacity;
            codeEl.innerHTML = `stroke(c1, ${vState.strokeWidth})<br>fill(c1, ${vState.fillOpacity})`;
            vState.progress = 1;
            renderVisualTopic();
        });
    }

    resizeVisualCanvas();
    playVisualAnimation();
    if (vLearnViewMode === 'video') {
        startVClipForTopic(topic);
    } else {
        vClipPlaying = false;
    }
}

let vLearnViewMode = 'lab'; // 'lab' | 'video'
const btnVModeLab = document.getElementById('btn-vmode-lab');
const btnVModeVideo = document.getElementById('btn-vmode-video');
const vLearnLabPanel = document.getElementById('vlearn-lab-panel');
const vLearnVideoPanel = document.getElementById('vlearn-video-panel');

function setVLearnViewMode(mode) {
    vLearnViewMode = mode;
    const isVideo = mode === 'video';
    if (btnVModeLab && btnVModeVideo) {
        btnVModeLab.classList.toggle('bg-zinc-900', !isVideo);
        btnVModeLab.classList.toggle('text-white', !isVideo);
        btnVModeLab.classList.toggle('text-stone-700', isVideo);
        btnVModeVideo.classList.toggle('bg-zinc-900', isVideo);
        btnVModeVideo.classList.toggle('text-white', isVideo);
        btnVModeVideo.classList.toggle('text-stone-700', !isVideo);
    }
    if (vLearnLabPanel) vLearnLabPanel.classList.toggle('hidden', isVideo);
    if (vLearnVideoPanel) vLearnVideoPanel.classList.toggle('hidden', !isVideo);

    if (isVideo) {
        startVClipForTopic(currentVTopic);
    } else {
        vClipPlaying = false;
        requestAnimationFrame(() => {
            resizeVisualCanvas();
            playVisualAnimation();
        });
    }
}

btnVModeLab?.addEventListener('click', () => setVLearnViewMode('lab'));
btnVModeVideo?.addEventListener('click', () => setVLearnViewMode('video'));

document.getElementById('btn-open-visual-learn').addEventListener('click', () => {
    visualModal.classList.remove('hidden');
    selectVisualTopic(currentVTopic);
});
document.getElementById('btn-close-visual').addEventListener('click', () => {
    visualModal.classList.add('hidden');
    vClipPlaying = false;
});
document.getElementById('btn-close-visual-bottom').addEventListener('click', () => {
    visualModal.classList.add('hidden');
    vClipPlaying = false;
});
document.getElementById('btn-vlearn-replay').addEventListener('click', playVisualAnimation);
document.querySelectorAll('.vtopic-btn').forEach(btn => {
    btn.addEventListener('click', () => selectVisualTopic(btn.dataset.vtopic));
});

// ==========================================
// PLAYER MINI-CLIP TUTORIAL PER OGNI SCHEDA DI IMPARA
// ==========================================
const vClipCanvas = document.getElementById('vclip-canvas');
const vClipCtx = vClipCanvas ? vClipCanvas.getContext('2d') : null;
const VCLIP_DURATION = 8000; // 8 secondi per clip
let vClipElapsed = 0;
let vClipPlaying = false;
let vClipLastTs = null;
let vClipRafId = null;

function resizeVClipCanvas() {
    if (!vClipCanvas || !vClipCtx) return;
    const rect = vClipCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    vClipCanvas.width = (rect.width || 460) * dpr;
    vClipCanvas.height = (rect.height || 180) * dpr;
    vClipCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderVClipFrame(progress) {
    if (!vClipCanvas || !vClipCtx) return;
    const rect = vClipCanvas.getBoundingClientRect();
    const w = rect.width || 460;
    const h = rect.height || 180;
    const s = 23;
    const ox = w * 0.62;
    const oy = h * 0.62;

    const subEl = document.getElementById('vclip-subtitle');
    const codeEl = document.getElementById('vclip-code');
    const subs = t('vclipSubs');
    vClipCtx.clearRect(0, 0, w, h);
    vClipCtx.fillStyle = '#FFFFFF';
    vClipCtx.fillRect(0, 0, w, h);

    // Griglia leggera
    for (let gx = -10; gx <= 8; gx++) {
        vClipCtx.strokeStyle = gx === 0 ? '#71717A' : '#F4F4F5';
        vClipCtx.lineWidth = gx === 0 ? 1.3 : 1;
        vClipCtx.beginPath();
        vClipCtx.moveTo(ox + gx * s, 0);
        vClipCtx.lineTo(ox + gx * s, h);
        vClipCtx.stroke();
    }
    for (let gy = -4; gy <= 6; gy++) {
        vClipCtx.strokeStyle = gy === 0 ? '#71717A' : '#F4F4F5';
        vClipCtx.lineWidth = gy === 0 ? 1.3 : 1;
        vClipCtx.beginPath();
        vClipCtx.moveTo(0, oy - gy * s);
        vClipCtx.lineTo(w, oy - gy * s);
        vClipCtx.stroke();
    }

    if (currentVTopic === 'point') {
        const tx = ox + 3 * s, ty = oy - 2 * s;
        if (progress < 0.35) {
            subEl.textContent = subs.point[0];
            codeEl.textContent = "A = point(3, ...)";
        } else if (progress < 0.70) {
            subEl.textContent = subs.point[1];
            codeEl.textContent = "A = point(3, 2)";
        } else {
            subEl.textContent = subs.point[2];
            codeEl.textContent = "A = point(3, 2)";
        }
        const p1 = Math.min(1, progress / 0.35);
        const p2 = progress <= 0.35 ? 0 : Math.min(1, (progress - 0.35) / 0.35);
        vClipCtx.strokeStyle = '#2563EB';
        vClipCtx.lineWidth = 2.5;
        vClipCtx.beginPath();
        vClipCtx.moveTo(ox, oy);
        vClipCtx.lineTo(ox + 3 * s * p1, oy);
        vClipCtx.stroke();
        if (p2 > 0) {
            vClipCtx.strokeStyle = '#16A34A';
            vClipCtx.setLineDash([4, 3]);
            vClipCtx.beginPath();
            vClipCtx.moveTo(tx, oy);
            vClipCtx.lineTo(tx, oy - 2 * s * p2);
            vClipCtx.stroke();
            vClipCtx.setLineDash([]);
        }
        if (progress >= 0.70) {
            vClipCtx.fillStyle = '#EA580C';
            vClipCtx.beginPath();
            vClipCtx.arc(tx, ty, 5.5, 0, Math.PI * 2);
            vClipCtx.fill();
            vClipCtx.fillStyle = '#18181B';
            vClipCtx.font = '700 12px "Space Grotesk", sans-serif';
            vClipCtx.fillText('A(3, 2)', tx + 8, ty - 6);
        }
    } else if (currentVTopic === 'line') {
        const ax = ox - 2 * s, ay = oy + 1 * s;
        const bx = ox + 3 * s, by = oy - 2 * s;
        if (progress < 0.35) {
            subEl.textContent = subs.line[0];
            codeEl.textContent = "A = point(-2, -1)\nB = point(3, 2)";
        } else if (progress < 0.80) {
            subEl.textContent = subs.line[1];
            codeEl.textContent = "A = point(-2, -1)\nB = point(3, 2)\ns1 = line(A, B)";
        } else {
            subEl.textContent = subs.line[2];
            codeEl.textContent = "s1 = line(A, B)";
        }
        const pLine = progress <= 0.35 ? 0 : Math.min(1, (progress - 0.35) / 0.45);
        if (pLine > 0) {
            vClipCtx.strokeStyle = '#18181B';
            vClipCtx.lineWidth = 2.6;
            vClipCtx.beginPath();
            vClipCtx.moveTo(ax, ay);
            vClipCtx.lineTo(ax + (bx - ax) * pLine, ay + (by - ay) * pLine);
            vClipCtx.stroke();
        }
        [{ x: ax, y: ay, l: 'A' }, { x: bx, y: by, l: 'B' }].forEach(pt => {
            vClipCtx.fillStyle = '#EA580C';
            vClipCtx.beginPath();
            vClipCtx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
            vClipCtx.fill();
            vClipCtx.fillStyle = '#18181B';
            vClipCtx.font = '700 11px "Space Grotesk", sans-serif';
            vClipCtx.fillText(pt.l, pt.x - 4, pt.y + 14);
        });
    } else if (currentVTopic === 'arc') {
        const r = 2.6 * s;
        if (progress < 0.30) {
            subEl.textContent = subs.arc[0];
            codeEl.textContent = "O = point(0, 0)\na1 = arc(O, 3, 0, 180)";
        } else if (progress < 0.75) {
            subEl.textContent = subs.arc[1];
            codeEl.textContent = "a1 = arc(O, 3, 0, 180)";
        } else {
            subEl.textContent = subs.arc[2];
            codeEl.textContent = "a1 = arc(O, 3, 0, 180)";
        }
        const pArc = progress <= 0.25 ? 0 : Math.min(1, (progress - 0.25) / 0.55);
        const endRad = -pArc * Math.PI;
        vClipCtx.strokeStyle = '#2563EB';
        vClipCtx.lineWidth = 2.8;
        vClipCtx.beginPath();
        vClipCtx.arc(ox, oy, r, 0, endRad, true);
        vClipCtx.stroke();
        if (pArc > 0 && pArc < 1) {
            const px = ox + r * Math.cos(endRad);
            const py = oy + r * Math.sin(endRad);
            vClipCtx.strokeStyle = '#DC2626';
            vClipCtx.setLineDash([4, 3]);
            vClipCtx.beginPath();
            vClipCtx.moveTo(ox, oy);
            vClipCtx.lineTo(px, py);
            vClipCtx.stroke();
            vClipCtx.setLineDash([]);
        }
        vClipCtx.fillStyle = '#18181B';
        vClipCtx.beginPath();
        vClipCtx.arc(ox, oy, 4, 0, Math.PI * 2);
        vClipCtx.fill();
    } else if (currentVTopic === 'interpolate') {
        const ax = ox - 3 * s, ay = oy + 1 * s;
        const bx = ox + 3 * s, by = oy - 2 * s;
        if (progress < 0.35) {
            subEl.textContent = subs.interpolate[0];
            codeEl.textContent = "A = point(-3, -1)\nB = point(3, 2)";
        } else if (progress < 0.75) {
            subEl.textContent = subs.interpolate[1];
            codeEl.textContent = "M = point(interpolate(A, B, 0.5))";
        } else {
            subEl.textContent = subs.interpolate[2];
            codeEl.textContent = "M = point(interpolate(A, B, 0.5))";
        }
        vClipCtx.strokeStyle = '#A1A1AA';
        vClipCtx.lineWidth = 2;
        vClipCtx.beginPath();
        vClipCtx.moveTo(ax, ay);
        vClipCtx.lineTo(bx, by);
        vClipCtx.stroke();

        const pMid = progress <= 0.30 ? 0 : Math.min(0.5, ((progress - 0.30) / 0.45) * 0.5);
        const mx = ax + (bx - ax) * pMid;
        const my = ay + (by - ay) * pMid;
        vClipCtx.strokeStyle = '#16A34A';
        vClipCtx.lineWidth = 3;
        vClipCtx.beginPath();
        vClipCtx.moveTo(ax, ay);
        vClipCtx.lineTo(mx, my);
        vClipCtx.stroke();

        [{ x: ax, y: ay, l: 'A' }, { x: bx, y: by, l: 'B' }].forEach(pt => {
            vClipCtx.fillStyle = '#18181B';
            vClipCtx.beginPath();
            vClipCtx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            vClipCtx.fill();
            vClipCtx.fillText(pt.l, pt.x - 4, pt.y + 14);
        });
        if (progress >= 0.30) {
            vClipCtx.fillStyle = '#16A34A';
            vClipCtx.beginPath();
            vClipCtx.arc(mx, my, 5.5, 0, Math.PI * 2);
            vClipCtx.fill();
            if (progress >= 0.75) {
                vClipCtx.font = '700 11px "Space Grotesk", sans-serif';
                vClipCtx.fillText('M (50%)', mx - 16, my - 10);
            }
        }
    } else if (currentVTopic === 'parallel') {
        const ax = ox - 3 * s, ay = oy + 1 * s;
        const bx = ox + 2 * s, by = oy - 1 * s;
        const px = ox - 1 * s, py = oy - 1.5 * s;
        const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        if (progress < 0.35) {
            subEl.textContent = subs.parallel[0];
            codeEl.textContent = "s1 = line(A, B)\nP = point(-1, 1.5)";
        } else {
            subEl.textContent = subs.parallel[1];
            codeEl.textContent = "r1 = parallel(s1, P)";
        }
        vClipCtx.strokeStyle = '#52525B';
        vClipCtx.lineWidth = 2.2;
        vClipCtx.beginPath();
        vClipCtx.moveTo(ax, ay);
        vClipCtx.lineTo(bx, by);
        vClipCtx.stroke();

        const pPar = progress <= 0.35 ? 0 : Math.min(1, (progress - 0.35) / 0.5);
        if (pPar > 0) {
            const half = 3 * s * pPar;
            vClipCtx.strokeStyle = '#2563EB';
            vClipCtx.lineWidth = 2.6;
            vClipCtx.beginPath();
            vClipCtx.moveTo(px - ux * half, py - uy * half);
            vClipCtx.lineTo(px + ux * half, py + uy * half);
            vClipCtx.stroke();
        }
        vClipCtx.fillStyle = '#EA580C';
        vClipCtx.beginPath();
        vClipCtx.arc(px, py, 4.5, 0, Math.PI * 2);
        vClipCtx.fill();
        vClipCtx.fillStyle = '#18181B';
        vClipCtx.font = '700 11px "Space Grotesk", sans-serif';
        vClipCtx.fillText('P', px - 4, py - 8);
    } else if (currentVTopic === 'perp') {
        const ax = ox - 3 * s, ay = oy + 1 * s;
        const bx = ox + 3 * s, by = oy - 1 * s;
        const px = ox, py = oy;
        const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        const nx = -uy, ny = ux;
        if (progress < 0.35) {
            subEl.textContent = subs.perp[0];
            codeEl.textContent = "s1 = line(A, B)\nP = point(0, 0)";
        } else {
            subEl.textContent = subs.perp[1];
            codeEl.textContent = "p1 = perp(s1, P)";
        }
        vClipCtx.strokeStyle = '#52525B';
        vClipCtx.lineWidth = 2.2;
        vClipCtx.beginPath();
        vClipCtx.moveTo(ax, ay);
        vClipCtx.lineTo(bx, by);
        vClipCtx.stroke();

        const pPerp = progress <= 0.35 ? 0 : Math.min(1, (progress - 0.35) / 0.5);
        if (pPerp > 0) {
            const half = 2.5 * s * pPerp;
            vClipCtx.strokeStyle = '#16A34A';
            vClipCtx.lineWidth = 2.6;
            vClipCtx.beginPath();
            vClipCtx.moveTo(px - nx * half, py - ny * half);
            vClipCtx.lineTo(px + nx * half, py + ny * half);
            vClipCtx.stroke();

            const sq = 9;
            vClipCtx.strokeStyle = '#DC2626';
            vClipCtx.lineWidth = 1.6;
            vClipCtx.beginPath();
            vClipCtx.moveTo(px + ux * sq, py + uy * sq);
            vClipCtx.lineTo(px + ux * sq + nx * sq, py + uy * sq + ny * sq);
            vClipCtx.lineTo(px + nx * sq, py + ny * sq);
            vClipCtx.stroke();
        }
        vClipCtx.fillStyle = '#EA580C';
        vClipCtx.beginPath();
        vClipCtx.arc(px, py, 4.5, 0, Math.PI * 2);
        vClipCtx.fill();
    } else if (currentVTopic === 'style') {
        const r = 2.1 * s;
        const cols = ['#2563EB', '#16A34A', '#F97316', '#9333EA'];
        const colIdx = Math.min(cols.length - 1, Math.floor(progress * cols.length));
        const activeCol = cols[colIdx];
        const sw = progress < 0.35 ? 2 : 6;
        const fo = progress < 0.65 ? 0 : 0.35;

        if (progress < 0.35) {
            subEl.textContent = subs.style[0];
            codeEl.textContent = "c1 = arc(O, 2, 0, 360)";
        } else if (progress < 0.65) {
            subEl.textContent = subs.style[1];
            codeEl.textContent = "c1 = arc(O, 2, 0, 360)\nstroke(c1, 6)";
        } else {
            subEl.textContent = subs.style[2];
            codeEl.textContent = "stroke(c1, 6)\nfill(c1, 0.35)";
        }

        if (fo > 0) {
            vClipCtx.save();
            vClipCtx.globalAlpha = fo;
            vClipCtx.fillStyle = activeCol;
            vClipCtx.beginPath();
            vClipCtx.arc(ox, oy, r, 0, Math.PI * 2);
            vClipCtx.fill();
            vClipCtx.restore();
        }
        vClipCtx.strokeStyle = activeCol;
        vClipCtx.lineWidth = sw;
        vClipCtx.beginPath();
        vClipCtx.arc(ox, oy, r, 0, Math.PI * 2);
        vClipCtx.stroke();
    }
}

function tickVClip(ts) {
    if (!vClipLastTs) vClipLastTs = ts;
    if (vClipPlaying && !visualModal.classList.contains('hidden')) {
        vClipElapsed = Math.min(VCLIP_DURATION, vClipElapsed + (ts - vClipLastTs));
        if (vClipElapsed >= VCLIP_DURATION) {
            vClipPlaying = false;
            const toggleBtn = document.getElementById('btn-vclip-toggle');
            if (toggleBtn) toggleBtn.textContent = t('replayClipBtn');
        }
    }
    vClipLastTs = ts;

    const ratio = vClipElapsed / VCLIP_DURATION;
    const progEl = document.getElementById('vclip-progress');
    const timerEl = document.getElementById('vclip-timer');
    if (progEl) progEl.style.width = `${ratio * 100}%`;
    if (timerEl) {
        const sec = Math.floor(vClipElapsed / 1000);
        timerEl.textContent = `00:${String(sec).padStart(2, '0')} / 00:08`;
    }
    renderVClipFrame(ratio);

    if (!visualModal.classList.contains('hidden')) {
        vClipRafId = requestAnimationFrame(tickVClip);
    }
}

function startVClipForTopic(topic) {
    const titleEl = document.getElementById('vclip-title');
    const toggleBtn = document.getElementById('btn-vclip-toggle');
    if (titleEl) titleEl.textContent = t('vclipTitles')[topic] || 'Video Tutorial';
    if (toggleBtn) toggleBtn.textContent = t('pauseBtn');
    vClipElapsed = 0;
    vClipLastTs = null;
    vClipPlaying = true;
    if (vClipRafId) cancelAnimationFrame(vClipRafId);
    resizeVClipCanvas();
    vClipRafId = requestAnimationFrame(tickVClip);
}

document.getElementById('btn-vclip-toggle')?.addEventListener('click', () => {
    const toggleBtn = document.getElementById('btn-vclip-toggle');
    if (vClipElapsed >= VCLIP_DURATION) vClipElapsed = 0;
    vClipPlaying = !vClipPlaying;
    if (toggleBtn) toggleBtn.textContent = vClipPlaying ? t('pauseBtn') : t('resumeBtn');
});

document.getElementById('btn-vclip-restart')?.addEventListener('click', () => {
    startVClipForTopic(currentVTopic);
});

document.getElementById('vclip-timeline')?.addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    vClipElapsed = pos * VCLIP_DURATION;
    renderVClipFrame(pos);
});

// Interazione diretta sul grafico della guida visuale (clic/trascinamento per angolo inizio e fine)
let vDragTarget = null; // 'start' | 'end' | null

function getVisualCanvasPos(clientX, clientY) {
    const rect = vCanvas.getBoundingClientRect();
    const w = rect.width || 460;
    const h = rect.height || 240;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        ox: w / 2,
        oy: h / 2 + 12,
        scale: 28
    };
}

function handleVisualPointerDown(clientX, clientY) {
    const { x, y, ox, oy, scale } = getVisualCanvasPos(clientX, clientY);
    if (currentVTopic === 'point' || currentVTopic === 'interpolate' || currentVTopic === 'parallel' || currentVTopic === 'perp') {
        vDragTarget = 'pointP';
        handleVisualPointerMove(clientX, clientY);
        return;
    }
    if (currentVTopic !== 'arc') return;
    const rPx = vState.radius * scale;
    const startRad = -(vState.startDeg * Math.PI) / 180;
    const endRad = -((vState.startDeg + vState.sweep) * Math.PI) / 180;
    const sx = ox + rPx * Math.cos(startRad);
    const sy = oy + rPx * Math.sin(startRad);
    const ex = ox + rPx * Math.cos(endRad);
    const ey = oy + rPx * Math.sin(endRad);

    const distStart = Math.hypot(x - sx, y - sy);
    const distEnd = Math.hypot(x - ex, y - ey);

    if (distStart < 22 && distStart <= distEnd) {
        vDragTarget = 'start';
    } else {
        vDragTarget = 'end';
        handleVisualPointerMove(clientX, clientY);
    }
}

function handleVisualPointerMove(clientX, clientY) {
    if (!vDragTarget) return;
    const { x, y, ox, oy, scale } = getVisualCanvasPos(clientX, clientY);

    if (vDragTarget === 'pointP' && ['point', 'interpolate', 'parallel', 'perp'].includes(currentVTopic)) {
        const codeEl = document.getElementById('vlearn-live-code');
        if (currentVTopic === 'point') {
            const mx = Math.max(-5, Math.min(5, Math.round((x - ox) / scale)));
            const my = Math.max(-3, Math.min(4, Math.round((oy - y) / scale)));
            vState.x = mx;
            vState.y = my;
            const slX = document.getElementById('sl-vx'), slY = document.getElementById('sl-vy');
            const lblX = document.getElementById('lbl-vx'), lblY = document.getElementById('lbl-vy');
            if (slX) slX.value = mx;
            if (slY) slY.value = my;
            if (lblX) lblX.textContent = mx;
            if (lblY) lblY.textContent = my;
            if (codeEl) codeEl.textContent = `A = point(${mx}, ${my})`;
        } else if (currentVTopic === 'interpolate') {
            // Proiezione lungo il segmento AB tra (-4, -1) e (4, 1)
            const ax = ox - 4 * scale, ay = oy + 1 * scale;
            const bx = ox + 4 * scale, by = oy - 1 * scale;
            const abx = bx - ax, aby = by - ay;
            const abLen2 = abx * abx + aby * aby;
            const rawT = ((x - ax) * abx + (y - ay) * aby) / abLen2;
            const clampedT = Math.max(0, Math.min(1, Math.round(rawT * 10) / 10));
            vState.ratio = clampedT;
            const slR = document.getElementById('sl-vrat'), lblR = document.getElementById('lbl-vrat');
            if (slR) slR.value = clampedT;
            if (lblR) lblR.textContent = clampedT;
            if (codeEl) codeEl.textContent = `M = point(interpolate(A, B, ${clampedT}))`;
        } else {
            const mx = Math.max(-5.5, Math.min(5.5, Math.round(((x - ox) / scale) * 2) / 2));
            const my = Math.max(-3.5, Math.min(3.5, Math.round(((oy - y) / scale) * 2) / 2));
            if (currentVTopic === 'parallel') {
                vState.parPx = mx;
                vState.parPy = my;
                const slX = document.getElementById('sl-vparx'), slY = document.getElementById('sl-vpary');
                const lblX = document.getElementById('lbl-vparx'), lblY = document.getElementById('lbl-vpary');
                if (slX) slX.value = mx;
                if (slY) slY.value = my;
                if (lblX) lblX.textContent = mx;
                if (lblY) lblY.textContent = my;
                if (codeEl) codeEl.innerHTML = `P = point(${mx}, ${my})<br>r1 = parallel(s1, P, ${vState.lineLen})`;
            } else {
                vState.perpPx = mx;
                vState.perpPy = my;
                const slX = document.getElementById('sl-vperpx'), slY = document.getElementById('sl-vperpy');
                const lblX = document.getElementById('lbl-vperpx'), lblY = document.getElementById('lbl-vperpy');
                if (slX) slX.value = mx;
                if (slY) slY.value = my;
                if (lblX) lblX.textContent = mx;
                if (lblY) lblY.textContent = my;
                if (codeEl) codeEl.innerHTML = `P = point(${mx}, ${my})<br>p1 = perp(s1, P, ${vState.lineLen})`;
            }
        }
        vState.progress = 1;
        renderVisualTopic();
        return;
    }

    if (currentVTopic !== 'arc') return;
    const dx = x - ox;
    const dy = oy - y; // Y cartesiano positivo verso l'alto
    if (Math.hypot(dx, dy) < 8) return;

    let deg = Math.round((Math.atan2(dy, dx) * 180 / Math.PI) / 5) * 5;
    if (deg < 0) deg += 360;

    if (vDragTarget === 'start') {
        vState.startDeg = deg % 360;
        const slStart = document.getElementById('sl-vstart');
        const lblStart = document.getElementById('lbl-vstart');
        if (slStart) slStart.value = vState.startDeg;
        if (lblStart) lblStart.textContent = `${vState.startDeg}°`;
    } else if (vDragTarget === 'end') {
        let diff = deg - vState.startDeg;
        if (vState.sweep < 0 && diff > 0) diff -= 360;
        if (vState.sweep >= 0 && diff < 0) diff += 360;
        if (diff === 0) diff = vState.sweep < 0 ? -360 : 360;
        vState.sweep = Math.max(-360, Math.min(360, diff));
        const slSweep = document.getElementById('sl-vs');
        const lblSweep = document.getElementById('lbl-vs');
        if (slSweep) slSweep.value = vState.sweep;
        if (lblSweep) lblSweep.textContent = `${vState.sweep}°`;
    }

    const codeEl = document.getElementById('vlearn-live-code');
    if (codeEl) {
        const startCls = vDragTarget === 'start'
            ? 'bg-emerald-500 text-zinc-950 font-bold px-1.5 py-0.5 rounded shadow-[0_0_12px_rgba(16,185,129,0.95)] transition-all'
            : 'text-emerald-300 font-semibold transition-all';
        const sweepCls = vDragTarget === 'end'
            ? 'bg-orange-500 text-zinc-950 font-bold px-1.5 py-0.5 rounded shadow-[0_0_12px_rgba(249,115,22,0.95)] transition-all'
            : 'text-orange-300 font-semibold transition-all';
        codeEl.innerHTML = `a1 = arc(O, ${vState.radius}, <span class="${startCls}">${vState.startDeg}</span>, <span class="${sweepCls}">${vState.sweep}</span>)`;
    }
    vState.progress = 1;
    renderVisualTopic();
}

function releaseVisualDrag() {
    if (vDragTarget && currentVTopic === 'arc') {
        const codeEl = document.getElementById('vlearn-live-code');
        if (codeEl) {
            codeEl.innerHTML = `a1 = arc(O, ${vState.radius}, <span class="text-emerald-300 font-semibold">${vState.startDeg}</span>, <span class="text-orange-300 font-semibold">${vState.sweep}</span>)`;
        }
    }
    vDragTarget = null;
}

vCanvas.addEventListener('mousedown', (e) => handleVisualPointerDown(e.clientX, e.clientY));
window.addEventListener('mousemove', (e) => handleVisualPointerMove(e.clientX, e.clientY));
window.addEventListener('mouseup', releaseVisualDrag);

vCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && ['point', 'arc', 'interpolate', 'parallel', 'perp'].includes(currentVTopic)) {
        e.preventDefault();
        handleVisualPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false });
vCanvas.addEventListener('touchmove', (e) => {
    if (vDragTarget && e.touches.length === 1) {
        e.preventDefault();
        handleVisualPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false });
vCanvas.addEventListener('touchend', releaseVisualDrag);
