// グローバル定数と変数
const CANVAS_SIZE = 400;
const GRID_COUNT = 4; // 4x4のグリッド
let squareSize;       // 各正方形（タイル）の一辺の長さ
let borderThickness;  // グリッド周囲の枠の太さ

// 色の定義 (setup内でp5.Colorオブジェクトとして初期化)
let frameColor;                 // 外枠の色 (濃い木目調)
let puzzleAreaBackgroundColor;  // タイルが置かれるエリアの背景色 (中間色の木目調)
let tileColor;                  // タイルの色 (明るい木目調)
let tileStrokeColor;            // タイルの境界線の色
let emptyTileColor;             // 色: 空のタイルの色
let numberColor;                // 色: 数字の色
const TILE_STROKE_WEIGHT = 2;   // タイルの境界線の太さ
const POP_FONT = 'Verdana';     // フォント: 親しみやすいポップなフォント

// パズル状態の管理
let grid; // 2D配列でタイルの数字を管理
let emptyRow, emptyCol; // 空白マスの位置
const EMPTY_SLOT_VALUE = 0; // 空白マスを表す値

function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);

  // 寸法計算
  // squareSize * (GRID_COUNT + 1/2) = CANVAS_SIZE という関係から導出
  squareSize = (2 * CANVAS_SIZE) / (2 * GRID_COUNT + 1);
  borderThickness = squareSize / 4;

  // 色の初期化
  frameColor = color(85, 57, 30);
  puzzleAreaBackgroundColor = color(139, 69, 19);
  tileColor = color(222, 184, 135);
  tileStrokeColor = color(101, 67, 33);
  emptyTileColor = color(205, 170, 125);
  numberColor = color(50, 25, 0);

  // グリッドの初期化
  grid = Array(GRID_COUNT).fill(null).map(() => Array(GRID_COUNT).fill(0));
  let num = 1;
  for (let r = 0; r < GRID_COUNT; r++) {
    for (let c = 0; c < GRID_COUNT; c++) {
      if (r === GRID_COUNT - 1 && c === GRID_COUNT - 1) {
        grid[r][c] = EMPTY_SLOT_VALUE;
        emptyRow = r;
        emptyCol = c;
      } else {
        grid[r][c] = num++;
      }
    }
  }
  // noLoop() を削除し、draw()が継続実行されるようにする
}

function draw() {
  // 1. 外枠を描画 (キャンバス全体を外枠の色で塗りつぶす)
  background(frameColor);

  // 2. タイルが配置されるエリアの背景を描画
  //    このエリアは外枠の内側に配置される
  fill(puzzleAreaBackgroundColor);
  noStroke();
  rect(
    borderThickness,
    borderThickness,
    squareSize * GRID_COUNT,
    squareSize * GRID_COUNT
  );

  // 3. グリッドに基づいてタイルと数字を描画
  textFont(POP_FONT);
  textAlign(CENTER, CENTER);
  textSize(squareSize * 0.5);

  for (let r = 0; r < GRID_COUNT; r++) {
    for (let c = 0; c < GRID_COUNT; c++) {
      // 各タイルの左上の座標を計算
      let x = borderThickness + c * squareSize;
      let y = borderThickness + r * squareSize;
      let tileValue = grid[r][c];

      if (tileValue === EMPTY_SLOT_VALUE) {
        // 空白のマス
        fill(emptyTileColor);
        stroke(tileStrokeColor);
        strokeWeight(TILE_STROKE_WEIGHT);
        rect(x, y, squareSize, squareSize, 5);
      } else {
        // 数字が入るマス
        fill(tileColor);
        stroke(tileStrokeColor);
        strokeWeight(TILE_STROKE_WEIGHT);
        rect(x, y, squareSize, squareSize, 5);

        // 数字を描画
        fill(numberColor);
        noStroke();
        text(tileValue, x + squareSize / 2, y + squareSize / 2);
      }
    }
  }
}

function keyPressed() {
  let targetRow = emptyRow;
  let targetCol = emptyCol;
  let moved = false;

  if (keyCode === UP_ARROW && emptyRow < GRID_COUNT - 1) {
    // 空白マスの下にあるタイルを上に移動
    targetRow = emptyRow + 1;
    moved = true;
  } else if (keyCode === DOWN_ARROW && emptyRow > 0) {
    // 空白マスの上にあるタイルを下に移動
    targetRow = emptyRow - 1;
    moved = true;
  } else if (keyCode === LEFT_ARROW && emptyCol < GRID_COUNT - 1) {
    // 空白マスの右にあるタイルを左に移動
    targetCol = emptyCol + 1;
    moved = true;
  } else if (keyCode === RIGHT_ARROW && emptyCol > 0) {
    // 空白マスの左にあるタイルを右に移動
    targetCol = emptyCol - 1;
    moved = true;
  }

  if (moved) {
    // タイルと空白マスを入れ替え
    grid[emptyRow][emptyCol] = grid[targetRow][targetCol];
    grid[targetRow][targetCol] = EMPTY_SLOT_VALUE;
    // 空白マスの位置を更新
    emptyRow = targetRow;
    emptyCol = targetCol;
    // redraw(); // noLoop() を使用していない場合は不要。draw()が自動で再描画します。
  }
}
