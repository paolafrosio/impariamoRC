// ==========================================
// INTERPRETE COMANDI ROBOCOMPASS
// ==========================================
const ROBO_PALETTE = [
    '#9333EA', '#4F46E5', '#2563EB', '#16A34A', '#EAB308', '#F97316', '#DC2626', '#18181B', '#DB2777',
    '#0284C7', '#7C3AED', '#5F9EA0', '#E11D48', '#10B981', '#15803D', '#A3E635', '#3F2E18', '#FF0000'
];

function splitTopLevelArgs(str) {
    const args = [];
    let depth = 0;
    let inQuote = null;
    let current = '';
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if ((ch === '"' || ch === "'") && str[i - 1] !== '\\') {
            inQuote = inQuote === ch ? null : (inQuote || ch);
        }
        if (!inQuote) {
            if (ch === '(') depth++;
            else if (ch === ')') depth--;
        }
        if (ch === ',' && depth === 0 && !inQuote) {
            args.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim() !== '') args.push(current.trim());
    return args;
}

function evalExpression(expr, objs) {
    expr = expr.trim();
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
        return expr.slice(1, -1);
    }
    if (!isNaN(Number(expr))) return Number(expr);
    if (objs[expr]) return objs[expr];
    if (/^[0-9+\-*/().\s]+$/.test(expr) && /[0-9]/.test(expr)) {
        try {
            const val = Function(`"use strict"; return (${expr});`)();
            if (typeof val === 'number' && isFinite(val)) return val;
        } catch (_) {}
    }

    const match = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/);
    if (!match) {
        throw new Error(`Valore o nome sconosciuto: "${expr}"`);
    }

    const fn = match[1].toLowerCase();
    const rawArgs = splitTopLevelArgs(match[2]);
    const args = rawArgs.map(a => evalExpression(a, objs));

    if (fn === 'point') {
        if (args.length === 1 && args[0] && typeof args[0] === 'object' && typeof args[0].x === 'number') {
            return { type: 'point', x: args[0].x, y: args[0].y };
        }
        if (args.length >= 2) {
            return { type: 'point', x: Number(args[0]), y: Number(args[1]) };
        }
        throw new Error('point() richiede 2 numeri (x, y) oppure un risultato di intersect/interpolate.');
    }

    if (fn === 'line') {
        if (args.length >= 2 && args[0]?.type === 'point' && args[1]?.type === 'point') {
            let x1 = args[0].x, y1 = args[0].y, x2 = args[1].x, y2 = args[1].y;
            if (args.length >= 3 && typeof args[2] === 'number') {
                const len = Math.hypot(x2 - x1, y2 - y1);
                if (len > 0) {
                    x2 = x1 + ((x2 - x1) / len) * args[2];
                    y2 = y1 + ((y2 - y1) / len) * args[2];
                }
            }
            return { type: 'line', x1, y1, x2, y2 };
        }
        if (args.length >= 4) {
            return { type: 'line', x1: Number(args[0]), y1: Number(args[1]), x2: Number(args[2]), y2: Number(args[3]) };
        }
        throw new Error('line() richiede due punti, es. line(A, B), oppure 4 coordinate.');
    }

    if (fn === 'arc') {
        if (args.length >= 4 && args[0]?.type === 'point' && typeof args[1] === 'number') {
            return {
                type: 'arc',
                cx: args[0].x,
                cy: args[0].y,
                r: Math.abs(args[1]),
                startDeg: Number(args[2]),
                sweep: Number(args[3])
            };
        }
        if (args.length >= 5 && args[0]?.type === 'point' && args[1]?.type === 'point' && args[2]?.type === 'point') {
            const r = Math.hypot(args[1].x - args[0].x, args[1].y - args[0].y);
            return {
                type: 'arc',
                cx: args[2].x,
                cy: args[2].y,
                r,
                startDeg: Number(args[3]),
                sweep: Number(args[4])
            };
        }
        throw new Error('arc() richiede (centro, raggio, inizio, apertura) oppure (P1, P2, centro, inizio, apertura).');
    }

    if (fn === 'interpolate') {
        if (args.length >= 3 && args[0]?.type === 'point' && args[1]?.type === 'point') {
            const t = Number(args[2]);
            return {
                type: 'coord',
                x: args[0].x + (args[1].x - args[0].x) * t,
                y: args[0].y + (args[1].y - args[0].y) * t
            };
        }
        throw new Error('interpolate() richiede (puntoA, puntoB, frazione), es. interpolate(A, B, 0.5).');
    }

    if (fn === 'perp') {
        if (args.length >= 2 && args[0]?.type === 'line' && args[1]?.type === 'point') {
            const l = args[0];
            const p = args[1];
            const halfLen = (args.length >= 3 ? Number(args[2]) : 6) / 2;
            const dx = l.x2 - l.x1;
            const dy = l.y2 - l.y1;
            const len = Math.hypot(dx, dy);
            if (len === 0) throw new Error('Il segmento di riferimento ha lunghezza zero.');
            const nx = -dy / len;
            const ny = dx / len;
            return {
                type: 'line',
                x1: p.x - nx * halfLen,
                y1: p.y - ny * halfLen,
                x2: p.x + nx * halfLen,
                y2: p.y + ny * halfLen
            };
        }
        throw new Error('perp() richiede (segmento, punto) ed opzionalmente la lunghezza.');
    }

    if (fn === 'parallel') {
        if (args.length >= 2 && args[0]?.type === 'line' && args[1]?.type === 'point') {
            const l = args[0];
            const p = args[1];
            const halfLen = (args.length >= 3 ? Number(args[2]) : 6) / 2;
            const dx = l.x2 - l.x1;
            const dy = l.y2 - l.y1;
            const len = Math.hypot(dx, dy);
            if (len === 0) throw new Error('Il segmento di riferimento ha lunghezza zero.');
            const ux = dx / len;
            const uy = dy / len;
            return {
                type: 'line',
                x1: p.x - ux * halfLen,
                y1: p.y - uy * halfLen,
                x2: p.x + ux * halfLen,
                y2: p.y + uy * halfLen
            };
        }
        throw new Error('parallel() richiede (segmento, punto) ed opzionalmente la lunghezza.');
    }

    if (fn === 'intersect') {
        if (args.length >= 2) {
            const o1 = args[0];
            const o2 = args[1];
            const idx = args.length >= 3 ? Number(args[2]) : 1;
            const pts = computeIntersection(o1, o2);
            if (!pts.length) throw new Error('I due oggetti non si intersecano.');
            const chosen = pts[Math.max(0, Math.min(pts.length - 1, idx - 1))];
            return { type: 'coord', x: chosen.x, y: chosen.y };
        }
        throw new Error('intersect() richiede (oggetto1, oggetto2, numero_incrocio).');
    }

    if (fn === 'polygon') {
        const pts = args.filter(a => a && a.type === 'point');
        if (pts.length < 3) throw new Error('polygon() richiede almeno 3 punti.');
        return { type: 'polygon', points: pts };
    }

    if (fn === 'stroke') {
        if (args.length >= 2 && args[0] && typeof args[0] === 'object' && args[0].type) {
            const width = Number(args[1]);
            if (isNaN(width) || width <= 0) throw new Error('stroke() richiede uno spessore numerico positivo, es. stroke(s1, 5).');
            args[0].strokeWidth = width;
            return { type: 'style', target: args[0], prop: 'stroke', width };
        }
        throw new Error('stroke() richiede (oggetto, spessore), es. stroke(s1, 5).');
    }

    if (fn === 'fill') {
        if (args.length >= 1 && args[0] && typeof args[0] === 'object' && args[0].type) {
            const opacity = args.length >= 2 ? Number(args[1]) : 0.35;
            if (isNaN(opacity) || opacity < 0) throw new Error('fill() richiede un numero tra 0 e 1, es. fill(c1, 0.4).');
            args[0].fillOpacity = opacity > 1 ? Math.min(1, opacity / 100) : opacity;
            return { type: 'style', target: args[0], prop: 'fill', opacity: args[0].fillOpacity };
        }
        throw new Error('fill() richiede (oggetto) oppure (oggetto, opacità), es. fill(c1, 0.4).');
    }

    throw new Error(`Comando non riconosciuto: "${fn}"`);
}

