// グローバルに展開
phina.globalize();
// 定数
var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 960;
var GRID_SIZE = 64;
var GRID_NUM_X = 10;
var GRID_NUM_Y = 15;
var PLAYER_SPEED = 5;
var SHOT_SPEED = 10;
var RELOAD_TIME = 50;
var ENEMY_NUM_X = 9;
var ENEMY_NUM_Y = 5;
var ENEMY_NUM = 45;
var ALIEN_SPEED = 1000;
var BEAM_SPEED = 2;
var PROB_BEAM = 0.0005;
// アセット
var ASSETS = {
  // 画像
  image: {
    'player': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/invader/assets/player.png',
    'shot': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/invader/assets/shot.png',
    'enemy-sheet': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/invader/assets/enemy-sheet.png',
    'explosion-sheet': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/invader/assets/explosion-sheet.png',
    'beam': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/invader/assets/beam.png',
    'ufo-sheet': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/invader/assets/ufo-sheet.png',
  },
  // スプライトシート
  spritesheet: {
    'enemy_ss':
    {
      "frame": {
        "width": 64,
        "height": 64,
        "cols": 2,
        "rows": 1,
      },
      // アニメーション
      "animations" : {
        "loop": {
          "frames": [0,1],
          "next": "loop",
          "frequency": 16,
        },
      }
    },
    'ufo_ss':
    {
      "frame": {
        "width": 64,
        "height": 64,
        "cols": 2,
        "rows": 1,
      },
      // アニメーション
      "animations" : {
        "loop": {
          "frames": [0,1],
          "next": "loop",
          "frequency": 16,
        },
      }
    },
    'explosion_ss':
    {
      "frame": {
        "width": 64,
        "height": 64,
        "cols": 2,
        "rows": 1,
      },
      // アニメーション
      "animations" : {
        "start": {
          "frames": [0,1],
          "next": "",
          "frequency": 4,
        },
      }
    },
  },
};

// メインシーン
phina.define(`MainScene`, {
  // DisplaySceneを継承
  superClass: 'DisplayScene',
  // 初期化
  init: function() {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'black';
    // グリッド
    this.gx = Grid(SCREEN_WIDTH, GRID_NUM_X);
    this.gy = Grid(SCREEN_HEIGHT, GRID_NUM_Y);
    // グループ
    this.shotGroup = DisplayElement().addChildTo(this);
    this.beamGroup = DisplayElement().addChildTo(this);
    this.enemyGroup = DisplayElement().addChildTo(this);
    this.explosionGroup = DisplayElement().addChildTo(this);
    // プレイヤー配置
    this.player = Player().addChildTo(this);
    this.player.setPosition(this.gx.center(), this.gy.span(14));
    // ショット間隔管理用
    this.prevTime = -RELOAD_TIME;
    
    this.locateEnemys();
  },
  // 敵配置
  locateEnemys: function() {
    var self = this;
    
    ENEMY_NUM.times(function(i) {
      // グリッド配置用のインデックス値算出
      var xIndex = i % ENEMY_NUM_X;
      var yIndex = Math.floor(i / ENEMY_NUM_X);
      // 敵作成
      var enemy = Enemy().addChildTo(self.enemyGroup);
      // Gridを利用して配置
      enemy.x = self.gx.span(xIndex) + GRID_SIZE;
      enemy.y = self.gy.span(yIndex) + GRID_SIZE;
    });
  },
  // 敵とショットの当たり判定
  hitTestEnemyAndShot: function() {
    var enemys = this.enemyGroup.children;
    var shots = this.shotGroup.children;
    var explosions = this.explosionGroup;
    // グループをループ
    enemys.each(function(enemy) {
      shots.each(function(shot) {
        // 当たり判定
        if (enemy.hitTestElement(shot)) {
          shot.remove();
          // 爆発表示
          var explosion = Explosion().addChildTo(explosions);
          explosion.setPosition(enemy.x, enemy.y);
          enemy.remove();
        }
      });
    });
  },
  // 毎フレーム処理
  update: function(app) {
    // 押された方向キーの情報を得る
    var dir = app.keyboard.getKeyDirection();
    // 左右移動
    if ((dir.x === -1 && dir.y === 0) || (dir.x === 1 && dir.y === 0)) {
      this.player.x += dir.x * PLAYER_SPEED;
    }
    // スペースキーでミサイル発射
    if (app.keyboard.getKey('space')) {
      // 一定フレーム経過後なら
      if (app.frame - this.prevTime > RELOAD_TIME) {
        // プレイヤーの位置に表示
        Shot().addChildTo(this.shotGroup).setPosition(this.player.x, this.player.y);
        this.prevTime = app.frame;
      }
    }
    //
    this.hitTestEnemyAndShot();
  },
});
// プレイヤークラス
phina.define('Player', {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('player');
  },
});
// ミサイルクラス
phina.define('Shot', {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('shot');
    // 上方向に移動
    this.physical.force(0, -SHOT_SPEED);
  },
  // 毎フレーム処理
  update: function() {
    // 画面外到達で消去
    if (this.bottom < 0) {
      this.remove();
    }
  },
});
// 敵クラス
phina.define('Enemy', {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('enemy-sheet', 64, 64);
    // SpriteSheetをスプライトにアタッチ
    var anim = FrameAnimation('enemy_ss').attachTo(this);
    //アニメーションを再生する
    anim.gotoAndPlay('loop');
  },
});
// UFOクラス
phina.define('Ufo', {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('ufo-sheet', 64, 64);
    // SpriteSheetをスプライトにアタッチ
    var anim = FrameAnimation('ufo_ss').attachTo(this);
    //アニメーションを再生する
    anim.gotoAndPlay('loop');
  },
});
// ビームクラス
phina.define('Beam', {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('beam');
    // 下方向に移動
    this.physical.force(0, BEAM_SPEED);
  },
});
// 爆発クラス
phina.define('Explosion', {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('explosion-sheet', 64, 64);
    // SpriteSheetをスプライトにアタッチ
    var anim = FrameAnimation('explosion_ss').attachTo(this);
    //アニメーションを再生する
    anim.gotoAndPlay('start');
    // 参照用
    this.anim = anim;
  },
  // 毎フレーム処理
  update: function() {
    // アニメーションが終わったら自身を消去
    if (this.anim.finished) {
      this.remove();
    }
  },
});
// メイン処理
phina.main(function() {
  // アプリケーションを生成
  var app = GameApp({
    assets: ASSETS,
  });
  // 実行
  app.run();
  // 無理やり canvas にフォーカス
  ;(function() {
    var canvas = app.domElement;
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
  })();
});