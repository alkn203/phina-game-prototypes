// 型定義ファイルを参照
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />

phina.globalize();
// アセット
const ASSETS = {
  // 画像
  image: {
    'tomapiko': 'assets/tomapiko_ss.png',
    'tiles': 'assets/tiles.png',
  },
  // フレームアニメーション情報
  spritesheet: {
    'tomapiko_ss':
    {
      "frame": {
        "width": 64,
        "height": 64,
        "rows": 3,
        "cols": 6
      },
      "animations": {
        "stand": {
          "frames": [0],
          "next": "stand",
          "frequency": 4
        },
        "fly": {
          "frames": [1, 2, 3],
          "next": "fly",
          "frequency": 4
        },
      }
    }
  }
};
// 定数
const SCREEN_WIDTH = 640; // 画面横サイズ
const SCREEN_HEIGHT = 960; // 画面縦サイズ
const SPRITE_SIZE = 64;
const GRAVITY = 9.8 / 18; // 重力
const JUMP_POWER = 15; // ジャンプ力
// 独自クラス補完用
interface Player extends Sprite {
  anim: FrameAnimation;
  vy: number;
};

// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'skyblue';
    // グループ
    const floorGroup = DisplayElement().addChildTo(this);
    // グリッド
    const gx = this.gridX;
    const gy = this.gridY;
    // プレイヤー
    //@ts-ignore
    const player = Player().addChildTo(this);
    player.setPosition(gx.center(), gy.span(13.5));
    player.state = 'FALLING';
    //@ts-ignore
    var floor = Floor(3).addChildTo(floorGroup);
    floor.setPosition(320, 960);
    // クラス全体で参照できるようにする
    this.player = player;
    this.floorGroup = floorGroup;
  },
  // 毎フレーム更新処理
  update: function(app) {
    const player = this.player;
    const state = this.player.state;
    const p = app.pointer;
    // プレイヤーの状態で分ける
    switch (state) {
      // ブロックの上
      case 'ON_BLOCK':
        // タッチ開始
        if (p.getPointingStart()) {
          player.vy = -JUMP_POWER;
          player.state = 'JUMPING';
          // アニメーション変更
          player.anim.gotoAndPlay('fly');
        }
        // 縦あたり判定
        this.collisionY();
        break;
      // ジャンプ中
      case 'JUMPING':
        player.moveY();
        // 下に落下開始
        if (player.vy > 0) {
          player.state = 'FALLING';
        }
        break;
      // 落下中  
      case 'FALLING':
        player.moveY();
        this.collisionY();
        break;
    }
  },
  // 縦方向の当たり判定
  collisionY: function() {
    const player = this.player;
    // 床に乗っている場合は強引に当た(り判定を作る
    const vy = player.vy === 0 ? 4: player.vy;
    //var vy = player.vy;
    // 当たり判定用の矩形
    const rect = Rect(player.left, player.top + vy, player.width, player.height);
    let result = false;
    // ブロックグループをループ
    this.floorGroup.children.some(function(floor) {
      // ブロックとのあたり判定
      if (Collision.testRectRect(rect, floor)) {
        // 移動量
        player.vy = 0;
        // 位置調整
        player.bottom = floor.top;
        //
        player.state = 'ON_BLOCK';
        // アニメーション変更
        player.anim.gotoAndPlay('stand');
        
        result = true;
        return true;
      }
    });
    // 当たり判定なし
    if (!true) {
      player.state = 'FALLING';
    }
  },
});
// プレイヤークラス
phina.define('Player', {
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('tomapiko', SPRITE_SIZE, SPRITE_SIZE);
    // フレームアニメーションをアタッチ
    this.anim = FrameAnimation('tomapiko_ss').attachTo(this);
    // 縦移動速度
    this.vy = 0;
  },
  // 縦方向移動
  moveY: function() {
    this.vy += GRAVITY;
    this.y += this.vy;
  },
});
// 床クラス
phina.define('Floor', {
  superClass: 'RectangleShape',
  // コンストラクタ
  init: function(num: number) {
    // 親クラス初期化
    this.superInit();
    // サイズ設定
    this.setSize(num * SPRITE_SIZE, SPRITE_SIZE);
    // スプライト配置
    num.times((i: number) => {
      // 一旦左に寄せる
      const sp = Sprite('tiles', SPRITE_SIZE, SPRITE_SIZE).addChildTo(this);
      sp.left = this.left;
      sp.y = this.y;
      sp.frameIndex = 3;
      // 横位置調整
      sp.x += i * SPRITE_SIZE;
    });
  },
});
// メイン
phina.main(function() {
  const app = GameApp({
    startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  
  app.run();
});