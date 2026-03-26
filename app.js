// ===== 灯だまり色帖 =====

// ----- ストレージ -----
const DB = {
  getCards: () => JSON.parse(localStorage.getItem('iro_cards') || '[]'),
  saveCards: (cards) => localStorage.setItem('iro_cards', JSON.stringify(cards)),
  getBoards: () => JSON.parse(localStorage.getItem('iro_boards') || '[]'),
  saveBoards: (boards) => localStorage.setItem('iro_boards', JSON.stringify(boards)),
  getKeys: () => JSON.parse(localStorage.getItem('iro_keys') || '{}'),
  saveKeys: (keys) => localStorage.setItem('iro_keys', JSON.stringify(keys)),
};

// ----- 画面遷移 -----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ----- タブ切替 -----
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    if (tab === 'boards') renderBoardList();
  });
});

// ----- 戻るボタン -----
document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.back;
    if (target === 'home') {
      showScreen('screen-home');
      renderCardGrid();
    }
  });
});

// ----- トースト -----
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  t.style.animation = 'none';
  void t.offsetWidth;
  t.style.animation = 'fadeInOut 2s ease forwards';
  setTimeout(() => { t.style.display = 'none'; }, 2100);
}

// ===== ホーム画面 =====

function renderCardGrid() {
  const cards = DB.getCards();
  const grid = document.getElementById('card-grid');
  const empty = document.getElementById('empty-cards');
  grid.innerHTML = '';
  if (cards.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  cards.slice().reverse().forEach(card => {
    const el = createCardThumb(card);
    grid.appendChild(el);
  });
}

function createCardThumb(card) {
  const div = document.createElement('div');
  div.className = 'card-thumb';
  div.addEventListener('click', () => openCardDetail(card.id));

  const imgUrl = card.images && card.images[0] ? card.images[0].url : null;
  if (imgUrl) {
    const img = document.createElement('img');
    img.className = 'card-thumb-img';
    img.src = imgUrl;
    img.alt = card.text;
    img.loading = 'lazy';
    div.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'card-thumb-img-placeholder';
    ph.textContent = '✦';
    div.appendChild(ph);
  }

  const body = document.createElement('div');
  body.className = 'card-thumb-body';

  const title = document.createElement('div');
  title.className = 'card-thumb-title';
  title.textContent = card.text;
  body.appendChild(title);

  if (card.colors && card.colors.length > 0) {
    const palette = document.createElement('div');
    palette.className = 'card-thumb-palette';
    card.colors.forEach(c => {
      const dot = document.createElement('div');
      dot.className = 'palette-dot';
      dot.style.background = c;
      palette.appendChild(dot);
    });
    body.appendChild(palette);
  }

  div.appendChild(body);
  return div;
}

function renderBoardList() {
  const boards = DB.getBoards();
  const list = document.getElementById('board-list');
  const empty = document.getElementById('empty-boards');
  list.innerHTML = '';
  if (boards.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  const allCards = DB.getCards();
  boards.forEach(board => {
    const item = document.createElement('div');
    item.className = 'board-item';

    // サムネイル（常に3スロット固定）
    const thumbs = document.createElement('div');
    thumbs.className = 'board-item-thumbs';
    for (let s = 0; s < 3; s++) {
      const cardId = board.cards[s];
      const card = cardId ? allCards.find(c => c.id === cardId) : null;
      const t = document.createElement('div');
      t.className = 'board-thumb';
      if (card && card.images && card.images[0]) {
        const img = document.createElement('img');
        img.src = card.images[0].url;
        img.alt = '';
        t.appendChild(img);
      } else if (card && card.colors && card.colors[0]) {
        t.style.background = card.colors[0];
      }
      // 空スロットはCSSのデフォルト背景
      thumbs.appendChild(t);
    }
    item.appendChild(thumbs);

    const info = document.createElement('div');
    info.className = 'board-item-info';
    info.innerHTML = `<span class="board-item-name">${board.name}</span><span class="board-item-count">${board.cards.length}枚</span>`;
    item.appendChild(info);

    item.addEventListener('click', () => openBoard(board.id));
    list.appendChild(item);
  });
}

// ===== 新規入力画面 =====

document.getElementById('btn-new-card').addEventListener('click', () => {
  openNewCardScreen();
});

function openNewCardScreen() {
  document.getElementById('input-text').value = '';
  showScreen('screen-new');
}

// ----- 設定画面 -----
document.getElementById('btn-settings').addEventListener('click', () => {
  const keys = DB.getKeys();
  if (keys.gemini) document.getElementById('input-gemini-key').value = keys.gemini;
  if (keys.unsplash) document.getElementById('input-unsplash-key').value = keys.unsplash;
  showScreen('screen-settings');
});

document.getElementById('btn-save-keys').addEventListener('click', () => {
  const gemini = document.getElementById('input-gemini-key').value.trim();
  const unsplash = document.getElementById('input-unsplash-key').value.trim();
  DB.saveKeys({ gemini, unsplash });
  showToast('APIキーを保存しました');
});

// ボードタブへジャンプ
document.getElementById('btn-goto-boards').addEventListener('click', () => {
  showScreen('screen-home');
  document.querySelectorAll('.tab').forEach(t => {
    if (t.dataset.tab === 'boards') t.click();
  });
});

// ----- 生成処理 -----
let currentPreviewData = null;
let currentInputText = '';
let currentSearchQuery = '';
let selectedImages = new Set();

document.getElementById('btn-generate').addEventListener('click', async () => {
  const text = document.getElementById('input-text').value.trim();
  if (!text) { showToast('ネタテキストを入力してください'); return; }

  const keys = DB.getKeys();

  const btn = document.getElementById('btn-generate');
  document.getElementById('generate-label').style.display = 'none';
  document.getElementById('generate-loading').style.display = 'inline';
  btn.disabled = true;

  try {
    currentInputText = text;
    selectedImages.clear();

    let poem = '';
    let colors = [];

    let searchQuery = text;
    if (keys.gemini) {
      const result = await generatePoemAndColors(keys.gemini, text);
      poem = result.poem;
      colors = result.colors;
      searchQuery = result.searchQuery || text;
    } else {
      // デモ用フォールバック
      poem = demoPoem(text);
      colors = demoColors();
    }

    currentPreviewData = { poem, colors };
    currentSearchQuery = searchQuery;
    openPreviewModal(text, poem, colors, keys);

    // 画像検索（並行）- Unsplashがあれば試し、なければWikimediaへ
    searchImagesWithFallback(keys, searchQuery, text);

  } catch (err) {
    console.error(err);
    showToast('生成に失敗しました: ' + err.message);
  } finally {
    document.getElementById('generate-label').style.display = 'inline';
    document.getElementById('generate-loading').style.display = 'none';
    btn.disabled = false;
  }
});

// ----- Gemini API -----
async function generatePoemAndColors(apiKey, text) {
  const prompt = `あなたは「セージ」という詩人です。
以下のルールで、入力されたイメージから短い詩を生成してください。

【文体ルール】
- 丁寧語は使わない（詩なので）
- 五感に訴える比喩を使う（光、温度、香り、音、質感）
- 3〜5行の短い詩
- 感情を「名指し」しない。描写で感情を起こす
- 「とろり」「ふわり」「じんわり」等のオノマトペを自然に使う
- 自然現象（光、風、波、霧、花、雪、雨）にたとえることが多い
- 最後の一行がいちばん印象的になるように

【入力】${text}

また、このイメージに合うカラーパレットを3〜5色、HEXコードで提案してください。
色は深めのトーン、やわらかいトーンを基本とし、絵の具で表現することを意識した色味にしてください。

以下のJSON形式のみ出力（前後に余分な文字なし）：
{"poem": "詩のテキスト（改行は\\nで）", "colors": ["#色1", "#色2", "#色3"], "searchQuery": "English photo search keywords (2-3 words)"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 2048 }
      })
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `Gemini API error: ${res.status}`;
    if (res.status === 429) {
      const sec = msg.match(/retry in ([\d.]+)s/i);
      throw new Error(sec ? `利用上限に達しました。約${Math.ceil(parseFloat(sec[1]))}秒後に再試行してください。` : '利用上限に達しました。しばらく時間をおいて再試行してください。');
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  // thinking モデルは parts[0] が思考、parts[1] が実際の出力になる場合がある
  const raw = parts.filter(p => !p.thought).map(p => p.text || '').join('') || parts[0]?.text || '';
  console.log('[Gemini raw]', raw);

  // JSON抽出（コードブロック除去 → {} 抽出）
  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('レスポンスのパースに失敗しました');
  const parsed = JSON.parse(match[0]);
  return { poem: parsed.poem || '', colors: parsed.colors || [], searchQuery: parsed.searchQuery || text };
}

// ----- Unsplash API -----
async function fetchUnsplashImages(clientId, query) {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=9&orientation=squarish`,
    { headers: { Authorization: `Client-ID ${clientId}` } }
  );
  if (!res.ok) throw new Error('Unsplash API error');
  const data = await res.json();
  return (data.results || []).map(p => ({
    url: p.urls.small,
    fullUrl: p.urls.regular,
    source: 'Unsplash',
    credit: p.user.name,
  }));
}

// ----- Wikimedia Commons API -----
async function fetchWikimediaImages(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
    gsrlimit: '15',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!res.ok) throw new Error('Wikimedia API error');
  const data = await res.json();
  const pages = data.query?.pages || {};
  const imageExts = /\.(jpg|jpeg|png|webp)$/i;
  return Object.values(pages)
    .filter(p => p.imageinfo && imageExts.test(p.title))
    .slice(0, 9)
    .map(p => ({
      url: p.imageinfo[0].thumburl || p.imageinfo[0].url,
      fullUrl: p.imageinfo[0].url,
      source: 'Wikimedia Commons',
      credit: p.title.replace('File:', ''),
    }));
}

