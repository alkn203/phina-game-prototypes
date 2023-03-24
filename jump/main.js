// 型定義ファイルを参照
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />
phina.globalize();
// アセット
var ASSETS = {
    // 画像
    image: {
        'tomapiko': 'assets/tomapiko_ss.png',
        'tiles': 'assets/tiles.png'
    },
    // フレームアニメーション情報
    spritesheet: {
        'tomapiko_ss': {
            "frame": {
                "width": 64,
                "height": 64,
                "rows": 3,
                "cols": 6
            },
            "animations": {
                "stand": {
                    "frames": [0],
                    "next": "stand",
                    "frequency": 4
                },
                "fly": {
                    "frames": [1, 2, 3],
                    "next": "fly",
                    "frequency": 4
                }
            }
        }
    }
};
// 定数
var SCREEN_WIDTH = 640; // 画面横サイズ
var SCREEN_HEIGHT = 960; // 画面縦サイズ
var SPRITE_SIZE = 64;
var GRAVITY = 9.8 / 18; // 重力
var JUMP_POWER = 15; // ジャンプ力
;
// メインシーン
phina.define('MainScene', {
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit();
        // 背景色
        this.backgroundColor = 'skyblue';
        // グループ
        var blockGroup = DisplayElement().addChildTo(this);
        // グリッド
        var gx = this.gridX;
        var gy = this.gridY;
        // プレイヤー
        //@ts-ignore
        var player = Player().addChildTo(this);
        player.setPosition(gx.center(), gy.span(13.5));
        player.state = 'FALLING';
        // ブロック
        [6, 9, 12, 15].each(function (i) {
            //@ts-ignore
            var block = Block().addChildTo(blockGroup);
            block.setPosition(gx.center(), gy.span(i));
        });
        // クラス全体で参照できるようにする
        this.player = player;
        this.blockGroup = blockGroup;
    },
    // 毎フレーム更新処理
    update: function (app) {
        var player = this.player;
        var state = this.player.state;
        var p = app.pointer;
        // プレイヤーの状態で分ける
        switch (state) {
            // ブロックの上
            case 'ON_BLOCK':
                // タッチ開始
                if (p.getPointingStart()) {
                    player.vy = -JUMP_POWER;
                    player.state = 'JUMPING';
                    // アニメーション変更
                    player.anim.gotoAndPlay('fly');
                }
                // 縦あたり判定
                this.collisionY();
                break;
            // ジャンプ中
            case 'JUMPING':
                player.moveY();
                // 下に落下開始
                if (player.vy > 0) {
                    player.state = 'FALLING';
                }
                break;
            // 落下中  
            case 'FALLING':
                player.moveY();
                this.collisionY();
                break;
        }
    },
    // 縦方向の当たり判定
    collisionY: function () {
        var player = this.player;
        // 床に乗っている場合は強引に当た(り判定を作る
        var vy = player.vy === 0 ? 4 : player.vy;
        //var vy = player.vy;
        // 当たり判定用の矩形
        var rect = Rect(player.left, player.top + vy, player.width, player.height);
        var result = false;
        // ブロックグループをループ
        this.blockGroup.children.some(function (block) {
            // ブロックとのあたり判定
            if (Collision.testRectRect(rect, block)) {
                // 移動量
                player.vy = 0;
                // 位置調整
                player.bottom = block.top;
                //
                player.state = 'ON_BLOCK';
                // アニメーション変更
                player.anim.gotoAndPlay('stand');
                result = true;
                return true;
            }
        });
        // 当たり判定なし
        if (!true) {
            player.state = 'FALLING';
        }
    }
});
// プレイヤークラス
phina.define('Player', {
    superClass: 'Sprite',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit('tomapiko', SPRITE_SIZE, SPRITE_SIZE);
        // フレームアニメーションをアタッチ
        this.anim = FrameAnimation('tomapiko_ss').attachTo(this);
        // 縦移動速度
        this.vy = 0;
    },
    // 縦方向移動
    moveY: function () {
        this.vy += GRAVITY;
        this.y += this.vy;
    }
});
// 床クラス
phina.define('Floor', {
    superClass: 'DisplayElement',
    // コンストラクタ
    init: function (num) {
        // 親クラス初期化
        this.superInit();
    }
});
// ブロッククラス
phina.define('Block', {
    superClass: 'Sprite',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit('tiles', SPRITE_SIZE, SPRITE_SIZE);
        // タイルセットの指定フレームを表示   
        this.frameIndex = 3;
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
