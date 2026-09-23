(function () {
	'use strict';

	var BKEY = 'storyrpg-battle';
	var TRAINERS = 'Alexa,Ash,Barry,Bianca,Bonnie,Brendan,Brock,Calem,Cheren,Cilan,Clemont,Cynthia,Dawn,Ethan,Gary,Grimsley,Hilbert,Hilda,Hugh,Iris,Leaf,Lillie,Lucas,Lyra,Mallow,Max,May,Misty,Moon,N,Nate,Paul,Red,Riley,Rosa,Serena,Silver,Solana,Steven,Sun'.split(',');
	var LOOK_TRAINER = { red: 'Red', blue: 'Calem', leaf: 'Leaf', gold: 'Ethan', violet: 'Rosa', night: 'Hilbert' };
	var RANKS = ['Novato', 'Ajudante', 'Treinador', 'Treinador II', 'Instrutor', 'Instrutor II', 'Instrutor III', 'Veterano', 'Elite', 'Campeão'];
	var STARTER_GENS = [
		{ gen: 1, region: 'kanto', name: 'Kanto', ids: ['bulbasaur', 'charmander', 'squirtle'] },
		{ gen: 2, region: 'johto', name: 'Johto', ids: ['chikorita', 'cyndaquil', 'totodile'] },
		{ gen: 3, region: 'hoenn', name: 'Hoenn', ids: ['treecko', 'torchic', 'mudkip'] },
		{ gen: 4, region: 'sinnoh', name: 'Sinnoh', ids: ['turtwig', 'chimchar', 'piplup'] },
		{ gen: 5, region: 'unova', name: 'Unova', ids: ['snivy', 'tepig', 'oshawott'] },
		{ gen: 6, region: 'kalos', name: 'Kalos', ids: ['chespin', 'fennekin', 'froakie'] },
		{ gen: 7, region: 'alola', name: 'Alola', ids: ['rowlet', 'litten', 'popplio'] },
		{ gen: 8, region: 'galar', name: 'Galar', ids: ['grookey', 'scorbunny', 'sobble'] },
		{ gen: 9, region: 'paldea', name: 'Paldea', ids: ['sprigatito', 'fuecoco', 'quaxly'] }
	];
	var NPC_NAMES = ['Clara', 'Davi', 'Luna', 'Heitor', 'Nina', 'Caio', 'Maya', 'Otto'];

	var battle = null;
	var pickItem = null;
	var boxUid = null;
	var authMode = 'login';
	var homePane = '';
	var battlePane = 'move';
	var marketTab = 'potion';
	var globalTab = 'item';
	var donateTab = 'packs';
	var marketQuery = '';
	var marketQty = {};
	var MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
	var PASS_REWARDS = [
		{ lv: 2, text: '2.000 Silver', silver: 2000 },
		{ lv: 4, text: '5 Poké Bolas', item: 'pokeball', n: 5 },
		{ lv: 6, text: '3 Poções', item: 'potion', n: 3 },
		{ lv: 8, text: '1 Grande Bola', item: 'greatball', n: 1 },
		{ lv: 10, text: '8.000 Silver', silver: 8000 }
	];

	function esc(s) {
		return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}
	function money(n) { return Number(n || 0).toLocaleString('pt-BR'); }
	function toast(text) {
		var box = document.getElementById('toasts');
		var el = document.createElement('div');
		el.className = 'toast';
		el.textContent = text;
		box.appendChild(el);
		setTimeout(function () { el.remove(); }, 3200);
	}
	function route() {
		var m = (location.hash || '').match(/^#\/([a-z]+)/);
		return m ? m[1] : 'inicio';
	}
	function goto(name) {
		var next = '#/' + name;
		if (location.hash === next) renderView();
		else location.hash = next;
	}
	function trainerKey(ch) {
		if (!ch) return 'Red';
		if (typeof ch === 'string') return LOOK_TRAINER[ch] || ch;
		if (ch.trainer) return ch.trainer;
		return LOOK_TRAINER[ch.look] || 'Red';
	}
	var WALK_FEMALE = { Alexa: 1, Bianca: 1, Bonnie: 1, Cynthia: 1, Dawn: 1, Hilda: 1, Iris: 1, Leaf: 1, Lillie: 1, Lyra: 1, Mallow: 1, May: 1, Misty: 1, Moon: 1, Rosa: 1, Serena: 1, Solana: 1 };
	var WALK_ROW = { down: 0, left: 1, right: 2, up: 3 };
	function walkMeta(ch) {
		if (ch && ch.skin && ch.skin.file) {
			return { folder: 'skins', id: ch.skin.file, url: 'assets/rpg-images/skins/' + ch.skin.file };
		}
		if (ch && ch.skin && ch.skin.folder) {
			return { folder: ch.skin.folder, id: ch.skin.id, url: 'assets/rpg-images/charsprites/' + ch.skin.folder + '/sprite_' + ch.skin.id + '.png' };
		}
		var key = trainerKey(ch);
		var folder = WALK_FEMALE[key] ? 'female' : 'male';
		var n = 0;
		for (var i = 0; i < key.length; i++) n = (n + key.charCodeAt(i) * (i + 1)) % 38;
		return { folder: folder, id: n, url: 'assets/rpg-images/charsprites/' + folder + '/sprite_' + n + '.png' };
	}
	function applySheet(el, url, frame, dir) {
		if (!el) return;
		el.style.backgroundImage = 'url(\'' + url + '\')';
		el.style.backgroundPosition = (-(frame || 0) * 48) + 'px ' + (-(WALK_ROW[dir] || 0) * 48) + 'px';
	}
	function fig(ch, size) {
		var full = size >= 90;
		var key = encodeURIComponent(trainerKey(ch));
		var src = full
			? 'assets/brand/trainers/' + key + '.png?v=3'
			: 'assets/rpg-images/characters/' + key + '/Thumb.png';
		return '<img class="trainer-img' + (full ? ' full' : '') + '" alt="" width="' + size + '" height="' + size + '" src="' + src + '">';
	}
	function species(mon) { return window.Catalog.byId[mon.species]; }
	function spriteTag(mon, size, kind) {
		var sp = species(mon);
		if (!sp) return '';
		var k = kind || (size <= 48 ? 'icon' : 'front');
		return '<img class="sprite" alt="" width="' + size + '" height="' + size + '" src="' + window.Catalog.sprite(mon.species, mon.shiny, k) + '" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'ph\',textContent:\'#' + sp.num + '\'}))">';
	}
	function ensureMoves(mon) {
		if (!mon || (mon.moves && mon.moves.length)) return;
		var sp = species(mon);
		if (sp) mon.moves = window.Catalog.movesFor(sp);
	}
	function itemRecord(id) {
		var key = window.Donate && window.Donate.keysById[id];
		if (key) return { id: id, name: key.name, cat: 'key', icon: key.icon, desc: 'Abre a ' + key.box + '.' };
		if (window.Shop && window.Shop.byId[id]) return window.Shop.byId[id];
		var info = window.Catalog.items[id];
		if (!info) return null;
		return { id: id, name: info.name, cat: info.cat, catch: info.catch, price: info.price, cur: 'silver', iconStyle: '' };
	}
	function itemArt(id) {
		var src = window.Catalog.itemIcon(id);
		return src ? '<img class="item-ico" alt="" src="' + src + '">' : '';
	}
	function listings() { return window.Store.listings(); }
	function newId() {
		return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
	}
	function giveMon(ch, mon) {
		if (ch.team.length < 6) ch.team.push(mon);
		else ch.box.push(mon);
		ch.seen[mon.species] = true;
		ch.caught[mon.species] = true;
		return ch.team.indexOf(mon) >= 0 ? 'time' : 'box';
	}
	function takeMon(ch, uid) {
		if (ch.team.length + ch.box.length <= 1) return null;
		var i = ch.team.findIndex(function (m) { return m.uid === uid; });
		if (i >= 0) return ch.team.splice(i, 1)[0];
		i = ch.box.findIndex(function (m) { return m.uid === uid; });
		if (i >= 0) return ch.box.splice(i, 1)[0];
		return null;
	}
	function payListing(buyer, seller, cur, price) {
		if (cur === 'gold') {
			if ((buyer.gold || 0) < price) return 'Gold insuficiente.';
			buyer.gold -= price;
			if (seller) seller.gold = (seller.gold || 0) + price;
			return '';
		}
		if ((buyer.silver || 0) < price) return 'Silver insuficiente.';
		buyer.silver -= price;
		if (seller) seller.silver = (seller.silver || 0) + price;
		return '';
	}
	function globalItemForm(ch) {
		var ids = Object.keys(ch.bag).filter(function (id) { return (ch.bag[id] || 0) > 0 && itemRecord(id); });
		if (!ids.length) return '<h3>Anunciar item</h3><p class="help">Sua bolsa não tem itens para anunciar.</p>';
		var options = ids.map(function (id) {
			return '<option value="' + esc(id) + '">' + esc(itemRecord(id).name) + ' · x' + ch.bag[id] + '</option>';
		}).join('');
		return '<h3>Anunciar item</h3><form class="global-form" data-act="global-list-item">' +
			'<select class="field" name="item">' + options + '</select>' +
			'<input class="field" name="qty" inputmode="numeric" placeholder="Quantidade" value="1">' +
			'<input class="field" name="price" inputmode="numeric" placeholder="Preço">' +
			'<select class="field" name="cur"><option value="silver">Silver</option><option value="gold">Gold</option></select>' +
			'<button class="btn" type="submit">Anunciar</button></form>';
	}
	function globalMonForm(ch) {
		if (ch.team.length + ch.box.length <= 1) return '<h3>Anunciar Pokémon</h3><p class="help">Você precisa ficar com pelo menos um Pokémon.</p>';
		var options = ch.team.map(function (m, i) {
			return '<option value="' + esc(m.uid) + '">Time · ' + esc(m.name) + ' Nv.' + m.level + (i === 0 ? ' (principal)' : '') + '</option>';
		}).join('') + ch.box.map(function (m) {
			return '<option value="' + esc(m.uid) + '">Box · ' + esc(m.name) + ' Nv.' + m.level + '</option>';
		}).join('');
		return '<h3>Anunciar Pokémon</h3><form class="global-form" data-act="global-list-mon">' +
			'<select class="field" name="uid">' + options + '</select>' +
			'<input class="field" name="price" inputmode="numeric" placeholder="Preço">' +
			'<select class="field" name="cur"><option value="silver">Silver</option><option value="gold">Gold</option></select>' +
			'<button class="btn" type="submit">Anunciar</button></form>';
	}
	function vipDays(ch) {
		if (!ch || !ch.vipUntil || ch.vipUntil <= Date.now()) return 0;
		return Math.ceil((ch.vipUntil - Date.now()) / 86400000);
	}
	function addVip(ch, days) {
		var now = Date.now();
		var base = ch.vipUntil && ch.vipUntil > now ? ch.vipUntil : now;
		ch.vipUntil = base + days * 86400000;
	}
	function ensureDonate(ch) {
		if (typeof ch.recharged !== 'number') ch.recharged = 0;
		if (!ch.donateClaims) ch.donateClaims = [];
		if (!ch.donatePacks) ch.donatePacks = [];
		if (!ch.skins) ch.skins = {};
	}
	function skinMods(ch) {
		var skins = (ch && ch.skins) || {};
		var walk = (ch && ch.skin && ch.skin.buffs) || {};
		return {
			silver: (skins.rayquaza ? 0.02 : 0) + (skins.naruto ? 0.02 : 0) + (walk.silver || 0),
			legend: (skins.rayquaza ? 0.01 : 0) + (skins.naruto ? 0.02 : 0) + (walk.legend || 0),
			shiny: (skins.rayquaza ? 0.01 : 0) + (skins.naruto ? 0.04 : 0) + (walk.shiny || 0),
			xp: (skins.rayquaza ? 0.03 : 0) + (walk.xp || 0),
			catch: skins.naruto ? 0.06 : 0
		};
	}
	function skinBuffsHtml(buffs) {
		if (!buffs) return '';
		var bits = [];
		if (buffs.silver) bits.push('+' + Math.round(buffs.silver * 100) + '% Silver');
		if (buffs.xp) bits.push('+' + Math.round(buffs.xp * 100) + '% EXP');
		if (buffs.shiny) bits.push('+' + Math.round(buffs.shiny * 100) + '% Shiny');
		if (buffs.legend) bits.push('+' + Math.round(buffs.legend * 100) + '% Lenda');
		if (!bits.length) return '';
		return '<div class="skin-buffs">' + bits.map(function (text) { return '<span>' + text + '</span>'; }).join('') + '</div>';
	}
	window.skinCatchBonus = function () {
		var ch = window.Store && window.Store.char();
		return ch ? skinMods(ch).catch : 0;
	};
	function compact(n) {
		if (n >= 1000000) {
			var m = Math.round((n / 1000000) * 10) / 10;
			return (m % 1 ? String(m) : String(m)) + 'kk';
		}
		if (n >= 1000) {
			var k = Math.round((n / 1000) * 10) / 10;
			return (k % 1 ? String(k) : String(k)) + 'k';
		}
		return String(n);
	}
	function grantParts(ch, parts) {
		ensureDonate(ch);
		(parts || []).forEach(function (p) {
			if (p.kind === 'gold') ch.gold = (ch.gold || 0) + p.n;
			else if (p.kind === 'silver') ch.silver = (ch.silver || 0) + p.n;
			else if (p.kind === 'vip') addVip(ch, p.n);
			else if (p.kind === 'item' || p.kind === 'key') ch.bag[p.id] = (ch.bag[p.id] || 0) + p.n;
			else if (p.kind === 'skin') ch.skins[p.id] = true;
		});
	}
	function donateChip(part) {
		if (part.kind === 'gold') return '<span class="dchip"><img alt="" src="assets/brand/menu/coin-gold.png?v=1">' + compact(part.n) + '</span>';
		if (part.kind === 'silver') return '<span class="dchip"><img alt="" src="assets/brand/menu/coin-silver.png?v=1">' + compact(part.n) + '</span>';
		if (part.kind === 'vip') return '<span class="dchip"><img class="vip" alt="" src="assets/old/images/vip.gif">' + part.n + 'd</span>';
		if (part.kind === 'key') {
			var key = window.Donate.keysById[part.id];
			return '<span class="dchip" title="' + esc(key ? key.name : part.id) + '"><img alt="" src="' + (key ? key.icon : '') + '">' + part.n + 'x</span>';
		}
		if (part.kind === 'skin') {
			var skin = window.Donate.skinsById[part.id];
			return '<span class="dchip" title="' + esc(skin ? skin.name : part.id) + '"><img class="skin" alt="" src="' + (skin ? skin.icon : '') + '">1</span>';
		}
		var rpg = window.RpgItems && window.RpgItems[part.id];
		var icon = rpg && rpg.icon
			? '<img alt="" src="assets/sprites/itemicons/' + rpg.icon + '.png">'
			: itemGlyph(part.id);
		var info = itemRecord(part.id);
		return '<span class="dchip" title="' + esc(info ? info.name : part.id) + '">' + icon + part.n + 'x</span>';
	}
	function caseIcon(prize) {
		if (prize.kind === 'silver') return '<img alt="" src="assets/brand/menu/coin-silver.png?v=1">';
		if (prize.kind === 'mon') return '<img alt="" src="' + window.Catalog.sprite(prize.species, prize.shiny, 'icon') + '">';
		var rpg = window.RpgItems && window.RpgItems[prize.item];
		if (rpg && rpg.icon) return '<img alt="" src="assets/sprites/itemicons/' + rpg.icon + '.png">';
		return itemGlyph(prize.item);
	}
	function caseCard(prize) {
		return '<div class="cs-card ' + prize.rarity + '"><div class="cs-card-ic">' + caseIcon(prize) + '</div><div class="cs-card-lb">' + esc(prize.label) + '</div></div>';
	}
	function applyCasePrize(ch, prize) {
		if (prize.kind === 'silver') {
			ch.silver += prize.n;
			return prize.label + ' entrou na conta.';
		}
		if (prize.kind === 'item') {
			ch.bag[prize.item] = (ch.bag[prize.item] || 0) + prize.n;
			return prize.label + ' foi para a bolsa.';
		}
		if (!window.Catalog.byId[prize.species]) {
			ch.silver += 50000;
			return 'A caixa devolveu 50.000 Silver.';
		}
		var mon = window.Catalog.makeMon(prize.species, prize.level, { shiny: prize.shiny });
		var where = giveMon(ch, mon);
		return mon.name + (mon.shiny ? ' shiny' : '') + ' foi para ' + (where === 'time' ? 'o time.' : 'a box.');
	}
	function openCase(keyId) {
		var ch = window.Store.char();
		var meta = window.Donate.keysById[keyId];
		if (!meta || !(ch.bag[keyId] > 0) || document.getElementById('case-mask')) return;
		if (battle) return toast('Termine a batalha antes de abrir uma chave.');
		ch.bag[keyId] -= 1;
		if (!ch.bag[keyId]) delete ch.bag[keyId];
		var prize = window.Cases.roll(keyId);
		var noteText = applyCasePrize(ch, prize);
		window.Store.persist();
		var cards = [];
		var winAt = 34;
		for (var i = 0; i < 42; i++) cards.push(i === winAt ? prize : window.Cases.roll(keyId));
		var mask = document.createElement('div');
		mask.id = 'case-mask';
		mask.className = 'cs-mask';
		mask.innerHTML = '<p class="cs-title">' + esc(meta.box) + '</p>' +
			'<div class="cs-roul"><div class="cs-roul-sel"></div><div class="cs-roul-strip">' + cards.map(caseCard).join('') + '</div></div>' +
			'<button type="button" class="btn" id="case-skip">Pular</button>' +
			'<div class="cs-result" hidden><b>' + esc(prize.label) + '</b><small>' + esc(window.Cases.rarityName[prize.rarity] || '') + '</small><p>' + esc(noteText) + '</p>' +
			'<button type="button" class="btn gold" id="case-close">Fechar</button></div>';
		document.body.appendChild(mask);
		var strip = mask.querySelector('.cs-roul-strip');
		var roul = mask.querySelector('.cs-roul');
		var step = 96;
		var end = roul.clientWidth / 2 - (winAt * step + step / 2);
		var start = end + step * 22;
		strip.style.transform = 'translateX(' + start + 'px)';
		var finished = false;
		function finish() {
			if (finished) return;
			finished = true;
			strip.style.transition = 'none';
			strip.style.transform = 'translateX(' + end + 'px)';
			mask.querySelector('#case-skip').hidden = true;
			mask.querySelector('.cs-result').hidden = false;
			updateChrome();
		}
		requestAnimationFrame(function () {
			requestAnimationFrame(function () {
				strip.style.transition = 'transform 4.4s cubic-bezier(.08,.75,.12,1)';
				strip.style.transform = 'translateX(' + end + 'px)';
			});
		});
		strip.addEventListener('transitionend', finish);
		mask.querySelector('#case-skip').addEventListener('click', finish);
		mask.querySelector('#case-close').addEventListener('click', function () {
			mask.remove();
			renderView();
		});
	}
	function itemGlyph(id) {
		var info = itemRecord(id);
		if (!info) return '';
		var style = info.iconStyle || (window.Shop ? window.Shop.iconStyle(info) : '');
		return '<span class="item-sheet" style="' + style + '"></span>';
	}
	function sceneBlock(src, inner) {
		return '<div class="scene" style="background-image:url(\'' + src + '\')"><div class="scene-card">' + inner + '</div></div>';
	}
	function typesHtml(types) {
		return '<span class="types">' + types.map(function (t) {
			return '<span class="type" style="background:' + (window.Catalog.typeColor[t] || '#888') + '">' + esc(window.Catalog.typePt[t] || t) + '</span>';
		}).join('') + '</span>';
	}
	function hpClass(mon) {
		var r = mon.hp / mon.maxHp;
		return r <= 0.25 ? 'low' : (r <= 0.5 ? 'mid' : '');
	}
	function hpBar(mon) {
		var pct = Math.max(0, Math.round((mon.hp / mon.maxHp) * 100));
		return '<div class="hp ' + hpClass(mon) + '" title="' + mon.hp + '/' + mon.maxHp + '"><span style="width:' + pct + '%"></span></div>';
	}
	function rankIndex(ch) { return Math.min(RANKS.length - 1, (ch.badges || []).length); }
	function rankLabel(ch) { return '(' + ch.badges.length + ') ' + RANKS[rankIndex(ch)]; }
	function regionBadges(ch) {
		return ch.badges.filter(function (b) { return b.indexOf(ch.region + ':') === 0; }).length;
	}
	function dexPct(ch) {
		var total = window.Catalog.list.length || 1;
		var n = Object.keys(ch.caught || {}).length;
		var pct = Math.floor((n / total) * 100);
		return n > 0 && pct === 0 ? '<1%' : pct + '%';
	}
	function alive(ch) { return ch.team.some(function (m) { return m.hp > 0; }); }
	function dayKey() { return new Date().toISOString().slice(0, 10); }
	function monthKey() {
		var d = new Date();
		return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
	}
	function pickMissionMon(region, used) {
		var pool = window.Catalog.inRegion(region).filter(function (s) {
			if (!s.eggGroups || s.eggGroups.indexOf('Undiscovered') >= 0 || used[s.id]) return false;
			var bst = s.baseStats.hp + s.baseStats.atk + s.baseStats.def + s.baseStats.spa + s.baseStats.spd + s.baseStats.spe;
			return bst < 500;
		});
		if (!pool.length) pool = window.Catalog.inRegion(region);
		return pool[Math.floor(Math.random() * pool.length)];
	}
	function ensureMissions(ch) {
		if (!ch.missions || ch.missions.day !== dayKey()) {
			var used = {};
			var a = pickMissionMon(ch.region, used); used[a.id] = true;
			var b = pickMissionMon(ch.region, used); used[b.id] = true;
			var c = pickMissionMon(ch.region, used);
			ch.missions = {
				day: dayKey(),
				list: [
					{ kind: 'defeat', species: a.id, title: 'Derrotar ' + a.name, text: 'Encontre ' + a.name + ' na região e vença a batalha.', need: 3, progress: 0, xp: 100, awarded: false },
					{ kind: 'catch', species: '', title: 'Capturar Pokémon', text: 'Capture Pokémon selvagens hoje.', need: 2, progress: 0, xp: 150, awarded: false },
					{ kind: 'defeat', species: b.id, title: 'Derrotar ' + b.name, text: 'Vença ' + b.name + ' para treinar o time.', need: 2, progress: 0, xp: 100, awarded: false },
					{ kind: 'catch', species: c.id, title: 'Capturar ' + c.name, text: 'Ache um ' + c.name + ' e capture.', need: 1, progress: 0, xp: 150, awarded: false },
					{ kind: 'shiny', species: '', title: 'Capturar shiny', text: 'Capture um Pokémon shiny.', need: 1, progress: 0, xp: 350, awarded: false }
				]
			};
			window.Store.persist();
		}
		return ch.missions;
	}
	function ensurePass(ch) {
		var month = monthKey();
		if (!ch.pass || ch.pass.month !== month) ch.pass = { month: month, xp: 0, claimed: [] };
		return ch.pass;
	}
	function passLevel(ch) { return Math.min(10, Math.floor(ensurePass(ch).xp / 100) + 1); }
	function addPassXp(ch, n) {
		var pass = ensurePass(ch);
		var before = Math.floor(pass.xp / 100);
		pass.xp = Math.min(1000, pass.xp + n);
		if (Math.floor(pass.xp / 100) > before) toast('Passe subiu para o nível ' + passLevel(ch) + '.');
	}
	function progressMission(ch, kind, species, shiny) {
		ensureMissions(ch).list.forEach(function (m) {
			if (m.awarded) return;
			var ok = (m.kind === 'defeat' && kind === 'defeat' && m.species === species) ||
				(m.kind === 'catch' && kind === 'catch' && (!m.species || m.species === species)) ||
				(m.kind === 'shiny' && kind === 'catch' && shiny);
			if (!ok) return;
			m.progress = Math.min(m.need, m.progress + 1);
			if (m.progress >= m.need) {
				m.awarded = true;
				addPassXp(ch, m.xp);
				toast(m.title + ' completa. +' + m.xp + ' XP no passe.');
			}
		});
	}
	function renewIn() {
		var now = new Date();
		var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
		var ms = next - now;
		return Math.floor(ms / 3600000) + 'h ' + Math.floor((ms % 3600000) / 60000) + 'm';
	}
	function passEnds() {
		var now = new Date();
		var end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
		var ms = Math.max(0, end - now);
		return Math.floor(ms / 86400000) + 'd ' + Math.floor((ms % 86400000) / 3600000) + 'h';
	}
	function quests(ch) {
		var day = new Date().toISOString().slice(0, 10);
		if (!ch.quests || ch.quests.day !== day) {
			ch.quests = { day: day, wins: 0, catches: 0, winClaimed: false, catchClaimed: false };
			window.Store.persist();
		}
		return ch.quests;
	}
	function note(ch, text) {
		ch.notes = ch.notes || [];
		ch.notes.unshift({ text: text, read: false, t: Date.now() });
		ch.notes = ch.notes.slice(0, 12);
	}
	function syncMon(mon) {
		var st = window.Catalog.stats(mon.species, mon.level);
		if (mon.maxHp !== st.hp) {
			var ratio = mon.maxHp ? mon.hp / mon.maxHp : 1;
			mon.maxHp = st.hp;
			mon.hp = Math.max(0, Math.round(st.hp * ratio));
		}
	}
	function gainExp(ch, mon, amount) {
		var lines = [];
		mon.exp += amount;
		while (mon.level < 100 && mon.exp >= mon.level * 40) {
			mon.exp -= mon.level * 40;
			mon.level += 1;
			var st = window.Catalog.stats(mon.species, mon.level);
			var missing = mon.maxHp - mon.hp;
			mon.maxHp = st.hp;
			mon.hp = Math.max(1, mon.maxHp - missing);
			lines.push(mon.name + ' subiu para o nível ' + mon.level + '.');
			var evo = window.Catalog.evolution(mon);
			if (evo) {
				lines.push(mon.name + ' evoluiu para ' + evo.name + '!');
				mon.species = evo.id;
				mon.name = evo.name;
				mon.moves = window.Catalog.movesFor(evo);
				ch.seen[evo.id] = true;
				ch.caught[evo.id] = true;
				syncMon(mon);
			}
		}
		ch.xp += Math.floor(amount / 2);
		while (ch.xp >= ch.tLevel * 100 && ch.tLevel < 100) {
			ch.xp -= ch.tLevel * 100;
			ch.tLevel += 1;
			lines.push('Você alcançou o nível de treinador ' + ch.tLevel + '.');
		}
		return lines;
	}
	var SAFARI = [
		{ id: 'cemiterio', name: 'Cemitério', types: ['Ghost', 'Dark', 'Poison'], file: 'map upgrade/cemiterio.png' },
		{ id: 'subaquatica', name: 'Subaquática', types: ['Water'], file: 'map upgrade/subaquatico.png' },
		{ id: 'praia', name: 'Praia', types: ['Water', 'Ice'], file: 'map upgrade/praia.png' },
		{ id: 'dojo', name: 'Dojo', types: ['Fighting'], file: 'map upgrade/dojo.png' },
		{ id: 'lavagrot', name: 'Lavagrot', types: ['Fire', 'Dragon'], file: 'map upgrade/lavagrot.png' },
		{ id: 'gruta', name: 'Gruta', types: ['Rock', 'Ground', 'Steel'], file: 'map upgrade/gruta.png' },
		{ id: 'grama', name: 'Grama', types: ['Grass', 'Bug', 'Fairy'], file: 'map upgrade/grama.png' },
		{ id: 'vulcao', name: 'Vulcão', types: ['Fire', 'Rock'], file: 'map upgrade/vulcão.png' },
		{ id: 'campo', name: 'Campo', types: ['Normal', 'Flying', 'Electric'], file: 'map upgrade/campo.png' },
		{ id: 'arena', name: 'Arena', types: ['Fighting'], file: 'map upgrade/arena.png' },
		{ id: 'cripta', name: 'Cripta', types: ['Ghost', 'Psychic'], file: 'map upgrade/cripta.png' },
		{ id: 'aco', name: 'Aço', types: ['Steel', 'Electric'], file: 'map upgrade/metal aço.png' },
		{ id: 'ilha', name: 'Ilha', types: ['Grass', 'Water', 'Ground'], file: 'map upgrade/novo.png' }
	];
	var safari = null;

	function safariById(id) {
		for (var i = 0; i < SAFARI.length; i++) if (SAFARI[i].id === id) return SAFARI[i];
		return SAFARI[0];
	}
	function mapFile(map) {
		return 'assets/rpg-images/maps/' + String(map.file).split('/').map(encodeURIComponent).join('/');
	}
	function typeMatch(sp, types) {
		for (var i = 0; i < sp.types.length; i++) if (types.indexOf(sp.types[i]) >= 0) return true;
		return false;
	}
	function mapPool(map, region) {
		var all = window.Catalog.inRegion(region);
		var normal = [];
		var legends = [];
		all.forEach(function (s) {
			if (!typeMatch(s, map.types)) return;
			if (window.Catalog.isLegendary(s)) legends.push(s);
			else normal.push(s);
		});
		return { normal: normal, legends: legends };
	}
	function rollSafari() {
		var ch = window.Store.char();
		var map = safariById(safari.id);
		var pools = mapPool(map, ch.region);
		var mods = skinMods(ch);
		var regLegends = window.Catalog.inRegion(ch.region).filter(function (s) { return window.Catalog.isLegendary(s); });
		var availableLegends = pools.legends.length ? pools.legends : regLegends;
		var rare = availableLegends.length && Math.random() < (1 / 35) + mods.legend;
		var pool = rare ? availableLegends : pools.normal;
		if (!pool.length) pool = pools.normal.length ? pools.normal : availableLegends;
		if (!pool.length) pool = window.Catalog.inRegion(ch.region).filter(function (s) { return !window.Catalog.isLegendary(s); });
		if (!pool.length) pool = window.Catalog.list.slice(0, 151);

		var sp;
		if (rare || pool.length <= 3) {
			sp = pool[Math.floor(Math.random() * pool.length)];
		} else {
			var unevolved = pool.filter(function (s) { return !s.prevo; });
			var stage1 = pool.filter(function (s) { return s.prevo && s.evos && s.evos.length; });
			var finalStage = pool.filter(function (s) { return s.prevo && (!s.evos || !s.evos.length); });
			var roll = Math.random();
			if (roll < 0.65 && unevolved.length) {
				sp = unevolved[Math.floor(Math.random() * unevolved.length)];
			} else if (roll < 0.90 && stage1.length) {
				sp = stage1[Math.floor(Math.random() * stage1.length)];
			} else if (finalStage.length) {
				sp = finalStage[Math.floor(Math.random() * finalStage.length)];
			} else {
				sp = pool[Math.floor(Math.random() * pool.length)];
			}
		}

		var lead = ch.team.filter(function (m) { return m.hp > 0; })[0] || ch.team[0];
		var baseLv = lead ? lead.level : Math.max(3, 4 + ch.tLevel * 2);
		var legendary = window.Catalog.isLegendary(sp);
		var level = legendary
			? Math.max(2, Math.min(100, baseLv + 6 + Math.floor(Math.random() * 5)))
			: Math.max(2, Math.min(100, baseLv - 1 + Math.floor(Math.random() * 4)));
		safari.enc = {
			id: sp.id, name: sp.name, level: level,
			shiny: Math.random() < (1 / 128) + mods.shiny,
			legendary: legendary,
			types: sp.types
		};
	}
	function layoutSafari() {
		var stage = document.getElementById('safari-stage');
		var map = document.getElementById('safari-map');
		if (!stage || !map || !safari || !map.naturalWidth) return;
		var z = safari.zoom || 1;
		var sw = stage.clientWidth;
		var sh = stage.clientHeight;
		var mw = map.naturalWidth * z;
		var mh = map.naturalHeight * z;
		map.style.width = mw + 'px';
		map.style.height = mh + 'px';
		var px = safari.x * z;
		var py = safari.y * z;
		var left = sw / 2 - px;
		var top = sh / 2 - py;
		if (mw > sw) left = Math.min(0, Math.max(sw - mw, left));
		else left = (sw - mw) / 2;
		if (mh > sh) top = Math.min(0, Math.max(sh - mh, top));
		else top = (sh - mh) / 2;
		map.style.left = left + 'px';
		map.style.top = top + 'px';
		function pin(id, ox, oy) {
			var el = document.getElementById(id);
			if (!el) return;
			el.style.left = (left + px + ox) + 'px';
			el.style.top = (top + py + oy) + 'px';
		}
		pin('safari-hero', 0, 0);
		var behind = { down: [0, -42], up: [0, 40], left: [40, 0], right: [-40, 0] }[safari.dir || 'down'];
		pin('safari-lead', behind[0], behind[1]);
		applyActors();
	}
	function applyActors() {
		var ch = window.Store.char();
		if (!ch || !safari) return;
		applySheet(document.getElementById('safari-hero'), walkMeta(ch).url, safari.frame, safari.dir || 'down');
		var lead = ch.team.filter(function (m) { return m.hp > 0; })[0] || ch.team[0];
		if (lead) applySheet(document.getElementById('safari-lead'), window.Catalog.sprite(lead.species, lead.shiny, 'overworld'), safari.frame, safari.dir || 'down');
	}
	var ENC_KEY = 'storyrpg-enc-ui';
	function encUi() {
		try { return JSON.parse(localStorage.getItem(ENC_KEY)) || {}; }
		catch (e) { return {}; }
	}
	function saveEncUi(ui) { localStorage.setItem(ENC_KEY, JSON.stringify(ui)); }
	function applyEncFrame() {
		var box = document.getElementById('safari-enc');
		if (!box) return;
		var ui = encUi();
		var scale = ui.scale || 1;
		if (scale < 0.75) scale = 0.75;
		if (scale > 1.7) scale = 1.7;
		box.style.setProperty('--enc', String(scale));
		if (ui.left == null || ui.top == null) {
			box.style.left = '16px';
			box.style.top = 'auto';
			box.style.bottom = '28px';
			return;
		}
		box.style.bottom = 'auto';
		var left = Math.max(8, Math.min(Math.max(8, window.innerWidth - box.offsetWidth - 8), ui.left));
		var top = Math.max(8, Math.min(Math.max(8, window.innerHeight - box.offsetHeight - 8), ui.top));
		box.style.left = left + 'px';
		box.style.top = top + 'px';
	}
	function bindEncDrag() {
		var box = document.getElementById('safari-enc');
		if (!box || box.dataset.drag) return;
		box.dataset.drag = '1';
		box.addEventListener('pointerdown', function (e) {
			if (e.target.closest('button')) return;
			var rect = box.getBoundingClientRect();
			var ox = e.clientX - rect.left;
			var oy = e.clientY - rect.top;
			box.classList.add('dragging');
			if (box.setPointerCapture) box.setPointerCapture(e.pointerId);
			function move(ev) {
				var left = ev.clientX - ox;
				var top = ev.clientY - oy;
				left = Math.max(8, Math.min(Math.max(8, window.innerWidth - box.offsetWidth - 8), left));
				top = Math.max(8, Math.min(Math.max(8, window.innerHeight - box.offsetHeight - 8), top));
				box.style.left = left + 'px';
				box.style.top = top + 'px';
				box.style.bottom = 'auto';
			}
			function up() {
				window.removeEventListener('pointermove', move);
				window.removeEventListener('pointerup', up);
				box.classList.remove('dragging');
				var left = parseFloat(box.style.left);
				var top = parseFloat(box.style.top);
				if (isFinite(left) && isFinite(top)) {
					var ui = encUi();
					ui.left = left;
					ui.top = top;
					saveEncUi(ui);
				}
			}
			window.addEventListener('pointermove', move);
			window.addEventListener('pointerup', up);
			e.preventDefault();
		});
	}
	function paintEnc() {
		var box = document.getElementById('safari-enc');
		if (!box || !safari) return;
		var enc = safari.enc;
		if (!enc) { box.innerHTML = ''; return; }
		box.innerHTML = '<div class="enc-tools"><button type="button" data-act="enc-size" data-z="-1" title="Diminuir">−</button><span class="enc-grip">mover</span><button type="button" data-act="enc-size" data-z="1" title="Aumentar">+</button></div>' +
			'<div class="enc-figure"><img class="enc-mon" alt="" src="' + window.Catalog.sprite(enc.id, enc.shiny, 'front') + '"><span class="enc-ground"></span></div>' +
			'<p class="enc-title">Você encontrou <b>' + esc(enc.name) + (enc.shiny ? ' ★' : '') + '</b>!</p>' +
			(enc.legendary ? '<p class="enc-rare">Lendário</p>' : '') +
			'<p class="enc-level">Nível ' + enc.level + '</p>' +
			'<button type="button" class="enc-attack" data-act="safari-attack">Atacar</button>' +
			'<p class="enc-hint">Ande para ignorar</p>';
		applyEncFrame();
		bindEncDrag();
	}
	function bindSafari() {
		var map = document.getElementById('safari-map');
		if (!map || !safari) return;
		function ready() {
			if (!safari.ready) {
				safari.x = map.naturalWidth / 2;
				safari.y = map.naturalHeight / 2;
				safari.ready = true;
				safari.face = 1;
			}
			layoutSafari();
		}
		if (map.complete && map.naturalWidth) ready();
		else map.onload = ready;
	}
	function stepSafari(dx, dy) {
		if (!safari || !safari.ready) return;
		var map = document.getElementById('safari-map');
		if (!map || !map.naturalWidth) return;
		var ch = window.Store.char();
		if (!alive(ch)) return toast('Cure o time primeiro.');
		safari.dir = dy > 0 ? 'down' : (dy < 0 ? 'up' : (dx < 0 ? 'left' : 'right'));
		safari.frame = ((safari.frame || 0) + 1) % 4;
		safari.x = Math.max(32, Math.min(map.naturalWidth - 32, safari.x + dx * 36));
		safari.y = Math.max(32, Math.min(map.naturalHeight - 32, safari.y + dy * 36));
		rollSafari();
		paintEnc();
		layoutSafari();
	}
	function safariView(ch) {
		var map = safariById(safari.id);
		var lead = ch.team.filter(function (m) { return m.hp > 0; })[0] || ch.team[0];
		var strip = SAFARI.map(function (m) {
			return '<button type="button" class="safari-thumb' + (m.id === map.id ? ' on' : '') + '" data-act="safari-enter" data-id="' + m.id + '" title="' + esc(m.name) + '"><img alt="" src="' + mapFile(m) + '"></button>';
		}).join('');
		var enc = safari.enc;
		return '<div class="safari">' +
			'<div class="safari-top">' + strip + '</div>' +
			'<div class="safari-stage" id="safari-stage" tabindex="0">' +
			'<img class="safari-map" id="safari-map" alt="" src="' + mapFile(map) + '">' +
			(lead ? '<div class="safari-actor safari-lead" id="safari-lead"></div>' : '') +
			'<div class="safari-actor safari-hero" id="safari-hero"></div>' +
			'<div class="safari-hud"><button type="button" class="btn ghost" data-act="safari-leave">‹ Voltar</button><b>' + esc(map.name) + ' · Andar 0</b>' + typesHtml(map.types) + '</div>' +
			'<div class="safari-enc" id="safari-enc">' + (enc ? '' : '') + '</div>' +
			'<div class="safari-zoom"><button type="button" data-act="safari-zoom" data-z="-1">−</button><button type="button" data-act="safari-zoom" data-z="1">+</button></div>' +
			'<div class="safari-pad"><button type="button" data-act="safari-step" data-dx="0" data-dy="-1">↑</button><button type="button" data-act="safari-step" data-dx="-1" data-dy="0">←</button><button type="button" data-act="safari-step" data-dx="1" data-dy="0">→</button><button type="button" data-act="safari-step" data-dx="0" data-dy="1">↓</button></div>' +
			'</div></div>';
	}

	function wildSpecies(region) {
		var pool = window.Catalog.inRegion(region).filter(function (s) { return !window.Catalog.isLegendary(s); });
		if (!pool.length) pool = window.Catalog.inRegion(region);
		return pool[Math.floor(Math.random() * pool.length)];
	}
	function monOfType(region, type, level) {
		var pool = window.Catalog.inRegion(region).filter(function (s) {
			return s.types.indexOf(type) >= 0 && !window.Catalog.isLegendary(s);
		});
		if (!pool.length) pool = window.Catalog.list.filter(function (s) {
			return s.types.indexOf(type) >= 0 && !window.Catalog.isLegendary(s);
		});
		pool.sort(function (a, b) {
			var ba = a.baseStats.hp + a.baseStats.atk + a.baseStats.def + a.baseStats.spa + a.baseStats.spd + a.baseStats.spe;
			var bb = b.baseStats.hp + b.baseStats.atk + b.baseStats.def + b.baseStats.spa + b.baseStats.spd + b.baseStats.spe;
			return bb - ba;
		});
		var strong = pool.slice(0, Math.max(1, Math.ceil(pool.length * 0.3)));
		var choice = strong[Math.floor(Math.random() * strong.length)];
		return window.Catalog.makeMon(choice.id, level);
	}
	function saveBattle() {
		if (!battle) { sessionStorage.removeItem(BKEY); return; }
		sessionStorage.setItem(BKEY, JSON.stringify(battle.state));
	}
	function revertMegas(ch) {
		if (!ch || !ch.team) return;
		ch.team.forEach(function (m) {
			if (m && m._origSpecies) {
				m.species = m._origSpecies;
				m.name = m._origName;
				delete m._origSpecies;
				delete m._origName;
				delete m.isMega;
				syncMon(m);
			}
		});
	}
	function clearBattle() {
		revertMegas(window.Store.char());
		battle = null;
		sessionStorage.removeItem(BKEY);
	}
	function refillMoves(mon) {
		if (!mon || !mon.moves) return;
		mon.moves.forEach(function (m) {
			if (m.maxPp == null) m.maxPp = m.pp || 1;
			m.pp = m.maxPp;
		});
	}
	function startBattle(opts) {
		var ch = window.Store.char();
		revertMegas(ch);
		ch.team.forEach(function (m) {
			syncMon(m);
			refillMoves(m);
		});
		var idx = ch.team.findIndex(function (m) { return m.hp > 0; });
		var state = {
			charId: ch.id,
			kind: opts.kind,
			title: opts.title,
			canCatch: !!opts.canCatch,
			canRun: !!opts.canRun,
			foeParty: opts.party,
			foeIndex: 0,
			playerIndex: idx,
			stages: { p: { atk: 0, def: 0 }, f: { atk: 0, def: 0 } },
			mustSwitch: false,
			turn: 1,
			log: [opts.title + ' quer batalhar!'],
			reward: opts.reward || { silver: 0, gold: 0, badge: null, xp: 20 }
		};
		battlePane = 'move';
		opts.party.forEach(function (m) { ch.seen[m.species] = true; });
		battle = new window.BattleSession(state, function () { return window.Store.char().team; });
		saveBattle();
		window.Store.persist();
		goto('batalha');
	}
	function resolve(res) {
		if (battle) battlePane = battle.state.mustSwitch ? 'party' : 'move';
		var ch = window.Store.char();
		var kind = battle && battle.state.kind;
		if (res.outcome === 'win') {
			var reward = battle.state.reward;
			var active = battle.player();
			if (!active || active.hp <= 0) {
				active = ch.team.filter(function (m) { return m.hp > 0; })[0];
			}
			var mods = kind === 'wild' ? skinMods(ch) : { silver: 0, xp: 0 };
			var silverGain = Math.floor((reward.silver || 0) * (1 + mods.silver));
			var xpGain = Math.floor((reward.xp || 0) * (1 + mods.xp));
			ch.silver += silverGain;
			ch.gold += reward.gold || 0;
			if (reward.badge && ch.badges.indexOf(reward.badge) < 0) {
				ch.badges.push(reward.badge);
				note(ch, 'Nova insígnia: ' + reward.badgeName + '.');
				toast('Insígnia de ' + reward.badgeName + ' conquistada.');
			}
			var lines = active ? gainExp(ch, active, xpGain) : [];
			if (active && xpGain) lines.unshift(active.name + ' ganhou ' + xpGain + ' EXP.');
			quests(ch).wins += 1;
			progressMission(ch, 'defeat', battle.foe() && battle.foe().species, false);
			note(ch, 'Vitória contra ' + battle.state.title + '.');
			lines.forEach(toast);
			toast('Vitória. +' + money(silverGain) + ' Silver' + (xpGain ? ' e +' + xpGain + ' EXP.' : '.'));
			clearBattle();
		} else if (res.outcome === 'catch') {
			var caught = res.caught;
			caught.hp = Math.max(1, caught.hp);
			var where = giveMon(ch, caught);
			quests(ch).catches += 1;
			progressMission(ch, 'catch', caught.species, !!caught.shiny);
			gainExp(ch, battle.player(), 12).forEach(toast);
			note(ch, 'Capturou ' + caught.name + '.');
			toast(caught.name + ' foi para ' + (where === 'time' ? 'o time.' : 'a box.'));
			clearBattle();
		} else if (res.outcome === 'loss') {
			ch.team.forEach(function (m) {
				m.hp = m.maxHp;
			});
			toast('Você desmaiou e acordou no Centro.');
			clearBattle();
		} else if (res.outcome === 'run') {
			toast('Você deixou a batalha.');
			clearBattle();
		} else {
			saveBattle();
		}
		window.Store.persist();
		updateChrome();
		if (res.outcome === 'run' || (safari && kind === 'wild' && res.outcome && res.outcome !== 'loss')) goto('cacar');
		else if (res.outcome) goto('inicio');
		else renderView();
	}

	function applyItem(mon, itemId) {
		var fx = (window.RpgItems && window.RpgItems[itemId] && window.RpgItems[itemId].effect) || {};
		if (fx.heal != null) {
			if (mon.hp <= 0) return 'Este Pokémon desmaiou. Use um Reviver.';
			var before = mon.hp;
			mon.hp = fx.heal === 'full' ? mon.maxHp : Math.min(mon.maxHp, mon.hp + fx.heal);
			return mon.hp === before ? 'O PS já está cheio.' : mon.name + ' recuperou PS.';
		}
		if (fx.revive != null) {
			if (mon.hp > 0) return 'Este Pokémon não desmaiou.';
			syncMon(mon);
			mon.hp = Math.max(1, Math.floor(mon.maxHp * fx.revive));
			return mon.name + ' voltou à batalha.';
		}
		if (fx.status === 'all') return mon.name + ' está bem.';
		if (fx.levelup) {
			if (mon.level >= 100) return mon.name + ' já está no nível 100.';
			mon.level += fx.levelup;
			syncMon(mon);
			var evo = window.Catalog.evolution(mon);
			if (evo) {
				var from = mon.name;
				mon.species = evo.id;
				mon.name = evo.name;
				mon.moves = window.Catalog.movesFor(evo);
				var ch = window.Store.char();
				if (ch) {
					ch.seen[evo.id] = true;
					ch.caught[evo.id] = true;
				}
				syncMon(mon);
				return '✨ ' + from + ' evoluiu para ' + evo.name + '!';
			}
			return mon.name + ' subiu para o nível ' + mon.level + '.';
		}
		var targetEvo = window.Catalog && window.Catalog.canEvolveWithItem(mon, itemId);
		if (targetEvo) {
			var prevName = mon.name;
			mon.species = targetEvo.id;
			mon.name = targetEvo.name;
			mon.moves = window.Catalog.movesFor(targetEvo);
			var charRec = window.Store.char();
			if (charRec) {
				charRec.seen[targetEvo.id] = true;
				charRec.caught[targetEvo.id] = true;
			}
			syncMon(mon);
			return '✨ ' + prevName + ' evoluiu para ' + targetEvo.name + '!';
		}
		if (window.Catalog && window.Catalog.isEvoItem(itemId)) {
			return 'Este item não tem efeito em ' + mon.name + '.';
		}
		return 'Este item não pode ser usado fora da batalha.';
	}

	function paintAuth() {
		document.getElementById('root').innerHTML =
			'<main class="auth"><section class="auth-card">' +
			'<div class="brand"><img class="logo-img" src="assets/brand/logo.png" alt="PK RPG Base"></div>' +
			'<p class="lede">Uma jornada neste navegador. A conta fica salva só neste computador.</p>' +
			'<div class="tabs"><button type="button" data-act="auth-tab" data-mode="login" class="' + (authMode === 'login' ? 'active' : '') + '">Entrar</button>' +
			'<button type="button" data-act="auth-tab" data-mode="register" class="' + (authMode === 'register' ? 'active' : '') + '">Criar conta</button></div>' +
			'<form data-act="' + authMode + '"><p class="form-error"></p>' +
			'<input class="field" name="user" placeholder="Usuário" autocomplete="username" required>' +
			'<input class="field" name="pass" type="password" placeholder="Senha" autocomplete="' + (authMode === 'login' ? 'current-password' : 'new-password') + '" required>' +
			'<button class="btn block" type="submit">' + (authMode === 'login' ? 'Entrar' : 'Criar conta') + '</button></form>' +
			'<p class="row-actions"><button type="button" class="btn ghost block" data-act="guest">Jogar como convidado</button></p>' +
			'<p class="fine">Inspirado no painel de jornada. Espécies, tipos e itens vêm dos arquivos desta pasta.</p>' +
			'</section></main>';
	}

	function paintSelect() {
		var rec = window.Store.user();
		var cards = rec.chars.map(function (id) {
			var ch = window.Store.db().chars[id];
			if (!ch) return '';
			return '<button type="button" class="btn ghost pick" data-act="pick-char" data-id="' + esc(id) + '"><span>' +
				fig(ch, 42) + ' <b>' + esc(ch.name) + '</b></span><span>' + esc(window.Catalog.regionById(ch.region).name) + '</span></button>';
		}).join('');
		var starterCards = STARTER_GENS.map(function (group) {
			var cards = group.ids.map(function (id) {
				var sp = window.Catalog.byId[id];
				if (!sp) return '';
				var checked = id === 'bulbasaur' ? ' checked' : '';
				return '<label><input type="radio" name="starter" value="' + id + '"' + checked + '> ' +
					'<img alt="" width="56" height="56" src="' + window.Catalog.sprite(id, false, 'front') + '"><br>' + esc(sp.name) + '</label>';
			}).join('');
			return '<section class="starter-gen"><h3>Geração ' + group.gen + ' · ' + esc(group.name) + '</h3><div class="starter-row">' + cards + '</div></section>';
		}).join('');
		var looks = TRAINERS.map(function (name, i) {
			return '<label class="trainer-pick"><input type="radio" name="trainer" value="' + name + '"' + (name === 'Red' ? ' checked' : '') + '> ' +
				'<img alt="" width="48" height="48" src="assets/rpg-images/characters/' + encodeURIComponent(name) + '/Thumb.png"><br>' + esc(name) + '</label>';
		}).join('');
		document.getElementById('root').innerHTML =
			'<main class="auth"><section class="auth-card" style="width:720px">' +
			'<div class="brand"><img class="logo-img" src="assets/brand/logo.png" alt="PK RPG Base"></div>' +
			'<p class="lede">Conta ' + esc(rec.name) + '. Escolha um personagem ou crie o próximo.</p>' +
			'<div class="char-list">' + (cards || '<p class="help">Nenhum personagem ainda.</p>') + '</div>' +
			(rec.chars.length >= 3 ? '' :
				'<form data-act="create-char"><p class="form-error"></p><h2 style="color:var(--accent);font-size:18px">Novo treinador</h2>' +
				'<input class="field" name="name" placeholder="Nome do treinador" required>' +
				'<div class="looks">' + looks + '</div><h2 class="starter-title">Pokémon inicial</h2><div class="starters">' + starterCards + '</div>' +
				'<button class="btn block" type="submit">Começar jornada</button></form>') +
			'<p class="row-actions"><button type="button" class="btn ghost" data-act="logout">Sair da conta</button></p>' +
			'</section></main>';
	}

	function mountShell() {
		document.getElementById('root').innerHTML =
			'<header class="topbar"><div class="topbar-inner">' +
			'<button type="button" class="logo-btn" data-go="inicio"><img class="logo-img" src="assets/brand/logo.png" alt="PK RPG Base"></button>' +
			'<button type="button" class="burger" data-act="burger" aria-label="Menu"><span></span></button>' +
			'<nav id="nav" class="nav">' +
			'<button type="button" class="nav-link" data-go="inicio">Início</button>' +
			menu('Explorar', [['cacar', 'Caçar'], ['npcs', 'Batalhar NPCs'], ['gym', 'Ginásios'], ['propriedade', 'Propriedade'], ['viajar', 'Viajar']]) +
			menu('Minhas coisas', [['bolsa', 'Bolsa'], ['box', 'Box'], ['pokedex', 'Pokédex'], ['bage', 'Insígnias']]) +
			menu('Cidade', [['centro', 'Centro Pokémon'], ['mercado', 'PokéMarket'], ['banco', 'Banco'], ['negro', 'Mercado Global'], ['doar', 'Doação']]) +
			menu('Informações', [['rankings', 'Rankings'], ['buscar', 'Buscar jogador']]) +
			'<span class="menu"><button type="button" data-act="menu">Conta ▾</button><div class="sub">' +
			'<button type="button" data-act="switch">Mudar de personagem</button>' +
			'<button type="button" data-act="logout">Sair</button></div></span></nav></div></header>' +
			'<div class="wrap"><div class="trainer-row">' +
			'<section class="panel" id="profile"></section>' +
			'<section class="panel" style="position:relative" id="radial"></section>' +
			'<section class="panel" id="wallet"></section></div>' +
			'<section class="panel view" id="view"></section>' +
			'<p class="footer">Projeto local, inspirado no painel de jornada. Pokémon e os nomes respectivos são marcas da Nintendo.</p></div>';
	}
	function menu(label, items) {
		return '<span class="menu"><button type="button" data-act="menu">' + label + ' ▾</button><div class="sub">' +
			items.map(function (it) { return '<button type="button" data-go="' + it[0] + '">' + it[1] + '</button>'; }).join('') +
			'</div></span>';
	}

	function updateChrome() {
		var ch = window.Store.char();
		if (!ch || !document.getElementById('profile')) return;
		var reg = window.Catalog.regionById(ch.region);
		var xpNeed = ch.tLevel * 100;
		var team = '';
		for (var i = 0; i < 6; i++) {
			var mon = ch.team[i];
			team += '<div class="slot' + (mon && mon.hp <= 0 ? ' faint' : '') + '">' + (mon ? spriteTag(mon, 40) : '') + '</div>';
		}
		document.getElementById('profile').innerHTML =
			'<div class="who">' + fig(ch, 72) +
			'<div class="meta"><div class="nick">' + esc(ch.name) + '</div>' +
			'<div class="region">' + esc(reg.name) + '</div>' +
			'<div class="bar" title="Nível de treinador ' + ch.tLevel + '"><span style="width:' + Math.min(100, Math.round((ch.xp / xpNeed) * 100)) + '%"></span></div>' +
			'<div class="rank">' + esc(rankLabel(ch)) + ' · Nv. ' + ch.tLevel + (vipDays(ch) ? ' · VIP ' + vipDays(ch) + 'd' : '') + '</div></div></div>' +
			'<div class="pair"><div class="stat"><button type="button" data-go="pokedex"><img class="hud-ico" alt="" src="assets/old/layout/images/NewLayout/Pokedex.png"><b>' + dexPct(ch) + '</b><small>Pokédex</small></button></div>' +
			'<div class="stat"><button type="button" data-go="bage"><img class="hud-ico" alt="" src="assets/old/layout/images/NewLayout/Badge.png"><b>' + regionBadges(ch) + '/' + window.Gyms.of(ch.region).length + '</b><small>Insígnias</small></button></div></div>' +
			'<div class="team-label">Seu time atual</div><div class="team">' + team + '</div>';
		document.getElementById('radial').innerHTML =
			'<button type="button" class="icon-btn notes" data-act="toggle-notes" aria-label="Avisos"><img alt="" src="assets/brand/menu/bell.png?v=1"></button>' +
			'<div class="note-pop" id="note-pop" hidden></div>' +
			'<div class="radial">' +
			[['cacar', 'Caçar'], ['npcs', 'Batalhar'], ['box', 'Box'], ['bolsa', 'Bolsa'], ['mercado', 'Mercado'], ['centro', 'Centro']].map(function (b, i) {
				return '<button type="button" class="rb" style="--i:' + i + '" data-go="' + b[0] + '" title="' + b[1] + '"><img class="menu-ico" alt="" src="assets/brand/menu/' + b[0] + '.png?v=1"></button>';
			}).join('') +
			'<div class="radial-core"><img class="radial-ball" alt="" src="assets/brand/menu/radial-ball.png?v=1">' + fig(ch, 160) + '</div></div>';
		document.getElementById('wallet').innerHTML =
			'<div class="coins"><button type="button" class="coin silver" data-go="banco"><img class="coin-ico" alt="" src="assets/old/layout/images/NewLayout/Silver.png"><span>Silver na mão</span><b>' + money(ch.silver) + '</b></button>' +
			'<button type="button" class="coin gold" data-go="negro"><img class="coin-ico" alt="" src="assets/old/layout/images/NewLayout/Gold.png"><span>Gold</span><b>' + money(ch.gold) + '</b></button></div>' +
			'<div class="marquee"><p>Explore ' + esc(reg.name) + ', capture Pokémon selvagens e conquiste os ginásios da região.</p></div>' +
			'<div class="quick">' +
			[['cacar', 'Caçar'], ['npcs', 'Batalhar'], ['box', 'Box'], ['bolsa', 'Bolsa'], ['mercado', 'Mercado'], ['centro', 'Centro'], ['gym', 'Ginásios']].map(function (b) {
				return '<button type="button" data-go="' + b[0] + '" title="' + b[1] + '"><img class="menu-ico" alt="" src="assets/brand/menu/' + b[0] + '.png?v=1"></button>';
			}).join('') + '</div>';
		document.querySelectorAll('.nav-link').forEach(function (btn) {
			btn.classList.toggle('active', btn.getAttribute('data-go') === route());
		});
		var row = document.querySelector('.trainer-row');
		if (row) row.hidden = route() === 'batalha';
	}

	function renderView() {
		var ch = window.Store.char();
		if (!ch) return;
		var name = route();
		if (name === 'batalha' && !battle) name = 'inicio';
		var fn = Views[name] || Views.inicio;
		document.getElementById('view').innerHTML = fn(ch);
		if (document.getElementById('dex-grid')) paintDex();
		if (document.getElementById('market-grid')) paintMarket();
		if (document.getElementById('safari-map')) { bindSafari(); paintEnc(); }
	}

	function showApp() {
		if (!document.getElementById('shell') && !document.getElementById('view')) mountShell();
		updateChrome();
		renderView();
	}

	var Views = {
		inicio: function (ch) {
			var pass = ensurePass(ch);
			var missions = ensureMissions(ch);
			var open = missions.list.filter(function (m) { return !m.awarded; }).length;
			var lv = passLevel(ch);
			var bar = pass.xp >= 1000 ? 100 : (pass.xp % 100);
			var month = MONTHS[new Date().getMonth()];
			var cards = '';
			for (var i = 0; i < 6; i++) {
				var mon = ch.team[i];
				if (!mon) cards += '<button type="button" class="poke-empty" data-go="box" aria-label="Vaga no time"></button>';
				else cards += '<button type="button" class="poke-card' + (mon.hp <= 0 ? ' faint' : '') + '" data-go="box">' + spriteTag(mon, 96) + '<b>' + esc(mon.name) + (mon.shiny ? ' ★' : '') + '</b><small>NV. ' + mon.level + '</small></button>';
			}
			var extra = '';
			if (homePane === 'missions') {
				extra = '<div class="sheet"><div class="sheet-head"><h2>Missões <span class="pill">Diárias</span></h2><span class="renew">renova em ' + renewIn() + '</span><button type="button" class="btn ghost" data-act="close-pane">Fechar</button></div>' +
					missions.list.map(function (m) {
						var pct = Math.min(100, Math.round((m.progress / m.need) * 100));
						return '<article class="mission"><p>' + esc(m.text) + '</p><b>🎯 ' + esc(m.title) + '</b><div class="bar"><span style="width:' + pct + '%"></span></div><small>' + m.progress + '/' + m.need + ' · +' + m.xp + ' XP</small></article>';
					}).join('') + '</div>';
			} else if (homePane === 'pass') {
				extra = '<div class="sheet"><div class="sheet-head"><h2>Passe de Batalha</h2><button type="button" class="btn ghost" data-act="close-pane">Voltar</button></div>' +
					'<p><b>Passe ' + month + '</b> <span class="renew">termina em ' + passEnds() + '</span></p>' +
					'<p>Nível ' + lv + ' / 10</p><div class="bar"><span style="width:' + bar + '%"></span></div><small>' + (pass.xp >= 1000 ? 100 : pass.xp % 100) + ' / 100 XP</small>' +
					'<h3>Recompensas</h3><div class="pass-track">' + PASS_REWARDS.map(function (r) {
						var claimed = pass.claimed.indexOf(r.lv) >= 0;
						var ready = lv >= r.lv && !claimed;
						return '<article class="reward' + (lv < r.lv ? ' locked' : '') + '"><b>' + esc(r.text) + '</b><small>Nível ' + r.lv + '</small>' +
							(claimed ? '<p>Resgatado</p>' : (ready ? '<button class="btn" type="button" data-act="claim-pass" data-lv="' + r.lv + '">Resgatar</button>' : '<p>Bloqueado</p>')) +
							'</article>';
					}).join('') + '</div></div>';
			}
			return '<div class="pass-bar"><div class="pass-mark">🎫</div><div class="pass-main"><div class="top"><b>Passe ' + month + '</b><span>Nível ' + lv + '</span></div><div class="bar"><span style="width:' + bar + '%"></span></div><small>' + (pass.xp >= 1000 ? 100 : pass.xp % 100) + ' / 100 XP</small></div>' +
				'<button type="button" class="btn ghost" data-act="show-missions">Missões <span class="count">' + open + '</span></button>' +
				'<button type="button" class="btn" data-act="show-pass">Abrir Passe</button></div>' + extra +
				'<div class="team-board">' + cards + '</div>';
		},
		cacar: function (ch) {
			if (safari) return safariView(ch);
			var reg = window.Catalog.regionById(ch.region);
			if (!alive(ch)) {
				return '<h2>Caçar</h2><p class="help">Seu time desmaiou. Passe no Centro Pokémon.</p><button class="btn" type="button" data-go="centro">Ir ao Centro</button>';
			}
			var cards = SAFARI.map(function (m) {
				return '<button type="button" class="card map-card safari-pick" data-act="safari-enter" data-id="' + m.id + '">' +
					'<img class="map-thumb" alt="" src="' + mapFile(m) + '"><h3>' + esc(m.name) + '</h3>' + typesHtml(m.types) + '</button>';
			}).join('');
			return '<h2>Escolha um mapa</h2><p class="help">Em ' + esc(reg.name) + ', cada mapa mostra os Pokémon da região com o elemento do lugar, inclusive os fortes. Shiny aparece em 1 a cada 128 encontros. O lendário daquele elemento surge de vez em quando, mais forte que o resto.</p><div class="grid">' + cards + '</div>';
		},
		npcs: function (ch) {
			var action = alive(ch)
				? '<button class="btn" type="button" data-act="npc">Desafiar</button>'
				: '<button class="btn" type="button" data-go="centro">Ir ao Centro</button>';
			return '<h2>Treinadores</h2>' +
				sceneBlock(window.Catalog.scene('npcs'), '<p>Um treinador da região aparece com um Pokémon mais forte que os selvagens.</p>' + action);
		},
		gym: function (ch) {
			var have = regionBadges(ch);
			var gyms = window.Gyms.of(ch.region);
			var cards = gyms.map(function (g, i) {
				var key = ch.region + ':' + i;
				var owned = ch.badges.indexOf(key) >= 0;
				var open = i <= have;
				var state = owned ? 'done' : (open ? 'can' : 'locked');
				var pic = window.Gyms.pic(g);
				var badge = window.Gyms.badge(g);
				var art = '<div class="gym-pic">' +
					(pic ? '<img class="gym-portrait" alt="" src="' + pic + '">' : '') +
					(badge ? '<img class="gym-badge" alt="" src="' + badge + '">' : '') +
					(owned ? '<span class="gym-chk">✓</span>' : '') +
					'</div>';
				var action = owned
					? '<p class="gym-sub">Insígnia conquistada.</p>'
					: (open && alive(ch)
						? '<button class="btn" type="button" data-act="gym" data-i="' + i + '">Desafiar</button>'
						: '<p class="gym-sub">' + (open ? 'Cure o time primeiro.' : 'Derrote o ginásio anterior.') + '</p>');
				return '<article class="gym-card ' + state + '">' + art +
					'<div class="gym-nm">' + esc(g.leader) + '</div>' +
					'<div class="gym-sub">' + esc(g.gym) + ' · ' + esc(window.Catalog.typePt[g.type]) + '</div>' +
					action + '</article>';
			}).join('');
			return '<h2>Ginásios</h2><p class="help">' + gyms.length + ' líderes em ' + esc(window.Catalog.regionById(ch.region).name) + '. A primeira vitória dá a insígnia e 1 Gold.</p><div class="gym-row">' + cards + '</div>';
		},
		propriedade: function (ch) {
			var ready = Date.now() - ch.property.last >= 60000;
			var gain = 150 * ch.property.level;
			return '<h2>Propriedade</h2>' +
				sceneBlock(window.Catalog.scene('propriedade'), '<p>Nível ' + ch.property.level + '. A cada minuto ela rende ' + money(gain) + ' Silver.</p>' +
				'<div class="row-actions"><button class="btn" type="button" data-act="collect"' + (ready ? '' : ' disabled') + '>' + (ready ? 'Coletar' : 'Ainda crescendo') + '</button>' +
				'<button class="btn ghost" type="button" data-act="upgrade"' + (ch.property.level >= 5 ? ' disabled' : '') + '>Melhorar (' + money(2000 * ch.property.level) + ')</button></div>');
		},
		viajar: function (ch) {
			var cards = window.Catalog.regions.map(function (r) {
				var here = r.id === ch.region;
				var known = ch.visited.indexOf(r.id) >= 0;
				var cost = known ? 400 : 800;
				return '<article class="card map-card"><img class="map-thumb" alt="" src="' + window.Catalog.regionMap(r.id) + '"><h3>' + esc(r.name) + '</h3><p>Nº ' + r.from + '–' + r.to + '</p>' +
					(here ? '<p>Você está aqui.</p>' : '<button class="btn" type="button" data-act="travel" data-id="' + r.id + '">Viajar · ' + money(cost) + '</button>') +
					'</article>';
			}).join('');
			return '<h2>Viajar</h2><p class="help">A primeira visita custa 800 Silver. Voltar para uma região conhecida custa 400.</p><div class="grid">' + cards + '</div>';
		},
		bolsa: function (ch) {
			ensureDonate(ch);
			var items = Object.keys(ch.bag).filter(function (id) { return (ch.bag[id] || 0) > 0 && itemRecord(id); });
			var cards = items.map(function (id) {
				var info = itemRecord(id);
				var isEvo = info.cat === 'stone' || (window.Catalog && window.Catalog.isEvoItem(id));
				var use = info.cat === 'potion' || info.cat === 'medicine' || info.cat === 'tm' || isEvo;
				var art = info.cat === 'key'
					? '<img class="key-ico" alt="" src="' + info.icon + '">'
					: '<span class="' + (info.cat === 'skin' ? 'skin-ico' : 'item-sheet') + (info.cat === 'tm' ? ' tm' : '') + '" style="' + (info.iconStyle || '') + '"></span>';
				var action = info.cat === 'key'
					? '<p class="help">' + esc(info.desc) + '</p><button class="btn" type="button" data-act="open-key" data-id="' + id + '">Abrir</button>'
					: (use ? '<button class="btn" type="button" data-act="use-item" data-id="' + id + '">Usar</button>' : '<p>Guardado na bolsa.</p>');
				return '<article class="card">' + art + '<h3>' + esc(info.name) + '</h3><p>x' + ch.bag[id] + '</p>' + action + '</article>';
			}).join('');
			var owned = window.Donate.skins.filter(function (sk) { return ch.skins[sk.id]; }).map(function (sk) {
				return '<article class="card"><img class="key-ico" alt="" src="' + sk.icon + '"><h3>' + esc(sk.name) + '</h3><p class="help">' + esc(sk.text) + '</p></article>';
			}).join('');
			var picker = '';
			if (pickItem) {
				var isPickEvo = (window.Catalog && window.Catalog.isEvoItem(pickItem)) || (itemRecord(pickItem) && itemRecord(pickItem).cat === 'stone');
				picker = '<div class="sheet" style="margin-bottom:18px"><div class="sheet-head"><h3>Em quem usar ' + esc(itemRecord(pickItem).name) + '?</h3><button type="button" class="btn ghost" data-act="cancel-use">Cancelar</button></div><div class="grid">' + ch.team.map(function (m) {
					var canEvo = isPickEvo && window.Catalog.canEvolveWithItem(m, pickItem);
					var badge = canEvo ? ' <span class="pill" style="background:#27ae60;color:#fff;margin-left:4px">Evolui para ' + esc(canEvo.name) + '!</span>' : '';
					return '<button type="button" class="mon-card' + (canEvo ? ' can-evolve' : '') + '" data-act="confirm-use" data-uid="' + m.uid + '">' + spriteTag(m, 56) + '<b>' + esc(m.name) + badge + '</b><small>Nv.' + m.level + ' · ' + m.hp + '/' + m.maxHp + '</small></button>';
				}).join('') + '</div></div>';
			}
			return '<h2>Bolsa</h2><p class="help">Poções, doces e pedras evolutivas funcionam aqui. Bolas só entram em batalha selvagem. Cada chave abre a roleta da própria caixa.</p>' + picker +
				(owned ? '<h3>Skins</h3><div class="grid">' + owned + '</div>' : '') +
				'<div class="grid">' + (cards || '<p>A bolsa está vazia.</p>') + '</div>';
		},
		box: function (ch) {
			var team = '<h3>Time</h3><div class="grid team-order">' + ch.team.map(function (m, i) {
				var hasMega = window.Catalog.getAvailableMegas && window.Catalog.getAvailableMegas(m, ch.bag).length > 0;
				var megaTag = hasMega ? ' <span class="pill" style="background:linear-gradient(135deg,#9b59b6,#e74c3c);color:#fff;font-size:10px;padding:2px 5px">Mega</span>' : '';
				return '<button type="button" class="mon-card' + (i === 0 ? ' lead' : '') + (boxUid === m.uid ? ' selected' : '') + '" data-act="select-mon" data-where="team" data-uid="' + m.uid + '">' +
					(i === 0 ? '<span class="lead-tag">Principal</span>' : '') +
					spriteTag(m, 64) + '<b>' + esc(m.name) + (m.shiny ? ' <span class="shiny">★</span>' : '') + megaTag + '</b><small>Nv.' + m.level + '</small>' + hpBar(m) + '</button>';
			}).join('') + '</div>';
			var box = '<h3>Box (' + ch.box.length + ')</h3><div class="grid box-order">' + (ch.box.map(function (m) {
				var hasMega = window.Catalog.getAvailableMegas && window.Catalog.getAvailableMegas(m, ch.bag).length > 0;
				var megaTag = hasMega ? ' <span class="pill" style="background:linear-gradient(135deg,#9b59b6,#e74c3c);color:#fff;font-size:10px;padding:2px 5px">Mega</span>' : '';
				return '<button type="button" class="mon-card' + (boxUid === m.uid ? ' selected' : '') + '" data-act="select-mon" data-where="box" data-uid="' + m.uid + '">' +
					spriteTag(m, 64) + '<b>' + esc(m.name) + (m.shiny ? ' <span class="shiny">★</span>' : '') + megaTag + '</b><small>Nv.' + m.level + '</small>' + hpBar(m) + '</button>';
			}).join('') || '<p>Nenhum Pokémon guardado.</p>') + '</div>';
			var actions = '';
			if (boxUid) {
				var inTeam = ch.team.some(function (m) { return m.uid === boxUid; });
				var selectedMon = ch.team.concat(ch.box).filter(function (m) { return m.uid === boxUid; })[0];
				var canEvo = selectedMon && window.Catalog.evolution(selectedMon);
				var evoBtn = canEvo ? '<button class="btn" style="background:#27ae60" type="button" data-act="evolve-box">⚡ Evoluir para ' + esc(canEvo.name) + '</button>' : '';
				var megasAvail = selectedMon && window.Catalog.getAvailableMegas ? window.Catalog.getAvailableMegas(selectedMon, ch.bag) : [];
				var megaNote = megasAvail.length ? '<p class="help" style="color:#e67e22;font-weight:700">✨ ' + esc(megasAvail.map(function (g) { return g.name; }).join(' / ')) + ' disponível! A Mega Pedra (' + esc(megasAvail[0].reqItem) + ') está na sua bolsa para usar em combate.</p>' : '';
				actions = '<div class="row-actions">' + (inTeam
					? '<button class="btn" type="button" data-act="to-box">Mover para a box</button>'
					: '<button class="btn" type="button" data-act="to-team">Trazer para o time</button>') + evoBtn + '</div>' + megaNote;
			}
			return '<h2>Box</h2><p class="help">O time leva até 6. O primeiro é o principal e entra na caça. Arraste um Pokémon sobre outro para trocar de lugar.</p>' + actions + team + box;
		},
		pokedex: function (ch) {
			return '<h2>Pokédex</h2><p class="help">' + Object.keys(ch.caught).length + ' capturados · ' + Object.keys(ch.seen).length + ' vistos · ' + window.Catalog.list.length + ' registrados.</p>' +
				'<div class="filters"><input id="dex-q" class="field" placeholder="Buscar nome ou número">' +
				'<select id="dex-region" class="field"><option value="all">Nacional</option>' +
				window.Catalog.regions.map(function (r) {
					return '<option value="' + r.id + '"' + (r.id === ch.region ? ' selected' : '') + '>' + esc(r.name) + '</option>';
				}).join('') +
				'</select><select id="dex-filter" class="field"><option value="all">Todos</option><option value="seen">Vistos</option><option value="caught">Capturados</option></select></div>' +
				'<div id="dex-grid"></div>';
		},
		bage: function (ch) {
			var blocks = window.Catalog.regions.map(function (r) {
				var gyms = window.Gyms.of(r.id);
				var total = gyms.length || 1;
				var n = ch.badges.filter(function (b) { return b.indexOf(r.id + ':') === 0; }).length;
				var cells = gyms.map(function (g, i) {
					var owned = ch.badges.indexOf(r.id + ':' + i) >= 0;
					var badge = window.Gyms.badge(g);
					var icon = badge
						? '<img alt="" src="' + badge + '">'
						: '<span class="bdg-fallback">' + esc(window.Catalog.typePt[g.type] || g.type) + '</span>';
					return '<div class="bdg-cell' + (owned ? ' has' : '') + '"><div class="bdg-ic">' + icon + '</div><div class="bdg-nm">' + esc(g.badge || g.leader) + '</div></div>';
				}).join('');
				return '<section class="bdg-region"><div class="bdg-rhead"><span class="bdg-rname">' + esc(r.name) + '</span><span class="bdg-rcount">' + n + ' / ' + gyms.length + '</span></div>' +
					'<div class="bdg-bar"><i style="width:' + (n / total * 100) + '%"></i></div><div class="bdg-grid">' + cells + '</div></section>';
			}).join('');
			return '<h2>Insígnias</h2><p class="help">O rank sobe com o total de insígnias. Gold só pode ser transferido a partir de 8.</p>' + blocks;
		},
		centro: function () {
			return '<h2>Centro Pokémon</h2>' +
				sceneBlock(window.Catalog.scene('centro'), '<p>A equipe de plantão restaura o PS de todo o time, sem custo.</p><button class="btn" type="button" data-act="heal">Curar o time</button>');
		},
		mercado: function () {
			var tabs = window.Shop.tabs.map(function (tab) {
				return '<button type="button" class="market-tab' + (tab.id === marketTab ? ' on' : '') + '" data-act="market-tab" data-id="' + tab.id + '">' + esc(tab.name) + ' <span>' + tab.count + '</span></button>';
			}).join('');
			return '<div class="market"><div class="market-head"><h2>PokéMarket</h2><input id="market-q" class="field" placeholder="Buscar item..." value="' + esc(marketQuery) + '"></div>' +
				'<div class="market-tabs">' + tabs + '</div><div id="market-grid"></div></div>';
		},
		negro: function (ch) {
			var board = listings();
			var itemN = board.filter(function (l) { return l.kind === 'item'; }).length;
			var monN = board.filter(function (l) { return l.kind === 'mon'; }).length;
			var tabs = '<div class="market-tabs">' +
				'<button type="button" class="market-tab' + (globalTab === 'item' ? ' on' : '') + '" data-act="global-tab" data-id="item">Itens <span>' + itemN + '</span></button>' +
				'<button type="button" class="market-tab' + (globalTab === 'mon' ? ' on' : '') + '" data-act="global-tab" data-id="mon">Pokémon <span>' + monN + '</span></button></div>';
			var rows = board.filter(function (l) { return l.kind === globalTab; });
			var cards = rows.map(function (l) {
				var mine = l.sellerId === ch.id;
				var price = money(l.price) + (l.cur === 'gold' ? ' Gold' : ' Silver');
				var art = '';
				var title = '';
				var detail = '';
				if (l.kind === 'item') {
					var info = itemRecord(l.itemId);
					art = itemGlyph(l.itemId);
					title = info ? info.name : l.itemId;
					detail = 'x' + l.qty;
				} else {
					var sp = species(l.mon);
					art = spriteTag(l.mon, 72);
					title = l.mon.name + (l.mon.shiny ? ' ★' : '');
					detail = 'Nv.' + l.mon.level + (sp ? ' · ' + sp.types.map(function (t) { return window.Catalog.typePt[t] || t; }).join('/') : '');
				}
				var btn = mine
					? '<button type="button" class="btn ghost" data-act="global-cancel" data-id="' + esc(l.id) + '">Retirar</button>'
					: '<button type="button" class="btn' + (l.cur === 'gold' ? ' gold' : '') + '" data-act="global-buy" data-id="' + esc(l.id) + '">Comprar</button>';
				return '<article class="market-card">' + art + '<h3>' + esc(title) + '</h3><p>' + esc(detail) + '</p>' +
					'<p class="help">por ' + esc(l.sellerName) + '</p>' +
					'<div class="market-buy"><span class="price ' + l.cur + '">' + price + '</span>' + btn + '</div></article>';
			}).join('');
			var boardHtml = rows.length
				? '<div class="market-grid">' + cards + '</div>'
				: '<p class="help">Nenhum anúncio nesta seção.</p>';
			var form = globalTab === 'item' ? globalItemForm(ch) : globalMonForm(ch);
			return '<h2>Mercado Global</h2><p class="help">Treinadores anunciam itens e Pokémon por Silver ou Gold. O pagamento vai para quem anunciou.</p>' +
				tabs + form + '<h3>À venda</h3>' + boardHtml;
		},
		doar: function (ch) {
			ensureDonate(ch);
			var shop = window.Donate;
			var tabs = '<div class="donate-tabs">' +
				'<button type="button" class="' + (donateTab === 'packs' ? 'on' : '') + '" data-act="donate-tab" data-id="packs">Doações</button>' +
				'<button type="button" class="' + (donateTab === 'rewards' ? 'on' : '') + '" data-act="donate-tab" data-id="rewards">Recompensas</button></div>';
			var body = '';
			if (donateTab === 'rewards') {
				body = '<h3>Recompensas de recarga</h3><p class="help">Já recarregou: <b>' + money(ch.recharged) + ' Gold</b>. Só o Gold dos pacotes conta. Cada prêmio é retirado uma vez.</p>' +
					'<div class="donate-grid">' + shop.rewards.map(function (tier) {
						var claimed = ch.donateClaims.indexOf(tier.need) >= 0;
						var ready = ch.recharged >= tier.need && !claimed;
						var pct = Math.min(100, Math.round((Math.min(ch.recharged, tier.need) / tier.need) * 100));
						var label = claimed ? 'Retirado' : 'Retirar prêmio';
						return '<article class="donate-card"><h3>' + compact(tier.need) + ' Gold</h3>' +
							'<div class="dchips">' + tier.parts.map(donateChip).join('') + '</div>' +
							'<div class="donate-progress"><span style="width:' + pct + '%"></span></div>' +
							'<div class="donate-ratio">' + compact(Math.min(ch.recharged, tier.need)) + ' / ' + compact(tier.need) + '</div>' +
							'<button type="button" class="btn block" data-act="donate-claim" data-need="' + tier.need + '"' + (ready ? '' : ' disabled') + '>' + label + '</button></article>';
					}).join('') + '</div>';
			} else {
				body = '<p class="help">Nesta versão local a compra entra na hora na conta. Não há cobrança. As chaves vão para a bolsa e cada uma gira a própria roleta.</p>' +
					'<div class="donate-grid">' + shop.packs.map(function (pack) {
						var ownedPack = pack.once && ch.donatePacks.indexOf(pack.id) >= 0;
						return '<article class="donate-card"><h3>' + esc(pack.name) + '</h3>' +
							(pack.text ? '<p class="help">' + esc(pack.text) + '</p>' : '') +
							'<div class="dchips">' + pack.parts.map(donateChip).join('') + '</div>' +
							'<div class="donate-buy"><span class="donate-price">' + esc(pack.price) + '</span>' +
							'<button type="button" class="btn gold" data-act="donate-buy" data-id="' + pack.id + '"' + (ownedPack ? ' disabled' : '') + '>' +
							(ownedPack ? 'Já adquirido' : 'Comprar') + '</button></div></article>';
					}).join('') + '</div>';
			}
			return '<h2>Doar para o Servidor</h2>' + tabs + body;
		},
		banco: function (ch) {
			return '<h2>Banco</h2><p class="help">Na mão: ' + money(ch.silver) + ' Silver e ' + money(ch.gold) + ' Gold. No cofre: ' + money(ch.bank) + ' Silver. O saque tem 2% de taxa. Transferir Silver cobra 5%. Gold exige rank 8.</p>' +
				'<form data-act="bank" class="grid"><article class="card"><h3>Depositar</h3><input class="field" name="amount" inputmode="numeric" placeholder="Valor"><input type="hidden" name="op" value="deposit"><button class="btn" type="submit">Guardar</button></article></form>' +
				'<form data-act="bank" class="grid"><article class="card"><h3>Sacar</h3><input class="field" name="amount" inputmode="numeric" placeholder="Valor"><input type="hidden" name="op" value="withdraw"><button class="btn" type="submit">Sacar</button></article></form>' +
				'<form data-act="bank" class="grid"><article class="card"><h3>Transferir</h3><input class="field" name="nick" placeholder="Nick do jogador"><input class="field" name="amount" inputmode="numeric" placeholder="Valor"><select class="field" name="cur"><option value="silver">Silver</option><option value="gold">Gold</option></select><input type="hidden" name="op" value="transfer"><button class="btn" type="submit">Enviar</button></article></form>';
		},
		rankings: function () {
			var rows = Object.keys(window.Store.db().chars).map(function (id) { return window.Store.db().chars[id]; });
			rows.sort(function (a, b) { return b.badges.length - a.badges.length || b.tLevel - a.tLevel || b.silver - a.silver; });
			var list = rows.slice(0, 20).map(function (ch, i) {
				return '<article class="card"><b>' + (i + 1) + '. ' + esc(ch.name) + '</b><p>' + esc(rankLabel(ch)) + ' · Nv.' + ch.tLevel + '</p></article>';
			}).join('');
			return '<h2>Rankings</h2><p class="help">Treinadores salvos neste navegador.</p><div class="grid">' + (list || '<p>Ninguém ainda.</p>') + '</div>';
		},
		buscar: function () {
			return '<h2>Buscar jogador</h2><form data-act="search"><input class="field" name="nick" placeholder="Nick do jogador"><button class="btn" type="submit">Buscar</button></form><div id="search-out"></div>';
		},
		batalha: function () {
			if (!battle) return '<h2>Sem batalha</h2>';
			if (battle.state.mustSwitch) battle.openSwitch();
			var foe = battle.foe();
			var player = battle.player();
			var sp = species(foe);
			var ch = window.Store.char();
			ch.team.forEach(ensureMoves);
			ensureMoves(player);
			ensureMoves(foe);
			var pane = battle.state.mustSwitch ? 'party' : battlePane;
			var walk = walkMeta(ch);
			var pct = function (mon) { return Math.max(0, Math.round((mon.hp / mon.maxHp) * 100)); };
			var expPct = player ? Math.min(100, Math.round(((player.exp || 0) / Math.max(1, player.level * 40)) * 100)) : 0;
			function statBox(mon, withExp) {
				var megaPill = (mon && mon.isMega) ? ' <span class="pill" style="background:linear-gradient(135deg,#9b59b6,#e74c3c);color:#fff;font-size:10px;padding:2px 6px">MEGA</span>' : '';
				return '<div class="statbox"><div class="stat-top"><b>' + esc(mon.name) + (mon.shiny ? ' ★' : '') + megaPill + '</b><span>Nv. ' + mon.level + '</span></div>' +
					'<div class="stat-hp"><span class="mini-ball"></span><em>HP</em><div class="hp ' + hpClass(mon) + '"><span style="width:' + pct(mon) + '%"></span></div></div>' +
					(withExp ? '<div class="stat-exp"><em>EXP</em><div class="exp"><span style="width:' + expPct + '%"></span></div></div>' : '') +
					'</div>';
			}
			var party = '';
			for (var s = 0; s < 6; s++) {
				var slot = ch.team[s];
				if (!slot) party += '<span class="party-slot empty"></span>';
				else party += '<span class="party-slot' + (slot.hp <= 0 ? ' faint' : '') + (s === battle.state.playerIndex ? ' on' : '') + '"><img alt="" src="' + window.Catalog.sprite(slot.species, slot.shiny, 'icon') + '"></span>';
			}
			var movesHtml = (!player || player.hp <= 0 ? [] : player.moves).map(function (m, i) {
				var kind = window.Catalog.moveKind(m);
				var color = window.Catalog.typeColor[m.type] || '#888';
				var eff = m.power && sp ? window.Catalog.typeNote(m.type, sp.types) : null;
				var typeLine = (window.Catalog.typePt[m.type] || m.type).toUpperCase() + (eff && eff.label ? ' · ' + eff.label : '');
				return '<button type="button" class="move" style="--type:' + color + '" data-act="battle-move" data-i="' + i + '"' + (m.pp <= 0 ? ' disabled' : '') + '>' +
					'<b>' + esc(m.name) + '</b><small>' + esc(typeLine) + '</small>' +
					'<span class="pp">' + m.pp + '/' + m.maxPp + '</span><i class="kind ' + kind + '" title="' + kind + '"></i></button>';
			}).join('');
			var bagHtml = '';
			if (battle.state.canCatch) {
				bagHtml += Object.keys(ch.bag).filter(function (id) {
					var info = itemRecord(id);
					return info && info.cat === 'ball' && (ch.bag[id] || 0) > 0;
				}).map(function (id) {
					var chance = battle.catchChance(id);
					var pct = chance >= 0.995 ? '100%' : (chance * 100 < 1 ? '<1%' : (chance < 0.1 ? (chance * 100).toFixed(1).replace('.', ',') + '%' : Math.round(chance * 100) + '%'));
					return '<button type="button" class="dock-pick" data-act="battle-ball" data-id="' + id + '">' + itemGlyph(id) + '<span><b>' + esc(itemRecord(id).name) + '</b><small>' + pct + ' · x' + ch.bag[id] + '</small></span></button>';
				}).join('');
			}
			bagHtml += Object.keys(ch.bag).filter(function (id) {
				var fx = window.RpgItems && window.RpgItems[id] && window.RpgItems[id].effect;
				return fx && (fx.heal != null || fx.status) && (ch.bag[id] || 0) > 0;
			}).map(function (id) {
				return '<button type="button" class="dock-pick" data-act="battle-potion" data-id="' + id + '">' + itemGlyph(id) + '<span><b>' + esc(itemRecord(id).name) + '</b><small>x' + ch.bag[id] + '</small></span></button>';
			}).join('');
			if (!bagHtml) bagHtml = '<p class="help">Nada na mochila para esta batalha.</p>';
			var partyHtml = ch.team.map(function (m, i) {
				var here = i === battle.state.playerIndex && m.hp > 0;
				return '<button type="button" class="dock-pick" data-act="battle-switch" data-i="' + i + '"' + (here || m.hp <= 0 ? ' disabled' : '') + '>' +
					'<img alt="" src="' + window.Catalog.sprite(m.species, m.shiny, 'icon') + '"><span><b>' + esc(m.name) + '</b><small>Nv. ' + m.level + ' · ' + m.hp + '/' + m.maxHp + '</small></span></button>';
			}).join('');
			var availableMegas = (!player || player.hp <= 0 || player.isMega) ? [] : (window.Catalog.getAvailableMegas ? window.Catalog.getAvailableMegas(player, ch.bag) : []);
			var megaButtons = availableMegas.map(function (mg) {
				var label = availableMegas.length > 1
					? (mg.name.indexOf('Mega-X') >= 0 ? '✨ Mega Evoluir X' : (mg.name.indexOf('Mega-Y') >= 0 ? '✨ Mega Evoluir Y' : '✨ ' + esc(mg.name)))
					: '✨ Mega Evoluir!';
				return '<button type="button" class="btn mega-btn" data-act="battle-mega" data-form="' + mg.formId + '" data-name="' + esc(mg.name) + '" data-item="' + esc(mg.reqItem) + '">' + label + '</button>';
			}).join(' ');
			var panel = pane === 'bag'
				? '<p class="move-label">Mochila:</p><div class="dock-grid">' + bagHtml + '</div>'
				: pane === 'party'
					? '<p class="move-label">' + (battle.state.mustSwitch ? 'Escolha o próximo Pokémon:' : 'Pokémon:') + '</p><div class="dock-grid">' + partyHtml + '</div>'
					: '<p class="move-label">Seu golpe:</p>' + (megaButtons ? '<div class="mega-bar">' + megaButtons + '</div>' : '') + '<div class="move-grid">' + movesHtml + '</div>';
			var hits = battle.state.hits || {};
			var last = battle.state.log[battle.state.log.length - 1] || '';
			var msg = (!hits.you && !hits.wild)
				? esc(last)
				: '<span class="hit-you">' + esc(hits.you) + '</span><span class="hit-wild">' + esc(hits.wild) + '</span>' +
					((last && last !== hits.you && last !== hits.wild) ? '<span class="hit-extra">' + esc(last) + '</span>' : '');
			var locked = battle.state.mustSwitch ? ' disabled' : '';
			return '<div class="fight">' +
				'<div class="fight-scene" style="background-image:url(\'' + window.Catalog.battleBg(sp.types[0]) + '\')">' +
				'<div class="fight-turn">Turno ' + (battle.state.turn || 1) + '</div>' +
				'<div class="foe-name">' + esc(foe.name) + '</div>' +
				'<div class="foe-wrap">' + statBox(foe, false) + '<img class="fight-sprite foe" alt="" src="' + window.Catalog.sprite(foe.species, foe.shiny, 'front') + '"></div>' +
				'<div class="mine-wrap"><div class="fight-who"><div class="fight-trainer" style="background-image:url(' + walk.url + ')"></div><small>' + esc(ch.name) + '</small><div class="party-row">' + party + '</div></div>' +
				'<div class="actor">' + (player ? statBox(player, true) : '') + (player ? '<img class="fight-sprite mine" alt="" src="' + window.Catalog.sprite(player.species, player.shiny, 'back') + '">' : '') + '</div></div>' +
				'<div class="fight-msg" aria-live="polite">' + msg + '</div></div>' +
				'<div class="fight-dock"><div class="cmd-grid">' +
				'<button type="button" class="cmd atk' + (pane === 'move' ? ' on' : '') + '" data-act="battle-pane" data-pane="move"' + locked + '>Atacar</button>' +
				'<button type="button" class="cmd bag' + (pane === 'bag' ? ' on' : '') + '" data-act="battle-pane" data-pane="bag"' + locked + '>Mochila</button>' +
				'<button type="button" class="cmd mon' + (pane === 'party' ? ' on' : '') + '" data-act="battle-pane" data-pane="party">Pokémon</button>' +
				'<button type="button" class="cmd run" data-act="battle-run"' + (battle.state.canRun && !battle.state.mustSwitch ? '' : ' disabled') + '>Fugir</button>' +
				'</div><div class="fight-panel">' + panel + '</div></div></div>';
		}
	};

	function paintMarket() {
		var grid = document.getElementById('market-grid');
		if (!grid || !window.Shop) return;
		var q = marketQuery.trim().toLowerCase();
		var list = window.Shop.lists[marketTab] || [];
		var shown = list.filter(function (item) {
			if (!q) return true;
			return item.name.toLowerCase().indexOf(q) >= 0 || (item.desc || '').toLowerCase().indexOf(q) >= 0;
		});
		var cap = marketTab === 'tm' || marketTab === 'item' ? 72 : shown.length;
		if (q) cap = 120;
		var slice = shown.slice(0, cap);
		var ch = window.Store.char();
		grid.innerHTML = '<div class="market-grid">' + slice.map(function (item) {
			var n = marketQty[item.id] || 1;
			var owned = item.cat === 'skin' && ch.ownedSkins && ch.ownedSkins.indexOf(item.id) >= 0;
			var price = item.cur === 'gold' ? (money(item.price) + ' Gold') : (money(item.price) + ' Silver');
			var ico = '<span class="' + (item.cat === 'skin' ? 'skin-ico' : 'item-sheet') + (item.cat === 'tm' ? ' tm' : '') + '" style="' + item.iconStyle + '"></span>';
			var buffs = skinBuffsHtml(item.buffs);
			var action = owned
				? '<button type="button" class="btn" data-act="market-equip" data-id="' + item.id + '">Usar</button>'
				: (item.cat === 'skin' ? '' : '<div class="qty"><button type="button" data-act="market-qty" data-id="' + item.id + '" data-dir="-1">−</button><b id="qty-' + item.id + '">' + n + '</b><button type="button" data-act="market-qty" data-id="' + item.id + '" data-dir="1">+</button></div>') +
					'<button type="button" class="btn" data-act="market-buy" data-id="' + item.id + '">Comprar</button>';
			return '<article class="market-card">' + ico + '<h3>' + esc(item.name) + '</h3><p>' + esc(item.desc) + '</p>' + buffs +
				'<div class="market-buy"><span class="price ' + item.cur + '">' + price + '</span>' + action + '</div></article>';
		}).join('') + '</div>' + (shown.length > slice.length ? '<p class="help">Mostrando ' + slice.length + ' de ' + shown.length + '. Refine a busca.</p>' : '');
	}

	function shopView(title, help) {
		var cards = Object.keys(window.Catalog.items).filter(function (id) {
			return window.Catalog.items[id].price;
		}).map(function (id) {
			var info = window.Catalog.items[id];
			return '<article class="card">' + itemArt(id) + '<h3>' + esc(info.name) + '</h3><p>' + money(info.price) + ' Silver</p><button class="btn" type="button" data-act="buy" data-id="' + id + '">Comprar</button></article>';
		}).join('');
		return '<h2>' + title + '</h2><p class="help">' + help + '</p><div class="grid">' + cards + '</div>';
	}

	function paintDex() {
		var grid = document.getElementById('dex-grid');
		if (!grid) return;
		var ch = window.Store.char();
		var q = (document.getElementById('dex-q').value || '').trim().toLowerCase();
		var region = document.getElementById('dex-region').value;
		var filter = document.getElementById('dex-filter').value;
		var pool = region === 'all' ? window.Catalog.list : window.Catalog.inRegion(region);
		var shown = pool.filter(function (s) {
			if (q && String(s.num) !== q && s.name.toLowerCase().indexOf(q) < 0) return false;
			if (filter === 'seen' && !ch.seen[s.id]) return false;
			if (filter === 'caught' && !ch.caught[s.id]) return false;
			return true;
		}).slice(0, 120);
		grid.innerHTML = '<div class="grid">' + shown.map(function (s) {
			var caught = !!ch.caught[s.id];
			var seen = !!ch.seen[s.id];
			return '<article class="mon-card"><small>#' + s.num + '</small>' +
				(seen ? '<img class="sprite" alt="" src="' + window.Catalog.sprite(s.id, false, 'front') + '" width="72" height="72">' : '<div class="slot" style="margin:8px auto"></div>') +
				'<b>' + (seen ? esc(s.name) : '???') + '</b>' + (seen ? typesHtml(s.types) : '') +
				'<small>' + (caught ? 'Capturado' : (seen ? 'Visto' : 'Desconhecido')) + '</small></article>';
		}).join('') + '</div>' + (shown.length === 120 ? '<p class="help">Mostrando os 120 primeiros. Refine a busca.</p>' : '');
	}

	function findChar(nick) {
		var key = String(nick || '').trim().toLowerCase();
		var ids = Object.keys(window.Store.db().chars);
		for (var i = 0; i < ids.length; i++) {
			if (window.Store.db().chars[ids[i]].name.toLowerCase() === key) return window.Store.db().chars[ids[i]];
		}
		return null;
	}

	var Actions = {
		'auth-tab': function (btn) { authMode = btn.dataset.mode; paintAuth(); },
		login: function (form) {
			window.Store.login(form.user.value, form.pass.value).then(function (err) {
				if (err) { form.querySelector('.form-error').textContent = err; return; }
				render();
			});
		},
		guest: function () { window.Store.guest(); render(); },
		register: function (form) {
			window.Store.register(form.user.value, form.pass.value).then(function (err) {
				if (err) { form.querySelector('.form-error').textContent = err; return; }
				render();
			});
		},
		logout: function () { clearBattle(); window.Store.logout(); location.hash = ''; render(); },
		'create-char': function (form) {
			var data = new FormData(form);
			var starter = data.get('starter');
			var region = 'kanto';
			STARTER_GENS.forEach(function (group) {
				if (group.ids.indexOf(starter) >= 0) region = group.region;
			});
			var err = window.Store.createChar({ name: data.get('name'), trainer: data.get('trainer'), starter: starter, region: region });
			if (err) { form.querySelector('.form-error').textContent = err; return; }
			history.replaceState(null, '', '#/inicio');
			render();
		},
		'pick-char': function (btn) {
			clearBattle();
			window.Store.pick(btn.dataset.id);
			history.replaceState(null, '', '#/inicio');
			render();
		},
		switch: function () { clearBattle(); window.Store.clearChar(); location.hash = ''; render(); },
		burger: function () { document.getElementById('nav').classList.toggle('open'); },
		menu: function (btn) { btn.parentElement.classList.toggle('open'); },
		'toggle-notes': function () {
			var pop = document.getElementById('note-pop');
			var ch = window.Store.char();
			if (!pop.hidden) { pop.hidden = true; return; }
			(ch.notes || []).forEach(function (n) { n.read = true; });
			window.Store.persist();
			updateChrome();
			pop = document.getElementById('note-pop');
			pop.innerHTML = (ch.notes || []).slice(0, 6).map(function (n) { return '<p>' + esc(n.text) + '</p>'; }).join('') || '<p>Sem avisos.</p>';
			pop.hidden = false;
		},
		'show-missions': function () { homePane = 'missions'; renderView(); },
		'show-pass': function () { homePane = 'pass'; renderView(); },
		'close-pane': function () { homePane = ''; renderView(); },
		'claim-pass': function (btn) {
			var ch = window.Store.char();
			var lv = Number(btn.dataset.lv);
			var pass = ensurePass(ch);
			var reward = PASS_REWARDS.filter(function (r) { return r.lv === lv; })[0];
			if (!reward || passLevel(ch) < lv || pass.claimed.indexOf(lv) >= 0) return;
			if (reward.silver) ch.silver += reward.silver;
			if (reward.item) ch.bag[reward.item] = (ch.bag[reward.item] || 0) + reward.n;
			pass.claimed.push(lv);
			window.Store.persist();
			toast(reward.text + ' resgatado.');
			updateChrome();
			renderView();
		},
		claim: function (btn) {
			var ch = window.Store.char();
			var q = quests(ch);
			var kind = btn.dataset.kind;
			if (kind === 'win' && q.wins >= 1 && !q.winClaimed) { q.winClaimed = true; ch.silver += 500; }
			if (kind === 'catch' && q.catches >= 1 && !q.catchClaimed) { q.catchClaimed = true; ch.silver += 500; }
			window.Store.persist();
			toast('Recompensa recebida.');
			updateChrome();
			renderView();
		},
		'safari-enter': function (btn) {
			var ch = window.Store.char();
			if (!alive(ch)) return toast('Cure o time primeiro.');
			var keep = safari && safari.id === btn.dataset.id;
			safari = keep ? safari : { id: btn.dataset.id, x: 0, y: 0, enc: null, zoom: 1, ready: false, face: 1 };
			if (!safari.enc) rollSafari();
			renderView();
		},
		'safari-leave': function () { safari = null; renderView(); },
		'safari-step': function (btn) { stepSafari(Number(btn.dataset.dx), Number(btn.dataset.dy)); },
		'safari-zoom': function (btn) {
			if (!safari) return;
			safari.zoom = Math.max(0.45, Math.min(1.6, (safari.zoom || 1) + Number(btn.dataset.z) * 0.15));
			layoutSafari();
		},
		'enc-size': function (btn) {
			var ui = encUi();
			var scale = (ui.scale || 1) + Number(btn.dataset.z) * 0.12;
			scale = Math.max(0.75, Math.min(1.7, Math.round(scale * 100) / 100));
			ui.scale = scale;
			saveEncUi(ui);
			applyEncFrame();
		},
		'safari-attack': function () {
			var ch = window.Store.char();
			if (!safari || !safari.enc) return;
			if (!alive(ch)) return toast('Cure o time primeiro.');
			var enc = safari.enc;
			safari.enc = null;
			var mon = window.Catalog.makeMon(enc.id, enc.level, { shiny: enc.shiny });
			startBattle({
				kind: 'wild', title: (mon.shiny ? 'Shiny ' : '') + mon.name + ' selvagem',
				canCatch: true, canRun: true, party: [mon],
				reward: { silver: enc.level * 40, xp: 15 * enc.level }
			});
		},
		npc: function () {
			var ch = window.Store.char();
			if (!alive(ch)) return toast('Cure o time primeiro.');
			var name = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
			var level = Math.min(75, 6 + ch.badges.length * 3 + ch.tLevel);
			var sp = wildSpecies(ch.region);
			startBattle({
				kind: 'trainer', title: 'Treinador ' + name, canCatch: false, canRun: false,
				party: [window.Catalog.makeMon(sp.id, level)],
				reward: { silver: level * 20, xp: 16 + level }
			});
		},
		gym: function (btn) {
			var ch = window.Store.char();
			var i = Number(btn.dataset.i);
			var g = window.Gyms.of(ch.region)[i];
			if (!g) return;
			var level = 12 + i * 5;
			var mon = monOfType(ch.region, g.type, level);
			startBattle({
				kind: 'gym', title: 'Líder ' + g.leader, canCatch: false, canRun: false,
				party: [mon],
				reward: {
					silver: 400 + i * 150,
					gold: ch.badges.indexOf(ch.region + ':' + i) >= 0 ? 0 : 1,
					badge: ch.region + ':' + i,
					badgeName: g.badge || g.gym,
					xp: 30 + level
				}
			});
		},
		collect: function () {
			var ch = window.Store.char();
			if (Date.now() - ch.property.last < 60000) return;
			var gain = 150 * ch.property.level;
			ch.silver += gain;
			ch.property.last = Date.now();
			window.Store.persist();
			toast('A propriedade rendeu ' + money(gain) + ' Silver.');
			updateChrome();
			renderView();
		},
		upgrade: function () {
			var ch = window.Store.char();
			var cost = 2000 * ch.property.level;
			if (ch.property.level >= 5) return;
			if (ch.silver < cost) return toast('Silver insuficiente.');
			ch.silver -= cost;
			ch.property.level += 1;
			window.Store.persist();
			toast('Propriedade no nível ' + ch.property.level + '.');
			updateChrome();
			renderView();
		},
		travel: function (btn) {
			var ch = window.Store.char();
			var id = btn.dataset.id;
			if (id === ch.region) return;
			var known = ch.visited.indexOf(id) >= 0;
			var cost = known ? 400 : 800;
			if (ch.silver < cost) return toast('Silver insuficiente.');
			ch.silver -= cost;
			ch.region = id;
			if (!known) ch.visited.push(id);
			window.Store.persist();
			toast('Você chegou em ' + window.Catalog.regionById(id).name + '.');
			updateChrome();
			renderView();
		},
		heal: function () {
			var ch = window.Store.char();
			ch.team.forEach(function (m) { syncMon(m); m.hp = m.maxHp; });
			window.Store.persist();
			toast('O time foi curado.');
			updateChrome();
			renderView();
		},
		'market-tab': function (btn) { marketTab = btn.dataset.id; renderView(); },
		'market-qty': function (btn) {
			var id = btn.dataset.id;
			var n = Math.max(1, Math.min(99, (marketQty[id] || 1) + Number(btn.dataset.dir)));
			marketQty[id] = n;
			var label = document.getElementById('qty-' + id);
			if (label) label.textContent = String(n);
		},
		'market-buy': function (btn) {
			var ch = window.Store.char();
			var item = window.Shop.byId[btn.dataset.id];
			if (!item) return;
			var n = item.cat === 'skin' ? 1 : (marketQty[item.id] || 1);
			var cost = item.price * n;
			if (item.cat === 'skin' && ch.ownedSkins && ch.ownedSkins.indexOf(item.id) >= 0) return toast('Você já tem essa skin.');
			if (item.cur === 'gold') {
				if (ch.gold < cost) return toast('Gold insuficiente.');
				ch.gold -= cost;
			} else {
				if (ch.silver < cost) return toast('Silver insuficiente.');
				ch.silver -= cost;
			}
			if (item.cat === 'skin') {
				ch.ownedSkins = ch.ownedSkins || [];
				ch.ownedSkins.push(item.id);
				ch.skin = item.skin;
				toast(item.name + ' equipada no mapa.');
			} else {
				ch.bag[item.id] = (ch.bag[item.id] || 0) + n;
				toast(item.name + ' x' + n + ' comprado.');
			}
			window.Store.persist();
			updateChrome();
			renderView();
		},
		'market-equip': function (btn) {
			var ch = window.Store.char();
			var item = window.Shop.byId[btn.dataset.id];
			if (!item || !item.skin) return;
			ch.skin = item.skin;
			window.Store.persist();
			toast(item.name + ' equipada no mapa.');
		},
		'global-tab': function (btn) {
			globalTab = btn.dataset.id === 'mon' ? 'mon' : 'item';
			renderView();
		},
		'global-list-item': function (form) {
			if (battle) return toast('Termine a batalha antes de anunciar.');
			var ch = window.Store.char();
			var data = new FormData(form);
			var id = data.get('item');
			var info = itemRecord(id);
			var qty = Math.floor(Number(data.get('qty')));
			var price = Math.floor(Number(data.get('price')));
			var cur = data.get('cur') === 'gold' ? 'gold' : 'silver';
			if (!info || !(ch.bag[id] > 0)) return toast('Escolha um item da bolsa.');
			if (!(qty >= 1) || qty > ch.bag[id]) return toast('Quantidade inválida.');
			if (!(price >= 1) || price > 99999999) return toast('Informe um preço de 1 a 99.999.999.');
			ch.bag[id] -= qty;
			if (ch.bag[id] <= 0) delete ch.bag[id];
			listings().unshift({
				id: newId(), kind: 'item', sellerId: ch.id, sellerName: ch.name,
				cur: cur, price: price, qty: qty, itemId: id
			});
			window.Store.persist();
			toast(info.name + ' anunciado por ' + money(price) + (cur === 'gold' ? ' Gold.' : ' Silver.'));
			updateChrome();
			renderView();
		},
		'global-list-mon': function (form) {
			if (battle) return toast('Termine a batalha antes de anunciar.');
			var ch = window.Store.char();
			var data = new FormData(form);
			var price = Math.floor(Number(data.get('price')));
			var cur = data.get('cur') === 'gold' ? 'gold' : 'silver';
			if (!(price >= 1) || price > 99999999) return toast('Informe um preço de 1 a 99.999.999.');
			var mon = takeMon(ch, data.get('uid'));
			if (!mon) return toast('Você precisa ficar com pelo menos um Pokémon.');
			if (boxUid === mon.uid) boxUid = null;
			listings().unshift({
				id: newId(), kind: 'mon', sellerId: ch.id, sellerName: ch.name,
				cur: cur, price: price, mon: JSON.parse(JSON.stringify(mon))
			});
			window.Store.persist();
			toast(mon.name + ' anunciado por ' + money(price) + (cur === 'gold' ? ' Gold.' : ' Silver.'));
			updateChrome();
			renderView();
		},
		'global-buy': function (btn) {
			var ch = window.Store.char();
			var board = listings();
			var i = -1;
			for (var n = 0; n < board.length; n++) if (board[n].id === btn.dataset.id) i = n;
			if (i < 0) return toast('Esse anúncio não existe mais.');
			var offer = board[i];
			if (offer.sellerId === ch.id) return toast('Retire o seu próprio anúncio.');
			var seller = window.Store.db().chars[offer.sellerId];
			var err = payListing(ch, seller, offer.cur, offer.price);
			if (err) return toast(err);
			if (offer.kind === 'item') {
				ch.bag[offer.itemId] = (ch.bag[offer.itemId] || 0) + offer.qty;
				var info = itemRecord(offer.itemId);
				toast((info ? info.name : 'Item') + ' x' + offer.qty + ' comprado.');
			} else {
				var where = giveMon(ch, offer.mon);
				toast(offer.mon.name + ' foi para ' + (where === 'time' ? 'o time.' : 'a box.'));
			}
			board.splice(i, 1);
			window.Store.persist();
			updateChrome();
			renderView();
		},
		'global-cancel': function (btn) {
			var ch = window.Store.char();
			var board = listings();
			var i = -1;
			for (var n = 0; n < board.length; n++) if (board[n].id === btn.dataset.id) i = n;
			if (i < 0) return;
			var offer = board[i];
			if (offer.sellerId !== ch.id) return;
			if (offer.kind === 'item') ch.bag[offer.itemId] = (ch.bag[offer.itemId] || 0) + offer.qty;
			else giveMon(ch, offer.mon);
			board.splice(i, 1);
			window.Store.persist();
			toast('Anúncio retirado.');
			updateChrome();
			renderView();
		},
		'donate-tab': function (btn) {
			donateTab = btn.dataset.id === 'rewards' ? 'rewards' : 'packs';
			renderView();
		},
		'donate-buy': function (btn) {
			var ch = window.Store.char();
			ensureDonate(ch);
			var pack = null;
			window.Donate.packs.forEach(function (p) { if (p.id === btn.dataset.id) pack = p; });
			if (!pack) return;
			if (pack.once && ch.donatePacks.indexOf(pack.id) >= 0) return toast('Esse pacote é único e já foi adquirido.');
			grantParts(ch, pack.parts);
			if (pack.once) ch.donatePacks.push(pack.id);
			if (pack.recharge) ch.recharged += pack.recharge;
			window.Store.persist();
			toast(pack.name + ' creditado.' + (pack.recharge ? ' Recarga: ' + money(ch.recharged) + ' Gold.' : ''));
			updateChrome();
			renderView();
		},
		'donate-claim': function (btn) {
			var ch = window.Store.char();
			ensureDonate(ch);
			var need = Number(btn.dataset.need);
			var tier = null;
			window.Donate.rewards.forEach(function (t) { if (t.need === need) tier = t; });
			if (!tier) return;
			if (ch.donateClaims.indexOf(need) >= 0) return toast('Esse prêmio já foi retirado.');
			if (ch.recharged < need) return toast('Ainda não atingiu esse marco.');
			grantParts(ch, tier.parts);
			ch.donateClaims.push(need);
			window.Store.persist();
			toast('Prêmio de ' + compact(need) + ' Gold recebido.');
			updateChrome();
			renderView();
		},
		'open-key': function (btn) { openCase(btn.dataset.id); },
		buy: function (btn) {
			var ch = window.Store.char();
			var info = window.Catalog.items[btn.dataset.id];
			if (btn.dataset.cur === 'gold') {
				if (ch.gold < info.priceGold) return toast('Gold insuficiente.');
				ch.gold -= info.priceGold;
			} else {
				if (ch.silver < info.price) return toast('Silver insuficiente.');
				ch.silver -= info.price;
			}
			ch.bag[btn.dataset.id] = (ch.bag[btn.dataset.id] || 0) + 1;
			window.Store.persist();
			toast(info.name + ' comprado.');
			updateChrome();
			renderView();
		},
		'use-item': function (btn) { pickItem = btn.dataset.id; renderView(); },
		'cancel-use': function () { pickItem = null; renderView(); },
		'confirm-use': function (btn) {
			var ch = window.Store.char();
			var mon = ch.team.filter(function (m) { return m.uid === btn.dataset.uid; })[0];
			if (!mon || !pickItem || !(ch.bag[pickItem] > 0)) return;
			var record = itemRecord(pickItem);
			if (record && record.move) {
				var known = mon.moves.some(function (m) { return m.name === record.move.name; });
				if (known) return toast(mon.name + ' já sabe ' + record.move.name + '.');
				var learned = { name: record.move.name, type: record.move.type, power: record.move.power, maxPp: record.move.maxPp, pp: record.move.maxPp, acc: record.move.acc };
				if (mon.moves.length < 4) mon.moves.push(learned);
				else mon.moves[mon.moves.length - 1] = learned;
				ch.bag[pickItem] -= 1;
				if (!ch.bag[pickItem]) delete ch.bag[pickItem];
				pickItem = null;
				window.Store.persist();
				toast(mon.name + ' aprendeu ' + learned.name + '.');
				updateChrome();
				renderView();
				return;
			}
			var msg = applyItem(mon, pickItem);
			if (msg.indexOf('não pode') === 0 || msg.indexOf('já está') >= 0 || msg.indexOf('não desmaiou') >= 0 || (msg.indexOf('desmaiou') >= 0 && pickItem !== 'revive') || msg.indexOf('não tem efeito') >= 0) {
				toast(msg);
				return;
			}
			ch.bag[pickItem] -= 1;
			if (!ch.bag[pickItem]) delete ch.bag[pickItem];
			pickItem = null;
			window.Store.persist();
			toast(msg);
			updateChrome();
			renderView();
		},
		'evolve-box': function () {
			var ch = window.Store.char();
			var mon = ch.team.concat(ch.box).filter(function (m) { return m.uid === boxUid; })[0];
			if (!mon) return;
			var evo = window.Catalog.evolution(mon);
			if (!evo) return toast(mon.name + ' não pode evoluir agora.');
			var from = mon.name;
			mon.species = evo.id;
			mon.name = evo.name;
			mon.moves = window.Catalog.movesFor(evo);
			ch.seen[evo.id] = true;
			ch.caught[evo.id] = true;
			syncMon(mon);
			window.Store.persist();
			toast('✨ ' + from + ' evoluiu para ' + evo.name + '!');
			updateChrome();
			renderView();
		},
		'select-mon': function (btn) {
			if (boxDrag.suppress) return;
			boxUid = btn.dataset.uid;
			renderView();
		},
		'to-box': function () {
			var ch = window.Store.char();
			if (ch.team.length <= 1) return toast('Deixe ao menos um Pokémon no time.');
			var i = ch.team.findIndex(function (m) { return m.uid === boxUid; });
			if (i < 0) return;
			ch.box.push(ch.team.splice(i, 1)[0]);
			boxUid = null;
			window.Store.persist();
			updateChrome();
			renderView();
		},
		'to-team': function () {
			var ch = window.Store.char();
			var i = ch.box.findIndex(function (m) { return m.uid === boxUid; });
			if (i < 0) return;
			if (ch.team.length >= 6) return toast('O time está cheio. Mande alguém para a box antes.');
			ch.team.push(ch.box.splice(i, 1)[0]);
			boxUid = null;
			window.Store.persist();
			updateChrome();
			renderView();
		},
		bank: function (form) {
			var ch = window.Store.char();
			var data = new FormData(form);
			var op = data.get('op');
			var amount = parseInt(data.get('amount'), 10);
			if (!amount || amount < 1) return toast('Informe um valor inteiro.');
			if (op === 'deposit') {
				if (ch.silver < amount) return toast('Silver insuficiente na mão.');
				ch.silver -= amount;
				ch.bank += amount;
				toast('Depósito feito.');
			} else if (op === 'withdraw') {
				var fee = Math.max(1, Math.ceil(amount * 0.02));
				if (fee >= amount) return toast('Valor baixo demais para o saque.');
				if (ch.bank < amount) return toast('Saldo do cofre insuficiente.');
				ch.bank -= amount;
				ch.silver += amount - fee;
				toast('Saque de ' + money(amount - fee) + ' após taxa de ' + money(fee) + '.');
			} else {
				var other = findChar(data.get('nick'));
				if (!other || other.id === ch.id) return toast('Treinador não encontrado.');
				var cur = data.get('cur');
				var tFee = Math.max(1, Math.ceil(amount * 0.05));
				if (cur === 'gold') {
					if (ch.badges.length < 8) return toast('Gold exige 8 insígnias.');
					if (ch.gold < amount) return toast('Gold insuficiente.');
					ch.gold -= amount;
					other.gold += amount - tFee;
				} else {
					if (ch.silver < amount) return toast('Silver insuficiente.');
					ch.silver -= amount;
					other.silver += amount - tFee;
				}
				note(other, ch.name + ' enviou ' + money(amount - tFee) + ' ' + (cur === 'gold' ? 'Gold' : 'Silver') + '.');
				toast('Enviado. Taxa de ' + money(tFee) + '.');
			}
			window.Store.persist();
			updateChrome();
			renderView();
		},
		search: function (form) {
			var found = findChar(new FormData(form).get('nick'));
			var out = document.getElementById('search-out');
			if (!found) { out.innerHTML = '<p>Nenhum treinador com esse nick.</p>'; return; }
			out.innerHTML = '<article class="card"><h3>' + esc(found.name) + '</h3><p>' + esc(window.Catalog.regionById(found.region).name) + ' · ' + esc(rankLabel(found)) + '</p><p>Time: ' +
				found.team.map(function (m) { return esc(m.name) + ' Nv.' + m.level; }).join(', ') + '</p></article>';
		},
		'battle-pane': function (btn) {
			if (!battle) return;
			if (battle.state.mustSwitch && btn.dataset.pane !== 'party') return;
			battlePane = btn.dataset.pane || 'move';
			renderView();
		},
		'battle-move': function (btn) { resolve(battle.useMove(Number(btn.dataset.i))); },
		'battle-ball': function (btn) {
			var ch = window.Store.char();
			var id = btn.dataset.id;
			if (!(ch.bag[id] > 0)) return;
			ch.bag[id] -= 1;
			if (!ch.bag[id]) delete ch.bag[id];
			resolve(battle.throwBall(id));
		},
		'battle-potion': function (btn) {
			var ch = window.Store.char();
			var id = btn.dataset.id;
			if (!(ch.bag[id] > 0)) return;
			var fx = window.RpgItems[id].effect;
			ch.bag[id] -= 1;
			if (!ch.bag[id]) delete ch.bag[id];
			resolve(battle.usePotion(fx.heal));
		},
		'battle-switch': function (btn) { resolve(battle.switchTo(Number(btn.dataset.i))); },
		'battle-mega': function (btn) {
			if (!battle || battle.state.mustSwitch) return;
			var player = battle.player();
			if (!player || player.hp <= 0 || player.isMega) return;
			var formId = btn.dataset.form;
			var formName = btn.dataset.name || formId;
			var itemName = btn.dataset.item || 'Mega Stone';
			var ok = battle.megaEvolve(formId, formName, itemName);
			if (ok) {
				toast('✨ ' + (player._origName || player.name) + ' Mega Evoluiu para ' + player.name + '!');
				renderView();
			}
		},
		'battle-run': function () { resolve(battle.run()); }
	};

	function render() {
		if (!window.Catalog.ready) {
			document.getElementById('root').innerHTML = '<p class="boot-error">Não foi possível ler a Pokédex em data/pokedex.js.</p>';
			return;
		}
		if (!window.Store.user()) return paintAuth();
		if (!window.Store.char()) return paintSelect();
		if (!location.hash) history.replaceState(null, '', '#/inicio');
		showApp();
	}

	var boxDrag = { suppress: false };

	function reorderMons(fromUid, toUid) {
		var ch = window.Store.char();
		if (!ch || !fromUid || !toUid || fromUid === toUid) return;
		var wasLead = ch.team[0] && ch.team[0].uid;
		var teamHits = ch.team.filter(function (m) { return m.uid === fromUid || m.uid === toUid; });
		var boxHits = ch.box.filter(function (m) { return m.uid === fromUid || m.uid === toUid; });
		if (teamHits.length === 2) {
			var a = ch.team.findIndex(function (m) { return m.uid === fromUid; });
			var b = ch.team.findIndex(function (m) { return m.uid === toUid; });
			var held = ch.team[a];
			ch.team[a] = ch.team[b];
			ch.team[b] = held;
		} else if (boxHits.length === 2) {
			var c = ch.box.findIndex(function (m) { return m.uid === fromUid; });
			var d = ch.box.findIndex(function (m) { return m.uid === toUid; });
			var heldBox = ch.box[c];
			ch.box[c] = ch.box[d];
			ch.box[d] = heldBox;
		} else if (teamHits.length === 1 && boxHits.length === 1) {
			var ti = ch.team.findIndex(function (m) { return m.uid === fromUid || m.uid === toUid; });
			var bi = ch.box.findIndex(function (m) { return m.uid === fromUid || m.uid === toUid; });
			var fromTeam = ch.team[ti];
			ch.team[ti] = ch.box[bi];
			ch.box[bi] = fromTeam;
		} else return;
		window.Store.persist();
		updateChrome();
		if (ch.team[0] && ch.team[0].uid !== wasLead) toast(ch.team[0].name + ' agora é o principal.');
		renderView();
	}

	document.body.addEventListener('pointerdown', function (e) {
		if (route() !== 'box') return;
		var card = e.target.closest('.mon-card[data-uid]');
		if (!card || (e.button != null && e.button !== 0)) return;
		if (!card.closest('.team-order, .box-order')) return;
		if (card.setPointerCapture) card.setPointerCapture(e.pointerId);
		var startX = e.clientX;
		var startY = e.clientY;
		var uid = card.dataset.uid;
		var moved = false;
		var ghost = null;
		var width = 0;
		function clearDrop() {
			document.querySelectorAll('.mon-card.drop-on').forEach(function (el) { el.classList.remove('drop-on'); });
		}
		function move(ev) {
			var dx = ev.clientX - startX;
			var dy = ev.clientY - startY;
			if (!moved && (dx * dx + dy * dy) < 36) return;
			if (!moved) {
				moved = true;
				var rect = card.getBoundingClientRect();
				width = rect.width;
				ghost = card.cloneNode(true);
				ghost.classList.add('team-ghost');
				ghost.removeAttribute('data-act');
				ghost.style.width = width + 'px';
				document.body.appendChild(ghost);
				card.classList.add('dragging');
			}
			ghost.style.left = (ev.clientX - width / 2) + 'px';
			ghost.style.top = (ev.clientY - 28) + 'px';
			clearDrop();
			ghost.style.visibility = 'hidden';
			var under = document.elementFromPoint(ev.clientX, ev.clientY);
			ghost.style.visibility = '';
			var hit = under && under.closest('.mon-card[data-uid]');
			if (hit && hit.dataset.uid !== uid && hit.closest('.team-order, .box-order')) hit.classList.add('drop-on');
			ev.preventDefault();
		}
		function up(ev) {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
			window.removeEventListener('pointercancel', up);
			if (ghost) ghost.remove();
			card.classList.remove('dragging');
			clearDrop();
			var under = document.elementFromPoint(ev.clientX, ev.clientY);
			var hit = under && under.closest('.mon-card[data-uid]');
			var dropped = hit && hit.dataset.uid !== uid && hit.closest('.team-order, .box-order');
			if (!moved && !dropped) return;
			boxDrag.suppress = true;
			setTimeout(function () { boxDrag.suppress = false; }, 80);
			if (dropped) reorderMons(uid, hit.dataset.uid);
		}
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', up);
		window.addEventListener('pointercancel', up);
	});

	document.body.addEventListener('click', function (e) {
		if (boxDrag.suppress) {
			boxDrag.suppress = false;
			return;
		}
		var go = e.target.closest('[data-go]');
		if (go) {
			homePane = '';
			document.querySelectorAll('.menu.open').forEach(function (m) { m.classList.remove('open'); });
			var nav = document.getElementById('nav');
			if (nav) nav.classList.remove('open');
			goto(go.getAttribute('data-go'));
			return;
		}
		var act = e.target.closest('[data-act]');
		if (!act || !Actions[act.dataset.act]) return;
		Actions[act.dataset.act](act, e);
	});
	document.body.addEventListener('submit', function (e) {
		var act = e.target.dataset && e.target.dataset.act;
		if (!act || !Actions[act]) return;
		e.preventDefault();
		Actions[act](e.target, e);
	});
	document.body.addEventListener('keydown', function (e) {
		if (!document.getElementById('safari-stage')) return;
		if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
		var key = e.key;
		var dir = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }[key];
		if (!dir) return;
		e.preventDefault();
		stepSafari(dir[0], dir[1]);
	});
	document.body.addEventListener('input', function (e) {
		if (e.target.id === 'market-q') { marketQuery = e.target.value || ''; paintMarket(); return; }
		if (e.target.id === 'dex-q' || e.target.id === 'dex-region' || e.target.id === 'dex-filter') paintDex();
	});
	document.body.addEventListener('change', function (e) {
		if (e.target.id === 'dex-region' || e.target.id === 'dex-filter') paintDex();
	});
	window.addEventListener('hashchange', function () {
		if (window.Store.char()) showApp();
	});

	var saved = sessionStorage.getItem(BKEY);
	if (saved && window.Store.char()) {
		try {
			var state = JSON.parse(saved);
			if (state.charId === window.Store.char().id) {
				battle = new window.BattleSession(state, function () { return window.Store.char().team; });
			}
		} catch (e) { sessionStorage.removeItem(BKEY); }
	}
	render();
})();
