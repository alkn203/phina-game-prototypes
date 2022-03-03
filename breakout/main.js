phina.globalize();
// 定数
var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 960;
var BLOCK_WIDTH = 64;
var BLOCK_HEIGHT = 32;
var BALL_SPEED = 6;
var BALL_XDIR_ADJ = 6;
// アセット
var ASSETS = {
  // 画像
  image: {
    'paddle': 'https://cdn.jsdelivr.net/gh/alkn203/phina-breakout-tutorial@main/assets/paddle.png',
    'ball': 'https://cdn.jsdelivr.net/gh/alkn203/phina-breakout-tutorial@main/assets/ball.png',
    'block': 'https://cdn.jsdelivr.net/gh/alkn203/phina-breakout-tutorial@main/assets/block.png',
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
    this.gx = Grid(SCREEN_WIDTH, 10);
    this.gy = Grid(SCREEN_HEIGHT, 30);
    // ブロックグループ
    this.blockGroup = DisplayElement().addChildTo(this);
    // パドル
    this.paddle = Paddle().addChildTo(this);
    this.paddle.x = this.gx.center();
    this.paddle.y = this.gy.span(26);
    // ボール
    this.ball = Ball().addChildTo(this);
    this.ball.x = this.gx.center();
    this.ball.y = this.gy.center(2);
    // ボールの初速度
    this.ball.setDirSpeed(0, 1, BALL_SPEED);

    this.locateBlocks();
  },
  // ブロック配置
  locateBlocks: function() {
    var gx = this.gx;
    var gy = this.gy;
    var dx = BLOCK_WIDTH / 2;
    var dy = BLOCK_HEIGHT / 2;
    var group = this.blockGroup;
    
    Array.range(1, 9).each(function(i) {
      Array.range(2, 5).each(function(j) {
        var block = Block().addChildTo(group);
        block.setPosition(gx.span(i) + dx, gy.span(j) + dy);
      });
    });      
    Array.range(1, 9).each(function(i) {
      Array.range(5, 8).each(function(j) {
        var block = Block(1).addChildTo(group);
        block.setPosition(gx.span(i) + dx, gy.span(j) + dy);
      });
    });      
    Array.range(1, 9).each(function(i) {
      Array.range(8, 11).each(function(j) {
        var block = Block(2).addChildTo(group);
        block.setPosition(gx.span(i) + dx, gy.span(j) + dy);
      });
    });      
  },
  //
  onpointmove: function(e) {
    var paddle = this.paddle
    // マウスのX座標を取得
    var x = e.pointer.x;
    // パドル移動
    paddle.x = x;
    // 画面端からはみ出さないようにする
    if (paddle.left < 0) {
      paddle.left = 0;
    }
    if (paddle.right > SCREEN_WIDTH) {
      paddle.right = SCREEN_WIDTH;
    }
  },
  // 毎フレーム処理
  update: function() {
    //
    this.hitTestBallOutside();
    this.hitTestBallPaddle();
    this.hitTestBallBlock();
    this.removeBlock();
    this.ball.move();
  },
  // ボールとパドルの当たり判定
  hitTestBallPaddle: function() {
    var ball = this.ball;
    var rect = ball.getNextRect();
    var paddle = this.paddle;
    // 矩形判定    
    if (Collision.testRectRect(rect, paddle)) {
      // 上からヒット
      if (ball.y < paddle.y) {
        ball.flipY();
        ball.bottom = paddle.top;
      }
　　　　// 横方向の反射を決定
      var x = (ball.x - paddle.x) / BALL_XDIR_ADJ;
      ball.setDirSpeed(x, ball.vec.y, BALL_SPEED);
    }
  },
  // ボールとブロックの当たり判定
  hitTestBallBlock: function() {
    var rect = this.ball.getNextRect();
    var ball = this.ball;
    var self = this;
    // ブロックグループをループ
    this.blockGroup.children.some(function(block) {
      // 矩形判定でヒット
      if (Collision.testRectRect(rect, block)) {
        // 削除フラグ
        block.isRemove = true;
        // 矩形がブロックの横範囲に収まっている場合
        if (block.left < rect.left && rect.right < block.right) {
          // 下からヒット
          if (ball.y > block.y) {
            // 縦方向の移動を反転
            ball.flipY();
            ball.top = block.bottom;
            return true;
          }
          // 上からヒット
          if (ball.y < block.y) {
            ball.flipY();
            ball.bottom = block.top;
            return true;
          }
        }
        // ボールがブロックの縦範囲に収まっている場合
        if (rect.top > block.top && rect.bottom < block.bottom) {
          // 左からヒット
          if (ball.x < block.x) {
            ball.flipX();
            ball.right = block.left;
            return true;
          }
          // 右からヒット
          if (ball.x > block.x) {
            ball.flipX();
            ball.left = block.right;
            return true;
          }
        }
        // 左上角にヒット
        if (rect.left < block.left && block.left < rect.right && rect.top < block.top && block.top < rect.bottom) {
          // 左に隣接してブロックがある場合
          if (self.getBlockByXY(block.x - BLOCK_WIDTH, block.y)) {
            ball.bottom = block.top;
            ball.flipY();
            return true;
          }
          // 上に隣接してブロックがある場合
          if (self.getBlockByXY(block.x, block.y - BLOCK_HEIGHT)) {
            ball.right = block.left;
            ball.flipX();
            return true;
          }

          ball.right = block.left;
          ball.bottom = block.top;
          // ボールの向きスピード設定
          ball.setDirSpeed(-1, -1, BALL_SPEED);
          return true;
        }
        // 左下角にヒット
        if (rect.left < block.left && block.left < rect.right && rect.top < block.bottom && block.bottom < rect.bottom) {
          // 左に隣接してブロックがある場合
          if (self.getBlockByXY(block.x - BLOCK_WIDTH, block.y)) {
            ball.top = block.bottom;
            ball.flipY();
            return true;
          }
          // 下に隣接してブロックがある場合
          if (self.getBlockByXY(block.x, block.y + BLOCK_HEIGHT)) {
            ball.right = block.left;
            ball.flipX();
            return true;
          }

          ball.right = block.left;
          ball.top = block.bottom;
          ball.setDirSpeed(-1, 1, BALL_SPEED);
          return true;
        }
        // 右上角にヒット
        if (rect.left < block.right && block.right < rect.right && rect.top < block.top && block.top < rect.bottom) {
          // 右に隣接してブロックがある場合
          if (self.getBlockByXY(block.x + BLOCK_WIDTH, block.y)) {
            ball.bottom = block.top;
            ball.flipY();
            return true;
          }
          // 上に隣接してブロックがある場合
          if (self.getBlockByXY(block.x, block.y - BLOCK_HEIGHT)) {
            ball.left = block.right;
            ball.flipX();
            return true;
          }

          ball.left = block.right;
          ball.bottom = block.top;
          ball.setDirSpeed(1, -1, BALL_SPEED);
          return true;
        }
        // 右下角にヒット
        if (rect.left < block.right && block.right < rect.right && rect.top < block.bottom && block.bottom < rect.bottom) {
          // 右に隣接してブロックがある場合
          if (self.getBlockByXY(block.x + BLOCK_WIDTH, block.y)) {
            ball.top = block.bottom;
            ball.flipY();
            return true;
          }
          // 下に隣接してブロックがある場合
          if (self.getBlockByXY(block.x, block.y + BLOCK_HEIGHT)) {
            ball.left = block.right;
            ball.flipX();
            return true;
          }

          ball.left = block.right;
          ball.top = block.bottom;
          ball.setDirSpeed(1, 1, BALL_SPEED);
          return true;
        }
      }
    });
  },
  // ボールと画面外との当たり判定
  hitTestBallOutside: function() {
    var rect = this.ball.getNextRect();
    var ball = this.ball;
    //
    if (rect.x < 0) {
      ball.left = 0;
      ball.flipX();
    }
    //
    if (rect.x + rect.width > SCREEN_WIDTH) {
      ball.right = SCREEN_WIDTH;
      ball.flipX();
    }
    //
    if (rect.y < 0) {
      ball.top = 0;
      ball.flipY();
    }
    // 画面下落下
    if (ball.top > SCREEN_HEIGHT) {
      this.exit();
    }
  },
  // ブロック削除処理
  removeBlock: function() {
    this.blockGroup.children.eraseIfAll(function(block) {
      // 削除フラクがあれば削除
      if (block.isRemove) {
        return true;
      }
    });
  },
  // 指定された座標のブロックを返す
  getBlockByXY: function(x, y) {
    var result = null;
    
    this.blockGroup.children.some(function(block) {
      if (block.x === x && block.y === y) {
        result = block;
        return true;
      }
    });
    return result;
  },
});
/*
 * パドル
 */
