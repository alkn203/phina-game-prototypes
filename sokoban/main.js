// グローバルに展開
phina.globalize();
// アセット
const ASSETS = {
  // 画像
  image: {
    'tile': 'assets/sokoban.png',
    'tomapiko': 'assets/tomapiko_ss.png',
  },
};
// 定数
const TILE_SIZE = 64;
const TILE_OFFSET = TILE_SIZE / 2;
const TILE_WALL = 3;
const TILE_BAGGAGE = 4;
const TILE_BAGGAGE_ON = 5;
const TILE_SPOT = 2;
// ステージデータ
const STAGE_DATA = [
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
    // 荷物の位置データ
    baggagePos: [
      Vector2(4, 6),
      Vector2(4, 7)],
    // プレイヤーの位置データ
    playerPos: Vector2(4, 8),
  },
];
// キー方向配列
var KEY_DIR_ARRAY = [
  ['left', Vector2.LEFT],
  ['right', Vector2.RIGHT],
  ['up', Vector2.UP],
  ['down', Vector2.DOWN]];
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
    }).addChildTo(this);
    // プレイヤー作成・配置
    const player = Player().addChildTo(this);
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
    location.each(function(pos) {
      // 荷物作成
      const baggage = Baggage().addChildTo(this.baggageGroup);
      this.locateObject(baggage, pos);
    }, this);
  },
  // オブジェクト配置用メソッド
  locateObject: function(obj, pos) {
    obj.tilePos = pos;
    obj.position = Vector2.mul(pos, TILE_SIZE).add(Vector2(TILE_OFFSET, TILE_OFFSET));
  },
  // 毎フレーム処理  
  update: function(app) {
    this.checkCanMove(app);
  },
  // 移動チェック
  checkCanMove: function(app) {
    const player = this.player;
    const map = this.map;
    let vec = Vector2.ZERO;
    
    const key = app.keyboard;
    // 上下左右移動判定
    KEY_DIR_ARRAY.each(function(elem) {
      if (key.getKeyUp(elem[0])) {
        vec = elem[1];
      }
    }, this)

    // 移動がなければ
    if (vec.length() === 0) {
      return;
    }
    // 移動先の位置
    const pos = Vector2.add(player.tilePos, vec);
    
    // 壁の場合
    if (map.checkTileByVec(pos) === TILE_WALL) {
      return;
    }
    // 隣に荷物があるかチェック
    var baggage = this.getBaggage(pos);
    // 荷物がある場合
    if (baggage) {
      // さらに１つ先をチェック
      const bpos = Vector2.add(baggage.tilePos, vec);
      // 壁なら移動不可
      if (map.checkTileByVec(bpos) === TILE_WALL) {
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
    let result = true;
    
    this.baggageGroup.children.each(function(baggage) {
      // 荷物がスポット上にあれば画像変更
      if (this.map.checkTileByVec(baggage.tilePos) === TILE_SPOT) {
        baggage.setFrameIndex(TILE_BAGGAGE_ON);
      }
      else {
        baggage.setFrameIndex(TILE_BAGGAGE);
      }
    }, this);
    
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
    let result = null;
    
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
    this.tilePos = Vector2.ZERO;
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
    this.tilePos = Vector2.ZERO;
  },
});
/*
 * メイン処理
 */
phina.main(function() {
  // アプリケーションを生成
  const app = GameApp({
    // MainScene から開始
    startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  // 実行
  app.run();
});