// ----- 画像検索（フォールバック付き） -----
function setImageSourceBtn(source) {
  document.getElementById('btn-src-unsplash').classList.toggle('active', source === 'unsplash');
  document.getElementById('btn-src-wikimedia').classList.toggle('active', source === 'wikimedia');
}

async function searchImagesWithFallback(keys, searchQuery, originalText) {
  document.getElementById('images-loading').style.display = 'block';
  document.getElementById('preview-images').innerHTML = '';
  if (keys.unsplash) {
    try {
      const images = await fetchUnsplashImages(keys.unsplash, searchQuery);
      if (images.length > 0) {
        setImageSourceBtn('unsplash');
        renderPreviewImages(images);
        return;
      }
    } catch (e) { /* Unsplash失敗 → Wikimediaへ */ }
  }
  // Wikimedia Commons にフォールバック
  setImageSourceBtn('wikimedia');
  fetchWikimediaImages(originalText)
    .then(images => renderPreviewImages(images))
    .catch(e => {
      document.getElementById('images-loading').style.display = 'none';
      showToast('画像の取得に失敗しました');
    });
}

// ソース切り替えボタン
document.getElementById('btn-src-unsplash').addEventListener('click', () => {
  const keys = DB.getKeys();
  if (!keys.unsplash) { showToast('UnsplashのAPIキーが設定されていません'); return; }
  setImageSourceBtn('unsplash');
  document.getElementById('images-loading').style.display = 'block';
  document.getElementById('preview-images').innerHTML = '';
  fetchUnsplashImages(keys.unsplash, currentSearchQuery)
    .then(images => renderPreviewImages(images))
    .catch(() => showToast('Unsplashの取得に失敗しました'));
});

