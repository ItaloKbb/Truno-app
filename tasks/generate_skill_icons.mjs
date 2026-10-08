// Generates exact 32x32 SVG skill icons on an integer pixel grid.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'skills');
const INK = '#17212d';
const DEEP = '#27374a';
const WHITE = '#f8f4df';
const GOLD = '#f5c65c';
const GOLD_LIGHT = '#ffe79a';
const GOLD_DARK = '#bd8039';
const BLUE = '#55b8e5';
const BLUE_LIGHT = '#a5e7f6';
const BLUE_DARK = '#2e6f9b';
const RED = '#ed6868';
const RED_LIGHT = '#ffab88';
const RED_DARK = '#ad394b';
const GREEN = '#6bd194';
const GREEN_LIGHT = '#b6f4ad';
const GREEN_DARK = '#348b65';
const PURPLE = '#ae85df';
const PURPLE_DARK = '#6e4d9c';
class Icon {
  constructor() { this.parts = []; }
  rect(x, y, w, h, color) { this.parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`); }
  path(d, color) { this.parts.push(`<path d="${d}" fill="${color}"/>`); }
  pixels(positions, color) { for (const [x, y] of positions) this.rect(x, y, 2, 2, color); }
  save(name) { fs.mkdirSync(OUT, {recursive:true}); fs.writeFileSync(path.join(OUT, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">\n  ${this.parts.join('\n  ')}\n</svg>\n`); }
}

function shield() {
  const a = new Icon();
  a.path("M5 4H27V19H25V24H22V27H19V29H13V27H10V24H7V19H5Z", INK);
  a.path("M7 6H25V18H23V23H20V26H17V27H15V26H12V23H9V18H7Z", BLUE_DARK);
  a.path("M9 8H23V17H21V21H19V23H16V25H14V23H12V21H10V17H9Z", BLUE);
  a.rect(9, 8, 3, 10, BLUE_LIGHT);
  a.rect(13, 8, 2, 15, BLUE_LIGHT);
  a.path("M16 8H18V18H22V20H18V24H14V20H10V18H14V8Z", GOLD_DARK);
  a.path("M15 9H17V19H21V20H17V23H15V20H11V19H15Z", GOLD);
  a.rect(15, 9, 2, 5, GOLD_LIGHT);
  a.save("escudo");
}

function bomb() {
  const a = new Icon();
  a.rect(21, 3, 4, 3, GOLD);
  a.rect(25, 5, 3, 3, RED);
  a.rect(27, 3, 2, 2, GOLD_LIGHT);
  a.rect(24, 9, 3, 2, INK);
  a.rect(20, 7, 5, 3, INK);
  a.path("M10 8H20V10H24V13H26V18H28V24H26V27H23V29H9V27H6V24H4V16H6V12H8V10H10Z", INK);
  a.path("M10 11H20V13H23V16H25V23H23V26H10V24H7V16H9V13H10Z", DEEP);
  a.path("M9 14H13V12H19V14H14V16H11V19H8V16H9Z", BLUE_DARK);
  a.rect(10, 13, 4, 2, BLUE_LIGHT);
  a.rect(9, 16, 2, 3, BLUE);
  a.rect(22, 21, 2, 3, "#101924");
  a.pixels([[2, 10], [28, 13], [3, 26]], RED);
  a.save("bomba");
}

function block() {
  const a = new Icon();
  a.path("M10 4H22V6H25V9H27V17H22V10H20V8H12V10H10V17H5V9H7V6H10Z", INK);
  a.path("M11 6H21V8H23V15H20V10H19V9H13V10H12V15H9V8H11Z", BLUE_DARK);
  a.rect(10, 7, 2, 6, BLUE_LIGHT);
  a.path("M5 14H27V27H25V29H7V27H5Z", INK);
  a.path("M7 16H25V26H23V27H9V26H7Z", GOLD_DARK);
  a.path("M9 17H23V24H21V25H9Z", GOLD);
  a.rect(9, 17, 3, 3, GOLD_LIGHT);
  a.rect(14, 19, 4, 5, INK);
  a.rect(15, 22, 2, 3, INK);
  a.save("bloqueio");
}

