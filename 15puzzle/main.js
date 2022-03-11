phina.globalize();
// 定数
var SCREEN_WIDTH = 640;            // 画面横サイズ
var SCREEN_HEIGHT = 960;           // 画面縦サイズ
var PIECE_SIZE = SCREEN_WIDTH / 4; // グリッドのサイズ
var PIECE_NUM = 16;                // ピース数
var PIECE_NUM_X = 4;               // 横のピース数
var PIECE_OFFSET = PIECE_SIZE / 2; // オフセット値
// アセット
var ASSETS = {
  // 画像
  image: {
    'pieces': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/15puzzle/assets/pieces.png',
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
    this.grid = Grid(SCREEN_WIDTH, PIECE_NUM_X);
    // ピースグループ
    this.pieceGroup = DisplayElement().addChildTo(this);
    
    this.locatePieces();
  },
  // ピース配置
  locatePieces: function() {
    var self = this;
    
    PIECE_NUM.times(function(i) {
      // グリッド配置用のインデックス値算出
      var xIndex = i % PIECE_NUM_X;
      var yIndex = Math.floor(i / PIECE_NUM_X);
      // 番号
      var num = i + 1;
      // ピース作成
      var piece = Piece(num).addChildTo(self.pieceGroup);
      // Gridを利用して配置
      piece.x = self.grid.span(xIndex) + PIECE_OFFSET;
      piece.y = self.grid.span(yIndex) + PIECE_OFFSET;
      // タッチを有効にする
      piece.setInteractive(true);
      // タッチされた時の処理
      piece.onpointend = function() {
        // ピース移動処理
        self.movePiece(this);
      };
      // 16番のピースは非表示
      if (num === 16) piece.hide();
    });
  },
  // 16番ピース（空白）を取得
  getBlankPiece: function() {
    var result = null;
    this.pieceGroup.children.some(function(piece) {
      // 16番ピースを結果に格納
      if (piece.num === 16) {
        result = piece;
        return true;
      }
    });
    return result;
  },
  // ピースの移動処理
  movePiece: function(piece) {
    // 空白ピースを得る
    var blank = this.getBlankPiece();
    // x, yの座標差の絶対値
    var dx = Math.abs(piece.x - blank.x);
    var dy = Math.abs(piece.y - blank.y);
    // 隣り合わせの判定
    if ((piece.x === blank.x && dy === PIECE_SIZE) || 
        (piece.y === blank.y && dx === PIECE_SIZE)) {
      // タッチされたピース位置を記憶
      var touchX = piece.x;
      var touchY = piece.y;
      // ピース入れ替え処理
      piece.setPosition(blank.x, blank.y);
      blank.setPosition(touchX, touchY);
    }
  },
});
// ピースクラス
phina.define('Piece', {
  // Spriteを継承
  superClass: 'Sprite',
    // コンストラクタ
    init: function(num) {
      // 親クラス初期化
      this.superInit('pieces', PIECE_SIZE, PIECE_SIZE);
      // 数字
      this.num = num;
      // フレーム指定
      this.frameIndex = this.num - 1;
    },
});
// メイン
phina.main(function() {
  var app = GameApp({
    startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  app.run();
});