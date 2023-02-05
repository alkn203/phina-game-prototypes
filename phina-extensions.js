phina.namespace(function() {
  /**
   * アタッチされたオブジェクトに指定されたターゲットの方向を常に向かせるアクセサリ
   * @class phina.accessory.Aim
   * @memberOf phina.accessory
   * @extends phina.accessory.Accessory
   *
   * @example
   *
   * var aim = phina.accessory.Aim().attachTo(enemy);
   * aim.aimTo(player);
   * 
   * Enemy().aim.aimTo(player);
   *
   * @param {object} [target] - アタッチ対象
   */
  phina.define('phina.accessory.Aim', {
    superClass: 'phina.accessory.Accessory',

    init: function(target) {
      this.superInit(target);
    },
    
    onattached: function() {

    },

    ondetached: function() {
      this.dest = null;
    },
    /**
     * アタッチ対象をセット
     * @instance
     * @memberof phina.accessory.Aim
     *
     * @param {object} obj - アタッチ対象
     */
    aimTo: function(obj) {
      this.dest = obj;
    },

    update: function() {
      if (!this.target) return;
      this.target.setRotation(this.getDegree());      
    },
    
    getDegree: function() {
      var vec = Vector2.sub(this.dest, this.target);
      return Math.radToDeg(Math.atan2(vec.y, vec.x)) + 90;
    }
  });

  phina.app.Element.prototype.getter('aim', function() {
    if (!this._aim) {
      this._aim = phina.accessory.Aim().attachTo(this);
    }
    return this._aim;
  });
});
phina.namespace(function() {
  /**
   * アタッチされたオブジェクトにコライダーを設定するアクセサリ
   * @class phina.accessory.Collider
   * @memberOf phina.accessory
   * @extends phina.accessory.Accessory
   *
   * @example
   *
   * var aim = phina.accessory.Aim().attachTo(enemy);
   * aim.aimTo(player);
   *
   * @param {object} [target] - アタッチ対象
   */
  phina.define('phina.accessory.Collider', {
    superClass: 'phina.accessory.Accessory',

    init: function(target) {
      this.superInit(target);
    },
    // アタッチされた時
    onattached: function() {
      if (!this._collider) {
        this._collider = RectangleShape({
          width: this.target.width,
          height: this.target.height,
          fill: null,
        }).addChildTo(this.target);
        
        this._collider.hide();
      }
    },

    ondetached: function() {
      if (this._collider) {
        this._collider.remove();
      }
    },
    /**
     * コライダーを表示する
     * @instance
     * @memberof phina.accessory.Collider
     *
     * @return {object} 自分自身
     */
    show: function() {
      this._collider.show();
      return this;        
    },
    /**
     * コライダーを非表示にする
     * @instance
     * @memberof phina.accessory.Collider
     *
     * @return {object} 自分自身
     */
    hide: function() {
      this._collider.hide();
      return this;        
    },
    /**
     * コライダーの位置（相対座標）を指定する
     * @instance
     * @memberof phina.accessory.Collider
     *
     * @param {number} x - x座標
     * @param {number} y - y座標
     * @return {object} 自分自身
     */
    offset: function(x, y) {
      this._collider.setPosition(x, y);
      return this;
    },
    /**
     * コライダーのサイズを指定する
     * @instance
     * @memberof phina.accessory.Collider
     *
     * @param {number} width - 横サイズ
     * @param {number} height - 縦サイズ
     * @return {object} 自分自身
     */
    setSize: function(width, height) {
      this._collider.setSize(width, height);
      return this;
    },
    /**
     * 他のコライダーとの当たり判定を行う
     * @instance
     * @memberof phina.accessory.Collider
     *
     * @param {object} collider - 対象のコライダー
     * @return {boolean} ヒットしたかどうか
     */
    hitTest: function(collider) {
      if (!this.target) return;
      // 絶対座標の矩形を計算      
      var rect = this.getAbsoluteRect();
      var rect2 = collider.getAbsoluteRect();
      // 矩形同士で判定
      return phina.geom.Collision.testRectRect(rect, rect2);
    },
    // Colliderの絶対座標の矩形
    getAbsoluteRect: function() {
      var x = this._collider.left + this.target.x;
      var y = this._collider.top + this.target.y;
      return  phina.geom.Rect(x, y, this._collider.width, this._collider.height);
    },
  });

  phina.app.Element.prototype.getter('collider', function() {
    if (!this._collider) {
      this._collider = phina.accessory.Collider().attachTo(this);
    }
    return this._collider;
  });
});
phina.namespace(function() {
  /**
   * アタッチされたオブジェクトグループをグリッド状に並べるアクセサリ
   * @class phina.accessory.GridLayout
   * @memberOf phina.accessory
   * @extends phina.accessory.Accessory
   *
   * @example
   *
   * var circleGroup = DisplayElement().addChildTo(this);
   *
   * (64).times(function(i) {
   *   CircleShape().addChildTo(circleGroup);
   * });
   * // グループにGridLayoutをアタッチ
   * var gl = phina.accessory.GridLayout().attachTo(circleGroup);
   *
   * @param {object} [options.target=null] - アタッチ対象
   * @param {number} [options.cellWidth=64] - グリッドの幅
   * @param {number} [options.cellHeight=64] - グリッドの高さ
   * @param {number} [options.offsetX=32] - x方向の位置
   * @param {number} [options.offsetY=32] - y方向の位置
   * @param {number} [options.maxPerLine=10] - x方向の折返し数
   */
  phina.define('phina.accessory.GridLayout', {
    superClass: 'phina.accessory.Accessory',

    init: function(options) {
      options = ({}).$safe(options || {}, phina.accessory.GridLayout.defaults);
      this.superInit(options.target);

      this.cellWidth = options.cellWidth;
      this.cellHeight = options.cellHeight;
      this.offsetX = options.offsetX;
      this.offsetY = options.offsetY;
      this.maxPerLine = options.maxPerLine;
      this.arrangement = 'horizontal'; // vertical
    },
    
    onattached: function() {
      this.reposition();  
    },
    /**
     * オブジェクを並び替える
     * @instance
     * @memberof phina.accessory.GridLayout
     */
    reposition: function() {
      var children = this.target.children;
  
      if (this.arrangement === 'horizontal') {
        children.each(function(child, i) {
          var xIndex = (i%this.maxPerLine);
          var yIndex = (i/this.maxPerLine)|0;
          var x = this.cellWidth*xIndex + this.offsetX;
          var y = this.cellHeight*yIndex + this.offsetY;
          child.setPosition(x, y);
        }, this);
      }
    },
    
    _static: {
      defaults: {
        target: null,
        cellWidth: 64,
        cellHeight: 64,
        offsetX: 32,
        offsetY: 32,
        maxPerLine: 10
      },
    }
  });
  
  phina.app.Element.prototype.getter('gridlayout', function() {
    if (!this._gridlayout) {
      this._gridlayout = phina.accessory.GridLayout().attachTo(this);
    }
    return this._gridlayout;
  });

});
phina.namespace(function() {
  /**
   * アタッチされたオブジェクトグループを円状に並べるアクセサリ
   * @class phina.accessory.RingLayout
   * @memberOf phina.accessory
   * @extends phina.accessory.Accessory
   *
   * @example
   *
   * var rectGroup = DisplayElement().addChildTo(this);
   *
   * (8).times(function(i) {
   *   RectangleShape().addChildTo(rectGroup);
   * });
   * // グループにRingLayoutをアタッチ
   * var rl = phina.accessory.RingLayout().attachTo(rectGroup);
   *
   * @param {object} [options.target=null] - アタッチ対象
   * @param {number} [options.radius=160] - 円の半径
   * @param {number} [options.offsetX=320] - x方向の位置
   * @param {number} [options.offsetY=480] - y方向の位置
   * @param {number} [options.ringRotation=0] - 回転
   * @param {number} [options.ringScaleX=1] - x方向の縮尺
   * @param {number} [options.ringScaleY=1] - y方向の縮尺
   */
  phina.define('phina.accessory.RingLayout', {
    superClass: 'phina.accessory.Accessory',

    init: function(options) {
      options = ({}).$safe(options || {}, phina.accessory.RingLayout.defaults);
      this.superInit(options.target);

      this.radius = options.radius;
      this.offsetX = options.offsetX;
      this.offsetY = options.offsetY;
      this.ringRotation = options.ringRotation;
      this.ringScaleX = options.ringScaleX;
      this.ringScaleY = options.ringScaleY;
    },
    
    onattached: function() {
      this.reposition();  
    }, 
    /**
     * オブジェクを並び替える
     * @instance
     * @memberof phina.accessory.RingLayout
     */
    reposition: function() {
      var children = this.target.children;
      var deg = 360 / children.length;

      children.each(function(child, i) {
        var rad = Math.degToRad(deg*i + this.ringRotation);
        var x = this.radius*this.ringScaleX*Math.cos(rad) + this.offsetX;
        var y = this.radius*this.ringScaleY*Math.sin(rad) + this.offsetY;
        child.setPosition(x, y);
      }, this);
    },

    _static: {
      defaults: {
        target: null,
        radius: 160,
        offsetX: 320,
        offsetY: 480,
        ringRotation: 0,
        ringScaleX: 1,
        ringScaleY: 1
      },
    }
  });

  phina.app.Element.prototype.getter('ringlayout', function() {
    if (!this._ringlayout) {
      this._ringlayout = phina.accessory.RingLayout().attachTo(this);
    }
    return this._ringlayout;
  });
});
phina.namespace(function() {
  /**
   * タイプされたように文字を表示するラベル
   * @class phina.display.TypedLabel
   * @memberOf phina.display
   * @extends phina.display.Label
   *
   * @example
   * 
   * phina.display.TypedLabel({
   *   fill: 'lime',
   *   typedText:'Hello phina.js',
   * }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
   *
   * @param {object} [options] - phina.display.Labelのoptionsと同じ
   * @param {string} [options.typedText=Hello] - 表示する文字
   * @param {number} [options.duration=1000] - 文字表示の時間間隔 ミリ秒
   */
  phina.define('phina.display.TypedLabel', {
    // Labelクラスを継承
    superClass: 'phina.display.Label',

    init: function(options) {
      options = ({}).$safe(options || {}, phina.display.TypedLabel.defaults);
      // 親クラス初期化
      this.superInit(options);
      // 初期値削除
      this.text = '';
      // 何文字目まで表示するか
      this.index = 0;
      // 表示するテキスト
      this.typedText = options.typedText;
      // タイプ終了
      this.finished = false;
      // 指定時間をかけてインデックスを増加
      this.tweener.clear().to({index: this.typedText.length}, options.duration)
                          .wait(100)
                          .call(function() {
                            // タイプ終了イベント発火
                            this.flare('typeend');
                          }, this);
    },
    // update
    update: function() {
      var text = this.typedText;
      // 右側を空白で詰めた部分テキスト
      this.text = text.substring(0, this.index | 0).paddingRight(text.length);
    },
    
    _static: {
      defaults: {
        typedText: 'Hello',
        duration: 1000
      },
    }
  });
});
phina.namespace(function() {
  /**
   * オブジェクト破壊のエフェクトを作成します。
   * @class phina.effect.Break
   * @memberOf phina.effect
   * @extends phina.display.DisplayElement
   *
   * @example
   * var sprite = Sprite('tiles', GRID_SIZE, GRID_SIZE).addChildTo(this);
   *
   * phina.effect.Break({
   *   sprite: sprite,
   * }).addChildTo(this);
   *
   * @param {object} [options] - phina.display.DisplayElementのoptionsと同じ
   * @param {object} [options.sprite=null] - 対象のスプライト
   * @param {string} [options.type='mariolike'] - 破壊エフェクトのタイプ
   */
  phina.define('phina.effect.Break', {
    superClass: 'phina.display.DisplayElement',

    init: function(options) {
      options = ({}).$safe(options || {}, phina.effect.Break.defaults);
      // 親クラス初期化
      this.superInit(options);
      // タイプ
      var type = options.type;
      // スプライト
      var sprite = options.sprite;
      
      if (type === 'mariolike') {
        this._marioLike(sprite);
      }
    },
    /**
     * @private
     */ 
    _marioLike: function(sprite) {
      // 縦横の分割数
      var divX = 2;
      var divY = 2;

      var image = sprite.image.domElement;
      // 分割サイズ
      var sizeX = sprite.width / divX;
      var sizeY = sprite.height / divY;
      // グリッド
      var grid = phina.util.Grid(sprite.width, divX);
      var srcRect = sprite.srcRect;
      // 分割スプライト作成
      (divX * divY).times(function(i) {
        // インデックス位置設定
        var xIndex = i % divX;
        var yIndex = (i / divX).floor();
        // 新規canvas作成
        var canvas = phina.graphics.Canvas().setSize(sizeX, sizeY);
        var x = srcRect.x + xIndex * sizeX;
        var y = srcRect.y + yIndex * sizeY;
        // canvasに描画
        canvas.context.drawImage(image, x, y, sizeX, sizeY, 0, 0, sizeX, sizeY);
        // 破片作成
        var piece = phina.display.Sprite(canvas).addChildTo(this);
        // 位置指定
        var px = grid.span(xIndex) + sprite.x - piece.width / 2;
        var py = grid.span(yIndex) + sprite.y - piece.height / 2;
        
        piece.setPosition(px, py);
        piece.rotation = 45;
      }, this);
      // 元スプライト削除
      this.spX = sprite.x;
      this.spY = sprite.y;
      sprite.remove();
      // 破片を散らす
      [[-120, 35], [-60, 35], [-150, 20], [-30, 20]].each(function(elem, i) {
        var piece = this.children[i];
        piece.physical.gravity.y = 4.6;
        piece.physical.velocity = phina.geom.Vector2().fromDegree(elem[0], elem[1]);
      }, this);
      // 自身を削除
      var self = this;
      this.tweener.wait(500)
                  .call(function() {
                    self.remove()
                  });
    },
    
    _static: {
      defaults: {
        type: 'mariolike',
        sprite: null
      },
    }
  });
});
phina.namespace(function() {
  /**
   * オブジェクトを上から押しつぶすエフェクトを作成
   * @class phina.effect.Stump
   * @memberOf phina.effect
   *
   * @example
   * // グローバルに展開
   * phina.globalize();
   *
   * @param {object} [options]
   * @param {object} [options.target=null] - 対象のオブジェクト
   * @param {number} [options.speed=200] - つぶれるまでの時間
   */
  phina.define('phina.effect.Stump', {
    superClass: 'phina.display.DisplayElement',
    
    init: function(options) {
      options = ({}).$safe(options || {}, phina.effect.Stump.defaults);
      // 潰れる速さ
      var speed = options.speed;
      // ターゲット
      var target = options.target;
      // origin変更
      target.setOrigin(0.5, 1.0);
      // 位置調整
      target.y += target.height / 2;
      // 縦方向に縮小
      target.tweener.to({scaleY: 0.1}, speed)
                    .call(function() {
                      // 削除
                      target.remove();
                      this.remove();
                    }, this)
                    .play();
    },
    
    _static: {
      defaults: {
        target: null,
        speed: 200
      },
    }
  });
});

