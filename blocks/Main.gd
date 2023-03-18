extends Node2D

# 定数
const BLOCK_SIZE = 40
const BLOCK_COLS = 10
const BLOCK_ROWS = 20
const BLOCK_TYPE = 7
const TOP_Y = 0
const BOTTOM_Y = 20
const EDGE_LEFT = 2
const EDGE_RIGHT = 13
const INTERVAL = 0.5
const DURATION = 0.25

# ブロック(7種)の配置情報
const BLOCK_LAYOUT = [
    [Vector2(0, 0), Vector2(0, -1), Vector2(0, -2), Vector2(0, 1)],
    [Vector2(0, 0), Vector2(0, -1), Vector2(0, 1), Vector2(1, 1)],
    [Vector2(0, 0), Vector2(0, -1), Vector2(0, 1), Vector2(-1, 1)],
    [Vector2(0, 0), Vector2(0, -1), Vector2(-1, -1), Vector2(1, 0)],
    [Vector2(0, 0), Vector2(0, -1), Vector2(1, -1), Vector2(-1, 0)],
    [Vector2(0, 0), Vector2(1, 0), Vector2(-1, 0), Vector2(0, -1)],
    [Vector2(0, 0), Vector2(0, -1), Vector2(1, -1), Vector2(1, 0)]]

# キー用配列
const KEY_ARRAY = [
    ["ui_left", Vector2.LEFT],
    ["ui_right", Vector2.RIGHT]]

# シーン
const Block: PackedScene = preload("res://Block.tscn")

# 変数
var prev_time: float = 0
var cur_time: float = 0
var interval: float = INTERVAL
var remove_line: Array = []

# ノード
onready var dynamic_layer: CanvasLayer = get_node("DynamicLayer")
onready var static_layer: CanvasLayer = get_node("StaticLayer")
onready var dummy_layer: CanvasLayer = get_node("DummyLayer")

# 初期化処理
func _ready() -> void:
    # ブロック作成
    _create_block()

# 毎フレーム処理
func _process(delta) -> void:
    cur_time += delta

    # 一定時間毎にブロック落下
    if (cur_time - prev_time) > interval:
        _move_block_y()
        prev_time = cur_time
 
    # 落下速度加速
    _move_block_y_fast()
    # 左右移動
    _move_block_x()
    # 回転
    _rotate_block()

# 落下ブロック作成
func _create_block() -> void:
    # 種類をランダムに決める
    randomize()
    var type: int = randi() % BLOCK_TYPE
    # 落下ブロック作成
    for i in range(4):
        var block: Block = Block.instance()
        block.type = type
        # フレームインデックス設定
        block.get_node("Sprite").frame = type
        dynamic_layer.add_child(block)
  
    var dynamic: Array = dynamic_layer.get_children()
    # 中心ブロック
    var org_block: Block = dynamic.front()
    org_block.position.x = get_viewport_rect().size.x / 2
    org_block.position.y = 0
    # 配置情報データをもとにブロックを配置
    for block in dynamic:
        var i: int = block.get_index()
        block.position = org_block.position + BLOCK_LAYOUT[type][i] * BLOCK_SIZE
        block.index_pos = _coord_to_index(block.position)
    
# ブロック左右移動
func _move_block_x() -> void:
    # 配列ループ
    for item in KEY_ARRAY:
        # キー入力チェック
        if Input.is_action_just_pressed(item[0]):
            # 移動
            _move_block(item[1])
            # 両端チェックと固定ブロックとの当たり判定
            if _hit_edge() or _hit_static():
                # ブロックを戻す
                _move_block(item[1] * -1)
      
# ブロック落下処理
func _move_block_y() -> void:
    # 1ブロック分落下
    _move_block(Vector2.DOWN)
    # 画面下到達か固定ブロックにヒット
    if _hit_bottom() or _hit_static():
        # ブロックを戻す
        _move_block(Vector2.UP)
        # 固定ブロックへ追加
        _dynamic_to_static()
        # 画面上到達チェック
        if _hit_top():
            # 画面ポーズ
            get_tree().paused = true
            # ブロックをグレイスケール化
            _greyscale_block(0)
        # 削除可能ラインチェック
        _check_remove_line()

# ブロック移動処理
func _move_block(vec: Vector2) -> void:
    for block in dynamic_layer.get_children():
        block.position += vec * BLOCK_SIZE
        block.index_pos += vec

