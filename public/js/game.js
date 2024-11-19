class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('drone', 'assets/drone.png');
        this.load.image('laser', 'assets/laser.png');
        this.load.image('startBlock', 'assets/StartBlock.png');
    }

    create() {
        if (!this.textures.exists('background')) {
            const graphics = this.add.graphics();
            const gradient = graphics.createLinearGradient(0, 0, 0, 600);
            gradient.addColorStop(0, '#001624');
            gradient.addColorStop(1, '#001040');
            graphics.fillGradientStyle(gradient);
            graphics.fillRect(0, 0, 800, 600);
        } else {
            this.add.image(0, 0, 'background').setOrigin(0);
        }

        this.add.text(400, 100, 'CITY DEFENSE', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#00ffff',
            stroke: '#003333',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
        }).setOrigin(0.5);

        this.createButton(400, 300, 'PLAY', () => {
            this.cameras.main.fade(500, 0, 0, 0);
            this.time.delayedCall(500, () => this.scene.start('GameScene'));
        });

        this.createButton(400, 400, 'MENU', () => {
            console.log('Menu clicked');
        });
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 200, 60, 0x000000, 0.8)
            .setStrokeStyle(2, 0x00ffff);
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '32px',
            color: '#00ffff'
        }).setOrigin(0.5);

        button.add([bg, buttonText]);
        button.setSize(200, 60);
        button.setInteractive();

        button.on('pointerover', () => {
            bg.setStrokeStyle(3, 0x00ffff);
            buttonText.setScale(1.1);
        });

        button.on('pointerout', () => {
            bg.setStrokeStyle(2, 0x00ffff);
            buttonText.setScale(1);
        });

        button.on('pointerdown', callback);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.deployMode = true;
        this.drone = null;
        this.lastFired = 0;
        this.fireRate = 200;
    }

    preload() {
        this.load.image('startBlock', 'assets/StartBlock.png');
        this.load.image('drone', 'assets/drone.png');
        this.load.image('laser', 'assets/laser.png');
        this.load.image('map', 'assets/map.png');
    }

    create() {
        this.physics.world.setBounds(0, 0, 1600, 1200);
        
        // Add scrolling map
        this.map = this.add.image(0, 0, 'map')
            .setOrigin(0, 0)
            .setDisplaySize(1600, 1200);

        this.deployZone = this.add.sprite(100, 300, 'startBlock')
            .setScrollFactor(0)
            .setInteractive();

        this.cameras.main.setBounds(0, 0, 1600, 1200);

        this.add.text(10, 10, 'Click to deploy drone\nArrow keys to move\nSpace to shoot', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0);

        this.deployZone.on('pointerdown', (pointer) => {
            if (this.deployMode && !this.drone) {
                this.createDrone(pointer.x, pointer.y);
                this.deployMode = false;
            }
        });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.lasers = this.add.group();
        this.setupUI();
    }

    setupUI() {
        this.healthText = this.add.text(10, 550, 'Health: 100', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0);

        this.energyText = this.add.text(10, 570, 'Energy: 100', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0);
    }

    createDrone(x, y) {
        this.drone = this.physics.add.sprite(x, y, 'drone');
        this.drone.setOrigin(0.5, 1);
        this.drone.setCollideWorldBounds(true);

        const targetWidth = 100;
        const scaleRatio = targetWidth / this.drone.width;
        this.drone.setScale(scaleRatio);

        this.drone.data = {
            health: 100,
            energy: 100
        };

        // Add camera follow
        this.cameras.main.startFollow(this.drone, true, 0.09, 0.09);
    }

    fireLaser() {
        const time = this.time.now;
        if (time > this.lastFired) {
            const mouseX = this.input.x + this.cameras.main.scrollX;
            const mouseY = this.input.y + this.cameras.main.scrollY;

            const angle = Phaser.Math.Angle.Between(
                this.drone.x,
                this.drone.y,
                mouseX,
                mouseY
            );

            const droneRadius = this.drone.displayHeight / 2;
            const startX = this.drone.x + Math.cos(angle) * droneRadius;
            const startY = this.drone.y + Math.sin(angle) * droneRadius;

            const laser = this.physics.add.sprite(startX, startY, 'laser');
            
            const laserScale = 1.5;
            laser.setScale(laserScale);

            const speed = 500;
            laser.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            laser.setRotation(angle);

            this.time.delayedCall(2000, () => laser.destroy());

            this.lastFired = time + this.fireRate;
            this.drone.data.energy = Math.max(0, this.drone.data.energy - 2);
            this.updateUI();
        }
    }

    updateUI() {
        this.healthText.setText(`Health: ${Math.floor(this.drone.data.health)}`);
        this.energyText.setText(`Energy: ${Math.floor(this.drone.data.energy)}`);
    }

    update() {
        if (this.drone) {
            const speed = 200;

            if (this.cursors.left.isDown) {
                this.drone.setVelocityX(-speed);
            } else if (this.cursors.right.isDown) {
                this.drone.setVelocityX(speed);
            } else {
                this.drone.setVelocityX(0);
            }

            if (this.cursors.up.isDown) {
                this.drone.setVelocityY(-speed);
            } else if (this.cursors.down.isDown) {
                this.drone.setVelocityY(speed);
            } else {
                this.drone.setVelocityY(0);
            }

            const mouseX = this.input.x + this.cameras.main.scrollX;
            const mouseY = this.input.y + this.cameras.main.scrollY;
            const angle = Phaser.Math.Angle.Between(
                this.drone.x,
                this.drone.y,
                mouseX,
                mouseY
            );
            this.drone.setRotation(angle + Math.PI / 2);

            if (this.cursors.space.isDown && this.drone.data.energy > 0) {
                this.fireLaser();
            }

            if (!this.cursors.space.isDown) {
                this.drone.data.energy = Math.min(100, this.drone.data.energy + 0.1);
                this.updateUI();
            }
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [StartScene, GameScene]
};

const game = new Phaser.Game(config);