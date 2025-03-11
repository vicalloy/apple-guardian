import Phaser from 'phaser';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  create() {
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
        backgroundColor: '#000',
        color: '#fff',
        padding: { x: 10, y: 5 },
      }).setOrigin(0.5);
    }

    // 创建Level显示
    const levelText = this.add.text(width / 2, height / 2 + 48, 'Level 1', {
      fontSize: '28px',
      color: '#ffd700',
      backgroundColor: '#000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive();

    // 创建开始按钮
    const startButton = this.add.text(width / 2, height / 2, 'Start Game', {
      fontSize: '32px',
      backgroundColor: '#000',
      color: '#fff',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    // 创建界面容器
    // 确保 resultText 不为 undefined，若为 undefined 则不添加到容器中
    const homeChildren = [levelText, startButton];
    if (resultText) {
      homeChildren.push(resultText);
    }
    const mainContainer = this.add.container(0, 0, homeChildren);
    const levelSelectContainer = this.add.container(width, 0);

    // 初始化Level数据
    this.data.set('selectedLevel', 1);

    // Level文本点击事件
    levelText.on('pointerdown', () => {
      mainContainer.setVisible(false);
      levelSelectContainer.setPosition(0, 0);

      // 创建Level选择按钮
      const levelButtons = [];
      for (let i = 1; i <= 9; i++) {
        const btn = this.add.text(
          width / 2 - 150 + ((i - 1) % 2) * 300,
          height / 2 - 100 + Math.floor((i - 1) / 2) * 60,
          `Level ${i}`,
          {
            fontSize: '28px',
            color: i === this.data.get('selectedLevel') ? '#ffd700' : '#fff',
            backgroundColor: '#333',
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

      // 添加返回按钮
      const backButton = this.add.text(width / 2, height - 50, 'Back', {
        fontSize: '24px',
        color: '#fff',
        backgroundColor: '#666',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setInteractive();

      backButton.on('pointerdown', () => {
        mainContainer.setVisible(true);
        levelSelectContainer.setPosition(width, 0);
      });

      levelSelectContainer.add([...levelButtons, backButton]);
    });

    // 开始按钮点击事件
    startButton.setInteractive();
    startButton.on('pointerdown', () => {
      this.scene.start('MainScene', { level: this.data.get('selectedLevel') });
      this.scene.stop();
    });

    // 触发场景就绪事件
    this.events.emit('current-scene-ready', this);
  }

  init(data: { success: boolean; level?: number }) {
    this.data.set('success', data?.success);
    if (data?.level) {
      this.data.set('selectedLevel', data.level);
    }
  }
}