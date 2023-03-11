// 型定義ファイルを参照
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />

phina.globalize();
// 定数
const SCREEN_WIDTH = 640;
const PIECE_SIZE = SCREEN_WIDTH / 4;
const PIECE_NUM = 16;
const PIECE_NUM_X = 4;
const PIECE_OFFSET = PIECE_SIZE / 2;
// アセット
const ASSETS = {
  // 画像
  image: {
    'pieces': 'assets/pieces.png',
  },
};
// 自作クラス補完用
interface Piece extends Sprite {
  num: number
}
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
    const button: Button = Button({
      text: 'SHUFFLE'
    }).addChildTo(this);
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
    var grid: Grid = this.grid;

    for (let i = 0; i < PIECE_NUM; i++) {
      // グリッド配置用のインデックス値算出
      const sx: number = i % PIECE_NUM_X;
      const sy: number = Math.floor(i / PIECE_NUM_X);
      // 番号
      const num: number = i + 1;
      // ピース作成
      // @ts-ignore
      const piece: Piece = Piece(num).addChildTo(this.pieceGroup);
      // Gridを利用して配置
      piece.x = grid.span(sx) + PIECE_OFFSET;
      piece.y = grid.span(sy) + PIECE_OFFSET;
      // タッチを有効にする
      piece.setInteractive(true, 'rect');
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
   */
  movePiece: function(piece: Piece, instantly: boolean = false) {
    // 空白ピース
    const blank: Piece = this.blank;
    // 即入れ替え
    if (instantly) {
      const pos: Vector2 = Vector2(piece.x, piece.y);
      piece.setPosition(blank.x, blank.y);
      blank.setPosition(pos.x, pos.y);
      return;
    }
    // x, yの座標差の絶対値
    const dx: number = Math.abs(piece.x - blank.x);
    const dy: number = Math.abs(piece.y - blank.y);
    // 隣り合わせの判定
    if ((piece.x === blank.x && dy === PIECE_SIZE) ||
      (piece.y === blank.y && dx === PIECE_SIZE)) {
      // タッチされたピース位置を記憶
      const pos: Vector2 = Vector2(piece.x, piece.y);
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
   */
  shufflePiece: function() {
    // 隣接ピース格納用
    let arr: Piece[] = [];
    // 空白ピースを得る
    const blank: Piece = this.blank;
    // 上下左右隣りのピースがあれば配列に追加
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (Math.abs(i + j) === 1) {
          const x: number = blank.x + i * PIECE_SIZE;
          const y: number = blank.y + j * PIECE_SIZE;
          const target: Piece | null = this.getPiece(x, y);
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
  getPiece: function(x: number, y: number): Piece | null {
    const children: Piece[] = this.pieceGroup.children;
    const len: number = children.length;
    
    for (let i = 0; i < len; i++) {
      const piece: Piece = children[i];
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
 */
phina.define('Piece', {
  // Spriteを継承
  superClass: 'Sprite',
  /**
   * コンストラクタ
   */
  init: function (num: number) {
    // 親クラス初期化
    this.superInit('pieces', PIECE_SIZE, PIECE_SIZE);
    // 数字
    this.num = num;
    // フレーム
    this.frameIndex = num - 1;
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
