import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private letterTimer: Phaser.Time.TimerEvent;
  private applesMap: { [key: number]: Phaser.GameObjects.Text } = {};
  private activeLetters: { [key: string]: Phaser.GameObjects.Text } = {};
  private gameVelocity: number;
  private remainLetterCount: number;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: { level?: number }) {
    if (data?.level) {
      this.data.set('level', data.level);
    }
  }

  preload() {
    this.load.image('bg', 'assets/bg.png');
    // Load any assets here if needed
    this.load.audio('type', 'assets/sound/type.wav');
    this.load.audio('wrong', 'assets/sound/wrong.mp3');
  }

  isGameOver() {
    if (Object.keys(this.applesMap).length === 0) {
      return true;
    }
    if (this.remainLetterCount <= 0 && Object.keys(this.activeLetters).length === 0) {
      return true;
    }
    return false;
  }

  startGame() {
    const level = this.data.get('level') || 1;
    this.remainLetterCount = 60;
    this.activeLetters = {};
    this.createApples();

    // Calculate dynamic values based on level
    const baseSpeed = 50;
    const speedIncrementRate = 1.3;
    const baseInterval = 2000;

    const velocityY = baseSpeed * (speedIncrementRate ** (level - 1));
    const spawnDelay = baseInterval / (speedIncrementRate ** (level - 1));

    // Start falling letters with dynamic interval
    this.letterTimer = this.time.addEvent({
      delay: spawnDelay,
      callback: () => {
        if (this.remainLetterCount > 0) {
          this.dropLetter();
          this.remainLetterCount--;
        } else {
          this.letterTimer.destroy();
        }
      },
      callbackScope: this,
      loop: true
    });

    // Store velocity for physics use
    this.gameVelocity = velocityY;

    // Add keyboard input handling
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      if (this.activeLetters[key]) {
        // 创建粒子爆炸效果
        const letter = this.activeLetters[key];
        const emitter = this.add.particles(letter.x, letter.y, 'flares', {
          frame: 'white',
          scale: { start: 0.2, end: 0.5 },
          speed: { min: -300, max: 300 },
          lifespan: 800,
          gravityY: 400,
          blendMode: 'ADD',
          emitZone: { type: 'random', quantity: 10 } as Phaser.Types.GameObjects.Particles.EmitZoneData
        });

        emitter.explode(100);
        this.time.delayedCall(100, () => emitter.destroy());
        this.activeLetters[key].destroy();
        delete this.activeLetters[key];
        this.sound.play('type', { volume: 1 });
        if (this.isGameOver()) {
          this.endGame();
        }
      } else {
        this.sound.play('wrong', { volume: 1 });
      }
    });
  }


  dropLetter() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomLetter: string;
    do {
      randomLetter = letters.charAt(Phaser.Math.Between(0, letters.length - 1));
    } while (this.activeLetters[randomLetter]);
    const { width } = this.scale;
    const columnWidth = width / 12;
    const validColumns = Object.keys(this.applesMap).map(Number);
    const columnIndex = validColumns[Phaser.Math.Between(0, validColumns.length - 1)];
    const x = columnIndex * columnWidth - 10 + columnWidth / 2;
    const letter = this.add.text(x, 0, `${randomLetter}\n🐛`, { fontSize: '32px', color: '#fff' });

    this.physics.add.existing(letter);
    const body = letter.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocityY(this.gameVelocity);
      body.setCollideWorldBounds(true);
      body.onWorldBounds = true;
    }

    this.activeLetters[randomLetter] = letter;

    this.physics.add.overlap(letter, this.applesMap[columnIndex], (letterObj, appleObj) => {
      const letterKey = letterObj.text.split('\n')[0].toUpperCase();
      delete this.activeLetters[letterKey];
      if (this.applesMap[columnIndex]) {
        this.applesMap[columnIndex].destroy();
        delete this.applesMap[columnIndex];

        if (this.isGameOver()) {
          this.endGame();
        }
      }
      (letterObj as Phaser.GameObjects.Text).destroy();
    }, undefined, this);
  }

  createApples() {
    this.physics.world.setBoundsCollision(true, true, true, true);
    this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
      const letter = body.gameObject as Phaser.GameObjects.Text;
      if (body.blocked.down) {
        const letterKey = letter.text.split('\n')[0].toUpperCase();
        delete this.activeLetters[letterKey];
        letter.destroy();
      }
      if (this.isGameOver()) {
        this.endGame();
      }
    });

    const columns = 12;
    const appleEmoji = '🍎';
    const { width, height } = this.scale;
    const columnWidth = width / columns;

    // Create apples at the bottom of each column
    for (let i = 0; i < columns; i++) {
      const x = i * columnWidth + columnWidth / 2;
      const y = height - 20; // Adjust y position as needed
      const apple = this.add.text(x, y, appleEmoji, { fontSize: '32px' }).setOrigin(0.5);
      this.physics.add.existing(apple);
      this.applesMap[i] = apple;
    }

  }
  create() {
    // 添加背景图
    const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'bg')
      .setOrigin(0.5);
    bg.setScale(this.scale.width / bg.width, this.scale.height / bg.height)
      .setDepth(-1);

    this.startGame(); // Start the game logic
  }

  update() {
    // Handle falling letters and user input here
  }

  endGame() {
    this.letterTimer.destroy();
    const hasSuccess = Object.keys(this.applesMap).length > 0;
    this.scene.start('HomeScene', { success: hasSuccess, level: this.data.get('level') });
    this.scene.stop();
  }
}
