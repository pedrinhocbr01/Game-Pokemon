// Faz a batalha do Showdown usar os sprites e ícones do jogo ANTIGO.
//
// 1) Sprites de batalha (gifs por wild_id), servidos em /rpg-images/.
//    Chama a getSpriteData original e troca a URL. Além disso força a largura/
//    altura para as DIMENSÕES NATIVAS do gif antigo (window.BattleOldSpriteSizes),
//    senão o renderizador estica o gif para dentro da caixa do sprite do Showdown.
//
// 2) Ícones do time (picon): em vez do spritesheet pokemonicons-sheet.png,
//    usa os gifs 32x32 do jogo antigo em /rpg-images/{pokemon|shiny}/icon/<id>.gif.
//
// Pokémon recentes sem sprite antigo (BattleOldSprites[id] indefinido) caem
// no recurso original do Showdown automaticamente.
(function () {
	if (typeof Dex === 'undefined' || !window.BattleOldSprites) return;
	if (Dex._rpgSpritesPatched) return;
	Dex._rpgSpritesPatched = true;

	var SIZES = window.BattleOldSpriteSizes || {};

	// ?v= dos sprites de batalha POR wild_id: usa a versão SÓ daquele sprite (window.SPRITE_VERS, se
	// foi editado no painel), senão a versão base de mídia. NÃO muda no deploy → os gifs ficam
	// immutable-cacheáveis e não re-baixam a cada bump de JS/CSS; editar UM sprite atualiza SÓ ele.
	function mvq(wid) {
		var v = (window.SPRITE_VERS && window.SPRITE_VERS[wid]) || window.MEDIA_V || window.ASSET_V || '';
		return v ? ('?v=' + v) : '';
	}

	// Formas que o jogo antigo NÃO distingue (todas caem no mesmo wild_id da
	// espécie base, ex.: Zygarde-10% e Zygarde-Complete = 718). Para essas usamos
	// o sprite NATIVO do Showdown (que tem gif próprio por forma), senão a
	// transformação/forma não fica visível.
	var SKIP_OLD = window.BattleOldSpritesSkip || {};
	// Fallback automático p/ Mega/Primal quando NÃO há entrada no mapa explícito
	// (window.BattleOldSpritesSpecial, em data/old-sprites-special.js): id = <dex>+001|002
	// SEM padding (Venusaur 3 -> "3001"; Mega Y -> 002). Só retorna se o sprite existir (SIZES).
	function specialOldId(species) {
		if (!species) return null;
		var isGmax = species.forme === 'Gmax' || /gmax$/.test(species.id || '');
		if (!species.isMega && !species.isPrimal && !isGmax) return null;
		var dex = species.num; if (!(dex > 0)) return null;
		// Sufixo: Mega-Y = 002, Mega/Primal = 001, Gigantamax = 010.
		var id = String(dex) + (isGmax ? '010' : (/megay$/.test(species.id) ? '002' : '001'));
		return SIZES[id] ? id : null;
	}

	function wildIdOf(pokemon) {
		var name = pokemon;
		if (pokemon && typeof pokemon !== 'string') {
			// Sprites passam instância Pokemon (getSpeciesForme);
			// ícones passam objetos com .speciesForme / .species.
			if (pokemon.getSpeciesForme) name = pokemon.getSpeciesForme();
			else if (pokemon.speciesForme) name = pokemon.speciesForme;
			else if (pokemon.species) name = pokemon.species;
		}
		var species = Dex.species.get(name);
		// 1) Mapa EXPLÍCITO de formas especiais (Mega/Primal/etc.) — prioridade máxima.
		var sp = window.BattleOldSpritesSpecial;
		if (sp && sp[species.id]) return String(sp[species.id]);
		if (SKIP_OLD[species.id]) return null; // usa o sprite nativo do Showdown
		// 2) Fallback: fórmula <dex>+001/002 p/ mega/primal (gif antigo, animado, tamanho próprio).
		var moid = specialOldId(species); if (moid) return moid;
		// Demais megas/primais: sprite NATIVO distinto do Showdown (o set antigo so tem o dex base).
		if (species.isMega || species.isPrimal) return null;
		return window.BattleOldSprites[species.id];
	}

	var origGetSpriteData = Dex.getSpriteData;
	Dex.getSpriteData = function (pokemon, isFront, options) {
		var data = origGetSpriteData.call(this, pokemon, isFront, options);

		// CRY: o set de sprites do Showdown (BattlePokemonSprites) NÃO está carregado
		// aqui, então a getSpriteData original deixa data.cryurl='' e o engine nunca
		// toca o grito no summon/drag-in. Preenchemos por NOME da espécie — o override
		// de BattleSound.playEffect (em dashboard.html) remapeia nome->nº da Dex e serve
		// /audio/cries/<dex>.mp3. Vale p/ TODA espécie (com ou sem sprite antigo).
		if (!data.cryurl) {
			var cname = pokemon;
			if (pokemon && typeof pokemon !== 'string') {
				if (pokemon.getSpeciesForme) cname = pokemon.getSpeciesForme();
				else if (pokemon.speciesForme) cname = pokemon.speciesForme;
				else if (pokemon.species) cname = pokemon.species;
			}
			var csp = cname && Dex.species.get(cname);
			if (csp && csp.num > 0) data.cryurl = 'audio/cries/' + csp.id + '.mp3';
		}

		// Gigantamax: o engine marca volatiles.dynamax[1]=true. O getSpriteData ORIGINAL anexa
		// '-Gmax' internamente, mas o nosso wildIdOf recebe a instância base (getSpeciesForme()
		// = "Charizard", sem Gmax) → resolvia o sprite BASE. Detectamos aqui e buscamos a forma
		// -Gmax (sprite próprio, ex.: charizardgmax → 6010). E NÃO dobramos o tamanho (o gif Gmax
		// já é a arte grande) — antes ficava "só grande" com o sprite base.
		// options.dynamax === false → quer a forma BASE (usado no revert p/ calcular o sprite
		// pequeno de volta). Sem esse check, o "sprite de volta" também saía Gmax e nunca revertia.
		var gmax = !!(pokemon && typeof pokemon !== 'string' && pokemon.volatiles &&
			pokemon.volatiles.dynamax && pokemon.volatiles.dynamax[1] &&
			(!options || options.dynamax !== false));
		var lookup = pokemon;
		if (gmax) {
			var bn = (pokemon.getSpeciesForme && pokemon.getSpeciesForme()) || pokemon.speciesForme || pokemon.species;
			if (bn) lookup = String(bn) + '-Gmax';
		}
		var wid = wildIdOf(lookup);
		if (!wid) return data; // sem sprite antigo: mantém o do Showdown

		var root = data.shiny ? 'rpg-images/shiny' : 'rpg-images/pokemon';
		var sub = data.isFrontSprite ? '' : '/back';
		data.url = Dex.resourcePrefix + root + sub + '/' + wid + '.gif' + mvq(wid);
		data.pixelated = false;

		// Tamanho original do gif antigo (evita esticamento/distorção).
		var sz = SIZES[wid];
		if (sz) {
			var dim = data.isFrontSprite ? sz.f : sz.b;
			if (dim) { data.w = dim[0]; data.h = dim[1]; }
		}

		// Dynamax: o jogo dobra o tamanho do sprite (battledata.js: w*=2,h*=2).
		// Como forçamos o tamanho NATIVO do gif antigo logo acima, o aumento do
		// Dynamax era descartado e o Pokémon não "crescia". Reaplicamos o 2x aqui.
		// (Pokémon G-max têm sprite próprio e não passam por este override.)
		var isDmax = (options && options.dynamax) ||
			(pokemon && typeof pokemon !== 'string' && pokemon.volatiles &&
				pokemon.volatiles.dynamax && (!options || options.dynamax !== false));
		// Dynamax E Gmax dobram de tamanho (o Gmax troca o sprite E cresce).
		if (isDmax && data.w && data.h) { data.w *= 2; data.h *= 2; }

		data._oldNative = true; // marca p/ o patch de escala em pos()
		return data;
	};

	// Renderiza os sprites do jogo antigo em PIXELS NATIVOS: o campo do Showdown
	// aplica um zoom (1.5x/2x) que faz o sprite "crescer" ao assentar da pokébola.
	// Mantemos o ponto central que o renderizador calculou, mas forçamos w/h nativos.
	if (typeof BattleScene !== 'undefined' && BattleScene.prototype &&
		typeof BattleScene.prototype.pos === 'function' && !BattleScene.prototype._rpgPosPatched) {
		var origPos = BattleScene.prototype.pos;
		BattleScene.prototype.pos = function (loc, obj) {
			var p = origPos.call(this, loc, obj);
			if (obj && obj._oldNative && obj.w && obj.h) {
				var cx = p.left + p.width / 2;
				var cy = p.top + p.height / 2;
				p.width = obj.w;
				p.height = obj.h;
				p.left = Math.floor(cx - obj.w / 2);
				p.top = Math.floor(cy - obj.h / 2);
			}
			return p;
		};
		BattleScene.prototype._rpgPosPatched = true;
	}

	// --- Background da batalha: usa os cenários do jogo antigo ---
	// Configurável por encontro/mapa via window.RpgBattleBackground (caminho relativo
	// dentro de rpg-images/, ex.: 'attack/backgrounds/water-1.png'). Padrão: campo de grama.
	window.RpgBattleBackground = window.RpgBattleBackground ||
		'rpg-images/attack/backgrounds/Gras1.png';

	if (typeof BattleScene !== 'undefined' && BattleScene.prototype &&
		typeof BattleScene.prototype.updateGen === 'function' && !BattleScene.prototype._rpgBgPatched) {
		var origUpdateGen = BattleScene.prototype.updateGen;
		BattleScene.prototype.updateGen = function () {
			origUpdateGen.call(this);
			this.backdropImage = window.RpgBattleBackground;
			if (this.$bg) {
				this.$bg.css('background-image',
					'url(' + (window.AV ? window.AV(Dex.resourcePrefix + this.backdropImage) : Dex.resourcePrefix + this.backdropImage) + ')');
			}
		};
		BattleScene.prototype._rpgBgPatched = true;
	}

	// --- Sprite do treinador na batalha: Thumb.png do personagem ---
	// O battle-server envia avatar = 'rpgchar-<key>'; resolvemos para o Thumb.png
	// da pasta do personagem. Outros avatares caem no resolvedor original do Showdown.
	if (typeof Dex.resolveAvatar === 'function' && !Dex._rpgAvatarPatched) {
		Dex._rpgAvatarPatched = true;
		var origResolveAvatar = Dex.resolveAvatar;
		Dex.resolveAvatar = function (avatar) {
			if (typeof avatar === 'string' && avatar.indexOf('rpgchar-') === 0) {
				var key = avatar.slice(8);
				var _cu = Dex.resourcePrefix + 'rpg-images/characters/' + encodeURIComponent(key) + '/Thumb.png';
				return window.AV ? window.AV(_cu) : _cu;   // ?v=<MEDIA_V> → retrato editado re-baixa
			}
			// Treinador NPC: avatar = 'rpgtrainer-<id>' → Thumb.png do treinador (assets/images/trainers/<id>).
			if (typeof avatar === 'string' && avatar.indexOf('rpgtrainer-') === 0) {
				var tid = avatar.slice(11);
				var _tu = Dex.resourcePrefix + 'rpg-images/trainers/' + encodeURIComponent(tid) + '/Thumb.png';
				return window.AV ? window.AV(_tu) : _tu;   // ?v=<MEDIA_V> → retrato do NPC editado re-baixa
			}
			return origResolveAvatar.call(this, avatar);
		};
	}

	// --- Ícone de ITEM: prefere PNG individual quando o item declara `icon` ---
	// Itens custom (ex.: Rayquazanite, em rpg-items.js) não têm slot próprio na folha
	// itemicons-sheet.png — reusar um spritenum mostraria o ícone de OUTRO item (a 593 = Kee
	// Berry). Se o item (em BattleItems) tem `icon`, usamos /sprites/itemicons/<icon>.png;
	// senão cai no resolvedor original do Showdown (folha por spritenum).
	if (typeof Dex.getItemIcon === 'function' && !Dex._rpgItemIconPatched) {
		Dex._rpgItemIconPatched = true;
		var origGetItemIcon = Dex.getItemIcon;
		var _toId = function (s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ''); };
		Dex.getItemIcon = function (item) {
			var id = (typeof item === 'string') ? _toId(item) : (item && item.id) || '';
			// Lê o `icon` dos NOSSOS objetos (RpgBattleItems/RpgItems) — NÃO do BattleItems,
			// porque Dex.items.get() normaliza a entrada e descarta chaves desconhecidas (icon).
			var custom = id && ((window.RpgBattleItems && window.RpgBattleItems[id]) ||
				(window.RpgItems && window.RpgItems[id]));
			if (custom && custom.icon) {
				return 'background:transparent url(' + Dex.resourcePrefix + 'sprites/itemicons/' +
					custom.icon + '.png) no-repeat center;background-size:contain';
			}
			return origGetItemIcon.call(this, item);
		};
	}

	// --- Ícones do time (picon) com os ícones do jogo antigo ---
	var origGetPokemonIcon = Dex.getPokemonIcon;
	Dex.getPokemonIcon = function (pokemon, facingLeft) {
		// Slots de pokébola (vazio/status/desmaiado) ficam com o original.
		if (pokemon === 'pokeball' || pokemon === 'pokeball-statused' ||
			pokemon === 'pokeball-fainted' || pokemon === 'pokeball-none') {
			return origGetPokemonIcon.call(this, pokemon, facingLeft);
		}

		var wid = wildIdOf(pokemon);
		if (!wid) return origGetPokemonIcon.call(this, pokemon, facingLeft);

		var shiny = pokemon && typeof pokemon !== 'string' && pokemon.shiny;
		var dir = shiny ? 'shiny' : 'pokemon';
		var fainted = (pokemon && pokemon.fainted) ?
			';opacity:.3;filter:grayscale(100%) brightness(.5)' : '';
		var url = Dex.resourcePrefix + 'rpg-images/' + dir + '/icon/' + wid + '.gif' + mvq(wid);
		// Ícone 32x32 centralizado na célula picon padrão (40x30).
		return 'background:transparent url(' + url + ') no-repeat center;' +
			'background-size:contain' + fainted;
	};
})();

