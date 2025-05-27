// グローバル定数と変数
const MAX_PUZZLE_WIDTH = 500;
const MIN_PUZZLE_WIDTH = 240; // パズルの最小幅
let currentPuzzleWidth;       // 現在のパズル（キャンバス）の幅
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
let uiContainer;
let scrambleButton;
let timerDisplay;

// タイマー状態
let startTime = 0;
let elapsedTime = 0; // in seconds
let isTimerRunning = false;
let firstMoveMadeAfterScramble = false;
let isPuzzleSolved = false;
let hasBeenScrambled = false; // パズルがスクランブルされたかどうかのフラグ
let defaultTimerColor;
// タッチ操作関連
let touchStartX = 0;
let touchStartY = 0;
let isTouchActive = false;
const SWIPE_THRESHOLD = 40; // スワイプと判定する最小距離 (ピクセル)

function setup() {
  // 初期寸法の計算とキャンバス作成
  calculateAndUpdateDimensions();
  createCanvas(currentPuzzleWidth, currentPuzzleWidth);


  // 色の初期化
  frameColor = color(85, 57, 30);
  puzzleAreaBackgroundColor = color(139, 69, 19);
  tileColor = color(222, 184, 135);
  tileStrokeColor = color(101, 67, 33);
  emptyTileColor = color(205, 170, 125);
  numberColor = color(50, 25, 0);
  defaultTimerColor = numberColor; // タイマーのデフォルト色

  // グリッドの初期化
  initializeGrid(); // グリッド初期化を関数に分離

  // UIコンテナの作成 (ボタンとタイマーを中央揃えにするため)
  uiContainer = createDiv('');
  uiContainer.style('width', currentPuzzleWidth + 'px');
  uiContainer.style('text-align', 'center'); // コンテナ内のブロック要素を中央揃えにするための準備
  // キャンバスの下に配置 (キャンバスが(0,0)にあると仮定)
  uiContainer.position(0, currentPuzzleWidth + 15); // Y位置を調整 (固定オフセット)

  // スクランブルボタンの作成と設定
  scrambleButton = createButton('Scramble (S)');
  scrambleButton.parent(uiContainer);
  scrambleButton.style('display', 'block'); // 中央揃えのためにブロック要素に
  scrambleButton.style('margin', '0 auto 10px auto'); // 上下マージンと左右autoで中央揃え

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

  // タイマー表示の作成
  timerDisplay = createP('0.0 秒');
  timerDisplay.parent(uiContainer);
  timerDisplay.style('font-family', POP_FONT);
  timerDisplay.style('font-size', '30px');
  timerDisplay.style('color', defaultTimerColor.toString());
  timerDisplay.style('margin', '0 auto'); // 中央揃え
}

function windowResized() {
  calculateAndUpdateDimensions();
  resizeCanvas(currentPuzzleWidth, currentPuzzleWidth);
}

