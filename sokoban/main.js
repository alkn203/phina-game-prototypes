// グローバルに展開
phina.globalize();
// アセット
var ASSETS = {
  // 画像
  image: {
    'tile': 'https://cdn.jsdelivr.net/gh/alkn203/phina-game-prototypes@master/sokoban/assets/sokoban.png',
    'tomapiko': 'https://cdn.jsdelivr.net/gh/phinajs/phina.js@develop/assets/images/tomapiko_ss.png',
  },
};
// 定数
var TILE_SIZE = 64;
var TILE_BAGGAGE = 4;
var TILE_BAGGAGE_ON = 5;
var TILE_SPOT = 2;
// ステージデータ
var STAGE_DATA = [
  {
    // ステージ1
    // マップデータ
    map: [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,3,3,3,3,3,0],
      [0,3,3,3,3,1,1,1,3,0],
      [0,3,2,1,1,1,2,1,3,0],
      [0,3,1,3,1,3,1,3,3,0],
      [0,3,1,1,1,1,1,3,0,0],
      [0,3,3,3,3,3,3,3,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0]],
    // マップ当たり判定データ
    collision: [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,1,0],
      [0,1,1,1,1,0,0,0,1,0],
      [0,1,0,0,0,0,0,0,1,0],
      [0,1,0,1,0,1,0,1,1,0],
      [0,1,0,0,0,0,0,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0]],
    // 荷物の位置データ
    baggagePos: [
      Vector2(4, 6),
      Vector2(4, 7)],
    // プレイヤーの位置データ
    playerPos: Vector2(4, 8),
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
    this.map = phina.util.Map({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      imageName: 'tile',
      mapData: STAGE_DATA[0].map,
      collisionData: STAGE_DATA[0].collision,
    }).addChildTo(this);
    // プレイヤー作成・配置
    var player = Player().addChildTo(this);
    player.tilePos = STAGE_DATA[0].playerPos;
    this.locateObject(player, player.tilePos);
    // 荷物グループ
    this.baggageGroup = DisplayElement().addChildTo(this);
    // 荷物配置
    this.locateBaggage(STAGE_DATA[0].baggagePos);
    // 参照用
    this.player = player;
  },
  // 荷物配置
  locateBaggage: function(location) {
    var self = this;
    
    location.each(function(pos) {
      // 荷物作成
      var baggage = Baggage().addChildTo(self.baggageGroup);
      self.locateObject(baggage, pos);
    });
  },
  // オブジェクト配置用メソッド
  locateObject: function(obj, pos) {
    obj.tilePos = pos;
    obj.x = pos.x * TILE_SIZE + TILE_SIZE / 2;
    obj.y = pos.y * TILE_SIZE + TILE_SIZE / 2;
  },
  // 毎フレーム処理  
  update: function(app) {
    this.checkCanMove(app);
  },
  // 移動チェック
  checkCanMove: function(app) {
    var player = this.player;
    var map = this.map;
    var vec = Vector2(0, 0);
    
    var key = app.keyboard;
    // 上下左右移動判定
    if (key.getKeyUp('left')) {
      vec.x = -1;
    }
    if (key.getKeyUp('right')) {
      vec.x = 1;
    }
    if (key.getKeyUp('up')) {
      vec.y = -1;
    }
    if (key.getKeyUp('down')) {
      vec.y = 1;
    }
    // 移動がなければ
    if (vec.length() === 0) {
      return;
    }
    // 移動先の位置
    var pos = Vector2.add(player.tilePos, vec);
    // 壁の場合
    if (map.hitTestByIndex(pos.x, pos.y)) {
      return;
    }
    // 隣に荷物があるかチェック
    var baggage = this.getBaggage(pos);
    // 荷物がある場合
    if (baggage) {
      // さらに１つ先をチェック
      var bpos = Vector2.add(baggage.tilePos, vec);
      // 壁なら移動不可
      if (map.hitTestByIndex(bpos.x, bpos.y)) {
        return;
      }
      // 荷物なら移動不可
      if (this.getBaggage(bpos)) {
        return;
      }
      // 荷物位置更新
      this.locateObject(baggage, bpos);
      // プレイヤー位置更新
      this.locateObject(player, pos);
      // 荷物がスポット上にあるかどうかチェック
      if (this.checkOnSpot()) {
        console.log('clear');
      }
    }
    // 移動先になにもない場合
    else {
      this.locateObject(player, pos);
    }
  },
  // 全てのスポットに荷物があるかチェック
  checkOnSpot: function() {
    var map = this.map;
    var result = true;
    
    this.baggageGroup.children.each(function(baggage) {
      var pos = baggage.tilePos;
      // 荷物がスポット上にあれば画像変更
      if (map.checkTileByIndex(pos.x, pos.y) === TILE_SPOT) {
        baggage.setFrameIndex(TILE_BAGGAGE_ON);
      }
      else {
        baggage.setFrameIndex(TILE_BAGGAGE);
      }
    });
    
    this.baggageGroup.children.some(function(baggage) {
      // 色が変わっていない荷物があればNG
      if (baggage.frameIndex !== TILE_BAGGAGE_ON) {
        result = false;
        return true;
      }
    });
    return result;
  },
  // 指定位置に荷物があれば返す
  getBaggage: function(pos) {
    var result = null;
    
    this.baggageGroup.children.some(function(baggage) {
      if (baggage.tilePos.equals(pos)){
        result = baggage;
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
    // マップ上のインデックスポジション
    this.tilePos = Vector2(0, 0);
  },
  //
});
/*
 * 荷物クラス
 */
phina.define("Baggage", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('tile', TILE_SIZE, TILE_SIZE);
    // フレームインデックス指定
    this.frameIndex = TILE_BAGGAGE;
    this.tilePos = Vector2(0, 0);
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