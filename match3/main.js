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
    this.dummyGroup = DisplayElement().addChildTo(this);
    this.cursorGroup = DisplayElement().addChildTo(this);
    // ペア
    this.pair = [];
    // ジェム配置
    GEM_NUM_X.times(function(spanX) {
      GEM_NUM_X.times(function(spanY) {
        var gem = Gem().addChildTo(gemGroup);
        gem.x = grid.span(spanX) + GEM_OFFSET;
        gem.y = grid.span(spanY) + GEM_OFFSET;
        gem.dropCnt = 0;
      });
    });
    // 参照用
    this.gemGroup = gemGroup;
    this.cnt = 0;
    this.dropCnt = 0;
    this.grid = grid;
    //ジェム初期化
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
    this.initHiddenGems();
  },
  // 画面外のジェム配置
  initHiddenGems: function() {
    var self = this;
    // 一旦消す
    this.gemGroup.children.eraseIfAll(function(gem) {
      if (gem.y < 0) {
        return true;
      }
    });
    
    GEM_NUM_X.times(function(spanX) {
      GEM_NUM_X.times(function(spanY) {
        var gem = Gem().addChildTo(self.gemGroup);
        gem.num = Random.randint(0, 6);
        gem.fill = COLOR[gem.num];
        gem.mark = "normal";
        gem.x = self.grid.span(spanX) + GEM_OFFSET;
        // 一画面文分上にずらす
        gem.y = self.grid.span(spanY) + GEM_OFFSET - SCREEN_HEIGHT;
        gem.dropCnt = 0;
      });
    });
  },
  // ペアの選択処理
  selectPair:function(gem) {
    // 一つ目
    if (this.pair.length === 0) {
      // カーソル表示
      var cursor1 = Cursor().addChildTo(this.cursorGroup);
      cursor1.setPosition(gem.x, gem.y);
      this.pair.push(gem);
      // 隣り合わせ以外を選択不可にする
      this.selectableNext();
      return;
    }
    // 二つ目
    if (this.pair.length === 1) {
      cursor2 = Cursor().addChildTo(this.cursorGroup);
      cursor2.setPosition(gem.x, gem.y);
      this.pair.push(gem);
      // 入れ替え処理
      this.swapGems(false);
    }
  },
  // 隣り合わせ以外を選択不可にする
  selectableNext: function() {
    var gem = this.pair[0];
    // 一旦全てを選択不可に
    this.gemGroup.children.each(function(gem) {
      gem.setInteractive(false);
    });
    
    this.gemGroup.children.each(function(target) {
      var dx = Math.abs(gem.x - target.x);
      var dy = Math.abs(gem.y - target.y);
      // 上下左右隣り合わせだけを選択可に
      if (gem.x === target.x && dy === GRID_SIZE) {
        target.setInteractive(true);
      }
      if (gem.y === target.y && dx === GRID_SIZE) {
        target.setInteractive(true);
      }
    });
  },
  // ジェム入れ替え処理
  swapGems: function(second) {
    var g1 = this.pair[0];
    var g2 = this.pair[1];
    var self = this;
    // 1回目
    if (!second) {
      this.setGemSelectable(false);
      this.cursorGroup.children.clear();
    }
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
      if (second) {
        self.pair.clear();
        self.setGemSelectable(true);
      }
      else {
        //  3つ並びがあれば削除処理へ
        if (self.isExistMatch3()) {
          self.pair.clear();
          self.removeGems();
        }
        else {
          // 戻りの入れ替え
          self.swapGems(true);
        }
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
    if (current.mark !== "rmv") {
      current.mark = "tmp";
    }

    this.cnt++;
    var next = this.getGem(Vector2(current.x + GRID_SIZE, current.y));
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
    var next = this.getGem(Vector2(current.x, current.y + GRID_SIZE));
    if (next && current.num === next.num) {
      this.checkVertical(next);
    }
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
          if (target.y < gem.y && target.x === gem.x) {
            target.dropCnt++;
          }
        });
        // 消去アニメーション用ダミー作成
        var dummy = Gem().addChildTo(self.dummyGroup);
        dummy.setPosition(gem.x, gem.y);
        dummy.fill = gem.fill;
      }
    });
    // ジェム削除
    this.gemGroup.children.eraseIfAll(function(gem) {
      if (gem.mark === "rmv") {
        return true;
      }
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
      self.initHiddenGems();
      // 3並び再チェック
      if (self.isExistMatch3()) {
        self.removeGems();
      }
      else {
        self.setGemSelectable(true);
      }
    });
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
  //
  setGemSelectable: function(b) {
    this.gemGroup.children.each(function(gem) {
      gem.setInteractive(b);
    });
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
    //
    onpointend: function() {
      this.parent.parent.selectPair(this);
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