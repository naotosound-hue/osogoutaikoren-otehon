/* ============================================================
 * 白黒・線画アイコン（すべてインラインSVG＝印刷しても潰れない）
 * ============================================================ */
(function (YH) {
  'use strict';

  var S = 'stroke="currentColor" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

  YH.ICONS = {
    /* 笛の合図 ＝ 笛 ＋ 音符 */
    fue: '<svg viewBox="0 0 24 24" class="icn" aria-hidden="true">' +
      '<path ' + S + ' d="M3.5 15.5 L15 4"/>' +
      '<path ' + S + ' d="M14 3 l4.5 4.5 -2 2 -4.5 -4.5 z"/>' +
      '<circle cx="7.2" cy="12.2" r="0.9" fill="currentColor" stroke="none"/>' +
      '<circle cx="9.6" cy="9.8" r="0.9" fill="currentColor" stroke="none"/>' +
      '<circle cx="12" cy="7.4" r="0.9" fill="currentColor" stroke="none"/>' +
      '<path ' + S + ' d="M17 20 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0"/>' +
      '<path ' + S + ' d="M20.6 20 V13 l2.4 1"/>' +
      '</svg>',

    /* ②へ戻る ＝ 回転矢印 */
    loop: '<svg viewBox="0 0 24 24" class="icn" aria-hidden="true">' +
      '<path ' + S + ' d="M20 12 a8 8 0 1 1 -2.7 -6"/>' +
      '<path ' + S + ' d="M20.5 2.5 V6.4 H16.6"/>' +
      '</svg>',

    /* 交代 ＝ 人 2人 ＋ 入れかえ矢印 */
    change: '<svg viewBox="0 0 24 24" class="icn" aria-hidden="true">' +
      '<circle ' + S + ' cx="6" cy="5.4" r="2.4"/>' +
      '<path ' + S + ' d="M2.2 13.4 a3.8 3.8 0 0 1 7.6 0"/>' +
      '<circle ' + S + ' cx="18" cy="5.4" r="2.4"/>' +
      '<path ' + S + ' d="M14.2 13.4 a3.8 3.8 0 0 1 7.6 0"/>' +
      '<path ' + S + ' d="M4 18 H20"/>' +
      '<path ' + S + ' d="M17.4 15.6 L20 18 L17.4 20.4"/>' +
      '<path ' + S + ' d="M6.6 22.4 L4 20 L6.6 17.6"/>' +
      '<path ' + S + ' d="M4 20 H20"/>' +
      '</svg>',

    /* 最後 ＝ 星 */
    end: '<svg viewBox="0 0 24 24" class="icn" aria-hidden="true">' +
      '<path stroke="currentColor" fill="currentColor" stroke-width="1.4" stroke-linejoin="round" ' +
      'd="M12 2.6 l2.9 6 6.6 .9 -4.8 4.6 1.2 6.5 -5.9 -3.1 -5.9 3.1 1.2 -6.5 -4.8 -4.6 6.6 -.9 z"/>' +
      '</svg>'
  };
})(window.YH = window.YH || {});
