(function () {
	'use strict';

	function g(n) { return { kind: 'gold', n: n }; }
	function s(n) { return { kind: 'silver', n: n }; }
	function v(n) { return { kind: 'vip', n: n }; }
	function it(id, n) { return { kind: 'item', id: id, n: n }; }
	function key(id, n) { return { kind: 'key', id: id, n: n }; }
	function skin(id) { return { kind: 'skin', id: id }; }

	var KEYS = [
		{ id: 'arceus', name: 'Arceus Key', box: 'Arceus Case', species: 'arceus' },
		{ id: 'dialga', name: 'Dialga Key', box: 'Dialga Box', species: 'dialga' },
		{ id: 'groudon', name: 'Groudon Key', box: 'Groudon Case', species: 'groudon' },
		{ id: 'inicial', name: 'Inicial Key', box: 'Inicial Case', species: '' },
		{ id: 'kyogre', name: 'Kyogre Key', box: 'Kyogre Case', species: 'kyogre' },
		{ id: 'legendary', name: 'Legendary Key', box: 'Legendary Case', species: '' },
		{ id: 'mewtwo', name: 'Mewtwo Key', box: 'Mewtwo Case', species: 'mewtwo' },
		{ id: 'palkia', name: 'Palkia Key', box: 'Palkia Box', species: 'palkia' },
		{ id: 'ray', name: 'Ray Key', box: 'Rayquaza Case', species: 'rayquaza' },
		{ id: 'zacian', name: 'Zacian Key', box: 'Zacian Case', species: 'zacian' },
		{ id: 'zamazenta', name: 'Zamazenta Key', box: 'Zamazenta Case', species: 'zamazenta' },
		{ id: 'zygarde', name: 'Zygarde Key', box: 'Zygarde Case', species: 'zygarde' }
	];
	var keysById = {};
	KEYS.forEach(function (k) {
		k.icon = 'assets/brand/keys/' + k.id + '.png';
		keysById[k.id] = k;
	});

	var SKINS = [
		{
			id: 'rayquaza',
			name: 'Roupa Rayquaza',
			icon: 'assets/brand/keys/skin-rayquaza.png',
			text: '+2% Silver, +1% lendário, +1% shiny, +3% EXP'
		},
		{
			id: 'naruto',
			name: 'Naruto Baryon',
			icon: 'assets/brand/keys/skin-naruto.png',
			text: '+4% shiny, +2% lendário, +2% Silver, +6% captura'
		}
	];
	var skinsById = {};
	SKINS.forEach(function (sk) { skinsById[sk.id] = sk; });

	var PACKS = [
		{
			id: 'u1', once: true, name: 'First Package (Unick)', price: 'R$ 15,00', recharge: 185,
			text: 'Pacote único para começar: Gold, VIP e chaves da caixa inicial.',
			parts: [g(185), v(15), key('inicial', 35)]
		},
		{
			id: 'u2', once: true, name: 'Second Package Unick roupa Rayquaza', price: 'R$ 260,00', recharge: 2000,
			text: 'Compra única com a roupa Rayquaza. Bônus: +2% Silver, +1% lendário, +1% shiny e +3% EXP.',
			parts: [skin('rayquaza'), g(2000), key('arceus', 2), key('inicial', 2), key('kyogre', 17), key('groudon', 17), key('legendary', 17), key('dialga', 17), s(2400000)]
		},
		{
			id: 'u3', once: true, name: 'Unicke Pack September', price: 'R$ 260,00', recharge: 2000,
			text: 'Compra única com a skin Naruto Baryon. Bônus: +4% shiny, +2% lendário, +2% Silver e +6% de captura.',
			parts: [skin('naruto'), g(2000), key('arceus', 2), key('inicial', 2), key('ray', 17), key('groudon', 17), key('kyogre', 17), key('zygarde', 17), s(2400000)]
		},
		{
			id: 'u4', once: true, name: 'Pack September (Special Limited)', price: 'R$ 130,00', recharge: 1000,
			text: 'A Legendary Key garante um Pokémon lendário ou mítico. Pacote limitado.',
			parts: [key('legendary', 1), g(1000), key('arceus', 1), key('inicial', 1), key('kyogre', 8), key('groudon', 8), key('zamazenta', 7), key('palkia', 7), s(1200000)]
		},
		{
			id: 'u5', once: true, name: 'Mini Pack September', price: 'R$ 66,00', recharge: 680,
			text: 'Pacote único menor, com Gold, VIP, chaves e Silver.',
			parts: [g(680), v(7), key('kyogre', 8), key('inicial', 8), s(600000)]
		},
		{ id: 'g1', name: 'Gold Pack 1', price: 'R$ 5,00', recharge: 50, parts: [g(50), v(3)] },
		{ id: 'g2', name: 'Gold Pack 2', price: 'R$ 10,00', recharge: 110, parts: [g(110), v(3)] },
		{ id: 'g3', name: 'Gold Pack 3', price: 'R$ 25,00', recharge: 275, parts: [g(275), v(3)] },
		{ id: 'g4', name: 'Gold Pack 4', price: 'R$ 50,00', recharge: 550, parts: [g(550), v(6)] },
		{ id: 'g5', name: 'Gold Pack 5', price: 'R$ 100,00', recharge: 1200, parts: [g(1200), v(12)] },
		{ id: 'gs', name: 'Gold Pack Special', price: 'R$ 200,00', recharge: 2400, parts: [g(2400), v(26)] },
		{ id: 's1', name: 'Silver Pack 1', price: 'R$ 15,00', recharge: 0, parts: [s(7500000)] },
		{ id: 's2', name: 'Silver Pack 2', price: 'R$ 25,00', recharge: 0, parts: [s(13000000)] },
		{ id: 's3', name: 'Silver Pack 3', price: 'R$ 50,00', recharge: 0, parts: [s(28000000)] },
		{ id: 'ss', name: 'Silver Pack Special', price: 'R$ 100,00', recharge: 0, parts: [s(60000000), v(15)] },
		{ id: 'vmin', name: 'Vip Mini', price: 'R$ 15,00', recharge: 0, parts: [v(15), s(250000)] },
		{ id: 'vmon', name: 'Vip Monthly', price: 'R$ 29,90', recharge: 0, parts: [v(31), s(500000)] }
	];

	function mix(candy, groudon, kyogre, legendary, inicial, silver) {
		var parts = [];
		if (candy) parts.push(it('rarecandy', candy));
		if (groudon) parts.push(key('groudon', groudon));
		if (kyogre) parts.push(key('kyogre', kyogre));
		if (legendary) parts.push(key('legendary', legendary));
		if (inicial) parts.push(key('inicial', inicial));
		if (silver) parts.push(s(silver));
		return parts;
	}

	var allKeys = ['arceus', 'dialga', 'groudon', 'inicial', 'kyogre', 'legendary', 'mewtwo', 'palkia', 'ray', 'zacian', 'zamazenta', 'zygarde'].map(function (id) {
		return key(id, 1);
	});

	var REWARDS = [
		{ need: 500, parts: [it('rarecandy', 1), v(7)] },
		{ need: 1000, parts: [g(50), v(7), key('kyogre', 2)] },
		{ need: 2600, parts: [s(30000000), v(14), key('inicial', 30), key('kyogre', 30), key('legendary', 1)] },
		{ need: 4600, parts: [it('rarecandy', 1), v(30), g(250), key('groudon', 10), key('dialga', 10)] },
		{ need: 8000, parts: [s(50000000), key('legendary', 1), v(30), it('rarecandy', 1), key('groudon', 1), key('inicial', 10)] },
		{ need: 10000, parts: [skin('rayquaza'), it('rarecandy', 80), g(400)].concat(allKeys) },
		{ need: 15000, parts: [s(8000000), it('rarecandy', 1), key('groudon', 1), key('legendary', 5), key('kyogre', 5), key('inicial', 5)] },
		{ need: 20000, parts: mix(2, 10, 10, 10, 2, 8000000) },
		{ need: 25000, parts: mix(3, 2, 16, 16, 16, 8000000) },
		{ need: 27500, parts: mix(1, 1, 8, 8, 8, 4000000) },
		{ need: 30000, parts: mix(2, 2, 8, 8, 8, 4000000) },
		{ need: 32500, parts: mix(1, 2, 8, 8, 8, 4000000) },
		{ need: 35000, parts: mix(2, 2, 8, 8, 8, 4000000) },
		{ need: 37500, parts: mix(2, 1, 8, 8, 8, 4000000) },
		{ need: 40000, parts: mix(2, 2, 8, 8, 8, 4000000) },
		{ need: 42500, parts: mix(2, 1, 8, 8, 8, 4000000) },
		{ need: 45000, parts: mix(2, 2, 8, 8, 8, 4000000) },
		{ need: 47500, parts: mix(2, 1, 10, 10, 10, 4000000) },
		{ need: 50000, parts: mix(2, 2, 10, 10, 10, 4000000).concat([skin('naruto'), key('zacian', 1), key('zamazenta', 1), key('mewtwo', 1)]) },
		{ need: 55000, parts: mix(3, 4, 20, 20, 20, 8000000) },
		{ need: 60000, parts: mix(3, 4, 20, 20, 20, 4000000) },
		{ need: 65000, parts: mix(3, 4, 20, 20, 20, 4000000) },
		{ need: 70000, parts: mix(3, 4, 20, 20, 20, 4000000) },
		{ need: 75000, parts: mix(3, 4, 20, 20, 20, 4000000) },
		{ need: 80000, parts: mix(3, 4, 20, 20, 20, 4000000) },
		{ need: 85000, parts: mix(3, 4, 20, 20, 20, 4000000) },
		{ need: 90000, parts: mix(3, 1, 20, 20, 20, 4000000) },
		{ need: 95000, parts: mix(3, 1, 20, 20, 20, 4000000) },
		{ need: 100000, parts: [key('legendary', 10)] }
	];

	window.Donate = { packs: PACKS, rewards: REWARDS, keys: KEYS, keysById: keysById, skins: SKINS, skinsById: skinsById };
})();
