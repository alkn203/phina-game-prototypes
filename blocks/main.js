phina.globalize();
// 定数
const BLOCK_SIZE = 40; // ブロックサイズ
const BLOCK_COLS = 10; // ブロックの横に並ぶ数
const BLOCK_ROWS = 20; // ブロックの縦に並ぶ数
const BLOCK_ALL_WIDTH = BLOCK_SIZE * BLOCK_COLS; // ブロック全体の幅
const BLOCK_ALL_HEIGHT = BLOCK_ALL_WIDTH * 2; // ブロック全体の高さ
const INTERVAL = 20; // ブロックの移動速度調整用
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
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit();
    const self = this;

    this.fromJSON({
      children: {
        // ブロック移動エリア
        'blockArea': {
          className: 'RectangleShape',
          width: BLOCK_ALL_WIDTH, height: BLOCK_ALL_HEIGHT,
          fill: 'gray',
          x: this.gridX.center(), top: 0, 
        },
        // 左ボタン
        'leftButton': {
          className: 'Button',
          text: "←",
          width: this.gridX.span(4),
          x: this.gridX.center(-4), y: this.gridY.span(14.6),
          onpointstart: function() {
            self.prevFrame = self.frame;
            self.moveBlockX(-1);
          },
          onpointstay: function() {
            if (self.frame - self.prevFrame > INTERVAL) self.moveBlockX(-1);
          },
        },
        // 右ボタン
        'rightButton': {
          className: 'Button',
          text: "→",
          width: this.gridX.span(4),
          x: this.gridX.center(4), y: this.gridY.span(14.6),
          onpointstart: function() {
            self.prevFrame = self.frame;
            self.moveBlockX(1);
          },
          onpointstay: function() {
            if (self.frame - self.prevFrame > INTERVAL) self.moveBlockX(1);
          },
        },
        // 回転ボタン
        'rotateButton': {
          className: 'Button',
          text: "↑",
          width: this.gridX.span(3.5), height: this.gridY.span(1),
          x: this.gridX.center(), y: this.gridY.span(14),
          onpush: function() { self.rotateBlock(); },
        },
        // 落下ボタン
        'downButton': {
          className: 'Button',
          text: "↓",
          width: this.gridX.span(3.5), height: this.gridY.span(1),
          x: this.gridX.center(), y: this.gridY.span(15.2),
          onpointstay: function() { self.interval = INTERVAL / 10 },
          onpointend: function() { self.interval = INTERVAL; },
        },
      }
    });
    // 移動ブロックグループ
    this.dynamicBlocks = DisplayElement().addChildTo(this);
    // 固定ブロックグループ
    this.staticBlocks = DisplayElement().addChildTo(this);
    // ダミーブロックグループ
    this.dummyBlocks = DisplayElement().addChildTo(this);

    this.interval = INTERVAL; 
    // ブロック作成
    this.createBlock();
  },
  // 落下ブロック作成
  createBlock: function() {
    // 種類をランダムに決める
    const type = Random.randint(0, 6);
    // 落下ブロック作成
    (4).times(function(i) {
      const block = Block().addChildTo(this.dynamicBlocks);
      block.type = type;
      // ライン消しの時に落下させる回数
      block.dropCount = 0;
    }, this);
    // 基準ブロック
    const org = this.dynamicBlocks.children.first;
    org.setPosition(this.gridX.center() + BLOCK_SIZE / 2, this.gridY.span(1));
    // 配置情報をもとにブロックを組み立てる
    this.dynamicBlocks.children.each(function(block, i) {
      block.position = Vector2.add(org.position, BLOCK_LAYOUT[type][i].mul(BLOCK_SIZE));
    });
  },
  // ブロック落下処理
  moveBlockY: function() {
    const blocks = this.dynamicBlocks.children;
    // １ブロック下へ移動
    blocks.each(function(block) {
      block.y += BLOCK_SIZE;
    });

    let hit = false;
    // 当たり判定
    blocks.each(function(block) {
      // 地面
      if (block.top === this.blockArea.bottom) {
        hit = true;
      }
      // 固定ブロック
      this.staticBlocks.children.each(function(target) {
        if (block.hitTestElement(target)) {
          hit = true;
        }
      });
    }, this);
    // ヒットの場合
    if (hit) {
      // １ブロック分戻す
      blocks.each(function(block) {
        block.y -= BLOCK_SIZE; });
      // 固定ブロックへ
      this.dynamicToStatic();
    }
  },
  // 落下ブロック横移動
  moveBlockX: function(dir) {
    const blocks = this.dynamicBlocks.children;
    // １ブロック移動
    blocks.each(function(block) { block.x += dir * BLOCK_SIZE; });
        
    const hit = false;
    const self = this;
    const area = this.blockArea;
    
    blocks.each(function(block) {
      // 画面両端との当たり判定
      if (block.right === area.left || block.left === area.right) hit = true;
      // 固定ブロックとの当たり判定
      self.staticBlocks.children.each(function(target) {
        if (block.hitTestElement(target)) hit = true;
      });
    });
    // ヒットしていたら１ブロック戻す
    if (hit) blocks.each(function(block) { block.x += -dir * BLOCK_SIZE; });
  },
  // 落下ブロック回転
  rotateBlock: function() {
    const blocks = this.dynamicBlocks.children;
    const area = this.blockArea;
    const org = blocks.first;
    // 四角ブロックの場合は何もしない
    if (org.type === 6) return;
    
    const hit = false;
    const self = this;
    // 回転後の位置を事前に計算して、当たり判定を行う
    blocks.each(function(block) {
      const pos = Vector2((block.y - org.y) + org.x, -(block.x - org.x) + org.y);
      // 両端、地面
      if (pos.x < area.left || pos.x > area.right || pos.y > area.bottom) {
        hit = true;
      }
      // 固定ブロック
      self.staticBlocks.children.each(function(target) {
        if (pos.x === target.x && pos.y === target.y) hit = true;
      });
    });
    // 回転不能
    if (hit) return;
    // 回転可能
    blocks.each(function(block) {
      block.setPosition((block.y - org.y) + org.x, -(block.x - org.x) + org.y);
    });
  },
  // 落下ブロックから固定ブロックの変更処理
  DynamicToStatic: function() {
    const blocks = this.dynamicBlocks.children;
    // 落下グループから固定グループへ
    (blocks.length).times(function() {
      blocks.pop().addChildTo(this.staticBlocks);
    }, this);
    // 画面上部に達したらゲームオーバー
    this.staticBlocks.children.each(function(block) {
      if (block.top < 0) {
        this.nextLabel = 'title';
        this.exit();  
      }  
    }, this);
    // ブロック削除処理
    this.removeBlock();
  },
  // ブロック消去処理
  removeBlock: function() {
    const blocks = this.staticBlocks.children;
    const self = this;
    const removeY = [];
    // 上から走査
    BLOCK_ROWS.times(function(i) {
      let count = 0;
      const currentY = i * BLOCK_SIZE;
      // 固定ブロックに対して
      blocks.each(function(block) {
        // 対象ラインと同じ並びかどうか
        if (currentY === block.top) {
          count++;
          // 10個並んでいたら消去対象ラインとして登録
          if (count === BLOCK_COLS) removeY.push(currentY);
        }
      });
    });
    // 消去対象ラインがあれば
    if (removeY.length > 0) {
      removeY.each(function(y) {
        blocks.each(function(block) {
          // 消去マーキング
          if (block.top === y) {
            block.mark = "remove";
            // 消去アニメーション用ダミー作成
            const dummy = Block().addChildTo(self.dummyBlocks);
            dummy.setPosition(block.x, block.y);
          }
          // 削除ラインより上のブロックに落下カウントアップ
          if (block.top < y) block.dropCount++;
        });
      });
      // ブロック消去
      blocks.eraseIfAll(function(block) { return block.mark === "remove"; });
      // ダミーに消去アニメーション
      const flow = Flow(function(resolve) {
        const dummys = self.dummyBlocks.children;

        dummys.each(function(dummy) {
          dummy.tweener.clear().to({scaleY: 0}, 300)
                       .call(function() {
                         dummy.remove();
                         // ダミーを全て消去したら
                         if (dummys.length === 0) resolve('remove done');
                       });
        });
      });
      // 消去アニメーション後、固定ブロック落下処理
      flow.then(function(message) { self.dropBlock(); });      
    }
    else this.createBlock();
  },
  // 固定ブロック落下処理
  dropBlock: function() {
    this.staticBlocks.children.each(function(block) {
      if (block.dropCount > 0) {
        block.y += block.dropCount * BLOCK_SIZE;
        block.dropCount = 0;
      }
    });
    
    this.createBlock();
  },
  // 毎フレーム更新
  update: function(app) {
    // フレーム数を代入しておく
    this.frame = app.frame;
    // 一定フレーム毎にブロック移動
    if (this.dynamicBlocks.children.length > 0 && app.frame % this.interval === 0) {
          this.moveBlockY();
    }
  },
});
// ブロッククラス
phina.define('Block', {
  // RectangleShapeを継承
  superClass: 'RectangleShape',
    // コンストラクタ
    init: function() {
      // 親クラス初期化
      this.superInit({
        width: BLOCK_SIZE,
        height: BLOCK_SIZE,
        cornerRadius: 5,
        fill: 'silver',
        stroke: 'white',
      });
    },
});
// メイン
phina.main(function() {
  const app = GameApp({
    title: 'Blocks',
  });
  app.run();
});
