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
        this.turrets = null;
    }

    preload() {
        this.load.image('startBlock', 'assets/startBlock.png');
        this.load.image('drone', 'assets/drone.png');
        this.load.image('laser', 'assets/laser.png');
        this.load.image('laser2', 'assets/laser2.png');
        this.load.image('map', 'assets/map.png');
        this.load.image('turret', 'assets/turret.png');
    }

    create() {
        this.physics.world.setBounds(0, 0, 1600, 1200);
        
        this.map = this.add.image(0, 0, 'map')
            .setOrigin(0, 0)
            .setDisplaySize(1600, 1200);

        this.turrets = this.physics.add.group({
            collideWorldBounds: true,
            allowGravity: false
        });

        this.droneLasers = this.physics.add.group({
            allowGravity: false
        });
        
        this.turretLasers = this.physics.add.group({
            allowGravity: false
        });

        this.createTurrets();

        this.deployZone = this.add.sprite(100, 1100, 'startBlock')
            .setOrigin(0.5, 0.5)
            .setInteractive();

        this.cameras.main.setBounds(0, 0, 1600, 1200);
        this.cameras.main.scrollX = 0;
        this.cameras.main.scrollY = 600;

        this.add.text(10, 10, 'Click to deploy drone\nArrow keys to move\nSpace to shoot', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0);

        this.deployZone.on('pointerdown', () => {
            if (this.deployMode && !this.drone) {
                this.createDrone(100, 1100);
                this.deployMode = false;
                this.deployZone.destroy();
                this.startTurretFiring();
            }
        });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.setupUI();

        // Only check collisions between specific groups
        this.physics.add.overlap(this.droneLasers, this.turrets, this.hitTurret, null, this);
    }

    createTurrets() {
        const turretPositions = [
            {x: 200, y: 200}, {x: 800, y: 200}, {x: 1400, y: 200},
            {x: 200, y: 600}, {x: 800, y: 600}, {x: 1400, y: 600},
            {x: 200, y: 1000}, {x: 800, y: 1000}, {x: 1400, y: 1000}
        ];

        turretPositions.forEach(pos => {
            const turret = this.turrets.create(pos.x, pos.y, 'turret');
            turret.health = 5;
            turret.setScale(1/15);
            turret.lastFired = 0;
            turret.body.immovable = true;
            turret.body.setSize(turret.width * 0.5, turret.height * 0.5);
        });
    }

    hitTurret(laser, turret) {
        if (!laser.destroyed) {
            laser.destroyed = true;
            laser.destroy();
            turret.health--;
            if (turret.health <= 0) {
                turret.destroy();
            }
        }
    }

    startTurretFiring() {
        this.time.addEvent({
            delay: 1000,
            callback: this.turretsFire,
            callbackScope: this,
            loop: true
        });
    }

    turretsFire() {
        const cameraView = this.cameras.main.worldView;
        
        this.turrets.getChildren().forEach(turret => {
            if (this.drone && 
                turret.x >= cameraView.x && 
                turret.x <= cameraView.x + cameraView.width &&
                turret.y >= cameraView.y && 
                turret.y <= cameraView.y + cameraView.height) {
                
                const time = this.time.now;
                if (time > turret.lastFired + 1000) {
                    const angle = Phaser.Math.Angle.Between(
                        turret.x, turret.y,
                        this.drone.x, this.drone.y
                    );

                    const laser = this.physics.add.sprite(turret.x, turret.y, 'laser2');
                    this.turretLasers.add(laser);
                    laser.setScale(0.375);
                    laser.setTint(0xff0000);

                    const speed = 300;
                    laser.setVelocity(
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed
                    );
                    laser.setRotation(angle);

                    this.time.delayedCall(2000, () => {
                        if (laser && !laser.destroyed) {
                            laser.destroy();
                        }
                    });

                    const hitCallback = (laser, drone) => {
                        if (!laser.destroyed) {
                            this.hitDrone(drone, laser);
                            laser.destroyed = true;
                        }
                    };

                    this.physics.add.overlap(laser, this.drone, hitCallback, null, this);
                    
                    turret.lastFired = time;
                }
            }
        });
    }

    hitDrone(drone, laser) {
        if (!laser.destroyed) {
            laser.destroyed = true;
            laser.destroy();
            drone.data.health -= 10;
            this.updateUI();
            
            if (drone.data.health <= 0) {
                this.scene.restart();
            }
        }
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
        this.drone.body.setSize(this.drone.width * 0.5, this.drone.height * 0.5);
        
        const targetWidth = 100;
        const scaleRatio = targetWidth / this.drone.width;
        this.drone.setScale(scaleRatio);

        this.drone.data = {
            health: 100,
            energy: 100
        };

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
            this.droneLasers.add(laser);
            
            const laserScale = 0.375;
            laser.setScale(laserScale);

            const speed = 500;
            laser.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            laser.setRotation(angle);

            this.time.delayedCall(2000, () => {
                if (laser && !laser.destroyed) {
                    laser.destroy();
                }
            });

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
            debug: true // Enabled debug mode to see physics bodies
        }
    },
    scene: [StartScene, GameScene]
};

const game = new Phaser.Game(config);