phina.globalize();
// 定数
const SCREEN_WIDTH = 640;          // 画面横サイズ
const SCREEN_HEIGHT = 960;         // 画面縦サイズ
const BLOCK_WIDTH = 64;            // ブロック横幅
const BLOCK_HEIGHT = 32;           // ブロック縦幅
const BLOCK_NUM_X = 8;             // 横配置ブロック数
const BLOCK_NUM = 48;              // 総配置ブロック数
const OFFSET_X = BLOCK_WIDTH / 2;  // 縦位置調整用
const OFFSET_Y = BLOCK_HEIGHT / 2; // 横位置調整用
const PADDLE_Y = 24;               // パドルの縦位置
// アセット
const ASSETS = {
  // 画像
  image: {
    'paddle': 'assets/paddle.png',
    'ball': 'assets/ball.png',
    'block': 'assets/block.png',
  },
};
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function () {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'black';
    // グリッド
    this.gridX = Grid(SCREEN_WIDTH, SCREEN_WIDTH / BLOCK_WIDTH);
    this.gridY = Grid(SCREEN_HEIGHT, SCREEN_HEIGHT / BLOCK_HEIGHT);
    // ブロックグループ
    this.blockGroup = DisplayElement().addChildTo(this);
    // パドル
    this.paddle = Paddle().addChildTo(this);
    this.paddle.setPosition(this.gridX.center(), this.gridY.span(PADDLE_Y));
    // ブロック配置
    this.createBlock();
  },
  // ブロック配置
  createBlock: function () {
    BLOCK_NUM.times(function(i) {
      // グリッド配置用のインデックス値算出
      const sx = i % BLOCK_NUM_X;
      const sy = Math.floor(i / BLOCK_NUM_X);
      // ブロック作成
      const block = Block().addChildTo(this.blockGroup);
      // Gridを利用して配置
      block.x = this.gridX.span(sx) + OFFSET_X + BLOCK_WIDTH;
      block.y = this.gridY.span(sy) + OFFSET_Y + BLOCK_HEIGHT;
      // 画像変更
      if (i > 15) {
        block.frameIndex = 1;
      }
      if (i > 31) {
        block.frameIndex = 2;
      }
    }, this);
  },
});
// パドルクラス
phina.define('Paddle', {
  // Spriteを継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function () {
    // 親クラス初期化
    this.superInit('paddle');
  },
});
// ブロッククラス
phina.define('Block', {
  // Spriteを継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function () {
    // 親クラス初期化
    this.superInit('block', BLOCK_WIDTH, BLOCK_HEIGHT);
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
