// 型定義ファイルを参照
/// <reference path="node_modules/phina.js.d.ts/globalized/index.d.ts" />
phina.globalize();
// 定数
var SCREEN_WIDTH = 640;
var PIECE_SIZE = SCREEN_WIDTH / 4;
var PIECE_NUM = 16;
var PIECE_NUM_X = 4;
var PIECE_OFFSET = PIECE_SIZE / 2;
// アセット
var ASSETS = {
    // 画像
    image: {
        'pieces': 'assets/pieces.png'
    }
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
    createButton: function () {
        var _this = this;
        var button = Button({
            text: 'SHUFFLE'
        }).addChildTo(this);
        button.x = this.gridX.center();
        button.y = this.gridY.span(13);
        // ボタンプッシュ時処理
        button.on('push', function () {
            // ピースをシャッフル
            for (var i = 0; i < 100; i++) {
                _this.shufflePiece();
            }
        });
    },
    /**
     * ピース配置
     */
    createPiece: function () {
        var _this = this;
        var grid = this.grid;
        var _loop_1 = function (i) {
            // グリッド配置用のインデックス値算出
            var sx = i % PIECE_NUM_X;
            var sy = Math.floor(i / PIECE_NUM_X);
            // 番号
            var num = i + 1;
            // ピース作成
            // @ts-ignore
            var piece = Piece(num).addChildTo(this_1.pieceGroup);
            // Gridを利用して配置
            piece.x = grid.span(sx) + PIECE_OFFSET;
            piece.y = grid.span(sy) + PIECE_OFFSET;
            // タッチを有効にする
            piece.setInteractive(true, 'rect');
            // タッチされた時の処理
            piece.on('pointend', function () {
                // ピース移動処理
                _this.movePiece(piece);
            });
            // 16番のピースは非表示
            if (num === 16) {
                this_1.blank = piece;
                piece.hide();
            }
        };
        var this_1 = this;
        for (var i = 0; i < PIECE_NUM; i++) {
            _loop_1(i);
        }
    },
    /**
     * ピースの移動処理
     */
    movePiece: function (piece, instantly) {
        if (instantly === void 0) { instantly = false; }
        // 空白ピース
        var blank = this.blank;
        // 即入れ替え
        if (instantly) {
            var pos = Vector2(piece.x, piece.y);
            piece.setPosition(blank.x, blank.y);
            blank.setPosition(pos.x, pos.y);
            return;
        }
        // x, yの座標差の絶対値
        var dx = Math.abs(piece.x - blank.x);
        var dy = Math.abs(piece.y - blank.y);
        // 隣り合わせの判定
        if ((piece.x === blank.x && dy === PIECE_SIZE) ||
            (piece.y === blank.y && dx === PIECE_SIZE)) {
            // タッチされたピース位置を記憶
            var pos_1 = Vector2(piece.x, piece.y);
            // ピース移動処理
            piece.tweener.to({ x: blank.x, y: blank.y }, 100)
                .call(function () {
                blank.setPosition(pos_1.x, pos_1.y);
            })
                .play();
        }
    },
    /**
     * ピースをシャッフルする
     */
    shufflePiece: function () {
        // 隣接ピース格納用
        var arr = [];
        // 空白ピースを得る
        var blank = this.blank;
        // 上下左右隣りのピースがあれば配列に追加
        for (var i = -1; i < 2; i++) {
            for (var j = -1; j < 2; j++) {
                if (Math.abs(i + j) === 1) {
                    var x = blank.x + i * PIECE_SIZE;
                    var y = blank.y + j * PIECE_SIZE;
                    var target = this.getPiece(x, y);
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
    getPiece: function (x, y) {
        var children = this.pieceGroup.children;
        var len = children.length;
        for (var i = 0; i < len; i++) {
            var piece = children[i];
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
    init: function (num) {
        // 親クラス初期化
        this.superInit('pieces', PIECE_SIZE, PIECE_SIZE);
        // 数字
        this.num = num;
        // フレーム
        this.frameIndex = num - 1;
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
