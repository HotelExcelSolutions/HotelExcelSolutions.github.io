/* Hotel Excel Solutions: pricing page (billing toggle, property count, estimate, plan request form) */
(function () {
  'use strict';

  // Prices per property, in US dollars. Annual is the yearly price (12 months less the saving).
  var PLANS = {
    standalone: { name: 'Income Journal', full: 'Income Journal (Standalone)', monthly: 199, annual: 2148, gated: false, cta: 'Get Started', interest: 'Income Journal Standalone plan' },
    bronze: { name: 'Bronze', full: 'Bronze (Essential)', monthly: 399, annual: 4308, gated: true, cta: 'Schedule Demo & Get Access', interest: 'Bronze plan (Essential)' },
    silver: { name: 'Silver', full: 'Silver (Professional)', monthly: 699, annual: 7548, gated: true, cta: 'Schedule Demo & Get Access', interest: 'Silver plan (Professional)' },
    gold: { name: 'Gold', full: 'Gold (Enterprise)', monthly: 999, annual: 10788, gated: true, cta: 'Contact Sales', interest: 'Gold plan (Enterprise)' }
  };
  var MIGRATION = { low: 1500, high: 3000 };
  var MAX_PROPS = 500;

  var state = { billing: 'monthly', props: 1, plan: 'silver', migration: false };
  try {
    var saved = JSON.parse(localStorage.getItem('hes-pricing') || 'null');
    if (saved && (saved.billing === 'monthly' || saved.billing === 'annual')) state.billing = saved.billing;
  } catch (e) { /* storage blocked: keep the defaults */ }

  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function plural(n) { return n + (n === 1 ? ' property' : ' properties'); }
  function saving(p) { return p.monthly * 12 - p.annual; }
  function $(id) { return document.getElementById(id); }

  var countBox = $('propCount');

  function render() {
    // billing toggle
    var segs = document.querySelectorAll('[data-billing]');
    for (var i = 0; i < segs.length; i++) segs[i].setAttribute('aria-pressed', segs[i].getAttribute('data-billing') === state.billing ? 'true' : 'false');
    var annual = state.billing === 'annual';

    // plan cards
    var cards = document.querySelectorAll('[data-plan-card]');
    for (var c = 0; c < cards.length; c++) {
      var key = cards[c].getAttribute('data-plan-card'), p = PLANS[key];
      cards[c].querySelector('[data-amt]').textContent = money(annual ? p.annual : p.monthly);
      cards[c].querySelector('[data-per]').textContent = annual ? '/ year per property' : '/ month per property';
      cards[c].querySelector('[data-sub]').textContent = annual
        ? 'Saves ' + money(saving(p)) + ' a year per property'
        : 'or ' + money(p.annual) + ' a year when billed annually';
      var total = cards[c].querySelector('[data-total]');
      total.textContent = state.props > 1
        ? plural(state.props) + ': ' + money((annual ? p.annual : p.monthly) * state.props) + (annual ? ' a year' : ' a month')
        : '';
      cards[c].classList.toggle('picked', key === state.plan);
    }

    // estimate
    var plan = PLANS[state.plan];
    var radios = document.querySelectorAll('input[name="estPlan"]');
    for (var r = 0; r < radios.length; r++) radios[r].checked = radios[r].value === state.plan;
    var mig = $('addMigration');
    mig.disabled = !plan.gated;
    if (!plan.gated) mig.checked = false;
    state.migration = mig.checked;
    $('addonNote').hidden = plan.gated;

    $('estLabel').textContent = plan.name + ', ' + plural(state.props) + ', billed ' + (annual ? 'annually' : 'monthly');
    $('estRecurring').textContent = money((annual ? plan.annual : plan.monthly) * state.props) + (annual ? ' / year' : ' / month');
    $('estOneTimeRow').hidden = !state.migration;
    $('estOneTime').textContent = money(MIGRATION.low * state.props) + ' to ' + money(MIGRATION.high * state.props);
    var save = $('estSave');
    save.hidden = !annual;
    save.textContent = annual ? 'Annual billing saves ' + money(saving(plan) * state.props) + ' a year.' : '';
    var cta = $('estCta');
    cta.textContent = plan.cta;
    cta.setAttribute('data-plan', state.plan);
    cta.setAttribute('data-interest', plan.interest);
    cta.className = 'btn btn-primary btn-block';
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

  document.addEventListener('change', function (e) {
    if (e.target.name === 'estPlan') { state.plan = e.target.value; render(); }
    else if (e.target.id === 'addMigration') { state.migration = e.target.checked; render(); }
  });

  // The request form: site.js opens it; this sets its heading and the plan details sent with it.
  var title = $('quoteTitle');
  var intro = title ? title.parentNode.querySelector('p') : null;
  var DEFAULT_TITLE = title ? title.textContent : '';
  var DEFAULT_INTRO = intro ? intro.textContent : '';
  var demoField = $('demoField');
  var demoBox = $('f-demo');

  function hidden(name, value) {
    var el = document.querySelector('#quoteForm input[type="hidden"][name="' + name + '"]');
    if (el) el.value = value;
  }

  function fillRequest(key) {
    var p = key ? PLANS[key] : null;
    var annual = state.billing === 'annual';
    if (!p) {
      if (title) title.textContent = DEFAULT_TITLE;
      if (intro) intro.textContent = DEFAULT_INTRO;
      ['plan', 'billing', 'properties', 'estimate', 'migration'].forEach(function (n) { hidden(n, ''); });
      demoField.hidden = true; demoBox.disabled = true;
      return;
    }
    if (key === 'standalone') {
      title.textContent = 'Get started with the Income Journal';
      intro.textContent = 'Tell us about your property and your PMS and POS. We set up your hotel and invite your team.';
    } else if (key === 'gold') {
      title.textContent = 'Contact sales about Gold';
      intro.textContent = 'Tell us about your properties and how they are grouped. We will set up a call and a quote.';
    } else {
      title.textContent = 'Schedule a demo of ' + p.name;
      intro.textContent = 'We will walk you through the plan with sample data, then set up access for your team.';
    }
    var withMig = state.migration && key === state.plan && p.gated;
    hidden('plan', p.full);
    hidden('billing', annual ? 'Annual' : 'Monthly');
    hidden('properties', String(state.props));
    hidden('estimate', money((annual ? p.annual : p.monthly) * state.props) + (annual ? ' a year' : ' a month'));
    hidden('migration', withMig ? 'Yes, ' + money(MIGRATION.low * state.props) + ' to ' + money(MIGRATION.high * state.props) + ' one-time' : 'No');
    var showDemo = p.gated;
    demoField.hidden = !showDemo; demoBox.disabled = !showDemo;
  }

  // Before a visitor clicks anything, the form is the general one.
  fillRequest(null);
  countBox.value = String(state.props);
  render();
})();
