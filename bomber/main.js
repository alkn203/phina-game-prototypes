// グローバルに展開
phina.globalize();
// スプライトシート
var SPRITE_SHEET = {
  "tomapiko_ss": {
    // フレーム情報
    "frame": {
      // 1フレームの画像サイズ（横）
      "width": 64,
      // 1フレームの画像サイズ（縦）
      "height": 64,
      // フレーム数（横）
      "cols": 6,
      // フレーム数（縦）
      "rows": 3,
    },
    // アニメーション情報
    "animations": {
      // アニメーション名
      "left": {
        // フレーム番号範囲
        "frames": [12,13,14],
        // 次のアニメーション
        "next": "left",
        // アニメーション間隔
        "frequency": 4,
      },
      "right": { 
        "frames": [15,16,17], 
        "next": "right", 
        "frequency": 4, 
      },
      "up": { 
        "frames": [9,10,11], 
        "next": "up", 
        "frequency": 4, 
      },
      "down": { 
        "frames": [6,7,8], 
        "next": "down",
        "frequency": 4,
      },
      "defeat": { 
        "frames": [4,5], 
        "frequency": 8,
      },
    }
  },
  // 爆弾
  "bombs": {
    "frame": {
      "width": 64,
      "height": 64,
      "cols": 2,
      "rows": 1,
    },
    "animations": {
      "fire": {
        "frames": [0,1],
        "next": "fire",
        "frequency": 4,
      },
    }
  },
  // 爆発
  "explosions": {
    "frame": {
      "width": 64,
      "height": 64,
      "cols": 9,
      "rows": 1,
    },
    "animations": {
      // 中心
      "center": {
        "frames": [0,1,2],
        "frequency": 4,
      },
      // 途中
      "middle": {
        "frames": [3,4,5],
        "frequency": 4,
      },
      // 端
      "edge": {
        "frames": [6,7,8],
        "frequency": 4,
      },
    }
  },
};
// アセット
var ASSETS = {
  // 画像
  image: {
    'tile': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/bomber/assets/tile.png',
    'bombs': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/bomber/assets/bombs.png',
    'explosions': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/bomber/assets/explosions.png',
    'tomapiko': 'https://cdn.jsdelivr.net/gh/phinajs/phina.js@develop/assets/images/tomapiko_ss.png',
    'enemy1': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/bomber/assets/enemy1.png',
    'enemy2': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@main/bomber/assets/enemy2.png',
  },
  // スプライトシート
  spritesheet: SPRITE_SHEET
};
// 定数
var TILE_SIZE = 64;
var TILE_HALF = TILE_SIZE / 2;
var TILE_NONE = 0;
var TILE_WALL = 1;
var TILE_BLOCK = 2;
var BLOCK_FRAME = 2;
var BLOCK_EXP_FRAME = 3;
var PADDING = 16;
var PLAYER_SPEED = 4;

// キー方向配列
var KEY_DIR_ARRAY = [
  ['left', Vector2(-1, 0)],
  ['right', Vector2(1, 0)],
  ['up', Vector2(0, -1)],
  ['down', Vector2(0, 1)]];
// 爆風方向配列
var DIR_ARRAY = [Vector2(-1, 0), Vector2(1, 0), Vector2(0, -1), Vector2(0, 1)];
// ステージデータ
var STAGE_DATA = [
  {
    // ステージ1
    // マップデータ
    map: [
      [1,1,1,1,1,1,1,1,1,1],
      [1,0,0,2,0,0,2,0,0,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,2,0,2,0,0,2,0,2,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,0,0,2,0,0,2,0,0,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,2,0,2,0,0,2,0,2,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,0,0,2,0,0,2,0,0,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,2,0,2,0,0,2,0,2,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,0,0,2,0,0,2,0,0,1],
      [1,1,1,1,1,1,1,1,1,1]],
    // プレイヤーの位置データ
    playerPos: Vector2(1, 1),
  },
];
/*
 * メインシーン
 */
