(function () {
	'use strict';

	function stageMul(stage) {
		var s = stage || 0;
		if (s >= 0) return (2 + s) / 2;
		return 2 / (2 - s);
	}

	function speciesOf(mon) {
		return window.Catalog.byId[mon.species];
	}

	function strike(attacker, defender, move, atkStage, defStage) {
		if (!move || move.pp <= 0) return attacker.name + ' não tem PP para esse golpe.';
		move.pp -= 1;
		if (Math.random() * 100 > (move.acc || 100)) return attacker.name + ' errou ' + move.name + '.';
		if (!move.power) {
			defStage.atk = Math.max(-6, (defStage.atk || 0) - 1);
			return move.name + ' baixou o Ataque de ' + defender.name + '.';
		}
		var attSp = speciesOf(attacker);
		var defSp = speciesOf(defender);
		var note = window.Catalog.typeNote(move.type, defSp.types);
		if (note.mod === 0) return attacker.name + ' usou ' + move.name + '. Não afetou ' + defender.name + '! ' + note.text;
		var kind = window.Catalog.moveKind(move);
		var special = kind === 'Special';
		var aStats = window.Catalog.stats(attacker.species, attacker.level);
		var dStats = window.Catalog.stats(defender.species, defender.level);
		var atk = Math.max(1, Math.floor((special ? aStats.spa : aStats.atk) * stageMul(special ? atkStage.spa : atkStage.atk)));
		var def = Math.max(1, Math.floor((special ? dStats.spd : dStats.def) * stageMul(special ? defStage.spd : defStage.def)));
		var stab = attSp.types.indexOf(move.type) >= 0 ? 1.5 : 1;
		var base = Math.floor(Math.floor((Math.floor(2 * attacker.level / 5) + 2) * move.power * atk / def) / 50) + 2;
		var dmg = Math.floor(base * stab);
		dmg = Math.floor(dmg * note.mod);
		dmg = Math.floor(dmg * ((85 + Math.floor(Math.random() * 16)) / 100));
		if (dmg < 1) dmg = 1;
		defender.hp = Math.max(0, defender.hp - dmg);
		var effect = note.text ? ' ' + note.text : '';
		var ko = defender.hp <= 0 ? ' ' + defender.name + ' desmaiou!' : '';
		return attacker.name + ' usou ' + move.name + '. ' + dmg + ' de dano.' + effect + ko;
	}

	function aiMove(mon) {
		var usable = (mon.moves || []).filter(function (m) { return m.pp > 0; });
		if (!usable.length) return { name: 'Investida', type: 'Normal', power: 40, acc: 100, pp: 1, maxPp: 1 };
		var damaging = usable.filter(function (m) { return m.power > 0; });
		var pool = damaging.length && Math.random() < 0.82 ? damaging : usable;
		return pool[Math.floor(Math.random() * pool.length)];
	}

	var BALL_MOD = {
		pokeball: 1,
		greatball: 1.5,
		ultraball: 2,
		beastball: 0.1,
		masterball: 255
	};

	function ballLabel(id) {
		var shop = window.Shop && window.Shop.byId && window.Shop.byId[id];
		return (shop && shop.name) || id;
	}

	function isUltraBeast(sp) {
		if (!sp || !sp.abilities) return false;
		var a = sp.abilities;
		return a[0] === 'Beast Boost' || a[1] === 'Beast Boost' || a.H === 'Beast Boost';
	}

	function ballMultiplier(ballId, mon) {
		if (ballId === 'masterball') return 255;
		if (ballId === 'beastball') return isUltraBeast(speciesOf(mon)) ? 5 : 0.1;
		return BALL_MOD[ballId] == null ? 1 : BALL_MOD[ballId];
	}

	function speciesCatch(sp) {
		var table = window.BattleCatchRates || {};
		if (sp && table[sp.num]) return table[sp.num];
		if (!sp || !sp.baseStats) return 45;
		var b = sp.baseStats;
		var bst = b.hp + b.atk + b.def + b.spa + b.spd + b.spe;
		var hidden = sp.eggGroups && sp.eggGroups.indexOf('Undiscovered') >= 0;
		if (hidden && bst >= 580) return 3;
		if (hidden && bst < 350) return 75;
		if (bst >= 520) return 45;
		if (bst <= 280) return 255;
		return 90;
	}

	function catchOdds(mon, ballId) {
		if (ballId === 'masterball') return { percent: 1, shake: 65536 };
		var mod = ballMultiplier(ballId, mon);
		var rate = speciesCatch(speciesOf(mon));
		var maxHp = Math.max(1, mon.maxHp);
		var hp = Math.max(0, Math.min(maxHp, mon.hp));
		var x = Math.floor(((3 * maxHp - 2 * hp) * rate * mod) / (3 * maxHp));
		var catchBonus = window.skinCatchBonus ? window.skinCatchBonus() : 0;
		if (catchBonus) x = Math.min(255, Math.floor(x * (1 + catchBonus)));
		if (x >= 255) return { percent: 1, shake: 65536 };
		if (x <= 0) return { percent: 0, shake: 0 };
		var shake = Math.floor(65536 / Math.pow(255 / x, 0.1875));
		if (shake > 65535) shake = 65535;
		return { percent: Math.pow(shake / 65536, 4), shake: shake };
	}

	function shakeCount(shake) {
		if (shake >= 65536) return 4;
		var n = 0;
		for (var i = 0; i < 4; i++) {
			if (Math.floor(Math.random() * 65536) < shake) n += 1;
			else break;
		}
		return n;
	}

	function formatPct(p) {
		if (p >= 0.995) return '100%';
		var n = p * 100;
		if (n < 1) return '<1%';
		if (n < 10) return n.toFixed(1).replace('.', ',') + '%';
		return Math.round(n) + '%';
	}

	function Session(state, getTeam) {
		this.state = state;
		this.getTeam = getTeam;
	}

	Session.prototype.player = function () {
		return this.getTeam()[this.state.playerIndex];
	};

	Session.prototype.foe = function () {
		return this.state.foeParty[this.state.foeIndex];
	};

	Session.prototype.aliveIndexes = function () {
		var team = this.getTeam();
		var alive = [];
		for (var i = 0; i < team.length; i++) {
			if (team[i] && team[i].hp > 0) alive.push(i);
		}
		return alive;
	};

	// Quando o ativo desmaia: se só resta um, ele entra já com os golpes.
	// Se restam vários, a escolha fica aberta e o índice não muda sozinho.
	Session.prototype.openSwitch = function () {
		var alive = this.aliveIndexes();
		if (!alive.length) return 'loss';
		var active = this.player();
		var activeAlive = !!(active && active.hp > 0);
		if (alive.length === 1) {
			var only = alive[0];
			var changed = this.state.playerIndex !== only;
			this.state.playerIndex = only;
			this.state.mustSwitch = false;
			this.state.stages.p = { atk: 0, def: 0 };
			if (changed) push(this, this.getTeam()[only].name + ' entrou em campo.');
			return 'sent';
		}
		if (this.state.mustSwitch && activeAlive) {
			this.state.mustSwitch = false;
			return 'ready';
		}
		if (!activeAlive) {
			this.state.mustSwitch = true;
			this.state.stages.p = { atk: 0, def: 0 };
			return 'choose';
		}
		return 'ready';
	};

	Session.prototype.aliveFoe = function () {
		return this.state.foeParty.findIndex(function (m) { return m.hp > 0; });
	};

	function result(session, extra) {
		extra = extra || {};
		return {
			logs: session.state.log.slice(-8),
			outcome: extra.outcome || null,
			caught: extra.caught || null,
			mustSwitch: !!session.state.mustSwitch
		};
	}

	function push(session, line) {
		session.state.log.push(line);
		if (session.state.log.length > 40) session.state.log.shift();
	}

	function beginExchange(session) {
		session.state.hits = { you: '', wild: '' };
	}

	function pushSide(session, line, side) {
		push(session, line);
		if (!session.state.hits) session.state.hits = { you: '', wild: '' };
		session.state.hits[side] = line;
	}

	function afterExchange(session) {
		var foe = session.foe();
		if (foe && foe.hp <= 0) {
			var next = session.aliveFoe();
			if (next >= 0) {
				session.state.foeIndex = next;
				session.state.stages.f = { atk: 0, def: 0 };
				push(session, session.foe().name + ' entrou em campo.');
			} else {
				return result(session, { outcome: 'win' });
			}
		}
		var player = session.player();
		if (!player || player.hp <= 0) {
			var status = session.openSwitch();
			if (status === 'loss') return result(session, { outcome: 'loss' });
			if (status === 'choose') push(session, 'Escolha o próximo Pokémon.');
		}
		if (!session.state.mustSwitch) session.state.turn = (session.state.turn || 1) + 1;
		return result(session);
	}

	function foeRetaliates(session) {
		var foe = session.foe();
		var player = session.player();
		if (!foe || foe.hp <= 0 || !player || player.hp <= 0) return;
		var move = aiMove(foe);
		pushSide(session, strike(foe, player, move, session.state.stages.f, session.state.stages.p), 'wild');
	}

	Session.prototype.useMove = function (moveIndex) {
		if (this.state.mustSwitch) return result(this);
		var player = this.player();
		var foe = this.foe();
		var move = player.moves[moveIndex];
		if (!move || move.pp <= 0) {
			push(this, 'Esse golpe está sem PP.');
			return result(this);
		}
		beginExchange(this);
		var pSpe = window.Catalog.stats(player.species, player.level).spe;
		var fSpe = window.Catalog.stats(foe.species, foe.level).spe;
		var firstPlayer = pSpe >= fSpe;
		var acted = { p: false, f: false };
		var order = firstPlayer ? ['p', 'f'] : ['f', 'p'];
		for (var i = 0; i < order.length; i++) {
			if (player.hp <= 0 || foe.hp <= 0) break;
			if (order[i] === 'p' && !acted.p) {
				pushSide(this, strike(player, foe, move, this.state.stages.p, this.state.stages.f), 'you');
				acted.p = true;
			} else if (order[i] === 'f' && !acted.f) {
				foeRetaliates(this);
				acted.f = true;
			}
		}
		return afterExchange(this);
	};

	Session.prototype.catchChance = function (ballId) {
		var foe = this.foe();
		if (!foe || !this.state.canCatch) return 0;
		return catchOdds(foe, ballId).percent;
	};

	Session.prototype.throwBall = function (ballId) {
		if (!this.state.canCatch || this.state.mustSwitch) {
			push(this, 'Não dá para capturar agora.');
			return result(this);
		}
		beginExchange(this);
		var foe = this.foe();
		var odds = catchOdds(foe, ballId);
		var name = ballLabel(ballId);
		var pct = formatPct(odds.percent);
		var shakes = shakeCount(odds.shake);
		if (shakes >= 4) {
			pushSide(this, 'Você jogou a ' + name + '. A bola balançou 3 vezes. Pegou! ' + foe.name + ' foi capturado! (' + pct + ')', 'you');
			return result(this, { outcome: 'catch', caught: foe });
		}
		var wobble = shakes === 0 ? 'A bola não balançou.' : ('A bola balançou ' + shakes + (shakes === 1 ? ' vez.' : ' vezes.'));
		pushSide(this, 'Você jogou a ' + name + '. ' + wobble + ' ' + foe.name + ' escapou! Chance de ' + pct + '.', 'you');
		foeRetaliates(this);
		return afterExchange(this);
	};

	Session.prototype.usePotion = function (amount) {
		if (this.state.mustSwitch) return result(this);
		var player = this.player();
		if (player.hp <= 0) {
			push(this, 'Esse Pokémon desmaiou.');
			return result(this);
		}
		beginExchange(this);
		var before = player.hp;
		player.hp = amount === 'full' ? player.maxHp : Math.min(player.maxHp, player.hp + amount);
		pushSide(this, player.name + (player.hp === before ? ' já está com o PS cheio.' : ' recuperou PS.'), 'you');
		foeRetaliates(this);
		return afterExchange(this);
	};

	Session.prototype.switchTo = function (index) {
		var team = this.getTeam();
		var mon = team[index];
		if (!mon || mon.hp <= 0) {
			push(this, 'Esse Pokémon não pode entrar.');
			return result(this);
		}
		var forced = this.state.mustSwitch;
		beginExchange(this);
		this.state.playerIndex = index;
		this.state.mustSwitch = false;
		this.state.stages.p = { atk: 0, def: 0 };
		pushSide(this, mon.name + ' entrou em campo.', 'you');
		if (!forced && this.foe() && this.foe().hp > 0) foeRetaliates(this);
		return afterExchange(this);
	};

	Session.prototype.run = function () {
		if (!this.state.canRun) {
			push(this, 'Não dá para fugir desta batalha.');
			return result(this);
		}
		var player = this.player();
		var foe = this.foe();
		var pSpe = window.Catalog.stats(player.species, player.level).spe;
		var fSpe = window.Catalog.stats(foe.species, foe.level).spe;
		if (Math.random() < Math.min(0.95, 0.55 + (pSpe - fSpe) / 400)) {
			push(this, 'Você fugiu em segurança.');
			return result(this, { outcome: 'run' });
		}
		beginExchange(this);
		pushSide(this, 'Não conseguiu fugir!', 'you');
		foeRetaliates(this);
		return afterExchange(this);
	};

	Session.prototype.megaEvolve = function (formId, formName, itemName) {
		var player = this.player();
		if (!player || player.hp <= 0 || player.isMega) return false;
		var targetSpecies = window.Catalog.getSpecies(formId);
		if (!targetSpecies) return false;

		player._origSpecies = player._origSpecies || player.species;
		player._origName = player._origName || player.name;
		player.species = formId;
		player.name = formName || targetSpecies.name;
		player.isMega = true;

		var oldMax = player.maxHp;
		var newStats = window.Catalog.stats(formId, player.level);
		if (newStats.hp > oldMax) {
			player.maxHp = newStats.hp;
			player.hp = Math.min(player.maxHp, player.hp + (newStats.hp - oldMax));
		}

		var line = '✨ ' + (player._origName || 'Pokémon') + ' reagiu à ' + (itemName || 'Mega Stone') + ' e Mega Evoluiu para ' + player.name + '!';
		push(this, line);
		if (!this.state.hits) this.state.hits = { you: '', wild: '' };
		this.state.hits.you = line;
		return true;
	};

	window.BattleSession = Session;
	window.BattleMath = { catchOdds: catchOdds, formatPct: formatPct, speciesCatch: speciesCatch };
})();
