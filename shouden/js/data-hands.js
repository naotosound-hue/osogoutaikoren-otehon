/* ============================================================
 * 左右（●○）の初期値
 * ------------------------------------------------------------
 * ★このファイルは手で書きません。画面で付けたものを書き出して貼ります。
 *
 * 譜面メーカーで文字をクリックして付けた左右は、ふだんは
 * その人の端末の localStorage にしか残りません。
 * **公開版を「最初から印が付いた状態」で開かせるには、ここに焼き込みます。**
 *
 * ■ 書き出しかた
 *   譜面メーカーを開いて F12 → Console で
 *     copy(localStorage.getItem('shouden-kandamaru-score/v1'))
 *   出てきた JSON の edits を、このファイルの形に直して貼る。
 *
 * ■ キーの形     セクション-列-語-打（どれも0始まり）
 *   'kandamaru-3-2-4' … 神田丸の 4列目・3語目・5打目
 *   **1語が何打かは語による**（「トン」は1打、「（ドドスクド）」は4打）。
 *   data-score-front.js の h: は **1語の1打目にしか効かない**ので、
 *   2打目以降を既定にするにはこのファイルが要る（render.js の renderCell）。
 *
 * ■ 優先順位
 *   その人が画面で付けた値（localStorage） > ここの値 > なし
 *   「編集をもどす」を押すと、ここの状態に戻る。
 *
 * ■ ★書き出した JSON をそのまま貼らないこと
 *   localStorage には**古い譜面データ時代の指定が残っている**。
 *   2026-09-10 の書き出しでは 10件が「いまは存在しないセル・打」を指していた
 *   （神田丸が14列→15列に差し替わる前のものなど）。**描画されないので実害は
 *   無いが、貼ると中身が信用できなくなる。** 貼る前にこの検算をする:
 *
 *     描画されているスロットの集合 と HANDS のキーを突き合わせ、
 *     余ったキーを捨てる（ブラウザの Console で確認できる）
 *
 * ------------------------------------------------------------
 * 書き出し日 2026-09-10
 * 件数       244 個（右● 128 / 左○ 114 / なし 2）
 * 利きバチ   0 個（付いていない）
 * 除いた残骸 10 個
 * ============================================================ */
