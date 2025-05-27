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

// アニメーション関連の変数
let isAnimating = false;
let animatingTileValue = -1;
let animatingTileStartGridR, animatingTileStartGridC; // 移動元
let animatingTileTargetGridR, animatingTileTargetGridC; // 移動先
let animationProgress = 0; // 0.0 から 1.0
const ANIMATION_DURATION = 100; // 0.1秒 (ミリ秒)

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

  // 3. グリッドに基づいて静的なタイルを描画
  textFont(POP_FONT);
  textAlign(CENTER, CENTER);
  textSize(squareSize * 0.5);

  for (let r = 0; r < GRID_COUNT; r++) {
    for (let c = 0; c < GRID_COUNT; c++) {
      let x = borderThickness + c * squareSize;
      let y = borderThickness + r * squareSize;
      
      if (isAnimating && r === animatingTileStartGridR && c === animatingTileStartGridC) {
        // アニメーション中のタイルの移動元は、一時的に空白として描画
        fill(emptyTileColor);
        stroke(tileStrokeColor);
        strokeWeight(TILE_STROKE_WEIGHT);
        rect(x, y, squareSize, squareSize, 5);
      } else {
        // その他のタイルは現在のgrid配列に基づいて描画
        let tileValue = grid[r][c];
        if (tileValue === EMPTY_SLOT_VALUE) {
          fill(emptyTileColor);
          stroke(tileStrokeColor);
          strokeWeight(TILE_STROKE_WEIGHT);
          rect(x, y, squareSize, squareSize, 5);
        } else {
          fill(tileColor);
          stroke(tileStrokeColor);
          strokeWeight(TILE_STROKE_WEIGHT);
          rect(x, y, squareSize, squareSize, 5);

          fill(numberColor);
          noStroke();
          text(tileValue, x + squareSize / 2, y + squareSize / 2);
        }
      }
    }
  }

  // 4. アニメーション中のタイルを描画 (他のすべての上に)
  if (isAnimating) {
    animationProgress += deltaTime / ANIMATION_DURATION;
    animationProgress = min(animationProgress, 1.0);

    let startScreenX = borderThickness + animatingTileStartGridC * squareSize;
    let startScreenY = borderThickness + animatingTileStartGridR * squareSize;
    let targetScreenX = borderThickness + animatingTileTargetGridC * squareSize;
    let targetScreenY = borderThickness + animatingTileTargetGridR * squareSize;

    let currentX = lerp(startScreenX, targetScreenX, animationProgress);
    let currentY = lerp(startScreenY, targetScreenY, animationProgress);

    // アニメーション中のタイルを描画
    fill(tileColor);
    stroke(tileStrokeColor);
    strokeWeight(TILE_STROKE_WEIGHT);
    rect(currentX, currentY, squareSize, squareSize, 5);
    fill(numberColor);
    noStroke();
    text(animatingTileValue, currentX + squareSize / 2, currentY + squareSize / 2);

    if (animationProgress >= 1.0) {
      isAnimating = false;
      // アニメーション完了後、gridの状態を更新
      grid[animatingTileTargetGridR][animatingTileTargetGridC] = animatingTileValue;
      grid[animatingTileStartGridR][animatingTileStartGridC] = EMPTY_SLOT_VALUE;
      // 空白マスの新しい位置を更新 (タイルが元々あった場所)
      emptyRow = animatingTileStartGridR;
      emptyCol = animatingTileStartGridC;
    }
  }
}

function keyPressed() {
  if (isAnimating) { // アニメーション中は新しい移動を受け付けない
    return;
  }

  let tileToMoveR = -1; // 移動するタイルの行
  let tileToMoveC = -1; // 移動するタイルの列

  // 押されたキーと空白マスの位置に基づいて、移動するタイルを決定
  if (keyCode === UP_ARROW && emptyRow < GRID_COUNT - 1) {
    // 空白マスの下にあるタイル (emptyRow + 1, emptyCol) を上に移動
    tileToMoveR = emptyRow + 1;
    tileToMoveC = emptyCol;
  } else if (keyCode === DOWN_ARROW && emptyRow > 0) {
    // 空白マスの上にあるタイル (emptyRow - 1, emptyCol) を下に移動
    tileToMoveR = emptyRow - 1;
    tileToMoveC = emptyCol;
  } else if (keyCode === LEFT_ARROW && emptyCol < GRID_COUNT - 1) {
    // 空白マスの右にあるタイル (emptyRow, emptyCol + 1) を左に移動
    tileToMoveR = emptyRow;
    tileToMoveC = emptyCol + 1;
  } else if (keyCode === RIGHT_ARROW && emptyCol > 0) {
    // 空白マスの左にあるタイル (emptyRow, emptyCol - 1) を右に移動
    tileToMoveR = emptyRow;
    tileToMoveC = emptyCol - 1;
  }

  if (tileToMoveR !== -1) { // 有効な移動が検出された場合
    isAnimating = true;
    animationProgress = 0; // アニメーション進行度をリセット

    animatingTileValue = grid[tileToMoveR][tileToMoveC];
    animatingTileStartGridR = tileToMoveR;
    animatingTileStartGridC = tileToMoveC;
    animatingTileTargetGridR = emptyRow; // タイルは現在の空白マスへ移動
    animatingTileTargetGridC = emptyCol;

    // gridの実際の更新はアニメーション完了後に行う
  }
}
