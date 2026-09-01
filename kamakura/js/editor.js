/* ============================================================
 * 編集と保存
 * ------------------------------------------------------------
 * ・クリック（左右モード）  なし → ○（左）→ ●（右）→ なし
 * ・クリック（利きバチモード）OFF → ON
 * ・右クリック / Shift+クリック / 長押し … いつでも 利きバチ の ON/OFF
 * ・編集内容は localStorage に保存（ブラウザを閉じても残る）
 * ============================================================ */
(function (YH) {
  'use strict';

  /* 譜面データを作り直したら、この番号を上げて古い保存を無効にする。
     ★ただし同じキーに2枚目の文章も入っている。単純に上げると文章まで消えるので、
       上げるときは PREV_KEY からの引き継ぎ（下の load()）を書くこと。
     屋台囃子とはキーが別なので、同じブラウザで両方使っても混ざらない。 */
  var STORAGE_KEY = 'kamakura-shichoume-score/v1';
  /* 1つ前の版。まだ無いので null（引き継ぎなし） */
  var PREV_KEY = null;

  /* 譜面の文字の既定サイズ（mm）。css/style.css の --kana-size と同じ値にする。
     この大きさを起点に、用紙に収まるところまで app.js が自動で下げる。 */
  var DEFAULT_SIZE = 4.5;
  YH.DEFAULT_SIZE = DEFAULT_SIZE;

  var state = {
    edits: {},          // { cellKey: {h:"R"|"L"|null, a:boolean} }
    texts: {},          // { textKey: "書き換えた文章" }（2枚目のポイント欄）
    editing: true,
    clickMode: 'hand',  // 'hand' | 'accent'
    showBeats: false,
    kanaSize: DEFAULT_SIZE,
    /* 本人が「文字 −／＋」で決めたか。true のあいだ自動調整はしない */
    sizeFromUser: false
  };
  YH.state = state;

  /* 配っているプリントの初期値（js/data-preset.js）。
     ★毎回コピーを返す。そのまま渡すと、画面でクリックしたときに
       初期値そのものが書き換わり、「編集をもどす」で戻らなくなる。 */
  function presetEdits() {
    var src = YH.PRESET_EDITS || {};
    var out = {};
    for (var k in src) {
      if (src.hasOwnProperty(k)) out[k] = { h: src[k].h || null, a: !!src[k].a };
    }
    return out;
  }
  YH.presetEdits = presetEdits;

  /* ---------------- 保存 ---------------- */
  function apply(d, withEdits) {
    if (withEdits && d.edits) state.edits = d.edits;
    if (d.texts) state.texts = d.texts;
    if (typeof d.showBeats === 'boolean') state.showBeats = d.showBeats;
    if (typeof d.kanaSize === 'number') {
      state.kanaSize = d.kanaSize;
      state.sizeFromUser = !!d.sizeFromUser;
    }
    if (d.clickMode) state.clickMode = d.clickMode;
  }

  function load() {
    /* まず配っているプリントの状態にしておく。
       保存があれば、このあと apply() が上書きする。 */
    state.edits = presetEdits();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { apply(JSON.parse(raw), true); return; }

      /* 古い保存からの引き継ぎ。
         印のキーの形が変わったときは印だけ捨て、
         画面で書き直した文章と表示設定は残す。 */
      if (!PREV_KEY) return;
      var old = localStorage.getItem(PREV_KEY);
      if (!old) return;
      apply(JSON.parse(old), false);
      save();
    } catch (e) {
      console.warn('保存データを読めませんでした', e);
    }
  }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          edits: state.edits,
          texts: state.texts,
          showBeats: state.showBeats,
          kanaSize: state.kanaSize,
          sizeFromUser: state.sizeFromUser,
          clickMode: state.clickMode
        }));
        YH.flashSaved && YH.flashSaved();
      } catch (e) {
        console.warn('保存できませんでした', e);
      }
    }, 150);
  }
  YH.save = save;

  /* ★まっさらにはしない。**配っているプリントの状態**にもどす。
     ここを {} にすると、押した人の画面から左右も利きバチも全部消えて、
     元のプリントが刷れなくなる。 */
  YH.resetEdits = function () {
    state.edits = presetEdits();
    save();
  };

  YH.resetTexts = function () {
    state.texts = {};
    save();
  };

  /* ---------------- 参照 ---------------- */
  /** 書き換えた文章があればそれを、なければデータの元の文章を返す */
  YH.getText = function (key, original) {
    return (key in state.texts) ? state.texts[key] : original;
  };

  /** データの既定値 → 保存された編集内容 の順で上書き */
  YH.getCellState = function (key, defaults) {
    var e = state.edits[key];
    return {
      h: e && 'h' in e ? e.h : (defaults.h || null),
      a: e && 'a' in e ? e.a : !!defaults.a
    };
  };

  /* ---------------- 更新 ---------------- */
  var HAND_CYCLE = { 'null': 'L', 'L': 'R', 'R': null };
  var HAND_MARK = { R: '●', L: '○' };

  function ensure(key) {
    if (!state.edits[key]) state.edits[key] = {};
    return state.edits[key];
  }

  function currentOf(node) {
    var handTx = node.querySelector('.mk-hand').textContent;
    return {
      h: handTx === '●' ? 'R' : (handTx === '○' ? 'L' : null),
      a: node.querySelector('.mk-acc').classList.contains('on')
    };
  }

  /* │ は CSS の罫線で描くので、クラスの付け外しだけでよい */
  function paint(node, st) {
    node.querySelector('.mk-hand').textContent = st.h ? HAND_MARK[st.h] : '';
    node.querySelector('.mk-acc').classList.toggle('on', st.a);
  }

  function cycleHand(t) {
    var cur = currentOf(t.node);
    var next = HAND_CYCLE[String(cur.h)];
    ensure(t.key).h = next;
    paint(t.node, { h: next, a: cur.a });
    save();
  }

  function toggleAccent(t) {
    var cur = currentOf(t.node);
    var next = !cur.a;
    ensure(t.key).a = next;
    paint(t.node, { h: cur.h, a: next });
    save();
  }

  /* ---------------- イベント ---------------- */
  YH.attachEditing = function (root) {
    /* クリックされた透明の帯（.hit）から、対応する印を1つ選ぶ。
       1つの語に2つ印があるときは、押した側だけが変わる。 */
    function target(ev) {
      if (!state.editing) return null;
      var hit = ev.target.closest('.hit');
      if (!hit) return null;
      var cell = hit.closest('.cell[data-editable]');
      if (!cell) return null;
      var mi = hit.dataset.mk;
      return {
        node: cell.querySelector('.mk[data-mk="' + mi + '"]'),
        key: cell.dataset.key + '-' + mi
      };
    }

    root.addEventListener('click', function (ev) {
      var n = target(ev);
      if (!n) return;
      if (ev.shiftKey || state.clickMode === 'accent') toggleAccent(n);
      else cycleHand(n);
    });

    root.addEventListener('contextmenu', function (ev) {
      var n = target(ev);
      if (!n) return;
      ev.preventDefault();
      toggleAccent(n);
    });

    /* タブレット用：長押しで 利きバチ */
    var pressTimer = null, pressed = null, longFired = false;
    root.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType === 'mouse') return;
      var n = target(ev);
      if (!n) return;
      pressed = n; longFired = false;
      pressTimer = setTimeout(function () {
        longFired = true;
        toggleAccent(pressed);
      }, 500);
    });
    function cancelPress() { clearTimeout(pressTimer); pressed = null; }
    root.addEventListener('pointerup', function (ev) {
      if (longFired) { ev.preventDefault(); longFired = false; }
      cancelPress();
    });
    root.addEventListener('pointercancel', cancelPress);
    root.addEventListener('pointermove', cancelPress);
  };

  /* ---------------- 2枚目の文章編集 ----------------
   * data-tkey を持つ要素が編集できる文章。
   * contenteditable の ON/OFF は app.js の applyPrefs が「編集中」に合わせて切り替える。 */
  YH.attachTextEditing = function (root) {
    function box(ev) { return ev.target.closest('[data-tkey]'); }

    root.addEventListener('input', function (ev) {
      var n = box(ev);
      if (!n) return;
      state.texts[n.dataset.tkey] = n.textContent;
      save();
      /* 長く書くと枠や用紙からはみ出すので、そのつど見る */
      YH.checkOverflow && YH.checkOverflow();
    });

    root.addEventListener('keydown', function (ev) {
      var n = box(ev);
      if (!n) return;
      /* Enter で改行させない（1つの文章として扱う）。Esc で編集をやめる */
      if (ev.key === 'Enter' || ev.key === 'Escape') {
        ev.preventDefault();
        n.blur();
      }
    });

    /* 他のソフトから貼り付けても、書式なしの文字だけにする */
    root.addEventListener('paste', function (ev) {
      var n = box(ev);
      if (!n) return;
      ev.preventDefault();
      var tx = (ev.clipboardData || window.clipboardData).getData('text');
      document.execCommand('insertText', false, tx.replace(/\s*\n\s*/g, ' '));
    });
  };

  load();
})(window.YH = window.YH || {});