// --- Barra de HP do statbar ---
// O bundle (battle.js) preenche a barra de vida usando hpWidth(129) — a largura
// "cheia" original do Showdown. Nosso statbar reskin tem o sulco visível com
// 111px (ver CSS em dashboard.html). Sem corrigir, 100% de PS estoura o track e
// os valores intermediários (ex.: 51%) ficam largos demais (51% renderizava como
// ~59% do sulco). Remapeamos a base 129 -> 111 para TODAS as barras (statbar +
// animações de dano/cura), mantendo hpWidth(100) do texto "NN%" intacto.
(function () {
	if (typeof Pokemon === 'undefined' || !Pokemon.prototype || !Pokemon.prototype.hpWidth) return;
	if (Pokemon.prototype._rpgHpWidthPatched) return;
	Pokemon.prototype._rpgHpWidthPatched = true;
	var origHpWidth = Pokemon.prototype.hpWidth;
	Pokemon.prototype.hpWidth = function (maxWidth) {
		if (maxWidth === 129) maxWidth = 111;
		return origHpWidth.call(this, maxWidth);
	};
})();

// --- Coroa de Terastalização sobre o sprite ---
// O Showdown só sinaliza Tera com a gema do Teratipo no statbar — não desenha
// coroa no Pokémon (como nos jogos). Aqui sobrepomos a gema do Teratipo
// (sprites/types/Tera<Tipo>.png) acima da cabeça do sprite e a mantemos colada
// nele via requestAnimationFrame enquanto algum Pokémon ativo estiver Tera.
// Penduramos nos métodos de posição do PokemonSprite (o protótipo é global, então
// funciona mesmo com o renderizador vindo do bundle minificado).
(function () {
	if (typeof PokemonSprite === 'undefined' || !PokemonSprite.prototype) return;
	if (PokemonSprite.prototype._rpgTeraCrown) return;
	PokemonSprite.prototype._rpgTeraCrown = true;

	var CROWN = 30;            // tamanho da gema/coroa em px
	var scene = null;          // capturado dos sprites em runtime
	var rafId = null;
	var crowned = [];          // sprites que têm coroa no momento

	function ensureCrown(sprite, type) {
		if (!sprite || !sprite.$el || !sprite.$el.length) return;
		if (!sprite._rpgCrown) {
			var $c = $('<img class="rpg-tera-crown" style="position:absolute;' +
				'pointer-events:none;z-index:5;width:' + CROWN + 'px;height:' + CROWN + 'px;' +
				'filter:drop-shadow(0 0 4px rgba(255,255,255,.95));" />');
			sprite.$el.parent().append($c);
			sprite._rpgCrown = $c;
		}
		var src = Dex.resourcePrefix + 'sprites/types/Tera' + type + '.png';
		if (sprite._rpgCrown.attr('src') !== src) sprite._rpgCrown.attr('src', src);
		var pos = sprite.$el.position();
		if (!pos) return;
		var w = sprite.$el.width() || (sprite.sp && sprite.sp.w) || 80;
		sprite._rpgCrown.css({
			left: (pos.left + w / 2 - CROWN / 2) + 'px',
			top: (pos.top - CROWN * 0.55) + 'px',
			display: ''
		});
	}
	function removeCrown(sprite) {
		if (sprite && sprite._rpgCrown) { sprite._rpgCrown.remove(); sprite._rpgCrown = null; }
	}

	// Troca o "L" do nível no statbar (ex.: "L16") pelo ícone lvl.png do jogo
	// antigo, mantendo o número. O bundle reconstrói o statbar a cada switch-in,
	// então reaplicamos a cada tick — é idempotente (pula se já tem o <img>).
	function relabelLevels() {
		var smalls = document.querySelectorAll('#battle-frame .statbar strong small');
		for (var i = 0; i < smalls.length; i++) {
			var el = smalls[i];
			if (el.getElementsByClassName('rpg-lvl').length) continue;
			var m = /^L(\d+)$/.exec((el.textContent || '').trim());
			if (!m) continue;
			el.innerHTML = '<img class="rpg-lvl" src="' + Dex.resourcePrefix +
				'rpg-images/attack/lvl.png" alt="Lv" ' +
				'style="height:12px;width:auto;vertical-align:middle;margin-right:1px;image-rendering:auto;position:relative;top:-3px;">' + m[1];
		}
	}

	function tick() {
		rafId = null;
		relabelLevels();
		if (!scene || !scene.battle) return;
		var need = [];
		(scene.battle.sides || []).forEach(function (side) {
			(side.active || []).forEach(function (pk) {
				if (pk && pk.sprite && pk.terastallized) need.push([pk.sprite, pk.terastallized]);
			});
		});
		for (var i = crowned.length - 1; i >= 0; i--) {
			var sp = crowned[i];
			var still = need.some(function (n) { return n[0] === sp; });
			if (!still) { removeCrown(sp); crowned.splice(i, 1); }
		}
		need.forEach(function (n) {
			ensureCrown(n[0], n[1]);
			if (crowned.indexOf(n[0]) < 0) crowned.push(n[0]);
		});
		// Loop contínuo: a cada frame reavalia quem está Tera e reposiciona a coroa
		// junto do sprite. Custo é desprezível (poucos Pokémon ativos por frame).
		schedule();
	}
	// rAF é pausado quando a aba está oculta (visibilityState=hidden); aí caímos
	// para setTimeout pra coroa não congelar (e pra dar pra inspecionar headless).
	function schedule() { rafId = document.hidden ? setTimeout(tick, 200) : requestAnimationFrame(tick); }
	function kick() { if (rafId == null) schedule(); }

	// Captura a cena pelos métodos de BattleScene (o protótipo de PokemonSprite do
	// bundle minificado NÃO é o window.PokemonSprite que conseguimos patchar; já o
	// BattleScene.prototype é o mesmo objeto que o bundle usa — pos/updateGen aqui
	// no arquivo provam isso). pos() roda a cada frame de animação, então mantém a
	// cena fresca e o loop da coroa vivo.
	if (typeof BattleScene !== 'undefined' && BattleScene.prototype) {
		['pos', 'updateGen', 'updateStatbar', 'resetSides', 'setFrameHTML'].forEach(function (m) {
			if (typeof BattleScene.prototype[m] !== 'function') return;
			var orig = BattleScene.prototype[m];
			BattleScene.prototype[m] = function () {
				var r = orig.apply(this, arguments);
				scene = this;
				kick();
				return r;
			};
		});
	}
})();
