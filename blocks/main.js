// 型定義ファイルを参照
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />
phina.globalize();
// 定数
var BLOCK_SIZE = 40;
var BLOCK_OFFSET = BLOCK_SIZE / 2;
var BLOCK_COLS = 10;
var BLOCK_ROWS = 20;
var BLOCK_NUM = 4;
var BLOCK_TYPE = 7;
var BOTTOM_Y = 20;
var EDGE_LEFT = 2;
var EDGE_RIGHT = 13;
var INTERVAL = 200;
// アセット
var ASSETS = {
    // 画像
    image: {
        'block': 'assets/block.png'
    }
};
// ブロック(7種)の配置情報
var BLOCK_LAYOUT = [
    [Vector2(0, 0), Vector2(0, -1), Vector2(0, -2), Vector2(0, 1)],
    [Vector2(0, 0), Vector2(0, -1), Vector2(0, 1), Vector2(1, 1)],
    [Vector2(0, 0), Vector2(0, -1), Vector2(0, 1), Vector2(-1, 1)],
    [Vector2(0, 0), Vector2(0, -1), Vector2(-1, -1), Vector2(1, 0)],
    [Vector2(0, 0), Vector2(0, -1), Vector2(1, -1), Vector2(-1, 0)],
    [Vector2(0, 0), Vector2(1, 0), Vector2(-1, 0), Vector2(0, -1)],
    [Vector2(0, 0), Vector2(0, -1), Vector2(1, -1), Vector2(1, 0)]
];
// キー用配列
var KEY_ARRAY = [
    ["left", Vector2.LEFT],
    ["right", Vector2.RIGHT]
];
;
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
        this.backgroundColor = 'gray';
        // ブロック移動領域
        var blockArea = RectangleShape({
            width: BLOCK_SIZE * BLOCK_COLS,
            height: BLOCK_SIZE * BLOCK_ROWS,
            fill: 'black'
        }).addChildTo(this);
        blockArea.x = this.gridX.center();
        blockArea.top = 0;
        // グループ 
        this.dynamicGroup = DisplayElement().addChildTo(this);
        this.staticGroup = DisplayElement().addChildTo(this);
        // 変数
        this.prevTime = 0;
        this.curTime = 0;
        this.interval = INTERVAL;
        this.removeLine = [];
        // ブロック作成
        this.createBlock();
    },
    /**
     * 毎フレーム処理
     */
    update: function (app) {
        this.curTime += app.deltaTime;
        if (this.dynamicGroup.children.length > 0) {
            // 一定時間毎にブロック落下
            if (this.curTime - this.prevTime > this.interval) {
                this.moveBlockY();
                this.prevTime = this.curTime;
            }
            // ブロック横移動
            this.moveBlockX(app);
        }
    },
    /**
     * ブロック作成関数
     */
    createBlock: function () {
        var _this = this;
        // 種類をランダムに決める
        var type = Random.randint(0, BLOCK_TYPE - 1);
        // 落下ブロック作成
        BLOCK_NUM.times(function () {
            //@ts-ignore
            var block = Block().addChildTo(_this.dynamicGroup);
            // ブロックの種類
            block.type = type;
            // フレームインデックス設定
            block.frameIndex = type;
        });
        // 中心ブロック
        var org = this.dynamicGroup.children.first;
        org.x = this.gridX.center() + BLOCK_OFFSET;
        org.y = BLOCK_OFFSET;
        // 配置情報データをもとにブロックを配置
        this.dynamicGroup.children.each(function (block, i) {
            block.x = org.x + BLOCK_LAYOUT[type][i].x * BLOCK_SIZE;
            block.y = org.y + BLOCK_LAYOUT[type][i].y * BLOCK_SIZE;
            block.indexPos = _this.coordToIndex(block.position);
        });
    },
    /**
     * ブロック左右移動
     */
    moveBlockX: function (app) {
        var _this = this;
        var key = app.keyboard;
        // 配列ループ
        KEY_ARRAY.each(function (item) {
            // キー入力チェック
            if (key.getKeyDown(item[0])) {
                // 移動
                _this.moveBlock(item[1]);
                // 両端チェックと固定ブロックとの当たり判定
                if (_this.hitEdge() || _this.hitStatic()) {
                    //  ブロックを戻す
                    //@ts-ignore
                    _this.moveBlock(Vector2.mul(item[1], -1));
                }
            }
        });
    },
    /**
     * ブロック落下処理
     */
    moveBlockY: function () {
        // 1ブロック分落下
        this.moveBlock(Vector2.DOWN);
        // 画面下到達か固定ブロックにヒット
        if (this.hitBottom() || this.hitStatic()) {
            // ブロックを戻す
            this.moveBlock(Vector2.UP);
            // 固定ブロックへ追加
            this.dynamicToStatic();
            this.createBlock();
        }
    },
    /**
     * ブロック移動処理
     */
    moveBlock: function (vec) {
        this.dynamicGroup.children.each(function (block) {
            block.position.add(Vector2.mul(vec, BLOCK_SIZE));
            block.indexPos.add(vec);
        });
    },
    /**
     * 画面下到達チェック
     */
    hitBottom: function () {
        var children = this.dynamicGroup.children;
        var len = children.length;
        for (var i = 0; i < len; i++) {
            var block = children[i];
            if (block.indexPos.y === BOTTOM_Y) {
                return true;
            }
        }
        return false;
    },
    /**
     * 両端チェック
     */
    hitEdge: function () {
        var children = this.dynamicGroup.children;
        var len = children.length;
        for (var i = 0; i < len; i++) {
            var block = children[i];
            if (block.indexPos.x === EDGE_LEFT || block.indexPos.x === EDGE_RIGHT) {
                return true;
            }
        }
        return false;
    },
    /**
     * 固定ブロックとの当たり判定
     */
    hitStatic: function () {
        var children = this.dynamicGroup.children;
        var len = children.length;
        var children2 = this.staticGroup.children;
        var len2 = children2.length;
        for (var i = 0; i < len; i++) {
            for (var j = 0; j < len2; j++) {
                var block = children[i];
                var target = children2[j];
                // 位置が一致したら
                if (block.indexPos.equals(target.indexPos)) {
                    return true;
                }
            }
        }
        return false;
    },
    /**
     * 移動ブロックから固定ブロックへの変更処理
     */
    dynamicToStatic: function () {
        var _this = this;
        // グループ間の移動
        BLOCK_NUM.times(function () {
            _this.dynamicGroup.children.pop().addChildTo(_this.staticGroup);
        });
    },
    /**
     * 座標値からインデックス値へ変換
     */
    coordToIndex: function (vec) {
        var x = Math.floor(vec.x / BLOCK_SIZE);
        var y = Math.floor(vec.y / BLOCK_SIZE);
        return Vector2(x, y);
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
        this.superInit('block', BLOCK_SIZE, BLOCK_SIZE);
        // 位置インデックス
        this.indexPos = Vector2.ZERO;
        // ブロックの種類
        this.type = 0;
    }
});
/**
 * メイン
 */
phina.main(function () {
    var app = GameApp({
        startLabel: 'main',
        // アセット読み込み
        assets: ASSETS
    });
    app.run();
});