phina.define("MainScene", {
  // 継承
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit();
    // マップクラス
    var map = phina.util.Map({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      imageName: 'tile',
      mapData: STAGE_DATA[0].map,
    }).addChildTo(this);
    // 爆弾グループ    
    this.bombGroup = DisplayElement().addChildTo(this);
    // 爆発グループ
    this.explosionGroup = DisplayElement().addChildTo(this);
    // 敵グループ
    this.enemyGroup = DisplayElement().addChildTo(this);
    // プレイヤー配置
    this.player = Player().addChildTo(this);
    // コライダー表示
    this.player.collider.show();
    this.locateObject(this.player, STAGE_DATA[0].playerPos);
    // タイルにコライダー設定
    map.children.each(function(tile, i) {
      if (map._mapData[i] > 0) {
        tile.collider.show();
      }
    });
    
    this.map = map;
  },
  // オブジェクト配置用メソッド
  locateObject: function(obj, pos) {
    obj.tilePos = pos;
    obj.x = pos.x * TILE_SIZE + TILE_HALF;
    obj.y = pos.y * TILE_SIZE + TILE_HALF;
  },
  // 毎フレーム処理  
  update: function(app) {
    // 敵の当たり判定関係処理
    //this.hitTestEnemy1Static();
    //this.hitTestEnemy1Bomb();
    //this.hitTestEnemyExplosion();
    //
    //if (this.player.defeated) return;    
    // プレイヤー関係処理
    this.checkPlayerMove(app);
    this.setBomb(app);
    // プレイヤーがやられたら
    if (this.hitTestPlayerExplosion()) {
      // イベント発火
      this.player.flare('defeat');  
    }
  },
  // 移動チェック
  checkPlayerMove: function(app) {
    var player = this.player;
    var collider = this.player.collider;
    var self = this;
    var key = app.keyboard;
    // 移動判定
    KEY_DIR_ARRAY.each(function(elem) {
      var keyDir = elem[0];
      var dir = elem[1];
      // 次の移動量
      var vec = Vector2.mul(dir, player.speed);
      // キーが離れたらアニメーションストップ
      if (key.getKeyUp(keyDir)) {
        player.anim.gotoAndStop(player.anim.currentAnimationName);
        return;
      }
      // キー入力チェック
      if (key.getKey(keyDir)) {
        // アニメーション変更
        player.anim.gotoAndPlay(keyDir);
        // 次の移動先矩形
        if (vec.x !== 0) {
          collider.offset(vec.x, 0);
          //
          if (self.hitTestPlayerStatic()) {
            return;
          }
          // 爆弾との当たり判定
          if (self.hitTestPlayerBomb()) {
            return;
          }
        }

        if (vec.y !== 0) {
          collider.offset(0, vec.y);
          if (self.hitTestPlayerStatic()) {
            return;
          }
          // 爆弾との当たり判定
          if (self.hitTestPlayerBomb()) {
            return;
          }
        }
        // プレイヤー移動
        player.moveBy(vec.x, vec.y);
      }
    });
  },
  // 静的タイルとの当たり判定
  hitTestPlayerStatic: function() {
    var player = this.player;
    var map = this.map;
    var result = false;
    //
    map.children.some(function(tile, i) {
      //
      if (map._mapData[i] > 0) {
        if (player.collider.hitTest(tile.collider)) {
          result = true;
          return true;
        }
      }
    });
    return result;
  },
  // プレイヤーと敵との当たり判定
  hitTestPlayerEnemy: function() {
    var player = this.player;
    var result = false;
    
    this.enemyGroup.children.some(function(enemy) {
      // 当たり判定がある場合
      if (!enemy.defeated && player.hitTestElement(enemy)) {
        result = true;
        return true;
      }
    });
    return result;
  },
  //
  hitTestPlayerBomb: function() {
    var player = this.player;
    var result = false;
    
    this.bombGroup.children.some(function(bomb) {
      //
      if (player.collider.hitTest(bomb.collider)) {
        console.log(1)
        //
        result = bomb.isPlayerOn ? false : true;
        return true;
      }
      else {
        bomb.isPlayerOn = false;
      }
    });
    return result;
  },
  // プレイヤーと爆発との当たり判定
  hitTestPlayerExplosion: function() {
    var player = this.player;
    var result = false;
    
    this.explosionGroup.children.some(function(explosion) {
      // 当たり判定がある場合
      if (player.hitTestElement(explosion)) {
        result = true;
        return true;
      }
    });
    return result;
  },
  // 爆弾設置
  setBomb: function(app) {
    var player = this.player;
    var key = app.keyboard;
    var self = this;
    //
    if (key.getKeyUp('Z')) {
      var bomb = Bomb(1).addChildTo(this.bombGroup);
      // 配置がズレないようにインデックス値に変換
      var i = Math.floor(player.x / TILE_SIZE);
      var j = Math.floor(player.y / TILE_SIZE);
      this.locateObject(bomb, Vector2(i, j));
      // explodeイベント登録
      bomb.on('explode', function() {
        //
        var pos = bomb.tilePos;
        var power = bomb.power;
        //
        bomb.remove();
        //
        var explodeCount = 1;
        // 爆発の回転方向
        var rot = 0;
        // 中心の爆発
        var explosion = Explosion('center', rot);
        explosion.addChildTo(self.explosionGroup);
        self.locateObject(explosion, pos);
        // 四方向ループ
        DIR_ARRAY.each(function(dir) {
          // 爆発のグラフィック回転方向セット
          if (dir.x === 1) {
            rot = 90;
          }
          if (dir.x === -1) {
            rot = 270;
          }
          if (dir.y === 1) {
            rot = 180;
          }
          if (dir.y === -1) {
            rot = 0;
          }
          //
          var nextPos = Vector2.add(pos, dir);
          // 爆発処理
          self.explodeNext(nextPos, dir, rot, power, explodeCount);  
        });
      });
    }
  },
  // 爆発処理
  explodeNext: function(pos, dir, rot, power, explodeCount) {
    // 指定した位置のタイルをチェック
    var tile = this.map.checkTileByIndex(pos.x, pos.y);
    // 壁ならストップ
    if (tile === TILE_WALL) {
      return;
    }
    // ブロックなら壊してストップ
    if (tile === TILE_BLOCK) {
      // タイルを入れ替える
      this.map.clear();
      this.map.setTileByIndex(pos.x, pos.y, TILE_NONE);
      // 破壊エフェクト
      var block = Block().addChildTo(this);
      this.locateObject(block, pos);
      block.disable();
      return;
    }
    // 指定した位置にある爆弾を得る
    var bomb = this.getBomb(pos);
    // 爆弾があれば誘爆
    if (bomb) {
      bomb.flare('explode');
      return;
    }
    /// 爆発の端
    if (power === explodeCount) {
      var edge = Explosion('edge', rot);
      edge.addChildTo(this.explosionGroup);
      this.locateObject(edge, pos);
      return;
    }
    // カウントアップ
    explodeCount++;
    // 途中の爆発
    var middle = Explosion('middle', rot);
    middle.addChildTo(this.explosionGroup);
    this.locateObject(middle, pos);
    //
    var nextPos = Vector2.add(pos, dir);
    // 同方向に１マス進めて再帰呼び出し
    this.explodeNext(nextPos, dir, rot, power, explodeCount);
  },
  // 敵１とオブジェクトとの当たり判定
  hitTestEnemy1Static: function() {
    var self = this;
    
    this.enemyGroup.children.each(function(enemy) {
      self.staticGroup.children.each(function(obj) {
        // 次の移動先矩形
        var rx = enemy.left + enemy.vx;
        var rect = Rect(rx, enemy.top, enemy.width, enemy.height);
        // 当たり判定がある場合
        if (Collision.testRectRect(enemy, obj)) {
          // 速度反転
          enemy.vx *= -1
        }
      });
    });
  },
  // 敵１と爆弾との当たり判定
  hitTestEnemy1Bomb: function() {
    var self = this;
    
    this.enemyGroup.children.each(function(enemy) {
      self.bombGroup.children.each(function(bomb) {
        // 次の移動先矩形
        var rx = enemy.left + enemy.vx;
        var rect = Rect(rx, enemy.top, enemy.width, enemy.height);
        // 当たり判定がある場合
        if (Collision.testRectRect(enemy, bomb)) {
          // 速度反転
          enemy.vx *= -1
        }
      });
    });
  },
  // 敵と爆発との当たり判定
  hitTestEnemyExplosion: function() {
    var self = this;
    
    this.enemyGroup.children.each(function(enemy) {
      self.explosionGroup.children.each(function(explosion) {
        // まだやられてなく当たり判定がある場合
        if (!enemy.defeated && enemy.hitTestElement(explosion)) {
            // やられイベント発火
            enemy.flare('defeat');  
        }
      });
    });
  },
　// 指定位置に爆弾があれば返す
  getBomb: function(pos) {
    var result = null;
    
    this.bombGroup.children.some(function(bomb) {
      if (bomb.tilePos.equals(pos)) {
        result = bomb;
        return true;
      }
    });
    return result;
  },
});
/*
 * プレイヤークラス
 */