document.getElementById('btn-src-wikimedia').addEventListener('click', () => {
  setImageSourceBtn('wikimedia');
  document.getElementById('images-loading').style.display = 'block';
  document.getElementById('preview-images').innerHTML = '';
  fetchWikimediaImages(currentInputText)
    .then(images => renderPreviewImages(images))
    .catch(() => showToast('Wikimediaの取得に失敗しました'));
});

// ----- プレビューモーダル ボード選択 -----
let selectedBoardIds = new Set();

function renderPreviewBoards() {
  const boards = DB.getBoards();
  const container = document.getElementById('preview-board-chips');
  container.innerHTML = '';
  selectedBoardIds.clear();
  if (boards.length === 0) {
    const p = document.createElement('p');
    p.style.cssText = 'font-size:12px;color:var(--text3);padding:4px 0;';
    p.textContent = 'まだボードがありません';
    container.appendChild(p);
    return;
  }
  boards.forEach(board => {
    const btn = document.createElement('button');
    btn.className = 'board-chip';
    btn.textContent = board.name;
    btn.addEventListener('click', () => {
      if (selectedBoardIds.has(board.id)) {
        selectedBoardIds.delete(board.id);
        btn.classList.remove('selected');
      } else {
        selectedBoardIds.add(board.id);
        btn.classList.add('selected');
      }
    });
    container.appendChild(btn);
  });
}