phina.namespace(function() {
  /**
   * ドーナツ円タイプのゲージ
   * @class phina.ui.RingGauge
   * @memberOf phina.ui
   * @extends phina.display.PlainElement
   *
   * @example
   * var gauge = phina.ui.RingGauge({
   *   radius: 64,
   * }).addChildTo(this);
   * gauge.setPosition(this.gridX.center(), this.gridY.center());
   *
   * gauge.on('change', function() {
   *   gauge.redraw();
   * });
   *    
   * gauge.setValue(90);
   *
   * @param {object} [options] - phina.display.PlainElementのoptionsと同じ
   * @param {number} [options.radius=32] - 円の半径
   * @param {string} [options.foreColor='lime'] - ゲージの色
   * @param {string} [options.backColor='red'] - ゲージの空部分の色
   * @param {number} [options.maxValue=100] - ゲージの最大値
   */
  phina.define('phina.ui.RingGauge', {
    // 継承
    superClass: 'phina.display.PlainElement',
    // コンストラクタ
    init: function(options) {
      options = ({}).$safe(options || {}, phina.ui.RingGauge.defaults);
      // 円サイズ（外周）
      this.radius = options.radius;
      // 親クラス初期化
      this.superInit({
        width: this.radius * 2,
        height: this.radius * 2,
      });
      // ゲージの色
      this.foreColor = options.foreColor;
      // 空部分の色
      this.backColor = options.backColor;
      // 最大値
      this.maxValue = options.maxValue;
      // 現在の値
      this.value = this.maxValue;
      //
      this.startDeg = 360;
      this.endDeg = 0;
      //
      this.redraw();
    },
    /**
     * ゲージが満タンかをチェックする
     * @instance
     * @memberof phina.ui.RingGauge
     *
     * @return {boolean} 満タンかどうか
     */
    isFull: function() {
      return this.value === this.maxValue;
    },
    /**
     * ゲージが空っぽかをチェックする
     * @instance
     * @memberof phina.ui.RingGauge
     *
     * @return {boolean} 空っぽかどうか
     */
    isEmpty: function() {
      return this.value === 0;
    },
    /**
     * 値をセットする
     * @instance
     * @memberof phina.ui.RingGauge
     *
   　* @param {number} value - 設定する値
     */
    setValue: function(value) {
      //
      value = Math.clamp(value, 0, this.maxValue);
      //
      if (this.value === value) return ;
      this.value = value;
      // 変更イベント発火
      this.flare('change');
    },
    /**
     * ゲージを描画する
     * @instance
     * @memberof phina.ui.RingGauge
     */
    redraw: function() {
      var canvas = this.canvas;
      var r = this.radius;
      //
      var ratio = (this.maxValue - this.value) / this.maxValue;
      // 開始位置を調整した角度
      var sDeg = Math.degToRad(this.startDeg - 90);
      var eDeg = Math.degToRad(ratio * 360 - 90);
      // canvasクリア
      canvas.clear();
      canvas.globalCompositeOperation = 'source-over';
        
      canvas.context.fillStyle = this.backColor;
      canvas.fillCircle(r, r, r);
      canvas.context.fillStyle = this.foreColor;
      // 部分円を描画
      canvas.beginPath();
      canvas.moveTo(r, r).arc(r, r, r, sDeg, eDeg, true);
      canvas.closePath();
      canvas.fill();
      // 円で切り抜く
      canvas.globalCompositeOperation = 'xor';
      canvas.fillCircle(r, r, r * 0.5);
    },
    
    _static: {
      defaults: {
        radius: 32,
        foreColor: 'lime',
        backColor: 'red',
        maxValue: 100,
      }
    }
  });
});

