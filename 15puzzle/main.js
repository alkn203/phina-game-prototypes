// @ts-check

/** @type {import("./index").phina} */
// import phina from "./index.d.ts";

//phina.globalize();
// 定数
const SCREEN_WIDTH = 640;            // 画面横サイズ
const SCREEN_HEIGHT = 960;           // 画面縦サイズ
const PIECE_SIZE = SCREEN_WIDTH / 4; // グリッドのサイズ
const PIECE_NUM = 16;                // ピース数
const PIECE_NUM_X = 4;               // 横のピース数
const PIECE_OFFSET = PIECE_SIZE / 2; // オフセット値
// アセット
const ASSETS = {
  // 画像
  image: {
    'pieces': 'assets/pieces.png',
  },
};
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  /**
   * @constructor
   * 
   */
  init: function () {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'black';
    // グリッド
    this.grid = Grid(SCREEN_WIDTH, PIECE_NUM_X);
    // ピースグループ
    this.pieceGroup = DisplayElement().addChildTo(this);
    // ピース配置
    this.createPiece();
  },
  // ピース配置関数
  createPiece: function () {
    PIECE_NUM.times(function(i) {
      // グリッド配置用のインデックス値算出
      const sx = i % PIECE_NUM_X;
      const sy = Math.floor(i / PIECE_NUM_X);
      // 番号
      const num = i + 1;
      // ピース作成
      const piece = Piece(num).addChildTo(this.pieceGroup);
      // Gridを利用して配置
      piece.x = this.grid.span(sx) + PIECE_OFFSET;
      piece.y = this.grid.span(sy) + PIECE_OFFSET;
      // グリッド上のインデックス値
      piece.indexPos = Vector2(sx, sy);
      // タッチを有効にする
      piece.setInteractive(true);
      // タッチされた時の処理
      piece.on('pointend', () => {
        // ピース移動処理
        this.movePiece(piece);
      });
      // 16番のピースは非表示
      if (num === 16) {
        piece.hide();
      }
    }, this);
  },
  // 16番ピース（空白）を取得
  getBlankPiece: function () {
    let result = null;
    this.pieceGroup.children.some(function(piece) {
      // 16番ピースを結果に格納I
      if (piece.num === 16) {
        result = piece;
        return true;
      }
    });
    return result;
  },
  // ピースの移動処理
  movePiece: function (piece) {
    // 空白ピースを得る
    const blank = this.getBlankPiece();
    // x, yの座標差の絶対値
    const dx = Math.abs(piece.indexPos.x - blank.indexPos.x);
    const dy = Math.abs(piece.indexPos.y - blank.indexPos.y);
    // 隣り合わせの判定
    if ((piece.indexPos.x === blank.indexPos.x && dy === 1) ||
      (piece.indexPos.y === blank.indexPos.y && dx === 1)) {
      // タッチされたピース位置を記憶
      const tPos = Vector2(piece.x, piece.y);
      // ピース移動処理
      piece.tweener
           .to({x:blank.x, y:blank.y}, 100)
           .call(function() {
             blank.setPosition(tPos.x, tPos.y);
             piece.indexPos = this.coordToIndex(piece.position);
             blank.indexPos = this.coordToIndex(blank.position);
           }, this)
           .play();
    }
  },
  // 座標値からインデックス値へ変換
  coordToIndex: function (vec) {
    const x = Math.floor(vec.x / PIECE_SIZE);
    const y = Math.floor(vec.y / PIECE_SIZE);
    return Vector2(x, y);
  },
});
// ピースクラス
phina.define('Piece', {
  // Spriteを継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function (num) {
    // 親クラス初期化
    this.superInit('pieces', PIECE_SIZE, PIECE_SIZE);
    // 数字
    this.num = num;
    // フレーム指定
    this.frameIndex = this.num - 1;
    // 位置インデックス
    this.indexPos = Vector2.ZERO;
  },
});
// メイン
phina.main(function () {
  const app = GameApp({
    startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  app.run();
});