document.getElementById('btn-preview-new-board').addEventListener('click', () => {
  const name = prompt('ボードの名前を入力してください');
  if (!name || !name.trim()) return;
  const board = {
    id: Date.now().toString(),
    name: name.trim(),
    cards: [],
    created_at: new Date().toISOString(),
  };
  const boards = DB.getBoards();
  boards.push(board);
  DB.saveBoards(boards);
  renderPreviewBoards();
  // 作成したボードを自動選択
  selectedBoardIds.add(board.id);
  const chips = document.querySelectorAll('.board-chip');
  chips.forEach(c => { if (c.textContent === board.name) c.classList.add('selected'); });
  showToast(`「${board.name}」を作成しました`);
});

// ----- デモ用フォールバック -----
function demoPoem(text) {
  const poems = [
    `光が、指の先からこぼれていく。\nどこかで風が、名前を呼んでいた。\nあの青は、まだそこにある。`,
    `じんわりと、熱が沁みてくる。\n言葉にならないものが、ふわりと浮かんで、\n雨のにおいに溶けていった。`,
    `霧の中に、ひとつだけ光が灯る。\nとろりと時間が流れて、\n白い花びらが、水面に触れる。`,
  ];
  return poems[Math.abs(text.length) % poems.length];
}

function demoColors() {
  const palettes = [
    ['#2E86AB', '#A3D5FF', '#F0F7FF', '#C1A87D', '#8B7355'],
    ['#8FA69E', '#D4C5B0', '#E8DDD0', '#6B8E7F', '#4A6741'],
    ['#C9A96E', '#E8D5B0', '#F5ECD8', '#9B6E3A', '#6B4B2A'],
  ];
  return palettes[Math.floor(Math.random() * palettes.length)];
}

// ===== プレビューモーダル =====

function openPreviewModal(text, poem, colors, keys) {
  document.getElementById('preview-poem').textContent = poem;

  const palette = document.getElementById('preview-palette');
  palette.innerHTML = '';
  colors.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'palette-swatch';
    sw.style.background = c;
    sw.title = c;
    sw.addEventListener('click', () => {
      navigator.clipboard?.writeText(c).then(() => showToast(c + ' コピー'));
    });
    palette.appendChild(sw);
  });

  const imagesGrid = document.getElementById('preview-images');
  imagesGrid.innerHTML = '';
  if (keys.unsplash) {
    document.getElementById('images-loading').style.display = 'block';
  }

  selectedImages.clear();
  primaryImageIndex = null;
  renderPreviewBoards();
  document.getElementById('modal-preview').style.display = 'flex';
}

let primaryImageIndex = null;

function renderPreviewImages(images) {
  document.getElementById('images-loading').style.display = 'none';
  const grid = document.getElementById('preview-images');
  grid.innerHTML = '';
  images.forEach((img, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'preview-img-wrap';

    const el = document.createElement('img');
    el.className = 'preview-img-item';
    el.src = img.url;
    el.alt = '';
    el.loading = 'lazy';

    const badge = document.createElement('div');
    badge.className = 'preview-img-badge';
    badge.textContent = 'メイン';

    if (i === 0) {
      el.classList.add('selected', 'primary');
      wrap.classList.add('is-primary');
      selectedImages.add(i);
      primaryImageIndex = 0;
    }

    el.addEventListener('click', () => {
      const allImgs = grid.querySelectorAll('.preview-img-item');
      const allWraps = grid.querySelectorAll('.preview-img-wrap');
      if (!el.classList.contains('selected')) {
        // 未選択 → 選択
        el.classList.add('selected');
        selectedImages.add(i);
      } else if (!el.classList.contains('primary')) {
        // 選択済・非メイン → メインに昇格
        allImgs.forEach(e => e.classList.remove('primary'));
        allWraps.forEach(w => w.classList.remove('is-primary'));
        el.classList.add('primary');
        wrap.classList.add('is-primary');
        primaryImageIndex = i;
      } else {
        // メイン → 選択解除
        el.classList.remove('selected', 'primary');
        wrap.classList.remove('is-primary');
        selectedImages.delete(i);
        primaryImageIndex = null;
        // 次の選択済みをメインに
        for (let j = 0; j < allImgs.length; j++) {
          if (allImgs[j].classList.contains('selected')) {
            allImgs[j].classList.add('primary');
            allWraps[j].classList.add('is-primary');
            primaryImageIndex = j;
            break;
          }
        }
      }
    });

    el._imageData = img;
    wrap.appendChild(el);
    wrap.appendChild(badge);
    grid.appendChild(wrap);
  });
}

