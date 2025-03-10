import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import { EventBus } from './EventBus';
import Phaser from 'phaser';

export interface IRefPhaserGame
{
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface IProps
{
    currentActiveScene?: (scene_instance: Phaser.Scene) => void
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(function PhaserGame({ currentActiveScene }, ref)
{
    const game = useRef<Phaser.Game | null>(null!);

    useLayoutEffect(() =>
    {
        if (game.current === null)
        {
            const config = {
                type: Phaser.AUTO,
                width: 800,
                height: 600,
                scene: MainScene,
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { x: 0, y: 0 },
                        debug: false
                    }
                }
            };

            game.current = new Phaser.Game(config);

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: null });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: null };
            }

        }

        return () =>
        {
            if (game.current)
            {
                game.current.destroy(true);
                if (game.current !== null)
                {
                    game.current = null;
                }
            }
        }
    }, [ref]);

    useEffect(() =>
    {
        EventBus.on('current-scene-ready', (scene_instance: Phaser.Scene) =>
        {
            if (currentActiveScene && typeof currentActiveScene === 'function')
            {
                currentActiveScene(scene_instance);
            }

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: scene_instance });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: scene_instance };
            }
            
        });
        return () =>
        {
            EventBus.removeListener('current-scene-ready');
        }
    }, [currentActiveScene, ref]);

    return (
        <div id="game-container"></div>
    );

});

class MainScene extends Phaser.Scene {
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
    // Start the game timer
    this.time.delayedCall(60000, this.endGame, [], this);

    // Start falling letters
    this.letterTimer = this.time.addEvent({
      delay: 1000, // Delay between each letter
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
      body.setVelocityY(400); // Increase the falling speed
    }

    this.activeLetters.push(letter);

    this.physics.add.overlap(letter, this.applesMap[columnIndex], (letterObj, appleObj) => {
      if (this.applesMap[columnIndex]) {
        this.applesMap[columnIndex].destroy();
        delete this.applesMap[columnIndex];
      }
      (letterObj as Phaser.GameObjects.Text).destroy();
    }, undefined, this);
  }

  create() {
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

    // Add a start button
    const startButton = this.add.text(width / 2, height / 2, 'Start Game', {
      fontSize: '32px',
      backgroundColor: '#000',
      color: '#fff',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    startButton.setInteractive();
    startButton.on('pointerdown', () => {
      startButton.setVisible(false); // Hide the start button
      this.startGame(); // Start the game logic
    });
  }

  update() {
    // Handle falling letters and user input here
  }

  endGame() {
    // Check if any apples are left and display the appropriate message
    // Offer a restart option
  }
}
