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

  /* fila: escolher o posto abre a página dele */
  var sel = document.getElementById("unidade");
  if (sel) sel.addEventListener("change", function () { location.href = sel.value; });

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
