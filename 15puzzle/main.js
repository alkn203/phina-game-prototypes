// 型定義ファイルを参照
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />

phina.globalize();
// 定数
const SCREEN_W = 640;            // 画面横サイズ
const SCREEN_H = 960;           // 画面縦サイズ
const PIECE_SIZE = SCREEN_W / 4; // グリッドのサイズ
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
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'black';
    // グリッド
    this.grid = Grid(SCREEN_W, PIECE_NUM_X);
    // ピースグループ
    this.pieceGroup = DisplayElement().addChild(this);
    // 空白ピース
    this.blank = null;
    // シャッフルボタン配置
    this.createButton();
    // ピース配置
    this.createPiece();
  },
  /**
   * シャッフルボタン作成
   */
  createButton: function() {
    var button = Button({ text: 'SHUFFLE' }).addChildTo(this);
    button.x = this.gridX.center();
    button.y = this.gridY.span(13);
    // ボタンプッシュ時処理
    button.on('push', () => {
      // ピースをシャッフル
      for (let i = 0; i < 100; i++) {
        this.shufflePiece();  
      }
    });
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
      const piece = Piece(num).addChildTo(this.pieceGroup);
      // Gridを利用して配置
      piece.x = grid.span(sx) + PIECE_OFFSET;
      piece.y = grid.span(sy) + PIECE_OFFSET;
      // タッチを有効にする
      piece.setInteractive(true);
      // タッチされた時の処理
      piece.on('pointend', () => {
        // ピース移動処理
        this.movePiece(piece);
      });
      // 16番のピースは非表示
      if (num === 16) {
        this.blank = piece;
        piece.hide();
      }
    }
  },
  /**
   * ピースの移動処理
   * @param {Piece} piece
   */
  movePiece: function(piece, instantly = false) {
    // 空白ピース
    /** @type {Piece} */
    const blank = this.blank;
    // 即入れ替え
    if (instantly) {
      const pos = Vector2(piece.x, piece.y);
      piece.setPosition(blank.x, blank.y);
      blank.setPosition(pos.x, pos.y);
      return;
    }
    // x, yの座標差の絶対値
    const dx = Math.abs(piece.x - blank.x);
    const dy = Math.abs(piece.y - blank.y);
    // 隣り合わせの判定
    if ((piece.x === blank.x && dy === PIECE_SIZE) ||
      (piece.y === blank.y && dx === PIECE_SIZE)) {
      // タッチされたピース位置を記憶
      // @ts-ignore
      const pos = Vector2(piece.x, piece.y);
      // ピース移動処理
      piece.tweener.to({x:blank.x, y:blank.y}, 100)
                   .call(() => {
                     blank.setPosition(pos.x, pos.y);
                   })
                   .play();
    }
  },
  /**
   * ピースをシャッフルする
   *
   * @param {number} x
   * @param {number} y
   * @return {Piece | null} 
   */
  shufflePiece: function() {
    // 隣接ピース格納用
    var arr = [];
    // 空白ピースを得る
    var blank = this.blank;
    // 上下左右隣りのピースがあれば配列に追加
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (Math.abs(i + j) === 1) {
          const x = blank.x + i * PIECE_SIZE;
          const y = blank.y + j * PIECE_SIZE;
          const target = this.getPiece(x, y);
          if (target) {
            arr.push(target);
          }   
        }
      }
    }
    // 隣接ピースからランダムに選択して空白ピースと入れ替える
    this.movePiece(arr.random(), true);
    arr.clear();
  },
  /**
  * 指定された座標のピースを返す
  */
  getPiece: function(x, y) {
    const children = this.pieceGroup.children;
    const len = children.length;
    
    for (let i = 0; i < len; i++) {
      const piece = children[i];
      // 座標が一致
      if (piece.x === x && piece.y === y) {
        return piece;
      }
    }
    return null;
  }
});
    
/**
 * ピースクラス
 * @typedef Piece
 * @property {number} num
 * @property {number} frameIndex
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
    this.superInit('pieces', PIECE_SIZE, PIECE_SIZE);
    // 数字
    this.num = num;
    // フレーム
    this.frameIndex = this.num - 1;
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