// 詩の再生成
document.getElementById('btn-regen-poem').addEventListener('click', async () => {
  const keys = DB.getKeys();
  if (!keys.gemini) { showToast('Gemini APIキーが必要です'); return; }
  const btn = document.getElementById('btn-regen-poem');
  btn.textContent = '生成中…';
  btn.disabled = true;
  try {
    const { poem, colors } = await generatePoemAndColors(keys.gemini, currentInputText);
    document.getElementById('preview-poem').textContent = poem;
    currentPreviewData.poem = poem;
    currentPreviewData.colors = colors;

    const palette = document.getElementById('preview-palette');
    palette.innerHTML = '';
    colors.forEach(c => {
      const sw = document.createElement('div');
      sw.className = 'palette-swatch';
      sw.style.background = c;
      palette.appendChild(sw);
    });
  } catch (e) {
    showToast('再生成に失敗しました');
  } finally {
    btn.textContent = '詩を再生成';
    btn.disabled = false;
  }
});

// カードを保存
document.getElementById('btn-save-card').addEventListener('click', () => {
  if (!currentPreviewData) return;

  // 選択された画像
  const imgEls = document.querySelectorAll('.preview-img-item');
  let primaryImg = null;
  const images = [];
  imgEls.forEach((el, i) => {
    if (!selectedImages.has(i) || !el._imageData) return;
    if (el.classList.contains('primary')) {
      primaryImg = el._imageData;
    } else {
      images.push(el._imageData);
    }
  });
  if (primaryImg) images.unshift(primaryImg);

  const card = {
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    text: currentInputText,
    poem: currentPreviewData.poem,
    colors: currentPreviewData.colors,
    images: images,
    boards: [],
  };

  const cards = DB.getCards();
  cards.push(card);
  DB.saveCards(cards);

  // 選択されたボードに追加
  selectedBoardIds.forEach(boardId => addCardToBoard(card.id, boardId));

  document.getElementById('modal-preview').style.display = 'none';
  showToast('カードを保存しました ✦');

  renderCardGrid();
  showScreen('screen-home');
});

// モーダル背景クリックで閉じる
document.getElementById('modal-preview').addEventListener('click', function(e) {
  if (e.target === this) this.style.display = 'none';
});
document.getElementById('modal-boards').addEventListener('click', function(e) {
  if (e.target === this) this.style.display = 'none';
});

// ===== カード詳細画面 =====

let currentCardId = null;

