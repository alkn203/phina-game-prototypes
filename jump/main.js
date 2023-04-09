phina.globalize();
// アセット
const ASSETS = {
  // 画像
  image: {
    'tomapiko': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/jump/assets/tomapiko_ss.png',
    'karasu': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/jump/assets/karasu_ss.png',
    'tiles': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/jump/assets/tiles.png',
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
        "damage": {
          "frames": [4],
          "next": "damage",
          "frequency": 4
        },
        "down": {
          "frames": [5],
          "next": "down",
          "frequency": 4
        },
      }
    },
    'karasu_ss':
    {
      "frame": {
        "width": 64,
        "height": 64,
        "rows": 1,
        "cols": 3
      },
      "animations": {
        "fly": {
          "frames": [0, 1, 2],
          "next": "fly",
          "frequency": 4
        },
      }
    }
  }
};
// 定数
const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 960;
const SPRITE_SIZE = 64;
const GRAVITY = 9.8 / 18;
const JUMP_POWER = 17;
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
    this.backgroundColor = 'skyblue';
    // グループ
    const floorGroup = DisplayElement().addChildTo(this);
    this.enemyGroup = DisplayElement().addChildTo(this);
    // プレイヤー
    const player = Player().addChildTo(this);
    player.setPosition(this.gridX.center(), this.gridY.span(11.5));
    player.state = 'FALLING';
    // クラス全体で参照できるようにする
    this.player = player;
    this.floorGroup = floorGroup;
    // 床作成
    this.initFloor();
  },
  /**
   * 初期床作成
   */
  initFloor: function() {
    const floorGroup = this.floorGroup;
    // 一番下の床
    const ground = Floor(10).addChildTo(floorGroup);
    ground.setPosition(this.gridX.center(), this.gridY.span(12.5));
    ground.children.each(function(sp) {
      sp.frameIndex = 0;
    });
    // その他床
    [8.5, 4.5, 0.5].each((spanY) => {
      const floor = Floor(3).addChildTo(floorGroup);
      floor.setPosition(this.gridX.center(), this.gridY.span(spanY));
    });
  },
  /**
   * 毎フレーム更新処理
   */
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
        this.scrollY();
        //
        if (this.hitTestPlayerEnemy()) {
          player.anim.gotoAndPlay('damage');
        }
        // 下に落下開始
        if (player.vy > 0) {
          player.state = 'FALLING';
        }
        break;
      // 落下中  
      case 'FALLING':
        player.moveY();
        this.scrollY();
        this.collisionY();
        break;
    }
  },
  // 画面スクロール
  scrollY: function() {
    const player = this.player;
    
    this.floorGroup.children.each(function(floor) {
      floor.y -= player.vy;
    });
    
    this.enemyGroup.children.each(function(enemy) {
      enemy.y -= player.vy;
    });
  },
  // 縦方向の当たり判定
  collisionY: function() {
    const player = this.player;
    // 床に乗っている場合は強引に当た(り判定を作る
    const vy = player.vy === 0 ? 4: player.vy;
    // 当たり判定用の矩形
    const rect = Rect(player.left, player.top + vy, player.width, player.height);
    // ブロックグループをループ
    this.floorGroup.children.some((floor) => {
      // ブロックとのあたり判定
      if (Collision.testRectRect(rect, floor)) {
        // 移動量
        player.vy = 0;
        // 位置調整
        player.bottom = floor.top;
        const name = player.anim.currentAnimationName;
        //
        if (name === 'down') {
          return true;
        }
        //
        if (name === 'damage') {
          player.anim.gotoAndPlay('down');
          this.tweener.wait(1000)
                      .call(() => {
                        this.exit();
                      });
          return true;
        }
        // 床更新
        if (player.state === 'FALLING') {
          this.addFloor();
          this.removeFloor();
          this.addEnemy();
        }
        player.state = 'ON_BLOCK';
        // アニメーション変更
        player.anim.gotoAndPlay('stand');
        
        return true;
      }
    });
  },
  /**
   * 床追加
   */
  addFloor: function() {
    const floor = Floor(3).addChildTo(this.floorGroup);
    floor.x = this.gridX.center();
    floor.y = this.gridY.span(-3.5);
  },
  /**
   * 床削除
   */
  removeFloor: function() {
    this.floorGroup.children.eraseIfAll((floor) => {
      if (floor.y > SCREEN_HEIGHT) {
        return true;
      }
    });
  },
  /**
   * 敵追加
   */
  addEnemy: function() {
    const enemy = Karasu().addChildTo(this.enemyGroup);
    enemy.x = this.gridX.center();
    enemy.y = this.gridY.span(-2.5);
  },
  /**
   * 敵削除
   */
  removeEnemy: function() {
    this.enemyGroup.children.eraseIfAll((enemy) => {
      if (enemy.y > SCREEN_HEIGHT) {
        return true;
      }
    });
  },
  /**
   * プレイヤーと敵の当たり判定
   */
  hitTestPlayerEnemy: function() {
    let result = false;
    
    this.enemyGroup.children.some((enemy) => {
      //
      if (this.player.hitTestElement(enemy)) {
        result = true;
        return true;
      }
    });
    return result;
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
  // 縦方向移動量
  moveY: function(real = false) {
    this.vy += GRAVITY;
    
    if (real) {
      this.y += this.vy;
    }
  },
});
// カラスクラス
phina.define('Karasu', {
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('karasu', SPRITE_SIZE, SPRITE_SIZE);
    // フレームアニメーションをアタッチ
    this.anim = FrameAnimation('karasu_ss').attachTo(this);
    this.anim.gotoAndPlay('fly');
    // 横移動速度
    this.vx = -1 * [6, 3, 12].random();
  },
  //
  update: function() {
    this.x += this.vx;
    //
    if (this.left < 0 || this.right > SCREEN_WIDTH) {
      this.vx *= -1;
      this.scaleX *= -1;
    }
  },
});
// 床クラス
phina.define('Floor', {
  superClass: 'RectangleShape',
  // コンストラクタ
  init: function(num) {
    // 親クラス初期化
    this.superInit();
    // サイズ設定
    this.setSize(num * SPRITE_SIZE, SPRITE_SIZE);
    // スプライト配置
    num.times((i) => {
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