class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
        this.selectedDrone = null;
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('drone', 'assets/drone.png');
        this.load.image('drone2', 'assets/drone2.png'); // Add the new drone asset
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

        this.add.text(400, 200, 'Choose Your Drone', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Drone 1 selection button
        this.createDroneButton(250, 300, 'drone', () => {
            this.selectedDrone = 'drone';
            this.startGame();
        });

        // Drone 2 selection button
        this.createDroneButton(550, 300, 'drone2', () => {
            this.selectedDrone = 'drone2';
            this.startGame();
        });
    }

    createDroneButton(x, y, droneType, callback) {
        const button = this.add.container(x, y);
        
        // Background rectangle
        const bg = this.add.rectangle(0, 0, 200, 200, 0x000000, 0.6)
            .setStrokeStyle(2, 0x00ffff);
        
        // Drone preview
        const dronePreview = this.add.image(0, -30, droneType);
        dronePreview.setScale(0.1);
        
        // Drone name text
        const buttonText = this.add.text(0, 80, droneType.charAt(0).toUpperCase() + droneType.slice(1), {
            fontSize: '24px',
            color: '#00ffff'
        }).setOrigin(0.5);

        button.add([bg, dronePreview, buttonText]);
        button.setSize(200, 200);
        button.setInteractive();

        button.on('pointerover', () => {
            bg.setStrokeStyle(3, 0x00ffff);
            dronePreview.setScale(0.2);
        });

        button.on('pointerout', () => {
            bg.setStrokeStyle(2, 0x00ffff);
            dronePreview.setScale(0.1);
        });

        button.on('pointerdown', callback);
    }

    startGame() {
        if (this.selectedDrone) {
            // Pass the selected drone type to the GameScene
            this.cameras.main.fade(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.scene.start('GameScene', { selectedDrone: this.selectedDrone });
            });
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.add.text(centerX, centerY - 50, 'GAME OVER', {
            fontSize: '64px',
            color: '#ff0000',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY + 50, 'Click to Restart', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.input.on('pointerdown', () => {
            this.scene.start('StartScene');
        });
    }
}

class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.add.text(centerX, centerY, 'LEVEL PASSED!\nMore levels coming soon...', {
            fontSize: '48px',
            color: '#00ff00',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);

        this.createConfetti();

        this.input.on('pointerdown', () => {
            this.scene.start('StartScene');
        });
    }

    createConfetti() {
        for(let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, 800);
            const particle = this.add.rectangle(x, -10, 10, 10, Phaser.Math.Between(0x000000, 0xffffff));
            
            this.tweens.add({
                targets: particle,
                y: 600,
                x: x + Phaser.Math.Between(-100, 100),
                rotation: Phaser.Math.Between(0, 360),
                duration: Phaser.Math.Between(2000, 4000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }
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
        this.selectedDrone = 'drone'; // default
    }

    init(data) {
        // Get the selected drone type from the StartScene
        if (data.selectedDrone) {
            this.selectedDrone = data.selectedDrone;
        }
    }


    preload() {
        // Ensure both drone types are loaded
        this.load.image('drone', 'assets/drone.png');
        this.load.image('drone2', 'assets/drone2.png');
        
        // Load other assets as before
        this.load.image('startBlock', 'assets/startBlock.png');
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
                // Check for victory
                if (this.turrets.countActive() === 0) {
                    this.scene.start('VictoryScene');
                }
            }
        }
    }

    startTurretFiring() {
        this.time.addEvent({
            delay: 2000,
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
                if (time > turret.lastFired + 2000) {
                    const angle = Phaser.Math.Angle.Between(
                        turret.x, turret.y,
                        this.drone.x, this.drone.y
                    );

                    const laser = this.physics.add.sprite(turret.x, turret.y, 'laser2');
                    this.turretLasers.add(laser);
                    laser.setScale(0.2);
                    laser.setTint(0xff0000);
                    laser.body.setSize(20, 4);

                    const speed = 150;
                    laser.setVelocity(
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed
                    );
                    laser.setRotation(angle);

                    this.time.delayedCall(3000, () => {
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
                this.scene.start('GameOverScene');
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
        this.drone = this.physics.add.sprite(x, y, this.selectedDrone);
        this.drone.setOrigin(0.5, 1);
        this.drone.setCollideWorldBounds(true);
        
        const targetWidth = 100;
        const scaleRatio = targetWidth / this.drone.width;
        this.drone.setScale(scaleRatio);
        
        // Make drone hitbox 5x larger
        const droneWidth = this.drone.displayWidth * 5;
        const droneHeight = this.drone.displayHeight * 5;
        this.drone.body.setSize(droneWidth, droneHeight);

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
            laser.body.setSize(20, 4);

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
            debug: true
        }
    },
    scene: [StartScene, GameScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);