function openCardDetail(cardId) {
  currentCardId = cardId;
  const cards = DB.getCards();
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  document.getElementById('card-detail-title').textContent = card.text;
  const body = document.getElementById('card-detail-body');
  body.innerHTML = '';

  // ヒーロー画像
  if (card.images && card.images[0]) {
    const img = document.createElement('img');
    img.className = 'card-detail-hero';
    img.src = card.images[0].url;
    img.alt = card.text;
    body.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'card-detail-hero-placeholder';
    ph.textContent = '✦';
    body.appendChild(ph);
  }

  const inner = document.createElement('div');
  inner.className = 'card-detail-body';

  // ボード名をタグ表示
  const meta = document.createElement('div');
  meta.className = 'card-detail-meta';
  const allBoards = DB.getBoards();
  (card.boards || []).forEach(boardId => {
    const board = allBoards.find(b => b.id === boardId);
    if (!board) return;
    const ch = document.createElement('div');
    ch.className = 'tag-chip tag-chip--link';
    ch.textContent = board.name;
    ch.addEventListener('click', () => openBoard(boardId));
    meta.appendChild(ch);
  });
  if (meta.children.length) inner.appendChild(meta);

  // 詩
  const poem = document.createElement('p');
  poem.className = 'card-poem';
  poem.textContent = card.poem;
  inner.appendChild(poem);

  // カラーパレット
  if (card.colors && card.colors.length > 0) {
    const palWrap = document.createElement('div');
    palWrap.className = 'palette-wrap';
    const label = document.createElement('p');
    label.className = 'section-label';
    label.textContent = 'カラーパレット';
    palWrap.appendChild(label);
    const row = document.createElement('div');
    row.className = 'palette-row';
    card.colors.forEach(c => {
      const sw = document.createElement('div');
      sw.className = 'palette-swatch';
      sw.style.background = c;
      sw.title = c;
      const code = document.createElement('div');
      code.className = 'palette-swatch-code';
      code.textContent = c;
      sw.appendChild(code);
      sw.addEventListener('click', () => {
        navigator.clipboard?.writeText(c).then(() => showToast(c + ' コピー'));
      });
      row.appendChild(sw);
    });
    palWrap.appendChild(row);
    // コード表示のための余白
    const spacer = document.createElement('div');
    spacer.style.height = '24px';
    palWrap.appendChild(spacer);
    inner.appendChild(palWrap);
  }

  // 画像一覧（複数枚）
  if (card.images && card.images.length > 0) {
    const imgSection = document.createElement('div');
    const imgLabel = document.createElement('p');
    imgLabel.className = 'section-label';
    imgLabel.textContent = '参考画像';
    imgSection.appendChild(imgLabel);
    const imgGrid = document.createElement('div');
    imgGrid.className = 'card-images-grid';
    card.images.forEach(im => {
      const img = document.createElement('img');
      img.className = 'card-image-item';
      img.src = im.url;
      img.alt = '';
      img.loading = 'lazy';
      imgGrid.appendChild(img);
    });
    imgSection.appendChild(imgGrid);
    inner.appendChild(imgSection);
  }

  body.appendChild(inner);

  // アクションボタン
  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const btnBoard = document.createElement('button');
  btnBoard.className = 'btn-primary';
  btnBoard.textContent = 'ムードボードに追加';
  btnBoard.addEventListener('click', () => openBoardSelectModal(cardId));
  actions.appendChild(btnBoard);

  const btnRegen = document.createElement('button');
  btnRegen.className = 'btn-secondary';
  btnRegen.textContent = '詩を再生成';
  btnRegen.addEventListener('click', () => regenPoemForCard(cardId));
  actions.appendChild(btnRegen);

  body.appendChild(actions);

  showScreen('screen-card');
}

// カード削除
document.getElementById('btn-delete-card').addEventListener('click', () => {
  if (!currentCardId) return;
  if (!confirm('このカードを削除しますか？')) return;
  const cards = DB.getCards().filter(c => c.id !== currentCardId);
  DB.saveCards(cards);
  // ボードからも除去
  const boards = DB.getBoards().map(b => ({
    ...b, cards: b.cards.filter(id => id !== currentCardId)
  }));
  DB.saveBoards(boards);
  showToast('カードを削除しました');
  renderCardGrid();
  showScreen('screen-home');
});

// カード詳細から詩再生成
async function regenPoemForCard(cardId) {
  const keys = DB.getKeys();
  if (!keys.gemini) { showToast('Gemini APIキーが必要です'); return; }
  const cards = DB.getCards();
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  try {
    showToast('詩を再生成中…');
    const { poem, colors } = await generatePoemAndColors(keys.gemini, card.text);
    card.poem = poem;
    card.colors = colors;
    DB.saveCards(cards);
    openCardDetail(cardId);
    showToast('詩を更新しました');
  } catch (e) {
    showToast('再生成に失敗しました');
  }
}

// ===== ムードボード =====

