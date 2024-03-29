// 型定義ファイルを参照
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />
phina.globalize();
// 定数
var SCREEN_WIDTH = 640; // 画面横サイズ
var SCREEN_HEIGHT = 960; // 画面縦サイズ
var BLOCK_WIDTH = 64; // ブロック横幅
var BLOCK_HEIGHT = 32; // ブロック縦幅
var BLOCK_NUM_X = 8; // 横配置ブロック数
var BLOCK_NUM = 48; // 総配置ブロック数
var OFFSET_X = BLOCK_WIDTH / 2; // 縦位置調整用
var OFFSET_Y = BLOCK_HEIGHT / 2; // 横位置調整用
var PADDLE_Y = 24; // パドルの縦位置
var BALL_SPEED = 10; // ボールのスピード
var SENSE = 5; // コントロール感度
var X_ADJ = 6; // パドル反射調整値
// アセット
var ASSETS = {
    // 画像
    image: {
        'paddle': 'assets/paddle.png',
        'ball': 'assets/ball.png',
        'block': 'assets/block.png'
    }
};
/**
 * メインシーン
 */
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
        // @ts-ignore
        this.paddle = Paddle().addChildTo(this);
        this.paddle.setPosition(this.gridX.center(), this.gridY.span(PADDLE_Y));
        // ボール
        // @ts-ignore
        this.ball = Ball().addChildTo(this);
        this.ball.setPosition(this.gridX.center(), this.gridY.span(10));
        // ブロック配置
        this.createBlock();
        // ボール初期移動量
        this.ball.vec = Vector2(0, 1);
    },
    /**
     * ブロック配置
     */
    createBlock: function () {
        for (var i = 0; i < BLOCK_NUM; i++) {
            // グリッド配置用のインデックス値算出
            var sx = i % BLOCK_NUM_X;
            var sy = Math.floor(i / BLOCK_NUM_X);
            // ブロック作成
            //@ts-ignore
            var block = Block().addChildTo(this.blockGroup);
            // Gridを利用して配置
            block.x = this.gridX.span(sx) + OFFSET_X + BLOCK_WIDTH;
            block.y = this.gridY.span(sy) + OFFSET_Y + BLOCK_HEIGHT;
            // 画像変更
            if (i <= 15) {
                block.frameIndex = 0;
            }
            if (i > 15) {
                block.frameIndex = 1;
            }
            if (i > 31) {
                block.frameIndex = 2;
            }
        }
    },
    /**
     * 毎フレーム更新
     */
    update: function () {
        // ボール移動
        this.ball.move();
        // パドルとの当たり判定
        this.hitTestPaddle();
        // 壁との当たり判定
        this.hitTestWall();
        // ブロックとの当たり判定
        this.hitTestBlock();
        // 画面下落下判定
        this.checkOutside();
    },
    /**
     * マウス移動時
     */
    onpointmove: function (e) {
        var paddle = this.paddle;
        // 前のフレームからの移動距離
        var dx = e.pointer.dx * SENSE;
        // パドル移動
        paddle.x += dx;
        // 移動制限
        if (paddle.left < 0) {
            paddle.left = 0;
        }
        if (paddle.right > SCREEN_WIDTH) {
            paddle.right = SCREEN_WIDTH;
        }
    },
    /**
     * パドルとの当たり判定
     */
    hitTestPaddle: function () {
        if (this.ball.hitTestElement(this.paddle)) {
            var dx = this.ball.x - this.paddle.x;
            this.ball.vec.x = dx / X_ADJ;
            // 反射
            this.ball.reflectY();
        }
    },
    /**
     * 壁との当たり判定
     */
    hitTestWall: function () {
        var ball = this.ball;
        // 上
        if (ball.top < 0) {
            // 位置補正して反射
            ball.top = 0;
            ball.reflectY();
        }
        // 左
        if (ball.left < 0) {
            ball.left = 0;
            ball.reflectX();
        }
        // 右
        if (ball.right > SCREEN_WIDTH) {
            ball.right = SCREEN_WIDTH;
            ball.reflectX();
        }
    },
    /**
     * ブロックとの当たり判定
     */
    hitTestBlock: function () {
        var ball = this.ball;
        var group = this.blockGroup.children;
        // ブロックグループをループ
        for (var i = 0, len = group.length; i < len; i++) {
            var block = group[i];
            //@ts-ignore
            if (ball.hitTestElement(block)) {
                // 上から
                if (ball.vec.y > 0 && ball.top < block.top) {
                    ball.bottom = block.top;
                    ball.reflectY();
                    // ブロック削除
                    block.remove();
                    return;
                }
                // 下から
                if (ball.vec.y < 0 && block.bottom < ball.bottom) {
                    ball.top = block.bottom;
                    ball.reflectY();
                    block.remove();
                    return;
                }
                // 左から
                if (ball.vec.x > 0 && ball.left < block.left) {
                    ball.right = block.left;
                    ball.reflectX();
                    block.remove();
                    return;
                }
                // 右から
                if (ball.vec.x < 0 && block.right < ball.right) {
                    ball.left = block.right;
                    ball.reflectX();
                    block.remove();
                    return;
                }
            }
        }
    },
    /**
     * 画面下落下判定
     */
    checkOutside: function () {
        if (this.ball.top > SCREEN_HEIGHT) {
            //
            this.exit();
        }
    }
});
/**
 * パドルクラス
 */
phina.define('Paddle', {
    // Spriteを継承
    superClass: 'Sprite',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit('paddle');
    }
});
/**
 * ボールクラス
 */
phina.define('Ball', {
    // Spriteを継承
    superClass: 'Sprite',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit('ball');
        // 移動ベクトル
        this.vec = Vector2.ZERO;
    },
    // 移動
    move: function () {
        // 移動ベクトルを正規化して速さを乗じる
        this.vec.normalize().mul(BALL_SPEED);
        this.x += this.vec.x | 0;
        this.y += this.vec.y | 0;
    },
    // 横移動反射
    reflectX: function () {
        this.vec.x *= -1;
    },
    // 縦移動反射
    reflectY: function () {
        this.vec.y *= -1;
    }
});
/**
 * ブロッククラス
 */
phina.define('Block', {
    // Spriteを継承
    superClass: 'Sprite',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit('block', BLOCK_WIDTH, BLOCK_HEIGHT);
    }
});
// メイン
phina.main(function () {
    var app = GameApp({
        startLabel: 'main',
        // アセット読み込み
        assets: ASSETS
    });
    app.run();
});
