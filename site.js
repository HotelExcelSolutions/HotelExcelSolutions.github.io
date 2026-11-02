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

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
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