function computeIntersection(o1, o2) {
    if (o1.type === 'line' && o2.type === 'line') {
        const denom = (o1.x1 - o1.x2) * (o2.y1 - o2.y2) - (o1.y1 - o1.y2) * (o2.x1 - o2.x2);
        if (Math.abs(denom) < 1e-9) return [];
        const px = ((o1.x1 * o1.y2 - o1.y1 * o1.x2) * (o2.x1 - o2.x2) - (o1.x1 - o1.x2) * (o2.x1 * o2.y2 - o2.y1 * o2.x2)) / denom;
        const py = ((o1.x1 * o1.y2 - o1.y1 * o1.x2) * (o2.y1 - o2.y2) - (o1.y1 - o1.y2) * (o2.x1 * o2.y2 - o2.y1 * o2.x2)) / denom;
        return [{ x: px, y: py }];
    }
    if (o1.type === 'arc' && o2.type === 'arc') {
        const d = Math.hypot(o2.cx - o1.cx, o2.cy - o1.cy);
        if (d > o1.r + o2.r || d < Math.abs(o1.r - o2.r) || d === 0) return [];
        const a = (o1.r * o1.r - o2.r * o2.r + d * d) / (2 * d);
        const h = Math.sqrt(Math.max(0, o1.r * o1.r - a * a));
        const x2 = o1.cx + (a * (o2.cx - o1.cx)) / d;
        const y2 = o1.cy + (a * (o2.cy - o1.cy)) / d;
        const rx = -(o2.cy - o1.cy) * (h / d);
        const ry = (o2.cx - o1.cx) * (h / d);
        return [
            { x: x2 + rx, y: y2 + ry },
            { x: x2 - rx, y: y2 - ry }
        ].sort((pA, pB) => pB.y - pA.y);
    }
    if ((o1.type === 'line' && o2.type === 'arc') || (o1.type === 'arc' && o2.type === 'line')) {
        const l = o1.type === 'line' ? o1 : o2;
        const c = o1.type === 'arc' ? o1 : o2;
        const dx = l.x2 - l.x1;
        const dy = l.y2 - l.y1;
        const fx = l.x1 - c.cx;
        const fy = l.y1 - c.cy;
        const a = dx * dx + dy * dy;
        if (a < 1e-12) return [];
        const b = 2 * (fx * dx + fy * dy);
        const cc = fx * fx + fy * fy - c.r * c.r;
        let disc = b * b - 4 * a * cc;
        if (disc < 0) return [];
        disc = Math.sqrt(disc);
        const t1 = (-b - disc) / (2 * a);
        const t2 = (-b + disc) / (2 * a);
        return [
            { x: l.x1 + t1 * dx, y: l.y1 + t1 * dy },
            { x: l.x1 + t2 * dx, y: l.y1 + t2 * dy }
        ];
    }
    return [];
}

