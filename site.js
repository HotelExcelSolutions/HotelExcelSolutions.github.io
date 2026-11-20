/* Hotel Excel Solutions: menu, quote dialog and quote form */
(function () {
  'use strict';
  var dlg = document.getElementById('quote');
  var form = document.getElementById('quoteForm');
  var sent = document.getElementById('quoteSent');
  var msg = document.getElementById('formMsg');
  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');
  var lastFocus = null;
  var bar = document.querySelector('.mobile-cta');
  if (bar) {
    var onScroll = function () { bar.classList.toggle('show', window.scrollY > 520); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function closeMenu() {
    if (!nav) return;
    nav.classList.remove('open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  function resetForm() {
    form.hidden = false;
    sent.hidden = true;
    msg.hidden = true;
    msg.textContent = '';
  }

  function openQuote(interest) {
    if (!dlg) return;
    lastFocus = document.activeElement;
    resetForm();
    var sel = document.getElementById('f-interest');
    if (sel) {
      sel.value = '';
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === interest) { sel.value = interest; break; }
      }
    }
    closeMenu();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }

  function closeQuote() {
    if (!dlg) return;
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open-quote]');
    if (opener) { e.preventDefault(); openQuote(opener.getAttribute('data-interest')); return; }
    if (e.target.closest('[data-close-quote]')) { closeQuote(); return; }
    if (dlg && e.target === dlg) { closeQuote(); return; }
    if (nav && e.target.closest('#nav a')) closeMenu();
  });

  // A link from the live demo (?interest=Bank%20Reconciliations#quote) opens the form on that topic, then tidies the address.
  if (location.hash === '#quote' || /[?&]interest=/.test(location.search)) {
    var m = /[?&]interest=([^&#]*)/.exec(location.search), interest = '';
    try { interest = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : ''; } catch (err) { interest = ''; }
    openQuote(interest);
    // keep any other parameters (campaign tags such as utm_source): only interest and #quote are removed
    var rest = location.search.replace(/^\?/, '').split('&').filter(function (p) { return p && !/^interest=/.test(p); }).join('&');
    if (window.history && history.replaceState) history.replaceState(null, '', location.pathname + (rest ? '?' + rest : ''));
  }

  if (menuBtn && nav) {
    var toggleMenu = function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      // the menu comes before its button in the page, so Tab would skip it: move to its first link
      if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
    };
    menuBtn.addEventListener('click', toggleMenu);
    // Enter and Space open it from the keyboard (handled here so the key never toggles it twice)
    menuBtn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); } });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !(nav.classList.contains('open') || nav.contains(document.activeElement))) return;
      closeMenu(); menuBtn.focus();
    });
    // Tab past the last link (or Shift+Tab before the first) closes the menu and goes back to its button
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !nav.classList.contains('open')) return;
      var links = nav.querySelectorAll('a'), first = links[0], last = links[links.length - 1];
      if ((!e.shiftKey && document.activeElement === last) || (e.shiftKey && document.activeElement === first)) { e.preventDefault(); closeMenu(); menuBtn.focus(); }
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending\u2026';
      msg.hidden = true;
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.subject = 'New quote request from ' + (data.property || 'the website');
      data.from_name = 'Hotel Excel Solutions website';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.success) { form.hidden = true; sent.hidden = false; form.reset(); }
          else throw new Error('not sent');
        })
        .catch(function () {
          msg.hidden = false;
          msg.className = 'form-msg bad';
          msg.textContent = 'Sorry, that did not go through. Please try again in a moment.';
        })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  }
})();
