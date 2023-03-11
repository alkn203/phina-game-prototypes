// 型定義ファイルを参照
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />
phina.globalize();
// 定数
var PANEL_SIZE = 64;
var PANEL_NUM_X = 9;
var PANEL_NUM = PANEL_NUM_X * PANEL_NUM_X;
var SCREEN_SIZE = PANEL_SIZE * PANEL_NUM_X;
var PANEL_OFFSET = PANEL_SIZE / 2;
var BOMB_NUM = 10;
var PANEL_FRAME = 10;
var BOMB_FRAME = 11;
var EXP_FRAME = 12;
// アセット
var ASSETS = {
    // 画像
    image: {
        'minespsheet': 'assets/minespsheet.png'
    }
};
/**
 * メインシーン
 */
phina.define('MainScene', {
    superClass: 'DisplayScene',
    // コンストラクタ
    init: function (options) {
        // 親クラス初期化
        this.superInit(options);
        // グリッド
        this.grid = Grid(SCREEN_SIZE, PANEL_NUM_X);
        // グループ
        this.panelGroup = DisplayElement().addChildTo(this);
        // クリア判定用
        this.oCount = 0;
        // パネル作成
        this.createPanel();
    },
    /**
     * パネル作成
     */
    createPanel: function () {
        var _this = this;
        var bombs = [];
        // 爆弾位置をランダムに決めた配列を作成
        for (var i = 0; i < PANEL_NUM; i++) {
            bombs.push(false);
        }
        bombs.fill(true, 0, BOMB_NUM).shuffle();
        var grid = this.grid;
        var _loop_1 = function (i) {
            // グリッド配置用のインデックス値算出
            var sx = i % PANEL_NUM_X;
            var sy = Math.floor(i / PANEL_NUM_X);
            // パネル作成
            // @ts-ignore
            var panel = Panel().addChildTo(this_1.panelGroup);
            // Gridを利用して配置
            panel.x = grid.span(sx) + PANEL_OFFSET;
            panel.y = grid.span(sy) + PANEL_OFFSET;
            // インデックス位置
            panel.indexPos = Vector2(sx, sy);
            // パネルに爆弾情報を紐づける
            panel.isBomb = bombs[i];
            // パネルタッチ時
            panel.on('pointstart', function () {
                // パネルを開く
                _this.openPanel(panel);
                // クリア判定
                _this.checkClear();
            });
        };
        var this_1 = this;
        // パネル配置
        for (var i = 0; i < PANEL_NUM; i++) {
            _loop_1(i);
        }
    },
    /**
     * クリア判定
     */
    checkClear: function () {
        if (this.oCount === PANEL_NUM - BOMB_NUM) {
            var children = this.panelGroup.children;
            var len = children.length;
            // パネルを選択不可に
            for (var i = 0; i < len; i++) {
                var panel = children[i];
                panel.setInteractive(false, 'rect');
            }
        }
    },
    /**
     * パネルを開く処理
     */
    openPanel: function (panel) {
        // 爆弾
        if (panel.isBomb) {
            panel.frameIndex = EXP_FRAME;
            this.showAllBombs();
            return;
        }
        // 既に開かれていたら何もしない
        if (panel.isOpen) {
            return;
        }
        // 開いたとフラグを立てる
        panel.isOpen = true;
        this.oCount++;
        // タッチ不可にする
        panel.setInteractive(false, 'rect');
        var bombs = 0;
        // 周りのパネルの爆弾数をカウント
        for (var i = -1; i < 2; i++) {
            for (var j = -1; j < 2; j++) {
                var pos = Vector2.add(panel.indexPos, Vector2(i, j));
                var target = this.getPanel(pos);
                if (target && target.isBomb) {
                    bombs++;
                }
            }
        }
        // パネルに数を表示
        panel.frameIndex = bombs;
        // 周りに爆弾がなければ再帰的に調べる
        if (bombs === 0) {
            for (var i = -1; i < 2; i++) {
                for (var j = -1; j < 2; j++) {
                    var pos = Vector2.add(panel.indexPos, Vector2(i, j));
                    var target = this.getPanel(pos);
                    if (target) {
                        this.openPanel(target);
                    }
                }
            }
        }
    },
    /**
     * 指定されたインデックス位置のパネルを得る
     */
    getPanel: function (pos) {
        var children = this.panelGroup.children;
        var len = children.length;
        for (var i = 0; i < len; i++) {
            var panel = children[i];
            if (panel.indexPos.equals(pos)) {
                return panel;
            }
        }
        return null;
    },
    /**
     * 爆弾を全て表示する
     */
    showAllBombs: function () {
        var children = this.panelGroup.children;
        var len = children.length;
        for (var i = 0; i < len; i++) {
            var panel = children[i];
            panel.setInteractive(false, 'rect');
            if (panel.isBomb && panel.frameIndex === PANEL_FRAME) {
                panel.frameIndex = BOMB_FRAME;
            }
        }
    }
});
/**
 * パネルクラス
 */
phina.define('Panel', {
    // Spriteクラスを継承
    superClass: 'Sprite',
    // コンストラクタ
    init: function () {
        // 親クラス初期化
        this.superInit('minespsheet', PANEL_SIZE, PANEL_SIZE);
        // 開かれているかどうか
        this.isOpen = false;
        // 爆弾かどうか
        this.isBomb = false;
        // 初期表示
        this.frameIndex = PANEL_FRAME;
        // インデックス位置
        this.indexPos = Vector2.ZERO;
        // タッチ有効化
        this.setInteractive(true);
    }
});
// メイン
phina.main(function () {
    var app = GameApp({
        // メイン画面からスタート
        startLabel: 'main',
        width: SCREEN_SIZE,
        height: SCREEN_SIZE,
        // ウィンドウにフィット
        //fit: false,
        // アセット読み込み
        assets: ASSETS
    });
    app.run();
});
