/* ============================================================
 * 起動とツールバー
 * ============================================================ */
(function (YH) {
  'use strict';

  var st = YH.state;

  function $(sel) { return document.querySelector(sel); }

  /* ---- 印刷する用紙の順番 ----
     1枚目＝縦書きの譜面、2枚目＝ガイド、3枚目＝将来の裏面 */
  /* ★2026-09-10 本人の指示で **2枚目（演奏の進め方）をやめた**。
     参考動画のQRと 左右の読みかただけを **1枚目の右下（昇殿の下のあき）** へ移してある
     （js/render.js の renderSideNote）。

     戻すときは、下の配列に YH.SHEET_GUIDE を入れ直すだけ。
     **データ（js/data-guide.js）も描画（renderGuideSheet）も消していない。**
     演奏順の図・各パートのポイントは、2枚目にしか無いのでいまは出ていない。 */
  function sheets() {
    return [YH.SHEET_FRONT, YH.SHEET_BACK].filter(Boolean);
  }

  function applyPrefs() {
    var r = document.documentElement;
    r.style.setProperty('--kana-size', st.kanaSize + 'mm');
    document.body.classList.toggle('show-beats', st.showBeats);
    document.body.classList.toggle('editing', st.editing);
    document.body.dataset.clickMode = st.clickMode;

    /* 2枚目の文章は「編集中」のときだけ書き換えられる。
       plaintext-only にして、書式つきの貼り付けを防いでいる */
    document.querySelectorAll('[data-tkey]').forEach(function (n) {
      n.setAttribute('contenteditable', st.editing ? 'plaintext-only' : 'false');
    });

    $('#btn-edit').setAttribute('aria-pressed', String(st.editing));
    $('#btn-edit').textContent = st.editing ? '編集中' : '編集オフ';
    $('#btn-mode').textContent = st.clickMode === 'hand' ? 'クリック：左右' : 'クリック：利きバチ';
    $('#btn-beats').setAttribute('aria-pressed', String(st.showBeats));
  }

  function build() {
    var pages = $('#pages');
    pages.innerHTML = '';
    sheets().forEach(function (s) {
      pages.appendChild(YH.renderSheet(s, true));
    });
    applyPrefs();
  }

  /* ============================================================
   * 用紙からはみ出していないか
   * ------------------------------------------------------------
   * 縦書きでは列が左へ伸びるので、上下左右すべてを見る。
   * 「はみ出しています」だけだと、どこを直せばよいか分からないので、
   * **どの用紙の・何が・どちらへ・何mm** 出ているかまで返す。
   * ============================================================ */

  /* 用紙の実寸（--page-w）から px → mm の比を出す */
  function mmPerPx(sheetRect) {
    var w = parseFloat(getComputedStyle(document.documentElement)
                       .getPropertyValue('--page-w')) || 267;
    return w / sheetRect.width;
  }

  /* セルなら「【ぶっつけ】の1列目」、枠なら枠の名前 */
  function nameOf(n) {
    var box = n.closest('.box');
    if (box) {
      var t = box.querySelector('.box-title');
      return t ? '「' + t.textContent + '」の枠' : '枠';
    }
    var sec = n.closest('.sec');
    var line = n.closest('.line');
    var secName = sec && sec.querySelector('.sec-name');
    if (secName && line) {
      return secName.textContent + 'の' + (+line.dataset.line + 1) + '列目';
    }
    if (secName) return secName.textContent + 'の見出し';
    return '譜面';
  }

  /* 1枚ぶんのはみ出しを調べて、いちばん大きいものを返す（無ければ null） */
  function overflowOf(sh) {
    var s = sh.getBoundingClientRect();
    var mm = mmPerPx(s);
    var worst = null;

    function keep(px, side, n) {
      if (px > 1 && (!worst || px > worst.px)) {
        worst = { px: px, side: side, what: nameOf(n) };
      }
    }

    /* ★.side-note（右下の参考動画）も見る。譜面の流れの外に絶対配置してあるので、
       ここに入れておかないと はみ出しても気づけない（2026-09-10） */
    sh.querySelectorAll('.cell, .sec-head, .line-head, .box, .side-note').forEach(function (n) {
      var q = n.getBoundingClientRect();
      keep(s.left - q.left, '左', n);
      keep(q.right - s.right, '右', n);
      keep(s.top - q.top, '上', n);
      keep(q.bottom - s.bottom, '下', n);
    });

    /* 枠自体は用紙の中にあっても、文章が長いと中身だけが枠から溢れて
       黙って切れる。中身がどこまで伸びているかを見る。

       ★ scrollHeight は使えない。`overflow: visible` の要素では
         はみ出した子を数えないので、いつも clientHeight と同じ値になる。
       ★ 枠の中の .box-body は flex アイテムだが `min-height: auto` なので
         中身より小さくならない。つまり**あふれるのは .box-body 自身**で、
         .box-body の中を見ても見つからない。**枠(.box)を基準に、
         中の要素すべての rect のいちばん下**を取る。 */
    sh.querySelectorAll('.box').forEach(function (bx) {
      var r = bx.getBoundingClientRect();
      var low = r.top;
      bx.querySelectorAll('*').forEach(function (c) {
        var q = c.getBoundingClientRect();
        if (q.height > 0 && q.bottom > low) low = q.bottom;
      });
      keep(low - r.bottom, '枠の外', bx);
    });

    if (!worst) return null;
    worst.mm = Math.round(worst.px * mm * 10) / 10;
    return worst;
  }

  /* 譜面の用紙（1枚目）だけを見る。文字サイズで直せるのはこちらだけ */
  function scoreOverflow() {
    var sh = document.querySelector('.score-sheet');
    return sh ? overflowOf(sh) : null;
  }

  function checkOverflow() {
    var msgs = [];
    document.querySelectorAll('.sheet').forEach(function (sh, i) {
      var o = overflowOf(sh);
      if (!o) return;
      msgs.push((i + 1) + '枚目：' + o.what + ' が' + o.side + 'へ ' +
                o.mm + 'mm はみ出しています。' +
                (sh.classList.contains('score-sheet')
                  ? '「文字 −」で小さくしてください。'
                  : '文章を短くしてください。'));
    });

    var n = $('#overflow');
    if (n) {
      n.hidden = !msgs.length;
      n.innerHTML = '<strong>用紙からはみ出しています。このままだと はみ出た分は印刷されません。</strong> '
                  + msgs.join(' / ');
    }
    return !!msgs.length;
  }
  YH.checkOverflow = checkOverflow;

  /* ---- 用紙に収まる大きさに合わせる ----
     同じ大きさでも、機械のフォントや Chrome の文字設定で列の幅・長さが
     少し変わるので、収まる機械と収まらない機械がある。
     **はじめて開いたときだけ**、既定の大きさから 0.1mm ずつ下げて収める。
     本人が「文字 −／＋」で決めたあとは触らない。 */
  function fitToPage() {
    if (st.sizeFromUser) return 0;

    var root = document.documentElement;
    var size = YH.DEFAULT_SIZE;
    var guard = 40;                     // 4.8mm → 0.8mm ぶん。念のための止め
    while (guard-- > 0) {
      root.style.setProperty('--kana-size', size + 'mm');
      if (!scoreOverflow() || size <= 2.6) break;
      size = Math.round((size - 0.1) * 10) / 10;
    }

    var shrunk = YH.DEFAULT_SIZE - size;
    st.kanaSize = size;
    applyPrefs();
    return shrunk;
  }
  YH.fitToPage = fitToPage;

  /* ---- 2枚目（ガイド）を用紙に収める ----
     1枚目と同じ理由（機械の書体差）で、こちらもあふれる。
     ただし直せるのは文字の大きさではなく**文章の折り返し行数**なので、
     --guide-scale で2枚目の文字を一括で縮めて収める。
     2枚目には「文字 −／＋」が無いので、本人の指定を気にしなくてよい。 */
  function guideOverflow() {
    var worst = null;
    document.querySelectorAll('.sheet').forEach(function (sh) {
      if (sh.classList.contains('score-sheet')) return;
      var o = overflowOf(sh);
      if (o && (!worst || o.px > worst.px)) worst = o;
    });
    return worst;
  }

  function fitGuide() {
    var root = document.documentElement;
    var scale = 1;
    var guard = 20;                     // 1.00 → 0.60 ぶん。念のための止め
    while (guard-- > 0) {
      root.style.setProperty('--guide-scale', String(scale));
      if (!guideOverflow() || scale <= 0.62) break;
      scale = Math.round((scale - 0.02) * 100) / 100;
    }
    return scale;
  }
  YH.fitGuide = fitGuide;

  /* 1枚目・2枚目をまとめて収めて、縮めたぶんを緑の帯で知らせる */
  function fitAll() {
    var shrunk = fitToPage();
    var scale = fitGuide();
    var msgs = [];
    if (shrunk >= 0.05) {
      msgs.push('1枚目の文字を ' + st.kanaSize.toFixed(1) + 'mm にしました'
              + '（もとは ' + YH.DEFAULT_SIZE.toFixed(1) + 'mm）');
    }
    if (scale <= 0.99) {
      msgs.push('2枚目の文字を ' + Math.round(scale * 100) + '% にしました');
    }
    var n = $('#fitted');
    if (n) {
      n.hidden = !msgs.length;
      n.textContent = 'このパソコンの書体では そのままだと用紙からはみ出すので、'
                    + msgs.join('／') + '。'
                    + '（印刷には影響しません。1枚目は「文字 ＋」で大きくもできます）';
    }
  }
  YH.fitAll = fitAll;

  /* ---- 「保存しました」の合図 ---- */
  var savedTimer = null;
  YH.flashSaved = function () {
    var n = $('#saved');
    if (!n) return;
    n.classList.add('on');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(function () { n.classList.remove('on'); }, 1200);
  };

  function wireToolbar() {
    $('#btn-edit').addEventListener('click', function () {
      st.editing = !st.editing;
      applyPrefs();
    });

    $('#btn-mode').addEventListener('click', function () {
      st.clickMode = st.clickMode === 'hand' ? 'accent' : 'hand';
      YH.save();
      applyPrefs();
    });

    $('#btn-beats').addEventListener('click', function () {
      st.showBeats = !st.showBeats;
      YH.save();
      applyPrefs();
      checkOverflow();
    });

    $('#btn-smaller').addEventListener('click', function () {
      st.kanaSize = Math.max(2.6, Math.round((st.kanaSize - 0.1) * 10) / 10);
      st.sizeFromUser = true;
      $('#fitted').hidden = true;
      YH.save();
      applyPrefs();
      checkOverflow();
    });

    $('#btn-bigger').addEventListener('click', function () {
      st.kanaSize = Math.min(7.0, Math.round((st.kanaSize + 0.1) * 10) / 10);
      st.sizeFromUser = true;
      $('#fitted').hidden = true;
      YH.save();
      applyPrefs();
      checkOverflow();
    });

    $('#btn-reset').addEventListener('click', function () {
      if (!confirm('左右・利きバチの編集をすべて消して、最初の状態にもどします。よろしいですか？')) return;
      YH.resetEdits();
      resetSize();
      build();
      fitAll();
      checkOverflow();
    });

    /* 文章だけを戻す。左右・利きバチは消さない（別々にしないと片方の巻き添えになる） */
    $('#btn-reset-text').addEventListener('click', function () {
      if (!confirm('2枚目の「各パートのポイント」の文章を、最初の文にもどします。よろしいですか？')) return;
      YH.resetTexts();
      build();
      fitAll();
      checkOverflow();
    });

    $('#btn-print').addEventListener('click', function () {
      window.print();
    });
  }

  /* 文字サイズを既定にもどす（「編集をもどす」で使う） */
  function resetSize() {
    st.sizeFromUser = false;
    st.kanaSize = YH.DEFAULT_SIZE;
  }

  document.addEventListener('DOMContentLoaded', function () {
    build();
    /* イベントは #pages に委譲する。#pages 自体は build() で作り直さないので、
       ここで1回だけ付ける。build() の中で付けると「もどす」を押すたびに
       リスナーが重なり、1クリックで2回ぶん進んでしまう。 */
    YH.attachEditing($('#pages'));
    YH.attachTextEditing($('#pages'));
    wireToolbar();

    /* 収める → 確認。書体が決まると字の幅が変わることがあるので、
       フォントの読み込みが終わってからもう一度やり直す。
       fitToPage() は毎回**既定の大きさから**探し直すので、
       一度小さくなったまま戻らない、ということにはならない。 */
    fitAll();
    checkOverflow();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { fitAll(); checkOverflow(); });
    }
    window.addEventListener('resize', checkOverflow);
  });
})(window.YH = window.YH || {});
