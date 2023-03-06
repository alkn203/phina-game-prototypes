phina.globalize();
// 定数
const SCREEN_W = 640;            // 画面横サイズ
const SCREEN_H = 960;           // 画面縦サイズ
const PIECE_SIZE = SCREEN_W / 4; // グリッドのサイズ
const PIECE_NUM = 16;                // ピース数
const PIECE_NUM_X = 4;               // 横のピース数
const PIECE_OFFSET = PIECE_SIZE / 2; // オフセット値
// アセット
// @ts-ignore
const ASSETS = {
  // 画像
  image: {
    'pieces': 'assets/pieces.png',
  },
};
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'black';
    // グリッド
    this.grid = Grid(SCREEN_W, PIECE_NUM_X);
    // ピースグループ
    // @ts-ignore
    this.pieceGroup = DisplayElement().addChild(this);
    // 空白ピース
    this.blank = null;
    // ピース配置
    this.createPiece();
  },
  /**
   * ピース配置
   */
  createPiece: function() {
    /** @type {Grid} */
    var grid = this.grid;

    for (let i = 0; i < PIECE_NUM; i++) {
      // グリッド配置用のインデックス値算出
      const sx = i % PIECE_NUM_X;
      const sy = Math.floor(i / PIECE_NUM_X);
      // 番号
      const num = i + 1;
      // ピース作成
      /** @type {Piece} */
      // @ts-ignore
      const piece = Piece(num).addChildTo(this.pieceGroup);
      // Gridを利用して配置
      // @ts-ignore
      piece.x = grid.span(sx) + PIECE_OFFSET;
      // @ts-ignore
      piece.y = grid.span(sy) + PIECE_OFFSET;
      // グリッド上のインデックス値
      piece.indexPos = Vector2(sx, sy);
      // タッチを有効にする
      // @ts-ignore
      piece.setInteractive(true);
      // タッチされた時の処理
      // @ts-ignore
      piece.on('pointend', () => {
        // ピース移動処理
        this.movePiece(piece);
      });
      // 16番のピースは非表示
      if (num === 16) {
        this.blank = piece;
        // @ts-ignore
        piece.hide();
      }
    }
  },
  /**
   * ピースの移動処理
   * @param {Piece} piece
   */
  movePiece: function(piece) {
    // 空白ピース
    /** @type {Piece} */
    const blank = this.blank;
    // x, yの座標差の絶対値
    const dx = Math.abs(piece.indexPos.x - blank.indexPos.x);
    const dy = Math.abs(piece.indexPos.y - blank.indexPos.y);
    // 隣り合わせの判定
    if ((piece.indexPos.x === blank.indexPos.x && dy === 1) ||
      (piece.indexPos.y === blank.indexPos.y && dx === 1)) {
      // タッチされたピース位置を記憶
      // @ts-ignore
      const tPos = Vector2(piece.x, piece.y);
      // ピース移動処理
      // @ts-ignore
      piece.tweener.to({x:blank.x, y:blank.y}, 100)
                   .call(() => {
                     // @ts-ignore
                     blank.setPosition(tPos.x, tPos.y);
                     // @ts-ignore
                     piece.indexPos = this.coordToIndex(piece.position);
                     // @ts-ignore
                     blank.indexPos = this.coordToIndex(blank.position);
                   })
                   .play();
    }
  },
// ピースをシャッフルする
  shufflePieces: function() {
    var self = this;
    // 隣接ピース格納用
    var pieces = [];
    // 空白ピースを得る
    var blank = this.getBlankPiece();
    // 上下左右隣りのピースがあれば配列に追加
    [1, 0, -1].each(function(i) {
      [1, 0, -1].each(function(j) {
        if (i != j) {
          var x = blank.x + i * GRID_SIZE;
          var y = blank.y + j * GRID_SIZE;
          var target = self.getPieceByXY(x, y);
          if (target) pieces.push(target);
        }
      });
    });
    // 隣接ピースからランダムに選択して空白ピースと入れ替える
    this.movePiece(pieces.random(), 'instantly');
    pieces.clear();
  },
  /**
   * 座標値からインデックス値へ変換
   * @param {Vector2} vec
   * @returns {Vector2}
   */
  coordToIndex: function(vec) {
    const x = Math.floor(vec.x / PIECE_SIZE);
    const y = Math.floor(vec.y / PIECE_SIZE);
    return Vector2(x, y);
  },
});
/**
 * ピースクラス
 * @typedef Piece
 * @property {number} num
 * @property {number} frameIndex
 * @property {Vector2} indexPos
 */
phina.define('Piece', {
  // Spriteを継承
  superClass: 'Sprite',
  /**
   * コンストラクタ
   * @constructor
   * @param {number} num
   */
  init: function (num) {
    // 親クラス初期化
    // @ts-ignore
    this.superInit('pieces', PIECE_SIZE, PIECE_SIZE);
    // 数字
    this.num = num;
    // フレーム
    this.frameIndex = this.num - 1;
    // 位置インデックス
    this.indexPos = Vector2.ZERO;
  },
});
/**
 * メイン
 */
phina.main(function () {
  const app = GameApp({
    startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  app.run();
});
