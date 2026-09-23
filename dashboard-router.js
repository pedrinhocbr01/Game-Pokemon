/* Story Showdown — roteador leve de "páginas" (SPA, sem reload).
 * Camada ADITIVA e isolada: não altera nenhum sistema. Cada sistema vira uma URL
 * (#/mercado, #/banco, ...). Abrir um sistema reflete a URL; abrir uma URL com
 * rota (deep-link / editar a barra de endereço) abre o sistema correspondente —
 * tudo sem recarregar o site. Para reverter, basta remover a tag <script> deste
 * arquivo do dashboard.html. */
(function () {
  'use strict';
  // rota -> função global que abre o sistema (já existentes no dashboard-app.js)
  var FN = {
    bolsa: 'openBag', box: 'openBox', propriedade: 'openProperty', pokedex: 'openPokedex',
    banco: 'openBank', mercado: 'openShop', 'mercado-negro': 'openBlackMarket', moves: 'openMovesSpecialist',
    cacar: 'openSafari', viajar: 'openTravel', npcs: 'openTrainerRoulette', centro: 'openPokeCenter', tour: 'openTournaments',
    gym: 'openGyms', bage: 'openBadges'
  };
  // rota -> id do botão da navbar (pra refletir a URL quando o jogador clica)
  var NAV = {
    bolsa: 'nav-minha-bolsa', box: 'nav-minha-box', propriedade: 'nav-minha-prop', pokedex: 'nav-minha-pokedex',
    banco: 'nav-exp-banco', mercado: 'nav-exp-market', 'mercado-negro': 'nav-esp-blackmarket', moves: 'nav-esp-moves',
    cacar: 'nav-exp-cacar', viajar: 'nav-exp-viajar', npcs: 'nav-exp-npcs', centro: 'nav-exp-centro', tour: 'nav-esp-tournament',
    gym: 'nav-exp-gym', bage: 'nav-minha-badges'
  };

  function setHash(route) {
    try { var want = '#/' + route; if (location.hash !== want) history.replaceState(null, '', want); } catch (e) {}
  }
  // Exposto p/ outros pontos de entrada (ex.: atalhos do menu radial na home) refletirem a URL
  // igual à navbar. replaceState não dispara 'hashchange' → sem laço.
  window.ssRoute = setHash;
  function routeOf() {
    var m = (location.hash || '').match(/^#\/?([a-z-]+)/i);
    return m ? m[1].toLowerCase() : '';
  }
  // Abre a rota chamando a função do sistema. Espera o app inicializar (a função
  // pode ainda não existir logo no load) — tenta por alguns segundos.
  function go(route, tries) {
    var fn = FN[route]; if (!fn) return;
    if (typeof window[fn] === 'function') { try { window[fn](); } catch (e) {} return; }
    if ((tries || 0) < 30) setTimeout(function () { go(route, (tries || 0) + 1); }, 200);
  }

  function wire() {
    // Reflete a URL quando um item mapeado da navbar é clicado.
    // replaceState NÃO dispara 'hashchange' → sem laço com o handler abaixo.
    Object.keys(NAV).forEach(function (route) {
      var el = document.getElementById(NAV[route]);
      if (el) el.addEventListener('click', function () { setHash(route); });
    });
    // Navegação manual da URL (editar barra / voltar para um #/rota) abre o sistema.
    window.addEventListener('hashchange', function () { var r = routeOf(); if (r && FN[r]) go(r); });
    // Deep-link inicial: se a página abriu já com #/rota, abre aquele sistema.
    // EXCEÇÃO: se há uma batalha salva pra retomar (ss_battle), o BOOT do app já restaura a
    // view + retoma a batalha. Disparar go() aqui criaria uma 2ª abertura CONCORRENTE (corrida)
    // que derrubava a batalha retomada — exigindo F5 extra. Nesse caso, deixa o app cuidar.
    var _hasBattle = false;
    try { _hasBattle = !!sessionStorage.getItem('ss_battle'); } catch (e) {}
    // EXCEÇÃO 2 (#/cacar e #/propriedade): o BOOT do app restaura o Safari/Propriedade no MESMO
    // mapa/posição (via /me, ss_view==='safari'). Disparar go() aqui reabriria o mapa SEM posição →
    // openSafari()/openProperty() sem args cai no spawn inicial por cima da restauração correta
    // (carrega certo e depois volta pra posição inicial). Nesse caso, deixa o boot cuidar.
    var _bootView = '';
    try { _bootView = sessionStorage.getItem('ss_view') || ''; } catch (e) {}
    var _bootHandlesSafari = ((routeOf() === 'cacar' || routeOf() === 'propriedade') && _bootView === 'safari');
    if (routeOf() && !_hasBattle && !_bootHandlesSafari) setTimeout(function () { go(routeOf()); }, 400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
