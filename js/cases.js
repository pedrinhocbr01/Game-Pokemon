(function () {
	'use strict';

	var STARTERS = ['bulbasaur', 'charmander', 'squirtle', 'chikorita', 'cyndaquil', 'totodile', 'treecko', 'torchic', 'mudkip', 'turtwig', 'chimchar', 'piplup', 'snivy', 'tepig', 'oshawott', 'chespin', 'fennekin', 'froakie', 'rowlet', 'litten', 'popplio', 'grookey', 'scorbunny', 'sobble', 'sprigatito', 'fuecoco', 'quaxly'];
	var RARITY = {
		comum: 'Comum',
		incomum: 'Incomum',
		raro: 'Raro',
		superraro: 'Super raro',
		epico: 'Épico',
		lendario: 'Lendário'
	};

	function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

	function silverPrize(n, rarity) {
		return { kind: 'silver', n: n, rarity: rarity, label: n.toLocaleString('pt-BR') + ' Silver' };
	}
	function itemPrize(id, n, rarity, label) {
		return { kind: 'item', item: id, n: n, rarity: rarity, label: (label || id) + ' x' + n };
	}
	function monPrize(species, level, shiny, rarity) {
		var sp = window.Catalog && window.Catalog.byId[species];
		var name = sp ? sp.name : species;
		return {
			kind: 'mon', species: species, level: level, shiny: !!shiny, rarity: rarity,
			label: (shiny ? 'Shiny ' : '') + name + ' Nv.' + level
		};
	}

	function legendSpecies() {
		var list = (window.Catalog && window.Catalog.list || []).filter(function (sp) {
			return window.Catalog.isLegendary(sp);
		});
		return list.length ? pick(list).id : 'rayquaza';
	}

	function weighted(rows) {
		var total = 0;
		rows.forEach(function (row) { total += row.w; });
		var roll = Math.random() * total;
		for (var i = 0; i < rows.length; i++) {
			roll -= rows[i].w;
			if (roll <= 0) return rows[i].make();
		}
		return rows[rows.length - 1].make();
	}

	function themed(species) {
		return weighted([
			{ w: 34, make: function () { return silverPrize(20000 + Math.floor(Math.random() * 80000), 'comum'); } },
			{ w: 22, make: function () { return itemPrize('pokeball', 8 + Math.floor(Math.random() * 8), 'incomum', 'Poké Bola'); } },
			{ w: 16, make: function () { return itemPrize('greatball', 4, 'raro', 'Great Ball'); } },
			{ w: 12, make: function () { return itemPrize('ultraball', 2, 'superraro', 'Ultra Ball'); } },
			{ w: 8, make: function () { return itemPrize('rarecandy', 1, 'epico', 'Doce Raro'); } },
			{ w: 6, make: function () { return monPrize(species, 35, false, 'epico'); } },
			{ w: 2, make: function () { return monPrize(species, 50, Math.random() < 0.2, 'lendario'); } }
		]);
	}

	function roll(keyId) {
		var meta = window.Donate && window.Donate.keysById[keyId];
		if (!meta) return silverPrize(10000, 'comum');
		if (keyId === 'legendary') {
			return monPrize(legendSpecies(), 45 + Math.floor(Math.random() * 16), Math.random() < 0.08, 'lendario');
		}
		if (keyId === 'inicial') {
			return weighted([
				{ w: 28, make: function () { return silverPrize(15000 + Math.floor(Math.random() * 40000), 'comum'); } },
				{ w: 22, make: function () { return itemPrize('pokeball', 10, 'incomum', 'Poké Bola'); } },
				{ w: 18, make: function () { return itemPrize('potion', 5, 'incomum', 'Poção'); } },
				{ w: 16, make: function () { return itemPrize('rarecandy', 1, 'raro', 'Doce Raro'); } },
				{ w: 12, make: function () { return monPrize(pick(STARTERS), 5, false, 'epico'); } },
				{ w: 4, make: function () { return monPrize(pick(STARTERS), 12, Math.random() < 0.12, 'lendario'); } }
			]);
		}
		var species = meta.species && window.Catalog && window.Catalog.byId[meta.species] ? meta.species : legendSpecies();
		return themed(species);
	}

	window.Cases = { roll: roll, rarityName: RARITY };
})();
