phina.globalize();
// アセット
const ASSETS = {
  // 画像
  image: {
    'gem': 'assets/gem.png',
  },
};
// 定数
const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 640;
const GEM_SIZE = 80;
const GEM_NUM_X = 8;
const GEM_NUM_Y = GEM_NUM_X * 2;
const GEM_NUM = GEM_NUM_X * GEM_NUM_X;
const GEM_OFFSET = GEM_SIZE / 2;
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function(param) {
    // 親クラス初期化
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    // 背景色
    this.backgroundColor = 'black'; 
    // グリッド
    var grid = Grid(SCREEN_WIDTH, GEM_NUM_X);
    // グループ
    var gemGroup = DisplayElement().addChildTo(this);
    this.dummyGroup = DisplayElement().addChildTo(this);
    this.cursorGroup = DisplayElement().addChildTo(this);
    // ペア
    this.pair = [];
    // ジェム配置
    GEM_NUM.times((i) => {
      var sx = i % GEM_NUM_X;
      var sy = Math.floor(i / GEM_NUM_X);
      
      var gem = Gem().addChildTo(gemGroup);
      gem.x = grid.span(sx) + GEM_OFFSET;
      gem.y = grid.span(sy) + GEM_OFFSET;
      gem.dropCnt = 0;
    });
    // 参照用
    this.gemGroup = gemGroup;
    this.grid = grid;
    //ジェム初期化
    this.initGem();
    // 画面外ジェム作成
    this.initHiddenGem();
  },
  // ジェム初期化
  initGem: function() {
    // 3つ並び以上があれば仕切り直し
    if (this.existMatch3()) {
      this.gemGroup.children.each((gem) => {
        // ランダムな色
        gem.setRandomColor();
      });
      // 再度呼び出し
      this.initGem();
    }
  },
  // 画面外のジェム配置
  initHiddenGem: function() {
    // 一旦消す
    this.gemGroup.children.eraseIfAll((gem) => {
      if (gem.y < 0) {
        return true;
      }
    });
    
    GEM_NUM.times((i) => {
      var sx = i % GEM_NUM_X;
      var sy = Math.floor(i / GEM_NUM_X);
    
      var gem = Gem().addChildTo(this.gemGroup);
      gem.x = this.grid.span(sx) + GEM_OFFSET;
      // 一画面文分上にずらす
      gem.y = this.grid.span(sy) + GEM_OFFSET - SCREEN_HEIGHT;
      gem.setRandomColor();
      gem.dropCnt = 0;
    });
  },
  // ペアの選択処理
  selectPair:function(gem) {
    // 一つ目
    if (this.pair.length === 0) {
      // カーソル表示
      var c1 = Cursor().addChildTo(this.cursorGroup);
      c1.setPosition(gem.x, gem.y);
      this.pair.push(gem);
      // 隣り合わせ以外を選択不可にする
      this.selectableNext();
      return;
    }
    // 二つ目
    if (this.pair.length === 1) {
      var c2 = Cursor().addChildTo(this.cursorGroup);
      c2.setPosition(gem.x, gem.y);
      this.pair.push(gem);
      // 入れ替え処理
      this.swapGem(false);
    }
  },
  // 隣り合わせ以外を選択不可にする
  selectableNext: function() {
    var gem = this.pair[0];
    // 一旦全てを選択不可に
    this.gemGroup.children.each((gem) => {
      gem.setInteractive(false);
    });
    
    this.gemGroup.children.each((target) => {
      var dx = Math.abs(gem.x - target.x);
      var dy = Math.abs(gem.y - target.y);
      // 上下左右隣り合わせだけを選択可に
      if (gem.x === target.x && dy === GEM_SIZE) {
        target.setInteractive(true);
      }
      if (gem.y === target.y && dx === GEM_SIZE) {
        target.setInteractive(true);
      }
    });
  },
  // ジェム入れ替え処理
  swapGem: function(second) {
    var g1 = this.pair[0];
    var g2 = this.pair[1];
    var self = this;
    // 1回目
    if (!second) {
      this.setGemSelectable(false);
      this.cursorGroup.children.clear();
    }
    // flowで非同期処理
    var flows = [];
    
    var flow1 = Flow((resolve) => {
      // 入れ替えアニメーション
      g1.tweener.updateType = 'normal';
      g1.tweener.to({x: g2.x, y: g2.y}, 200)
        .call(() => {
          resolve();
        }).play();
    });
    var flow2 = Flow((resolve) => {
      g2.tweener.updateType = 'normal';
      g2.tweener.to({x: g1.x, y: g1.y}, 200)
        .call(() => {
          resolve();
        }).play();
    });
    
    flows.push(flow1);
    flows.push(flow2);
    // 入れ替え後処理
    Flow.all(flows).then((message) => {
      if (second) {
        this.pair.clear();
        this.setGemSelectable(true);
      }
      else {
        //  3つ並びがあれば削除処理へ
        if (this.existMatch3()) {
          this.pair.clear();
          this.removeGem();
        }
        else {
          // 戻りの入れ替え
          this.swapGem(true);
        }
      }
    });
  },
  // 3つ並び以上存在チェック
  existMatch3: function() {
    this.gemGroup.children.each((gem) => {
      // 画面に見えているジェムのみ
      if (gem.y > 0) {
        // 横方向
        this.checkHorizontal(gem);
        this.setMark();
        // 縦方向
        this.checkVertical(gem);
        this.setMark();
      }
    });
    
    var result = false;
    
    this.gemGroup.children.some((gem) => {
      // 削除対象があれば
      if (gem.mark === "rmv") {
        result = true;
        return true;
      }
    });
    
    return result;
  },
  // 横方向の3つ並び以上チェック
  checkHorizontal: function(current) {
    if (current.mark !== "rmv") {
      current.mark = "tmp";
    }

    this.cnt++;
    var next = this.getGem(Vector2(current.x + GEM_SIZE, current.y));
    if (next && current.num === next.num) {
      this.checkHorizontal(next);
    }
  },
  // 縦方向の3つ並び以上チェック
  checkVertical: function(current) {
    if (current.mark !== "rmv") {
      current.mark = "tmp";
    }

    this.cnt++;
    var next = this.getGem(Vector2(current.x, current.y + GEM_SIZE));
    if (next && current.num === next.num) {
      this.checkVertical(next);
    }
  },
  // マークセット
  setMark: function() {
    this.gemGroup.children.each((gem) => {
      if (gem.mark === "tmp") {
        // 3つ並び以上なら削除マーク
        if (this.cnt > 2) {
          gem.mark = "rmv";
        } else {
          gem.mark = "normal";
        }
      }
    });
    
    this.cnt = 0;
  },
  // ジェムの削除処理
  removeGem: function() {
    this.gemGroup.children.each((gem) => {
      if (gem.mark === "rmv") {
        // 削除対象ジェムより上にあるジェムに落下回数をセット
        this.gemGroup.children.each((target) => {
          if (target.y < gem.y && target.x === gem.x) {
            target.dropCnt++;
          }
        });
        // 消去アニメーション用ダミー作成
        var dummy = Gem().addChildTo(this.dummyGroup);
        dummy.setPosition(gem.x, gem.y);
        dummy.fill = gem.fill;
      }
    });
    // ジェム削除
    this.gemGroup.children.eraseIfAll((gem) => {
      if (gem.mark === "rmv") {
        return true;
      }
    });
    var flows = [];
    // flowで非同期処理
    this.dummyGroup.children.each((dummy) => {
      var flow = Flow((resolve) => {
        dummy.tweener
             .to({scaleX: 0.2, scaleY: 0.2, ahpha: 0.2}, 200)
             .call(() => {
               dummy.remove();
               resolve('removed');
             }).play();
      });
      flows.push(flow);
    });
    
    Flow.all(flows).then((message) => {
      this.dropGems();
    });
  },
  // ジェムの落下処理
  dropGems: function() {
    var flows = [];
    
    this.gemGroup.children.each((gem) => {
      // 落下フラグがあるジェムを落下させる
      if (gem.dropCnt > 0) {
        // 落下アニメーション
        var flow = Flow((resolve) => {
          gem.tweener.updateType = 'normal';
          gem.tweener.by({y: gem.dropCnt * GEM_SIZE}, gem.dropCnt * 200, 'easeInCubic')
                     .call(() => {
                        gem.dropCnt = 0;
                        resolve('dropped');
                     }).play();
          
        });
        flows.push(flow);
      }
    });

    Flow.all(flows).then((message) => {
      // 画面外のジェムを作り直す
      this.initHiddenGem();
      // 3並び再チェック
      if (this.existMatch3()) {
        this.removeGem();
      }
      else {
        this.setGemSelectable(true);
      }
    });
  },
  // 指定された位置のジェムを返す
  getGem: function(pos) {
    var result = null;
    // 該当するジェムがあったらループを抜ける
    this.gemGroup.children.some((gem) => {
      if (gem.position.equals(pos)) {
        result = gem;
        return true;
      }
    });
    return result;
  },
  // ジェムを選択可能にする
  setGemSelectable: function(b) {
    this.gemGroup.children.each((gem) => {
      gem.setInteractive(b);
    });
  },
});
// ジェムクラス
phina.define('Gem', {
  // Spriteを継承
  superClass: 'Sprite',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit('gem', GEM_SIZE, GEM_SIZE);
      this.setInteractive(true);
    },
    // タッチされた時
    onpointend: function() {
      this.parent.parent.selectPair(this);
    },
    // ランダムな色セット
    setRandomColor: function() {
      this.num = Random.randint(0, 6);
      this.frameIndex = this.num;
      this.mark = 'normal'
    },
});
// カーソルクラス
phina.define('Cursor', {
  // RectangleShapeを継承
  superClass: 'RectangleShape',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit({
        width: GEM_SIZE,
        height: GEM_SIZE,
        fill: null,
        stroke: 'red',
      });
    },
});
// メイン
phina.main(function() {
  var app = GameApp({
    startLabel: 'main',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    assets: ASSETS,
    fps: 60,
  });
  app.run();
});