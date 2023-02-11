//@ts-check

// 型定義ファイルを参照
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />

phina.globalize();
// 定数
const PANEL_SIZE = 64; // パネルサイズ
const PANEL_NUM_X = 9; // 縦横のパネル数
const PANEL_NUM = PANEL_NUM_X * PANEL_NUM_X; // 全体のパネル数
const SCREEN_SIZE = PANEL_SIZE * PANEL_NUM_X; // 画面縦横サイズ
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
    const grid = Grid(SCREEN_SIZE, PANEL_NUM_X);
    // グループ
    this.panelGroup = DisplayElement().addChildTo(this);
    // 爆弾位置をランダムに決めた配列を作成
    /**@type {boolean[]} */
    const bombs = [];

    PANEL_NUM.times(function() {
      bombs.push(false);
    });
    bombs.fill(true, 0, 10).shuffle();
    // パネル配置
    PANEL_NUM.times(function(i) {
      // グリッド配置用のインデックス値算出
      const sx = i % PANEL_NUM_X;
      const sy = Math.floor(i / PANEL_NUM_X);
      // パネル作成
      /** @type {Panel} */
      const panel = Panel().addChildTo(this.panelGroup);
      // Gridを利用して配置
      panel.x = grid.span(sx) + PANEL_OFFSET;
      panel.y = grid.span(sy) + PANEL_OFFSET;
      // インデックス位置
      panel.indexPos = Vector2(sx, sy);
      // パネルに爆弾情報を紐づける
      panel.isBomb = bombs[i];
      // パネルタッチ時
      panel.on('pointstart', () => {
        // パネルを開く
        this.openPanel(panel);
        // クリア判定
        this.checkClear();
      });
    }, this);
    // クリア判定用
    this.oCount = 0;
  },
  // クリア判定
  checkClear: function() {
    if (this.oCount === PANEL_NUM - BOMB_NUM) {
      // パネルを選択不可に
      this.panelGroup.children.each(function(/** @type {Panel} */panel) {
        panel.setInteractive(false);
      });
    }
  },
  // パネルを開く処理
  /**
   * @param {Panel} panel
   */
  openPanel: function(panel) {
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
    panel.setInteractive(false);
    
    let bombs = 0;
    const indexs = [-1, 0, 1];
    // 周りのパネルの爆弾数をカウント
    indexs.each((i) => {
      indexs.each((j) => {
        const pos = Vector2.add(panel.indexPos, Vector2(i, j));
        /** @type {Panel | null}*/
        const target = this.getPanel(pos);
        if (target && target.isBomb) {
          bombs++;
        }
      });
    });
    // パネルに数を表示
    panel.frameIndex = bombs;
    // 周りに爆弾がなければ再帰的に調べる
    if (bombs === 0) {
      indexs.each((i) => {
        indexs.each((j) => {
          const pos = Vector2.add(panel.indexPos, Vector2(i, j));
          /** @type {Panel | null}*/
          const target = this.getPanel(pos);
          if (target) {
            this.openPanel(target);
          }
        });
      });
    }
  },
  // 指定されたインデックス位置のパネルを得る
  /**
   * @param {Vector2} pos
   */
  getPanel: function(pos) {
    /** @type {Panel | null} */
    let result = null;
    
    this.panelGroup.children.some(function(/** @type {Panel}*/panel) {
      if (panel.indexPos.equals(pos)){
        result = panel;
        return true;
      } 
    });
    return result;
  },
  // 爆弾を全て表示する
  showAllBombs: function() {
    this.panelGroup.children.each(function(/** @type {Panel}} */ panel) {
      panel.setInteractive(false);
      
      if (panel.isBomb && panel.frameIndex === PANEL_FRAME) {
        panel.frameIndex = BOMB_FRAME;
      }
    }, this);
  },
});
// パネルクラス
/**
 * @typedef Panel
 * @property {boolean} isOpen
 * @property {boolean} isBomb
 * @property {number} frameIndex
 * @property {Vector2} indexPos
 */
phina.define('Panel', {
  // Spriteクラスを継承
  superClass: 'Sprite',
    // コンストラクタ
    init: function() {
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
    },
});
// メイン
phina.main(function() {
  const app = GameApp({
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
