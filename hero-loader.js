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
      startSlideshow();
    })
    .catch(function (err) {
      console.error('تعذّر تحميل صور الصفحة الرئيسية', err);
    });

  function startSlideshow() {
    var slides = slider.querySelectorAll('.hero-slide');
    if (slides.length < 2) return;
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove('active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('active');
    }, 4500);
  }
});
