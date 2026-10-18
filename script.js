(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* section entrance */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (n) { io.observe(n); });
  } else { rv.forEach(function (n) { n.classList.add('in'); }); }

  /* date chips highlight */
  var chips = $$('.chip');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on');
    });
  });

  /* clipboard */
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (ok, no) {
      var a = document.createElement('textarea');
      a.value = t; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(a); a.select();
      try { document.execCommand('copy') ? ok() : no(); } catch (e) { no(e); }
      document.body.removeChild(a);
    });
  }
  function flash(btn, label) {
    var s = $('span', btn), old = s.textContent;
    s.textContent = label; btn.classList.add('done');
    setTimeout(function () { s.textContent = old; btn.classList.remove('done'); }, 2000);
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      copyText(b.getAttribute('data-copy')).then(function () { flash(b, 'पता कॉपी हो गया ✓'); },
        function () { flash(b, 'कॉपी नहीं हो सका'); });
    });
  });

  /* share */
  var share = $('#share'), toast = $('#toast');
  share.addEventListener('click', function () {
    var data = { title: 'अर्पित संग सिमरन — शुभ विवाह', text: 'शुभ विवाह का सादर आमंत्रण', url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    copyText(location.href).then(function () {
      flash(share, 'लिंक कॉपी हो गया ✓'); toast.textContent = 'निमंत्रण का लिंक कॉपी हो गया है।';
      setTimeout(function () { toast.textContent = ''; }, 2500);
    }, function () { toast.textContent = 'कृपया ब्राउज़र के पते से लिंक कॉपी करें।'; });
  });

  /* contact sheet */
  var sheet = $('#sheet'), back = $('#backdrop'), opener = $('#open-contact'), last;
  function open(e) {
    if (e) e.preventDefault();
    last = document.activeElement;
    sheet.hidden = back.hidden = false;
    requestAnimationFrame(function () { sheet.classList.add('open'); back.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    $('#close-sheet').focus();
  }
  function close() {
    sheet.classList.remove('open'); back.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { sheet.hidden = back.hidden = true; }, 300);
    if (last) last.focus();
  }
  opener.addEventListener('click', open);
  $('#close-sheet').addEventListener('click', close);
  back.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (sheet.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      var f = $$('a,button', sheet), a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
})();