function theft() {
  const a = new Icon();
  // One exposed opponent card and a gripping hand pulling it to the right.
  a.path("M3 5H16V19H14V23H3Z", INK);
  a.rect(5, 7, 9, 13, WHITE);
  a.rect(7, 9, 5, 7, BLUE_DARK);
  a.rect(8, 10, 3, 3, BLUE);
  a.path("M12 13H17V10H20V12H22V14H25V16H27V19H29V24H26V27H15V25H11V22H9V18H12Z", INK);
  a.path("M13 15H18V12H19V17H21V15H23V19H25V17H26V21H27V24H25V25H16V23H13V21H11V19H13Z", GOLD_DARK);
  a.path("M14 15H18V13H19V18H21V16H22V20H24V18H25V22H26V23H16V21H13V19H14Z", GOLD);
  a.rect(14, 15, 4, 2, GOLD_LIGHT);
  a.rect(2, 25, 4, 2, RED);
  a.rect(7, 25, 2, 2, RED);
  a.save("roubo");
}

function hands() {
  const a = new Icon();
  // Two cards travel in opposite directions between two simplified hands.
  a.path("M8 8H15V19H8Z M17 13H24V24H17Z", INK);
  a.rect(9, 9, 5, 9, BLUE);
  a.rect(18, 14, 5, 9, RED);
  a.rect(10, 10, 3, 2, BLUE_LIGHT);
  a.rect(19, 15, 3, 2, RED_LIGHT);
  a.path("M4 12H7V17H10V19H8V22H5V20H3V15H4Z", INK);
  a.path("M25 12H28V15H29V20H27V22H24V19H22V17H25Z", INK);
  a.path("M5 14H6V18H9V19H7V20H5Z M26 14H27V20H25V19H23V18H26Z", GOLD);
  // Rightward upper arrow; leftward lower arrow.
  a.path("M8 2H21V1H24V3H27V5H29V7H27V9H24V11H21V8H8Z", INK);
  a.path("M10 4H22V3H24V5H27V6H24V8H22V7H10Z", GOLD);
  a.path("M24 24H11V22H8V24H5V26H3V28H5V30H8V31H11V29H24Z", INK);
  a.path("M22 26H10V24H8V26H5V27H8V29H10V28H22Z", GOLD);
  a.save("troca-de-maos");
}

function gift(negative = false) {
  const a = new Icon();
  if (negative) {
  a.pixels([[3, 4], [26, 5], [2, 13]], RED);
  a.path("M13 3H16V8H19V3H22V10H10V7H13Z", RED_DARK);
  a.path("M14 4H15V9H20V4H21V9H14Z", RED);
  a.path("M5 13H27V17H25V27H23V29H9V27H7V17H5Z", INK);
  a.path("M7 16H25V26H23V27H9V26H7Z", PURPLE_DARK);
  a.rect(9, 17, 14, 8, PURPLE);
  a.rect(14, 17, 4, 10, RED_DARK);
  a.rect(15, 18, 2, 6, RED);
  a.rect(9, 17, 3, 2, "#d9b6ef");
  a.path("M4 10H28V16H4Z", INK);
  a.rect(6, 12, 20, 2, PURPLE);
  a.rect(14, 11, 4, 4, RED);
  a.rect(13, 21, 2, 3, INK);
  a.rect(18, 21, 2, 3, INK);
  } else {
  a.pixels([[3, 5], [26, 3], [27, 17]], GOLD_LIGHT);
  a.path("M11 4H15V8H17V5H21V8H19V11H11Z", INK);
  a.path("M13 6H15V9H17V7H19V9H13Z", BLUE);
  a.path("M5 13H27V17H25V27H23V29H9V27H7V17H5Z", INK);
  a.path("M7 16H25V26H23V27H9V26H7Z", GOLD_DARK);
  a.rect(9, 17, 14, 8, GOLD);
  a.rect(14, 17, 4, 10, BLUE_DARK);
  a.rect(15, 18, 2, 7, BLUE);
  a.rect(9, 17, 3, 2, GOLD_LIGHT);
  a.path("M4 10H28V16H4Z", INK);
  a.rect(6, 12, 20, 2, GOLD);
  a.rect(14, 11, 4, 4, BLUE);
  a.rect(8, 3, 2, 4, GOLD_LIGHT);
  a.rect(7, 4, 4, 2, GOLD_LIGHT);
  }
  a.save(negative ? "surpresa-negativa" : "surpresa-positiva");
}