function parseProgram(codeText) {
    const lines = codeText.split('\n');
    const objs = {};
    const drawList = [];
    let autoCount = 1;

    for (let i = 0; i < lines.length; i++) {
        let raw = lines[i].trim();
        const commentIdx = raw.indexOf('//');
        if (commentIdx !== -1) raw = raw.slice(0, commentIdx).trim();
        if (!raw) continue;

        let varName = null;
        let expr = raw;
        const eqIdx = raw.indexOf('=');
        if (eqIdx !== -1) {
            varName = raw.slice(0, eqIdx).trim();
            expr = raw.slice(eqIdx + 1).trim();
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
                throw new Error(`Riga ${i + 1}: nome "${varName}" non valido.`);
            }
        }

        try {
            const result = evalExpression(expr, objs);
            const name = varName || `obj_${autoCount++}`;
            if (result.type !== 'style') {
                result.name = varName || '';
                result.lineIndex = i;
                const cfg = getEffectiveLineConfig(i, varName);
                if (cfg) {
                    if (cfg.color) result.customColor = cfg.color;
                    if (typeof cfg.showLabel === 'boolean') result.showLabel = cfg.showLabel;
                    if (typeof cfg.labelOffsetX === 'number') result.labelOffsetX = cfg.labelOffsetX;
                    if (typeof cfg.labelOffsetY === 'number') result.labelOffsetY = cfg.labelOffsetY;
                    if (typeof cfg.speed === 'number') result.speed = cfg.speed;
                }
                objs[name] = result;
                drawList.push(result);
            } else if (varName) {
                objs[name] = result;
            }
        } catch (err) {
            throw new Error(`Riga ${i + 1}: ${err.message}`);
        }
    }
    return { objs, drawList };
}
