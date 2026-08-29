document.addEventListener('DOMContentLoaded', function () {
  var galleries = document.querySelectorAll('.gallery[data-src]');
  if (!galleries.length) return;

  var pending = galleries.length;

  galleries.forEach(function (gal) {
    var manifestUrl = gal.getAttribute('data-src');
    var folder = gal.getAttribute('data-folder') || '';

    fetch(manifestUrl)
      .then(function (res) { return res.json(); })
      .then(function (items) {
        items.forEach(function (item) {
          var img = document.createElement('img');
          img.src = folder + encodeURIComponent(item.file);
          img.alt = item.title || '';
          if (item.title) img.setAttribute('data-title', item.title);
          if (item.year) img.setAttribute('data-year', item.year);
          gal.appendChild(img);
        });
      })
      .catch(function (err) {
        console.error('تعذّر تحميل الأعمال من', manifestUrl, err);
      })
      .finally(function () {
        pending--;
        if (pending === 0 && typeof initLightbox === 'function') {
          initLightbox();
        }
      });
  });
});
