// ==========================================
        // PERCORSO DIDATTICO (14 ESERCIZI PROGRESSIVI)
        // ==========================================
        const exercises = [
            {
                badge: "Punti",
                title: "1. Disegna il tuo primo punto",
                desc: "In RoboCompass ogni punto ha due coordinate: orizzontale (x) e verticale (y). <strong>Scrivi un comando per disegnare il punto A alle coordinate (3, 2).</strong>",
                hint: "Scrivi A = point(3, 2) nell'editor e premi Disegna.",
                solution: "A = point(3, 2)",
                starter: "",
                verify: (objs) => {
                    const pts = Object.values(objs).filter(o => o.type === 'point');
                    const found = pts.some(p => Math.hypot(p.x - 3, p.y - 2) < 0.05);
                    if (found) return { ok: true, msg: "Perfetto! Hai posizionato il punto A in (3, 2)." };
                    return { ok: false, msg: "Non vedo ancora un punto alle coordinate (3, 2). Controlla i numeri dentro point(x, y)." };
                }
            },
            {
                badge: "Punti negativi",
                title: "2. Coordinate nei quattro quadranti",
                desc: "Puoi usare anche numeri negativi per spostarti a sinistra o in basso. <strong>Disegna tre punti: A(4, 1), B(-3, 2) e C(-2, -3).</strong>",
                hint: "Usa tre righe separate: A = point(4, 1), B = point(-3, 2) e C = point(-2, -3).",
                solution: "A = point(4, 1)\nB = point(-3, 2)\nC = point(-2, -3)",
                starter: "A = point(4, 1)\n",
                verify: (objs) => {
                    const pts = Object.values(objs).filter(o => o.type === 'point');
                    const targets = [[4, 1], [-3, 2], [-2, -3]];
                    const allOk = targets.every(([tx, ty]) => pts.some(p => Math.hypot(p.x - tx, p.y - ty) < 0.05));
                    if (allOk) return { ok: true, msg: "Benissimo! Tutti e tre i punti sono al posto giusto." };
                    return { ok: false, msg: "Manca ancora qualcuno dei tre punti: (4, 1), (-3, 2) e (-2, -3)." };
                }
            },
            {
                badge: "Segmenti",
                title: "3. Unisci due punti con un segmento",
                desc: "Dopo aver creato due punti, uniscili con il righello usando line(A, B). <strong>Disegna A(1, 1), B(5, 4) e il segmento s1 che li collega.</strong>",
                hint: "Scrivi A = point(1, 1), poi B = point(5, 4) e infine s1 = line(A, B).",
                solution: "A = point(1, 1)\nB = point(5, 4)\ns1 = line(A, B)",
                starter: "A = point(1, 1)\nB = point(5, 4)\n",
                verify: (objs) => {
                    const lines = Object.values(objs).filter(o => o.type === 'line');
                    const found = lines.some(l =>
                        (Math.hypot(l.x1 - 1, l.y1 - 1) < 0.05 && Math.hypot(l.x2 - 5, l.y2 - 4) < 0.05) ||
                        (Math.hypot(l.x2 - 1, l.y2 - 1) < 0.05 && Math.hypot(l.x1 - 5, l.y1 - 4) < 0.05)
                    );
                    if (found) return { ok: true, msg: "Ottimo! Hai tracciato il segmento tra A e B." };
                    return { ok: false, msg: "Assicurati di aver collegato (1, 1) e (5, 4) con il comando line(A, B)." };
                }
            },
            {
                badge: "Figure",
                title: "4. Costruisci un triangolo",
                desc: "Collega tre punti per chiudere una figura. <strong>Disegna i vertici A(0, 0), B(4, 0) e C(2, 3) e unisci tutti e tre i lati con line().</strong>",
                hint: "Crea A, B, C e poi usa l1 = line(A, B), l2 = line(B, C) e l3 = line(C, A).",
                solution: "A = point(0, 0)\nB = point(4, 0)\nC = point(2, 3)\nl1 = line(A, B)\nl2 = line(B, C)\nl3 = line(C, A)",
                starter: "A = point(0, 0)\nB = point(4, 0)\nC = point(2, 3)\n",
verify: (objs) => {
                    const lines = Object.values(objs).filter(o => o.type === 'line');
                    const polys = Object.values(objs).filter(o => o.type === 'polygon');
                    const hasEdge = (x1, y1, x2, y2) => lines.some(l =>
                        (Math.hypot(l.x1 - x1, l.y1 - y1) < 0.05 && Math.hypot(l.x2 - x2, l.y2 - y2) < 0.05) ||
                        (Math.hypot(l.x2 - x1, l.y2 - y1) < 0.05 && Math.hypot(l.x1 - x2, l.y1 - y2) < 0.05)
                    );
                    const hasAllLines = hasEdge(0, 0, 4, 0) && hasEdge(4, 0, 2, 3) && hasEdge(2, 3, 0, 0);
                    const targets = [[0, 0], [4, 0], [2, 3]];
                    const hasPoly = polys.some(poly =>
                        poly.points && poly.points.length === 3 &&
                        targets.every(([tx, ty]) => poly.points.some(p => Math.hypot(p.x - tx, p.y - ty) < 0.05))
                    );
                    if (hasAllLines || hasPoly) {
                        return { ok: true, msg: "Fantastico! Il triangolo è perfettamente chiuso." };
                    }
                    return { ok: false, msg: "Controlla che ci siano tutti e 3 i lati (AB, BC, CA) oppure usa polygon(A, B, C)." };
                }
            },
            {
                badge: "Archi e Cerchi",
                title: "5. Usa il compasso: arco e cerchio",
                desc: "Il comando arc(centro, raggio, inizio, apertura) traccia un arco in gradi. <strong>Disegna un cerchio completo c1 con centro in O(0, 0) e raggio 3.</strong>",
                hint: "Un giro completo ha 360 gradi: scrivi O = point(0, 0) e c1 = arc(O, 3, 0, 360).",
                solution: "O = point(0, 0)\nc1 = arc(O, 3, 0, 360)",
                starter: "O = point(0, 0)\n",
                verify: (objs) => {
                    const arcs = Object.values(objs).filter(o => o.type === 'arc');
                    const found = arcs.some(a => Math.hypot(a.cx, a.cy) < 0.05 && Math.abs(a.r - 3) < 0.05 && Math.abs(a.sweep) >= 359);
                    if (found) return { ok: true, msg: "Perfetto! Hai disegnato una circonferenza completa di raggio 3." };
                    return { ok: false, msg: "Serve un arco con centro in (0, 0), raggio 3 e apertura di 360 gradi." };
                }
            },
            {
                badge: "Apertura compasso",
                title: "6. Apri il compasso da A fino a B",
                desc: "Puoi aprire il compasso usando la distanza tra due punti con arc(A, B, A, 0, 360). <strong>Punta in A(1, 2), apri fino a B(4, 2) e traccia il cerchio c1.</strong>",
                hint: "Scrivi A = point(1, 2), B = point(4, 2) e poi c1 = arc(A, B, A, 0, 360).",
                solution: "A = point(1, 2)\nB = point(4, 2)\nc1 = arc(A, B, A, 0, 360)",
                starter: "A = point(1, 2)\nB = point(4, 2)\n",
                verify: (objs) => {
                    const arcs = Object.values(objs).filter(o => o.type === 'arc');
                    const found = arcs.some(a => Math.hypot(a.cx - 1, a.cy - 2) < 0.05 && Math.abs(a.r - 3) < 0.05 && Math.abs(a.sweep) >= 359);
                    if (found) return { ok: true, msg: "Ottimo! La circonferenza è centrata in A e passa esattamente per B." };
                    return { ok: false, msg: "Usa arc(A, B, A, 0, 360) per centrare in A e aprire fino a B." };
                }
            },
            {
                badge: "Archi",
                title: "7. Archi concentrici",
                desc: "Un semicerchio superiore parte da 0° e ruota di 180°. <strong>Disegna due semicerchi concentrici centrati in O(0, -1): il primo a1 di raggio 2 e il secondo a2 di raggio 4.</strong>",
                hint: "Scrivi O = point(0, -1), poi a1 = arc(O, 2, 0, 180) e a2 = arc(O, 4, 0, 180).",
                solution: "O = point(0, -1)\na1 = arc(O, 2, 0, 180)\na2 = arc(O, 4, 0, 180)",
                starter: "O = point(0, -1)\na1 = arc(O, 2, 0, 180)\n",
                verify: (objs) => {
                    const arcs = Object.values(objs).filter(o => o.type === 'arc');
                    const has2 = arcs.some(a => Math.hypot(a.cx, a.cy + 1) < 0.05 && Math.abs(a.r - 2) < 0.05 && Math.abs(a.sweep - 180) < 1);
                    const has4 = arcs.some(a => Math.hypot(a.cx, a.cy + 1) < 0.05 && Math.abs(a.r - 4) < 0.05 && Math.abs(a.sweep - 180) < 1);
                    if (has2 && has4) return { ok: true, msg: "Perfetto! Hai costruito due semicerchi concentrici di 180°." };
                    return { ok: false, msg: "Controlla entrambi i semicerchi centrati in O(0, -1) con raggio 2 e raggio 4." };
                }
            },
            {
                badge: "Archi",
                title: "8. Disegna un sorriso",
                desc: "Per disegnare un arco nella metà inferiore, parti da 200° e ruota di 140°. <strong>Completa la faccina aggiungendo la bocca centrata in O(0, 0) con raggio 2.5.</strong>",
                hint: "Aggiungi in fondo: bocca = arc(O, 2.5, 200, 140)",
                solution: "O = point(0, 0)\nviso = arc(O, 4, 0, 360)\nS = point(-1.4, 1.3)\nD = point(1.4, 1.3)\nbocca = arc(O, 2.5, 200, 140)",
                starter: "O = point(0, 0)\nviso = arc(O, 4, 0, 360)\nS = point(-1.4, 1.3)\nD = point(1.4, 1.3)\n",
                verify: (objs) => {
                    const arcs = Object.values(objs).filter(o => o.type === 'arc');
                    const hasSmile = arcs.some(a => Math.hypot(a.cx, a.cy) < 0.05 && Math.abs(a.r - 2.5) < 0.05 && Math.abs(a.startDeg - 200) < 2 && Math.abs(a.sweep - 140) < 2);
                    if (hasSmile) return { ok: true, msg: "Bravissimo! Hai completato il sorriso." };
                    return { ok: false, msg: "Aggiungi bocca = arc(O, 2.5, 200, 140) per disegnare il sorriso." };
                }
            },
            {
                badge: "Archi e stile",
                title: "9. Un arcobaleno colorato con stroke",
                desc: "I 7 colori dell'iride dall'interno verso l'esterno sono: <strong>violetto, indaco, blu, verde, giallo, arancione e rosso</strong>. <strong>Disegna 7 semicerchi concentrici in O(0, -3) con raggi da 1.5 a 4.5 (passo 0.5, da 0° a 180°), usa stroke(nome, 7) su tutti e colora ogni fascia toccando il pallino accanto al numero di riga!</strong>",
                hint: "Tocca il pallino colorato accanto a ciascuna riga (a1..a7) per scegliere i 7 colori dell'iride e aggiungi stroke(..., 7) su tutte e 7 le fasce.",
                solution: "O = point(0, -3)\na1 = arc(O, 1.5, 0, 180)\na2 = arc(O, 2.0, 0, 180)\na3 = arc(O, 2.5, 0, 180)\na4 = arc(O, 3.0, 0, 180)\na5 = arc(O, 3.5, 0, 180)\na6 = arc(O, 4.0, 0, 180)\na7 = arc(O, 4.5, 0, 180)\nstroke(a1, 7)\nstroke(a2, 7)\nstroke(a3, 7)\nstroke(a4, 7)\nstroke(a5, 7)\nstroke(a6, 7)\nstroke(a7, 7)",
                starter: "O = point(0, -3)\na1 = arc(O, 1.5, 0, 180)\na2 = arc(O, 2.0, 0, 180)\na3 = arc(O, 2.5, 0, 180)\na4 = arc(O, 3.0, 0, 180)\na5 = arc(O, 3.5, 0, 180)\na6 = arc(O, 4.0, 0, 180)\na7 = arc(O, 4.5, 0, 180)\nstroke(a1, 7)\nstroke(a2, 7)\nstroke(a3, 7)\nstroke(a4, 7)\nstroke(a5, 7)\nstroke(a6, 7)\nstroke(a7, 7)",
                verify: (objs) => {
                    const arcs = Object.values(objs).filter(o => o.type === 'arc');
                    const radii = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5];
                    const matched = radii.map(r => arcs.find(a => Math.hypot(a.cx, a.cy + 3) < 0.05 && Math.abs(a.r - r) < 0.05 && Math.abs(a.sweep - 180) < 2));
                    const allExist = matched.every(Boolean);
                    const allThick = matched.every(a => a && a.strokeWidth >= 5);
                    const irisGroups = [
                        ['#9333EA', '#7C3AED'],
                        ['#4F46E5'],
                        ['#2563EB', '#0284C7'],
                        ['#16A34A', '#15803D', '#10B981'],
                        ['#EAB308'],
                        ['#F97316'],
                        ['#DC2626', '#FF0000']
                    ];
                    const allIrisColors = matched.every((a, i) => a && a.customColor && irisGroups[i].includes(a.customColor.toUpperCase()));
                    if (allExist && allThick && allIrisColors) {
                        return { ok: true, msg: "Spettacolare! Hai costruito l'arcobaleno completo con tutti e 7 i colori dell'iride nell'ordine corretto!" };
                    }
                    if (allExist && allThick && !allIrisColors) {
                        return { ok: false, msg: "Gli archi hanno il giusto spessore, ma controlla i 7 colori dell'iride dall'interno verso l'esterno: violetto, indaco, blu, verde, giallo, arancione, rosso." };
                    }
                    return { ok: false, msg: "Assicurati che tutti e 7 i semicerchi (raggi 1.5..4.5) abbiano stroke(..., 7) e i 7 colori dell'iride dall'interno verso l'esterno." };
                }
            },
            {
                badge: "Punto medio",
                title: "10. Trova il punto medio con interpolate",
                desc: "Il comando point(interpolate(A, B, 0.5)) calcola il punto a metà tra A e B. <strong>Disegna A(-2, 1), B(4, 3), il segmento s1 e il punto medio M.</strong>",
                hint: "Scrivi M = point(interpolate(A, B, 0.5)) dopo aver creato A e B.",
                solution: "A = point(-2, 1)\nB = point(4, 3)\ns1 = line(A, B)\nM = point(interpolate(A, B, 0.5))",
                starter: "A = point(-2, 1)\nB = point(4, 3)\ns1 = line(A, B)\n",
                verify: (objs) => {
                    const pts = Object.values(objs).filter(o => o.type === 'point');
                    const found = pts.some(p => Math.hypot(p.x - 1, p.y - 2) < 0.05);
                    if (found) return { ok: true, msg: "Esatto! Il punto medio M si trova alle coordinate (1, 2)." };
                    return { ok: false, msg: "Non vedo il punto medio in (1, 2). Usa M = point(interpolate(A, B, 0.5))." };
                }
            },
            {
                badge: "Perpendicolare",
                title: "11. Traccia una linea perpendicolare",
                desc: "Con perp(s1, P) tracci una retta a 90° rispetto a s1 passante per P. <strong>Disegna la base s1 tra A(-3, 0) e B(3, 0), il punto P(1, 0) e la perpendicolare p1 per P.</strong>",
                hint: "Scrivi p1 = perp(s1, P) dopo aver disegnato s1 e P.",
                solution: "A = point(-3, 0)\nB = point(3, 0)\ns1 = line(A, B)\nP = point(1, 0)\np1 = perp(s1, P)",
                starter: "A = point(-3, 0)\nB = point(3, 0)\ns1 = line(A, B)\nP = point(1, 0)\n",
                verify: (objs) => {
                    const lines = Object.values(objs).filter(o => o.type === 'line');
                    const found = lines.some(l => Math.abs(l.x1 - 1) < 0.05 && Math.abs(l.x2 - 1) < 0.05 && Math.abs(l.y2 - l.y1) > 1);
                    if (found) return { ok: true, msg: "Perfetto! Hai tracciato la perpendicolare a s1 in P." };
                    return { ok: false, msg: "Usa p1 = perp(s1, P) per disegnare la retta verticale passante per P(1, 0)." };
                }
            },
            {
                badge: "Parallela",
                title: "12. Traccia una linea parallela",
                desc: "Con parallel(s1, P) tracci una retta parallela a s1 passante per P. <strong>Disegna s1 tra A(-2, -1) e B(3, 1), il punto P(-1, 2) e la parallela r1 per P.</strong>",
                hint: "Scrivi r1 = parallel(s1, P) dopo s1 e P.",
                solution: "A = point(-2, -1)\nB = point(3, 1)\ns1 = line(A, B)\nP = point(-1, 2)\nr1 = parallel(s1, P)",
                starter: "A = point(-2, -1)\nB = point(3, 1)\ns1 = line(A, B)\nP = point(-1, 2)\n",
                verify: (objs) => {
                    const lines = Object.values(objs).filter(o => o.type === 'line');
                    const ok = lines.some(l => {
                        const dx = l.x2 - l.x1;
                        const dy = l.y2 - l.y1;
                        if (Math.hypot(dx, dy) < 1) return false;
                        const slopeMatch = Math.abs(dy / dx - 0.4) < 0.03;
                        const passesP = Math.abs((2 - l.y1) - 0.4 * (-1 - l.x1)) < 0.05;
                        return slopeMatch && passesP;
                    });
                    if (ok) return { ok: true, msg: "Ottimo! La retta parallela passa esattamente per P." };
                    return { ok: false, msg: "Usa parallel(s1, P) per disegnare la retta parallela a s1 passante per P." };
                }
            },
            {
                badge: "Sfida • Compasso",
                title: "13. Triangolo equilatero con compasso",
                desc: "<strong>Costruisci un triangolo equilatero sulla base A(1, 1) e B(5, 1)</strong> usando due circonferenze di raggio AB, trovando il vertice C con intersect(c1, c2, 1) e unendo i lati.",
                hint: "Traccia c1 = arc(A, B, A, 0, 360) e c2 = arc(B, A, B, 0, 360), poi trova C = point(intersect(c1, c2, 1)) e collega AC e BC.",
                solution: "A = point(1, 1)\nB = point(5, 1)\nbase = line(A, B)\nc1 = arc(A, B, A, 0, 360)\nc2 = arc(B, A, B, 0, 360)\nC = point(intersect(c1, c2, 1))\nl1 = line(A, C)\nl2 = line(B, C)",
                starter: "A = point(1, 1)\nB = point(5, 1)\nbase = line(A, B)\n",
                verify: (objs) => {
                    const pts = Object.values(objs).filter(o => o.type === 'point');
                    const lines = Object.values(objs).filter(o => o.type === 'line');
                    const cx = 3;
                    const cy = 1 + 4 * Math.sin(Math.PI / 3);
                    const hasC = pts.some(p => Math.hypot(p.x - cx, p.y - cy) < 0.1 || Math.hypot(p.x - cx, p.y - (1 - 4 * Math.sin(Math.PI / 3))) < 0.1);
                    if (hasC && lines.length >= 3) {
                        return { ok: true, msg: "Capolavoro! Hai eseguito la prima proposizione di Euclide con riga e compasso." };
                    }
                    return { ok: false, msg: "Traccia i due cerchi centrati in A e B, trova la loro intersezione C e disegna i tre lati." };
                }
            },
            {
                badge: "Foglio libero",
                title: "14. Laboratorio creativo",
                desc: "Questo è un foglio bianco a tua completa disposizione. <strong>Sperimenta tutti i comandi che hai imparato per creare la tua costruzione geometrica!</strong>",
                hint: "Prova a combinare point, line, arc, perp, parallel e intersect.",
                solution: "O = point(0, 0)\nc1 = arc(O, 4, 0, 360)\nA = point(4, 0)\nB = point(-4, 0)\ns1 = line(A, B)\np1 = perp(s1, O, 8)",
                starter: "O = point(0, 0)\nc1 = arc(O, 3, 0, 360)\n",
                verify: (objs) => {
                    if (Object.keys(objs).length > 0) {
                        return { ok: true, msg: "Ottimo disegno! Continua a sperimentare sul foglio libero." };
                    }
                    return { ok: false, msg: "Scrivi almeno un comando nell'editor per iniziare a disegnare!" };
                }
            }
        ];
