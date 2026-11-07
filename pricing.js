/* Hotel Excel Solutions: pricing page (Income Journal price by billing and property count; plan request form).
   Only the Income Journal's price is public. Bronze, Silver and Gold are quoted by sales, so their prices are not in this file. */
(function () {
  'use strict';

  var IJ = { monthly: 199, annual: 2148 };  // per property; annual = 12 months less $240
  var PLANS = {
    standalone: { name: 'Income Journal', full: 'Income Journal (Standalone)' },
    bronze: { name: 'Bronze', full: 'Bronze (Essential)' },
    silver: { name: 'Silver', full: 'Silver (Professional)' },
    gold: { name: 'Gold', full: 'Gold (Enterprise)' }
  };
  var MAX_PROPS = 500;

  var state = { billing: 'monthly', props: 1 };
  try {
    var saved = JSON.parse(localStorage.getItem('hes-pricing') || 'null');
    if (saved && (saved.billing === 'monthly' || saved.billing === 'annual')) state.billing = saved.billing;
  } catch (e) { /* storage blocked: keep the defaults */ }

  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function plural(n) { return n + (n === 1 ? ' property' : ' properties'); }
  function $(id) { return document.getElementById(id); }
  var countBox = $('propCount');

  function render() {
    var segs = document.querySelectorAll('[data-billing]');
    for (var i = 0; i < segs.length; i++) segs[i].setAttribute('aria-pressed', segs[i].getAttribute('data-billing') === state.billing ? 'true' : 'false');
    var annual = state.billing === 'annual';
    var card = document.querySelector('[data-plan-card="standalone"]');
    if (!card) return;
    card.querySelector('[data-amt]').textContent = money(annual ? IJ.annual : IJ.monthly);
    card.querySelector('[data-per]').textContent = annual ? '/ year per property' : '/ month per property';
    card.querySelector('[data-sub]').textContent = annual
      ? 'Saves ' + money(IJ.monthly * 12 - IJ.annual) + ' a year per property'
      : 'or ' + money(IJ.annual) + ' a year when billed annually';
    card.querySelector('[data-total]').textContent = state.props > 1
      ? plural(state.props) + ': ' + money((annual ? IJ.annual : IJ.monthly) * state.props) + (annual ? ' a year' : ' a month')
      : '';
  }

  function setProps(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1) n = 1;
    if (n > MAX_PROPS) n = MAX_PROPS;
    state.props = n;
    countBox.value = String(n);
    render();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-billing]');
    if (b) {
      state.billing = b.getAttribute('data-billing');
      try { localStorage.setItem('hes-pricing', JSON.stringify({ billing: state.billing })); } catch (err) { /* ignore */ }
      render();
      return;
    }
    var s = e.target.closest('[data-step]');
    if (s) { setProps(state.props + parseInt(s.getAttribute('data-step'), 10)); return; }
    var opener = e.target.closest('[data-open-quote]');
    if (opener) fillRequest(opener.getAttribute('data-plan'));
  });
  countBox.addEventListener('input', function () {
    var n = parseInt(countBox.value, 10);
    if (isFinite(n) && n >= 1 && n <= MAX_PROPS) { state.props = n; render(); }
  });
  countBox.addEventListener('change', function () { setProps(countBox.value); });

  // The request form: site.js opens it; this sets its heading and the plan details sent with it.
  var title = $('quoteTitle');
  var intro = title ? title.parentNode.querySelector('p') : null;
  var DEFAULT_TITLE = title ? title.textContent : '';
  var DEFAULT_INTRO = intro ? intro.textContent : '';
  var demoField = $('demoField'), demoBox = $('f-demo');

  function hidden(name, value) {
    var el = document.querySelector('#quoteForm input[type="hidden"][name="' + name + '"]');
    if (el) el.value = value;
  }

  function fillRequest(key) {
    var p = key ? PLANS[key] : null;
    var annual = state.billing === 'annual';
    if (!p) {
      title.textContent = DEFAULT_TITLE; intro.textContent = DEFAULT_INTRO;
      ['plan', 'billing', 'properties', 'estimate'].forEach(function (n) { hidden(n, ''); });
      demoField.hidden = true; demoBox.disabled = true;
      return;
    }
    hidden('plan', p.full);
    hidden('properties', String(state.props));
    if (key === 'standalone') {
      title.textContent = 'Get started with the Income Journal';
      intro.textContent = 'Tell us about your property and your PMS and POS. We set up your hotel and invite your team.';
      hidden('billing', annual ? 'Annual' : 'Monthly');
      hidden('estimate', money((annual ? IJ.annual : IJ.monthly) * state.props) + (annual ? ' a year' : ' a month'));
      demoField.hidden = true; demoBox.disabled = true;
    } else {
      title.textContent = 'Contact sales about ' + p.name;
      intro.textContent = 'Tell us about your properties and what your team does by hand today. We will set up a demo and send you pricing.';
      hidden('billing', ''); hidden('estimate', '');
      demoField.hidden = false; demoBox.disabled = false;
    }
  }

  fillRequest(null);
  countBox.value = String(state.props);
  render();
})();