(function (YH) {
  'use strict';

  YH.HANDS = {

    /* 昇殿 1列目 */
    'shouden-0-0-0': 'R',
    'shouden-0-2-0': 'R',
    'shouden-0-4-0': 'R',
    'shouden-0-6-0': 'R',
    'shouden-0-6-1': 'L',
    'shouden-0-6-2': 'L',
    'shouden-0-6-3': 'R',

    /* 昇殿 2列目 */
    'shouden-1-0-0': 'R',
    'shouden-1-0-1': 'L',
    'shouden-1-0-2': 'R',
    'shouden-1-1-0': 'L',
    'shouden-1-1-1': 'R',
    'shouden-1-2-0': 'L',
    'shouden-1-3-0': 'L',
    'shouden-1-3-1': 'R',

    /* 昇殿 3列目 */
    'shouden-2-0-0': 'L',
    'shouden-2-2-0': 'R',
    'shouden-2-2-1': 'L',

    /* 昇殿 4列目 */
    'shouden-3-0-0': 'R',
    'shouden-3-1-0': 'L',
    'shouden-3-1-1': 'L',
    'shouden-3-2-0': 'R',
    'shouden-3-4-0': 'R',
    'shouden-3-5-0': 'L',

    /* 昇殿 5列目 */
    'shouden-4-0-0': 'R',
    'shouden-4-3-0': 'R',
    'shouden-4-4-0': 'L',
    'shouden-4-5-0': 'R',
    'shouden-4-6-0': 'L',

    /* 昇殿 6列目 */
    'shouden-5-0-0': 'R',
    'shouden-5-0-1': 'L',
    'shouden-5-1-0': 'R',

    /* 神田丸 1列目 */
    'kandamaru-0-0-0': 'R',
    'kandamaru-0-1-0': 'L',
    'kandamaru-0-2-0': 'L',
    'kandamaru-0-2-1': 'R',
    'kandamaru-0-3-0': 'R',
    'kandamaru-0-4-0': 'L',
    'kandamaru-0-5-0': 'L',
    'kandamaru-0-5-1': 'R',
    'kandamaru-0-6-0': 'R',
    'kandamaru-0-7-0': 'L',
    'kandamaru-0-8-0': 'R',
    'kandamaru-0-9-0': 'L',

    /* 神田丸 2列目 */
    'kandamaru-1-0-0': 'R',
    'kandamaru-1-1-0': 'L',
    'kandamaru-1-2-0': 'R',
    'kandamaru-1-3-0': 'L',
    'kandamaru-1-3-1': 'R',
    'kandamaru-1-4-0': 'L',
    'kandamaru-1-5-0': 'R',
    'kandamaru-1-6-0': 'R',
    'kandamaru-1-6-1': 'L',
    'kandamaru-1-7-0': 'L',
    'kandamaru-1-8-0': 'R',
    'kandamaru-1-9-0': 'L',
    'kandamaru-1-10-0': 'R',
    'kandamaru-1-10-1': 'L',
    'kandamaru-1-10-2': 'R',
    'kandamaru-1-11-0': 'R',
    'kandamaru-1-11-1': 'L',
    'kandamaru-1-11-2': 'R',

    /* 神田丸 3列目 */
    'kandamaru-2-0-0': 'R',
    'kandamaru-2-1-0': 'R',
    'kandamaru-2-1-1': 'L',
    'kandamaru-2-1-2': 'L',
    'kandamaru-2-2-0': 'R',
    'kandamaru-2-2-1': 'R',
    'kandamaru-2-2-2': 'L',
    'kandamaru-2-3-0': 'L',
    'kandamaru-2-3-1': 'L',
    'kandamaru-2-4-0': 'R',
    'kandamaru-2-4-1': 'L',
    'kandamaru-2-5-0': 'L',
    'kandamaru-2-5-1': 'L',
    'kandamaru-2-6-0': 'R',

    /* 神田丸 4列目 */
    'kandamaru-3-0-0': 'R',
    'kandamaru-3-0-1': 'L',
    'kandamaru-3-0-2': 'R',
    'kandamaru-3-0-3': 'L',
    'kandamaru-3-1-0': 'R',
    'kandamaru-3-1-1': 'L',
    'kandamaru-3-1-2': 'R',
    'kandamaru-3-1-3': 'L',
    'kandamaru-3-2-0': 'R',
    'kandamaru-3-2-1': 'L',
    'kandamaru-3-2-2': 'R',
    'kandamaru-3-2-3': 'L',
    'kandamaru-3-2-4': 'R',

    /* 神田丸 5列目 */
    'kandamaru-4-0-0': 'R',
    'kandamaru-4-1-0': 'L',
    'kandamaru-4-1-1': 'L',
    'kandamaru-4-2-0': 'R',
    'kandamaru-4-3-0': 'L',
    'kandamaru-4-4-0': 'L',
    'kandamaru-4-4-1': 'L',
    'kandamaru-4-5-0': 'R',
    'kandamaru-4-6-0': 'L',

    /* 神田丸 6列目 */
    'kandamaru-5-0-0': 'R',
    'kandamaru-5-0-1': 'L',
    'kandamaru-5-1-0': 'R',
    'kandamaru-5-2-0': 'L',
    'kandamaru-5-3-0': 'R',
    'kandamaru-5-4-0': 'L',
    'kandamaru-5-5-0': 'R',
    'kandamaru-5-5-1': 'L',
    'kandamaru-5-5-2': 'R',
    'kandamaru-5-6-0': 'R',
    'kandamaru-5-6-1': 'L',
    'kandamaru-5-6-2': 'R',
    'kandamaru-5-7-0': 'R',
    'kandamaru-5-7-1': 'L',
    'kandamaru-5-7-2': 'R',
    'kandamaru-5-8-0': 'R',
    'kandamaru-5-8-1': 'L',
    'kandamaru-5-8-2': 'R',
    'kandamaru-5-9-0': 'R',
    'kandamaru-5-9-1': 'L',
    'kandamaru-5-9-2': 'R',

    /* 神田丸 7列目 */
    'kandamaru-6-0-0': 'R',
    'kandamaru-6-0-1': 'L',
    'kandamaru-6-0-2': 'L',
    'kandamaru-6-1-0': 'L',
    'kandamaru-6-1-1': 'R',
    'kandamaru-6-2-0': 'R',
    'kandamaru-6-2-1': 'L',
    'kandamaru-6-2-2': 'L',
    'kandamaru-6-3-0': 'R',

    /* 神田丸 8列目 */
    'kandamaru-7-0-0': 'R',
    'kandamaru-7-0-1': 'L',
    'kandamaru-7-0-2': 'L',
    'kandamaru-7-1-0': 'R',
    'kandamaru-7-2-0': 'L',
    'kandamaru-7-3-0': 'L',
    'kandamaru-7-3-1': 'R',
    'kandamaru-7-4-0': 'L',
    'kandamaru-7-5-0': 'R',
    'kandamaru-7-6-0': 'R',
    'kandamaru-7-6-1': 'L',
    'kandamaru-7-6-2': 'L',
    'kandamaru-7-7-0': 'R',
    'kandamaru-7-8-0': 'R',
    'kandamaru-7-8-1': 'L',
    'kandamaru-7-8-2': 'R',

    /* 神田丸 9列目 */
    'kandamaru-8-0-0': 'R',
    'kandamaru-8-0-1': 'L',
    'kandamaru-8-0-2': 'R',
    'kandamaru-8-0-3': 'L',
    'kandamaru-8-1-0': 'R',
    'kandamaru-8-1-1': 'L',
    'kandamaru-8-1-2': 'R',
    'kandamaru-8-2-0': 'R',
    'kandamaru-8-2-1': 'L',
    'kandamaru-8-2-2': 'R',
    'kandamaru-8-2-3': 'L',
    'kandamaru-8-3-0': 'R',
    'kandamaru-8-3-1': 'L',
    'kandamaru-8-3-2': 'R',
    'kandamaru-8-4-0': 'R',
    'kandamaru-8-4-1': 'L',
    'kandamaru-8-4-2': 'R',
    'kandamaru-8-4-3': 'L',
    'kandamaru-8-4-4': 'R',
    'kandamaru-8-4-5': 'L',
    'kandamaru-8-4-6': 'R',
    'kandamaru-8-4-7': 'L',

    /* 神田丸 10列目 */
    'kandamaru-9-0-0': 'R',
    'kandamaru-9-0-1': 'L',
    'kandamaru-9-1-0': 'R',
    'kandamaru-9-1-1': 'L',
    'kandamaru-9-2-0': 'R',
    'kandamaru-9-2-1': 'L',
    'kandamaru-9-2-2': 'R',
    'kandamaru-9-3-0': 'R',
    'kandamaru-9-3-1': 'L',
    'kandamaru-9-4-0': 'R',
    'kandamaru-9-4-1': 'L',
    'kandamaru-9-5-0': 'R',
    'kandamaru-9-5-1': 'L',
    'kandamaru-9-5-2': 'R',

    /* 神田丸 11列目 */
    'kandamaru-10-0-0': 'R',
    'kandamaru-10-0-1': 'L',
    'kandamaru-10-0-2': 'R',
    'kandamaru-10-0-3': 'L',
    'kandamaru-10-1-0': 'R',
    'kandamaru-10-1-1': 'L',
    'kandamaru-10-1-2': 'R',
    'kandamaru-10-2-0': 'R',
    'kandamaru-10-2-1': 'L',
    'kandamaru-10-2-2': 'L',
    'kandamaru-10-2-3': 'R',
    'kandamaru-10-3-0': 'R',
    'kandamaru-10-3-1': 'L',
    'kandamaru-10-3-2': 'R',
    'kandamaru-10-4-0': 'R',
    'kandamaru-10-5-0': 'L',
    'kandamaru-10-5-1': null,
    'kandamaru-10-6-0': 'L',
    'kandamaru-10-6-1': 'R',

    /* 神田丸 12列目 */
    'kandamaru-11-0-0': 'R',
    'kandamaru-11-0-1': 'L',
    'kandamaru-11-0-2': 'R',
    'kandamaru-11-1-0': 'R',
    'kandamaru-11-1-1': 'L',
    'kandamaru-11-1-2': 'R',
    'kandamaru-11-2-0': 'R',
    'kandamaru-11-2-1': 'L',
    'kandamaru-11-2-2': 'L',
    'kandamaru-11-2-3': 'R',

    /* 神田丸 13列目 */
    'kandamaru-12-0-0': 'R',
    'kandamaru-12-0-1': 'L',
    'kandamaru-12-0-2': 'R',
    'kandamaru-12-1-0': 'R',
    'kandamaru-12-1-1': 'L',
    'kandamaru-12-1-2': 'R',
    'kandamaru-12-2-0': 'L',
    'kandamaru-12-3-0': 'R',
    'kandamaru-12-4-0': 'L',
    'kandamaru-12-5-0': 'R',
    'kandamaru-12-5-1': 'L',
    'kandamaru-12-6-0': 'R',
    'kandamaru-12-7-0': 'L',
    'kandamaru-12-8-0': 'R',
    'kandamaru-12-8-1': 'L',
    'kandamaru-12-9-0': 'R',

    /* 神田丸 14列目 */
    'kandamaru-13-0-0': 'R',
    'kandamaru-13-1-0': 'L',
    'kandamaru-13-2-0': 'R',
    'kandamaru-13-3-0': 'L',
    'kandamaru-13-3-1': null,
    'kandamaru-13-4-0': 'R',
    'kandamaru-13-5-0': 'L',
    'kandamaru-13-6-0': 'L',
    'kandamaru-13-7-0': 'R',
    'kandamaru-13-8-0': 'L',

    /* 神田丸 15列目 */
    'kandamaru-14-0-0': 'L',
    'kandamaru-14-1-0': 'R',
    'kandamaru-14-2-0': 'L',
    'kandamaru-14-3-0': 'R',
    'kandamaru-14-4-0': 'L',
    'kandamaru-14-5-0': 'R',
    'kandamaru-14-6-0': 'L',
    'kandamaru-14-7-0': 'R',
    'kandamaru-14-8-0': 'L'
  };
})(window.YH = window.YH || {});