function calculateAndUpdateDimensions() {
  currentPuzzleWidth = min(windowWidth, MAX_PUZZLE_WIDTH);
  currentPuzzleWidth = max(currentPuzzleWidth, MIN_PUZZLE_WIDTH);

  // squareSize * (GRID_COUNT + 1/2) = currentPuzzleWidth という関係から導出
  squareSize = (2 * currentPuzzleWidth) / (2 * GRID_COUNT + 1);
  borderThickness = squareSize / 4;

  if (uiContainer) { // setup完了後に呼ばれる場合があるためチェック
    uiContainer.style('width', currentPuzzleWidth + 'px');
    uiContainer.position(0, currentPuzzleWidth + 15);
  }
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
  hasBeenScrambled = false; // 初期状態ではスクランブルされていない
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

      // アニメーション完了後、タイマー開始条件と完成チェック
      if (hasBeenScrambled && !firstMoveMadeAfterScramble && !isPuzzleSolved) {
        // スクランブル後、最初の有効な手でタイマー開始
        isTimerRunning = true;
        startTime = millis();
        elapsedTime = 0; // 表示上のリセット
        firstMoveMadeAfterScramble = true;
        timerDisplay.style('color', defaultTimerColor.toString()); // タイマー色をデフォルトに
      }
      checkIfSolved();
    }
  }

  // タイマー表示の更新
  if (isTimerRunning) {
    elapsedTime = (millis() - startTime) / 1000.0;
    timerDisplay.html(elapsedTime.toFixed(1) + ' 秒');
  } else if (firstMoveMadeAfterScramble || elapsedTime > 0) {
    // タイマーが停止していて、一度でも動いたことがある場合 (完成時など)
    timerDisplay.html(elapsedTime.toFixed(1) + ' 秒');
  } else {
    // 初期状態またはスクランブル直後
    timerDisplay.html('0.0 秒');
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

  // タイマーリセット
  isTimerRunning = false;
  elapsedTime = 0;
  startTime = 0;
  firstMoveMadeAfterScramble = false;
  isPuzzleSolved = false; // パズル未完成状態に
  // hasBeenScrambled は initializeGrid の後で true に設定
  timerDisplay.html('0.0 秒');
  timerDisplay.style('color', defaultTimerColor.toString());

  const SCRAMBLE_MOVES = 150; // シャッフル回数
  let lastEmptySlotMoveDirection = -1; // 空白マスの直前の移動方向: 0:UP, 1:DOWN, 2:LEFT, 3:RIGHT
  initializeGrid();
  hasBeenScrambled = true; // スクランブルされたことを記録

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

function checkIfSolved() {
  let expectedValue = 1;
  for (let r = 0; r < GRID_COUNT; r++) {
    for (let c = 0; c < GRID_COUNT; c++) {
      if (r === GRID_COUNT - 1 && c === GRID_COUNT - 1) { // グリッドの最後のマス
        if (grid[r][c] !== EMPTY_SLOT_VALUE) {
          isPuzzleSolved = false; // 以前解決済みでも、今は違う
          return;
        }
      } else {
        if (grid[r][c] !== expectedValue) {
          isPuzzleSolved = false; // 以前解決済みでも、今は違う
          return;
        }
        expectedValue++;
      }
    }
  }

  // ループを抜けたらパズル完成
  if (!isPuzzleSolved) { // まだ 'isPuzzleSolved' が true に設定されていなければ (つまり、今解決した)
    isPuzzleSolved = true;
    hasBeenScrambled = false; // 完成したら「スクランブル済み」フラグをリセット
    if (isTimerRunning) { // タイマーが動いていたら止めて色を変える
      isTimerRunning = false;
      elapsedTime = (millis() - startTime) / 1000.0; // 最終タイムを記録
      timerDisplay.style('color', 'red');
    }
  }
}

function touchStarted() {
  // マウス座標がキャンバス内にあるかチェック
  if (mouseX >= 0 && mouseX <= currentPuzzleWidth && mouseY >= 0 && mouseY <= currentPuzzleWidth) {
    if (touches.length > 0) { // p5.jsのtouches配列で実際のタッチを検出
      touchStartX = mouseX; // mouseX/Y はタッチイベント中、タッチ座標を反映
      touchStartY = mouseY;
      isTouchActive = true;
      return false; // ブラウザのデフォルトのタッチ動作（スクロールなど）を抑制
    } else {
      // touches.length === 0 の場合、マウスイベントかもしれないのでデフォルト動作を許可
      // ただし、モバイルデバイスでは通常ここには来ないはず
      return true;
    }
  }
  return true; // キャンバス外のタッチはデフォルト動作を許可
}

function touchEnded() {
  if (!isTouchActive) {
    return true;  // isTouchActiveがfalseなら、このイベントは無視してデフォルト動作を許可
  }

  if (isAnimating) {
    return false; // アニメーション中は新しい操作を無視し、デフォルト動作を抑制
  }

  let touchEndX = mouseX; // mouseX/Y はタッチイベント中、タッチ座標を反映
  let touchEndY = mouseY;

  let dx = touchEndX - touchStartX;
  let dy = touchEndY - touchStartY;

  let tileToMoveR = -1;
  let tileToMoveC = -1;

  // スワイプ距離が閾値を超えているか、かつタッチ開始点がパズルグリッド内か確認
  const puzzleAreaX1 = borderThickness;
  const puzzleAreaY1 = borderThickness;
  const puzzleAreaX2 = borderThickness + GRID_COUNT * squareSize;
  const puzzleAreaY2 = borderThickness + GRID_COUNT * squareSize;

  if ((abs(dx) > SWIPE_THRESHOLD || abs(dy) > SWIPE_THRESHOLD) &&
      (touchStartX > puzzleAreaX1 && touchStartX < puzzleAreaX2 &&
       touchStartY > puzzleAreaY1 && touchStartY < puzzleAreaY2)) {

    if (abs(dx) > abs(dy)) { // 水平スワイプ
      if (dx > 0 && emptyCol > 0) { // 右へスワイプ -> 空白の左のタイルを移動
        tileToMoveR = emptyRow;
        tileToMoveC = emptyCol - 1;
      } else if (dx < 0 && emptyCol < GRID_COUNT - 1) { // 左へスワイプ -> 空白の右のタイルを移動
        tileToMoveR = emptyRow;
        tileToMoveC = emptyCol + 1;
      }
    } else { // 垂直スワイプ
      if (dy > 0 && emptyRow > 0) { // 下へスワイプ -> 空白の上のタイルを移動
        tileToMoveR = emptyRow - 1;
        tileToMoveC = emptyCol;
      } else if (dy < 0 && emptyRow < GRID_COUNT - 1) { // 上へスワイプ -> 空白の下のタイルを移動
        tileToMoveR = emptyRow + 1;
        tileToMoveC = emptyCol;
      }
    }
  }

  if (tileToMoveR !== -1) {
    isAnimating = true;
    animationProgress = 0;
    animatingTileValue = grid[tileToMoveR][tileToMoveC];
    animatingTileStartGridR = tileToMoveR;
    animatingTileStartGridC = tileToMoveC;
    animatingTileTargetGridR = emptyRow;
    animatingTileTargetGridC = emptyCol;
  }
  isTouchActive = false; // ここでフラグをリセット
  return false; // スワイプ処理後は常にデフォルト動作を抑制
}

function touchMoved() {
  // キャンバス内でのタッチ移動であれば、デフォルトのスクロール動作を抑制
  if (mouseX >= 0 && mouseX <= currentPuzzleWidth && mouseY >= 0 && mouseY <= currentPuzzleWidth) {
    return false;
  }
  return true; // キャンバス外ならデフォルト動作を許可
}
