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

// UI要素
let scrambleButton;

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
  initializeGrid(); // グリッド初期化を関数に分離

  // スクランブルボタンの作成と設定
  scrambleButton = createButton('Scramble (S)');
  // ボタンの位置をキャンバスの下に調整
  // HTMLの構成によって微調整が必要な場合があります
  scrambleButton.position(borderThickness, CANVAS_SIZE + borderThickness + 10);
  // scrambleButton.mousePressed(scramblePuzzle); // ← この行は下の新しいmousePressedに統合されます

  // ボタンのスタイルをポップに
  scrambleButton.style('font-family', POP_FONT);
  scrambleButton.style('font-size', '16px');
  scrambleButton.style('background-color', color(255, 193, 7)); // Amber (明るい黄色系)
  scrambleButton.style('color', color(33, 33, 33)); // Dark Grey
  scrambleButton.style('padding', '10px 18px');
  scrambleButton.style('border', 'none');
  scrambleButton.style('border-radius', '8px');
  scrambleButton.style('cursor', 'pointer');
  scrambleButton.style('box-shadow', '0 3px 2px rgba(0, 0, 0, 0.2)');
  scrambleButton.style('transition', 'background-color 0.2s, box-shadow 0.2s, transform 0.1s');

  scrambleButton.mouseOver(() => {
    scrambleButton.style('background-color', color(255, 204, 51)); // 少し明るいAmber
    scrambleButton.style('box-shadow', '0 4px 3px rgba(0, 0, 0, 0.3)');
  });

  scrambleButton.mouseOut(() => {
    scrambleButton.style('background-color', color(255, 193, 7)); // 元のAmber
    scrambleButton.style('box-shadow', '0 3px 2px rgba(0, 0, 0, 0.2)');
    scrambleButton.style('transform', 'translateY(0px)'); // 沈み込みをリセット
  });

  scrambleButton.mousePressed(() => {
    scrambleButton.style('background-color', color(255, 160, 0)); // 押された時の濃いAmber
    scrambleButton.style('box-shadow', '0 1px 1px rgba(0, 0, 0, 0.2)');
    scrambleButton.style('transform', 'translateY(2px)'); // 少し沈む
    scramblePuzzle(); // 元の機能を呼び出す
  });
}

function initializeGrid() {
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
  // noLoop() はアニメーションのために削除済み
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

      // アニメーション中のタイルの移動元は、一時的に空白として描画
      // それ以外のタイルはgrid配列に基づいて描画
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
      emptyRow = animatingTileStartGridR; // ここが重要：空白はタイルが「来た元」の場所になる
      emptyCol = animatingTileStartGridC;
    }
  }
}

function keyPressed() {
  if (isAnimating) { // アニメーション中は新しい移動を受け付けない
    return;
  }

  if (key === 's' || key === 'S') { // Sキーでスクランブル
    scramblePuzzle();
    return; // Sキー処理後は他のキー処理をしない
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

function scramblePuzzle() {
  if (isAnimating) return; // アニメーション中はスクランブルしない

  const SCRAMBLE_MOVES = 150; // シャッフル回数
  let lastEmptySlotMoveDirection = -1; // 空白マスの直前の移動方向: 0:UP, 1:DOWN, 2:LEFT, 3:RIGHT

  // 初期状態に戻してからシャッフルを開始
  initializeGrid();

  for (let i = 0; i < SCRAMBLE_MOVES; i++) {
    let possibleNextEmptySlotPositions = [];

    // 空白マスが次に移動できる位置の候補
    // UP: 空白マスが上に移動 (タイルは下から空白マスへ)
    if (emptyRow > 0 && lastEmptySlotMoveDirection !== 1) { // 直前がDOWNでなければ
      possibleNextEmptySlotPositions.push({ r: emptyRow - 1, c: emptyCol, moveDirection: 0 });
    }
    // DOWN: 空白マスが下に移動 (タイルは上から空白マスへ)
    if (emptyRow < GRID_COUNT - 1 && lastEmptySlotMoveDirection !== 0) { // 直前がUPでなければ
      possibleNextEmptySlotPositions.push({ r: emptyRow + 1, c: emptyCol, moveDirection: 1 });
    }
    // LEFT: 空白マスが左に移動 (タイルは右から空白マスへ)
    if (emptyCol > 0 && lastEmptySlotMoveDirection !== 3) { // 直前がRIGHTでなければ
      possibleNextEmptySlotPositions.push({ r: emptyRow, c: emptyCol - 1, moveDirection: 2 });
    }
    // RIGHT: 空白マスが右に移動 (タイルは左から空白マスへ)
    if (emptyCol < GRID_COUNT - 1 && lastEmptySlotMoveDirection !== 2) { // 直前がLEFTでなければ
      possibleNextEmptySlotPositions.push({ r: emptyRow, c: emptyCol + 1, moveDirection: 3 });
    }

    // 行き場がない場合（袋小路で直前の手しか戻れない場合など）は、制限を解除して全ての有効な手を候補にする
    if (possibleNextEmptySlotPositions.length === 0) {
      if (emptyRow > 0) possibleNextEmptySlotPositions.push({ r: emptyRow - 1, c: emptyCol, moveDirection: 0 });
      if (emptyRow < GRID_COUNT - 1) possibleNextEmptySlotPositions.push({ r: emptyRow + 1, c: emptyCol, moveDirection: 1 });
      if (emptyCol > 0) possibleNextEmptySlotPositions.push({ r: emptyRow, c: emptyCol - 1, moveDirection: 2 });
      if (emptyCol < GRID_COUNT - 1) possibleNextEmptySlotPositions.push({ r: emptyRow, c: emptyCol + 1, moveDirection: 3 });
      if (possibleNextEmptySlotPositions.length === 0) continue; // 万が一、それでも候補がない場合はスキップ（通常発生しない）
    }

    let chosenMove = random(possibleNextEmptySlotPositions); // p5.jsのrandom()で配列からランダムに選択

    // タイルと空白マスを入れ替え
    // grid[emptyRow][emptyCol] には、chosenMoveの位置にあるタイルが入る
    // grid[chosenMove.r][chosenMove.c] には、EMPTY_SLOT_VALUE が入る
    grid[emptyRow][emptyCol] = grid[chosenMove.r][chosenMove.c];
    grid[chosenMove.r][chosenMove.c] = EMPTY_SLOT_VALUE;

    // 空白マスの新しい位置を更新
    emptyRow = chosenMove.r;
    emptyCol = chosenMove.c;

    // 空白マスの移動方向を記録
    lastEmptySlotMoveDirection = chosenMove.moveDirection;
  }
}
