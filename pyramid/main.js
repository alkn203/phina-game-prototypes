// グローバルに展開
phina.globalize();
/*
* アセット
*/ 
var ASSETS = {
  // 画像
  image: {
    'card-sheet': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/pyramid/assets/card-sheet.png',
  },
};
/*
 * 定数
 */
var CARD_WIDTH  = 64;   // カードの幅
var CARD_HEIGHT = 128;  // カードの高さ
var CARD_NUM    = 52;   // 使用するカード枚数 
var INDEX_BACK  = 53;   // 裏面のフレームインデックス番号
var TARGET_NUM  = 13;   // 取り除ける番号
var DELAY       = 100;  // アニメーション所要時間
var CARD_POS = [[0,-5], // ピラミッド型の配置情報
               [-0.5,-4],[0.5,-4],
               [-1,-3],[0,-3],[1, -3],
               [-1.5,-2],[-0.5,-2],[0.5,-2],[1.5,-2],
               [-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1],
               [-2.5,0],[-1.5,0],[-0.5,0],[0.5,0],[1.5,0],[2.5,0],
               [-3,1],[-2,1],[-1,1],[0,1],[1,1],[2,1],[3,1]];
/*
 * メインシーン
 */
phina.define("MainScene", {
  // 継承
  superClass: 'DisplayScene',
  // 初期化
  init: function() {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'green';
    // ピラミッドカード
    this.pyramidGroup = DisplayElement().addChildTo(this);
    // 手札カード
    this.handGroup = DisplayElement().addChildTo(this);
    // めくられた手札カード
    this.openGroup = DisplayElement().addChildTo(this);
    // 捨て札カード
    this.dropGroup = DisplayElement().addChildTo(this);
    // カード配置用のGrid（横方向）
    this.gx = Grid(this.gridX.width, 10);
    var self = this;
    // リトライボタン
    this.button = Button({text: 'RETRY'})
      .addChildTo(this)
      .setPosition(this.gx.center(), this.gridY.center(7))
      .on('pointend', function() {
        self.exit({
          nextLabel: 'main',
        });
      });
    // カードインデックス管理用配列
    this.cardInfo = Array.range(CARD_NUM).shuffle();
    // 選択カードのペア
    this.pair = [];
    // カード配置
    this.setPyramid();
    //
    this.setHandCard();
  },
  // カード配置
  setPyramid: function() {
    var self = this;
    // 配置情報配列を元に配置
    CARD_POS.each(function(pos, i) {
      // 配列からインデックスを取り出す
      var index = self.cardInfo.shift();
      // カード作成
      var card = Card(index).addChildTo(self.pyramidGroup);
      // 位置情報配列を元に配置
      card.setPosition(self.gx.center(pos[0]), self.gridY.center(pos[1]));
      // 最下段は裏返しておく
      if (i > 20) {
        card.flip();
      }
      // カードタッチ時
      card.onpointend = function() {
        // カード選択処理
        self.addPair(card);
      };
    });
  },
  // 手札配置
  setHandCard:function() {
    var self = this;
    // カード切れ
    if (this.cardInfo.length < 1) {
      return;
    }
    // カード情報から１つ取る
    var index = this.cardInfo.shift();
    var card = Card(index).addChildTo(this.handGroup);
    card.setPosition(this.gx.center(3), this.gridY.center(4.5));
    card.setInteractive(true);
    // カードタッチ時
    card.onpointend = function() {
      // 手札をめくる
      self.flipHandCard();
    };
  },
  // 待ち札をめくる処理
  flipHandCard: function() {
    var self = this;
    // 開かれた手札があるなら
    if (this.openGroup.children.length > 0) {
      var opened = this.openGroup.children.first;
      // 捨て札へ移動
      opened.addChildTo(this.dropGroup);
      opened.tweener.to({x: this.gx.center(-3)}, DELAY).play();
    }
    // 待ち札から開かれた手札へ移動
    var card = this.handGroup.children.first;
    card.addChildTo(this.openGroup);
    card.moveflip(this.gx.span(2));
    // カードタッチ時処理上書き
    card.onpointend = function() {
      // カード選択
      self.addPair(card);
    };
    // 手札再セット
    this.setHandCard();
  },
  // カード選択
  addPair: function(card) {
    // 選択不可なら何もしない
    if (!card.selectable) return;
    // 13なら無条件で消去
    if (card.num === TARGET_NUM) {
      card.disable();
      this.flipNextCards();
      return;
    } 
    // １枚目
    if (this.pair.length === 0) {
      this.pair.push(card);
      // 枠追加
      Frame().addChildTo(card);
    }
    else {
      // ２枚目
      if (this.pair.length === 1) {
        this.pair.push(card);
        // ペアの数字をチェック
        this.checkPair();
      }
    }
  },
  // ペアのチェック
  checkPair: function() {
    var p1 = this.pair[0];
    var p2 = this.pair[1];
    var y = this.gridY.center(4.5);
    // 手札と捨て札のセットは不可
    if (p1.y === y && p2.y === y) {
      p1.children.first.remove();
      this.pair.clear();
      return;
    }
    // 数字の合計が13なら取り除く
    if (p1.num + p2.num === TARGET_NUM) {
      p1.disable();
      p2.disable();
      // 裏返せるカードを裏返す
      this.flipNextCards();
      // 捨て札の一番上のガードを選択可能にする
      this.enableDropTop();
    }
    else {
      // 枠削除
      p1.children.first.remove();
    }
    // ペア情報クリア
    this.pair.clear();
  },
    // 裏返せるカードを裏返す
  flipNextCards: function() {
    var pyramids = this.pyramidGroup.children;
    var result = false;
    // カードを総当たりチェック
    pyramids.each(function(card) {
      // 選択不可（裏面）であれば
      if (!card.selectable) {
        var free = true;
        
        pyramids.each(function(target) {
          // 消去対象ではなく
          if (!target.disapper) {
            // 上に載っているカードがある場合
            if (card.hitTestElement(target) && card.y < target.y) {
              free = false;
            }
          }
        });
        // 上に載っているカードがなければ裏返す
        if (free) card.flip();
      }
    });
  },
  // 捨て札の１番上だけを選択可能にする
  enableDropTop: function() {
    var drops = this.dropGroup.children;
    // 一旦全て選択不可に
    drops.each(function(card) {
      card.interactive = false;
      card.selectable = false;
    });

    var len = drops.length;
    var last = drops.last;

    if (last) {
      // 一番上が消去中の時はその１つ前
      if (last.disapper && len > 1) {
        var before = drops[len - 2];
        before.setInteractive(true);
        before.selectable = true;
      }
      else {
        last.setInteractive(true);
        last.selectable = true;
      }
    }
  },
  // マイフレーム処理
  update: function(app) {
    var self = this;
    // クリア判定
    if (this.pyramidGroup.children.length === 0) {
      this.button.tweener.to({y: this.gridY.center(), rotation: 360}, 1000)
                         .set({text: 'Good Job!'})  
                         .to({scaleX: 1.2, scaleY: 1.2}, 400)
                         .to({scaleX: 1.0, scaleY: 1.0}, 400);
    }
  },
});
/*
 * カードクラス
 */
