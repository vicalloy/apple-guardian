import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private letterTimer: Phaser.Time.TimerEvent;
  private applesMap: { [key: number]: Phaser.GameObjects.Text } = {};
  private activeLetters: { [key: string]: Phaser.GameObjects.Text } = {};
  private gameVelocity: number;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: { success: boolean; level?: number }) {
    this.data.set('success', data?.success);
    if (data?.level) {
      this.data.set('level', data.level);
    }
  }

  preload() {
    // Load any assets here if needed
  }

  startGame() {
    const level = this.data.get('level') || 1;
    this.activeLetters = {};
    this.createApples();

    // Calculate dynamic values based on level
    const baseSpeed = 50;
    const speedIncrementRate = 1.3;
    const baseInterval = 2000;

    const velocityY = baseSpeed * (speedIncrementRate ** (level - 1));
    const spawnDelay = baseInterval / (speedIncrementRate ** (level - 1));

    // Start the game timer
    this.time.delayedCall(30000, this.endGame, [], this);

    // Start falling letters with dynamic interval
    this.letterTimer = this.time.addEvent({
      delay: spawnDelay,
      callback: this.dropLetter,
      callbackScope: this,
      loop: true
    });

    // Store velocity for physics use
    this.gameVelocity = velocityY;

    // Add keyboard input handling
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      const keyPressed = event.key.toUpperCase();
      if (this.activeLetters[keyPressed]) {
        this.activeLetters[keyPressed].destroy();
        delete this.activeLetters[keyPressed];
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
    }

    this.activeLetters[randomLetter] = letter;

    this.physics.add.overlap(letter, this.applesMap[columnIndex], (letterObj, appleObj) => {
      const letterKey = letterObj.text.split('\n')[0].toUpperCase();
      delete this.activeLetters[letterKey];
      if (this.applesMap[columnIndex]) {
        this.applesMap[columnIndex].destroy();
        delete this.applesMap[columnIndex];

        if (Object.keys(this.applesMap).length === 0) {
          this.letterTimer.destroy();
          this.endGame();
        }
      }
      (letterObj as Phaser.GameObjects.Text).destroy();
    }, undefined, this);
  }

  createApples() {
    this.physics.world.setBoundsCollision(true, true, false, false); // Allow letters to fall off the bottom

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
    this.startGame(); // Start the game logic
  }

  update() {
    // Handle falling letters and user input here
  }

  endGame() {
    const hasSuccess = Object.keys(this.applesMap).length > 0;
    this.scene.start('HomeScene', { success: hasSuccess });
    this.scene.stop();
  }
}
