/* ============================================================
 * 描画（コンポーネント）
 * ------------------------------------------------------------
 *  1枚目 ＝ 譜面シート（縦書き・右から左）
 *     Section … 【ぶっつけ】などの名前の列 ＋ 譜面の列（1 line ＝ 1列）
 *       Line    … 縦1列。頭に小見出し（この曲では未使用）、その下に Cell が並ぶ
 *         Cell    … 文字 ＋ その右わきに │ と ●○
 *
 *  2枚目 ＝ ガイドシート（横書き）
 *     演奏順 / 参考動画 / 読み方 / 各パートのポイント
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

  /* ---------------- Line（＝縦1列） ----------------
   * 列の頭に 番号（①〜⑥）と小見出し（［地］［タマ］）を置く場所をつくる。
   *
   *   （あき）
   *   ①          ← num
   *   ［ぶっつけ］ ← label
   *   テン        ← ここから譜面
   *
   * 番号も小見出しも **譜面のすぐ上**（この場所の下端）に寄せる。CSS の
   * .line-head { justify-content: flex-end }。縦書きの主軸は上→下なので
   * flex-end ＝ 下。
   * 番号も小見出しも無い列にも同じ場所を空けるので、どの列も
   * 文字の始まる高さがそろう（元のプリントと同じ見え方）。 */
  function renderLine(line, sectionId, li, editable) {
    var kind = line.kind || 'kana';
    var node = el('div', 'line line-' + kind);
    node.dataset.line = li;

    /* 空の span は作らない。作ると flex の gap がそのぶん残り、
       番号だけの列と小見出しのある列で 譜面までのすきまがずれる */
    var head = el('div', 'line-head');
    if (line.num) head.appendChild(el('span', 'line-num', line.num));
    if (line.label) head.appendChild(el('span', 'line-label', line.label));
    node.appendChild(head);

    line.cells.forEach(function (cell, ci) {
      node.appendChild(renderCell(cell, kind, cellKey(sectionId, li, ci), editable));
    });
    return node;
  }

  /* ---------------- Section ---------------- */
  function renderSection(sec, editable) {
    var node = el('section', 'sec');
    node.dataset.section = sec.id;

    /* この曲は ①②③… の番号ではなく【ぶっつけ】のような名前で分かれている。
       num は使わないが、番号を振りたくなったときのために残してある */
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

    /* ★2026-09-10 2枚目をやめたので、参考動画のQRと左右の読みかたを
       **昇殿の下のあき**（用紙の右下）へ移した。中身は 2枚目のデータの使い回し。 */
    var v = YH.SHEET_GUIDE && YH.SHEET_GUIDE.video;
    if (v) area.appendChild(renderSideNote(v));

    page.appendChild(area);

    return page;
  }

  /* ---------------- 1枚目の右下（昇殿の下のあき）----------------
   * ・「参考動画」は QR の**上**
   * ・○＝左 / ●＝右 は QR の**右**
   *   （2026-09-10 本人の指示。読み方のうち 左右の2行だけを出す）
   *
   * ★**譜面の流れには入れず、絶対配置で置く。**
   *   流れに入れると列の長さに数えられ、fitToPage が文字を縮めてしまう。
   *   絶対配置なら **昇殿の譜面の大きさが変わらない**（本人の指示）。
   *
   * ★置ける場所は「いちばん下まで伸びている昇殿の列」より下だけ。
   *   文字を大きくすると列が伸びて ぶつかるので、CSS の --side-note-h を
   *   超えないようにしてある（はみ出しは赤い帯で知らせる）。 */
  function renderSideNote(v) {
    var n = el('aside', 'side-note');
    n.appendChild(el('div', 'sn-title', v.title));

    var row = el('div', 'sn-row');

    var frame = el('div', 'qr-frame sn-qr');
    var svg = v.qr && YH.QR ? YH.QR[v.qr] : null;
    if (svg) frame.innerHTML = svg;
    else frame.classList.add('qr-empty');
    row.appendChild(frame);

    /* 読み方のうち **印のある行（○＝左 / ●＝右）だけ**を出す。
       く・ー・（　）の説明は 2枚目にしか無いので、いまは出ていない */
    var ul = el('ul', 'legend-list sn-legend');
    ((YH.LEGEND && YH.LEGEND.items) || []).forEach(function (it) {
      if (!it.mark) return;
      var li = el('li');
      li.appendChild(el('span', 'lg-mark', it.mark));
      li.appendChild(el('span', 'lg-tx', it.text));
      ul.appendChild(li);
    });
    row.appendChild(ul);

    n.appendChild(row);
    return n;
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

  /* ---------------- 演奏順（図） ----------------
   * 全部インラインSVGなので白黒印刷でも潰れず、拡大しても荒れない。
   *
   * ★★ この曲の図は「仮」です。★★
   *   くりかえしや戻りをまだ聞いていないので、一直線にしてあります。
   *
   *      ［はじめ］⇓［昇殿］⇓［神田丸］⇓［おわり］
   *
   *   手描きの図をもらったら、下の renderPlayMap の座標を描き直してください。
   *   部品（blockArrow / arrow / curveArrow / loopBelow / dashArrow / svVText）は
   *   曲によらず使えるので、描き直すときの土台になります。
   *     ・中抜きの太い矢印（blockArrow）… 先へ進むながれ
   *     ・細い線（arrow）              … くりかえし・枝分かれ・もどり
   *
   * 座標はこの図に固有なのでここに直書きする（data-map.js は文字だけ持つ）。
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

  /* 縦書きの文字（【カマクラ】など）。
     SVG の text にも writing-mode が効くので、1文字ずつ置かなくてよい。
     text-orientation: upright にしないと 【 】 が横倒しのまま出る。 */
  function svVText(x, y, s, cls) {
    return svText(x, y, s, cls + ' mg-tx-v');
  }

  function f(n) { return (+n).toFixed(2); }

  /* 中抜きの太い矢印（手描きの ⇓ にあたる）。線だけで塗らない */
  function blockArrow(x, y1, y2, w) {
    var len = y2 - y1;
    var head = Math.min(4.5, len * 0.5);
    var hw = w * 2.2;
    var sEnd = y1 + len - head;
    var pts = [
      [x - w, y1], [x - w, sEnd], [x - hw, sEnd], [x, y2],
      [x + hw, sEnd], [x + w, sEnd], [x + w, y1]
    ];
    return sv('polygon', {
      class: 'mg-arrow',
      points: pts.map(function (q) { return f(q[0]) + ',' + f(q[1]); }).join(' ')
    });
  }

  /* 細い矢印。点をつないで最後に矢じりを付ける（折れ線でもよい） */
  function arrow(points) {
    return sv('path', {
      class: 'mg-line', 'marker-end': 'url(#mg-head)',
      d: 'M' + points.map(function (q) { return f(q[0]) + ',' + f(q[1]); }).join(' L')
    });
  }

  /* 線だけ（矢じりなし） */
  function plain(points) {
    return sv('path', {
      class: 'mg-line',
      d: 'M' + points.map(function (q) { return f(q[0]) + ',' + f(q[1]); }).join(' L')
    });
  }

  /* 点線の矢印。この図では「あいだに たま が入る」という意味 */
  function dashArrow(points) {
    return sv('path', {
      class: 'mg-line mg-dash', 'marker-end': 'url(#mg-head)',
      d: 'M' + points.map(function (q) { return f(q[0]) + ',' + f(q[1]); }).join(' L')
    });
  }

  /* 曲がる矢印。(x1,y1) から (cx,cy) をふくらみにして (x2,y2) へ。
     dashed を true にすると点線になる（＝たま） */
  function curveArrow(x1, y1, cx, cy, x2, y2, dashed) {
    return sv('path', {
      class: 'mg-line' + (dashed ? ' mg-dash' : ''),
      'marker-end': 'url(#mg-head)',
      d: 'M' + f(x1) + ',' + f(y1) + ' Q' + f(cx) + ',' + f(cy) + ' ' + f(x2) + ',' + f(y2)
    });
  }

  /* ぐるっと回る矢印（＝くりかえす）。(x,y) から下へ ふくらんで、もどってくる */
  function loopBelow(x, y, r) {
    var a = { x: x - r * 0.72, y: y + r * 0.72 };
    var b = { x: x + r * 0.72, y: y + r * 0.72 };
    return sv('path', {
      class: 'mg-line', 'marker-end': 'url(#mg-head)',
      d: 'M' + f(a.x) + ',' + f(a.y) +
         ' C' + f(x - r * 2.4) + ',' + f(y + r * 3.4) +
         ' ' + f(x + r * 2.4) + ',' + f(y + r * 3.4) +
         ' ' + f(b.x) + ',' + f(b.y)
    });
  }

  function renderPlayMap(data) {
    var b = box('map-box', data.title);
    /* 中身が未定のときは見出しだけの枠（start を消せば空にもどる） */
    if (!data.start) return b;

    /* viewBox は枠の中身の縦横比（実測 111mm × 94mm ＝ 0.85）に合わせる。
       余らせると図が片寄って見える。
       ★数を大きめに取ってあるのは、文字（mg-tx-box は 5.5 単位）が
         紙の上で 3mm くらいになるようにするため。単位を小さく取ると
         同じ 5.5 が巨大な字になる。 */
    var svg = sv('svg', {
      class: 'mgraph', viewBox: '0 0 190 160',
      preserveAspectRatio: 'xMidYMid meet', role: 'img'
    });

    /* 細い矢印の先っぽ（いまの図では使っていないが、枝分かれを足すときに要る） */
    var defs = sv('defs');
    var mk = sv('marker', {
      id: 'mg-head', viewBox: '0 0 10 10', refX: 8, refY: 5,
      markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse'
    });
    mk.appendChild(sv('path', { class: 'mg-head', d: 'M0,1 L9,5 L0,9' }));
    defs.appendChild(mk);
    svg.appendChild(defs);

    /* ---- 置き場所 ----
       AX … まんなかの縦のながれ
       四角の高さは 15。上下の端は y±7.5 になる。
       四角と四角は 9 以上あける（近すぎると太い矢印が矢じりだけになる）。
       ここは 40 あけているので、矢印の長さは 25。 */
    var AX = 95, BH = 15;

    var boxes = [
      { x: AX, y: 20,  w: 46, h: BH, label: data.start },
      { x: AX, y: 60,  w: 46, h: BH, label: data.shouden },
      { x: AX, y: 100, w: 54, h: BH, label: data.kandamaru },
      { x: AX, y: 140, w: 46, h: BH, label: data.end }
    ];

    var g = sv('g', null);

    /* ★いまは「そのまま先へ進む」だけなので、中抜きの太い矢印3本だけ。
       枝分かれ・くりかえしが入ったら arrow() の細い線で描き分けること。 */
    g.appendChild(blockArrow(AX, 27.5, 52.5, 2.2));
    g.appendChild(blockArrow(AX, 67.5, 92.5, 2.2));
    g.appendChild(blockArrow(AX, 107.5, 132.5, 2.2));

    svg.appendChild(g);

    /* ---- 四角と、その中の文字 ---- */
    boxes.forEach(function (d) {
      svg.appendChild(sv('rect', {
        class: 'mg-box', x: d.x - d.w / 2, y: d.y - d.h / 2, width: d.w, height: d.h
      }));
      svg.appendChild(svText(d.x, d.y, d.label, 'mg-tx mg-tx-box'));
    });

    /* ---- 凡例 ----
       矢印が1種類しかないうちは出さない。data-map.js の legend に文字を入れると出る。
       ★文字は .mg-tx-legend。CSS に font-size が無いと
         SVG の既定（16単位）で出て、枠から大きくあふれる。 */
    if (data.legend) {
      var LY = 50;
      svg.appendChild(sv('rect', { class: 'mg-box', x: 2, y: LY - 7, width: 40, height: 14 }));
      svg.appendChild(arrow([[9, LY - 5], [9, LY + 5]]));
      svg.appendChild(svText(27, LY, data.legend, 'mg-tx mg-tx-legend'));
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

  /* ---------------- 節ごとのポイント ----------------
   * 名前と本文は画面で書き換えられる。data-tkey が保存キー。
   * キーは points の id で決まるので、並び順を変えてもずれない。 */
  function renderPoints(data) {
    var b = box('points-box', data.pointsTitle);
    var ul = el('ul', 'points-list');
    data.points.forEach(function (p) {
      var li = el('li');
      if (p.num) li.appendChild(el('span', 'pt-num', p.num));

      /* 名前と本文は別の段にする（CSS で横に並べる）。
         1つの流れにすると、本文が名前の真下に回り込んで境目が分からなくなる。 */
      var tx = el('span', 'pt-tx');
      tx.appendChild(editableText('b', 'pt-name', 'pt/' + p.id + '/name', p.name));
      tx.appendChild(editableText('span', 'pt-body', 'pt/' + p.id + '/text', p.text));

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

    /* 左は 上2/3＝演奏順の図、下1/3＝参考動画 */
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
