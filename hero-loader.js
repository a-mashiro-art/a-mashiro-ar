document.addEventListener('DOMContentLoaded', function () {
  var slider = document.querySelector('.hero-slider[data-src]');
  if (!slider) return;

  var manifestUrl = slider.getAttribute('data-src');
  var folder = slider.getAttribute('data-folder') || '';

  fetch(manifestUrl)
    .then(function (res) { return res.json(); })
    .then(function (items) {
      items.forEach(function (item, i) {
        var slide = document.createElement('div');
        slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
        var img = document.createElement('img');
        img.src = folder + item.file;
        img.alt = item.title || '';
        slide.appendChild(img);
        slider.appendChild(slide);
      });
      setupControls();
    })
    .catch(function (err) {
      console.error('تعذّر تحميل صور الصفحة الرئيسية', err);
    });

  function setupControls() {
    var slides = slider.querySelectorAll('.hero-slide');
    if (!slides.length) return;

    var i = 0;
    var timer = null;

    function goTo(index) {
      slides[i].classList.remove('active');
      i = (index + slides.length) % slides.length;
      slides[i].classList.add('active');
    }

    function restartTimer() {
      if (timer) clearInterval(timer);
      if (slides.length < 2) return;
      timer = setInterval(function () { goTo(i + 1); }, 4500);
    }

    if (slides.length > 1) {
      var prevBtn = document.createElement('button');
      prevBtn.className = 'hero-nav hero-prev';
      prevBtn.setAttribute('aria-label', 'prev');
      var nextBtn = document.createElement('button');
      nextBtn.className = 'hero-nav hero-next';
      nextBtn.setAttribute('aria-label', 'next');

      prevBtn.addEventListener('click', function () {
        goTo(i - 1);
        restartTimer();
      });
      nextBtn.addEventListener('click', function () {
        goTo(i + 1);
        restartTimer();
      });

      slider.appendChild(prevBtn);
      slider.appendChild(nextBtn);
    }

    restartTimer();
  }
});
