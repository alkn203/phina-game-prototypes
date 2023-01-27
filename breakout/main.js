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
const BALL_SPEED = 10;             // ボールのスピード
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
    // ボール
    this.ball = Ball().addChildTo(this);
    this.ball.setPosition(this.gridX.center(), this.gridY.span(10));
    // ブロック配置
    this.createBlock();
    // ボール初期移動量
    this.ball.vec = Vector2(1, 5);
  },
  // ブロック配置
  createBlock: function() {
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
  // 毎フレーム更新
  update: function() {
    // ボール移動
    this.ball.move();
    // パドルとの当たり判定
    this.hitTestPaddle();
    // 壁との当たり判定
    this.hitTestWall();
    // ブロックとの当たり判定
    this.hitTestBlock();
  },
  // パドルとの当たり判定
  hitTestPaddle: function() {
    if (this.ball.hitTestElement(this.paddle)) {
      // 反射
      this.ball.reflectY();
    }
  },
  // 壁との当たり判定
  hitTestWall: function() {
    // 上
    if (this.ball.top < 0) {
      // 位置補正して反射
      this.ball.top = 0;
      this.ball.reflectY();
    }
    // 下
    if (this.ball.bottom > SCREEN_HEIGHT) {
      this.ball.bottom = SCREEN_HEIGHT;
      this.ball.reflectY();
    }
    // 左
    if (this.ball.left < 0) {
      this.ball.left = 0;
      this.ball.reflectX();
    }
    // 右
    if (this.ball.right > SCREEN_WIDTH) {
      this.ball.right = SCREEN_WIDTH;
      this.ball.reflectX();
    }
  },
  // ブロックとの当たり判定
  hitTestBlock: function() {
    
    if (this.ball.hitTestElement(this.paddle)) {
      // 反射
      this.ball.reflectY();
    }
  },
});
// パドルクラス
phina.define('Paddle', {
  // Spriteを継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('paddle');
  },
});
// ボールクラス
phina.define('Ball', {
  // Spriteを継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('ball');
    // 移動ベクトル
    this.vec = Vector2.ZERO;
  },
  // 移動
  move: function() {
    // 移動ベクトルを正規化して速さを乗じる
    this.vec.normalize().mul(BALL_SPEED);
    this.moveBy(this.vec.x, this.vec.y);
  },
  // 横移動反射
  reflectX: function() {
    this.vec.x *= -1;
  },
  // 縦移動反射
  reflectY: function() {
    this.vec.y *= -1;
  },
});
// ブロッククラス
phina.define('Block', {
  // Spriteを継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
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
