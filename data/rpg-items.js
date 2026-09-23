// Itens de RPG que o Showdown (data/items.js) NÃO tem: consumíveis (Potions, Revives,
// curas de status, PP, Rare Candy, Repels, Escape Rope). Irmão do BattleItems — a Bolsa
// usa Showdown (bolas/pedras/berries/held/mega) + ESTE arquivo (medicina/diversos).
//
// Formato por item:
//   name      : nome canônico (EN). A exibição usa i18n por id: L('item.<id>').
//   icon      : arquivo em /sprites/itemicons/<icon>.png
//   cat       : categoria da Bolsa ('medicine' | 'misc')
//   effect    : o que o item FAZ (lido pelo servidor — autoritativo):
//      heal:<n|'full'>           cura HP (n pontos ou tudo)
//      status:'all'              limpa qualquer status
//      cure:[..]                 limpa status específicos (brn/psn/tox/par/slp/frz)
//      revive:<0..1>             revive (fração do HP máx; 0.5 = metade, 1 = cheio)
//      pp:<n|'full'>, all:bool   restaura PP (de 1 golpe ou de todos se all=true)
//      ppup:<1|'max'>            aumenta o TETO de PP de 1 golpe (PP Up +1 estágio; PP Max → máx)
//      levelup:<n>               sobe N níveis (Rare Candy)
//      repel:<passos>            espanta selvagens por N passos
//      escape:true               sai da masmorra/volta ao spawn
//
// UMD: navegador → window.RpgItems (consumíveis) + window.RpgBattleItems (itens custom estilo-
//      Showdown, mesclados em window.BattleItems). Servidor (require) → { items, battleItems }.
(function () {
	var RPG_ITEMS = {
		// --- Medicina: HP ---
		potion:      { name: "Potion",       icon: "potion",       cat: "medicine", effect: { heal: 20 } },
		superpotion: { name: "Super Potion",  icon: "super-potion", cat: "medicine", effect: { heal: 60 } },
		hyperpotion: { name: "Hyper Potion",  icon: "hyper-potion", cat: "medicine", effect: { heal: 120 } },
		maxpotion:   { name: "Max Potion",    icon: "max-potion",   cat: "medicine", effect: { heal: "full" } },
		fullrestore: { name: "Full Restore",  icon: "full-restore", cat: "medicine", effect: { heal: "full", status: "all" } },
		freshwater:  { name: "Fresh Water",   icon: "fresh-water",  cat: "medicine", effect: { heal: 30 } },
		// --- Medicina: reviver ---
		revive:      { name: "Revive",        icon: "revive",       cat: "medicine", effect: { revive: 0.5 } },
		maxrevive:   { name: "Max Revive",    icon: "max-revive",   cat: "medicine", effect: { revive: 1 } },
		// --- Medicina: curas de status ---
		antidote:    { name: "Antidote",      icon: "antidote",     cat: "medicine", effect: { cure: ["psn", "tox"] } },
		burnheal:    { name: "Burn Heal",     icon: "burn-heal",    cat: "medicine", effect: { cure: ["brn"] } },
		iceheal:     { name: "Ice Heal",      icon: "ice-heal",     cat: "medicine", effect: { cure: ["frz"] } },
		parlyzheal:  { name: "Paralyze Heal", icon: "parlyz-heal",  cat: "medicine", effect: { cure: ["par"] } },
		awakening:   { name: "Awakening",     icon: "awakening",    cat: "medicine", effect: { cure: ["slp"] } },
		fullheal:    { name: "Full Heal",     icon: "full-heal",    cat: "medicine", effect: { status: "all" } },
		// --- Medicina: PP ---
		ether:       { name: "Ether",         icon: "ether",        cat: "medicine", effect: { pp: 10 } },
		maxether:    { name: "Max Ether",     icon: "max-ether",    cat: "medicine", effect: { pp: "full" } },
		elixir:      { name: "Elixir",        icon: "elixir",       cat: "medicine", effect: { pp: 10, all: true } },
		maxelixir:   { name: "Max Elixir",    icon: "max-elixir",   cat: "medicine", effect: { pp: "full", all: true } },
		// --- Medicina: PP máximo (aumenta o teto de PP de UM golpe; toda batalha entra cheio) ---
		ppup:        { name: "PP Up",         icon: "pp-up",        cat: "medicine", effect: { ppup: 1 } },
		ppmax:       { name: "PP Max",        icon: "pp-max",       cat: "medicine", effect: { ppup: "max" } },
		// --- Medicina: nível ---
		rarecandy:   { name: "Rare Candy",    icon: "rare-candy",   cat: "medicine", effect: { levelup: 1 } },
		// --- Diversos (campo) ---
		repel:       { name: "Repel",         icon: "repel",        cat: "misc", effect: { repel: 100 } },
		superrepel:  { name: "Super Repel",   icon: "super-repel",  cat: "misc", effect: { repel: 200 } },
		maxrepel:    { name: "Max Repel",     icon: "max-repel",    cat: "misc", effect: { repel: 250 } },
	};
	// Itens CUSTOM no formato do Showdown (BattleItems) — NÃO existem no items.js oficial.
	// Ficam aqui (não no items.js) pra manter o data/items.js puro/regenerável do upstream.
	// São MESCLADOS em window.BattleItems no load (este arquivo é incluído DEPOIS do items.js),
	// então Dex.items.get('rayquazanite') continua funcionando (tooltip, mega evo, etc.).
	// OBS: o motor de batalha (sim) tem a própria cópia em server/dist/data/items.js.
	var RPG_BATTLE_ITEMS = {
		rayquazanite: {
			name: "Rayquazanite",
			spritenum: 593,
			icon: "rayquazanite",   // PNG individual em /sprites/itemicons/ (custom: não tem slot na folha)
			megaStone: { Rayquaza: "Rayquaza-Mega" },
			itemUser: ["Rayquaza"],
			num: 9384,
			gen: 6,
			"new": true,
			isNonstandard: "Past",
			desc: "If held by a Rayquaza, this item allows it to Mega Evolve into Mega Rayquaza in battle.",
			shortDesc: "If held by a Rayquaza, this item allows it to Mega Evolve into Mega Rayquaza in battle.",
		},
		// Dynamax Band: equipável em QUALQUER pokémon (sem itemUser). Em batalha, só quem
		// segura a band pode dar Dynamax (regra aplicada pelo battle-server + cliente).
		dynamaxband: { name: "Dynamax Band", icon: "dynamax-band", num: 9385, gen: 8, "new": true, isNonstandard: "Past", desc: "If held, this Pokémon may Dynamax in battle.", shortDesc: "Holder may Dynamax in battle." },
			// Tera Orb: equipável em QUALQUER pokémon. Em batalha, só quem segura pode Terastalizar.
			teraorb: { name: "Tera Orb", icon: "tera-orb", num: 9386, gen: 9, "new": true, isNonstandard: "Past", desc: "If held, this Pokémon may Terastallize in battle.", shortDesc: "Holder may Terastallize in battle." },
		// Held items de RPG (efeito fora do sim — aplicado pelo servidor no ganho de EXP/evolução).
		everstone: { name: "Everstone", icon: "everstone", num: 112, gen: 2, "new": true, desc: "Prevents the holder from evolving.", shortDesc: "Prevents the holder from evolving." },
		luckyegg: { name: "Lucky Egg", icon: "lucky-egg", num: 233, gen: 2, "new": true, desc: "Holder gains 1.5x experience from battles.", shortDesc: "Holder gains 1.5x experience from battles." },
		expshare: { name: "Exp. Share", icon: "exp-share", num: 0, gen: 2, "new": true, desc: "Holder gains experience even without battling.", shortDesc: "Holder gains experience even without battling." },
	};

	if (typeof window !== 'undefined') {
		window.RpgItems = RPG_ITEMS;
		window.RpgBattleItems = RPG_BATTLE_ITEMS;
		if (window.BattleItems) { for (var _k in RPG_BATTLE_ITEMS) window.BattleItems[_k] = RPG_BATTLE_ITEMS[_k]; }
	}
	if (typeof module !== 'undefined' && module.exports) module.exports = { items: RPG_ITEMS, battleItems: RPG_BATTLE_ITEMS };
})();
