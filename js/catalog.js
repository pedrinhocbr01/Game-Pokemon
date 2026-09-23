(function () {
	'use strict';

	var dex = (typeof exports !== 'undefined' && exports.BattlePokedex) || (typeof window !== 'undefined' && window.BattlePokedex) || (typeof window !== 'undefined' && window.exports && window.exports.BattlePokedex) || {};
	var chart = (typeof exports !== 'undefined' && exports.BattleTypeChart) || (typeof window !== 'undefined' && window.BattleTypeChart) || (typeof window !== 'undefined' && window.exports && window.exports.BattleTypeChart) || {};
	if (typeof window !== 'undefined' && !window.BattlePokedex && Object.keys(dex).length) window.BattlePokedex = dex;

	var TYPE_PT = {
		Normal: 'Normal', Fire: 'Fogo', Water: 'Água', Electric: 'Elétrico', Grass: 'Planta',
		Ice: 'Gelo', Fighting: 'Lutador', Poison: 'Veneno', Ground: 'Terrestre', Flying: 'Voador',
		Psychic: 'Psíquico', Bug: 'Inseto', Rock: 'Pedra', Ghost: 'Fantasma', Dragon: 'Dragão',
		Dark: 'Sombrio', Steel: 'Aço', Fairy: 'Fada'
	};

	var TYPE_COLOR = {
		Normal: '#A8A77A', Fire: '#EE8130', Water: '#6390F0', Electric: '#F7D02C', Grass: '#7AC74C',
		Ice: '#96D9D6', Fighting: '#C22E28', Poison: '#A33EA1', Ground: '#E2BF65', Flying: '#A98FF3',
		Psychic: '#F95587', Bug: '#A6B91A', Rock: '#B6A136', Ghost: '#735797', Dragon: '#6F35FC',
		Dark: '#705746', Steel: '#B7B7CE', Fairy: '#D685AD'
	};

	var REGIONS = [
		{ id: 'kanto', name: 'Kanto', from: 1, to: 151 },
		{ id: 'johto', name: 'Johto', from: 152, to: 251 },
		{ id: 'hoenn', name: 'Hoenn', from: 252, to: 386 },
		{ id: 'sinnoh', name: 'Sinnoh', from: 387, to: 493 },
		{ id: 'unova', name: 'Unova', from: 494, to: 649 },
		{ id: 'kalos', name: 'Kalos', from: 650, to: 721 },
		{ id: 'alola', name: 'Alola', from: 722, to: 809 },
		{ id: 'galar', name: 'Galar', from: 810, to: 905 },
		{ id: 'paldea', name: 'Paldea', from: 906, to: 1025 }
	];

	function mv(name, type, power, maxPp, kind) {
		return { name: name, type: type, power: power, maxPp: maxPp, acc: 100, kind: kind || (power ? 'Physical' : 'Status') };
	}

	var BOOK = {
		Normal: [mv('Investida', 'Normal', 40, 35), mv('Pancada', 'Normal', 80, 15), mv('Rapidez', 'Normal', 60, 20), mv('Rosnado', 'Normal', 0, 40)],
		Fire: [mv('Brasa', 'Fire', 40, 25, 'Special'), mv('Lança-chamas', 'Fire', 90, 15, 'Special'), mv('Giro de Fogo', 'Fire', 60, 25, 'Special'), mv('Rosnado', 'Normal', 0, 40)],
		Water: [mv('Jato d\'Água', 'Water', 40, 25, 'Special'), mv('Surfar', 'Water', 90, 15, 'Special'), mv('Bolhas', 'Water', 65, 20, 'Special'), mv('Rosnado', 'Normal', 0, 40)],
		Electric: [mv('Choque do Trovão', 'Electric', 40, 30, 'Special'), mv('Trovão', 'Electric', 110, 10, 'Special'), mv('Faísca', 'Electric', 65, 20), mv('Rosnado', 'Normal', 0, 40)],
		Grass: [mv('Folha Navalha', 'Grass', 55, 25), mv('Raio Solar', 'Grass', 120, 10, 'Special'), mv('Absorção', 'Grass', 40, 25, 'Special'), mv('Rosnado', 'Normal', 0, 40)],
		Ice: [mv('Caco de Gelo', 'Ice', 40, 30), mv('Nevasca', 'Ice', 110, 5, 'Special'), mv('Raio de Gelo', 'Ice', 90, 10, 'Special'), mv('Rosnado', 'Normal', 0, 40)],
		Fighting: [mv('Soco', 'Fighting', 40, 35), mv('Quebra-Tijolo', 'Fighting', 75, 15), mv('Chute Baixo', 'Fighting', 65, 20), mv('Rosnado', 'Normal', 0, 40)],
		Poison: [mv('Picada Venenosa', 'Poison', 15, 35), mv('Bomba de Lodo', 'Poison', 90, 10, 'Special'), mv('Ácido', 'Poison', 40, 30, 'Special'), mv('Rosnado', 'Normal', 0, 40)],
		Ground: [mv('Terremoto', 'Ground', 100, 10), mv('Ossada', 'Ground', 65, 20), mv('Lama', 'Ground', 40, 20, 'Special'), mv('Rosnado', 'Normal', 0, 40)],
		Flying: [mv('Ataque de Asa', 'Flying', 60, 35), mv('Aéreo', 'Flying', 90, 15), mv('Bicada', 'Flying', 35, 35), mv('Rosnado', 'Normal', 0, 40)],
		Psychic: [mv('Confusão', 'Psychic', 50, 25, 'Special'), mv('Psíquico', 'Psychic', 90, 10, 'Special'), mv('Rajada Zen', 'Psychic', 80, 15, 'Special'), mv('Rosnado', 'Normal', 0, 40)],
		Bug: [mv('Picada', 'Bug', 60, 20), mv('Zumbido', 'Bug', 90, 10, 'Special'), mv('Tesoura X', 'Bug', 80, 15), mv('Rosnado', 'Normal', 0, 40)],
		Rock: [mv('Lançamento de Rocha', 'Rock', 50, 15), mv('Pedrada', 'Rock', 75, 10), mv('Poder Ancestral', 'Rock', 60, 5, 'Special'), mv('Rosnado', 'Normal', 0, 40)],
		Ghost: [mv('Lambida', 'Ghost', 30, 30), mv('Bola Sombria', 'Ghost', 80, 15, 'Special'), mv('Assombração', 'Ghost', 90, 10, 'Special'), mv('Rosnado', 'Normal', 0, 40)],
		Dragon: [mv('Sopro do Dragão', 'Dragon', 60, 20, 'Special'), mv('Garra de Dragão', 'Dragon', 80, 15), mv('Pulso do Dragão', 'Dragon', 85, 10, 'Special'), mv('Rosnado', 'Normal', 0, 40)],
		Dark: [mv('Mordida', 'Dark', 60, 25), mv('Pulso Sombrio', 'Dark', 80, 15, 'Special'), mv('Triturar', 'Dark', 80, 15), mv('Rosnado', 'Normal', 0, 40)],
		Steel: [mv('Garra de Metal', 'Steel', 50, 35), mv('Cabeça de Ferro', 'Steel', 80, 15), mv('Cauda de Ferro', 'Steel', 100, 15), mv('Rosnado', 'Normal', 0, 40)],
		Fairy: [mv('Vento de Fada', 'Fairy', 40, 30, 'Special'), mv('Beijo Drenante', 'Fairy', 50, 10, 'Special'), mv('Jogo Duro', 'Fairy', 90, 10), mv('Rosnado', 'Normal', 0, 40)]
	};
	var MOVE_KIND = {};
	Object.keys(BOOK).forEach(function (t) {
		BOOK[t].forEach(function (m) { MOVE_KIND[m.name] = m.kind; });
	});
	function moveKind(move) {
		if (!move) return 'Status';
		if (move.kind) return move.kind;
		if (MOVE_KIND[move.name]) return MOVE_KIND[move.name];
		return move.power ? 'Physical' : 'Status';
	}

	var byNum = new Map();
	Object.keys(dex).forEach(function (id) {
		var p = dex[id];
		if (!p || p.num < 1 || p.num > 1025 || p.forme || p.isNonstandard === 'Custom') return;
		if (!byNum.has(p.num)) byNum.set(p.num, Object.assign({ id: id }, p));
	});
	var list = Array.from(byNum.values()).sort(function (a, b) { return a.num - b.num; });
	var byId = {};
	list.forEach(function (s) { byId[s.id] = s; });

	var ITEMS = {
		pokeball: { name: 'Poké Bola', cat: 'ball', catch: 1, price: 200 },
		greatball: { name: 'Grande Bola', cat: 'ball', catch: 1.5, price: 600 },
		ultraball: { name: 'Ultra Bola', cat: 'ball', catch: 2, price: 1200 },
		beastball: { name: 'Beast Ball', cat: 'ball', catch: 1.2 },
		masterball: { name: 'Master Ball', cat: 'ball', catch: 100 },
		potion: { name: 'Poção', cat: 'medicine', price: 300 },
		superpotion: { name: 'Super Poção', cat: 'medicine', price: 700 },
		hyperpotion: { name: 'Hiper Poção', cat: 'medicine', price: 1500 },
		revive: { name: 'Reviver', cat: 'medicine', price: 1800 },
		fullheal: { name: 'Cura Total', cat: 'medicine', price: 600 },
		rarecandy: { name: 'Doce Raro', cat: 'medicine', priceGold: 3 }
	};

	function regionById(id) {
		for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].id === id) return REGIONS[i];
		return REGIONS[0];
	}

	function isLegendary(sp) {
		var table = window.BattleLegendaries || {};
		return !!(sp && table[sp.num]);
	}

	function inRegion(id) {
		var r = regionById(id);
		return list.filter(function (s) { return s.num >= r.from && s.num <= r.to; });
	}

	function stats(speciesId, level) {
		var sp = byId[speciesId] || getSpecies(speciesId);
		if (!sp || !sp.baseStats) return { hp: 20, atk: 10, def: 10, spa: 10, spd: 10, spe: 10 };
		var b = sp.baseStats;
		var stat = function (base) { return Math.floor((2 * base * level) / 100) + 5; };
		return {
			hp: Math.floor((2 * b.hp * level) / 100) + level + 10,
			atk: stat(b.atk), def: stat(b.def), spa: stat(b.spa), spd: stat(b.spd), spe: stat(b.spe)
		};
	}

	function movesFor(species) {
		var sp = typeof species === 'string' ? (byId[species] || getSpecies(species)) : species;
		if (!sp || !sp.types || !sp.types.length) return [];
		var primary = BOOK[sp.types[0]] || BOOK.Normal;
		var second = sp.types[1] ? (BOOK[sp.types[1]] || BOOK.Normal) : null;
		var chosen = [primary[0], primary[1], second ? second[0] : primary[2], primary[3]];
		return chosen.map(function (m) {
			return { name: m.name, type: m.type, power: m.power, acc: m.acc, maxPp: m.maxPp, pp: m.maxPp, kind: m.kind };
		});
	}

	function makeMon(speciesId, level, opts) {
		opts = opts || {};
		var sp = byId[speciesId] || getSpecies(speciesId);
		var st = stats(speciesId, level);
		return {
			uid: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
			species: (sp && sp.id) || speciesId,
			name: (sp && sp.name) || speciesId,
			level: level,
			exp: 0,
			hp: st.hp,
			maxHp: st.hp,
			shiny: !!opts.shiny,
			moves: movesFor(sp)
		};
	}

	function toID(text) {
		return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
	}

	function getSpecies(idOrName) {
		if (!idOrName) return null;
		var clean = toID(idOrName);
		if (byId[clean]) return byId[clean];
		var p = dex[clean];
		if (p) {
			var obj = Object.assign({ id: clean }, p);
			byId[clean] = obj;
			return obj;
		}
		for (var k in dex) {
			if (dex[k] && dex[k].name && toID(dex[k].name) === clean) {
				var res = Object.assign({ id: k }, dex[k]);
				byId[k] = res;
				return res;
			}
		}
		return null;
	}

	function evolution(mon) {
		if (!mon || !mon.species) return null;
		var sp = dex[toID(mon.species)] || byId[toID(mon.species)];
		if (!sp || !sp.evos || !sp.evos.length) return null;
		for (var i = 0; i < sp.evos.length; i++) {
			var targetId = toID(sp.evos[i]);
			var target = dex[targetId] || byId[targetId];
			if (!target) continue;
			if (target.evoItem) continue;
			if (target.evoLevel && mon.level >= target.evoLevel) {
				return getSpecies(targetId);
			}
			if (target.evoType === 'levelFriendship' && mon.level >= (target.evoLevel || 25)) {
				return getSpecies(targetId);
			}
			if (target.evoType === 'trade' && mon.level >= (target.evoLevel || 36)) {
				return getSpecies(targetId);
			}
			if (target.evoType === 'levelMove' && mon.level >= (target.evoLevel || 32)) {
				return getSpecies(targetId);
			}
			if (target.evoType === 'levelExtra' && mon.level >= (target.evoLevel || 30)) {
				return getSpecies(targetId);
			}
		}
		return null;
	}

	var EVO_ITEMS = {
		thunderstone: 1, waterstone: 1, firestone: 1, leafstone: 1, moonstone: 1, sunstone: 1,
		shinystone: 1, duskstone: 1, dawnstone: 1, icestone: 1, ovalstone: 1,
		metalcoat: 1, kingsrock: 1, dragonscale: 1, upgrade: 1, dubiousdisc: 1,
		electirizer: 1, magmarizer: 1, protector: 1, reapercloth: 1, prismscale: 1,
		razorclaw: 1, razorfang: 1, deepseatooth: 1, deepseascale: 1, sachet: 1, whippeddream: 1,
		crackedpot: 1, chippedpot: 1, galaricacuff: 1, galaricawreath: 1,
		tartapple: 1, sweetapple: 1, syrupyapple: 1,
		auspiciousarmor: 1, maliciousarmor: 1, unremarkableteacup: 1, masterpieceteacup: 1, metalalloy: 1
	};

	function isEvoItem(itemId) {
		if (!itemId) return false;
		var clean = toID(itemId);
		if (EVO_ITEMS[clean]) return true;
		var bi = (window.BattleItems && window.BattleItems[clean]) || {};
		if (bi.desc && /evolve/i.test(bi.desc)) return true;
		return false;
	}

	function canEvolveWithItem(mon, itemId) {
		if (!mon || !mon.species || !itemId) return null;
		var sp = dex[toID(mon.species)] || byId[toID(mon.species)];
		if (!sp || !sp.evos || !sp.evos.length) return null;
		var cleanItem = toID(itemId);
		var bi = (window.BattleItems && window.BattleItems[cleanItem]) || {};
		var itemNameClean = bi.name ? toID(bi.name) : cleanItem;

		for (var i = 0; i < sp.evos.length; i++) {
			var targetId = toID(sp.evos[i]);
			var target = dex[targetId] || byId[targetId];
			if (!target) continue;
			if (target.evoItem) {
				var targetItemClean = toID(target.evoItem);
				if (targetItemClean === cleanItem || targetItemClean === itemNameClean) {
					return getSpecies(targetId);
				}
			}
		}
		return null;
	}

	function getAvailableMegas(mon, bag) {
		if (!mon || !mon.species) return [];
		var clean = toID(mon.species);
		var sp = dex[clean] || byId[clean] || getSpecies(clean);
		if (!sp) return [];
		var baseId = sp.baseSpecies ? toID(sp.baseSpecies) : clean;
		var baseSp = dex[baseId] || byId[baseId] || getSpecies(baseId) || sp;
		if (!baseSp || !baseSp.otherFormes) return [];

		var bagItems = bag || {};
		var results = [];

		baseSp.otherFormes.forEach(function (formName) {
			var formId = toID(formName);
			var formDex = dex[formId] || getSpecies(formId);
			if (formDex && (formDex.isMega || (formDex.forme && formDex.forme.indexOf('Mega') >= 0) || formDex.forme === 'Primal')) {
				var reqItem = formDex.requiredItem;
				var reqItemId = reqItem ? toID(reqItem) : null;
				if (formId === 'rayquazamega') {
					if (bagItems['rayquazanite'] > 0 || (mon.moves && mon.moves.some(function (m) { return m.name === 'Dragon Ascent' || m.name === 'Ascensão do Dragão'; }))) {
						results.push({ formId: formId, name: formDex.name, reqItem: 'Rayquazanite', reqItemId: 'rayquazanite', dex: formDex });
					}
				} else if (reqItemId && bagItems[reqItemId] > 0) {
					results.push({ formId: formId, name: formDex.name, reqItem: reqItem, reqItemId: reqItemId, dex: formDex });
				}
			}
		});
		return results;
	}

	var MAP_FILES = [
		'map_0b21fee3ae939b2a.png',
		'map_1add60d217f5b8f6.png',
		'map_26fd5cb1af54955c.png',
		'map_2cdb951b9d00732a.png',
		'map_59e1c88cb6304869.png',
		'map_69837dde1f3ad6d9.png',
		'map_75958a055332c741.png',
		'map_824c65c2a118a34e.png',
		'map_a3b6584bba7244a9.png',
		'map_abb2af69c2e1733a.png',
		'map_c7d2fded47e4dadf.png',
		'map_dc38c551bf4de685.png'
	];

	function assetId(speciesIdOrNum) {
		var special = window.BattleOldSpritesSpecial || {};
		if (special[speciesIdOrNum]) return special[speciesIdOrNum];
		var table = window.BattleOldSprites || {};
		if (table[speciesIdOrNum]) return table[speciesIdOrNum];
		var clean = toID(speciesIdOrNum);
		if (special[clean]) return special[clean];
		if (table[clean]) return table[clean];
		var sp = byId[clean] || (dex && dex[clean]);
		if (sp && special[sp.id]) return special[sp.id];
		if (sp && table[sp.id]) return table[sp.id];
		if (sp) return String(sp.num);
		return String(speciesIdOrNum);
	}

	function sprite(speciesIdOrNum, shiny, kind) {
		var id = assetId(speciesIdOrNum);
		var root = 'assets/rpg-images/' + (shiny ? 'shiny' : 'pokemon');
		if (kind === 'icon') return root + '/icon/' + id + '.gif';
		if (kind === 'back') return root + '/back/' + id + '.gif';
		if (kind === 'overworld') return root + '/overworld/' + id + '.png';
		return root + '/' + id + '.gif';
	}

	function regionMap(regionId) {
		var i = 0;
		for (var n = 0; n < REGIONS.length; n++) if (REGIONS[n].id === regionId) i = n;
		return 'assets/rpg-images/maps/' + MAP_FILES[i % MAP_FILES.length];
	}

	function scene(name) {
		var extra = { propriedade: 9, centro: 10, npcs: 11 };
		if (extra[name] != null) return 'assets/rpg-images/maps/' + MAP_FILES[extra[name]];
		return regionMap(name);
	}

	function battleBg(type) {
		if (type === 'Water' || type === 'Ice') return 'assets/rpg-images/attack/backgrounds/Water1.png';
		if (type === 'Grass' || type === 'Bug' || type === 'Fairy') return 'assets/rpg-images/attack/backgrounds/Gras1.png';
		return 'assets/rpg-images/attack/backgrounds/Gras2.png';
	}

	function itemIcon(id) {
		var rpg = window.RpgItems && window.RpgItems[id];
		if (rpg && rpg.icon) return 'assets/sprites/itemicons/' + rpg.icon + '.png';
		return '';
	}

	function typeMod(moveType, defenderTypes) {
		var m = 1;
		(defenderTypes || []).forEach(function (t) {
			var row = chart[String(t).toLowerCase()];
			var code = row && row.damageTaken ? row.damageTaken[moveType] : 0;
			if (code === 1) m *= 2;
			else if (code === 2) m *= 0.5;
			else if (code === 3) m *= 0;
		});
		return m;
	}

	function typeNote(moveType, defenderTypes) {
		var mod = typeMod(moveType, defenderTypes);
		var types = defenderTypes || [];
		if (mod === 0) {
			var immune = types[0];
			types.forEach(function (t) {
				var row = chart[String(t).toLowerCase()];
				if (row && row.damageTaken && row.damageTaken[moveType] === 3) immune = t;
			});
			return { mod: 0, label: 'imune', text: (TYPE_PT[immune] || immune) + ' é imune a ' + (TYPE_PT[moveType] || moveType) + '.' };
		}
		if (mod >= 4) return { mod: mod, label: '4×', text: 'É extremamente eficaz!' };
		if (mod >= 2) return { mod: mod, label: '2×', text: 'É supereficaz!' };
		if (mod <= 0.25) return { mod: mod, label: '¼×', text: 'Quase não afetou.' };
		if (mod < 1) return { mod: mod, label: '½×', text: 'Não é muito eficaz.' };
		return { mod: mod, label: '', text: '' };
	}

	window.Catalog = {
		list: list,
		byId: byId,
		regions: REGIONS,
		items: ITEMS,
		typePt: TYPE_PT,
		typeColor: TYPE_COLOR,
		regionById: regionById,
		inRegion: inRegion,
		isLegendary: isLegendary,
		stats: stats,
		movesFor: movesFor,
		moveKind: moveKind,
		makeMon: makeMon,
		evolution: evolution,
		canEvolveWithItem: canEvolveWithItem,
		isEvoItem: isEvoItem,
		getSpecies: getSpecies,
		getAvailableMegas: getAvailableMegas,
		sprite: sprite,
		regionMap: regionMap,
		scene: scene,
		battleBg: battleBg,
		itemIcon: itemIcon,
		typeMod: typeMod,
		typeNote: typeNote,
		ready: list.length > 0
	};
})();