phina.define("Player", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('tomapiko', TILE_SIZE, TILE_SIZE);
    // スプライトにフレームアニメーションをアタッチ
    this.anim = FrameAnimation('tomapiko_ss').attachTo(this);
    // アニメーションを指定
    this.anim.gotoAndStop('right');
    //
    this.collider.setSize(TILE_SIZE - PADDING, TILE_SIZE - PADDING);
    // 移動速度
    this.speed = PLAYER_SPEED;
    //
    this.defeated = false;
    // やられイベント
    this.one('defeat', function() {
      this.defeated = true;
      this.anim.gotoAndPlay('defeat');
    }, this);
  },
});
/*
 * 敵1クラス
 */
phina.define("Enemy1", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('enemy1', GRID_SIZE, GRID_SIZE);
    // 移動速度
    this.vx = -2;
    //
    this.defeated = false;
    // やられイベント
    this.one('defeat', function() {
      this.defeated = true;
      // アニメーション
      this.tweener.clear()
                  .set({frameIndex: 2})
                  .wait(1500)
                  .call(function() {
                    this.remove();
                  }, this);
    }, this);
  },
  //
  update: function() {
    if (this.defeated) return;
    // 移動
    this.moveBy(this.vx, 0);
    // 目の向き判定
    this.frameIndex = this.vx < 0 ? 0 : 1;
  },
});
/*
 * ブロッククラス
 */
