phina.globalize();
// 定数
const BLOCK_SIZE = 40
const BLOCK_COLS = 10
const BLOCK_ROWS = 20
const BLOCK_TYPE = 7
const BOTTOM_Y = 20
const EDGE_LEFT = 2
const EDGE_RIGHT = 13
const INTERVAL = 0.5
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
  [Vector2(0, 0), Vector2(0, -1), Vector2(1, -1), Vector2(1, 0)]]

// キー用配列
const KEY_ARRAY = [
  ["left", Vector2.LEFT],
  ["right", Vector2.RIGHT]]
// メインシーン
phina.define('MainScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit();
    // 背景色
    this.backgroundColor = 'gray';
    // グループ 
    this.dynamicGroup = DisplayElement().addChildTo(this);
    // 変数
    this.prevTime = 0;
    this.curTime = 0;
    this.interval = INTERVAL;
    this.removeLine = [];
    // ブロック作成
    this.createBlock();
  },
  // ブロック作成関数
  createBlock: function() {
    // 種類をランダムに決める
    const type = Random.randint(0, 7);
    // 落下ブロック作成
    (4).times(function() {
      const block = Block().addChildTo(this.dynamicGroup);
      block.type = type;
      // フレームインデックス設定
      block.frameIndex = type;
    # 回転の原点
    var point: Vector2 = dynamic.front().position
    # 原点を中心に回転後の座標を求める
    for block in dynamic:
      # 90度回転
      block.position = point + (block.position - point).rotated(angle)
      block.tile_pos = tilemap.world_to_map(block.position)
    # 両端と固定ブロックと底との当たり判定
    if _hit_edge() or _hit_static() or _hit_bottom():
      # 回転を戻す
      for block in dynamic:
        block.position = point + (block.position - point).rotated(-1 * angle)
        block.tile_pos = tilemap.world_to_map(block.position)

# 削除可能ラインチェック
func _check_remove_line() -> void:
  # 上から走査
  for i in BLOCK_ROWS:
    var count: int = 0
    # 固定ブロックに対して
    for block in static_layer.get_children():
      # 走査ライン上にあればカウント
      if block.tile_pos.y == i:
        count += 1
        # 10個あれば削除対象ラインとして登録
        if count == BLOCK_COLS:
          remove_line.append(i)
  #
  if remove_line.size() > 0:
    _remove_block()
  else:
    _create_block()

# ブロック削除処理
func _remove_block() -> void:
  var sta: Array = static_layer.get_children()
  # 削除対象ラインに対して
  for line in remove_line:
    for block in sta:
      if block.tile_pos.y == line:
        # 削除マーク
        block.mark = "remove"
      # 削除ラインより上のブロックに落下回数カウント
      if block.tile_pos.y < line:
        block.drop_count += 1
  # ブロック削除
  for block in sta:
    if block.mark == "remove":
      static_layer.remove_child(block)
      block.queue_free()
  
  remove_line.clear()
  # 固定ブロック落下
  _drop_block()

# 固定ブロック落下処理
func _drop_block() -> void:
  for block in static_layer.get_children():
    if block.drop_count > 0:
      block.position += Vector2.DOWN * block.drop_count * BLOCK_SIZE
      block.tile_pos = tilemap.world_to_map(block.position)
      block.drop_count = 0
  # 落下ブロック作成
  _create_block()

# 画面下到達チェック
func _hit_bottom() -> bool:
  for block in dynamic_layer.get_children():
    if block.tile_pos.y == BOTTOM_Y:
      return true
  return false

# 両端チェック
func _hit_edge() -> bool:
  for block in dynamic_layer.get_children():
    if (block.tile_pos.x == EDGE_LEFT) or (block.tile_pos.x == EDGE_RIGHT):
      return true
  return false

# 固定ブロックとの当たり判定
func _hit_static() -> bool:
  for block in dynamic_layer.get_children():
    for target in static_layer.get_children():
      # 位置が一致したら
      if block.tile_pos == target.tile_pos:
        return true
  return false
       
# 移動ブロックから固定ブロックへの変更処理
func _dynamic_to_static() -> void:
  # グループ間の移動
  for block in dynamic_layer.get_children():
    dynamic_layer.remove_child(block)
    static_layer.add_child(block)  
    */
