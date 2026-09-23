(function () {
	'use strict';

	var KEY = 'storyrpg-save-v1';
	var cache = null;

	function blank() {
		return { users: {}, chars: {}, session: null };
	}

	function db() {
		if (cache) return cache;
		try { cache = JSON.parse(localStorage.getItem(KEY) || 'null') || blank(); }
		catch (e) { cache = blank(); }
		if (!cache.users) cache.users = {};
		if (!cache.chars) cache.chars = {};
		return cache;
	}

	function persist() {
		localStorage.setItem(KEY, JSON.stringify(db()));
	}

	function digest(text) {
		var data = new TextEncoder().encode(text);
		return crypto.subtle.digest('SHA-256', data).then(function (buf) {
			return Array.from(new Uint8Array(buf)).map(function (b) {
				return b.toString(16).padStart(2, '0');
			}).join('');
		});
	}

	function user() {
		var s = db().session;
		if (!s || !s.user) return null;
		return db().users[s.user] || null;
	}

	function char() {
		var s = db().session;
		if (!s || !s.charId) return null;
		return db().chars[s.charId] || null;
	}

	function register(name, pass) {
		name = String(name || '').trim();
		var key = name.toLowerCase();
		if (!/^[\p{L}\p{N}]{3,12}$/u.test(name)) return Promise.resolve('O usuário precisa ter 3 a 12 letras ou números.');
		if (String(pass || '').length < 4) return Promise.resolve('A senha precisa ter pelo menos 4 caracteres.');
		if (db().users[key]) return Promise.resolve('Esse usuário já existe.');
		return digest(pass).then(function (hash) {
			db().users[key] = { name: name, pass: hash, chars: [] };
			db().session = { user: key, charId: null };
			persist();
			return '';
		});
	}

	function login(name, pass) {
		var key = String(name || '').trim().toLowerCase();
		var rec = db().users[key];
		if (!rec || !rec.pass) return Promise.resolve('Usuário ou senha incorretos.');
		return digest(pass).then(function (hash) {
			if (hash !== rec.pass) return 'Usuário ou senha incorretos.';
			db().session = { user: key, charId: rec.chars[0] || null };
			persist();
			return '';
		});
	}

	function guest() {
		var key = 'convidado';
		if (!db().users[key]) db().users[key] = { name: 'Convidado', pass: '', chars: [] };
		db().session = { user: key, charId: db().users[key].chars[0] || null };
		persist();
	}

	function logout() {
		db().session = null;
		persist();
	}

	function nickTaken(name) {
		var key = name.toLowerCase();
		return Object.keys(db().chars).some(function (id) {
			return db().chars[id].name.toLowerCase() === key;
		});
	}

	function createChar(opts) {
		var rec = user();
		if (!rec) return 'Entre na conta primeiro.';
		if (rec.chars.length >= 3) return 'Esta conta já tem 3 personagens.';
		var name = String(opts.name || '').trim();
		if (!/^[\p{L}\p{N}]{3,12}$/u.test(name)) return 'O nome precisa ter 3 a 12 letras ou números.';
		if (nickTaken(name)) return 'Esse treinador já existe.';
		if (!window.Catalog.byId[opts.starter]) return 'Escolha um inicial.';
		var region = 'kanto';
		(window.Catalog.regions || []).forEach(function (r) {
			if (r.id === opts.region) region = r.id;
		});
		var id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
		var mon = window.Catalog.makeMon(opts.starter, 5);
		var now = Date.now();
		db().chars[id] = {
			id: id,
			user: db().session.user,
			name: name,
			look: opts.look || 'red',
			trainer: opts.trainer || 'Red',
			region: region,
			visited: [region],
			silver: 1500,
			bank: 0,
			gold: 0,
			tLevel: 1,
			xp: 0,
			team: [mon],
			box: [],
			bag: { pokeball: 8, potion: 4 },
			seen: {},
			caught: {},
			badges: [],
			notes: [],
			property: { level: 1, last: now },
			quests: null
		};
		db().chars[id].seen[mon.species] = true;
		db().chars[id].caught[mon.species] = true;
		rec.chars.push(id);
		db().session.charId = id;
		persist();
		return '';
	}

	function pick(id) {
		var rec = user();
		if (!rec || rec.chars.indexOf(id) < 0) return;
		db().session.charId = id;
		persist();
	}

	function clearChar() {
		if (!db().session) return;
		db().session.charId = null;
		persist();
	}

	function listings() {
		var d = db();
		if (!Array.isArray(d.market)) d.market = [];
		return d.market;
	}

	window.Store = {
		db: db,
		persist: persist,
		user: user,
		char: char,
		register: register,
		login: login,
		guest: guest,
		logout: logout,
		createChar: createChar,
		pick: pick,
		clearChar: clearChar,
		listings: listings
	};
})();
