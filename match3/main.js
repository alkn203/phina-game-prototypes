phina.globalize();
// 定数
var SCREEN_WIDTH = 640; // 画面横サイズ
var SCREEN_HEIGHT = 640; // 画面縦サイズ
var GRID_SIZE = SCREEN_WIDTH / 8;  // グリッドのサイズ
var GEM_SIZE = GRID_SIZE * 0.95; // ジェムの大きさ
var GEM_NUM_X = 8;              // 縦横のジェム数
var GEM_NUM_Y = GEM_NUM_X * 2; // 縦のジェム数
var GEM_OFFSET = GRID_SIZE / 2; // オフセット値
var COLOR = ["red", "yellow", "blue", "lime", "purple", "aqua", "fuchsia"];
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    // 背景色
    this.backgroundColor = 'gray';
    // グリッド
    var grid = Grid(SCREEN_WIDTH, GEM_NUM_X);
    // グループ
    var gemGroup = DisplayElement().addChildTo(this);
    var dummyGroup = DisplayElement().addChildTo(this);
    // ペア
    this.pair = [];
    var self = this;
    // ピース配置
    GEM_NUM_X.times(function(spanX) {
      GEM_NUM_X.times(function(spanY) {
        // ジェム作成
        var gem = Gem().addChildTo(gemGroup);
        // Gridを利用して配置
        gem.x = grid.span(spanX) + GEM_OFFSET;
        gem.y = grid.span(spanY) + GEM_OFFSET;
        gem.dropCnt = 0;
      });
    });
    // 参照用
    this.gemGroup = gemGroup;
    this.dummyGroup = dummyGroup;
    this.cnt = 0;
    this.dropCnt = 0;
    this.grid = grid;

    this.initGems();
  },
  // ジェム初期化
  initGems: function() {
    // 3つ並び以上があれば仕切り直し
    if (this.isExistMatch3()) {
      this.gemGroup.children.each(function(gem) {
        // ランダムな色
        gem.num = Random.randint(0, 6);
        gem.fill = COLOR[gem.num];
        gem.mark = "normal";
      });
      this.initGems();
    }
    // 画面外ジェム配置
    this.makeHiddenGems();
    // 3つ並びサーチ開始
    if (this.canMatch3()) {
      this.swapGems();
    }
    else {
      console.log('no match3');
      this.removeRandomColor();
    }
  },
  // 画面外のジェム配置
  makeHiddenGems: function() {
    var self = this;
    // 一旦消す
    this.gemGroup.children.eraseIfAll(function(gem) {
      if (gem.y < 0) return true;  
    });
    
    GEM_NUM_X.times(function(spanX) {
      GEM_NUM_X.times(function(spanY) {
        // ジェム作成
        var gem = Gem().addChildTo(self.gemGroup);
        // ランダムな色
        gem.num = Random.randint(0, 6);
        gem.fill = COLOR[gem.num];
        gem.mark = "normal";
        // Gridを利用して配置
        gem.x = self.grid.span(spanX) + GEM_OFFSET;
        gem.y = self.grid.span(spanY) + GEM_OFFSET - SCREEN_HEIGHT;
        gem.dropCnt = 0;
      });
    });
  },
    // ジェム入れ替え処理
  swapGems: function(quickly) {
    if (quickly === null) {
      quickly = false;
    }
    
    var g1 = this.pair[0];
    var g2 = this.pair[1];
    // アニメーション無し
    if (quickly) {
      var tmpX = g1.x;
      var tmpY = g1.y;
      g1.x = g2.x;
      g1.y = g2.y;
      g2.x = tmpX;
      g2.y = tmpY;
      return;
    }
    var self = this;
    // flowで非同期処理
    var flow = Flow(function(resolve) {
      var counter = 2;
      // 入れ替えアニメーション
      g1.tweener.clear()
                .to({x: g2.x, y: g2.y}, 300)
                .call(function() {
                  counter--;
                  if (counter === 0) {
                    resolve('done');                          
                  }
                });
      g2.tweener.clear()
                .to({x: g1.x, y: g1.y}, 300)
                .call(function() {
                  counter--;
                  if (counter === 0) {
                    resolve('done');                          
                  }
                });
    });
    // 入れ替え後処理
    flow.then(function(message) {
      if (self.isExistMatch3()) {
        self.pair.clear();
        self.removeGems();
      }
    });
  },
  // 3つ並び以上存在チェック
  isExistMatch3: function() {
    this.gemGroup.children.each(function(gem) {
      // 画面に見えているジェムのみ
      if (gem.y > 0) {
        // 横方向
        this.checkHorizontal(gem);
        this.setMark();
        // 縦方向
        this.checkVertical(gem);
        this.setMark();
      }
    }, this);
    
    var result = false;
    
    this.gemGroup.children.some(function(gem) {
      // 削除対象があれば
      if (gem.mark === "rmv") {
        result = true;
        return true;
      }
    }, this);
    
    return result;
  },
  // 横方向の3つ並び以上チェック
  checkHorizontal: function(current) {
    if (current.mark !== "rmv") current.mark = "tmp";

    this.cnt++;
    var next = this.getGem(Vector2(current.x + GRID_SIZE, current.y));
    if (next && current.num === next.num) this.checkHorizontal(next);
  },
  // 縦方向の3つ並び以上チェック
  checkVertical: function(current) {
    if (current.mark !== "rmv") current.mark = "tmp";

    this.cnt++;
    var next = this.getGem(Vector2(current.x, current.y + GRID_SIZE));
    if (next && current.num === next.num) this.checkVertical(next);
  },
  // マークセット
  setMark: function() {
    this.gemGroup.children.each(function(gem) {
      if (gem.mark === "tmp") {
        // 3つ並び以上なら削除マーク
        if (this.cnt > 2) {
          gem.mark = "rmv";
        } else {
          gem.mark = "normal";
        }
      }
    }, this);
    
    this.cnt = 0;
  },
  // ジェムの削除処理
  removeGems: function() {
    var self = this;

    this.gemGroup.children.each(function(gem) {
      if (gem.mark === "rmv") {
        // 削除対象ジェムより上にあるジェムに落下回数をセット
        self.gemGroup.children.each(function(target) {
          if (target.y < gem.y && target.x === gem.x) target.dropCnt++;
        });
        // 消去アニメーション用ダミー作成
        var dummy = Gem().addChildTo(self.dummyGroup);
        dummy.setPosition(gem.x, gem.y);
        dummy.fill = gem.fill;
      }
    });
    // ジェム削除
    this.gemGroup.children.eraseIfAll(function(gem) {
      if (gem.mark === "rmv") return true;
    });
    // flowで非同期処理
    var flow = Flow(function(resolve) {
      // ダミーをアニメーション
      self.dummyGroup.children.each(function(dummy) {
        dummy.tweener.clear()
                     .to({scaleX: 0.2, scaleY: 0.2, ahpha: 0.2}, 200)
                     .call(function() {
                       dummy.remove();
                       // アニメーション後
                       if (self.dummyGroup.children.length === 0) {
                         resolve('removed');
                       }
                     });
      });
    });
    
    flow.then(function(message) {
      self.dropGems();
    });
  },
  // ジェムの落下処理
  dropGems: function() {
    var self = this;

    var flow = Flow(function(resolve) {
      self.gemGroup.children.each(function(gem) {
        // 落下フラグがあるジェムを落下させる
        if (gem.dropCnt > 0) {
          // 落下ジェム数カウント
          self.dropCnt++;
          // 落下アニメーション
          gem.tweener.clear()
                     .by({y: gem.dropCnt * GRID_SIZE}, gem.dropCnt * 150)
                     .call(function() {
                        gem.dropCnt = 0;
                        self.dropCnt--;
                        if (self.dropCnt === 0) {
                          // 落下後処理
                          resolve('dropped');
                        }
                     });
        }
      });
    });

    flow.then(function(message) {
      // 画面外のジェムを作り直す
      self.makeHiddenGems();
      // 3並び再チェック
      if (self.isExistMatch3()) {
        self.removeGems();
      }
      else {
        if (self.canMatch3()) {
          self.swapGems();
        }
        else {
          console.log('no match3');
          self.removeRandomColor();
        }
      }
    });
  },
  // 3つ並びが作れるか全体をチェックする
  canMatch3: function() {
    var result = false;
    
    this.gemGroup.children.some(function(gem) {
      if (gem.y > 0) {
        var next = this.getGem(Vector2(gem.x - GRID_SIZE, gem.y));

        if (next && this.canNext(gem, next)) {
          result = true;
          return true;
        }

        next = this.getGem(Vector2(gem.x + GRID_SIZE, gem.y));
        if (next && this.canNext(gem, next)) {
          result = true;
          return true;
        }
        
        next = this.getGem(Vector2(gem.x, gem.y + GRID_SIZE));
        if (next && this.canNext(gem, next)) {
          result = true;
          return true;
        }
      }
    }, this);
    return result;
  },
  // 隣との入れ替えが出来るか
  canNext: function(gem, next) {
    this.pair.push(gem);
    this.pair.push(next);
    
    var result = false;

    this.swapGems(true);

    if (this.isExistMatch3()) {
      result = true;
    }
    this.swapGems(true);
    
    if (!result) {
      this.pair.clear();
    }
 
    this.gemGroup.children.each(function(gem) {
      gem.mark = "normal";
    });

    return result;
  },
  // 指定された位置のジェムを返す
  getGem: function(pos) {
    var result = null;
    // 該当するジェムがあったらループを抜ける
    this.gemGroup.children.some(function(gem) {
      if (gem.position.equals(pos)) {
        result = gem;
        return true;
      }
    });
    return result;
  },
   // ランダムな色のジェムを消す
  removeRandomColor: function() {
    var rnd = Random.randint(0, 6);

    this.gemGroup.children.each(function(gem) {
      if (gem.num === rnd) gem.mark = "rmv";
    });
    
    this.removeGems();
  },
});
// ジェムクラス
phina.define('Gem', {
  // PolygonShapeを継承
  superClass: 'PolygonShape',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit({
        radius: GEM_SIZE / 2,
        sides: 8,
        fill: 'silver',
        stroke: 'white',
        strokeWidth: 6,
      });
      
      this.rotation = 22.5;
      this.setInteractive(true);
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
        width: GRID_SIZE,
        height: GRID_SIZE,
        fill: null,
        stroke: 'black',
      });
    },
});
// メイン
phina.main(function() {
  var app = GameApp({
    startLabel: 'main',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  app.run();
});