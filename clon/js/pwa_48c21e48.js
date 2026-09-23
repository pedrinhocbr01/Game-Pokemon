/* Story Showdown — PWA: registra o service worker e mostra um BANNER de "Instalar app".
   Quando instalado, o jogo abre em tela cheia, SEM a barra de URL (display:standalone),
   igual ao "APK" do site antigo. O banner só aparece na tela de LOGIN.

   IMPORTANTE: o Chrome só dispara 'beforeinstallprompt' se o app AINDA não foi instalado e não
   foi dispensado recentemente (throttle ~90 dias por origem); iOS Safari NUNCA dispara. Por isso,
   além do banner "nativo" (botão instala direto), há um FALLBACK: se em ~2,5s o evento não veio e
   o app não está rodando instalado, mostramos o banner com o PASSO-A-PASSO manual — assim a opção
   de instalar nunca "some" da tela de login. */
(function () {
	'use strict';

	// 1) Registra o service worker (necessário pra instalar como PWA).
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', function () {
			navigator.serviceWorker.register('/sw.js').catch(function () { /* sem PWA, sem drama */ });
		});
	}

	// Já está rodando como app instalado (janela standalone)? Então não oferece instalar.
	function isInstalled() {
		return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
			window.navigator.standalone === true;
	}
	function isIOS() {
		return /iP(hone|ad|od)/.test(navigator.userAgent) ||
			(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);   // iPadOS se passa por Mac
	}

	var deferredPrompt = null;

	// 2) O Chrome dispara isto quando o site é instalável: guardamos o evento e mostramos nosso
	//    próprio banner (o prompt nativo só abre no clique). Se um banner MANUAL já estava na tela,
	//    troca pelo NATIVO (botão instala direto).
	window.addEventListener('beforeinstallprompt', function (e) {
		e.preventDefault();
		deferredPrompt = e;
		if (!isInstalled()) { removeInstall(); showInstall(false); }
	});

	window.addEventListener('appinstalled', function () { deferredPrompt = null; removeInstall(); });

	// 3) FALLBACK: sem 'beforeinstallprompt' em ~2,5s (iOS, Chrome com throttle, etc.) → banner MANUAL.
	window.addEventListener('load', function () {
		setTimeout(function () { if (!deferredPrompt && !isInstalled()) showInstall(true); }, 2500);
	});

	function removeInstall() {
		var c = document.getElementById('pwa-install-card');
		if (c && c.parentNode) c.parentNode.removeChild(c);
	}

	function t(key, fallback) {
		return (window.I18n && window.I18n.t) ? window.I18n.t(key) : fallback;
	}

	function injectStyleOnce() {
		if (document.getElementById('pwa-install-style')) return;
		var s = document.createElement('style');
		s.id = 'pwa-install-style';
		s.textContent = [
			'#pwa-install-card{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:100090;',
			'display:flex;align-items:center;gap:13px;width:min(440px,calc(100vw - 24px));padding:13px 16px 13px 14px;',
			'background:linear-gradient(180deg,rgba(27,36,44,.98),rgba(18,26,33,.98));border:1px solid #2c3a45;',
			'border-top:2px solid #2FB2EF;border-radius:14px;box-shadow:0 16px 44px rgba(0,0,0,.55);color:#e8eef0;',
			"font-family:'Open Sans',Arial,sans-serif;animation:pwaUp .35s ease;-webkit-tap-highlight-color:transparent}",
			'@keyframes pwaUp{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}',
			'#pwa-install-card .pwa-ic{width:48px;height:48px;border-radius:11px;flex:0 0 auto;box-shadow:0 3px 10px rgba(0,0,0,.45)}',
			'#pwa-install-card .pwa-tx{flex:1 1 auto;min-width:0;line-height:1.28}',
			'#pwa-install-card .pwa-tx strong{display:block;font-size:14px;color:#fff;font-weight:700}',
			'#pwa-install-card .pwa-tx span{display:block;font-size:11.5px;color:#9fb2bd;margin-top:2px}',
			'#pwa-install-card .pwa-go{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;border:0;border-radius:10px;cursor:pointer;',
			"padding:11px 16px;font:700 13px/1 'Open Sans',Arial,sans-serif;color:#fff;letter-spacing:.2px;",
			'background:linear-gradient(180deg,#3bb6f0,#1f87c9);box-shadow:0 5px 14px rgba(13,107,165,.5),inset 0 1px 0 rgba(255,255,255,.25);',
			'transition:transform .12s ease,box-shadow .12s ease}',
			'#pwa-install-card .pwa-go:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(13,107,165,.55),inset 0 1px 0 rgba(255,255,255,.25)}',
			'#pwa-install-card .pwa-go:active{transform:translateY(0)}',
			'#pwa-install-card .pwa-x{position:absolute;top:5px;right:7px;border:0;background:none;color:#7d8ea0;font-size:18px;line-height:1;cursor:pointer;padding:2px 5px;border-radius:6px}',
			'#pwa-install-card .pwa-x:hover{color:#fff;background:rgba(255,255,255,.08)}',
			'@media (max-width:380px){#pwa-install-card .pwa-ic{width:40px;height:40px}#pwa-install-card .pwa-tx span{font-size:11px}#pwa-install-card .pwa-go{padding:10px 13px}}',
		].join('');
		document.head.appendChild(s);
	}

	// manual=true → sem prompt nativo: mostra o passo-a-passo pra instalar na mão (iOS/Chrome throttled).
	function showInstall(manual) {
		if (document.getElementById('pwa-install-card') || !document.body) return;
		if (isInstalled()) return;
		// Só na tela de LOGIN (que tem #login-wrap). No dashboard/jogo não aparece.
		if (!document.getElementById('login-wrap')) return;
		if (sessionStorage.getItem('pwa_install_dismissed')) return;
		injectStyleOnce();
		var useManual = manual && !deferredPrompt;   // se o evento nativo existe, sempre prefere ele
		var desc, btnLabel;
		if (useManual) {
			desc = isIOS()
				? t('login.installIos', 'No Safari: toque em Compartilhar (⬆️) e depois "Adicionar à Tela de Início".')
				: t('login.installManual', 'No menu do navegador (⋮), escolha "Instalar app" ou "Adicionar à tela inicial".');
			btnLabel = t('login.installOk', 'Entendi');
		} else {
			desc = t('login.installDesc', 'Jogue em tela cheia, direto da tela inicial — sem a barra do navegador.');
			btnLabel = t('login.installApp', 'Instalar app');
		}
		var dlIcon = useManual ? '' : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/></svg>';
		var card = document.createElement('div');
		card.id = 'pwa-install-card';
		card.innerHTML =
			'<img class="pwa-ic" src="/icon-192.png" alt="">' +
			'<div class="pwa-tx">' +
				'<strong data-i18n="login.installTitle">' + t('login.installTitle', 'Instalar o app') + '</strong>' +
				'<span>' + desc + '</span>' +
			'</div>' +
			'<button type="button" class="pwa-go">' + dlIcon + '<span>' + btnLabel + '</span></button>' +
			'<button type="button" class="pwa-x" aria-label="Fechar">&times;</button>';
		document.body.appendChild(card);
		card.querySelector('.pwa-go').addEventListener('click', function () {
			if (deferredPrompt) {   // caminho NATIVO: abre o prompt do Chrome
				deferredPrompt.prompt();
				deferredPrompt.userChoice.then(function () { deferredPrompt = null; removeInstall(); });
			} else {                // caminho MANUAL: "Entendi" só fecha (as instruções já estão no texto)
				try { sessionStorage.setItem('pwa_install_dismissed', '1'); } catch (e) {}
				removeInstall();
			}
		});
		card.querySelector('.pwa-x').addEventListener('click', function () {
			try { sessionStorage.setItem('pwa_install_dismissed', '1'); } catch (e) {}
			removeInstall();
		});
	}
})();
