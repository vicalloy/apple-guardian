import Phaser from 'phaser';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  preload() {
    this.load.image('bg', 'assets/bg.png');
  }

  create() {
    const bg = this.add.image(this.scale.width/2, this.scale.height/2, 'bg')
      .setOrigin(0.5);
    bg.setScale(this.scale.width/bg.width, this.scale.height/bg.height)
      .setDepth(-1);

    const { width, height } = this.scale;

    let resultText;
    if (this.data.get('success') != undefined) {
      let hint = '';
      if (this.data.get('success')) {
        hint = 'You Win';
      } else {
        hint = 'Game Over';
      }
      resultText = this.add.text(width / 2, height / 2 - 48, hint, {
        fontSize: '32px',
        color: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        padding: { x: 10, y: 5 },
      }).setOrigin(0.5);
    }

    const selectedLevel = this.data.get('selectedLevel');

    const levelText = this.add.text(width / 2, height / 2 + 48, `Level ${selectedLevel}`, {
      fontSize: '28px',
      color: '#fff',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive();

    const startButton = this.add.text(width / 2, height / 2, 'Start Game', {
      fontSize: '32px',
      color: '#fff',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    const homeChildren = [levelText, startButton];
    if (resultText) {
      homeChildren.push(resultText);
    }
    const mainContainer = this.add.container(0, 0, homeChildren);
    const levelSelectContainer = this.add.container(width, 0);

    levelText.on('pointerdown', () => {
      mainContainer.setVisible(false);
      levelSelectContainer.setPosition(0, 0);

      const levelButtons = [];
      for (let i = 1; i <= 9; i++) {
        const btn = this.add.text(
          width / 2 - 150 + ((i - 1) % 2) * 300,
          height / 2 - 100 + Math.floor((i - 1) / 2) * 60,
          `Level ${i}`,
          {
            fontSize: '28px',
            color: i === this.data.get('selectedLevel') ? '#ffd700' : '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            padding: { x: 20, y: 10 }
          }
        ).setOrigin(0.5).setInteractive();

        btn.on('pointerdown', () => {
          this.data.set('selectedLevel', i);
          levelText.setText(`Level ${i}`);
          mainContainer.setVisible(true);
          levelSelectContainer.setPosition(width, 0);
        });
        levelButtons.push(btn);
      }

      const backButton = this.add.text(width / 2, height - 50, 'Back', {
        fontSize: '24px',
        color: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setInteractive();

      backButton.on('pointerdown', () => {
        mainContainer.setVisible(true);
        levelSelectContainer.setPosition(width, 0);
      });

      levelSelectContainer.add([...levelButtons, backButton]);
    });

    startButton.setInteractive();
    startButton.on('pointerdown', () => {
      this.scene.start('MainScene', { level: this.data.get('selectedLevel') });
      this.scene.stop();
    });

    this.events.emit('current-scene-ready', this);
  }

  init(data: { success: boolean; level?: number }) {
    this.data.set('success', data?.success);
    this.data.set('selectedLevel', data?.level ?? 1);
  }
}
