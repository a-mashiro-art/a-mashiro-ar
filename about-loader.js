document.addEventListener('DOMContentLoaded', function () {
  var box = document.querySelector('.about-photo[data-src]');
  if (!box) return;

  var manifestUrl = box.getAttribute('data-src');
  var folder = box.getAttribute('data-folder') || '';

  fetch(manifestUrl)
    .then(function (res) { return res.json(); })
    .then(function (items) {
      if (!items.length) return;
      var img = document.createElement('img');
      img.src = folder + encodeURIComponent(items[0].file);
      img.alt = items[0].title || 'A-Mashiro';
      box.appendChild(img);
    })
    .catch(function (err) {
      console.error('تعذّر تحميل صورة الفنان', err);
    });
});
