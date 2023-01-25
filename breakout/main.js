phina.globalize();
// 定数
const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 960;
const BLOCK_WIDTH = 64;
const BLOCK_HEIGHT = 32;
const BALL_SPEED = 200;
const BALL_XDIR_ADJ = 6;
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
    const gx = this.gx;
    const gy = this.gy;
    const dx = BLOCK_WIDTH / 2;
    const dy = BLOCK_HEIGHT / 2;
    const group = this.blockGroup;

    Array.range(1, 9).each(function(i) {
      Array.range(2, 5).each(function(j) {
        const block = Block().addChildTo(group);
        block.setPosition(gx.span(i) + dx, gy.span(j) + dy);
      });
    });
    Array.range(1, 9).each(function(i) {
      Array.range(5, 8).each(function(j) {
        const block = Block(1).addChildTo(group);
        block.setPosition(gx.span(i) + dx, gy.span(j) + dy);
      });
    });
    Array.range(1, 9).each(function(i) {
      Array.range(8, 11).each(function(j) {
        const block = Block(2).addChildTo(group);
        block.setPosition(gx.span(i) + dx, gy.span(j) + dy);
      });
    });
  },
  //
  onpointmove: function(e) {
    const paddle = this.paddle
    // マウスのX座標を取得
    const x = e.pointer.x;
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
  update: function(app) {
    //
    //this.hitTestBallOutside();
    this.hitTestBallPaddle();
    //this.hitTestBallBlock();
    //this.removeBlock();
    this.ball.move(app.deltaTime);
    },
  // ボールとパドルの当たり判定
  hitTestBallPaddle: function() {
    const ball = this.ball;
    //const rect = ball.getNextRect();
    const paddle = this.paddle;
    // 矩形判定
    if (Collision.testRectRect(ball, paddle)) {
      // 上からヒット
      if (ball.y < paddle.y) {
        ball.flipY();
        ball.bottom = paddle.top;
      }
      // 横方向の反射を決定
      const x = (ball.x - paddle.x) / BALL_XDIR_ADJ;
      ball.setDirSpeed(x, ball.vec.y, BALL_SPEED);
    }
  },
  // ボールとブロックの当たり判定
  hitTestBallBlock: function() {
    const rect = this.ball.getNextRect();
    const ball = this.ball;
    const self = this;
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
    const rect = this.ball.getNextRect();
    const ball = this.ball;
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
    let result = null;

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
    this.vec = Vector2.ZERO;
  },
  // ボールの向き速度を決定
  setDirSpeed: function(x, y, speed) {
    const len = this.vec.length();
    this.vec = Vector2(x, y).normalize().mul(speed);
  },
  // 移動
  move: function(delta) {
    this.x += (this.vec.x * delta / 1000) | 0;
    this.y += (this.vec.y * delta / 1000) | 0;
    //this.position = Vector2.add(this.position, this.vec.mul(delta / 1000));
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
    const rect = Rect(this.left + this.vec.x, this.top + this.vec.y, this.width, this.height);
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
  const app = GameApp({
    // アセット読み込み
    assets: ASSETS,
  });
  app.run();
});
