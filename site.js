/* Vigia Cariacica: o pouco de script do site. Tudo funciona sem ele, menos ouvir, letra maior e a busca. */
(function () {
  "use strict";
  var raiz = document.documentElement;

  /* letra maior, lembrada neste aparelho (o botão aparece no menu do celular e no topo do computador) */
  var bLetras = Array.prototype.slice.call(document.querySelectorAll("[data-letra]"));
  function letra(on) {
    raiz.classList.toggle("letra-maior", on);
    bLetras.forEach(function (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); });
  }
  try { letra(localStorage.getItem("vigia-letra") === "1"); } catch (e) {}
  bLetras.forEach(function (bLetra) {
    bLetra.addEventListener("click", function () {
      var on = bLetra.getAttribute("aria-pressed") !== "true";
      letra(on);
      try { localStorage.setItem("vigia-letra", on ? "1" : "0"); } catch (e) {}
    });
  });

  /* ouvir a página com a voz do próprio celular (não gasta dados) */
  var bOuvires = Array.prototype.slice.call(document.querySelectorAll("[data-ouvir]"));
  var temFala = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  if (!temFala) bOuvires.forEach(function (b) { b.hidden = true; });
  function parar() {
    if (temFala) speechSynthesis.cancel();
    bOuvires.forEach(function (b) { b.setAttribute("aria-pressed", "false"); b.textContent = b.dataset.rotulo || b.textContent; });
  }
  bOuvires.forEach(function (b) { b.dataset.rotulo = b.textContent; });
  if (temFala) bOuvires.forEach(function (bOuvir) { bOuvir.addEventListener("click", function () {
    if (bOuvir.getAttribute("aria-pressed") === "true") { parar(); return; }
    var main = document.querySelector("main");
    var vistos = {}, partes = [];
    main.querySelectorAll("h1,h2,h3,p,li,dt,dd,summary,.valor").forEach(function (e) {
      if (e.closest(".fonte,.meta,[data-nao-ler],form,details:not([open]) .ped") || e.offsetParent === null) return;
      if (e.querySelector("p,li")) return;
      var t = e.innerText.replace(/→/g, "").trim();
      if (t && !vistos[t]) { vistos[t] = 1; partes.push(t); }
    });
    var u = new SpeechSynthesisUtterance(partes.join(". "));
    u.lang = "pt-BR"; u.rate = 0.95;
    var voz = speechSynthesis.getVoices().filter(function (v) { return /pt[-_]BR/i.test(v.lang); })[0];
    if (voz) u.voice = voz;
    u.onend = parar; u.onerror = parar;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
    bOuvires.forEach(function (b) { b.setAttribute("aria-pressed", "true"); b.textContent = "Parar de ouvir"; });
  }); });

  /* relógios do prazo de resposta */
  var agora = new Date(Date.now() - 3 * 3600 * 1000);
  var hoje = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());
  function dia(iso) { var p = iso.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function ddmm(iso) { return iso.slice(8, 10) + "/" + iso.slice(5, 7); }
  document.querySelectorAll(".relogio[data-prazo]").forEach(function (el) {
    if (el.dataset.respondido) { var e = el.dataset.estado; el.textContent = (e === "parcial" ? "Respondida só em parte em " : e === "negado" ? "Negada em " : "Respondida em ") + ddmm(el.dataset.respondido); return; }
    var p = el.dataset.prazo, n = Math.round((dia(p) - hoje) / 86400000);
    if (n > 1) el.textContent = "Prazo: " + ddmm(p) + " · faltam " + n + " dias";
    else if (n === 1) el.textContent = "Prazo: amanhã, " + ddmm(p);
    else if (n === 0) el.textContent = "Prazo: hoje, " + ddmm(p);
    else { el.textContent = "Atrasada há " + (-n) + (n === -1 ? " dia" : " dias"); el.classList.add("vencido"); }
  });

  /* quanto falta para cada grupo de prazo (a página é gerada uma vez; o celular conta os dias) */
  document.querySelectorAll(".falta[data-prazo]").forEach(function (el) {
    var n = Math.round((dia(el.dataset.prazo) - hoje) / 86400000);
    el.textContent = n > 1 ? "faltam " + n + " dias" : n === 1 ? "vence amanhã" : n === 0 ? "vence hoje" : "venceu há " + (-n) + (n === -1 ? " dia" : " dias");
  });

  /* busca de bairro: filtra a lista enquanto a pessoa digita; Enter abre o primeiro */
  function norm(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
  document.querySelectorAll("[data-busca-bairro]").forEach(function (form) {
    var campo = form.querySelector("input"), lista = document.getElementById(form.dataset.buscaBairro);
    var aviso = form.querySelector("[data-aviso]");
    if (!campo || !lista) return;
    var itens = Array.prototype.slice.call(lista.querySelectorAll("li"));
    var soBusca = form.hasAttribute("data-so-busca");
    function filtrar() {
      var q = norm(campo.value), achados = 0;
      itens.forEach(function (li) {
        var ok = q ? norm(li.dataset.nomes || li.textContent).indexOf(q) !== -1 : !soBusca;
        if (ok && soBusca && achados >= 8) ok = false;
        li.hidden = !ok; if (ok) achados++;
      });
      if (aviso) aviso.hidden = !q || achados > 0;
    }
    campo.addEventListener("input", filtrar);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var primeiro = itens.filter(function (li) { return !li.hidden; })[0];
      if (primeiro) location.href = primeiro.querySelector("a").href;
    });
  });

  /* fila: ordenar a lista de postos */
  var lista = document.getElementById("postos");
  document.querySelectorAll("[data-ordem]").forEach(function (b) {
    b.addEventListener("click", function () {
      var chave = b.dataset.ordem;
      var itens = Array.prototype.slice.call(lista.children);
      itens.sort(function (x, y) {
        if (chave === "nome") return x.dataset.nome.localeCompare(y.dataset.nome, "pt-BR");
        return (+y.dataset[chave]) - (+x.dataset[chave]);
      });
      itens.forEach(function (li) { lista.appendChild(li); });
      document.querySelectorAll("[data-ordem]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
    });
  });

  /* o bairro da pessoa: guardado só neste aparelho, para o início mostrar o atalho */
  var guardar = document.querySelector("[data-guardar-bairro]");
  if (guardar) {
    try { localStorage.setItem("vigia-bairro", JSON.stringify({ slug: guardar.dataset.guardarBairro, nome: guardar.textContent.trim() })); } catch (e) {}
  }
  var atalho = document.querySelector("[data-seu-bairro]");
  if (atalho) {
    try {
      var meu = JSON.parse(localStorage.getItem("vigia-bairro") || "null");
      if (meu && /^[a-z0-9-]+$/.test(meu.slug)) {
        atalho.querySelector("a").href = "/bairros/" + meu.slug + "/";
        atalho.querySelector("b").textContent = meu.nome;
        atalho.hidden = false;
      }
    } catch (e) {}
  }

  /* link para uma parte fechada (ex.: /fontes/#obras): abre a parte */
  function abrirAlvo() {
    var id = decodeURIComponent(location.hash.slice(1));
    var alvo = id && document.getElementById(id);
    if (alvo && alvo.tagName === "DETAILS") { alvo.open = true; alvo.scrollIntoView(); }
  }
  abrirAlvo();
  window.addEventListener("hashchange", abrirAlvo);

  /* filtro por assunto (página do bairro): mostra só o que é daquele assunto; "geral" fica sempre */
  document.querySelectorAll("[data-filtro]").forEach(function (barra) {
    barra.hidden = false;
    var botoes = barra.querySelectorAll("[data-ver]");
    botoes.forEach(function (b) {
      b.addEventListener("click", function () {
        var ver = b.dataset.ver;
        botoes.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        document.querySelectorAll("main [data-cat]").forEach(function (el) {
          var c = el.dataset.cat;
          el.hidden = !(ver === "tudo" || c === "geral" || c === ver);
        });
        document.querySelectorAll("main [data-grupo-cat]").forEach(function (g) {
          g.hidden = !g.querySelector("[data-cat]:not([hidden])");
        });
      });
    });
  });

  /* mapa: trocar a camada e tocar num bairro */
  var mapa = document.querySelector("[data-mapa]");
  if (mapa) {
    var nomes = { pop: "Moradores", den: "Moradores por km²", esg: "Casas sem esgoto na rede", ren: "Metade ganha até" };
    var caixa = document.querySelector("[data-escolhido]");
    document.querySelectorAll("[data-camada]").forEach(function (b) {
      if (b.tagName !== "BUTTON") return;
      b.addEventListener("click", function () {
        mapa.setAttribute("data-camada", b.dataset.camada);
        document.querySelectorAll("button[data-camada]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        document.querySelectorAll("[data-legenda]").forEach(function (l) { l.hidden = l.dataset.legenda !== b.dataset.camada; });
      });
    });
    function escolher(p, rolar) {
      if (!p || !p.dataset.n) return;
      var antes = mapa.querySelector(".escolhido");
      if (antes) antes.classList.remove("escolhido");
      p.classList.add("escolhido");
      p.parentNode.appendChild(p);   /* traz para a frente, para a borda rosa aparecer inteira */
      var linhas = ["pop", "den", "esg", "ren"].map(function (k) {
        return "<dt>" + nomes[k] + "</dt><dd>" + (k === "ren" ? "" : "") + p.getAttribute("data-v" + k) + "</dd>";
      }).join("") + "<dt>Casas</dt><dd>" + p.dataset.c + "</dd>";
      caixa.innerHTML = '<p class="prot">Bairro</p><p class="nome"></p><dl>' + linhas + '</dl><p><a href="/bairros/' + p.dataset.s + '/">Abrir a página do bairro →</a></p>';
      caixa.querySelector(".nome").textContent = p.dataset.n;
      if (rolar && window.innerWidth < 760) caixa.scrollIntoView({ block: "nearest" });
    }
    mapa.addEventListener("click", function (e) { escolher(e.target.closest("path"), true); });
    var inicial = location.hash.slice(1);
    if (!inicial) { try { inicial = (JSON.parse(localStorage.getItem("vigia-bairro") || "null") || {}).slug; } catch (e) {} }
    if (inicial && /^[a-z0-9-]+$/.test(inicial)) escolher(document.getElementById("m-" + inicial), false);
  }

  /* tabela que ordena ao tocar no título da coluna */
  document.querySelectorAll("[data-ordenavel]").forEach(function (t) {
    var corpo = t.tBodies[0];
    t.querySelectorAll("th button[data-col]").forEach(function (b) {
      b.addEventListener("click", function () {
        var th = b.parentNode, col = +b.dataset.col, txt = b.dataset.tipo === "txt";
        var desc = th.getAttribute("aria-sort") !== "descending";
        if (txt) desc = th.getAttribute("aria-sort") === "ascending";
        t.querySelectorAll("th[aria-sort]").forEach(function (o) { o.removeAttribute("aria-sort"); });
        th.setAttribute("aria-sort", desc ? "descending" : "ascending");
        var linhas = Array.prototype.slice.call(corpo.rows);
        linhas.sort(function (x, y) {
          var a = x.cells[col].dataset.v, c = y.cells[col].dataset.v;
          var r = txt ? a.localeCompare(c, "pt-BR") : (+a) - (+c);
          return desc ? -r : r;
        });
        linhas.forEach(function (l) { corpo.appendChild(l); });
      });
    });
  });

  /* trocar o jeito de ver um valor (dinheiro: de cada R$ 100, em reais, por morador) */
  document.querySelectorAll("[data-trocar]").forEach(function (barra) {
    var alvo = document.getElementById(barra.dataset.trocar);
    barra.hidden = false;
    barra.querySelectorAll("button[data-modo]").forEach(function (b) {
      b.addEventListener("click", function () {
        barra.querySelectorAll("button[data-modo]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        alvo.querySelectorAll("[data-" + b.dataset.modo + "]").forEach(function (el) { el.textContent = el.getAttribute("data-" + b.dataset.modo); });
      });
    });
  });

  /* imprimir: abre as partes fechadas e depois fecha de novo */
  var fechadas = [];
  window.addEventListener("beforeprint", function () {
    fechadas = Array.prototype.filter.call(document.querySelectorAll("main details:not([open])"), function (d) { d.open = true; return true; });
  });
  window.addEventListener("afterprint", function () { fechadas.forEach(function (d) { d.open = false; }); fechadas = []; });

  /* mandar no WhatsApp e copiar o link desta página */
  document.querySelectorAll("[data-zap]").forEach(function (a) {
    a.href = "https://wa.me/?text=" + encodeURIComponent(a.dataset.zap + " " + location.href);
  });
  document.querySelectorAll("[data-copiar]").forEach(function (b) {
    b.addEventListener("click", function () {
      var msg = document.getElementById(b.dataset.copiar);
      var url = location.href;
      function ok() { if (msg) msg.textContent = "Link copiado."; }
      function falhou() { if (msg) msg.textContent = "Copie este link: " + url; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, falhou); else falhou();
    });
  });

  /* denúncia: manda para o formulário do Google sem sair da página. Sem script, o formulário vai direto para o
     Google, que mostra a confirmação dele. Nada fica guardado neste aparelho (celular pode ser dividido com a
     família): nem rascunho, nem código, só a contagem de envios desta aba, contra robô. */
  var den = document.querySelector("[data-denuncia]");
  if (den) {
    var inicio = Date.now();
    var relato = document.getElementById("d-relato"), avisoDado = document.getElementById("aviso-dado");
    var erro = den.querySelector("[data-erro]"), botao = den.querySelector("button[type=submit]");
    var isca = den.querySelector(".isca input"), feito = document.getElementById("recebido");
    var cpf = /(^|\D)\d{3}\.?\d{3}\.?\d{3}[-.\s]?\d{2}(\D|$)/;
    var tel = /(^|\D)(\(?\d{2}\)?[\s-]?)?9?\d{4}[\s-]?\d{4}(\D|$)/;
    function dadoPessoal() {
      var t = relato.value, msg = "";
      if (cpf.test(t)) msg = "Parece que tem um CPF ou um celular no texto. Apague, por favor: a gente não precisa disso para conferir.";
      else if (tel.test(t)) msg = "Parece que tem um telefone no texto. Se for de outra pessoa, apague, por favor.";
      avisoDado.textContent = msg; avisoDado.hidden = !msg;
      return !cpf.test(t);
    }
    function mostrarErro(msg) { erro.textContent = msg; erro.hidden = !msg; }
    function codigo() {
      var letras = "ACDEFGHJKMNPQRTUVWXY34679", n = new Uint32Array(6), s = "";
      (window.crypto || window.msCrypto).getRandomValues(n);
      for (var i = 0; i < 6; i++) s += letras[n[i] % letras.length];
      return s;
    }
    relato.addEventListener("input", dadoPessoal);
    den.addEventListener("submit", function (e) {
      e.preventDefault();
      mostrarErro("");
      /* campo invisível preenchido: pode ser robô ou o preenchimento automático do celular. Manda assim mesmo, com
         a marca ISCA, e a conferência separa: nenhuma denúncia de gente some calada. */
      var robo = !!isca.value;
      if (!den.checkValidity()) { den.reportValidity(); return; }
      if (relato.value.trim().length < 20) { mostrarErro("Conte um pouco mais: o quê, onde e desde quando."); relato.focus(); return; }
      if (!dadoPessoal()) { relato.focus(); return; }
      var envios = 0;
      try { envios = +(sessionStorage.getItem("vigia-envios") || 0); } catch (x) {}
      if (envios >= 5) { mostrarErro("Você já mandou 5 denúncias agora. Obrigado! Para mandar mais, volte mais tarde."); return; }
      if (!navigator.onLine) { mostrarErro("Parece que você está sem internet. Confira e tente de novo."); return; }
      var cod = codigo(), seg = Math.round((Date.now() - inicio) / 1000);
      isca.value = (robo ? "ISCA " : "") + "codigo=" + cod + " tempo=" + seg + "s";
      var corpo = new URLSearchParams(new FormData(den));
      isca.value = "";
      botao.disabled = true; botao.textContent = "Mandando...";
      fetch(den.action, { method: "POST", mode: "no-cors", credentials: "omit", body: corpo })
        .then(function () {
          try { sessionStorage.setItem("vigia-envios", String(envios + 1)); } catch (x) {}
          den.reset(); den.hidden = true;
          feito.querySelector("[data-codigo]").textContent = cod;
          feito.hidden = false; feito.focus(); feito.scrollIntoView({ block: "start" });
        })
        .catch(function () {
          mostrarErro("Não deu para mandar agora. Confira a internet e tente de novo. Se não der, use a versão do Google, no link logo abaixo.");
        })
        .then(function () { botao.disabled = false; botao.textContent = "Mandar a denúncia"; });
    });
    feito.querySelector("[data-outra]").addEventListener("click", function () {
      feito.hidden = true; den.hidden = false; inicio = Date.now();
      document.getElementById("d-assunto").focus();
    });
  }
})();
