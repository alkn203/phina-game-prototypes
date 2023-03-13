// 型定義ファイルを参照
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />

phina.globalize();
// 定数
const BLOCK_SIZE = 40
const BLOCK_OFFSET = BLOCK_SIZE / 2;
const BLOCK_COLS = 10
const BLOCK_ROWS = 20
const BLOCK_NUM = 4
const BLOCK_TYPE = 7
const BOTTOM_Y = 20
const EDGE_LEFT = 2
const EDGE_RIGHT = 13
const INTERVAL = 1000;
// アセット
const ASSETS = {
  // 画像
  image: {
    'block': 'assets/block.png',
  },
};
// ブロック(7種)の配置情報
const BLOCK_LAYOUT = [
  [Vector2(0, 0), Vector2(0, -1), Vector2(0, -2), Vector2(0, 1)],
  [Vector2(0, 0), Vector2(0, -1), Vector2(0, 1), Vector2(1, 1)],
  [Vector2(0, 0), Vector2(0, -1), Vector2(0, 1), Vector2(-1, 1)],
  [Vector2(0, 0), Vector2(0, -1), Vector2(-1, -1), Vector2(1, 0)],
  [Vector2(0, 0), Vector2(0, -1), Vector2(1, -1), Vector2(-1, 0)],
  [Vector2(0, 0), Vector2(1, 0), Vector2(-1, 0), Vector2(0, -1)],
  [Vector2(0, 0), Vector2(0, -1), Vector2(1, -1), Vector2(1, 0)]]
// キー用配列
const KEY_ARRAY = [
  ["left", Vector2.LEFT],
  ["right", Vector2.RIGHT]]
// 自作クラス補完用
interface Block extends Sprite {
  indexPos: Vector2
  type: number
}
/**
 * メインシーン
 */
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'gray';
    // ブロック移動領域
    var blockArea = RectangleShape({
      width: BLOCK_SIZE * BLOCK_COLS,
      height: BLOCK_SIZE * BLOCK_ROWS,
      fill: 'black',
    }).addChildTo(this);
    blockArea.x = this.gridX.center();
    blockArea.top = 0;
    // グループ 
    this.dynamicGroup = DisplayElement().addChildTo(this);
    this.staticGroup = DisplayElement().addChildTo(this);
    // 変数
    this.prevTime = 0;
    this.curTime = 0;
    this.interval = INTERVAL;
    this.removeLine = [];
    // ブロック作成
    this.createBlock();
  },
  /**
   * 毎フレーム処理
   */
  update: function(app: Ticker) {
    this.curTime += app.deltaTime;
    // 一定時間毎にブロック落下
    if (this.curTime - this.prevTime > this.interval) {
      this.moveBlockY();
      this.prevTime = this.curTime;
    }
  },
  /**
   * ブロック作成関数
   */
  createBlock: function() {
    // 種類をランダムに決める
    const type: number = Random.randint(0, BLOCK_TYPE - 1);
    // 落下ブロック作成
    for (let i = 0; i < BLOCK_NUM; i++) {
      //@ts-ignore
      const block: Block = Block().addChildTo(this.dynamicGroup);
      // ブロックの種類
      block.type = type;
      // フレームインデックス設定
      block.frameIndex = type;
    }
    // 中心ブロック
    var org: Block = this.dynamicGroup.children.first;
    org.x = this.gridX.center() + BLOCK_OFFSET;
    org.y = 0;
    // 配置情報データをもとにブロックを配置
    for (let i = 0; i < BLOCK_NUM; i++) {
      const block: Block = this.dynamicGroup.children[i];
      block.x = org.x + BLOCK_LAYOUT[type][i].x * BLOCK_SIZE;
      block.y = org.y + BLOCK_LAYOUT[type][i].y * BLOCK_SIZE;
      block.indexPos = this.coordToIndex(block.position);
    }
  },
  /**
   * ブロック落下処理
   */
  moveBlockY: function() {
    // 1ブロック分落下
    this.moveBlock(Vector2.DOWN);
    // 画面下到達か固定ブロックにヒット
    if (this.hitBottom() && this.hitStatic()) {
      // ブロックを戻す
      this.moveBlock(Vector2.UP);
      // 固定ブロックへ追加
      this.dynamicToStatic();
    }
  },
  /**
   * ブロック横移動処理
   */
  moveBlockX: function() {
    // 1ブロック分落下
    this.moveBlock(Vector2.DOWN);
    // 画面下到達か固定ブロックにヒット
    if (this.hitBottom() && this.hitStatic()) {
      // ブロックを戻す
      this.moveBlock(Vector2.UP);
      // 固定ブロックへ追加
      this.dynamicToStatic();
    }
  },
  /**
   * ブロック移動処理
   */
  moveBlock: function(vec: Vector2) {
    const children: Block[] = this.dynamicGroup.children;
    const len: number = children.length; 

    for (let i = 0; i < len; i++) {
      const block: Block = this.dynamicGroup.children[i];
      block.position.add(Vector2.mul(vec, BLOCK_SIZE));
      block.indexPos.add(vec);
    }
  },
  /**
   * 画面下到達チェック
   */
  hitBottom: function(): boolean {
    const children: Block[] = this.dynamicGroup.children;
    const len: number = children.length;

    for (let i = 0; i < len; i++) {
      const block: Block = children[i];
      
      if (block.indexPos.y === BOTTOM_Y) {
        return true
      }
    }
    return false
  },
  /**
   * 固定ブロックとの当たり判定
   */
  hitStatic: function(): boolean {
    const children: Block[] = this.dynamicGroup.children;
    const len: number = children.length;
    const children2: Block[] = this.staticGroup.children;
    const len2: number = children2.length;

    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len2; j++) {
        const block: Block = children[i];
        const target: Block = children2[j];
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
  dynamicToStatic: function() {
    // グループ間の移動
    const children: Block[] = this.dynamicGroup.children;
    const len: number = children.length;

    for (let i = 0; i < len; i++) {
      children.pop().addChildTo(this.staticGroup);
    }
  },
  /**
   * 座標値からインデックス値へ変換
   */
  coordToIndex: function(vec: Vector2): Vector2 {
    const x: number = Math.floor(vec.x / BLOCK_SIZE);
    const y: number = Math.floor(vec.y / BLOCK_SIZE);
    return Vector2(x, y);
  },
});
/**
 * ブロッククラス
 */
phina.define('Block', {
  // Spriteを継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('block', BLOCK_SIZE, BLOCK_SIZE);
    // 位置インデックス
    this.indexPos = Vector2.ZERO;
    // ブロックの種類
    this.type = 0;
  },
});
/**
 * メイン
 */
phina.main(function () {
  const app = GameApp({
    startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  app.run();
});
