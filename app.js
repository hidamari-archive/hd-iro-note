// ===== 灯だまり色帖 =====

// ----- Supabase -----
const SUPABASE_URL = 'https://fypsfmrmxcgydpwkjhlc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xFRv_2bAv5b8T0XGXQn7uQ_9ZfxrPy2';
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DB = {
  // ----- カード -----
  async getCards() {
    const { data, error } = await supa.from('iro_cards').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async insertCard(payload) {
    const { data, error } = await supa.from('iro_cards').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateCard(id, payload) {
    const { error } = await supa.from('iro_cards').update(payload).eq('id', id);
    if (error) throw error;
  },
  async deleteCard(id) {
    const { error } = await supa.from('iro_cards').delete().eq('id', id);
    if (error) throw error;
  },
  // ----- ボード -----
  async getBoards() {
    const { data, error } = await supa.from('iro_boards').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async insertBoard(payload) {
    const { data, error } = await supa.from('iro_boards').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateBoard(id, payload) {
    const { error } = await supa.from('iro_boards').update(payload).eq('id', id);
    if (error) throw error;
  },
  async deleteBoard(id) {
    const { error } = await supa.from('iro_boards').delete().eq('id', id);
    if (error) throw error;
  },
  // ----- APIキーはlocalStorageに残す -----
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
  btn.addEventListener('click', async () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    if (tab === 'boards') await renderBoardList();
  });
});

// ----- 戻るボタン -----
document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const target = btn.dataset.back;
    if (target === 'home') {
      showScreen('screen-home');
      await renderCardGrid();
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

async function renderCardGrid() {
  const cards = await DB.getCards();
  const grid = document.getElementById('card-grid');
  const empty = document.getElementById('empty-cards');
  grid.innerHTML = '';
  if (cards.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  cards.slice().reverse().forEach(card => {
    grid.appendChild(createCardThumb(card));
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

async function renderBoardList() {
  const boards = await DB.getBoards();
  const list = document.getElementById('board-list');
  const empty = document.getElementById('empty-boards');
  list.innerHTML = '';
  if (boards.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  const allCards = await DB.getCards();
  boards.forEach(board => {
    const item = document.createElement('div');
    item.className = 'board-item';

    const cardIds = board.card_ids || [];
    const thumbs = document.createElement('div');
    thumbs.className = 'board-item-thumbs';
    for (let s = 0; s < 3; s++) {
      const cardId = cardIds[s];
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
      thumbs.appendChild(t);
    }
    item.appendChild(thumbs);

    const info = document.createElement('div');
    info.className = 'board-item-info';
    info.innerHTML = `<span class="board-item-name">${board.name}</span><span class="board-item-count">${cardIds.length}枚</span>`;
    item.appendChild(info);

    item.addEventListener('click', () => openBoard(board.id));
    list.appendChild(item);
  });
}

// ===== 新規入力画面 =====

document.getElementById('btn-new-card').addEventListener('click', () => {
  document.getElementById('input-text').value = '';
  showScreen('screen-new');
});

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
      poem = demoPoem(text);
      colors = demoColors();
    }

    currentPreviewData = { poem, colors };
    currentSearchQuery = searchQuery;
    await openPreviewModal(text, poem, colors, keys);

    // 画像検索（並行）
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
  const prompt = `あなたは詩人です。
入力されたイメージから、やさしく、でも少しだけ驚きのある短い詩を3〜4行で生成してください。

【大切なこと】
- この詩は、絵を描く人が「あ、描きたい」と思うためのものです
- やさしい言葉で書いてください。硬い言葉や鋭い言葉は避ける
- でも、ただきれいなだけではなく、「えっ、そう見るの？」という小さな驚きを入れてください

【書き方のルール】
- そのものを、やさしい別の何かに見立てる
  ○ いちご→「小さな赤いランプ」「指先サイズの夕焼け」
  × いちご→「赤黒い心臓」「血の雫」（硬すぎる）
- 視点をひとつだけずらす（大きさ、時間、誰が見ているか）
- 最後の一行に、ちいさな温度を残す
- 五感を使うなら、触った感触や温度が特に良い

【禁止語】
「ふわり」「とろり」「じんわり」「そっと」「やさしく」
（これらを使わずに、やさしさを伝えてください）

【よい例】
入力：いちご
「ヘタの小さな王冠が、まだ取れたくなさそうにしている。
 つまむと、指の腹にほんのり冷たい。
 あなたの口に届くまでの、最後のひと粒。」

入力：タンポポ
「道の隅っこで、だれにも頼まれていない仕事をしている。
 茎は細いのに、花は空に向かって全開。
 明日の朝には、銀色の旅のしたくが始まる。」

入力：りんご
「持ち上げると、思ったより重い。
 この中に、秋の雨が何日ぶん詰まっているんだろう。
 芯のまわりだけ、すこし蜜の色がにじんでいる。」

入力：八重桜
「一輪なのに、もう花束のふりをしている。
 重たくて、枝がすこしだけお辞儀をした。
 雨上がりの朝は、持ちきれない水を葉っぱに預けている。」

【入力】${text}

また、このイメージに合うカラーパレットを4色、HEXコードで提案してください。
絵の具で使いたくなるような、深みのあるやさしい色にしてください。

以下のJSON形式のみ出力（前後に余分な文字なし）：
{"poem": "詩のテキスト（改行は\\nで）", "colors": ["#色1", "#色2", "#色3", "#色4"], "searchQuery": "English photo search keywords (2-3 words)"}`;

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
  const raw = parts.filter(p => !p.thought).map(p => p.text || '').join('') || parts[0]?.text || '';
  console.log('[Gemini raw]', raw);

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
  setImageSourceBtn('wikimedia');
  fetchWikimediaImages(originalText)
    .then(images => renderPreviewImages(images))
    .catch(() => {
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

async function renderPreviewBoards() {
  const boards = await DB.getBoards();
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

document.getElementById('btn-preview-new-board').addEventListener('click', async () => {
  const name = prompt('ボードの名前を入力してください');
  if (!name || !name.trim()) return;
  try {
    const board = await DB.insertBoard({ name: name.trim(), card_ids: [] });
    await renderPreviewBoards();
    selectedBoardIds.add(board.id);
    document.querySelectorAll('.board-chip').forEach(c => {
      if (c.textContent === board.name) c.classList.add('selected');
    });
    showToast(`「${board.name}」を作成しました`);
  } catch (e) {
    showToast('ボードの作成に失敗しました');
  }
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

async function openPreviewModal(text, poem, colors, keys) {
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

  document.getElementById('preview-images').innerHTML = '';
  if (keys.unsplash) {
    document.getElementById('images-loading').style.display = 'block';
  }

  selectedImages.clear();
  primaryImageIndex = null;
  await renderPreviewBoards();
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
        el.classList.add('selected');
        selectedImages.add(i);
      } else if (!el.classList.contains('primary')) {
        allImgs.forEach(e => e.classList.remove('primary'));
        allWraps.forEach(w => w.classList.remove('is-primary'));
        el.classList.add('primary');
        wrap.classList.add('is-primary');
        primaryImageIndex = i;
      } else {
        el.classList.remove('selected', 'primary');
        wrap.classList.remove('is-primary');
        selectedImages.delete(i);
        primaryImageIndex = null;
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
document.getElementById('btn-save-card').addEventListener('click', async () => {
  if (!currentPreviewData) return;

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

  const boardIds = [...selectedBoardIds];

  const btn = document.getElementById('btn-save-card');
  btn.disabled = true;
  btn.textContent = '保存中…';

  try {
    const card = await DB.insertCard({
      text: currentInputText,
      poem: currentPreviewData.poem,
      colors: currentPreviewData.colors,
      images: images,
      board_ids: boardIds,
    });

    // 選択されたボードの card_ids を更新
    if (boardIds.length > 0) {
      const boards = await DB.getBoards();
      for (const boardId of boardIds) {
        const board = boards.find(b => b.id === boardId);
        if (board) {
          await DB.updateBoard(boardId, { card_ids: [...(board.card_ids || []), card.id] });
        }
      }
    }

    document.getElementById('modal-preview').style.display = 'none';
    showToast('カードを保存しました ✦');
    await renderCardGrid();
    showScreen('screen-home');
  } catch (e) {
    showToast('保存に失敗しました: ' + e.message);
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = 'このカードを保存';
  }
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

async function openCardDetail(cardId) {
  currentCardId = cardId;
  const cards = await DB.getCards();
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
  const allBoards = await DB.getBoards();
  (card.board_ids || []).forEach(boardId => {
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
    const spacer = document.createElement('div');
    spacer.style.height = '24px';
    palWrap.appendChild(spacer);
    inner.appendChild(palWrap);
  }

  // 画像一覧
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
document.getElementById('btn-delete-card').addEventListener('click', async () => {
  if (!currentCardId) return;
  if (!confirm('このカードを削除しますか？')) return;
  try {
    // ボードの card_ids からも除去
    const boards = await DB.getBoards();
    for (const board of boards) {
      if ((board.card_ids || []).includes(currentCardId)) {
        await DB.updateBoard(board.id, { card_ids: board.card_ids.filter(id => id !== currentCardId) });
      }
    }
    await DB.deleteCard(currentCardId);
    showToast('カードを削除しました');
    await renderCardGrid();
    showScreen('screen-home');
  } catch (e) {
    showToast('削除に失敗しました');
    console.error(e);
  }
});

// カード詳細から詩再生成
async function regenPoemForCard(cardId) {
  const keys = DB.getKeys();
  if (!keys.gemini) { showToast('Gemini APIキーが必要です'); return; }
  const cards = await DB.getCards();
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  try {
    showToast('詩を再生成中…');
    const { poem, colors } = await generatePoemAndColors(keys.gemini, card.text);
    await DB.updateCard(cardId, { poem, colors });
    await openCardDetail(cardId);
    showToast('詩を更新しました');
  } catch (e) {
    showToast('再生成に失敗しました');
  }
}

// ===== ムードボード =====

async function openBoardSelectModal(cardId) {
  const boards = await DB.getBoards();
  const list = document.getElementById('board-select-list');
  list.innerHTML = '';

  if (boards.length === 0) {
    const p = document.createElement('p');
    p.style.cssText = 'font-size:12px;color:var(--text3);padding:4px 0 12px;';
    p.textContent = 'ボードがありません。下のボタンで作成してください。';
    list.appendChild(p);
  }

  const selectedIds = new Set(
    boards.filter(b => (b.card_ids || []).includes(cardId)).map(b => b.id)
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

  const saveBtn = document.getElementById('btn-modal-save-boards');
  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    try {
      const currentBoards = await DB.getBoards();
      const newBoardIds = [];

      for (const board of currentBoards) {
        const inBoard = (board.card_ids || []).includes(cardId);
        const wantIn = selectedIds.has(board.id);
        if (wantIn) newBoardIds.push(board.id);
        if (wantIn && !inBoard) {
          await DB.updateBoard(board.id, { card_ids: [...(board.card_ids || []), cardId] });
        } else if (!wantIn && inBoard) {
          await DB.updateBoard(board.id, { card_ids: board.card_ids.filter(id => id !== cardId) });
        }
      }

      await DB.updateCard(cardId, { board_ids: newBoardIds });

      document.getElementById('modal-boards').style.display = 'none';
      showToast('ボードを更新しました');
      await openCardDetail(cardId);
    } catch (e) {
      showToast('更新に失敗しました');
      console.error(e);
    } finally {
      saveBtn.disabled = false;
    }
  };

  document.getElementById('modal-boards').style.display = 'flex';
}

// 新ボード作成（ホーム）
document.getElementById('btn-new-board').addEventListener('click', async () => {
  await createNewBoard();
});

// 新ボード作成（モーダル内）
document.getElementById('btn-modal-new-board').addEventListener('click', async () => {
  const name = prompt('ボードの名前を入力してください');
  if (!name || !name.trim()) return;
  try {
    await DB.insertBoard({ name: name.trim(), card_ids: [] });
    if (currentCardId) await openBoardSelectModal(currentCardId);
    showToast(`「${name.trim()}」を作成しました`);
  } catch (e) {
    showToast('ボードの作成に失敗しました');
  }
});

async function createNewBoard() {
  const name = prompt('ボードの名前を入力してください（例：夏の透明）');
  if (!name || !name.trim()) return null;
  try {
    const board = await DB.insertBoard({ name: name.trim(), card_ids: [] });
    await renderBoardList();
    return board;
  } catch (e) {
    showToast('ボードの作成に失敗しました');
    return null;
  }
}

async function openBoard(boardId) {
  const boards = await DB.getBoards();
  const board = boards.find(b => b.id === boardId);
  if (!board) return;

  document.getElementById('board-title-display').textContent = board.name;

  const cards = await DB.getCards();
  const boardCards = (board.card_ids || []).map(id => cards.find(c => c.id === id)).filter(Boolean);

  const grid = document.getElementById('board-cards-grid');
  const empty = document.getElementById('empty-board');
  grid.innerHTML = '';

  if (boardCards.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    boardCards.forEach(card => {
      grid.appendChild(createCardThumb(card));
    });
  }

  currentBoardId = boardId;
  showScreen('screen-board');
}

let currentBoardId = null;

document.getElementById('btn-delete-board').addEventListener('click', async () => {
  if (!currentBoardId) return;
  const boards = await DB.getBoards();
  const board = boards.find(b => b.id === currentBoardId);
  if (!confirm(`「${board?.name}」を削除しますか？`)) return;
  try {
    // カードの board_ids からも除去
    const cardIds = board.card_ids || [];
    if (cardIds.length > 0) {
      const cards = await DB.getCards();
      for (const cardId of cardIds) {
        const card = cards.find(c => c.id === cardId);
        if (card) {
          await DB.updateCard(cardId, { board_ids: (card.board_ids || []).filter(id => id !== currentBoardId) });
        }
      }
    }
    await DB.deleteBoard(currentBoardId);
    showToast('ボードを削除しました');
    showScreen('screen-home');
    document.querySelectorAll('.tab').forEach(t => {
      if (t.dataset.tab === 'boards') t.click();
    });
  } catch (e) {
    showToast('削除に失敗しました');
    console.error(e);
  }
});

// ===== ログイン =====
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (!email || !pass) return;
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginErr');
  btn.disabled = true; btn.textContent = '確認中…';
  const { error } = await supa.auth.signInWithPassword({ email, password: pass });
  btn.disabled = false; btn.textContent = 'ログイン';
  if (error) { err.style.opacity = '1'; setTimeout(() => err.style.opacity = '0', 2500); return; }
  document.getElementById('loginOverlay').style.display = 'none';
  renderCardGrid();
}
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginOverlay').style.display === 'flex') doLogin();
});

// ===== 初期化 =====
(async () => {
  const { data: { session } } = await supa.auth.getSession();
  if (!session) { document.getElementById('loginOverlay').style.display = 'flex'; return; }
  supa.auth.onAuthStateChange((_, s) => { if (!s) location.reload(); });
  renderCardGrid();
})();
