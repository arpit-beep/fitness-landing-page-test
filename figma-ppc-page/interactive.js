(function () {
  'use strict';
  /* Set this to your own backend / form service URL to receive leads.
     Until it is set, submissions are accepted locally (nothing leaves the browser). */
  var FORM_ENDPOINT = '';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- FAQ accordion ---------- */
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

  /* ---------- CTA scrolling ---------- */
  function centerY(el) { var r = el.getBoundingClientRect(); return r.top + window.pageYOffset + r.height / 2; }
  function nearestForm(from) {
    var y = centerY(from), best = null, bd = Infinity;
    $$('.fx-form').forEach(function (f) {
      var d = Math.abs(centerY(f) - y);
      if (d < bd) { bd = d; best = f; }
    });
    return best;
  }
  function goToForm(from) {
    var form = nearestForm(from);
    if (!form) return;
    var card = form.parentElement;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var first = $('input[name="name"]', form);
    if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }, 450);
  }

  /* ---------- forms ---------- */
  function setMsg(form, text, type) {
    var m = $('.fx-msg', form);
    if (!m) return;
    m.className = 'fx-msg' + (type ? ' is-' + type : '');
    m.textContent = text || '';
  }
  function flag(el, bad) {
    var box = el.closest('.fx-consent') || el.parentElement;
    box.classList.toggle('fx-invalid', !!bad);
  }
  function validate(form) {
    var f = form.elements, bad = null;
    function fail(el, msg) { flag(el, true); if (!bad) { bad = { el: el, msg: msg }; } }
    $$('.fx-invalid', form).forEach(function (e) { e.classList.remove('fx-invalid'); });
    var name = f.name.value.replace(/\s+/g, ' ').trim();
    if (!name) fail(f.name, 'Please enter your full name.');
    else if (name.length < 2 || !/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(name)) fail(f.name, 'Please enter a valid name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) fail(f.email, 'Please enter a valid email address.');
    var digits = f.phone.value.replace(/\D/g, '');
    if (!/^[0-9+\-\s()]+$/.test(f.phone.value) || digits.length < 7 || digits.length > 15) fail(f.phone, 'Please enter a valid phone number.');
    if (!f.hiring_model.value) fail(f.hiring_model, 'Please select a hiring model.');
    if (!f.nda.checked) fail(f.nda, 'Please confirm the NDA checkbox to continue.');
    return bad;
  }
  function send(params) {
    if (!FORM_ENDPOINT) return new Promise(function (r) { setTimeout(function () { r({ success: true }); }, 600); });
    return fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: params.toString() })
      .then(function (r) { return r.json(); });
  }
  function submit(form) {
    if (form.dataset.submitting === 'true') return;
    var f = form.elements;
    if (f.website && f.website.value.trim() !== '') return; // honeypot
    var bad = validate(form);
    if (bad) { setMsg(form, bad.msg, 'error'); try { bad.el.focus(); } catch (e) {} return; }
    f.page_url.value = location.href; f.page_title.value = document.title;
    var btn = $('[data-fx-submit]', form), label = $('span', btn), old = label.textContent;
    form.dataset.submitting = 'true'; btn.classList.add('is-submitting'); label.textContent = 'Submitting..'; setMsg(form, '');
    var p = new URLSearchParams(new FormData(form));
    send(p).then(function (res) {
      if (!res || !res.success) throw new Error((res && res.message) || 'Submission failed.');
      form.reset();
      $$('.fx-consent', form).forEach(function (c) { c.classList.remove('is-checked'); });
      $$('.fx-select-label', form).forEach(function (l) { l.classList.remove('has-value'); });
      $$('[data-fx-select]', form).forEach(syncSelect);
      setMsg(form, "Thank you for your enquiry! We're excited to connect with you. Our team will be in touch within 24 hours.", 'success');
    }).catch(function (e) {
      setMsg(form, e.message || 'Something went wrong. Please try again.', 'error');
    }).then(function () {
      form.dataset.submitting = 'false'; btn.classList.remove('is-submitting'); label.textContent = old;
    });
  }
  function syncSelect(box) {
    var sel = $('select', box), lab = $('.fx-select-label', box);
    if (!sel || !lab) return;
    var opt = sel.options[sel.selectedIndex];
    lab.textContent = opt ? opt.text : '';
    lab.classList.toggle('has-value', !!sel.value);
  }

  /* ---------- wiring ---------- */
  document.addEventListener('click', function (e) {
    var h = e.target.closest('.fx-faq-head'); if (h) { toggleFaq(h); return; }
    var s = e.target.closest('[data-fx-submit]'); if (s) { submit(s.closest('form')); return; }
    var c = e.target.closest('[data-fx-cta]');
    if (c) {
      if (c.getAttribute('data-fx-cta') === 'plans') { var p = document.getElementById('pricing'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else goToForm(c);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest('.fx-faq-head, [data-fx-submit], [data-fx-cta]');
    if (t && t === e.target) { e.preventDefault(); t.click(); }
  });
  $$('.fx-form').forEach(function (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(form); });
    form.addEventListener('input', function (e) { var b = e.target.closest('.fx-invalid') || e.target.parentElement; if (b) b.classList.remove('fx-invalid'); var m = $('.fx-msg', form); if (m && m.classList.contains('is-error')) setMsg(form, ''); });
    $('input[name="phone"]', form).addEventListener('input', function () { this.value = this.value.replace(/[^0-9+\-\s()]/g, ''); });
    $$('.fx-consent', form).forEach(function (row) {
      var cb = $('.fx-check', row);
      cb.addEventListener('change', function () { row.classList.toggle('is-checked', cb.checked); row.classList.remove('fx-invalid'); });
    });
  });
  $$('[data-fx-select]').forEach(function (box) {
    var sel = $('select', box);
    sel.addEventListener('change', function () { syncSelect(box); box.classList.remove('fx-invalid'); });
    syncSelect(box);
  });
})();