function puzzle() {
  const a = new Icon();
  a.path("M5 5H13V7H15V5H18V7H20V5H27V13H25V15H27V18H25V20H27V27H19V25H17V27H14V25H12V27H5V19H7V17H5V14H7V12H5Z", INK);
  a.path("M7 7H12V9H14V7H16V9H18V7H25V12H23V14H25V16H23V18H25V25H20V23H18V25H15V23H13V25H7V20H9V18H7V15H9V11H7Z", PURPLE_DARK);
  a.path("M9 9H12V11H18V9H23V12H21V18H23V23H20V21H13V23H9V20H11V14H9Z", PURPLE);
  a.rect(9, 9, 3, 3, "#d9b6ef");
  a.rect(13, 13, 4, 3, "#d9b6ef");
  a.rect(17, 16, 3, 3, PURPLE_DARK);
  a.pixels([[27, 5], [2, 24]], GOLD_LIGHT);
  a.save("puzzle");
}

function buy() {
  const a = new Icon();
  // Rising card above its own deck; the arrow points straight upward.
  a.path("M11 8H23V23H11Z", INK);
  a.rect(13, 10, 8, 11, BLUE_DARK);
  a.rect(15, 12, 4, 7, BLUE);
  a.rect(16, 13, 2, 2, BLUE_LIGHT);
  a.path("M5 15H17V27H5Z", INK);
  a.rect(7, 17, 8, 8, RED_DARK);
  a.rect(9, 19, 4, 4, RED);
  a.path("M8 23H25V25H27V28H6V26H8Z", INK);
  a.rect(8, 25, 17, 2, GOLD_DARK);
  a.path("M17 2H20V6H23V8H20V9H17V8H14V6H17Z", INK);
  a.path("M18 3H19V7H21V8H16V7H18Z", GREEN);
  a.save("comprar");
}

function reverse(clockwise = true) {
  const a = new Icon();
  // At the top, clockwise motion goes right; at the bottom, it goes left.
  a.path("M6 8H8V5H18V3H23V5H25V7H27V9H29V12H22V10H20V9H11V11H9V13H6Z", INK);
  a.path("M8 8H10V7H18V5H23V7H25V9H26V10H23V9H21V8H11V11H8Z", BLUE_DARK);
  a.path("M11 7H18V5H21V7H24V8H11Z", BLUE_LIGHT);
  a.path("M23 8H26V9H28V10H30V12H28V13H26V14H23V12H21V10H23Z", INK);
  a.path("M24 9H26V10H28V12H26V13H24V11H22V10H24Z", GOLD);
  a.path("M26 19H23V21H21V23H13V21H11V19H8V22H6V24H4V26H2V29H9V27H11V26H21V28H24V26H26V24H28V21H26Z", INK);
  a.path("M24 21H25V24H23V25H21V24H12V25H9V27H5V26H7V24H9V22H11V23H13V25H21V23H23V21Z", BLUE_DARK);
  a.path("M12 24H21V23H22V25H12Z", BLUE);
  a.path("M9 18H6V19H4V20H2V22H4V24H6V25H9V23H11V20H9Z", INK);
  a.path("M8 20H6V21H4V22H6V23H8V22H10V21H8Z", GOLD);
  if (!clockwise) {
  a.parts = [`<g transform="translate(32 0) scale(-1 1)">${a.parts.join("")}</g>`];
  }
  a.save(clockwise ? "inversao-horario" : "inversao-anti-horario");
}

function burn() {
  const a = new Icon();
  a.pixels([[2, 21], [28, 6], [27, 24]], GOLD);
  a.path("M7 7H22V25H19V28H7Z", INK);
  a.rect(9, 9, 11, 16, WHITE);
  a.rect(11, 11, 7, 9, BLUE_DARK);
  a.rect(13, 13, 3, 4, BLUE);
  a.path("M5 28V23H7V19H9V22H11V16H13V11H15V17H17V14H19V20H21V17H23V22H25V25H27V29H5Z", INK);
  a.path("M7 27V24H9V22H11V25H13V18H15V21H17V18H19V23H21V21H23V25H25V27Z", RED_DARK);
  a.path("M9 27V25H11V27H13V22H15V25H17V22H19V26H21V24H23V27Z", RED);
  a.path("M13 27V25H15V26H17V24H19V27Z", GOLD);
  a.rect(14, 26, 3, 2, GOLD_LIGHT);
  a.save("queima");
}

shield(); bomb(); block(); theft(); hands(); gift(); gift(true); puzzle(); buy(); reverse(); reverse(false); burn();
