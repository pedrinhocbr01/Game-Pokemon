/* Story Showdown — efeitos de batalha (DragonBones mini-player em canvas).
 *
 * Player ENXUTO de DragonBones (formato 5.x), só displays de IMAGEM (sem mesh/FFD). Suporta:
 *  - timelines de OSSO: translate / scale / rotate
 *  - timelines de SLOT: color (alpha+tint por canal) e displayFrame (troca de display/sequência)
 *  - multi-display por slot + displayIndex padrão (-1 = oculto)
 *  - múltiplas animações por armadura (escolhe por nome)
 * Sem libs externas (nem Egret/Pixi). Falha em silêncio (nunca quebra a batalha).
 *
 * API:
 *   SSBattleFX.playBattleStart(targetEl)        → b3004 "Batalha Iniciada"
 *   SSBattleFX.playResult(targetEl, win)        → m0014 'shengli' (vitória) / 'shibai' (derrota)
 *   SSBattleFX.play(targetEl, file, animName)   → genérico
 * Ajuste fino (sem rebuild): SSBattleFX.opts = { scale, x, y }.
 */
(function () {
	'use strict';
	var RES = '/old/resource/';
	var REF_W = 640;    // largura de DESIGN (= content-width do jogo original). escala 1 = preenche.
	var LANG_DIR = { pt: 'assets_pt', en: 'assets_en', es: 'assets_sp' };
	function langDir() {
		var l = 'pt';
		try { l = (window.I18n && I18n.getLang && I18n.getLang()) || 'pt'; } catch (e) {}
		return LANG_DIR[l] || LANG_DIR.en || 'assets_pt';
	}

	// scale = multiplicador global; x/y = offsets. resultScale = fator extra do m0014 (resultado),
	// que é uma "tela de resultados" retrato grande → encolhe p/ virar popup centralizado (não tela cheia).
	var SSBattleFX = { opts: { scale: 1, x: 0, y: 0, resultScale: 0.6, resultY: 20, resultX: 0,
		levelScale: 0.72, levelX: 0, levelY: 10, levelYPct: -0.3, levelSeconds: 3, fieldScale: 0.6, fieldX: 0, fieldY: 0 } };
	var caches = {};         // dados compilados por "dir/file"
	var loadings = {};       // Promise em voo
	var tintCache = {};      // canvas tingido por (dir|file|regiao|cor)

	function loadImg(src) {
		return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = src; });
	}
	function load(dir, file) {
		var k = dir + '/' + file;
		if (caches[k]) return Promise.resolve(caches[k]);
		if (loadings[k]) return loadings[k];
		var base = RES + dir + '/bones/effect/' + file;
		loadings[k] = Promise.all([
			fetch(base + '_ske.json').then(function (r) { return r.json(); }),
			fetch(base + '_tex.json').then(function (r) { return r.json(); }),
			loadImg(base + '_tex.png')
		]).then(function (r) { caches[k] = build(r[0], r[1], r[2], k); return caches[k]; });
		return loadings[k];
	}

	function build(ske, tex, image, key) {
		var a = ske.armature[0];
		var fps = a.frameRate || ske.frameRate || 24;
		var bones = (a.bone || []).map(function (b) { return { name: b.name, parent: b.parent || null, t: b.transform || {} }; });
		var skin = (a.skin && a.skin[0]) || { slot: [] };
		var skinBy = {}; (skin.slot || []).forEach(function (sd) { skinBy[sd.name] = sd; });
		// slots em z-order (ordem do array a.slot); cada um com TODOS os displays + índice padrão.
		var slots = (a.slot || []).map(function (s) {
			var sd = skinBy[s.name] || {};
			var displays = (sd.display || []).map(function (d) { return { key: d.path || d.name || '', dt: d.transform || null }; });
			return { name: s.name, parent: s.parent, color: s.color || null, blend: s.blendMode || '',
				di: (s.displayIndex == null ? 0 : s.displayIndex), displays: displays };
		});
		// todas as animações por nome
		var anims = {};
		(a.animation || []).forEach(function (anim) {
			var boneTL = {}; (anim.bone || []).forEach(function (bt) { boneTL[bt.name] = bt; });
			var slotTL = {}; (anim.slot || []).forEach(function (st) { slotTL[st.name] = st; });
			anims[anim.name] = { dur: anim.duration || 1, boneTL: boneTL, slotTL: slotTL };
		});
		var atlas = {}; (tex.SubTexture || []).forEach(function (st) {
			atlas[st.name] = { key: st.name, x: st.x, y: st.y, width: st.width, height: st.height,
				frameX: st.frameX, frameY: st.frameY, frameWidth: st.frameWidth, frameHeight: st.frameHeight };
		});
		return { key: key, fps: fps, bones: bones, slots: slots, anims: anims, atlas: atlas, img: image };
	}

	// ---- matriz afim 2x3 ----
	var D2R = Math.PI / 180;
	function toMat(t) {
		var skx = (t.skX || 0) * D2R, sky = (t.skY || 0) * D2R;
		var scx = (t.scX == null ? 1 : t.scX), scy = (t.scY == null ? 1 : t.scY);
		return { a: Math.cos(sky) * scx, b: Math.sin(sky) * scx, c: -Math.sin(skx) * scy, d: Math.cos(skx) * scy, tx: t.x || 0, ty: t.y || 0 };
	}
	function mul(m, n) {
		return { a: m.a * n.a + m.c * n.b, b: m.b * n.a + m.d * n.b, c: m.a * n.c + m.c * n.d, d: m.b * n.c + m.d * n.d,
			tx: m.a * n.tx + m.c * n.ty + m.tx, ty: m.b * n.tx + m.d * n.ty + m.ty };
	}
	function lerp(x, y, t) { return x + (y - x) * t; }

	// Acha o segmento de frames que contém o tempo f. Retorna {cur, nxt, t} (t=0 se sem tween).
	function sample(frames, f) {
		var start = 0;
		for (var i = 0; i < frames.length; i++) {
			if (i === frames.length - 1) return { cur: frames[i], nxt: frames[i], t: 0 };
			var dur = (frames[i].duration == null) ? 1 : frames[i].duration;
			if (dur > 0 && f < start + dur) {
				var t = (f - start) / dur; if (t < 0) t = 0; if (t > 1) t = 1;
				if (frames[i].tweenEasing == null) t = 0;
				return { cur: frames[i], nxt: frames[i + 1], t: t };
			}
			start += dur;
		}
		return { cur: frames[frames.length - 1], nxt: frames[frames.length - 1], t: 0 };
	}

	function tinted(d, reg, tint) {
		var key = d.key + '|' + reg.key + '|' + Math.round(tint[0] * 100) + ',' + Math.round(tint[1] * 100) + ',' + Math.round(tint[2] * 100);
		if (tintCache[key]) return tintCache[key];
		var c = document.createElement('canvas'); c.width = reg.width; c.height = reg.height;
		var g = c.getContext('2d');
		g.drawImage(d.img, reg.x, reg.y, reg.width, reg.height, 0, 0, reg.width, reg.height);
		g.globalCompositeOperation = 'multiply';
		g.fillStyle = 'rgb(' + Math.round(tint[0] * 255) + ',' + Math.round(tint[1] * 255) + ',' + Math.round(tint[2] * 255) + ')';
		g.fillRect(0, 0, reg.width, reg.height);
		g.globalCompositeOperation = 'destination-in';
		g.drawImage(d.img, reg.x, reg.y, reg.width, reg.height, 0, 0, reg.width, reg.height);
		tintCache[key] = c; return c;
	}

	function renderFrame(d, anim, ctx, root, dpr, f, hide, texts, addTex, images, keep) {
		// ossos
		var world = {};
		for (var i = 0; i < d.bones.length; i++) {
			var b = d.bones[i], t = b.t;
			var lx = t.x || 0, ly = t.y || 0, lskX = t.skX || 0, lskY = t.skY || 0,
				lscX = (t.scX == null ? 1 : t.scX), lscY = (t.scY == null ? 1 : t.scY);
			var tl = anim.boneTL[b.name];
			if (tl) {
				if (tl.translateFrame) { var s = sample(tl.translateFrame, f); lx += lerp(s.cur.x || 0, s.nxt.x || 0, s.t); ly += lerp(s.cur.y || 0, s.nxt.y || 0, s.t); }
				if (tl.scaleFrame) { var s2 = sample(tl.scaleFrame, f); lscX *= lerp(s2.cur.x == null ? 1 : s2.cur.x, s2.nxt.x == null ? 1 : s2.nxt.x, s2.t); lscY *= lerp(s2.cur.y == null ? 1 : s2.cur.y, s2.nxt.y == null ? 1 : s2.nxt.y, s2.t); }
				if (tl.rotateFrame) { var s3 = sample(tl.rotateFrame, f); var r = lerp(s3.cur.rotate || 0, s3.nxt.rotate || 0, s3.t); lskX += r; lskY += r; }
			}
			var lm = toMat({ x: lx, y: ly, skX: lskX, skY: lskY, scX: lscX, scY: lscY });
			world[b.name] = b.parent && world[b.parent] ? mul(world[b.parent], lm) : lm;
		}
		// slots em z-order
		for (var j = 0; j < d.slots.length; j++) {
			var sl = d.slots[j];
			if (hide && hide[sl.name] && !(keep && keep[sl.name])) continue;   // slots ocultados por config (keep sobrepõe)
			var bw = world[sl.parent]; if (!bw) continue;
			var stl = anim.slotTL[sl.name];
			// display ativo (displayFrame sobrepõe o índice padrão; -1 = oculto)
			var idx = sl.di;
			if (stl && stl.displayFrame) { var sd = sample(stl.displayFrame, f); idx = (sd.cur.value == null ? 0 : sd.cur.value); }
			if (idx < 0) continue;
			var disp = sl.displays[idx]; if (!disp) continue;
			var reg = d.atlas[disp.key]; if (!reg) continue;
			// cor/alpha
			var alpha = 1, tint = null;
			if (stl && stl.colorFrame) {
				var sc = sample(stl.colorFrame, f), cv = sc.cur.value || {}, nv = sc.nxt.value || {};
				alpha = lerp(cv.aM == null ? 100 : cv.aM, nv.aM == null ? 100 : nv.aM, sc.t) / 100;
				tint = [lerp(cv.rM == null ? 100 : cv.rM, nv.rM == null ? 100 : nv.rM, sc.t) / 100,
					lerp(cv.gM == null ? 100 : cv.gM, nv.gM == null ? 100 : nv.gM, sc.t) / 100,
					lerp(cv.bM == null ? 100 : cv.bM, nv.bM == null ? 100 : nv.bM, sc.t) / 100];
			} else if (sl.color) {
				var c0 = sl.color; alpha = (c0.aM == null ? 100 : c0.aM) / 100;
				tint = [(c0.rM == null ? 100 : c0.rM) / 100, (c0.gM == null ? 100 : c0.gM) / 100, (c0.bM == null ? 100 : c0.bM) / 100];
			}
			if (keep && keep[sl.name]) { alpha = 1; tint = null; }   // banner que deve FICAR (sem fade): força cheio
			if (alpha <= 0.004) continue;
			if (tint && tint[0] > 0.997 && tint[1] > 0.997 && tint[2] > 0.997) tint = null;
			var dm = disp.dt ? toMat(disp.dt) : { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
			var M = mul(root, mul(bw, dm));
			var fw = reg.frameWidth == null ? reg.width : reg.frameWidth;
			var fh = reg.frameHeight == null ? reg.height : reg.frameHeight;
			var dx = -(reg.frameX || 0) - fw / 2, dy = -(reg.frameY || 0) - fh / 2;
			ctx.setTransform(M.a * dpr, M.b * dpr, M.c * dpr, M.d * dpr, M.tx * dpr, M.ty * dpr);
			ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
			// glow aditivo (preto = invisível): por blendMode 'add' OU por textura forçada (addTex)
			ctx.globalCompositeOperation = (sl.blend === 'add' || (addTex && addTex[disp.key])) ? 'lighter' : 'source-over';
			if (tint) ctx.drawImage(tinted(d, reg, tint), dx, dy, reg.width, reg.height);
			else ctx.drawImage(d.img, reg.x, reg.y, reg.width, reg.height, dx, dy, reg.width, reg.height);
		}
		ctx.globalCompositeOperation = 'source-over';
		// Texto sobreposto (nome + status no level-up), em coords do efeito (escala/posição junto).
		if (texts && texts.length) {
			ctx.setTransform(root.a * dpr, 0, 0, root.d * dpr, root.tx * dpr, root.ty * dpr);
			ctx.globalAlpha = 1; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
			for (var k = 0; k < texts.length; k++) {
				var tx = texts[k];
				ctx.font = (tx.weight || 'bold') + ' ' + (tx.size || 20) + 'px ' + (tx.font || 'Arial, sans-serif');
				ctx.textAlign = tx.align || 'center';
				if (tx.stroke) { ctx.lineWidth = tx.stroke; ctx.strokeStyle = tx.strokeColor || '#000'; ctx.strokeText(tx.s, tx.x || 0, tx.y || 0); }
				ctx.fillStyle = tx.color || '#fff'; ctx.fillText(tx.s, tx.x || 0, tx.y || 0);
			}
		}
		// Imagens sobrepostas (ex.: sprite do pokémon capturado + pokébola), em coords de DESIGN.
		if (images && images.length) {
			ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
			for (var ki = 0; ki < images.length; ki++) {
				var im = images[ki];
				if (!(im && im.img && im.img.complete && im.img.naturalWidth)) continue;
				if (im.natural) {   // tamanho ORIGINAL (CSS px) — só a POSIÇÃO segue a escala/offset do card.
					var niw = im.img.naturalWidth, nih = im.img.naturalHeight;
					if (im.maxW && niw > im.maxW) { var kk = im.maxW / niw; niw = im.maxW; nih = Math.round(nih * kk); }
					var ncx = root.tx + root.a * (im.x || 0), ncy = root.ty + root.d * (im.y || 0);
					ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
					ctx.drawImage(im.img, ncx - niw / 2, ncy - nih / 2, niw, nih);
				} else {
					ctx.setTransform(root.a * dpr, 0, 0, root.d * dpr, root.tx * dpr, root.ty * dpr);
					var iw = im.w || im.img.naturalWidth, ih = im.h || im.img.naturalHeight;
					ctx.drawImage(im.img, (im.x || 0) - iw / 2, (im.y || 0) - ih / 2, iw, ih);
				}
			}
		}
	}

	// Toca `file`/`animName` (de uma pasta de idioma) em cima de targetEl. Resolve quando termina.
	SSBattleFX.play = function (targetEl, file, animName, cfg) {
		cfg = cfg || {};
		return new Promise(function (resolve) {
			try {
				if (!targetEl) { resolve(); return; }
				load(cfg.dir || langDir(), file).then(function (d) {
					try {
						var anim = d.anims[animName] || d.anims[Object.keys(d.anims)[0]];
						if (!anim) { resolve(); return; }
						var host = targetEl;
						var cs = getComputedStyle(host); if (cs.position === 'static') host.style.position = 'relative';
						var w = host.clientWidth, h = host.clientHeight; if (!w || !h) { resolve(); return; }
						var old = host.querySelector('.ss-fx-canvas'); if (old) old.remove();
						var dpr = window.devicePixelRatio || 1;
						var cv = document.createElement('canvas');
						cv.className = 'ss-fx-canvas';
						cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:' + (cfg.z || 40) + ';';
						cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
						host.appendChild(cv);
						var ctx = cv.getContext('2d');
						var o = SSBattleFX.opts || {};
						var s = (w / REF_W) * (o.scale || 1) * (cfg.scaleMul || 1);
						var root = { a: s, b: 0, c: 0, d: s, tx: w / 2 + (o.x || 0) + (cfg.x || 0), ty: h / 2 + (o.y || 0) + (cfg.y || 0) + (cfg.yPct ? cfg.yPct * h : 0) };
						if (cfg.images) cfg.images.forEach(function (im) { if (im && im.src && !im.img) { im.img = new Image(); if (im.srcFallback) { im.img.onerror = function () { if (im.img.__fb) return; im.img.__fb = 1; im.img.onerror = null; im.img.src = im.srcFallback; }; } im.img.src = im.src; } });   // preload (com fallback moderno se o sprite antigo faltar)
						var t0 = null, raf = 0, done = false;
						function cleanup() { if (done) return; done = true; try { cancelAnimationFrame(raf); } catch (e) {} if (cv && cv.parentNode) cv.parentNode.removeChild(cv); resolve(); }
						function tick(ts) {
							if (t0 == null) t0 = ts;
							var elapsed = (ts - t0) / 1000;
							var f = elapsed * d.fps;
							var atEnd = f >= anim.dur;
							var ff = atEnd ? anim.dur - 0.001 : f;   // ao acabar, SEGURA o último frame
							ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
							renderFrame(d, anim, ctx, root, dpr, ff, cfg.hide, cfg.texts, cfg.addTex, cfg.images, cfg.keep);
							// Termina: por tempo máximo (maxSeconds) OU quando a animação acabou e não há
							// tempo máximo p/ segurar. Animação curta + maxSeconds → segura o último frame até lá.
							var timeUp = cfg.maxSeconds && elapsed >= cfg.maxSeconds;
							if (timeUp || (atEnd && !cfg.maxSeconds)) {
								if (cfg.hold) { try { cancelAnimationFrame(raf); } catch (e) {} done = true; resolve(); }   // segura até a cena ser destruída
								else cleanup();
								return;
							}
							raf = requestAnimationFrame(tick);
						}
						raf = requestAnimationFrame(tick);
					} catch (e) { resolve(); }
				}).catch(function () { resolve(); });
			} catch (e) { resolve(); }
		});
	};

	// Slots que formam o CARD de resultado (painel branco + barras de moldura). Escondidos:
	// só mostramos o texto Victory/Derrota (22234/3452) + os brilhos. O usuário não tem conteúdo
	// p/ por dentro do card, então fica só a faixa.
	var RESULT_CARD_HIDE = { '图层 14': 1, '图层 141': 1, '图层 1411': 1, '图层 4': 1, '图层 5': 1, '图层 6': 1 };

	// Level up (m0054): caixa + nome do pokémon + status ganhos. stats = {hp,atk,def,spa,spd,spe} (deltas).
	function statLabel(k) {
		// Rótulos CURTOS no FX (o banner é pequeno) — os nomes completos ficam no log.
		return ({ hp: 'PS', atk: 'Atq', def: 'Def', spa: 'At.Esp', spd: 'Df.Esp', spe: 'Vel' })[k] || k;
	}
	// Escondidos no level-up: card amarelo (box 111/1111) e o FEIXE PRETO (slots d2/d21/d22,
	// textura "d2" — retângulo preto com feixe). A faixa "3" é o painel do nome/nível → MANTÉM.
	var LEVEL_CARD_HIDE = { '111': 1, '1111': 1, 'd2': 1, 'd21': 1, 'd22': 1 };
	// Texturas de glow (fundo PRETO) que devem ser aditivas mesmo sem blendMode no dado —
	// senão o retângulo preto aparece (ex.: slot ef_huan_ghz57_001 sem 'add').
	var LEVEL_ADD_TEX = { 'ef_huan_ghz57_00': 1, '外发光': 1, '111': 1 };
	function buildLevelTexts(name, level, stats) {
		var arr = [];
		// Quem upou: nome + "Nv. X" (abaixo do banner "Nível Aumentado").
		// Nome + "Nv. X" na MESMA linha: nome alinhado à direita (termina antes do centro),
		// nível alinhado à esquerda (começa depois) — ficam lado a lado, centralizados.
		if (name) arr.push({ s: String(name), x: -7, y: -7, size: 19, weight: 'bold', color: '#fff', stroke: 5, strokeColor: '#1b6b2e', align: 'right' });
		if (level) arr.push({ s: 'Nv. ' + level, x: 7, y: -7, size: 16, weight: 'bold', color: '#ffe9a8', stroke: 4, strokeColor: '#5a3d00', align: 'left' });
		// Status ganhos: 3 colunas × 2 linhas, CENTRALIZADOS.
		var order = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'], lines = [];
		if (stats) order.forEach(function (k) { if (stats[k] > 0) lines.push({ k: k, d: stats[k] }); });
		lines.forEach(function (ln, i) {
			var col = i % 3, row = Math.floor(i / 3);
			arr.push({ s: '+' + ln.d + ' ' + statLabel(ln.k), x: (col - 1) * 124, y: 27 + row * 34,
				size: 16, weight: 'bold', color: '#fffbe6', stroke: 4, strokeColor: '#333', align: 'center' });
		});
		return arr;
	}
	SSBattleFX.playLevelUp = function (targetEl, name, level, stats) {
		var o = SSBattleFX.opts;
		// 'animation' (entrada, 21f): banner "Nível Aumentado" + brilho radial. O box (card branco)
		// e o feixe preto (d2) já vêm OCULTOS nessa animação — por isso não aparecem.
		return SSBattleFX.play(targetEl, 'm0054', 'animation', {
			scaleMul: (o.levelScale == null ? 0.55 : o.levelScale), x: o.levelX || 0, y: o.levelY || 0,
			yPct: (o.levelYPct == null ? -0.3 : o.levelYPct), z: 900,   // sobe ~30% (fora da janela de log) e fica ACIMA do z-index dos logs
			maxSeconds: (o.levelSeconds == null ? 3 : o.levelSeconds), hide: LEVEL_CARD_HIDE, addTex: LEVEL_ADD_TEX, texts: buildLevelTexts(name, level, stats)
		});
	};

	// Mudança de clima / campo (m0028): 'animation' = "Mudança Climática" (clima),
	// 'animation1' = "Efeito do Campo de Batalha" (campo/terreno). Texto já embutido (i18n por pasta).
	SSBattleFX.playFieldFx = function (targetEl, isField) {
		var o = SSBattleFX.opts;
		return SSBattleFX.play(targetEl, 'm0028', isField ? 'animation1' : 'animation', {
			scaleMul: (o.fieldScale == null ? 0.6 : o.fieldScale), x: o.fieldX || 0, y: o.fieldY || 0
		});
	};

	SSBattleFX.playBattleStart = function (targetEl) { return SSBattleFX.play(targetEl, 'b3004', 'animation'); };
	// Textos do CARD m0014 (sobre o painel branco; coords de DESIGN, o root aplica a escala).
	function buildResultTexts(rew) {
		var arr = []; if (!rew) return arr;
		var o = SSBattleFX.opts || {}, lines = [];
		(rew.exp || []).forEach(function (e) { var lv = rew.levels && rew.levels[e.name]; lines.push({ s: String(e.name) + '   +' + (e.gain | 0) + ' EXP' + (lv ? '   Nv.' + lv : ''), c: '#2a3550' }); });
		(rew.drops || []).forEach(function (d) { lines.push({ s: String(d.name) + '  x' + (d.amount | 0), c: '#1f6b3a' }); });
		(rew.badges || []).forEach(function (b) { lines.push({ s: String(b), c: '#9a6a10' }); });
		if (rew.silver > 0) lines.push({ s: (rew.silver | 0).toLocaleString('pt-BR') + ' Silver', c: '#9a6a10' });
		var y0 = (o.resultTextY == null ? -120 : o.resultTextY), step = (o.resultTextStep == null ? 38 : o.resultTextStep), size = (o.resultTextSize == null ? 21 : o.resultTextSize);
		lines.slice(0, 8).forEach(function (ln, i) { arr.push({ s: ln.s, x: 0, y: y0 + i * step, size: size, weight: 'bold', color: ln.c, stroke: 3, strokeColor: '#fff', align: 'center' }); });
		return arr;
	}
	// Vitória/derrota. Com recompensa → mostra o card m0014 + escreve os dados nele. Sem → só o banner.
	SSBattleFX.playResult = function (targetEl, win, rewards) {
		var hasRew = win && rewards && ((rewards.exp && rewards.exp.length) || (rewards.drops && rewards.drops.length) || (rewards.badges && rewards.badges.length) || rewards.silver > 0);
		return SSBattleFX.play(targetEl, 'm0014', win ? 'shengli' : 'shibai',
			{ scaleMul: (SSBattleFX.opts.resultScale == null ? 0.6 : SSBattleFX.opts.resultScale), hide: hasRew ? { '3452': 1 } : RESULT_CARD_HIDE, keep: hasRew ? { '22234': 1 } : null, hold: true,
				texts: null,   // os dados (EXP/Silver/itens) são DOM organizado por cima do painel
				x: SSBattleFX.opts.resultX || 0, y: (SSBattleFX.opts.resultY == null ? 20 : SSBattleFX.opts.resultY) });
	};
	// CAPTURA: card m0014 com a SPRITE do pokémon + a POKÉBOLA usada desenhadas no canvas + nome/nível.
	// info = { spriteUrl, ballUrl, name, level, shiny }. Ajuste fino via SSBattleFX.opts.catch*.
	SSBattleFX.playCapture = function (targetEl, info) {
		info = info || {}; var o = SSBattleFX.opts || {};
		var texts = [];
		texts.push({ s: String(info.name || '') + (info.shiny ? ' ★' : ''), x: 0, y: (o.catchNameY == null ? 95 : o.catchNameY), size: 23, weight: 'bold', color: info.shiny ? '#b8860b' : '#1a2433', stroke: 4, strokeColor: '#fff', align: 'center' });
		if (info.level) texts.push({ s: 'Nv. ' + info.level, x: 0, y: (o.catchLvY == null ? 126 : o.catchLvY), size: 16, weight: 'bold', color: '#5a6b86', stroke: 3, strokeColor: '#fff', align: 'center' });
		var imgs = [];
		if (info.spriteUrl) imgs.push({ src: info.spriteUrl, srcFallback: info.spriteFallback || '', x: (o.catchSprX == null ? 0 : o.catchSprX), y: (o.catchSprY == null ? -45 : o.catchSprY), natural: true, maxW: (o.catchSprMax == null ? 200 : o.catchSprMax) });
		if (info.ballUrl) imgs.push({ src: info.ballUrl, x: (o.catchBallX == null ? 64 : o.catchBallX), y: (o.catchBallY == null ? 28 : o.catchBallY), w: 44, h: 44 });
		return SSBattleFX.play(targetEl, 'm0014', 'shengli',
			{ scaleMul: (o.resultScale == null ? 0.6 : o.resultScale), hide: { '3452': 1 }, keep: { '22234': 1 }, hold: true,
				texts: texts, images: imgs, x: o.resultX || 0, y: (o.resultY == null ? 20 : o.resultY) });
	};

	window.SSBattleFX = SSBattleFX;
})();