phina.define('Paddle', {
  // Spriteクラスを継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('paddle');
  },
});
/*
 * ボール
 */
phina.define('Ball', {
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('ball');
    // 速度
    this.vec = Vector2(0, 0);
  },
  // ボールの向き速度を決定
  setDirSpeed: function(x, y, speed) {
    var len = this.vec.length();
    this.vec = Vector2(x, y).normalize().mul(speed);
  },
  // 移動
  move: function() {
    this.moveBy(this.vec.x, this.vec.y);
  },
  // 横方向速度反転
  flipX: function() {
    this.vec.x *= -1;
  },
  // 縦方向速度反転
  flipY: function() {
    this.vec.y *= -1;
  },
  // 次の移動先の矩形
  getNextRect() {
    var rect = Rect(this.left + this.vec.x, this.top + this.vec.y, this.width, this.height);
    return rect;
  },
});
/*
 * ブロック
 */
phina.define('Block', {
  superClass: 'Sprite',
  // コンストラクタ
  init: function(index) {
    // 親クラス初期化
    this.superInit('block', BLOCK_WIDTH, BLOCK_HEIGHT);
    // フレームインデックス指定
    index = (index !== undefined) ? index : 0;
    this.setFrameIndex(index);
    // 削除フラグ
    this.isRemove = false;
  },
});
// メイン
phina.main(function() {
  var app = GameApp({
    // fps設定
    fps: 60,
    // アセット読み込み
    assets: ASSETS,
  });
  app.run();
});