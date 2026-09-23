// Traduz as FRASES FIXAS dos tooltips de batalha (battle-tooltips.js) que não vêm
// do Dex nem do log — ex.: "Super effective vs.", "Hits both foes.", as movetags
// ("Contact", "Sound"...) e as linhas de prioridade. Essas strings estão embutidas,
// em inglês, no bundle minificado, então em vez de editar cada uma, fazemos
// pós-processamento: BattleTooltips.placeTooltip(innerHTML, ...) é o ponto único
// por onde passa TODO tooltip (golpe, pokémon, campo); trocamos os trechos antes
// de renderizar. Lê o idioma atual a cada hover (troca de idioma reflete na hora).
//
// As descrições de golpe (desc/shortDesc) já são traduzidas pelo moves-i18n.js;
// rótulos como "Poder base"/"Precisão" já usam window.TT inline. Aqui ficam só as
// frases que sobraram. Pares aplicados em ordem (substring literal via split/join).
(function () {
	// Pares [inglês, tradução]. Ordem importa: trechos mais longos / com <strong>
	// antes dos genéricos (ex.: efetividade antes de "</strong> vs. ").
	var PT = [
		// Efetividade (ancorado em <strong> p/ não pegar texto dinâmico)
		['<strong>No effect</strong>', '<strong>Sem efeito</strong>'],
		['<strong>Mostly ineffective</strong>', '<strong>Quase ineficaz</strong>'],
		['<strong>Not very effective</strong>', '<strong>Pouco eficaz</strong>'],
		['<strong>Extremely effective</strong>', '<strong>Extremamente eficaz</strong>'],
		['<strong>Super effective</strong>', '<strong>Supereficaz</strong>'],
		['</strong> vs. ', '</strong> contra '],
		// Linhas de alvo (Duplas/Multi/Triplas/FFA)
		['Hits both foes and ally.', 'Atinge os dois inimigos e o aliado.'],
		['Hits both foes.', 'Atinge os dois inimigos.'],
		['Hits adjacent foes and allies.', 'Atinge inimigos e aliados adjacentes.'],
		['Hits adjacent foes.', 'Atinge inimigos adjacentes.'],
		['Hits all foes.', 'Atinge todos os inimigos.'],
		['Can target distant Pok&eacute;mon in Triples.', 'Pode mirar Pokémon distantes em Triplas.'],
		['Can target any foe in Free-For-All.', 'Pode mirar qualquer inimigo no Todos-contra-Todos.'],
		// Prioridade
		['Nearly always moves first ', 'Quase sempre age primeiro '],
		['Nearly always moves last ', 'Quase sempre age por último '],
		['Usually moves first ', 'Geralmente age primeiro '],
		['(priority +', '(prioridade +'],
		['(priority &minus;', '(prioridade &minus;'],
		// Poder base por alvo (quando há vários inimigos)
		['Base power vs ', 'Poder base vs '],
		['Z-Effect: ', 'Efeito Z: '],
		['Calls ', 'Invoca '],
		// Precisão de golpes OHKO (Fissure, Sheer Cold, etc.)
		["fails if target's Speed is higher", 'falha se a Speed do alvo for maior'],
		["fails if target's level is higher", 'falha se o nível do alvo for maior'],
		["FAILS: target's level is higher", 'FALHA: o nível do alvo é maior'],
		['+1% per level above target', '+1% por nível acima do alvo'],
		// Item anulado (Magic Room/Embargo/Klutz/Gastro Acid — nomes ficam em inglês).
		[' suppressed by ', ' anulado por '],
		// Movetags
		['The user thaws out if it is frozen.', 'O usuário descongela se estiver congelado.'],
		['Not blocked by Protect', 'Não é bloqueado por Protect'],
		["(and Detect, King's Shield, Spiky Shield)", "(e Detect, King's Shield, Spiky Shield)"],
		['Bypasses Substitute', 'Ignora o Substituto'],
		['(but does not break it)', '(mas não o quebra)'],
		['Not bounceable', 'Não refletível'],
		['(can\'t be bounced by Magic Coat/Bounce)', '(não pode ser refletido por Magic Coat/Bounce)'],
		['Contact ', 'Contato '],
		['(triggers Iron Barbs, Spiky Shield, etc)', '(ativa Iron Barbs, Spiky Shield, etc)'],
		['Sound ', 'Som '],
		['(doesn\'t affect Soundproof pokemon)', '(não afeta Pokémon com Soundproof)'],
		['Powder ', 'Pó '],
		['(doesn\'t affect Grass, Overcoat, Safety Goggles)', '(não afeta tipo Grama, Overcoat, Safety Goggles)'],
		['Fist ', 'Soco '],
		['(boosted by Iron Fist)', '(turbinado por Iron Fist)'],
		['Pulse ', 'Pulso '],
		['(boosted by Mega Launcher)', '(turbinado por Mega Launcher)'],
		['Bite ', 'Mordida '],
		['(boosted by Strong Jaw)', '(turbinado por Strong Jaw)'],
		['Recoil ', 'Recuo '],
		['(boosted by Reckless)', '(turbinado por Reckless)'],
		['Bullet-like ', 'Tipo bala '],
		['(doesn\'t affect Bulletproof pokemon)', '(não afeta Pokémon com Bulletproof)'],
		['Slicing ', 'Corte '],
		['(boosted by Sharpness)', '(turbinado por Sharpness)'],
		['Wind ', 'Vento '],
		['(activates Wind Power and Wind Rider)', '(ativa Wind Power e Wind Rider)'],
		// Pokémon tooltip (ganhos fáceis)
		[' (fainted)', ' (desmaiado)'],
		['(fainted)', '(desmaiado)'],
	];

	var ES = [
		['<strong>No effect</strong>', '<strong>Sin efecto</strong>'],
		['<strong>Mostly ineffective</strong>', '<strong>Casi ineficaz</strong>'],
		['<strong>Not very effective</strong>', '<strong>Poco eficaz</strong>'],
		['<strong>Extremely effective</strong>', '<strong>Extremadamente eficaz</strong>'],
		['<strong>Super effective</strong>', '<strong>Supereficaz</strong>'],
		['</strong> vs. ', '</strong> contra '],
		['Hits both foes and ally.', 'Golpea a ambos rivales y al aliado.'],
		['Hits both foes.', 'Golpea a ambos rivales.'],
		['Hits adjacent foes and allies.', 'Golpea a rivales y aliados adyacentes.'],
		['Hits adjacent foes.', 'Golpea a rivales adyacentes.'],
		['Hits all foes.', 'Golpea a todos los rivales.'],
		['Can target distant Pok&eacute;mon in Triples.', 'Puede apuntar a Pokémon distantes en Triples.'],
		['Can target any foe in Free-For-All.', 'Puede apuntar a cualquier rival en Todos contra Todos.'],
		['Nearly always moves first ', 'Casi siempre actúa primero '],
		['Nearly always moves last ', 'Casi siempre actúa último '],
		['Usually moves first ', 'Suele actuar primero '],
		['(priority +', '(prioridad +'],
		['(priority &minus;', '(prioridad &minus;'],
		['Base power vs ', 'Potencia base vs '],
		['Z-Effect: ', 'Efecto Z: '],
		['Calls ', 'Invoca '],
		["fails if target's Speed is higher", 'falla si la Speed del objetivo es mayor'],
		["fails if target's level is higher", 'falla si el nivel del objetivo es mayor'],
		["FAILS: target's level is higher", 'FALLA: el nivel del objetivo es mayor'],
		['+1% per level above target', '+1% por nivel por encima del objetivo'],
		[' suppressed by ', ' anulado por '],
		['The user thaws out if it is frozen.', 'El usuario se descongela si está congelado.'],
		['Not blocked by Protect', 'No es bloqueado por Protect'],
		["(and Detect, King's Shield, Spiky Shield)", "(y Detect, King's Shield, Spiky Shield)"],
		['Bypasses Substitute', 'Ignora el Sustituto'],
		['(but does not break it)', '(pero no lo rompe)'],
		['Not bounceable', 'No reflejable'],
		['(can\'t be bounced by Magic Coat/Bounce)', '(no puede ser reflejado por Magic Coat/Bounce)'],
		['Contact ', 'Contacto '],
		['(triggers Iron Barbs, Spiky Shield, etc)', '(activa Iron Barbs, Spiky Shield, etc)'],
		['Sound ', 'Sonido '],
		['(doesn\'t affect Soundproof pokemon)', '(no afecta a Pokémon con Soundproof)'],
		['Powder ', 'Polvo '],
		['(doesn\'t affect Grass, Overcoat, Safety Goggles)', '(no afecta a tipo Planta, Overcoat, Safety Goggles)'],
		['Fist ', 'Puño '],
		['(boosted by Iron Fist)', '(potenciado por Iron Fist)'],
		['Pulse ', 'Pulso '],
		['(boosted by Mega Launcher)', '(potenciado por Mega Launcher)'],
		['Bite ', 'Mordisco '],
		['(boosted by Strong Jaw)', '(potenciado por Strong Jaw)'],
		['Recoil ', 'Retroceso '],
		['(boosted by Reckless)', '(potenciado por Reckless)'],
		['Bullet-like ', 'Tipo bala '],
		['(doesn\'t affect Bulletproof pokemon)', '(no afecta a Pokémon con Bulletproof)'],
		['Slicing ', 'Corte '],
		['(boosted by Sharpness)', '(potenciado por Sharpness)'],
		['Wind ', 'Viento '],
		['(activates Wind Power and Wind Rider)', '(activa Wind Power y Wind Rider)'],
		[' (fainted)', ' (debilitado)'],
		['(fainted)', '(debilitado)'],
	];

	function tableFor(lang) {
		if (lang === 'pt') return PT;
		if (lang === 'es') return ES;
		return null; // 'en' (ou idioma sem tabela): sem troca
	}

	function translate(html) {
		if (typeof html !== 'string') return html;
		var lang = (window.I18n ? I18n.getLang() : 'pt');
		var t = tableFor(lang);
		if (!t) return html;
		for (var i = 0; i < t.length; i++) {
			if (html.indexOf(t[i][0]) >= 0) html = html.split(t[i][0]).join(t[i][1]);
		}
		return html;
	}

	function patch() {
		if (typeof BattleTooltips === 'undefined' || !BattleTooltips.prototype ||
			BattleTooltips.prototype._rpgTipI18nPatched) return false;
		var orig = BattleTooltips.prototype.placeTooltip;
		BattleTooltips.prototype.placeTooltip = function (innerHTML, hoveredElem, notRelativeToParent, type) {
			return orig.call(this, translate(innerHTML), hoveredElem, notRelativeToParent, type);
		};
		BattleTooltips.prototype._rpgTipI18nPatched = true;
		return true;
	}

	if (!patch()) {
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
	}
})();
