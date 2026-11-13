/* Vigia Cariacica: o pouco de script do site. Tudo funciona sem ele, menos ouvir, letra maior e a busca. */
(function () {
  "use strict";
  var raiz = document.documentElement;

  /* letra maior, lembrada neste aparelho */
  var bLetra = document.getElementById("b-letra");
  function letra(on) {
    raiz.classList.toggle("letra-maior", on);
    if (bLetra) bLetra.setAttribute("aria-pressed", on ? "true" : "false");
  }
  try { letra(localStorage.getItem("vigia-letra") === "1"); } catch (e) {}
  if (bLetra) bLetra.addEventListener("click", function () {
    var on = bLetra.getAttribute("aria-pressed") !== "true";
    letra(on);
    try { localStorage.setItem("vigia-letra", on ? "1" : "0"); } catch (e) {}
  });

  /* ouvir a página com a voz do próprio celular (não gasta dados) */
  var bOuvir = document.getElementById("b-ouvir");
  var temFala = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  if (bOuvir && !temFala) bOuvir.hidden = true;
  function parar() {
    if (temFala) speechSynthesis.cancel();
    if (bOuvir) { bOuvir.setAttribute("aria-pressed", "false"); bOuvir.textContent = "Ouvir esta página"; }
  }
  if (bOuvir && temFala) bOuvir.addEventListener("click", function () {
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
    bOuvir.setAttribute("aria-pressed", "true"); bOuvir.textContent = "Parar de ouvir";
  });

  /* relógios do prazo de resposta */
  var agora = new Date(Date.now() - 3 * 3600 * 1000);
  var hoje = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());
  function dia(iso) { var p = iso.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function ddmm(iso) { return iso.slice(8, 10) + "/" + iso.slice(5, 7); }
  document.querySelectorAll(".relogio[data-prazo]").forEach(function (el) {
    if (el.dataset.respondido) { el.textContent = "Respondida em " + el.dataset.respondido; return; }
    var p = el.dataset.prazo, n = Math.round((dia(p) - hoje) / 86400000);
    if (n > 1) el.textContent = "Prazo: " + ddmm(p) + " · faltam " + n + " dias";
    else if (n === 1) el.textContent = "Prazo: amanhã, " + ddmm(p);
    else if (n === 0) el.textContent = "Prazo: hoje, " + ddmm(p);
    else { el.textContent = "Atrasada há " + (-n) + (n === -1 ? " dia" : " dias"); el.classList.add("vencido"); }
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
})();
