// Traduz as DESCRIÇÕES das habilidades (desc/shortDesc) em window.BattleAbilities,
// análogo ao js/moves-i18n.js. Overrides por idioma: window.AbilityDescPT /
// AbilityDescES (data/abilities-pt.js / -es.js), no formato
// { abilityid: { desc: '...', shortDesc: '...' } }. Chave ausente cai no inglês
// original (guardado em snapshot na 1ª aplicação). Reaplica no evento 'i18n:changed'.
(function () {
	var enSnap = {}; // id -> {desc, shortDesc} originais em inglês

	function overrideFor(lang) {
		if (lang === 'pt') return window.AbilityDescPT;
		if (lang === 'es') return window.AbilityDescES;
		return null;
	}

	function applyAbilityLang(lang) {
		var dex = window.BattleAbilities;
		if (!dex) return;
		// Restaura inglês no que já foi traduzido (troca de idioma limpa).
		for (var id in enSnap) {
			var a = dex[id];
			if (!a) continue;
			a.desc = enSnap[id].desc;
			a.shortDesc = enSnap[id].shortDesc;
		}
		var ov = overrideFor(lang);
		if (!ov) return; // 'en' já restaurado acima
		for (var oid in ov) {
			if (!ov.hasOwnProperty(oid)) continue;
			var aa = dex[oid];
			if (!aa) continue;
			if (!enSnap[oid]) enSnap[oid] = { desc: aa.desc, shortDesc: aa.shortDesc };
			var t = ov[oid];
			if (t.desc) aa.desc = t.desc;
			if (t.shortDesc) aa.shortDesc = t.shortDesc;
		}
	}
	window.applyAbilityLang = applyAbilityLang;

	function curLang() { try { return localStorage.getItem('ss_lang') || 'pt'; } catch (e) { return 'pt'; } }
	applyAbilityLang(curLang());
	document.addEventListener('i18n:changed', function (e) { applyAbilityLang((e && e.detail && e.detail.lang) || curLang()); });
})();
