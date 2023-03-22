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
const INTERVAL = 200;
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
  [Vector2(0, 0), Vector2(0, -1), Vector2(1, -1), Vector2(1, 0)]];
// キー用配列
const KEY_ARRAY = [
  ["left", Vector2.LEFT],
  ["right", Vector2.RIGHT]];
// 自作クラス補完用
interface Block extends Sprite {
  indexPos: Vector2;
  type: number;
  removable: boolean;
  dropCount: number;
};
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
    this.dummyGroup = DisplayElement().addChildTo(this);
    // 変数
    this.prevTime = 0;
    this.curTime = 0;
    this.interval = INTERVAL;
    this.removeline = [];
    // ブロック作成
    this.createBlock();
  },
  /**
   * 毎フレーム処理
   */
  update: function(app) {
    this.curTime += app.deltaTime;

    if (this.dynamicGroup.children.length > 0) {
      // 一定時間毎にブロック落下
      if (this.curTime - this.prevTime > this.interval) {
        this.moveBlockY();
        this.prevTime = this.curTime;
      }
      // ブロック横移動
      this.moveBlockX(app);
      // ブロック回転
      this.rotateBlock(app);
      // ブロック落下速度変更
      this.moveBlockYFaster(app);    
    }
    // 画面上到達
    if (this.hitTop()) {
      this.exit('title');
    }
  },
  /**
   * ブロック作成関数
   */
  createBlock: function() {
    // 種類をランダムに決める
    const type = Random.randint(0, BLOCK_TYPE - 1);
    // 落下ブロック作成
    BLOCK_NUM.times(() => {
      //@ts-ignore
      const block: Block = Block().addChildTo(this.dynamicGroup);
      // ブロックの種類
      block.type = type;
      // フレームインデックス設定
      block.frameIndex = type;
    });
    // 中心ブロック
    var org: Block = this.dynamicGroup.children.first;
    org.x = this.gridX.center() + BLOCK_OFFSET;
    org.y = BLOCK_OFFSET;
    // 配置情報データをもとにブロックを配置
    this.dynamicGroup.children.each((block: Block, i: number) => {
      block.x = org.x + BLOCK_LAYOUT[type][i].x * BLOCK_SIZE;
      block.y = org.y + BLOCK_LAYOUT[type][i].y * BLOCK_SIZE;
      block.indexPos = this.coordToIndex(block.position);
    });
  },
  /**
   * ブロック左右移動
   */
  moveBlockX: function(app) {
    const key = app.keyboard;
    // 配列ループ
    KEY_ARRAY.each((item) => {
      // キー入力チェック
      if (key.getKeyDown(item[0])) {
        // 移動
        this.moveBlock(item[1]);
        // 両端チェックと固定ブロックとの当たり判定
        if (this.hitEdge() || this.hitStatic()) {
          //  ブロックを戻す
          //@ts-ignore
          this.moveBlock(Vector2.mul(item[1], -1));
        }
      }
    });
  },
  /**
   * ブロック落下処理
   */
  moveBlockY: function() {
    // 1ブロック分落下
    this.moveBlock(Vector2.DOWN);
    // 画面下到達か固定ブロックにヒット
    if (this.hitBottom() || this.hitStatic()) {
      // ブロックを戻す
      this.moveBlock(Vector2.UP);
      // 固定ブロックへ追加
      this.dynamicToStatic();
      // 削除行チェック
      this.checkRemoveline();
    }
  },
  /**
   * ブロック落下スピード変更
   */
  moveBlockYFaster: function(app) {
    const key = app.keyboard;
    // キー入力チェック
    if (key.getKey('down')) {
      this.intnterval = INTERVAL / 2;
    }
    if (key.getKeyUp('down') {
      this.interval = INTERVAL;
    }
  },
  /**
   * ブロック移動処理
   */
  moveBlock: function(vec: Vector2) {
    this.dynamicGroup.children.each((block: Block) => {
      block.position.add(Vector2.mul(vec, BLOCK_SIZE));
      block.indexPos.add(vec);
    }); 
  },
  /**
   * ブロック回転処理
   */
  rotateBlock: function(app) {
    const key = app.keyboard;
    // 上キー
    if (key.getKeyDown('up')) {
      // 移動
      const children: Block[] = this.dynamicGroup.children;
      // 度からラジアンへ変換
      const rad = Math.degToRad(90);
      // 回転の原点
      const point = children.first.position;
      // 原点を中心に回転後の座標を求める
      children.each((block) => {
        block.position.rotate(rad, point);
        block.indexPos = this.coordToIndex(block.position);
      });
      // 両端と固定ブロックと底との当たり判定
      if (this.hitEdge() || this.hitStatic() || this.hitBottom()) {
        //  回転を戻す
        children.each((block) => {
          block.position.rotate(-1 * rad, point);
          block.indexPos = this.coordToIndex(block.position);
        });
      }
    }
  },
  /**
   * 削除可能ラインチェック
   */
  checkRemoveline: function() {
    // 上から走査
    BLOCK_ROWS.times((i: number) => {
      let count = 0;
      // 固定ブロックに対して
      this.staticGroup.children.some((block: Block) => {
        // 走査ライン上にあればカウント
        if (block.indexPos.y === i) {
          count++;
        }
        // 10個あれば削除対象ラインとして登録
        if (count === BLOCK_COLS) {
          this.removeline.push(i);
          return true;
        }
      });
    });
    // 削除対象ラインがあれば
    if (this.removeline.length > 0) {
      this.removeBlock();
    }
    else {
      this.createBlock();
    }
  },
  /**
   * ブロック削除処理
   */
  removeBlock: function() {
    const sta: Block[] = this.staticGroup.children;
    // 削除対象ラインに対して
    this.removeline.each((line: number) => {
      sta.each((block) => {
        if (block.indexPos.y === line) {
          // 削除フラグ
          block.removable = true;
          // 消去アニメーション用ダミー作成
          const dummy = Block().addChildTo(this.dummyGroup);
          dummy.position = block.position;
          dummy.frameIndex = block.frameIndex;
        }
        // 削除ラインより上のブロックに落下回数カウント
        if (block.indexPos.y < line) {
          block.dropCount++;
        }
      });
    });
    // ブロック削除
    sta.eraseIfAll((block) => {
      if (block.removable) {
        return true;
      }
    });

    this.removeline.clear();
    // 消去アニメーション
    this.dummyGroup.children.each((dummy) => {
      const flow = Flow((resolve) => {
        dummy.tweener
             .to({scaleY: 0.2}, 200)
             .call(() => {
               dummy.remove();
               resolve('removed');
             }).play();
      });
      flows.push(flow);
    });
    // アニメーション後落下処理へ
    Flow.all(flows).then((message) => {
      this.dropBlock();
    });
  },
  /**
   * 固定ブロック落下処理
   */
  dropBlock: function() {
    this.staticGroup.children.each((block: Block) => {
      if (block.dropCount > 0) {
        block.y += block.dropCount * BLOCK_SIZE;
        block.indexPos = this.coordToIndex(block.position);
        block.dropCount = 0;
      }
    });
    //落下ブロック作成
    this.createBlock();
  },
  /**
   * 画面上到達チェック
   */
  hitTop: function(): boolean {
    const children: Block[] = this.dynamicGroup.children;
    const len: number = children.length;

    for (let i = 0; i < len; i++) {
      const block: Block = children[i];
      
      if (block.indexPos.y === 0) {
        return true;
      }
    }
    return false;
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
        return true;
      }
    }
    return false;
  },
  /**
   * 両端チェック
   */
  hitEdge: function() {
    const children: Block[] = this.dynamicGroup.children;
    const len = children.length;

    for (let i = 0; i < len; i++) {
      const block: Block = children[i];
      if (block.indexPos.x === EDGE_LEFT || block.indexPos.x === EDGE_RIGHT) { 
        return true;
      }
    }
    return false;
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
    BLOCK_NUM.times(() => {
      this.dynamicGroup.children.pop().addChildTo(this.staticGroup);
    });
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
    // 削除フラク
    this.removable = false
    // 落下回数
    this.dropCount = 0;
  },
});
/**
 * メイン
 */
phina.main(function () {
  const app = GameApp({
    //@ts-ignore
    title: 'blocks',
    // アセット読み込み
    assets: ASSETS,
  });
  app.run();
});