phina.define("Block", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('tile', TILE_SIZE, TILE_SIZE);
    // フレームインデックス指定
    this.frameIndex = BLOCK_FRAME;
  },
  // 破壊エフェクト
  disable: function() {
    this.frameIndex = BLOCK_EXP_FRAME;
    // フェードアウトして削除
    this.tweener.fadeOut(200)
                .call(function() {
                  this.remove();
                }, this).play();
  },
});
/*
 * 爆弾クラス
 */
phina.define("Bomb", {
  // 継承
  superClass: 'Sprite',
  // コンストラク
  init: function(power) {
    // 親クラス初期化
    this.superInit('bombs', TILE_SIZE, TILE_SIZE);
    // フレームアニメーション指定
    this.anim = FrameAnimation('bombs').attachTo(this);
    this.anim.gotoAndPlay('fire');
    // 爆発範囲
    this.power = power;
    //
    this.isPlayerOn = true;
    // 3秒後に爆発
    this.tweener.wait(3000)
                .call(function() {
                  this.flare('explode');
                }, this).play();
  },
});
/*
 * 爆発クラス
 */
phina.define("Explosion", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function(type, angle) {
    // 親クラス初期化
    this.superInit('explosions', TILE_SIZE, TILE_SIZE);
    // フレームアニメーション指定
    this.anim = FrameAnimation('explosions').attachTo(this);
    // アニメーションタイプ
    this.anim.gotoAndPlay(type);
    // 角度
    this.rotation = angle;
  },
  // 毎フレーム更新
  update: function() {
    // フレームアニメーションが終わったら削除
    if (this.anim.finished) {
      this.remove();
    }
  },
});
/*
 * メイン処理
 */
phina.main(function() {
  // アプリケーションを生成
  var app = GameApp({
    // MainScene から開始
    //startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  // 実行
  app.run();
});