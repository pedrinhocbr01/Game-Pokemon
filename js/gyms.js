(function () {
	'use strict';

	function row(leader, gym, type, badge, pic) {
		return { leader: leader, gym: gym, type: type, badge: badge || '', pic: pic || 0 };
	}

	var byRegion = {
		kanto: [
			row('Brock', 'Pewter', 'Rock', 'Boulder', 1),
			row('Misty', 'Cerulean', 'Water', 'Cascade', 2),
			row('Lt. Surge', 'Vermilion', 'Electric', 'Thunder', 3),
			row('Erika', 'Celadon', 'Grass', 'Rainbow', 4),
			row('Sabrina', 'Saffron', 'Psychic', 'Marsh', 5),
			row('Koga', 'Fuchsia', 'Poison', 'Soul', 6),
			row('Blaine', 'Cinnabar', 'Fire', 'Volcano', 7),
			row('Giovanni', 'Viridian', 'Ground', 'Earth', 8)
		],
		johto: [
			row('Falkner', 'Violet', 'Flying', 'Zephyr', 9),
			row('Bugsy', 'Azalea', 'Bug', 'Hive', 10),
			row('Whitney', 'Goldenrod', 'Normal', 'Plain', 11),
			row('Morty', 'Ecruteak', 'Ghost', 'Fog', 12),
			row('Chuck', 'Cianwood', 'Fighting', 'Storm', 13),
			row('Jasmine', 'Olivine', 'Steel', 'Mineral', 14),
			row('Pryce', 'Mahogany', 'Ice', 'Glacier', 15),
			row('Clair', 'Blackthorn', 'Dragon', 'Rising', 16)
		],
		hoenn: [
			row('Roxanne', 'Rustboro', 'Rock', 'Stone', 17),
			row('Brawly', 'Dewford', 'Fighting', 'Knuckle', 18),
			row('Wattson', 'Mauville', 'Electric', 'Dynamo', 19),
			row('Flannery', 'Lavaridge', 'Fire', 'Heat', 20),
			row('Norman', 'Petalburg', 'Normal', 'Balance', 21),
			row('Winona', 'Fortree', 'Flying', 'Feather', 22),
			row('Tate & Liza', 'Mossdeep', 'Psychic', 'Mind', 0),
			row('Wallace', 'Sootopolis', 'Water', 'Rain', 24)
		],
		sinnoh: [
			row('Roark', 'Oreburgh', 'Rock', 'Coal', 25),
			row('Gardenia', 'Eterna', 'Grass', 'Forest', 26),
			row('Maylene', 'Veilstone', 'Fighting', 'Cobble', 27),
			row('Crasher Wake', 'Pastoria', 'Water', 'Fen', 28),
			row('Fantina', 'Hearthome', 'Ghost', 'Relic', 29),
			row('Byron', 'Canalave', 'Steel', 'Mine', 30),
			row('Candice', 'Snowpoint', 'Ice', 'Icicle', 31),
			row('Volkner', 'Sunyshore', 'Electric', 'Beacon', 32)
		],
		unova: [
			row('Cilan', 'Striaton', 'Grass', 'Trio', 101),
			row('Lenora', 'Nacrene', 'Normal', 'Basic', 102),
			row('Burgh', 'Castelia', 'Bug', 'Insect', 103),
			row('Elesa', 'Nimbasa', 'Electric', 'Bolt', 104),
			row('Clay', 'Driftveil', 'Ground', 'Quake', 105),
			row('Skyla', 'Mistralton', 'Flying', 'Jet', 106),
			row('Brycen', 'Icirrus', 'Ice', 'Freeze', 107),
			row('Drayden', 'Opelucid', 'Dragon', 'Legend', 108)
		],
		kalos: [
			row('Viola', 'Santalune', 'Bug', 'Bug'),
			row('Grant', 'Cyllage', 'Rock', 'Cliff'),
			row('Korrina', 'Shalour', 'Fighting', 'Rumble'),
			row('Ramos', 'Coumarine', 'Grass', 'Plant'),
			row('Clemont', 'Lumiose', 'Electric', 'Voltage'),
			row('Valerie', 'Laverre', 'Fairy', 'Fairy'),
			row('Olympia', 'Anistar', 'Psychic', 'Psychic'),
			row('Wulfric', 'Snowbelle', 'Ice', 'Iceberg')
		],
		alola: [
			row('Ilima', 'Hau\'oli', 'Normal', 'Melemele Normal'),
			row('Lana', 'Brooklet', 'Water', 'Akala Water'),
			row('Kiawe', 'Wela', 'Fire', 'Akala Fire'),
			row('Mallow', 'Lush', 'Grass', 'Akala Grass'),
			row('Sophocles', 'Hokulani', 'Electric', 'Ulaula Electric'),
			row('Acerola', 'Aether', 'Ghost', 'Ulaula Ghost'),
			row('Mina', 'Poni', 'Fairy', 'Poni Fairy'),
			row('Hapu', 'Poni', 'Ground', 'Poni Ground')
		],
		galar: [
			row('Milo', 'Turffield', 'Grass', 'Grass'),
			row('Nessa', 'Hulbury', 'Water', 'Water'),
			row('Kabu', 'Motostoke', 'Fire', 'Fire'),
			row('Bea', 'Stow-on-Side', 'Fighting', 'Fighting'),
			row('Allister', 'Stow-on-Side', 'Ghost', 'Ghost'),
			row('Opal', 'Ballonlea', 'Fairy', 'FairyG'),
			row('Gordie', 'Circhester', 'Rock', 'Rock'),
			row('Melony', 'Circhester', 'Ice', 'Ice'),
			row('Piers', 'Spikemuth', 'Dark', 'Dark'),
			row('Raihan', 'Hammerlocke', 'Dragon', 'Dragon')
		],
		paldea: [
			row('Katy', 'Cortondo', 'Bug', ''),
			row('Brassius', 'Artazon', 'Grass', ''),
			row('Iono', 'Levincia', 'Electric', ''),
			row('Kofu', 'Cascarrafa', 'Water', ''),
			row('Larry', 'Medali', 'Normal', ''),
			row('Ryme', 'Montenevera', 'Ghost', ''),
			row('Tulip', 'Alfornada', 'Psychic', ''),
			row('Grusha', 'Glaseado', 'Ice', '')
		]
	};

	window.Gyms = {
		byRegion: byRegion,
		of: function (region) { return byRegion[region] || []; },
		pic: function (g) { return g.pic ? 'assets/old/images/trainers/' + g.pic + '/Thumb.png' : ''; },
		badge: function (g) { return g.badge ? 'assets/sprites/badges/pixel/' + encodeURIComponent(g.badge) + '.png' : ''; }
	};
})();
