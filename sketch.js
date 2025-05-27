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

function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);

  // 寸法計算
  // squareSize * (GRID_COUNT + 1/2) = CANVAS_SIZE という関係から導出
  squareSize = (2 * CANVAS_SIZE) / (2 * GRID_COUNT + 1);
  borderThickness = squareSize / 4;

  // 色の初期化 (木製風の色合い)
  frameColor = color(85, 57, 30);              // 例: ダークウォールナット
  puzzleAreaBackgroundColor = color(139, 69, 19); // 例: サドルブラウン (チェリーウッド風)
  tileColor = color(222, 184, 135);            // 例: バーリーウッド (パイン材風)
  tileStrokeColor = color(101, 67, 33);        // 例: タイルより濃い茶色
  emptyTileColor = color(205, 170, 125);       // 例: 薄いベージュ系の木目調 (空きスロット用)
  numberColor = color(50, 25, 0);              // 例: 非常に濃い茶色 (数字用)


  // 今回は静的な描画なので、draw()のループを停止します。
  // アニメーションやインタラクションを追加する際にコメントアウトまたは削除してください。
  noLoop(); // 静的な描画のためループ停止
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

  // 3. 4x4のグリッドにタイルと数字を描画
  let tileNumber = 1; // 表示する数字のカウンター

  textFont(POP_FONT);
  textAlign(CENTER, CENTER); // テキストを中央揃えに

  for (let row = 0; row < GRID_COUNT; row++) {
    for (let col = 0; col < GRID_COUNT; col++) {
      // 各タイルの左上の座標を計算
      let x = borderThickness + col * squareSize;
      let y = borderThickness + row * squareSize;

      // 右下のマスかどうかを判定
      if (row === GRID_COUNT - 1 && col === GRID_COUNT - 1) {
        // 空白のマス
        fill(emptyTileColor);
        stroke(tileStrokeColor); // 枠線は他のタイルと統一
        strokeWeight(TILE_STROKE_WEIGHT);
        rect(x, y, squareSize, squareSize, 5); // 角丸
      } else {
        // 数字が入るマス
        fill(tileColor);
        stroke(tileStrokeColor);
        strokeWeight(TILE_STROKE_WEIGHT);
        rect(x, y, squareSize, squareSize, 5); // 角丸

        // 数字を描画
        fill(numberColor); // 数字の色
        noStroke(); // 数字には枠線なしの方が見やすい
        textSize(squareSize * 0.5); // タイルの半分の高さ程度の文字サイズ
        text(tileNumber, x + squareSize / 2, y + squareSize / 2);
        tileNumber++;
      }
    }
  }
}
