function initLightbox() {
  var galleries = document.querySelectorAll('.gallery');
  if (!galleries.length) return;
  if (document.querySelector('.lb-overlay')) return; // already initialized

  var overlay = document.createElement('div');
  overlay.className = 'lb-overlay';
  overlay.innerHTML =
    '<button class="lb-close" aria-label="close">&times;</button>' +
    '<button class="lb-nav lb-prev" aria-label="prev"></button>' +
    '<div class="lb-body"><img src="" alt=""><div class="lb-caption"></div></div>' +
    '<button class="lb-nav lb-next" aria-label="next"></button>';
  document.body.appendChild(overlay);

  var imgEl = overlay.querySelector('.lb-body img');
  var capEl = overlay.querySelector('.lb-caption');
  var btnClose = overlay.querySelector('.lb-close');
  var btnPrev = overlay.querySelector('.lb-prev');
  var btnNext = overlay.querySelector('.lb-next');

  var items = [];
  var current = 0;

  galleries.forEach(function (gal) {
    gal.querySelectorAll('img').forEach(function (img) {
      var wrapper = document.createElement('div');
      wrapper.className = 'gallery-item';
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);

      var title = img.getAttribute('data-title') || img.alt || '';
      var year = img.getAttribute('data-year') || '';

      if (title || year) {
        var ov = document.createElement('div');
        ov.className = 'ov';
        ov.innerHTML =
          (title ? '<span class="ov-title">' + title + '</span>' : '') +
          (year ? '<span class="ov-year">' + year + '</span>' : '');
        wrapper.appendChild(ov);
      }

      var index = items.length;
      items.push({ src: img.src, title: title, year: year });
      wrapper.addEventListener('click', function () {
        current = index;
        show();
        overlay.classList.add('open');
      });
    });
  });

  function show() {
    imgEl.classList.remove('show');
    capEl.classList.remove('show');
    setTimeout(function () {
      var it = items[current];
      imgEl.src = it.src;
      capEl.textContent = [it.title, it.year].filter(Boolean).join('، ');
      imgEl.classList.add('show');
      capEl.classList.add('show');
    }, 120);
    btnPrev.style.display = items.length > 1 ? '' : 'none';
    btnNext.style.display = items.length > 1 ? '' : 'none';
  }

  function close() {
    overlay.classList.remove('open');
  }

  btnClose.addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  btnPrev.addEventListener('click', function () {
    current = (current + 1) % items.length;
    show();
  });
  btnNext.addEventListener('click', function () {
    current = (current - 1 + items.length) % items.length;
    show();
  });
  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') btnPrev.click();
    if (e.key === 'ArrowRight') btnNext.click();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // if there is no dynamic gallery-loader on this page, init immediately
  if (!document.querySelector('.gallery[data-src]')) {
    initLightbox();
  }
});
