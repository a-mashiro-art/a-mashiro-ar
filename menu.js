document.addEventListener('DOMContentLoaded', function () {
  var nav = document.querySelector('header nav.mainnav');
  var header = document.querySelector('header');
  if (!nav || !header) return;

  var overlay = document.createElement('div');
  overlay.className = 'mobile-menu-overlay';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'mobile-menu-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'close menu');
  overlay.appendChild(closeBtn);

  var list = document.createElement('div');
  list.className = 'mobile-menu-list';

  nav.querySelectorAll(':scope > div').forEach(function (group) {
    var mainLink = group.querySelector(':scope > a');
    if (mainLink) list.appendChild(mainLink.cloneNode(true));

    var dropdown = group.querySelector(':scope > .dropdown');
    if (dropdown) {
      dropdown.querySelectorAll('a').forEach(function (a) {
        var clone = a.cloneNode(true);
        clone.classList.add('sub-item');
        list.appendChild(clone);
      });
    }
  });

  overlay.appendChild(list);
  document.body.appendChild(overlay);

  var hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.setAttribute('aria-label', 'open menu');
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  header.appendChild(hamburger);

  hamburger.addEventListener('click', function () {
    overlay.classList.add('open');
  });
  closeBtn.addEventListener('click', function () {
    overlay.classList.remove('open');
  });
  list.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      overlay.classList.remove('open');
    });
  });
});
