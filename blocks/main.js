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
var INTERVAL = 400;
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
        this.dummyGroup = DisplayElement().addChildTo(this);
        // 変数
        this.prevTime = 0;
        this.curTime = 0;
        this.interval = INTERVAL;
        this.removeline = [];
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
            // ブロック回転
            this.rotateBlock(app);
            // ブロック落下速度変更
            this.moveBlockYFaster(app);
        }
        // 画面上到達
        if (this.hitTop()) {
            this.exit('title');
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
            // 削除行チェック
            this.checkRemoveline();
        }
    },
    /**
     * ブロック落下スピード変更
     */
    moveBlockYFaster: function (app) {
        var key = app.keyboard;
        // キー入力チェック
        if (key.getKey('down')) {
            this.interval = INTERVAL / 4;
        }
        if (key.getKeyUp('down')) {
            this.interval = INTERVAL;
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
     * ブロック回転処理
     */
    rotateBlock: function (app) {
        var _this = this;
        var key = app.keyboard;
        // 上キー
        if (key.getKeyDown('up')) {
            // 移動
            var children = this.dynamicGroup.children;
            // 度からラジアンへ変換
            var rad_1 = Math.degToRad(90);
            // 回転の原点
            var point_1 = children.first.position;
            // 原点を中心に回転後の座標を求める
            children.each(function (block) {
                block.position.rotate(rad_1, point_1);
                block.indexPos = _this.coordToIndex(block.position);
            });
            // 両端と固定ブロックと底との当たり判定
            if (this.hitEdge() || this.hitStatic() || this.hitBottom()) {
                //  回転を戻す
                children.each(function (block) {
                    block.position.rotate(-1 * rad_1, point_1);
                    block.indexPos = _this.coordToIndex(block.position);
                });
            }
        }
    },
    /**
     * 削除可能ラインチェック
     */
    checkRemoveline: function () {
        var _this = this;
        // 上から走査
        BLOCK_ROWS.times(function (i) {
            var count = 0;
            // 固定ブロックに対して
            _this.staticGroup.children.some(function (block) {
                // 走査ライン上にあればカウント
                if (block.indexPos.y === i) {
                    count++;
                }
                // 10個あれば削除対象ラインとして登録
                if (count === BLOCK_COLS) {
                    _this.removeline.push(i);
                    return true;
                }
            });
        });
        // 削除対象ラインがあれば
        if (this.removeline.length > 0) {
            this.removeBlock();
        }
        else {
            this.createBlock();
        }
    },
    /**
     * ブロック削除処理
     */
    removeBlock: function () {
        var _this = this;
        var sta = this.staticGroup.children;
        // 削除対象ラインに対して
        this.removeline.each(function (line) {
            sta.each(function (block) {
                if (block.indexPos.y === line) {
                    // 削除フラグ
                    block.removable = true;
                    // 消去アニメーション用ダミー作成
                    //@ts-ignore
                    var dummy = Block().addChildTo(_this.dummyGroup);
                    dummy.position = block.position;
                    dummy.frameIndex = block.frameIndex;
                }
                // 削除ラインより上のブロックに落下回数カウント
                if (block.indexPos.y < line) {
                    block.dropCount++;
                }
            });
        });
        // ブロック削除
        sta.eraseIfAll(function (block) {
            if (block.removable) {
                return true;
            }
        });
        this.removeline.clear();
        var flows = [];
        // 消去アニメーション
        this.dummyGroup.children.each(function (dummy) {
            var flow = Flow(function (resolve) {
                dummy.tweener
                    .to({ scaleY: 0.1 }, 200)
                    .call(function () {
                    dummy.remove();
                    resolve('removed');
                }).play();
            });
            flows.push(flow);
        });
        // アニメーション後落下処理へ
        Flow.all(flows).then(function (message) {
            _this.dropBlock();
        });
    },
    /**
     * 固定ブロック落下処理
     */
    dropBlock: function () {
        var _this = this;
        this.staticGroup.children.each(function (block) {
            if (block.dropCount > 0) {
                block.y += block.dropCount * BLOCK_SIZE;
                block.indexPos = _this.coordToIndex(block.position);
                block.dropCount = 0;
            }
        });
        //落下ブロック作成
        this.createBlock();
    },
    /**
     * 画面上到達チェック
     */
    hitTop: function () {
        var children = this.staticGroup.children;
        var len = children.length;
        for (var i = 0; i < len; i++) {
            var block = children[i];
            if (block.indexPos.y === 0) {
                return true;
            }
        }
        return false;
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
        // 削除フラク
        this.removable = false;
        // 落下回数
        this.dropCount = 0;
    }
});
/**
 * メイン
 */
phina.main(function () {
    var app = GameApp({
        //@ts-ignore
        title: 'blocks',
        // アセット読み込み
        assets: ASSETS
    });
    app.run();
});
