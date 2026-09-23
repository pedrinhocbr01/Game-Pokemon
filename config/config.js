/** @type {import('../play.pokemonshowdown.com/src/client-main').PSConfig} */
var Config = Config || {};

/* version */ Config.version = "0";

Config.bannedHosts = [];

Config.whitelist = [];

// Servidor local independente: sem login server, /trn nome direto.
Config.noguestsecurity = true;

// Aponta o client para o SEU server local (Story Showdown), sem depender da Smogon.
Config.defaultserver = {
	id: 'localhost',
	host: 'localhost',
	port: 8000,
	httpport: 8000,
	altport: 80,
	registered: false
};

Config.roomsFirstOpenScript = function () {
};

Config.customcolors = {};
/*** Begin automatically generated configuration ***/
Config.version = "0.11.2 (9867c498)";

Config.routes = {
	root: 'pokemonshowdown.com',
	// MESMO host da página (localhost OU domínio): o Dex.resourcePrefix da batalha resolve
	// pra origin atual, então sprites/ícones/fundos carregam em qualquer URL (não fixa localhost).
	client: (typeof location !== 'undefined' && location.host) ? location.host : 'localhost',
	dex: 'dex.pokemonshowdown.com',
	replays: 'replay.pokemonshowdown.com',
	users: 'pokemonshowdown.com/users',
	teams: 'teams.pokemonshowdown.com',
};
/*** End automatically generated configuration ***/