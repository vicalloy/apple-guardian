import Phaser from 'phaser';

export class HomeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HomeScene' });
    }

    create() {
        const { width, height } = this.scale;
        
        // 创建开始按钮
        const startButton = this.add.text(width / 2, height / 2, 'Start Game', {
            fontSize: '32px',
            backgroundColor: '#000',
            color: '#fff',
            padding: { x: 10, y: 5 },
        }).setOrigin(0.5);

        startButton.setInteractive();
        startButton.on('pointerdown', () => {
            // 切换场景到主游戏场景
            this.scene.start('MainScene');
            // 销毁当前场景（可选）
            this.scene.stop();
        });

        // 触发场景就绪事件
        this.events.emit('current-scene-ready', this);
    }

    init(data: { success: boolean }) {
      this.data.set('success', data?.success);
    }
}