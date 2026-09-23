(function () {
	'use strict';

	var battleItems = (typeof exports !== 'undefined' && exports.BattleItems) || {};
	var moves = (typeof exports !== 'undefined' && exports.BattleMovedex) || {};
	var i18n = (window.BattleItemsI18n && window.BattleItemsI18n.pt) || {};
	var rpg = window.RpgItems || {};
	var custom = window.RpgBattleItems || {};

	var POTION_PRICE = {
		freshwater: 350, potion: 700, ether: 1400, hyperpotion: 1500, superpotion: 1800,
		maxpotion: 2500, fullrestore: 3000, revive: 3000, elixir: 4000, maxether: 5000,
		antidote: 7000, awakening: 7000, burnheal: 7000, iceheal: 7000, maxelixir: 7000,
		parlyzheal: 7000, maxrevive: 12500, fullheal: 15000
	};
	var BALLS = {
		pokeball: { price: 200, cur: 'silver', catch: 1, desc: 'Taxa ×1. A chance sobe quando o selvagem está com pouco PS.' },
		greatball: { price: 1000, cur: 'silver', catch: 1.5, desc: 'Taxa ×1,5. Mais forte que a Poké Bola.' },
		ultraball: { price: 2460, cur: 'silver', catch: 2, desc: 'Taxa ×2. A mais forte das bolas comuns.' },
		beastball: { price: 6, cur: 'gold', catch: 0.1, desc: 'Taxa ×0,1. Contra um Ultra Beast a taxa passa a ×5.' },
		masterball: { price: 65, cur: 'gold', catch: 255, desc: 'Captura qualquer Pokémon selvagem. A chance é sempre 100%.' }
	};
	var STONE_PRICE = {
		ovalstone: 10000, metalcoat: 50000, kingsrock: 50000, dragonscale: 50000,
		upgrade: 50000, dubiousdisc: 50000, protector: 80000, electirizer: 100000,
		magmarizer: 100000, reapercloth: 100000, prismscale: 80000, razorclaw: 80000,
		razorfang: 80000, deepseatooth: 50000, deepseascale: 50000, sachet: 50000,
		whippeddream: 50000, crackedpot: 100000, chippedpot: 100000, galaricacuff: 100000,
		galaricawreath: 100000, tartapple: 60000, sweetapple: 60000, syrupyapple: 60000,
		unremarkableteacup: 80000, masterpieceteacup: 120000, metalalloy: 100000,
		sunstone: 100000, dawnstone: 150000, duskstone: 150000, firestone: 150000,
		icestone: 150000, leafstone: 150000, moonstone: 150000, shinystone: 150000,
		thunderstone: 150000, waterstone: 150000, auspiciousarmor: 20, maliciousarmor: 20
	};
	var STONE_GOLD = { auspiciousarmor: 1, maliciousarmor: 1 };

	// Discos da folha de itens, um por tipo. Os TRs do conteúdo usam estes spritenums.
	var TM_SPRITE = {
		Normal: 721, Fighting: 722, Flying: 723, Poison: 724, Ground: 725, Rock: 726,
		Bug: 727, Ghost: 728, Steel: 729, Fire: 730, Water: 731, Grass: 732,
		Electric: 733, Psychic: 734, Ice: 735, Dragon: 736, Dark: 737, Fairy: 738
	};

	function iconStyle(entry, scale) {
		if (entry.sheet) {
			return 'background-image:url(\'' + entry.sheet + '\');background-size:192px 192px;background-position:0 0;background-repeat:no-repeat';
		}
		if (entry.iconFile) {
			return 'background-image:url(assets/sprites/itemicons/' + entry.iconFile + '.png);background-size:contain;background-position:center;background-repeat:no-repeat';
		}
		var zoom = scale || (entry.cat === 'tm' ? 2 : 1);
		var num = entry.spritenum || 0;
		var top = Math.floor(num / 16) * 24 * zoom;
		var left = (num % 16) * 24 * zoom;
		return 'background:transparent url(assets/sprites/itemicons-sheet.png) -' + left + 'px -' + top + 'px / ' + (384 * zoom) + 'px ' + (1152 * zoom) + 'px no-repeat';
	}

	function push(list, entry) {
		entry.iconStyle = iconStyle(entry);
		list.push(entry);
		byId[entry.id] = entry;
	}

	var byId = {};
	var tabs = [
		{ id: 'potion', name: 'Poções' },
		{ id: 'item', name: 'Itens' },
		{ id: 'ball', name: 'Pokéballs' },
		{ id: 'stone', name: 'Stones' },
		{ id: 'mega', name: 'Mega Stones' },
		{ id: 'tm', name: 'TMs' },
		{ id: 'custom', name: 'Itens Custom' },
		{ id: 'skinm', name: 'Masculinas' },
		{ id: 'skinf', name: 'Femininas' },
		{ id: 'skin', name: 'Skins' }
	];
	var lists = { potion: [], item: [], ball: [], stone: [], mega: [], tm: [], custom: [], skinm: [], skinf: [], skin: [] };

	Object.keys(POTION_PRICE).forEach(function (id) {
		var src = rpg[id] || {};
		var it = battleItems[id] || {};
		push(lists.potion, {
			id: id, cat: 'potion', name: src.name || it.name || id,
			desc: i18n[id] || it.shortDesc || '',
			iconFile: src.icon || '', spritenum: it.spritenum || 0,
			price: POTION_PRICE[id], cur: 'silver'
		});
	});

	Object.keys(BALLS).forEach(function (id) {
		var it = battleItems[id] || {};
		var info = BALLS[id];
		push(lists.ball, {
			id: id, cat: 'ball', name: it.name || id, desc: info.desc || i18n[id] || it.shortDesc || '',
			spritenum: it.spritenum || 0, price: info.price, cur: info.cur, catch: info.catch
		});
	});

	Object.keys(STONE_PRICE).forEach(function (id) {
		var it = battleItems[id];
		if (!it) return;
		push(lists.stone, {
			id: id, cat: 'stone', name: it.name, desc: i18n[id] || it.shortDesc || '',
			spritenum: it.spritenum || 0, price: STONE_PRICE[id],
			cur: STONE_GOLD[id] ? 'gold' : 'silver'
		});
	});

	Object.keys(battleItems).sort().forEach(function (id) {
		var it = battleItems[id];
		if (!it || !it.megaStone) return;
		if (it.isNonstandard === 'CAP' || it.isNonstandard === 'Custom') return;
		push(lists.mega, {
			id: id, cat: 'mega', name: it.name, desc: i18n[id] || it.shortDesc || '',
			spritenum: it.spritenum || 0, price: 40000, cur: 'silver'
		});
	});

	Object.keys(custom).forEach(function (id) {
		if (byId[id]) return;
		var it = custom[id];
		var gold = id === 'rayquazanite' ? 80 : (id === 'dynamaxband' || id === 'teraorb' ? 40 : 0);
		push(lists.custom, {
			id: id, cat: 'custom', name: it.name, desc: i18n[id] || it.shortDesc || it.desc || '',
			iconFile: it.icon || '', spritenum: it.spritenum || 0,
			price: gold || 25000, cur: gold ? 'gold' : 'silver'
		});
	});

	var stoneIds = {};
	Object.keys(STONE_PRICE).forEach(function (id) { stoneIds[id] = 1; });
	Object.keys(battleItems).sort().forEach(function (id) {
		if (byId[id] || stoneIds[id]) return;
		var it = battleItems[id];
		if (!it || it.megaStone || it.isPokeball) return;
		if (/berry$|mail$|fossil$|memory$|iumz$/.test(id)) return;
		if (it.isNonstandard === 'CAP' || it.isNonstandard === 'Custom' || it.isNonstandard === 'Future' || it.isNonstandard === 'Unobtainable') return;
		var held = it.fling || it.onBasePower || it.onModifyAtk || it.onModifyDef || it.onModifySpA || it.onModifySpD || it.onModifySpe || it.onResidual || it.onDamagingHit || it.onSourceModifyDamage || it.onModifyMove || it.onSwitchIn;
		if (!held) return;
		var bp = (it.fling && it.fling.basePower) || 30;
		push(lists.item, {
			id: id, cat: 'item', name: it.name, desc: i18n[id] || it.shortDesc || '',
			spritenum: it.spritenum || 0, price: 8000 + bp * 180, cur: 'silver'
		});
	});

	Object.keys(moves).forEach(function (id) {
		var mv = moves[id];
		if (!mv || mv.isZ || mv.isMax || !mv.type || mv.num < 1) return;
		if (mv.isNonstandard === 'CAP' || mv.isNonstandard === 'Future' || mv.isNonstandard === 'LGPE') return;
		if (id.indexOf('gmax') >= 0) return;
		var power = mv.basePower || 0;
		push(lists.tm, {
			id: 'tm-' + id, cat: 'tm', name: 'TM ' + mv.name,
			desc: 'Ensina ' + mv.name + '. Some da bolsa ao usar.',
			spritenum: TM_SPRITE[mv.type] || 721, price: power ? Math.min(100000, 40000 + power * 400) : 60000, cur: 'silver',
			move: { name: mv.name, type: mv.type, power: power, maxPp: mv.pp || 10, acc: mv.accuracy === true ? 100 : (mv.accuracy || 100) }
		});
	});

	['male', 'female'].forEach(function (folder) {
		var label = folder === 'female' ? 'Treinadora' : 'Treinador';
		var list = folder === 'female' ? lists.skinf : lists.skinm;
		for (var i = 0; i < 38; i++) {
			push(list, {
				id: 'skin-' + folder + '-' + i, cat: 'skin', name: label + ' ' + (i + 1),
				desc: 'Skin para andar no mapa. Só pode ter 1x.',
				sheet: 'assets/rpg-images/charsprites/' + folder + '/sprite_' + i + '.png',
				price: 50, cur: 'gold', skin: { folder: folder, id: i }
			});
		}
	});

	var CUSTOM_SKINS = [
		{ file: 'skin_42.png', name: 'Bender', price: 50, buffs: { silver: 0.04 } },
		{ file: 'skin_37.png', name: 'Chapolim', price: 50, buffs: { xp: 0.02, silver: 0.02 } },
		{ file: 'skin_38.png', name: 'Cynthia', price: 50, buffs: { xp: 0.04 } },
		{ file: 'skin_34.png', name: 'Enf. Joey', price: 50, buffs: { xp: 0.04 } },
		{ file: 'skin_35.png', name: 'Gato', price: 50, buffs: { shiny: 0.01, xp: 0.02 } },
		{ file: 'skin_44.png', name: 'Gojo', price: 50, buffs: { xp: 0.04 } },
		{ file: 'skin_39.png', name: 'Kratos', price: 50, buffs: { shiny: 0.01, xp: 0.02 } },
		{ file: 'skin_28.png', name: 'Luffy', price: 50, buffs: { silver: 0.04 } },
		{ file: 'skin_36.png', name: 'Madara Seis Caminhos', price: 50, buffs: { xp: 0.01, silver: 0.03 } },
		{ file: 'skin_31.png', name: 'Meowth Roupa', price: 50, buffs: { silver: 0.04 } },
		{ file: 'skin_33.png', name: 'Midoriya', price: 50, buffs: { silver: 0.04 } },
		{ file: 'skin_61.png', name: 'Ofc Jenny', price: 75, buffs: { shiny: 0.01, xp: 0.02 } },
		{ file: 'skin_59.png', name: 'Oak', price: 90, buffs: { shiny: 0.02, legend: 0.02 } },
		{ file: 'skin_63.png', name: 'Rocket Team', price: 90, buffs: { shiny: 0.02, legend: 0.02 } },
		{ file: 'skin_60.png', name: 'Gary', price: 100, buffs: { shiny: 0.03, xp: 0.01 } },
		{ file: 'skin_62.png', name: 'Korrina', price: 100, buffs: { shiny: 0.02, xp: 0.01, legend: 0.02 } }
	];
	CUSTOM_SKINS.forEach(function (sk) {
		push(lists.skin, {
			id: 'skin-custom-' + sk.file, cat: 'skin', name: sk.name,
			desc: 'Skin para andar no mapa. Só pode ter 1x.',
			sheet: 'assets/rpg-images/skins/' + sk.file,
			price: sk.price, cur: 'gold', buffs: sk.buffs,
			skin: { folder: 'skins', file: sk.file, buffs: sk.buffs, name: sk.name }
		});
	});

	tabs.forEach(function (tab) { tab.count = lists[tab.id].length; });

	window.Shop = {
		tabs: tabs,
		lists: lists,
		byId: byId,
		iconStyle: iconStyle
	};
})();
