(function () {
  'use strict';

  /* Same lead endpoint (Google Apps Script) the Developer Bazaar landing pages post to. */
  var FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzis9oo2TFGWIovpQg3eWnm6v6Wu1GuE0Tm-L1lw0dWMS60RCWfnAnGwgafRyhHfWRw/exec';
  var SUCCESS_MSG = "Thank you for your enquiry! We're excited to connect with you. Our team will be in touch within 24 hours.";
  var VALID_COUNTRIES = ['USA (+1)', 'Canada (+1)', 'Australia (+61)', 'UK (+44)', 'UAE (+971)'];
  var VALID_MODELS = ['Hourly Flutter Developer', 'Dedicated Flutter Developer', 'Not sure yet'];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clean = function (v) {
    return String(v || '').normalize('NFKC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  };

  /* ================= FAQ accordion ================= */
  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    var h = $('.fx-faq-head', item);
    if (h) h.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function toggleFaq(head) {
    var item = head.closest('.fx-faq-item');
    var willOpen = !item.classList.contains('is-open');
    $$('.fx-faq-item').forEach(function (i) { if (i !== item) setOpen(i, false); });
    setOpen(item, willOpen);
  }

  /* ================= Calendly popup (all CTA buttons) ================= */
  var pop = $('#calendlyPopup'), overlay = $('#calendlyOverlay'), closeBtn = $('#calendlyCloseBtn');
  var frame = $('#calendlyIframe'), spinner = $('#calendlySpinner'), lastFocus = null;
  function openCalendly() {
    if (!pop) return;
    lastFocus = document.activeElement;
    if (frame && !frame.getAttribute('src')) {
      var url = frame.getAttribute('data-src');
      url += (url.indexOf('?') > -1 ? '&' : '?') + 'embed_domain=' + encodeURIComponent(location.hostname || 'localhost') + '&embed_type=Inline';
      frame.onload = function () { if (spinner) spinner.classList.add('loaded'); };
      frame.setAttribute('src', url);
    }
    pop.classList.add('active');
    pop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fx-calendly-open');
    if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 80);
  }
  function closeCalendly() {
    if (!pop) return;
    pop.classList.remove('active');
    pop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('fx-calendly-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }
  window.openCalendlyModal = openCalendly;
  window.closeCalendlyModal = closeCalendly;
  if (closeBtn) closeBtn.addEventListener('click', closeCalendly);
  if (overlay) overlay.addEventListener('click', closeCalendly);

  /* ================= enquiry forms ================= */
  var cachedIP = null;
  function getIPLocation() {
    if (cachedIP) return Promise.resolve(cachedIP);
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 2500) : null;
    return fetch('https://ipwho.is/', { signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (timer) clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (d && d.success) cachedIP = { callingCode: String(d.calling_code || '').replace('+', '').trim(), cc: (d.country_code || '').toUpperCase(), country: (d.country || '').toLowerCase() };
        return cachedIP || {};
      }).catch(function () { return {}; });
  }
  function autoDetectCountry() {
    var selects = $$('select[name="country"]');
    if (!selects.length) return;
    var touched = false, DEFAULT = 'USA (+1)';
    var map = { US: 'USA (+1)', CA: 'Canada (+1)', AU: 'Australia (+61)', GB: 'UK (+44)', UK: 'UK (+44)', AE: 'UAE (+971)' };
    selects.forEach(function (s) { s.addEventListener('change', function (e) { if (e.isTrusted) touched = true; }); });
    function apply(v) {
      if (touched || !v) return;
      selects.forEach(function (s) {
        var o = Array.prototype.find.call(s.options, function (x) { return x.value === v; });
        if (o) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    }
    apply(DEFAULT);
    try {
      var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
      var lang = (navigator.language || '').toUpperCase(), c = null;
      if (tz.indexOf('australia') > -1 || /-AU$/.test(lang)) c = 'AU';
      else if (tz === 'europe/london' || /-(GB|UK)$/.test(lang)) c = 'GB';
      else if (tz === 'asia/dubai' || /-AE$/.test(lang)) c = 'AE';
      else if (tz.indexOf('canada') > -1 || ['america/toronto', 'america/vancouver', 'america/montreal', 'america/edmonton', 'america/winnipeg', 'america/halifax'].indexOf(tz) > -1 || /-CA$/.test(lang)) c = 'CA';
      else if (tz.indexOf('america/') === 0 || /-US$/.test(lang)) c = 'US';
      if (c && map[c]) apply(map[c]);
    } catch (e) { /* ignore */ }
    getIPLocation().then(function (d) {
      var p = d.callingCode === '61' || d.cc === 'AU' ? 'Australia (+61)'
        : d.callingCode === '44' || d.cc === 'GB' || d.cc === 'UK' ? 'UK (+44)'
        : d.callingCode === '971' || d.cc === 'AE' ? 'UAE (+971)'
        : d.callingCode === '1' || d.cc === 'US' || d.cc === 'CA' ? (d.cc === 'CA' || (d.country || '').indexOf('canada') > -1 ? 'Canada (+1)' : 'USA (+1)')
        : DEFAULT;
      apply(p);
    });
  }

  function setMsg(form, text, type, ms) {
    var m = $('.fx-msg', form);
    if (!m) return;
    clearTimeout(m._fade); clearTimeout(m._rm);
    m.className = 'fx-msg' + (type ? ' is-' + type : '');
    m.textContent = text || '';
    if (type === 'success' && ms) {
      m._fade = setTimeout(function () { m.classList.add('is-fading-out'); }, ms - 350);
      m._rm = setTimeout(function () { m.className = 'fx-msg'; m.textContent = ''; }, ms);
    }
  }
  function validate(form) {
    var f = form.elements;
    function bad(el, msg) { var b = el.closest('[data-fx-field]') || el.parentElement; b.classList.add('fx-invalid'); return { el: el, msg: msg }; }
    $$('.fx-invalid', form).forEach(function (e) { e.classList.remove('fx-invalid'); });
    var name = clean(f.name.value);
    if (!name) return bad(f.name, 'Please enter your full name.');
    if (name.length < 2 || name.length > 80 || !/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(name)) return bad(f.name, 'Please enter a valid name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) return bad(f.email, 'Please enter a valid email address.');
    if (VALID_COUNTRIES.indexOf(f.country.value) < 0) return bad(f.country, 'Please select a valid country.');
    var ph = f.phone.value.trim(), digits = ph.replace(/\D/g, '');
    if (!ph || !/^[0-9+\-\s()]+$/.test(ph) || digits.length < 7 || digits.length > 15) return bad(f.phone, 'Please enter a valid phone number.');
    if (VALID_MODELS.indexOf(f.hiring_model.value) < 0) return bad(f.hiring_model, 'Please select a hiring model.');
    if (clean(f.message.value).length > 2000) return bad(f.message, 'Your message is too long.');
    return null;
  }
  function submit(form) {
    if (form.dataset.submitting === 'true') return;
    var f = form.elements;
    if (f.website && f.website.value.trim() !== '') return; // honeypot
    var problem = validate(form);
    if (problem) { setMsg(form, problem.msg, 'error'); try { problem.el.focus(); } catch (e) {} return; }
    f.page_url.value = location.href; f.page_title.value = document.title;
    f.name.value = clean(f.name.value); f.phone.value = f.phone.value.trim(); f.message.value = clean(f.message.value);

    var btn = $('[data-fx-submit]', form), label = $('span', btn), old = label.textContent;
    form.dataset.submitting = 'true'; btn.classList.add('is-submitting'); btn.setAttribute('aria-disabled', 'true');
    label.textContent = 'Submitting..'; setMsg(form, '');

    var params = new URLSearchParams();
    new FormData(form).forEach(function (v, k) { params.append(k, v); });
    params.set('form_name', form.id === 'heroForm' ? 'Flutter Hire - Hero Form' : 'Flutter Hire - Bottom Form');
    var code = String(f.country.value || '').match(/\+\d+/);
    params.set('country', code ? code[0] : f.country.value);
    params.set('message', 'Hiring model: ' + f.hiring_model.value + (f.message.value ? '\n' + f.message.value : ''));

    fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: params.toString() })
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        var data; try { data = JSON.parse(txt); } catch (e) { throw new Error('Invalid server response.'); }
        if (!data.success) throw new Error(data.message || 'Submission failed.');
        form.reset(); resetUI(form);
        setMsg(form, SUCCESS_MSG, 'success', 10000);
        var clear = function () { setMsg(form, ''); form.removeEventListener('input', clear); };
        form.addEventListener('input', clear, { once: true });
      })
      .catch(function (e) { setMsg(form, e.message || 'Something went wrong. Please try again.', 'error'); })
      .then(function () {
        form.dataset.submitting = 'false'; btn.classList.remove('is-submitting'); btn.removeAttribute('aria-disabled'); label.textContent = old;
      });
  }
  function resetUI(form) {
    $$('.fx-consent', form).forEach(function (c) { c.classList.remove('is-checked'); });
    $$('[data-fx-select]', form).forEach(syncSelect);
    $$('[data-fx-dd]', form).forEach(function (dd) {
      var l = $('.fx-select-label', dd); l.textContent = 'Hiring Model*'; l.classList.remove('has-value');
      $$('.fx-option', dd).forEach(function (o) { o.classList.remove('is-selected'); });
      dd.classList.remove('is-open'); dd.setAttribute('aria-expanded', 'false');
    });
    autoDetectCountryOnce();
  }
  var autoDetectCountryOnce = function () {};
  function syncSelect(box) {
    var sel = $('select', box), lab = $('.fx-select-label', box);
    if (sel && lab) { var o = sel.options[sel.selectedIndex]; lab.textContent = o ? o.text : ''; lab.classList.add('has-value'); }
  }

  /* custom "Hiring Model" dropdown (same look/behaviour as the original budget dropdown) */
  function closeDropdowns(except) {
    $$('[data-fx-dd].is-open').forEach(function (d) { if (d !== except) { d.classList.remove('is-open'); d.setAttribute('aria-expanded', 'false'); } });
  }
  function initDropdown(dd) {
    var sel = $('select', dd), lab = $('.fx-select-label', dd), opts = $$('.fx-option', dd);
    dd.setAttribute('data-fx-field', '1');
    function toggle(open) { dd.classList.toggle('is-open', open); dd.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    dd.addEventListener('click', function (e) {
      if (e.target.closest('.fx-option')) return;
      e.stopPropagation(); closeDropdowns(dd); toggle(!dd.classList.contains('is-open'));
    });
    opts.forEach(function (o) {
      o.addEventListener('click', function (e) {
        e.stopPropagation();
        sel.value = o.getAttribute('data-value');
        sel.dispatchEvent(new Event('change', { bubbles: true })); sel.dispatchEvent(new Event('input', { bubbles: true }));
        lab.textContent = o.textContent.trim(); lab.classList.add('has-value');
        opts.forEach(function (x) { x.classList.remove('is-selected'); }); o.classList.add('is-selected');
        dd.classList.remove('fx-invalid'); toggle(false); dd.focus();
      });
    });
    dd.addEventListener('keydown', function (e) {
      if (e.target !== dd) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); toggle(true); }
      else if (e.key === 'Escape') toggle(false);
    });
  }

  /* ================= wiring ================= */
  document.addEventListener('click', function (e) {
    var h = e.target.closest('.fx-faq-head'); if (h) { toggleFaq(h); return; }
    var s = e.target.closest('[data-fx-submit]'); if (s) { submit(s.closest('form')); return; }
    var c = e.target.closest('[data-fx-cta]'); if (c) { e.preventDefault(); openCalendly(); return; }
    if (!e.target.closest('[data-fx-dd]')) closeDropdowns();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (pop && pop.classList.contains('active')) closeCalendly(); closeDropdowns(); return; }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest('.fx-faq-head, [data-fx-submit], [data-fx-cta]');
    if (t && t === e.target) { e.preventDefault(); t.click(); }
  });

  $$('.fx-form').forEach(function (form) {
    $$('.name-input,.email-input,.phone-input,.requirements-input,.country-code,[class*="input-name"],[class*="input-email"],[class*="input-phone"],[class*="input-budget"]', form)
      .forEach(function (b) { b.setAttribute('data-fx-field', '1'); });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(form); });
    form.addEventListener('input', function (e) {
      var b = e.target.closest('.fx-invalid'); if (b) b.classList.remove('fx-invalid');
      var m = $('.fx-msg', form); if (m && m.classList.contains('is-error')) setMsg(form, '');
    });
    $('input[name="phone"]', form).addEventListener('input', function () {
      var v = this.value.replace(/[^0-9+\-\s()]/g, ''), d = v.replace(/\D/g, '');
      this.value = d.length > 15 ? v.slice(0, 15) : v;
    });
    $$('.fx-consent', form).forEach(function (row) {
      var cb = $('.fx-check', row);
      cb.addEventListener('change', function () { row.classList.toggle('is-checked', cb.checked); });
    });
  });
  $$('[data-fx-select]').forEach(function (box) {
    var sel = $('select', box);
    sel.addEventListener('change', function () { syncSelect(box); });
    syncSelect(box);
  });
  $$('[data-fx-dd]').forEach(initDropdown);
  autoDetectCountryOnce = autoDetectCountry;
  autoDetectCountry();
})();
