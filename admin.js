(function () {
  'use strict';

  var SECTIONS = {
    home: { label: 'ホーム（スライドショー）', note: 'ここでの並び順がそのままスライドショーの表示順になります。' },
    about: { label: 'ABOUT（写真）', note: 'リストの一番上の画像だけがABOUTページの写真として使われます。' },
    works: { label: 'Selected Works', note: '' },
    s1121: { label: '11-21', note: '' },
    memories: { label: 'Memories Deep in The Heart', note: '' },
    primitives: { label: 'Primitives', note: '' },
    misalignment: { label: 'Misalignment', note: '' },
    window: { label: 'Window of Enlightenment', note: '' },
    dots2: { label: '2dots', note: '' },
    paintingover: { label: 'Painting Over', note: '' },
    ginga: { label: 'Ginga', note: '' },
    collaboration: { label: 'Collaboration', note: '' }
  };

  var cfg = loadConfig();
  var currentKey = null;
  var items = [];       // working list: {file, title, isNew, previewUrl, base64}
  var shaMap = {};       // filename -> sha (existing repo files)
  var manifestSha = null;

  // ---------- config ----------

  function loadConfig() {
    try {
      return JSON.parse(localStorage.getItem('amashiro_admin_cfg') || '{}');
    } catch (e) { return {}; }
  }

  function saveConfig(c) {
    localStorage.setItem('amashiro_admin_cfg', JSON.stringify(c));
  }

  function apiBase() {
    return 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/';
  }

  function authHeaders() {
    return {
      'Authorization': 'token ' + cfg.token,
      'Accept': 'application/vnd.github+json'
    };
  }

  function configReady() {
    return cfg.owner && cfg.repo && cfg.branch && cfg.token;
  }

  // ---------- utf8-safe base64 ----------

  function utf8ToBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = '';
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  // ---------- DOM refs ----------

  var settingsPanel = document.getElementById('settings-panel');
  var btnSettings = document.getElementById('btn-settings');
  var btnSaveSettings = document.getElementById('btn-save-settings');
  var btnForgetSettings = document.getElementById('btn-forget-settings');

  var noSectionEl = document.getElementById('no-section');
  var editorEl = document.getElementById('section-editor');
  var sectionTitleEl = document.getElementById('section-title');
  var cardListEl = document.getElementById('card-list');
  var dropzoneEl = document.getElementById('dropzone');
  var fileInputEl = document.getElementById('file-input');
  var btnSave = document.getElementById('btn-save');
  var statusEl = document.getElementById('status-msg');

  document.getElementById('cfg-owner').value = cfg.owner || '';
  document.getElementById('cfg-repo').value = cfg.repo || '';
  document.getElementById('cfg-branch').value = cfg.branch || 'main';
  document.getElementById('cfg-token').value = cfg.token || '';

  if (!configReady()) settingsPanel.classList.remove('hidden');

  btnSettings.addEventListener('click', function () {
    settingsPanel.classList.toggle('hidden');
  });

  btnSaveSettings.addEventListener('click', function () {
    cfg = {
      owner: document.getElementById('cfg-owner').value.trim(),
      repo: document.getElementById('cfg-repo').value.trim(),
      branch: document.getElementById('cfg-branch').value.trim() || 'main',
      token: document.getElementById('cfg-token').value.trim()
    };
    saveConfig(cfg);
    settingsPanel.classList.add('hidden');
  });

  btnForgetSettings.addEventListener('click', function () {
    localStorage.removeItem('amashiro_admin_cfg');
    cfg = {};
    document.getElementById('cfg-token').value = '';
    setStatus('このブラウザからトークンを削除しました。', 'ok');
  });

  // ---------- section nav ----------

  document.querySelectorAll('.sec-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!configReady()) {
        settingsPanel.classList.remove('hidden');
        setStatus('先にリポジトリの接続情報を入力してください。', 'err');
        return;
      }
      document.querySelectorAll('.sec-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      openSection(btn.getAttribute('data-key'));
    });
  });

  function setStatus(msg, kind) {
    statusEl.textContent = msg || '';
    statusEl.className = 'status-msg' + (kind ? ' ' + kind : '');
  }

  // ---------- load a section ----------

  function openSection(key) {
    currentKey = key;
    items = [];
    shaMap = {};
    manifestSha = null;
    setStatus('');
    noSectionEl.classList.add('hidden');
    editorEl.classList.remove('hidden');
    sectionTitleEl.textContent = SECTIONS[key].label;
    cardListEl.innerHTML = '<div class="hint">読み込み中…</div>';

    var manifestPath = 'data/' + key + '.json';
    var folderPath = 'images/' + key;

    Promise.all([
      fetchJson(manifestPath).catch(function () { return null; }),
      fetchDir(folderPath).catch(function () { return []; })
    ]).then(function (results) {
      var manifestResult = results[0];
      var dirList = results[1];

      dirList.forEach(function (f) { shaMap[f.name] = f.sha; });

      if (manifestResult) {
        manifestSha = manifestResult.sha;
        try {
          items = JSON.parse(manifestResult.text) || [];
        } catch (e) { items = []; }
        items.forEach(function (it) {
          it.previewUrl = rawUrl(folderPath + '/' + it.file);
        });
      } else {
        manifestSha = null;
        items = [];
      }
      renderCards();
    });
  }

  function rawUrl(path) {
    return 'https://raw.githubusercontent.com/' + cfg.owner + '/' + cfg.repo + '/' + cfg.branch + '/' + path + '?t=' + Date.now();
  }

  function fetchJson(path) {
    return fetch(apiBase() + path + '?ref=' + encodeURIComponent(cfg.branch), { headers: authHeaders() })
      .then(function (res) {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(function (data) {
        var text = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
        return { sha: data.sha, text: text };
      });
  }

  function fetchDir(path) {
    return fetch(apiBase() + path + '?ref=' + encodeURIComponent(cfg.branch), { headers: authHeaders() })
      .then(function (res) {
        if (!res.ok) return [];
        return res.json();
      })
      .then(function (data) { return Array.isArray(data) ? data : []; });
  }

  function fetchSha(path) {
    return fetch(apiBase() + path + '?ref=' + encodeURIComponent(cfg.branch), { headers: authHeaders() })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) { return data ? data.sha : null; })
      .catch(function () { return null; });
  }

  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Retries a request that needs a fresh "sha" right before sending it,
  // to work around GitHub's Contents API sometimes serving a stale sha.
  function withFreshSha(path, buildRequest, attemptsLeft) {
    return fetchSha(path).then(function (sha) {
      return fetch.apply(null, buildRequest(sha)).then(function (res) {
        if (res.status === 409 && attemptsLeft > 1) {
          return delay(1200).then(function () {
            return withFreshSha(path, buildRequest, attemptsLeft - 1);
          });
        }
        return checkOk(res);
      });
    });
  }

  // ---------- rendering ----------

  function renderCards() {
    cardListEl.innerHTML = '';
    items.forEach(function (item, idx) {
      var card = document.createElement('div');
      card.className = 'card';
      card.draggable = true;
      card.dataset.index = idx;

      var img = document.createElement('img');
      img.src = item.previewUrl;
      card.appendChild(img);

      if (item.isNew) {
        var badge = document.createElement('span');
        badge.className = 'badge-new';
        badge.textContent = '新規';
        card.appendChild(badge);
      }

      var delBtn = document.createElement('button');
      delBtn.className = 'btn-del';
      delBtn.innerHTML = '&times;';
      delBtn.title = '削除';
      delBtn.addEventListener('click', function () {
        items.splice(idx, 1);
        renderCards();
      });
      card.appendChild(delBtn);

      var body = document.createElement('div');
      body.className = 'card-body';

      var order = document.createElement('div');
      order.className = 'card-order';
      order.textContent = '#' + (idx + 1);
      body.appendChild(order);

      var titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.placeholder = 'タイトル（任意）';
      titleInput.value = item.title || '';
      titleInput.addEventListener('input', function () {
        item.title = titleInput.value;
      });
      body.appendChild(titleInput);

      card.appendChild(body);
      cardListEl.appendChild(card);

      card.addEventListener('dragstart', function () {
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', function () {
        card.classList.remove('dragging');
      });
    });
  }

  cardListEl.addEventListener('dragover', function (e) {
    e.preventDefault();
    var dragging = cardListEl.querySelector('.dragging');
    if (!dragging) return;
    var after = getDragAfterElement(cardListEl, e.clientX);
    if (after == null) {
      cardListEl.appendChild(dragging);
    } else {
      cardListEl.insertBefore(dragging, after);
    }
  });
  cardListEl.addEventListener('drop', function () {
    var newOrder = [];
    cardListEl.querySelectorAll('.card').forEach(function (c) {
      newOrder.push(items[parseInt(c.dataset.index, 10)]);
    });
    items = newOrder;
    renderCards();
  });

  function getDragAfterElement(container, x) {
    var cards = Array.prototype.slice.call(container.querySelectorAll('.card:not(.dragging)'));
    var closest = { offset: -Infinity, element: null };
    cards.forEach(function (card) {
      var box = card.getBoundingClientRect();
      var offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closest.offset) {
        closest = { offset: offset, element: card };
      }
    });
    return closest.element;
  }

  // ---------- drop zone ----------

  dropzoneEl.addEventListener('click', function () { fileInputEl.click(); });
  dropzoneEl.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropzoneEl.classList.add('dragover');
  });
  dropzoneEl.addEventListener('dragleave', function () {
    dropzoneEl.classList.remove('dragover');
  });
  dropzoneEl.addEventListener('drop', function (e) {
    e.preventDefault();
    dropzoneEl.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  fileInputEl.addEventListener('change', function () {
    handleFiles(fileInputEl.files);
    fileInputEl.value = '';
  });

  function handleFiles(fileList) {
    Array.prototype.forEach.call(fileList, function (file) {
      if (!file.type.startsWith('image/')) return;
      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = reader.result;
        var base64 = dataUrl.split(',')[1];
        var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        var filename = 'img_' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '.' + ext;
        items.push({
          file: filename,
          title: '',
          isNew: true,
          base64: base64,
          previewUrl: dataUrl
        });
        renderCards();
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- save ----------

  btnSave.addEventListener('click', function () {
    if (!currentKey) return;
    btnSave.disabled = true;
    setStatus('保存中…');

    var folderPath = 'images/' + currentKey;
    var manifestPath = 'data/' + currentKey + '.json';

    var keptFiles = {};
    items.forEach(function (it) { if (!it.isNew) keptFiles[it.file] = true; });

    var deletions = Object.keys(shaMap).filter(function (name) { return !keptFiles[name]; });

    var uploadPromises = items.filter(function (it) { return it.isNew; }).map(function (it) {
      return fetch(apiBase() + folderPath + '/' + it.file, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({
          message: 'admin: add image ' + it.file,
          content: it.base64,
          branch: cfg.branch
        })
      }).then(checkOk);
    });

    var deletePromises = deletions.map(function (name) {
      var path = folderPath + '/' + name;
      return withFreshSha(path, function (sha) {
        return [apiBase() + path, {
          method: 'DELETE',
          headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
          body: JSON.stringify({
            message: 'admin: remove image ' + name,
            sha: sha || shaMap[name],
            branch: cfg.branch
          })
        }];
      }, 4);
    });

    function writeManifest(attemptsLeft) {
      return fetchJson(manifestPath).catch(function () { return null; })
        .then(function (fresh) {
          var freshSha = fresh ? fresh.sha : manifestSha;
          var manifestItems = items.map(function (it) {
            return { file: it.file, title: it.title || '' };
          });
          var body = {
            message: 'admin: update ' + currentKey + '.json',
            content: utf8ToBase64(JSON.stringify(manifestItems, null, 2)),
            branch: cfg.branch
          };
          if (freshSha) body.sha = freshSha;

          return fetch(apiBase() + manifestPath, {
            method: 'PUT',
            headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
            body: JSON.stringify(body)
          }).then(function (res) {
            if (res.status === 409 && attemptsLeft > 1) {
              setStatus('反映待ちのため再試行しています…');
              return delay(1200).then(function () { return writeManifest(attemptsLeft - 1); });
            }
            return checkOk(res);
          });
        });
    }

    function waitUntilVisible(path, expectedSha, attemptsLeft) {
      return fetchSha(path).then(function (sha) {
        if (sha === expectedSha) return true;
        if (attemptsLeft <= 1) return false;
        setStatus('反映を確認しています…');
        return delay(1000).then(function () {
          return waitUntilVisible(path, expectedSha, attemptsLeft - 1);
        });
      });
    }

    Promise.all(uploadPromises.concat(deletePromises))
      .then(function () {
        return writeManifest(4);
      })
      .then(function (manifestResult) {
        var newSha = manifestResult && manifestResult.content ? manifestResult.content.sha : null;
        if (!newSha) return true;
        return waitUntilVisible(manifestPath, newSha, 8);
      })
      .then(function (confirmed) {
        if (confirmed) {
          setStatus('保存・公開が完了し、反映も確認できました。', 'ok');
        } else {
          setStatus('保存はできましたが、反映の確認に時間がかかっています。少し待ってからページを再読み込みしてください。', 'ok');
        }
        openSection(currentKey); // reload fresh state (new shas, cleared isNew flags)
      })
      .catch(function (err) {
        console.error(err);
        setStatus('保存中にエラーが発生しました: ' + err.message, 'err');
      })
      .finally(function () {
        btnSave.disabled = false;
      });
  });

  function checkOk(res) {
    if (!res.ok) {
      return res.json().then(function (data) {
        throw new Error(data.message || res.statusText);
      });
    }
    return res.json();
  }
})();
