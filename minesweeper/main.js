phina.globalize();
// 定数
const PANEL_SIZE = 64; // パネルサイズ
const PANEL_NUM_XY = 9; // 縦横のパネル数
const PANEL_NUM = PANEL_NUM_XY * 2 // 全体のパネル数
const SCREEN_SIZE = PANEL_SIZE * PANEL_NUM_XY; // 画面縦横サイズ
const PANEL_OFFSET = PANEL_SIZE / 2; // オフセット値
const BOMB_NUM = 10; // 爆弾数
const PANEL_FRAME = 10; // 初期パネルのフレームインデックス 
const BOMB_FRAME = 11; // 爆弾のフレームインデックス 
const EXP_FRAME = 12; // 爆弾爆発のフレームインデックス 
// アセット
const ASSETS = {
  // 画像
  image: {
    'minespsheet': 'assets/minespsheet.png',
  },
};
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function(options) {
    // 親クラス初期化
    this.superInit(options);
    // グリッド
    const grid = Grid(SCREEN_SIZE, PANEL_NUM_XY);
    // グループ
    this.panelGroup = DisplayElement().addChildTo(this);
    // 爆弾位置をランダムに決めた配列を作成
    const bombs = [];
    PANEL_NUM.times(() => {
      bombs.push(false);
    });
    bombs.fill(true, 0, 10).shuffle();

    var self = this;
    // パネル配置
    PANEL_NUM.times((i) => {
      // グリッド配置用のインデックス値算出
      const = i % PANEL_NUM_XY;
      const = Math.floor(i / PANEL_NUM_XY);
      // パネル作成
      const panel = Panel().addChildTo(this.panelGroup);
      // Gridを利用して配置
      panel.x = grid.span(sx) + PANEL_OFFSET;
      panel.y = grid.span(sy) + PANEL_OFFSET;
      // パネルに爆弾情報を紐づける
      panel.isBomb = bombs[i];
      // パネルタッチ時
      panel.onpointstart = () => {
        // パネルを開く
        this.openPanel(panel);
        // クリア判定
        this.checkClear();
      };
    });
    // クリア判定用
    this.oCount = 0;
  },
  // クリア判定
  checkClear: function() {
    if (this.oCount === PANEL_NUM - BOMB_NUM) {
      // パネルを選択不可に
      this.panelGroup.children.each((panel) => {
        panel.setInteractive(false);
      });
    }
  },
  // パネルを開く処理
  openPanel: function(panel) {
    // 爆弾
    if (panel.isBomb) {
      panel.setFrameIndex(EXP_FRAME);
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
    panel.setInteractive(false);
    
    var bombs = 0;
    var indexs = [-1, 0, 1];
    var self = this;
    // 周りのパネルの爆弾数をカウント
    indexs.each(function(i) {
      indexs.each(function(j) {
        var x = panel.x + i * PANEL_SIZE;
        var y = panel.y + j * PANEL_SIZE;
        var target = self.getPanel(x, y);
        if (target && target.isBomb) {
          bombs++;
        }
      });
    });
    // パネルに数を表示
    panel.setFrameIndex(bombs);
    // 周りに爆弾がなければ再帰的に調べる
    if (bombs === 0) {
      indexs.each(function(i) {
        indexs.each(function(j) {
          var x = panel.x + i * PANEL_SIZE;
          var y = panel.y + j * PANEL_SIZE;
          var target = self.getPanel(x, y);
          if (target) {
            self.openPanel(target);
          }
        });
      });
    }
  },
  // 指定された位置のパネルを得る
  getPanel: function(x, y) {
    var result = null;
    
    this.panelGroup.children.some(function(panel) {
      if (panel.x === x && panel.y === y) {
        result = panel;
        return true;
      } 
    });
    return result;
  },
  // 爆弾を全て表示する
  showAllBombs: function() {
    var self = this;
    
    this.panelGroup.children.each(function(panel) {
      panel.setInteractive(false);
      
      if (panel.isBomb && panel.frameIndex === PANEL_FRAME) {
        panel.setFrameIndex(BOMB_FRAME);
      }
    });
  },
});
// パネルクラス
phina.define('Panel', {
  // Spriteクラスを継承
  superClass: 'Sprite',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit('minespsheet', PANEL_SIZE, PANEL_SIZE);
      // 開かれているかどうか
      this.isOpen = false;
      // タッチ有効化
      this.setInteractive(true);
      // 初期表示
      this.setFrameIndex(PANEL_FRAME);
    },
});
// メイン
phina.main(function() {
  var app = GameApp({
    // メイン画面からスタート
    startLabel: 'main', 
    width: SCREEN_SIZE,
    height: SCREEN_SIZE,
    // ウィンドウにフィット
    //fit: false,
    // アセット読み込み
    assets: ASSETS,
  });
  app.run();
});
