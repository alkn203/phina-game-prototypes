// グローバルに展開
phina.globalize();
// 定数
var SCREEN_WIDTH = 640;       // スクリーン幅
var SCREEN_HEIGHT = 960;      // スクリーン高さ
var GRID_SIZE = 64;           // グリッドサイズ
var GRID_NUM_X = 10;
var GRID_NUM_Y = 15;
var PLAYER_SPEED = 5;
var SHOT_SPEED = 20;
var RELOAD_TIME = 1500;
var ENEMY_NUM_X = 9;
var ENEMY_NUM_Y = 5;
var ENEMY_NUM = 45;
var ENEMY_SPEED = 0.5;
var OFFSET_X = GRID_SIZE / 2;
var OFFSET_Y = GRID_SIZE / 2;
var BEAM_SPEED = 2;
var PROB_BEAM = 0.0005;
var UFO_INTERVAL = 8000;
// アセット
var ASSETS = {
  // 画像
  image: {
    'player': 'assets/player.png',
    'shot': 'assets/shot.png',
    'enemy-sheet': 'assets/enemy-sheet.png',
    'explosion-sheet': 'assets/explosion-sheet.png',
    'beam': 'assets/beam.png',
    'ufo-sheet': 'assets/ufo-sheet.png',
  },
};
// タイトルシーン
phina.define('TitleScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    this.superInit();
    // 背景色
    this.backgroundColor = 'black';
    // タイトル
    Label({
      text: 'INVADER GAME',
      fontSize: 64,
      fill: 'red',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(4));
    // 敵表示
    Enemy().addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
    //
    Label({
      text: 'PRESS KEY TO START',
      fill: 'red',
      fontSize: 40,
    }).addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(12))
      .tweener.fadeOut(1000).fadeIn(1000).wait(1000).setLoop(true).play();
    // 画面タッチ時
    this.on('keyup', function() {
      // 次のシーンへ
      this.exit();
    });
  },
});
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
    this.ufoGroup = DisplayElement().addChildTo(this);
    this.scoreGroup = DisplayElement().addChildTo(this);
    // プレイヤー配置
    this.player = Player().addChildTo(this);
    // コライダー設定
    this.player.setPosition(this.gx.center(), this.gy.span(14));
    this.player.collider.setSize(50, 50);
    //
    this.time = 0;
    //
    this.state = 'playing';
    // ショット間隔管理用
    this.reloadTime = -RELOAD_TIME;
    // UFO出現管理用
    this.ufoTime = UFO_INTERVAL;
    //
    this.locateEnemy();
    // 敵の横移動方向
    this.enemyDir = -1;
  },
  // 敵配置
  locateEnemy: function() {
    ENEMY_NUM.times(function(i) {
      // グリッド配置用のインデックス値算出
      var xIndex = i % ENEMY_NUM_X;
      var yIndex = Math.floor(i / ENEMY_NUM_X);
      // 敵作成
      var enemy = Enemy().addChildTo(this.enemyGroup);
      // Gridを利用して配置
      enemy.x = this.gx.span(xIndex) + GRID_SIZE;
      enemy.y = this.gy.span(yIndex) + GRID_SIZE;
      // コライダー設定
      enemy.collider.hide();
      
    }, this);
  },
  // 敵移動
  moveEnemy: function() {
    var result = false;
    
    this.enemyGroup.children.some(function(enemy) {
      // 画面端到達チェック
      if ((enemy.left - ENEMY_SPEED < 0.001) || (enemy.right + ENEMY_SPEED > SCREEN_WIDTH - 0.001)) {
        result = true;
        return true;
      }
    });
    // 到達していたら下に移動して向き反転
    if (result) {
      this.enemyGroup.children.each(function(enemy) {
        enemy.y += GRID_SIZE / 2;
      });
      
      this.enemyDir *= -1;
    }
    // 移動処理
    this.enemyGroup.children.each(function(enemy) {
      enemy.x += this.enemyDir * ENEMY_SPEED;
    }, this);
  },
  // 敵の攻撃
  enemyAttack: function() {
    var beamGroup = this.beamGroup;
    
    this.enemyGroup.children.each(function(enemy) {
      // 一定確率でビーム発射
      if (Math.randfloat(0, 1) < PROB_BEAM) {
        Beam().addChildTo(beamGroup).setPosition(enemy.x, enemy.y);
      }
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
        if (enemy.collider.hitTest(shot.collider)) {
          shot.remove();
          // 爆発表示
          var explosion = Explosion().addChildTo(explosions);
          explosion.setPosition(enemy.x, enemy.y);
          enemy.remove();
        }
      });
    });
  },
  // 敵のビームと自機の当たり判定
  hitTestBeamAndPlayer: function() {
    var beams = this.beamGroup.children;
    var player = this.player;
    var self = this;
    // グループをループ
    beams.each(function(beam) {
      // 当たり判定
      if (beam.collider.hitTest(player.collider)) {
          self.gameOver();
      }
    });
  },
  // UFOとショットの当たり判定 
  hitTestUfoAndShot: function() { 
    var ufos = this.ufoGroup.children; 
    var shots = this.shotGroup.children; 
    var scores = this.scoreGroup; 
    // グループをループ 
    ufos.each(function(ufo) { 
      shots.each(function(shot) { 
        // 当たり判定 
        if (ufo.hitTestElement(shot)) { 
          shot.remove(); 
          // 点数表示
          var score = Score(1000).addChildTo(scores); 
          score.setPosition(ufo.x, ufo.y); 
          ufo.remove();
        }
      }); 
    }); 
  },
  //
  gameOver: function() {
    this.state = 'over';
    var self = this
    // 敵などの動きを止める
    this.beamGroup.children.each(function(beam) {
      beam.physical.force(0,0);
    });

    this.ufoGroup.children.each(function(ufo) {
      ufo.physical.force(0,0);
    });

    this.shotGroup.children.each(function(shot) {
      shot.physical.force(0,0);
    });
    // 一定時間経過後タイトルへ移動
    this.tweener.wait(2000)
                .call(function() {
                  self.exit('title')
                });
  },
  // 毎フレーム処理
  update: function(app) {
    // ゲームオーバーなら何もしない
    if (this.state === 'over') {
      return;
    }
    //
    this.time += app.deltaTime;
    // 押された方向キーの情報を得る
    var dir = app.keyboard.getKeyDirection();
    // 左右移動
    if ((dir.x === -1 && dir.y === 0) || (dir.x === 1 && dir.y === 0)) {
      this.player.x += dir.x * PLAYER_SPEED;
    }
    // 敵移動
    this.moveEnemy();
    // 敵攻撃
    this.enemyAttack();
    // スペースキーでミサイル発射
    if (app.keyboard.getKey('space')) {
      // 一定フレーム経過後なら
      if (this.time - this.reloadTime > RELOAD_TIME) {
        // プレイヤーの位置に表示
        var shot = Shot().addChildTo(this.shotGroup);
        shot.setPosition(this.player.x, this.player.y);
        // コライダー設定
        shot.collider.hide().setSize(8, 32);
        this.reloadTime = this.time;
      }
    }
    // 当たり判定
    this.hitTestEnemyAndShot();
    this.hitTestBeamAndPlayer();
    this.hitTestUfoAndShot();
    // UFO出現管理
    if (this.time - this.ufoTime > UFO_INTERVAL) {
      var ufo = Ufo().addChildTo(this.ufoGroup);
      ufo.setPosition(SCREEN_WIDTH, this.gy.span(1));
      this.ufoTime = this.time
    }
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
    // アニメーション
    this.tweener.wait(1000)
                .set({frameIndex: 1})
                .wait(1000)
                .set({frameIndex: 0})
                .setLoop(true)
                .play();
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
    // 左方向へ移動
    this.physical.force(-4, 0);
    // アニメーション
    this.tweener.wait(1000)
                .set({frameIndex: 1})
                .wait(1000)
                .set({frameIndex: 0})
                .setLoop(true)
                .play();
  },
  // 毎フレーム処理
  update: function() {
    // 画面外に出たら削除
    if (this.right < 0) {
      this.remove();
    }
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
    // コライダー
    this.collider.setSize(16, 64);
  },
  // 毎フレーム処理
  update: function() {
    // 画面外に出たら削除
    if (this.top > SCREEN_HEIGHT) {
      this.remove();
    }
  },
});
// 爆発クラス
phina.define('Explosion', {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('explosion-sheet', GRID_SIZE, GRID_SIZE);
    // アニメーション後に削除
    this.tweener.wait(100)
                .set({frameIndex: 1})
                .wait(100)
                .call(function() {
                  this.remove()
                }, this)
                .play();
  },
});
// スコアクラス 
phina.define('Score', {
  // Labelを継承
  superClass: 'Label',
  // 初期化
  init: function(num) {
    // 親クラスの初期化
    this.superInit();
    this.score = num;
    this.text = this.score;
    //
    this.fill = 'lime';
    // 1秒後に削除
    this.tweener.wait(1000).call(function() {
      this.remove();
    }, this);
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
});