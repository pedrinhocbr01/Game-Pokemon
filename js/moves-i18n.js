// Traduz as DESCRIÇÕES dos golpes nos tooltips de batalha (desc/shortDesc), que
// vêm do Dex (data/moves.js -> window.BattleMovedex), NÃO do log (esse é o
// battle-i18n.js). O tooltip lê `move.desc || move.shortDesc` a cada hover, então
// basta mutar BattleMovedex[id] no idioma atual; trocar de idioma reflete na hora.
//
// Overrides por idioma: window.MoveDescPT / MoveDescES (data/moves-pt.js / -es.js),
// no formato { moveid: { desc: '...', shortDesc: '...' } }. Chave ausente cai no
// inglês original (guardado em snapshot na 1ª aplicação).
//
// applyMoveLang(lang) é chamado antes da batalha e no evento 'i18n:changed'.
(function () {
	var enSnap = {}; // id -> {desc, shortDesc} originais em inglês

	function overrideFor(lang) {
		if (lang === 'pt') return window.MoveDescPT;
		if (lang === 'es') return window.MoveDescES;
		return null;
	}

	function applyMoveLang(lang) {
		var dex = window.BattleMovedex;
		if (!dex) return;
		// Restaura inglês em tudo que já foi traduzido antes (troca de idioma limpa).
		for (var id in enSnap) {
			var m = dex[id];
			if (!m) continue;
			m.desc = enSnap[id].desc;
			m.shortDesc = enSnap[id].shortDesc;
		}
		var ov = overrideFor(lang);
		if (!ov) return; // 'en' (ou idioma sem override) já restaurado acima
		for (var oid in ov) {
			if (!ov.hasOwnProperty(oid)) continue;
			var mm = dex[oid];
			if (!mm) continue; // golpe não existe no Dex
			if (!enSnap[oid]) enSnap[oid] = { desc: mm.desc, shortDesc: mm.shortDesc };
			if (ov[oid].shortDesc != null) mm.shortDesc = ov[oid].shortDesc;
			if (ov[oid].desc != null) mm.desc = ov[oid].desc;
		}
	}

	window.applyMoveLang = applyMoveLang;

	document.addEventListener('i18n:changed', function (e) {
		applyMoveLang((e.detail && e.detail.lang) || (window.I18n && I18n.getLang()) || 'pt');
	});
})();
