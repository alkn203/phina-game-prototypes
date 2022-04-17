// グローバルに展開
phina.globalize();
// アセット
var ASSETS = {
  // 画像
  image: {
    'player': 'https://raw.githubusercontent.com/aidiary/pygame/master/invader/invader06/data/player.png',
    'shot': 'https://raw.githubusercontent.com/aidiary/pygame/master/invader/invader06/data/shot.png',
    'alien': 'https://raw.githubusercontent.com/aidiary/pygame/master/invader/invader06/data/alien.png',
    'beam': 'https://raw.githubusercontent.com/aidiary/pygame/master/invader/invader06/data/beam.png',
    'explosion': 'https://raw.githubusercontent.com/aidiary/pygame/master/invader/invader06/data/explosion.png',
  },
  // スプライトシート
  spritesheet: {
    'alien_ss':
    {
      "frame": {
        "width": 22,
        "height": 16,
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
        "width": 20,
        "height": 20,
        "cols": 16,
        "rows": 1,
      },
      // アニメーション
      "animations" : {
        "start": {
          "frames": Array.range(16),
          "next": "",
          "frequency": 1,
        },
      }
    },
  },
};
// 定数
var SCR_RECT = Rect(0, 0, 640, 960);
var PLAYER_SPEED = 5;
var SHOT_SPEED = 9;
var RELOAD_TIME = 50;
var ALIEN_NUM_X = 10;
var ALIEN_NUM_Y = 5;
var ALIEN_SPEED = 1000;
var GRID_WIDTH = SCR_RECT.width / 12;
var GRID_HIGHT = SCR_RECT.height / 16;
var OFFSET_X = GRID_WIDTH / 2;
var OFFSET_Y = GRID_HIGHT / 2;
var BEAM_SPEED = 2;
var PROB_BEAM = 0.0005;
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
    // グループ
    this.shotGroup = DisplayElement().addChildTo(this);
    var beamGroup = DisplayElement().addChildTo(this);
    var alienGroup = DisplayElement().addChildTo(this);
    this.explosionGroup = DisplayElement().addChildTo(this);
    // プレイヤー配置
    this.player = Player().addChildTo(this);
    // blendMode = 'lighter' で重なっている部分の描画を自然にする。以降も同様
    this.player.blendMode = 'lighter';
    // ショット間隔管理用
    this.prevTime = -RELOAD_TIME;
    // グリッド
    var gx = Grid(GRID_WIDTH * ALIEN_NUM_X, ALIEN_NUM_X);
    var gy = Grid(GRID_HIGHT * ALIEN_NUM_Y, ALIEN_NUM_Y);
    // Gridを利用してエイリアン配置
    Array.range(1, 11).each(function(spanX) {
      Array.range(0, 5).each(function(spanY) {
        var alien = Alien().addChildTo(alienGroup);
        alien.x = gx.span(spanX) + OFFSET_X;
        alien.y = gy.span(spanY) + OFFSET_Y;
        alien.blendMode = 'lighter';
        // 毎フレーム更新
        alien.update = function() {
          // ランダムな小数値を得る
          if (Random.random() < PROB_BEAM) {
            // ビーム作成
            Beam().addChildTo(beamGroup).setPosition(alien.x, alien.y).blendMode = 'lighter';
            // 画面外到達で消去
            if (alien.top > SCR_RECT.bottom) alien.remove();
          }
        };
      }); 
    });
    // エイリアン移動
    alienGroup.children.each(function(alien) {
      alien.tweener.clear()  
                   .by({x: -GRID_WIDTH}, ALIEN_SPEED)
                   .by({x: GRID_WIDTH * 2}, ALIEN_SPEED * 2)
                   .by({x: -GRID_WIDTH}, ALIEN_SPEED)
                   .setLoop(true);
    });
    // 参照用
    this.alienGroup = alienGroup;
    this.beamGroup = beamGroup;
  },
  // 毎フレーム処理
  update: function(app) {
    // 押された方向キーの情報を得る
    var dir = app.keyboard.getKeyDirection();
    // 左右移動
    if ((dir.x === -1 && dir.y === 0) || (dir.x === 1 && dir.y === 0)) {
      this.player.x += dir.x * PLAYER_SPEED;
    }
    // 画面はみ出し防止
    if (this.player.left < SCR_RECT.left) this.player.left = SCR_RECT.left;
    if (SCR_RECT.right < this.player.right) this.player.right = SCR_RECT.right;
    // スペースキーでミサイル発射
    if (app.keyboard.getKey('space')) {
      // 一定フレーム経過後なら
      if (app.frame - this.prevTime > RELOAD_TIME) {
        // 発射音再生
        SoundManager.play('shot');
        // プレイヤーの位置に表示
        Shot().addChildTo(this.shotGroup).setPosition(this.player.x, this.player.y).blendMode = 'lighter';
        this.prevTime = app.frame;
      }
    }
    
    var self = this;
    // ミサイルとエイリアンの当たり判定
    this.alienGroup.children.each(function(alien) {
      self.shotGroup.children.each(function(shot) {
        if (alien.hitTestElement(shot)) {
          SoundManager.play(`kill`);
          // 爆発
          Explosion().addChildTo(self.explosionGroup).setPosition(alien.x, alien.y).blendMode = 'lighter';
          shot.remove();
          alien.remove();
        }
      });  
    });
    if (this.alienGroup.children.length === 0) {
      this.exit();
    }
    // プレイヤーとビームの当たり判定
    this.beamGroup.children.each(function(beam) {
      if (beam.hitTestElement(self.player)) {
        SoundManager.play(`bomb`);
        // 爆発
        Explosion().addChildTo(self.explosionGroup).setPosition(self.player.x, self.player.y).blendMode = 'lighter';
        beam.remove();
        self.player.remove();
        // 1秒後に終了
        self.tweener.wait(1000).call(function() {self.exit()});
      }
    });
  },
});
// タイトルシーン
phina.define(`TitleScene`, {
  // DisplaySceneを継承
  superClass: 'DisplayScene',
  // 初期化
  init: function() {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'black';
    // タイトル配置
    Label({
      text: 'INVADER GAME',
      fontSize: 72,
      fill: 'red',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-4));

    Alien().addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));

    Label({
      text: 'PRESS SPACE KEY',
      fontSize: 36,
      fill: 'white',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(2));

    Label({
      text: '2016 made in phina.js',
      fontSize: 28,
      fill: 'white',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(4));
  },
  // 毎フレーム処理
  update: function(app) {
    // スペースキーでゲーム開始
    if (app.keyboard.getKeyUp('space')) this.exit();
  },
});
// ゲームオーバーシーン
phina.define(`ResultScene`, {
  // DisplaySceneを継承
  superClass: 'DisplayScene',
  // 初期化
  init: function() {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'black';
    // タイトル配置
    Label({
      text: 'GAME OVER',
      fontSize: 72,
      fill: 'red',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-4));

    Alien().addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-1));

    Label({
      text: 'PRESS SPACE KEY',
      fontSize: 36,
      fill: 'white',
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(2));
  },
  // 毎フレーム処理
  update: function(app) {
    // スペースキーでゲーム開始
    if (app.keyboard.getKeyUp('space')) this.exit();
  },
});
// プレイヤークラス
phina.define(`Player`, {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('player');
    // サイズ変更
    this.setSize(64, 64);
    // 初期位置
    this.x = SCR_RECT.width / 2;
    this.bottom = SCR_RECT.bottom;
  },
});
// ミサイルクラス
phina.define(`Shot`, {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('shot');
    // サイズ変更
    this.setSize(6, 60);
    // 上方向に移動
    this.physical.force(0, -SHOT_SPEED);
  },
  // 毎フレーム処理
  update: function() {
    // 画面外到達で消去
    if (this.bottom < SCR_RECT.top) this.remove();
  },
});
// エイリアンクラス
phina.define(`Alien`, {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('alien', 22, 16);
    // SpriteSheetをスプライトにアタッチ
    var anim = FrameAnimation('alien_ss').attachTo(this);
    // スプライトシートのサイズにフィットさせない
    anim.fit = false;
    //アニメーションを再生する
    anim.gotoAndPlay('loop');
    // サイズ変更
    this.setSize(22*2, 16*2);
  },
});
// ビームクラス
phina.define(`Beam`, {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('beam');
    // サイズ変更
    this.setSize(5*2, 20*2);
    // 下方向に移動
    this.physical.force(0, BEAM_SPEED);
  },
});
// 爆発クラス
phina.define(`Explosion`, {
  // Spriteを継承
  superClass: 'Sprite',
  // 初期化
  init: function() {
    // 親クラスの初期化
    this.superInit('explosion', 20, 20);
    // サイズ変更
    this.setSize(5*2, 20*2);
    // SpriteSheetをスプライトにアタッチ
    var anim = FrameAnimation('explosion_ss').attachTo(this);
    // スプライトシートのサイズにフィットさせない
    anim.fit = false;
    //アニメーションを再生する
    anim.gotoAndPlay('start');
    // サイズ変更
    this.setSize(20*2, 20*2);
    // 参照用
    this.anim = anim;
  },
  // 毎フレーム処理
  update: function() {
    // アニメーションが終わったら自身を消去
    if (this.anim.finished) this.remove();
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