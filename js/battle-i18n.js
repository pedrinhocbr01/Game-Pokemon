// Troca o idioma do LOG da batalha (o texto gerado pelo BattleTextParser a partir
// do protocolo: "Pikachu usou Thunderbolt!", "desmaiou!", "super eficaz!" etc).
//
// O Showdown lê um objeto global `BattleText` (inglês, carregado por data/text.js)
// em tempo de chamada. Aqui guardamos o inglês como base e, por idioma, mesclamos
// um override traduzido (window.BattleTextPT / BattleTextES, definidos em
// data/text-pt.js / text-es.js) por cima — chaves não traduzidas caem no inglês.
//
// applyBattleLang(lang) deve ser chamado ANTES de iniciar a batalha (e ao trocar
// de idioma). Os nomes de golpes/pokémon continuam em inglês (vêm do Dex), por
// escolha de projeto.
(function () {
	var baseEN = null; // cópia imutável do BattleText inglês original

	function snapshotEN() {
		if (baseEN) return baseEN;
		if (typeof window.BattleText === 'undefined') return null;
		// Clona raso por id (cada id é um objeto plano de strings).
		baseEN = {};
		for (var id in window.BattleText) {
			if (!window.BattleText.hasOwnProperty(id)) continue;
			var src = window.BattleText[id], dst = {};
			for (var k in src) if (src.hasOwnProperty(k)) dst[k] = src[k];
			baseEN[id] = dst;
		}
		return baseEN;
	}

	function overrideFor(lang) {
		if (lang === 'pt') return window.BattleTextPT;
		if (lang === 'es') return window.BattleTextES;
		return null; // 'en' usa a base
	}

	function merge(base, override) {
		var out = {};
		var id;
		for (id in base) if (base.hasOwnProperty(id)) {
			var o = {};
			for (var k in base[id]) if (base[id].hasOwnProperty(k)) o[k] = base[id][k];
			out[id] = o;
		}
		if (override) {
			for (id in override) if (override.hasOwnProperty(id)) {
				if (!out[id]) out[id] = {};
				for (var k2 in override[id]) if (override[id].hasOwnProperty(k2)) {
					out[id][k2] = override[id][k2];
				}
			}
		}
		return out;
	}

	function applyBattleLang(lang) {
		var base = snapshotEN();
		if (!base) return; // BattleText ainda não carregado
		if (lang === 'en') {
			window.BattleText = merge(base, null);
		} else {
			window.BattleText = merge(base, overrideFor(lang));
		}
	}

	window.applyBattleLang = applyBattleLang;

	// Se o usuário trocar o idioma com uma batalha aberta, atualiza o BattleText.
	// (O texto já impresso não muda; as próximas linhas saem no novo idioma.)
	document.addEventListener('i18n:changed', function (e) {
		applyBattleLang((e.detail && e.detail.lang) || (window.I18n && I18n.getLang()) || 'pt');
	});
})();

// --- Overlay de clima/terreno do campo ---
// O texto flutuante (ex.: "Electric Terrain (3 or 6 turns)") é montado pelo bundle
// em BattleScene.weatherLeft(), FORA do BattleText, então não cai no override acima.
// Aqui envolvemos weatherLeft pra traduzir os RÓTULOS de clima/terreno e a duração
// ("(X or Y turns)") no idioma atual (lido a cada chamada, pra refletir troca de
// idioma na hora). Nomes de golpes/Pokémon seguem em inglês por escolha de projeto;
// estes são rótulos de estado de campo (UI).
(function () {
	if (typeof BattleScene === 'undefined' || !BattleScene.prototype) return;
	if (BattleScene.prototype._rpgWeatherI18n) return;
	if (typeof BattleScene.prototype.weatherLeft !== 'function') return;
	BattleScene.prototype._rpgWeatherI18n = true;

	var NAMES = {
		pt: {
			'Electric Terrain': 'Campo Elétrico', 'Grassy Terrain': 'Campo de Grama',
			'Misty Terrain': 'Campo de Névoa', 'Psychic Terrain': 'Campo Psíquico',
			'Intense Sun': 'Sol Intenso', 'Heavy Rain': 'Chuva Pesada',
			'Strong Winds': 'Ventos Fortes', 'Sandstorm': 'Tempestade de Areia',
			'Trick Room': 'Sala Trapaça', 'Magic Room': 'Sala Mágica',
			'Wonder Room': 'Sala Maravilha', 'Gravity': 'Gravidade',
			'Sun': 'Sol', 'Rain': 'Chuva', 'Hail': 'Granizo', 'Snow': 'Neve',
		},
		es: {
			'Electric Terrain': 'Campo Eléctrico', 'Grassy Terrain': 'Campo de Hierba',
			'Misty Terrain': 'Campo de Niebla', 'Psychic Terrain': 'Campo Psíquico',
			'Intense Sun': 'Sol Intenso', 'Heavy Rain': 'Lluvia Intensa',
			'Strong Winds': 'Vientos Fuertes', 'Sandstorm': 'Tormenta de Arena',
			'Trick Room': 'Espacio Raro', 'Magic Room': 'Zona Mágica',
			'Wonder Room': 'Zona Extraña', 'Gravity': 'Gravedad',
			'Sun': 'Sol', 'Rain': 'Lluvia', 'Hail': 'Granizo', 'Snow': 'Nieve',
		},
	};

	function translate(html) {
		if (!html) return html;
		var lang = (window.I18n && I18n.getLang && I18n.getLang()) || 'pt';
		if (lang === 'en') return html;
		var map = NAMES[lang];
		if (map) {
			// Chaves mais longas primeiro (evita "Sun" cortar "Intense Sun").
			var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
			for (var i = 0; i < keys.length; i++) html = html.split(keys[i]).join(map[keys[i]]);
		}
		var conj = lang === 'es' ? ' o ' : ' ou ';
		html = html.replace(/(\d+) or (\d+) turns\)/g, function (_, a, b) { return a + conj + b + ' turnos)'; });
		html = html.replace(/(\d+) turns\)/g, '$1 turnos)');
		html = html.replace(/(\d+) turn\)/g, '$1 turno)');
		return html;
	}

	var origWeatherLeft = BattleScene.prototype.weatherLeft;
	BattleScene.prototype.weatherLeft = function () {
		return translate(origWeatherLeft.apply(this, arguments));
	};
})();
