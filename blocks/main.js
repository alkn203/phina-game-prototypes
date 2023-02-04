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
// メインシーン
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
    // 変数
    this.prevTime = 0;
    this.curTime = 0;
    this.interval = INTERVAL;
    this.removeLine = [];
    // ブロック作成
    this.createBlock();
  },
  // 毎フレーム処理
  update: function(app) {
    this.curTime += app.deltaTime;
    // 一定時間毎にブロック落下
    if (this.curTime - this.prevTime > this.interval) {
      this.moveBlockY();
      this.prevTime = this.curTime;
    }
  },
  // ブロック作成関数
  createBlock: function() {
    // 種類をランダムに決める
    const type = Random.randint(0, BLOCK_TYPE - 1);
    // 落下ブロック作成
    BLOCK_NUM.times(function() {
      const block = Block().addChildTo(this.dynamicGroup);
      // ブロックの種類
      block.type = type;
      // フレームインデックス設定
      block.frameIndex = type;
    }, this);
    // 中心ブロック
    var org = this.dynamicGroup.children.first;
    org.x = this.gridX.center() + BLOCK_OFFSET;
//    org.y = 0;
    org.y = this.gridY.center() + BLOCK_OFFSET;
    // 配置情報データをもとにブロックを配置
    this.dynamicGroup.children.each(function(block, i) {
      block.x = org.x + BLOCK_LAYOUT[type][i].x * BLOCK_SIZE;
      block.y = org.y + BLOCK_LAYOUT[type][i].y * BLOCK_SIZE;
      block.indexPos = this.coordToIndex(block.position);
    }, this);
  },
  // ブロック落下処理
  moveBlockY: function() {
    // 1ブロック分落下
    this.moveBlock(Vector2.DOWN);
/*    // 画面下到達か固定ブロックにヒット
    if _hit_bottom() or _hit_static():
      # ブロックを戻す
      _move_block(Vector2.UP)
      # 固定ブロックへ追加
      _dynamic_to_static()
      #
      _check_remove_line()*/
  },
  // ブロック移動処理
  moveBlock: function(vec) {
    this.dynamicGroup.children.each(function(block) {
      block.position.add(Vector2.mul(vec, BLOCK_SIZE));
      block.indexPos.add(vec);
    });  
  },
  // 座標値からインデックス値へ変換
  coordToIndex: function(vec) {
    const x = Math.floor(vec.x / BLOCK_SIZE);
    const y = Math.floor(vec.y / BLOCK_SIZE);
    return Vector2(x, y);
  },
});
// ブロッククラス
phina.define('Block', {
  // Spriteを継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('block', BLOCK_SIZE, BLOCK_SIZE);
    // 位置インデックス
    this.indexPos = Vector2.ZERO;
  },
});
// メイン
phina.main(function () {
  const app = GameApp({
    startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  app.run();
});