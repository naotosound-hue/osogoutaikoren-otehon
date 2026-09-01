/* ============================================================
 * 描画（コンポーネント）
 * ------------------------------------------------------------
 *  1枚目 ＝ 譜面シート（縦書き・右から左）
 *     Section … ①＋名前の列 ＋ 譜面の列（1 line ＝ 1列）
 *       Line    … 縦1列。上から下へ Cell が並ぶ
 *         Cell    … 文字 ＋ その右わきに │ と ●○
 *
 *  2枚目 ＝ ガイドシート（横書き）
 *     えんそうのじゅんばん / 説明欄 / たたくときのポイント / 文章の枠
 * ============================================================ */
(function (YH) {
  'use strict';

  var HAND_MARK = { R: '●', L: '○' };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /** 画面で書き換えられる文章。保存された文があればそれを表示する */
  function editableText(tag, cls, tkey, original) {
    var n = el(tag, cls, YH.getText(tkey, original));
    n.dataset.tkey = tkey;
    return n;
  }

  /** 文字列でもオブジェクトでも受け取れるようにする */
  function normCell(c, lineKind) {
    var base = (typeof c === 'string') ? { t: c } : c;
    return {
      t: base.t,
      h: base.h || null,
      a: !!base.a,
      /* 笛の列の中は、指定がなければ全部「笛」あつかい */
      k: base.k || (lineKind === 'fue' ? 'fue' : 'kana')
    };
  }
  YH.normCell = normCell;

  /** セルの保存キー（データの並び順で決まる） */
  function cellKey(sectionId, li, ci) {
    return sectionId + '-' + li + '-' + ci;
  }
  YH.cellKey = cellKey;

  function chars(s) {
    return Array.from ? Array.from(s) : String(s).split('');
  }

  /* ------------------------------------------------------------
   * 語のどこに印を置くか（data-legend.js の HAND_POS より）
   *
   * 返すのは印1つぶんの情報の配列:
   *   at   … 語の頭から何文字ぶん下か（印を置く位置）
   *   from … クリックを受け付ける範囲の始まり
   *   to   … 同じく終わり
   *
   * クリック範囲は語全体を印の数だけに分け合う。印が1つなら語全体。
   * ------------------------------------------------------------ */
  function markSlots(text) {
    var n = chars(text).length;
    var spec = (YH.HAND_POS && YH.HAND_POS[text]) || 'center';

    if (spec === 'center' || !spec.length) {
      return [{ at: n / 2 - 0.5, from: 0, to: n }];
    }
    return spec.map(function (p, i) {
      return {
        at: p,
        from: (i === 0) ? 0 : p,
        to: (i === spec.length - 1) ? n : spec[i + 1]
      };
    });
  }
  YH.markSlots = markSlots;

  /* ============================================================
   * 1枚目：譜面（縦書き）
   * ============================================================ */

  /* ---------------- Cell ----------------
   * 1つの語に、叩く数だけ印を置く。印は語の頭から --at 文字ぶん下に、
   * 文字の右わきへ絶対配置する（内側に │、外側に ●○）。
   * 保存キーは セルのキー + '-' + 印の番号。 */
  function renderCell(cell, lineKind, key, editable) {
    var c = normCell(cell, lineKind);

    var node = el('span', 'cell k-' + c.k);
    node.dataset.key = key;

    node.appendChild(el('span', 'kana', c.t));

    /* 小太鼓が叩かないもの（笛・大太鼓）と記号（※）は左右・利きバチを持たない。
       この譜面は小太鼓の子が使うので、叩かない音に左右の指示があると
       誤って押したまま印刷される */
    var slots = (c.k === 'fue' || c.k === 'odaiko' || c.k === 'mark') ? [] : markSlots(c.t);

    var marks = el('span', 'marks');
    var hits = el('span', 'hits');

    slots.forEach(function (s, mi) {
      /* データに書かれた初期値は 1つめの印にだけ効かせる */
      var st = YH.getCellState(key + '-' + mi, mi === 0 ? c : {});

      var mk = el('span', 'mk');
      mk.dataset.mk = mi;
      mk.style.setProperty('--at', s.at + 'em');

      var acc = el('span', 'mk-acc' + (st.a ? ' on' : ''));
      acc.setAttribute('aria-label', st.a ? '利きバチ' : '');
      mk.appendChild(acc);
      mk.appendChild(el('span', 'mk-hand', st.h ? HAND_MARK[st.h] : ''));
      marks.appendChild(mk);

      /* クリックを受ける透明の帯。文字の上にかぶせる */
      if (editable) {
        var hit = el('span', 'hit');
        hit.dataset.mk = mi;
        hit.style.setProperty('--from', s.from + 'em');
        hit.style.setProperty('--span', (s.to - s.from) + 'em');
        hits.appendChild(hit);
      }
    });

    node.appendChild(marks);
    if (slots.length && editable) {
      node.dataset.editable = '1';
      node.appendChild(hits);
    }

    var beat = YH.BEATS ? YH.BEATS[c.t] : undefined;
    if (beat !== undefined) node.appendChild(el('span', 'beat', String(beat)));

    return node;
  }

  /* ---------------- Line（＝縦1列） ---------------- */
  function renderLine(line, sectionId, li, editable) {
    var kind = line.kind || 'kana';
    var node = el('div', 'line line-' + kind);
    node.dataset.line = li;
    line.cells.forEach(function (cell, ci) {
      node.appendChild(renderCell(cell, kind, cellKey(sectionId, li, ci), editable));
    });
    return node;
  }

  /* ---------------- Section ---------------- */
  function renderSection(sec, editable) {
    var node = el('section', 'sec');
    node.dataset.section = sec.id;

    /* いまは番号（①〜⑥）を出していない。
       data-score-front.js のセクションに num を足せば出る */
    var head = el('div', 'sec-head');
    if (sec.num) head.appendChild(el('span', 'sec-num', sec.num));
    if (sec.name) head.appendChild(el('span', 'sec-name', sec.name));
    node.appendChild(head);

    /* 縦書きでは列が右から左へ並ぶので、DOM の順番がそのまま元の順番になる */
    sec.lines.forEach(function (line, li) {
      node.appendChild(renderLine(line, sec.id, li, editable));
    });

    return node;
  }

  function renderScoreSheet(sheet, editable) {
    var page = el('div', 'sheet score-sheet');
    page.dataset.sheet = sheet.id;

    var head = el('header', 'sheet-head');
    head.appendChild(el('h1', 'sheet-title', sheet.title));
    if (sheet.subtitle) head.appendChild(el('span', 'sheet-sub', sheet.subtitle));
    page.appendChild(head);

    var area = el('div', 'score-area');
    sheet.sections.forEach(function (sec) {
      area.appendChild(renderSection(sec, editable));
    });
    page.appendChild(area);

    return page;
  }

  /* ============================================================
   * 2枚目：ガイド（横書き）
   * ============================================================ */

  function box(cls, title) {
    var b = el('section', 'box ' + cls);
    if (title) b.appendChild(el('h2', 'box-title', title));
    var body = el('div', 'box-body');
    b.appendChild(body);
    b._body = body;
    return b;
  }

  /* ---------------- えんそうのじゅんばん（図） ----------------
   * 手描きの図をそのまま起こす。全部インラインSVGなので
   * 白黒印刷でも潰れず、拡大しても荒れない。
   *
   *   はじめ ⇓ ふえ ⇓ ぶっつけ
   *                   ↘
   *                    かえ違い ⇄ 乱拍子 ⇄ 刻み   （この3つをぐるぐる回る）
   *                                          ⇓
   *                                        切り ⇓ おわり
   *
   * もとは ①③④⑤⑥ を丸で描いていたが、節の名前（4文字）に変えたので
   * 全部四角にした。丸のままだと名前が入らない。
   * ------------------------------------------------------------ */
  var SVGNS = 'http://www.w3.org/2000/svg';

  function sv(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    return n;
  }

  function svText(x, y, s, cls) {
    var t = sv('text', { x: x, y: y, class: cls });
    t.textContent = s;
    return t;
  }

  /* 四角のふちの点（矢印の始点・終点に使う）。gap ぶん外側に離す。
     中心から towards へ伸ばした線と、四角の辺の交わるところ。 */
  function edgeOf(node, towards, gap) {
    var dx = towards.x - node.x, dy = towards.y - node.y;
    var hw = node.w / 2 + (gap || 0), hh = node.h / 2 + (gap || 0);
    var tx = dx ? hw / Math.abs(dx) : Infinity;
    var ty = dy ? hh / Math.abs(dy) : Infinity;
    var t = Math.min(tx, ty);
    return { x: node.x + dx * t, y: node.y + dy * t };
  }

  /* 中抜きの太い矢印（手描きの ⇓ にあたる）。線だけで塗らない */
  function blockArrow(a, b, w) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;   // 進む向き
    var px = -uy, py = ux;              // その直角
    var head = Math.min(5.5, len * 0.5);
    var hw = w * 2.2;                   // 矢じりの半幅
    var s = len - head;                 // 軸のおわり
    function p(alongLen, side) {
      return (a.x + ux * alongLen + px * side).toFixed(2) + ',' +
             (a.y + uy * alongLen + py * side).toFixed(2);
    }
    return sv('polygon', {
      class: 'mg-arrow',
      points: [p(0, w), p(s, w), p(s, hw), p(len, 0), p(s, -hw), p(s, -w), p(0, -w)].join(' ')
    });
  }

  /* ふくらんだ細い矢印。center から遠ざかる側へふくらませる */
  function curveArrow(a, b, center, bulge) {
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y;
    var l = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / l, ny = dx / l;
    var side = (nx * (mx - center.x) + ny * (my - center.y)) >= 0 ? 1 : -1;
    var cx = mx + nx * bulge * side, cy = my + ny * bulge * side;
    return sv('path', {
      class: 'mg-curve',
      'marker-end': 'url(#mg-head)',
      d: 'M' + a.x.toFixed(2) + ',' + a.y.toFixed(2) +
         ' Q' + cx.toFixed(2) + ',' + cy.toFixed(2) +
         ' ' + b.x.toFixed(2) + ',' + b.y.toFixed(2)
    });
  }

  function renderPlayMap(data) {
    var b = box('map-box', data.title);

    /* viewBox は中身にぴったり合わせる。余らせると図が片寄って見える */
    var svg = sv('svg', {
      class: 'mgraph',
      viewBox: '0 0 100 158',
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img'
    });

    /* 細い矢印の先っぽ */
    var defs = sv('defs');
    var mk = sv('marker', {
      id: 'mg-head', viewBox: '0 0 10 10', refX: 8, refY: 5,
      markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse'
    });
    mk.appendChild(sv('path', { class: 'mg-head', d: 'M0,1 L9,5 L0,9' }));
    defs.appendChild(mk);
    svg.appendChild(defs);

    /* ---- 置き場所（手描きの配置に合わせる）。
           全部 四角。w / h は矢印のふちを出すのにも使う ---- */
    var H = 11;
    var start = { x: 62, y: 8,   w: 28, h: H, label: data.start };
    var fue   = { x: 62, y: 28,  w: 28, h: H, label: data.fue };
    var one   = { x: 62, y: 50,  w: 30, h: H, label: data.head };
    var c3    = { x: 50, y: 74,  w: 30, h: H, label: data.cycle[0] };
    var c4    = { x: 19, y: 99,  w: 28, h: H, label: data.cycle[1] };
    var c5    = { x: 80, y: 99,  w: 24, h: H, label: data.cycle[2] };
    var six   = { x: 50, y: 127, w: 24, h: H, label: data.tail };
    var end   = { x: 50, y: 147, w: 28, h: H, label: data.end };
    var nodes = [start, fue, one, c3, c4, c5, six, end];
    var ring  = { x: (c3.x + c4.x + c5.x) / 3, y: (c3.y + c4.y + c5.y) / 3 };

    /* ---- 矢印（先に描いて、四角の下に敷く） ---- */
    var g = sv('g', null);
    /* はじめ ⇓ ふえ ⇓ ぶっつけ */
    g.appendChild(blockArrow({ x: 62, y: start.y + H / 2 }, { x: 62, y: fue.y - H / 2 }, 1.5));
    g.appendChild(blockArrow({ x: 62, y: fue.y + H / 2 }, { x: 62, y: one.y - H / 2 }, 1.5));
    /* ぶっつけ → かえ違い */
    g.appendChild(curveArrow(edgeOf(one, c3, 0.5), edgeOf(c3, one, 2), { x: 85, y: 62 }, 4));
    /* かえ違い → 乱拍子 → 刻み → かえ違い のくりかえし */
    g.appendChild(curveArrow(edgeOf(c3, c4, 0.5), edgeOf(c4, c3, 2), ring, 5));
    g.appendChild(curveArrow(edgeOf(c4, c5, 0.5), edgeOf(c5, c4, 2), ring, 5));
    g.appendChild(curveArrow(edgeOf(c5, c3, 0.5), edgeOf(c3, c5, 2), ring, 5));
    /* 刻み ⇓ 切り ⇓ おわり */
    g.appendChild(blockArrow(edgeOf(c5, six, 0.5), edgeOf(six, c5, 0.5), 1.5));
    g.appendChild(blockArrow({ x: 50, y: six.y + H / 2 }, { x: 50, y: end.y - H / 2 }, 1.5));
    svg.appendChild(g);

    /* ---- 四角と、その中の文字 ---- */
    nodes.forEach(function (d) {
      svg.appendChild(sv('rect', {
        class: 'mg-box', x: d.x - d.w / 2, y: d.y - d.h / 2, width: d.w, height: d.h, rx: 1
      }));
      svg.appendChild(svText(d.x, d.y, d.label, 'mg-tx mg-tx-box'));
    });

    /* ---- 凡例（↓ は 地） ---- */
    if (data.legend) {
      svg.appendChild(sv('rect', {
        class: 'mg-box', x: 2, y: 70, width: 26, height: 14, rx: 1
      }));
      svg.appendChild(svText(15, 77, data.legend, 'mg-tx mg-tx-legend'));
    }

    b._body.appendChild(svg);
    return b;
  }

  /* ---------------- 説明欄 ---------------- */
  function renderLegend(data) {
    var b = box('legend-box', data.title);
    var ul = el('ul', 'legend-list');
    data.items.forEach(function (it) {
      var li = el('li');
      if (it.mark) li.appendChild(el('span', 'lg-mark', it.mark));
      li.appendChild(el('span', 'lg-tx', it.text));
      ul.appendChild(li);
    });
    b._body.appendChild(ul);
    return b;
  }

  /* ---------------- たたくときのポイント ----------------
   * 名前と本文は画面で書き換えられる。data-tkey が保存キー。
   * キーは points[].key で決まるので、並び順を変えてもずれない。
   * ★ key の中身（'①'〜'⑥'）は**画面には出さない**。
   *   書き直した文章がこのキーで保存されているので、値を変えないこと。 */
  function renderPoints(data) {
    var b = box('points-box', data.pointsTitle);
    var ul = el('ul', 'points-list');
    data.points.forEach(function (p) {
      var li = el('li');

      /* 名前と本文は別の段にする（CSS で横に並べる）。
         1つの流れにすると、本文が名前の真下に回り込んで境目が分からなくなる。 */
      var tx = el('span', 'pt-tx');
      tx.appendChild(editableText('b', 'pt-name', 'pt/' + p.key + '/name', p.name));
      tx.appendChild(editableText('span', 'pt-body', 'pt/' + p.key + '/text', p.text));

      li.appendChild(tx);
      ul.appendChild(li);
    });
    b._body.appendChild(ul);
    return b;
  }

  /* ---------------- 参考動画の欄 ----------------
   * お手本ページ（LP）へのQRコードを1つ。右に読みかたを添える。
   * QRがまだ無いあいだは点線の空き枠を出す。
   * 見出しと説明は画面でクリックして書ける。 */
  function renderVideo(v) {
    var b = box('video-box', v.title);
    var row = el('div', 'qr-single');

    var frame = el('div', 'qr-frame');
    var svg = v.qr && YH.QR ? YH.QR[v.qr] : null;
    if (svg) frame.innerHTML = svg;
    else frame.classList.add('qr-empty');
    row.appendChild(frame);

    var tx = el('div', 'qr-tx');
    tx.appendChild(editableText('div', 'qr-head', 'video/heading', v.heading || ''));
    tx.appendChild(editableText('div', 'qr-note', 'video/note', v.note || ''));
    row.appendChild(tx);

    b._body.appendChild(row);
    return b;
  }

  function renderGuideSheet(sheet) {
    var page = el('div', 'sheet guide-sheet');
    page.dataset.sheet = sheet.id;

    var head = el('header', 'sheet-head');
    head.appendChild(el('h1', 'sheet-title', sheet.title));
    if (sheet.subtitle) head.appendChild(el('span', 'sheet-sub', sheet.subtitle));
    page.appendChild(head);

    var body = el('div', 'guide-body');

    /* 左は 上2/3＝じゅんばんの図、下1/3＝参考動画 */
    var left = el('div', 'guide-col guide-left');
    left.appendChild(renderPlayMap(YH.PLAY_MAP));
    if (sheet.video) left.appendChild(renderVideo(sheet.video));
    body.appendChild(left);

    var right = el('div', 'guide-col guide-right');
    right.appendChild(renderLegend(YH.LEGEND));
    right.appendChild(renderPoints(sheet));
    body.appendChild(right);

    page.appendChild(body);
    return page;
  }

  /* ============================================================
   * 入口
   * ============================================================ */
  YH.renderSheet = function (sheet, editable) {
    if (sheet.kind === 'guide') return renderGuideSheet(sheet);
    return renderScoreSheet(sheet, editable);
  };
})(window.YH = window.YH || {});