# ブロック加速落下処理
func _move_block_y_fast() -> void:
    # 下キーで落下スピードアップ
    if Input.is_action_pressed("ui_down"):
        interval = INTERVAL * 0.1
    # 下キー離しで元のスピード
    if Input.is_action_just_released("ui_down"):
        interval = INTERVAL

# ブロック回転処理
func _rotate_block() -> void:
    # 上キー
    if Input.is_action_just_pressed("ui_up"):
        var dynamic: Array = dynamic_layer.get_children()
        # 度からラジアンへ変換
        var angle = deg2rad(90)
        # 回転の原点
        var point: Vector2 = dynamic.front().position
        # 原点を中心に回転後の座標を求める
        for block in dynamic:
            # 90度回転
            block.position = point + (block.position - point).rotated(angle)
            block.index_pos = _coord_to_index(block.position)
        # 両端と固定ブロックと底との当たり判定
        if _hit_edge() or _hit_static() or _hit_bottom():
            # 回転を戻す
            for block in dynamic:
                block.position = point + (block.position - point).rotated(-1 * angle)
                block.index_pos = _coord_to_index(block.position)

# 削除可能ラインチェック
func _check_remove_line() -> void:
    # 上から走査
    for i in BLOCK_ROWS:
        var count: int = 0
        # 固定ブロックに対して
        for block in static_layer.get_children():
            # 走査ライン上にあればカウント
            if block.index_pos.y == i:
                count += 1
        # 10個あれば削除対象ラインとして登録
        if count == BLOCK_COLS:
            remove_line.append(i)
    # 削除対象ラインがあれば
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
            if block.index_pos.y == line:
                # 削除マーク
                block.mark = "remove"
            # 削除ラインより上のブロックに落下回数カウント
            if block.index_pos.y < line:
                block.drop_count += 1
    # 消去アニメーション用ダミー作成
    for block in sta:
        if block.mark == "remove":
            var dummy = Block.instance()
            dummy.position = block.position
            dummy.get_node("Sprite").frame = block.get_node("Sprite").frame
            dummy_layer.add_child(dummy)
    # ブロック削除
    for block in sta:
        if block.mark == "remove":
            static_layer.remove_child(block)
            block.queue_free()
    # ダミーをTweenでアニメーション
    var tween: SceneTreeTween = get_tree().create_tween()
    tween.set_parallel(true)
    # 縦方向に縮小
    for dummy in dummy_layer.get_children():
        tween.tween_property(dummy, "scale", Vector2(1, 0), DURATION)
    tween.set_parallel(false)
    tween.tween_callback(self, "_after_remove")

# ブロック削除後処理
func _after_remove():
    remove_line.clear()
    # 固定ブロック落下
    _drop_block()

# 固定ブロック落下処理
func _drop_block() -> void:
    for block in static_layer.get_children():
        if block.drop_count > 0:
            block.position += Vector2.DOWN * block.drop_count * BLOCK_SIZE
            block.index_pos = _coord_to_index(block.position)
            block.drop_count = 0
    # 落下ブロック作成
    _create_block()

# 画面下到達チェック
func _hit_bottom() -> bool:
    for block in dynamic_layer.get_children():
        if block.index_pos.y == BOTTOM_Y:
            return true
    return false

# 画面上到達チェック
func _hit_top() -> bool:
    for block in static_layer.get_children():
        if block.index_pos.y == TOP_Y:
            return true
    return false

# 両端チェック
func _hit_edge() -> bool:
    for block in dynamic_layer.get_children():
        if (block.index_pos.x == EDGE_LEFT) or (block.index_pos.x == EDGE_RIGHT):
            return true
    return false

# 固定ブロックとの当たり判定
func _hit_static() -> bool:
    for block in dynamic_layer.get_children():
        for target in static_layer.get_children():
           # 位置が一致したら
            if block.index_pos == target.index_pos:
                return true
    return false
         
# 移動ブロックから固定ブロックへの変更処理
func _dynamic_to_static() -> void:
    # グループ間の移動
    for block in dynamic_layer.get_children():
        dynamic_layer.remove_child(block)
        static_layer.add_child(block)

# ブロックをグレイスケール化
func _greyscale_block(num: int):
    for block in static_layer.get_children():
        if block.index_pos.y == num:
            print("a")
            block.get_node("Sprite").frame = 0
        
    num += 1
    yield(get_tree().create_timer(0.2), "timeout")
    print(num)
    _greyscale_block(num)

# 座標値からインデックス値へ変換
func _coord_to_index(pos: Vector2) -> Vector2:
    var x = int(pos.x / BLOCK_SIZE)
    var y = int(pos.y / BLOCK_SIZE)
    return Vector2(x, y)