phina.define('Card', {
  // Spriteクラスを継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function(index) {
    // 親クラス初期化
    this.superInit('card-sheet', CARD_WIDTH, CARD_HEIGHT);
    // インデックス
    this.index = index;
    // フレームインデックス設定(最初は裏面)
    this.frameIndex = INDEX_BACK;
    // カード数字算出
    this.num = index === INDEX_BACK ? 0 : this.index % 13 + 1;
    // 選択対象かどうか
    this.selectable = false;
    // 消去中
    this.disapper = false;
  },
  // カード返し処理
  flip : function() {
    // アニメーション：絵柄のフレームにして選択可能にする
    this.tweener.to({scaleX: 0.1}, DELAY)
                .set({frameIndex: this.index})
                .to({scaleX: 1.0}, DELAY)
                .set({interactive: true, selectable: true})
                .play();
  },
  // 手札カード返し処理
  moveflip : function(span) {
    // アニメーション：めくって移動
    this.tweener.by({x: -span}, DELAY)
                .to({scaleX: 0.1}, DELAY)
                .set({frameIndex: this.index, selectable: true})
                .to({scaleX: 1.0}, DELAY)
                .play();
  },
  // カード消去処理
  disable : function() {
    var self = this;
    // 消去フラグ
    this.disapper = true;
    // アニメーション    
    this.tweener.to({scaleX: 0, scaleY: 0}, DELAY)
                .call(function() {
                  self.remove();    
                })
                .play();
  },
});
/*
 * 枠クラス
 */
phina.define('Frame', {
  // RectangleShapeクラスを継承
  superClass: 'RectangleShape',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fill: null,
      stroke: 'blue',
    });
  },
});
/*
 * メイン処理
 */
phina.main(function() {
  // アプリケーションを生成
  var app = GameApp({
    assets: ASSETS, // アセット読み込み
    startLabel: 'main', // MainScene から開始
  });
  // 実行
  app.run();
});