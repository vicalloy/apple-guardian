import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
    private letterTimer: Phaser.Time.TimerEvent;
    private applesMap: { [key: number]: Phaser.GameObjects.Text } = {};
    private activeLetters: Phaser.GameObjects.Text[] = [];
  
    constructor() {
      super({ key: 'MainScene' });
    }
  
    preload() {
      // Load any assets here if needed
    }
  
    startGame() {
      this.createApples();

      // Start the game timer
      this.time.delayedCall(30000, this.endGame, [], this);
  
      // Start falling letters
      this.letterTimer = this.time.addEvent({
        delay: 800, // Delay between each letter
        callback: this.dropLetter,
        callbackScope: this,
        loop: true
      });
  
      // Add keyboard input handling
      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        const keyPressed = event.key.toUpperCase();
        const remainingLetters: Phaser.GameObjects.Text[] = [];
        this.activeLetters.forEach((letter) => {
          if (letter?.text?.toUpperCase() === keyPressed) {
            letter.destroy();
          } else if (letter) {
            remainingLetters.push(letter);
          }
        });
        this.activeLetters = remainingLetters;
      });
    }
  
    dropLetter() {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = letters.charAt(Phaser.Math.Between(0, letters.length - 1));
      const { width } = this.scale;
      const columnWidth = width / 12;
      const validColumns = Object.keys(this.applesMap).map(Number);
      const columnIndex = validColumns[Phaser.Math.Between(0, validColumns.length - 1)];
      const x = columnIndex * columnWidth - 10 + columnWidth / 2;
      const letter = this.add.text(x, 0, randomLetter, { fontSize: '32px', color: '#fff' });
  
      this.physics.add.existing(letter);
      const body = letter.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocityY(300); // Increase the falling speed
      }
  
      this.activeLetters.push(letter);
  
      this.physics.add.overlap(letter, this.applesMap[columnIndex], (letterObj, appleObj) => {
        if (this.applesMap[columnIndex]) {
          this.applesMap[columnIndex].destroy();
          delete this.applesMap[columnIndex];
          
          // 检查是否所有苹果都被消除
          if (Object.keys(this.applesMap).length === 0) {
            this.letterTimer.destroy(); // 停止字母下落定时器
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