phina.namespace(function() {
  /**
   * ハートタイプのゲージ
   * @class phina.ui.HeartGauge
   * @memberOf phina.ui
   * @extends phina.display.PlainElement
   *
   * @example
   * var gauge = phina.ui.HeartGuage({offset: 100}).addChildTo(this);
   * @param {object} [options] - phina.display.DisplayElementのoptionsと同じ
   * @param {number} [options.gridSize=64] - グリッドサイズ
   * @param {number} [options.offset=0] - オフセット
   * @param {string} [options.heartColor='red'] - ハートの色
   * @param {string} [options.emptyColor='gray'] - 空ハートの色
   * @param {string} [options.backColor='red'] - ゲージの空部分の色
   * @param {number} [options.defaultMax=3] - デフォルトのハートの個数
   * @param {number} [options.maxValue=20] - ハートの最大個数
   * @param {number} [options.colmun=10] - ハートの折返し
   * @param {boolean} [options.animation=true] - ハートが減る時アニメーションするかどうか
  */
  phina.define("phina.ui.HeartGauge", {
    // 継承
    superClass: 'phina.display.DisplayElement',
    // コンストラクタ
    init: function(options) {
      options = ({}).$safe(options || {}, phina.ui.HeartGauge.defaults);
      // 親クラス初期化
      this.superInit(options);
      // グループ
      var emptyGroup = DisplayElement().addChildTo(this);
      var heartGroup = DisplayElement().addChildTo(this);

      var size = options.gridSize;
      var offset = options.offset;
      // ハートサイズ
      this.heartRadius = (size / 2) * 0.8;
      // ハートの色
      this.heartColor = options.heartColor;
      // 空ハートの色
      this.emptyColor = options.emptyColor;
      // 折り返し個数
      var col = options.colmun;
      // 初期最大値
      var max = options.defaultMax;
      // ハート最大値
      this.maxValue = options.maxValue;
      // アニメーションするかどうか
      this.animation = options.animation;
      // グリッド
      this.grid = Grid({
        width: size * col,
        colmuns: col,
        offset: offset
      });
      
      var self = this;
      // 初期ハート作成
      (max).times(function(i) {
        // 空ハート
        self.createHeart('empty').addChildTo(emptyGroup);
        // ハート中身
        self.createHeart().addChildTo(heartGroup);
      });
      // 参照用
      this.col = col;
      this.emptyGroup = emptyGroup;
      this.heartGroup = heartGroup;
      // 初期配置
      this.reposition(emptyGroup);
      this.reposition(heartGroup);
    },
    /**
     * ハートを作成して返す
     * @instance
     * @memberof phina.ui.HeartGauge
     *
     * @param {string} type - ハートのタイプ empty or other
     * @return {object} HeartShape型オプジェクト
     */
    createHeart: function(type) {
      var color = (type === 'empty') ? this.emptyColor : this.heartColor;

      var heart = HeartShape({
        radius: this.heartRadius,
        fill: color,
        stroke: null,
      });
      return heart;
    },
    /**
     * ハートを配置する
     * @instance
     * @memberof phina.ui.HeartGauge
     *
     * @param {object} group - ハートグループ
     */
    reposition: function(group) {
      var col = this.col;
      var grid = this.grid;
      var self = this;
      // ハート配置
      group.children.each(function(heart, i) {
        // インデックス位置設定
        var xIndex = i % col;
        var yIndex = (i / col).floor();
        // 位置指定
        heart.setPosition(grid.span(xIndex), grid.span(yIndex));
      });
    },
    /**
     * ダメージ処理
     * @instance
     * @memberof phina.ui.HeartGauge
     *
     * @param {number} value - ダメージ値
     */
    damage: function(value) {
      // すでに空っぽなら何もしない
      if (this.isEmpty()) return;

      var children = this.heartGroup.children;
      var self = this;
      // 引数指定なしの場合は1ダメージ
      if (value === undefined) value = 1;
      // 残りハート数を超えないようにする
      if (value >= children.length) value = children.length;
      // アニメーション有効の場合
      if (this.animation) {
        (value).times(function(i) {
          // 末尾からインデックス指定
          var index = (children.length - 1) - i;
          var lost = children[index];
          // 点滅後削除
          lost.tweener.fadeOut(100).fadeIn(100)
                      .call(function() {
                        lost.remove();
                        // 空っぽ時イベント発火
                        if (self.isEmpty()) self.flare('empty');
                      }).play();
        });
      }
      else {
        (value).times(function(i) {
          self.heartGroup.children.pop();
        });

        if (self.isEmpty()) self.flare('empty');
      }
    },
    /**
     * 回復処理
     * @instance
     * @memberof phina.ui.HeartGauge
     *
     * @param {number} value - 回復値
     */
    recover: function(value) {
      // すでに満タンなら何もしない
      if (this.isFull()) return;

      var self = this;
      var group = this.heartGroup;
      // 引数指定なしの場合は1回復
      value = (value === undefined) ? 1 : value;
      // 空ハートとの差分
      var sub = this.emptyGroup.children.length - group.children.length;
      // 上限以上の回復はしない
      if (value >= sub) value = sub;
      // ハート追加
      // アニメーション有効の場合
      if (this.animation) {
        (value).times(function(i) {
          var heart = self.createHeart().addChildTo(group);
          // 拡大アニメーション
          heart.setScale(0.1).tweener.scaleTo(1.0, 200)
                                     .call(function() {
                                       // 満タン時イベント発火
                                       if (self.isFull()) self.flare('full');
                                     }).play();
        });
      }
      else {
        (value).times(function(i) {
          var heart = self.createHeart().addChildTo(group);
        });
        // 満タン時イベント発火
        if (this.isFull()) this.flare('full');
      }
      // 再配置
      this.reposition(group);
    },
    /**
     * ハートの最大個数を増やす
     * @instance
     * @memberof phina.ui.HeartGauge
     */
    // ハート最大値を増やす
    gainHeart: function() {
      // 最大ハート数なら何もしない
      if (this.emptyGroup.children.length === this.maxValue) return;
      // 空ハートを追加
      this.createHeart('empty').addChildTo(this.emptyGroup);
      // 全回復
      var sub = this.emptyGroup.children.length - this.heartGroup.children.length;
      this.recover(sub);
      // 再配置
      this.reposition(this.emptyGroup);
      this.reposition(this.heartGroup);
    },
    /**
     * 満タンかどうかを返す
     * @instance
     * @memberof phina.ui.HeartGauge
     *
     * @param {boolean} value - 満タンかどうか
     */
    isFull: function() {
      var len = this.heartGroup.children.length;
      return len > 0 && len === this.emptyGroup.children.length;
    },
    /**
     * 空かどうかを返す
     * @instance
     * @memberof phina.ui.HeartGauge
     *
     * @param {boolean} value - 空かどうか
     */
    isEmpty: function() {
      return this.heartGroup.children.length === 0;
    },
    
    _static: {
      defaults: {
        gridSize: 64,
        offset : 0,
        heartColor: 'red',
        emptyColor: 'gray',
        defaultMax: 3,
        maxValue: 20,
        colmun: 10,
        animation: true
      },
    }
  });
});
phina.namespace(function() {
  /**
   * タイマーゲージ
   * @class phina.ui.TimerGauge
   * @memberOf phina.ui
   * @extends phina.ui.Gauge
   *
   * @example
   * var gauge = phina.ui.TimerGauge({
   *   limitTime: 30,
   * }).addChildTo(this);
   * gauge.setPosition(this.gridX.center(), this.gridY.center());
   *
   * @param {object} [options] - phina.ui.Gaugeのoptionsと同じ
   * @param {number} [options.limitTime=60] - 制限時間
  */
  phina.define('phina.ui.TimerGauge', {
    // Guageを継承
    superClass: 'phina.ui.Gauge',

      init: function(options) {
        options = ({}).$safe(options || {}, phina.ui.TimerGauge.defaults);
        // 制限時間をゲージに引き渡す
        options.maxValue = options.limitTime * 1000;
        // 親クラス初期化
        this.superInit(options);
      },
      /**
       * タイマーを起動する
       * @instance
       * @memberof phina.ui.TimerGauge
       */
      run: function() {
        this.update = this.elapse;
      },
      /**
       * タイマーを停止する
       * @instance
       * @memberof phina.ui.TimerGauge
       */
      pause: function() {
        this.update = null;
      },
      /**
       * タイマーゲージを回復する
       * @instance
       * @memberof phina.ui.TimerGauge
       */
      recover: function() {
        this.pause();
        this.value = this.maxValue;  
      },
      /**
       * タイマーゲージを減らす
       * @instance
       * @memberof phina.ui.TimerGauge
       */
      elapse: function(app) {
        this.value -= app.deltaTime;
      },
      // デフォルト値
      _static: {
        defaults: {
          limitTime: 60,
        },
      }
  });
});
phina.namespace(function() {
  /**
   * マップ用の2次元配列データからマップを作成します。
   * @class phina.util.Map
   * @memberOf phina.util
   * @extends phina.display.DisplayElement
   *
   * @example
   * // グローバルに展開
   * phina.globalize();
   * // アセット
   * var ASSETS = {
   *   // 画像
   *   image: {
   *     'tile': 'https://cdn.jsdelivr.net/gh/alkn203/tomapiko_run@master/assets/tile.png',
   *   },
   * var data = [
   *   [2,2,2,2,2,2,2,2,2,2],
   *   [2,1,1,1,1,1,1,1,1,2],
   *   [2,2,2,2,2,2,2,1,1,2],
   *   [2,1,1,1,1,1,2,1,1,2],
   *   [2,1,1,1,1,1,2,1,1,2],
   *   [2,1,1,2,1,1,2,1,1,2],
   *   [2,1,1,2,1,1,1,1,1,2],
   *   [2,1,1,2,1,1,1,1,1,2],
   *   [2,1,1,2,1,1,1,1,1,2],
   *   [2,1,1,2,1,1,1,2,2,2],
   *   [2,1,1,1,1,1,1,1,1,2],
   *   [2,1,1,1,1,2,1,1,1,2],
   *   [2,1,2,2,2,2,2,1,1,2],
   *   [2,1,1,1,1,1,1,1,1,2],
   *   [2,2,2,2,2,2,2,2,2,2]
   * ];
   *
   * var map = phina.util.Map({
   *    tileWidth: 64,
   *    tileHeight: 64,
   *    imageName: 'tile',
   *    mapData: data,
   * }).addChildTo(this);
   *
   * @param {object} [options] - phina.display.DisplayElementのoptionsと同じ
   * @param {number} [options.tileWidth=64] - タイルの幅。
   * @param {number} [options.tileHeight=64] - タイルの高さ。
   * @param {string} [options.imageName=''] - タイル用の画像
   * @param {Array} [options.mapData=null] - マップデータ用の２次元配列
   * @param {Array} [options.collisionData=null] - 衝突判定用の２次元配列
   */
  phina.define('phina.util.Map', {
    superClass: 'phina.display.DisplayElement',

    init: function(options) {
      options = ({}).$safe(options || {}, phina.util.Map.defaults);
      // 親クラス初期化
      this.superInit();

      this.tileWidth = options.tileWidth;
      this.tileHeight = options.tileHeight;
      this.imageName = options.imageName;
      this.mapData = options.mapData;
      this.collisionData = options.collisionData;
      // 折り返し個数
      this.maxPerLine = this.mapData.first.length;
      
      var self = this;
      // 内部管理用の1次元配列
      this._mapData = [];
      // 2次元から1次元にする
      this.mapData.each(function(data) {
        self._mapData = self._mapData.concat(data);
      });
      
      if (this.collisionData) {
        this._collisionData = [];
        this.collisionData.each(function(data) {
          self._collisionData = self._collisionData.concat(data);
        });
      }
      // マップ作成
      this._createMap();
    },
    /** 
     * タイルを全て消去する 
     * @instance 
     * @memberof phina.util.Map  
     */ 
    clear: function() {
      this.children.clear();
    },
    /**
     * 座標からマップとの衝突判定を行う
     * @instance
     * @memberof phina.util.Map
     *
     * @param {number} x - x座標
     * @param {number} y - y座標
     * @return {boolean} 衝突したかどうか
     */
    hitTest: function(x, y) {
      var i = (x / this.tileWidth) | 0;
      var j = (y / this.tileHeight) | 0;

      if (this._collisionData[j * this.maxPerLine + i] === 1) return true;
      return false;
    },
    /**
     * 配列のインデックスからマップとの衝突判定を行う
     * @instance
     * @memberof phina.util.Map
     *
     * @param {number} i - 横方向のインデックス
     * @param {number} j - 縦方向のインデックス
     * @return {boolean} 衝突したかどうか
     */
    hitTestByIndex: function(i, j) {
      if (this._collisionData[j * this.maxPerLine + i] === 1) return true;
      return false;
    },
    /**
     * 指定された座標のタイルが何か調べる
     * @instance
     * @memberof phina.util.Map
     *
     * @param {number} x - x座標
     * @param {number} y - y座標
     * @return {number} タイル番号
     */
    checkTile: function(x, y) {
      var i = (x / this.tileWidth) | 0;
      var j = (y / this.tileHeight) | 0;
      return this._mapData[j * this.maxPerLine + i];
    },
    /** 
     * 指定されたベクトルインデックスのタイルを調べる 
     * @instance 
     * @memberof phina.util.Map 
     * 
     * @param {object} vec - Vector2オブジェクト  
     * @return {number} タイル番号 
     */ 
    checkTileByVec: function(vec) { 
      return this._mapData[vec.y * this.maxPerLine + vec.x]; 
    }, 
    /**
     * 指定されたインデックスのタイルが何か調べる
     * @instance
     * @memberof phina.util.Map
     *
     * @param {number} i - 横方向のインデックス
     * @param {number} j - 縦方向のインデックス
     * @return {number} タイル番号
     */
    checkTileByIndex: function(i, j) {
      // 行のインデックス * 列数 + 列のインデックス
      return this._mapData[j * this.maxPerLine + i];
    },
    /**
     * 指定された座標のタイルを更新する
     * @instance
     * @memberof phina.util.Map
     *
     * @param {number} x - x座標
     * @param {number} y - y座標
     * @param {number} tile - タイル番号
     */
    setTile: function(x, y, tile) {
      var i = (x / this.tileWidth) | 0;
      var j = (y / this.tileHeight) | 0;
      this._mapData[j * this.maxPerLine + i] = tile;
      this._createMap();
    },
    /**
     * 指定されたインデックスのタイルを更新する
     * @instance
     * @memberof phina.util.Map
     *
     * @param {number} i - 横方向のインデックス
     * @param {number} j - 縦方向のインデックス
     * @param {number} tile - タイル番号
     */
    setTileByIndex: function(i, j, tile) {
      this._mapData[j * this.maxPerLine + i] = tile;
      this._createMap();
    },
    /**
     * 指定されたインデックスのタイルを更新する
     * @instance
     * @memberof phina.util.Map
     *
     * @param {object} vec - Vector2オブジェクト
     * @param {number} tile - タイル番号
     */
    setTileByVec: function(vec, tile) {
      this._mapData[vec.y * this.maxPerLine + vec.x] = tile;
      this._createMap();
    },
    /**
     * 指定された座標の子要素を得る
     * @instance
     * @memberof phina.util.Map
     *
     * @param {number} x - x座標
     * @param {number} y - y座標
     * @return {Object} 子要素
     */
    getChild: function(x, y) {
      var i = (x / this.tileWidth) | 0;
      var j = (y / this.tileHeight) | 0;
      return this.children[j * this.maxPerLine + i];
    },
    /**
     * 指定されたインデックスの子要素を得る
     * @instance
     * @memberof phina.util.Map
     *
     * @param {number} i - 横方向のインデックス
     * @param {number} j - 縦方向のインデックス
     * @return {Object} 子要素
     */
    getChildByIndex: function(i, j) {
      return this.children[j * this.maxPerLine + i];
    },
    /**
     * 座標値からインデックスを得る
     * @instance
     * @memberof phina.util.Map
     *
     * @param {Vector2} vec - 座標値
     * @return {Vector2} インデックス
     */
    coordToIndex: function(vec) {
      var x = Math.floor(vec.x / this.tileWidth);
      var y = Math.floor(vec.y / this.tileHeight);
      return Vector2(x, y);
    },
    // マップ作成
    _createMap: function() {
      var tw = this.tileWidth;
      var th = this.tileHeight;
      var maxPerLine = this.maxPerLine;
      var self = this;
      
      this._mapData.each(function(elem, i) {
        // グリッド配置用のインデックス値算出
        var xIndex = i % maxPerLine;
        var yIndex = Math.floor(i / maxPerLine);
        var x = tw * xIndex + tw / 2;
        var y = th * yIndex + th / 2;
        //
        var tile = phina.display.Sprite(self.imageName, tw, th).addChildTo(self);
        tile.setPosition(x, y);
        // フレームインデックス指定
        tile.frameIndex = elem;
      });
    },

    _static: {
      defaults: {
        tileWidth: 64,
        tileHeight: 64,
        imageName: '',
        mapData: null,
        collisionData: null
      },
    }
  });
});