function openBoardSelectModal(cardId) {
  const boards = DB.getBoards();
  const list = document.getElementById('board-select-list');
  list.innerHTML = '';

  if (boards.length === 0) {
    const p = document.createElement('p');
    p.style.cssText = 'font-size:12px;color:var(--text3);padding:4px 0 12px;';
    p.textContent = 'ボードがありません。下のボタンで作成してください。';
    list.appendChild(p);
  }

  // 現在の所属ボードを初期選択状態にする
  const selectedIds = new Set(
    boards.filter(b => b.cards.includes(cardId)).map(b => b.id)
  );

  boards.forEach(board => {
    const btn = document.createElement('button');
    btn.className = 'board-chip' + (selectedIds.has(board.id) ? ' selected' : '');
    btn.textContent = board.name;
    btn.addEventListener('click', () => {
      if (selectedIds.has(board.id)) {
        selectedIds.delete(board.id);
        btn.classList.remove('selected');
      } else {
        selectedIds.add(board.id);
        btn.classList.add('selected');
      }
    });
    list.appendChild(btn);
  });

  // 保存ボタン
  const saveBtn = document.getElementById('btn-modal-save-boards');
  saveBtn.onclick = () => {
    const allBoards = DB.getBoards();
    const cards = DB.getCards();
    const card = cards.find(c => c.id === cardId);
    if (card) {
      // 追加・削除を同期
      allBoards.forEach(board => {
        const inBoard = board.cards.includes(cardId);
        const wantIn = selectedIds.has(board.id);
        if (wantIn && !inBoard) {
          board.cards.push(cardId);
          if (!card.boards) card.boards = [];
          if (!card.boards.includes(board.id)) card.boards.push(board.id);
        } else if (!wantIn && inBoard) {
          board.cards = board.cards.filter(id => id !== cardId);
          card.boards = (card.boards || []).filter(id => id !== board.id);
        }
      });
      DB.saveBoards(allBoards);
      DB.saveCards(cards);
    }
    document.getElementById('modal-boards').style.display = 'none';
    showToast('ボードを更新しました');
    openCardDetail(cardId); // メタ表示を更新
  };

  document.getElementById('modal-boards').style.display = 'flex';
}

function addCardToBoard(cardId, boardId) {
  const boards = DB.getBoards();
  const board = boards.find(b => b.id === boardId);
  if (!board) return;
  if (!board.cards.includes(cardId)) board.cards.push(cardId);
  DB.saveBoards(boards);

  // カードにもボードIDを記録
  const cards = DB.getCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    if (!card.boards) card.boards = [];
    if (!card.boards.includes(boardId)) card.boards.push(boardId);
    DB.saveCards(cards);
  }
}

// 新ボード作成（ホーム）
document.getElementById('btn-new-board').addEventListener('click', () => {
  createNewBoard();
});

// 新ボード作成（モーダル内）
document.getElementById('btn-modal-new-board').addEventListener('click', () => {
  const name = prompt('ボードの名前を入力してください');
  if (!name || !name.trim()) return;
  const board = {
    id: Date.now().toString(),
    name: name.trim(),
    cards: [],
    created_at: new Date().toISOString(),
  };
  const boards = DB.getBoards();
  boards.push(board);
  DB.saveBoards(boards);
  // チップとして追加・自動選択
  if (currentCardId) openBoardSelectModal(currentCardId);
  showToast(`「${board.name}」を作成しました`);
});

function createNewBoard() {
  const name = prompt('ボードの名前を入力してください（例：夏の透明）');
  if (!name || !name.trim()) return null;
  const board = {
    id: Date.now().toString(),
    name: name.trim(),
    cards: [],
    created_at: new Date().toISOString(),
  };
  const boards = DB.getBoards();
  boards.push(board);
  DB.saveBoards(boards);
  renderBoardList();
  return board;
}

function openBoard(boardId) {
  const boards = DB.getBoards();
  const board = boards.find(b => b.id === boardId);
  if (!board) return;

  document.getElementById('board-title-display').textContent = board.name;

  const cards = DB.getCards();
  const boardCards = board.cards.map(id => cards.find(c => c.id === id)).filter(Boolean);

  const grid = document.getElementById('board-cards-grid');
  const empty = document.getElementById('empty-board');
  grid.innerHTML = '';

  if (boardCards.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    boardCards.forEach(card => {
      const el = createCardThumb(card);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openCardDetail(card.id);
      });
      // クリックを上書き
      el.replaceWith(el);
      const el2 = createCardThumb(card);
      el2.addEventListener('click', () => openCardDetail(card.id));
      grid.appendChild(el2);
    });
  }

  // 現在のボードIDを保存
  currentBoardId = boardId;
  showScreen('screen-board');
}

let currentBoardId = null;

document.getElementById('btn-delete-board').addEventListener('click', () => {
  if (!currentBoardId) return;
  const boards = DB.getBoards();
  const board = boards.find(b => b.id === currentBoardId);
  if (!confirm(`「${board?.name}」を削除しますか？`)) return;
  const newBoards = boards.filter(b => b.id !== currentBoardId);
  DB.saveBoards(newBoards);
  showToast('ボードを削除しました');
  renderBoardList();
  document.querySelectorAll('.tab').forEach(t => {
    if (t.dataset.tab === 'boards') t.click();
  });
  showScreen('screen-home');
});

// ===== 初期化 =====
renderCardGrid();
