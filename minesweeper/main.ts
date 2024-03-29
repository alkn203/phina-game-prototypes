// 型定義ファイルを参照
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />

phina.globalize();
// 定数
const PANEL_SIZE = 64;
const PANEL_NUM_X = 9;
const PANEL_NUM = PANEL_NUM_X * PANEL_NUM_X;
const SCREEN_SIZE = PANEL_SIZE * PANEL_NUM_X;
const PANEL_OFFSET = PANEL_SIZE / 2;
const BOMB_NUM = 10;
const PANEL_FRAME = 10;
const BOMB_FRAME = 11;
const EXP_FRAME = 12;
// アセット
const ASSETS = {
  // 画像
  image: {
    'minespsheet': 'assets/minespsheet.png',
  },
};
// 自作クラス補完用
interface Panel extends Sprite {
  indexPos: Vector2
  isBomb: boolean
  isOpen: boolean
}
/**
 * メインシーン
 */
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function(options: Object) {
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
  createPanel: function() {
    const bombs: boolean[] = [];
    // 爆弾位置をランダムに決めた配列を作成
    for (let i = 0; i < PANEL_NUM; i++) {
      bombs.push(false);
    }
    bombs.fill(true, 0, BOMB_NUM).shuffle();
    
    const grid: Grid = this.grid;
    // パネル配置
    for (let i = 0; i < PANEL_NUM; i++) {
      // グリッド配置用のインデックス値算出
      const sx: number = i % PANEL_NUM_X;
      const sy: number = Math.floor(i / PANEL_NUM_X);
      // パネル作成
      // @ts-ignore
      const panel: Panel = Panel().addChildTo(this.panelGroup);
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
    }
  },
  /**
   * クリア判定
   */
  checkClear: function() {
    if (this.oCount === PANEL_NUM - BOMB_NUM) {
      const children: Panel[] = this.panelGroup.children;
      const len: number = children.length

      // パネルを選択不可に
      for (let i = 0; i < len; i++) {
        const panel: Panel = children[i];
        panel.setInteractive(false, 'rect');
      }
    }
  },
  /**
   * パネルを開く処理
   */
  openPanel: function(panel: Panel) {
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
    
    let bombs: number = 0;
    // 周りのパネルの爆弾数をカウント
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        const pos: Vector2 = Vector2.add(panel.indexPos, Vector2(i, j));
        const target: Panel | null = this.getPanel(pos);
        if (target && target.isBomb) {
          bombs++;
        }
      }
    }
    // パネルに数を表示
    panel.frameIndex = bombs;
    // 周りに爆弾がなければ再帰的に調べる
    if (bombs === 0) {
      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          const pos: Vector2 = Vector2.add(panel.indexPos, Vector2(i, j));
          const target: Panel | null = this.getPanel(pos);
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
  getPanel: function(pos: Vector2): Panel | null {
    const children: Panel[] = this.panelGroup.children;
    const len: number = children.length

    for (let i = 0; i < len; i++) {
      const panel: Panel = children[i];
      
      if (panel.indexPos.equals(pos)){
        return panel;
      } 
    }
    return null;
  },
  /**
   * 爆弾を全て表示する
   */
  showAllBombs: function() {
    const children: Panel[] = this.panelGroup.children;
    const len: number = children.length

    for (let i = 0; i < len; i++) {
      const panel: Panel = children[i];
      panel.setInteractive(false, 'rect');
      
      if (panel.isBomb && panel.frameIndex === PANEL_FRAME) {
        panel.frameIndex = BOMB_FRAME;
      }
    }
  },
});
/**
 * パネルクラス
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
