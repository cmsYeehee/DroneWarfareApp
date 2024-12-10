class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
        this.selectedDrone = null;
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('drone', 'assets/drone.png');
        this.load.image('drone2', 'assets/drone2.png');
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

        // Drone 1 selection
        this.createDroneButton(250, 300, 'drone', () => {
            this.selectedDrone = 'drone';
        });

        // Drone 2 selection
        this.createDroneButton(550, 300, 'drone2', () => {
            this.selectedDrone = 'drone2';
        });

        // Start Game Button
        this.createStartGameButton();
        
    }

    createDroneButton(x, y, droneType, onSelect) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 200, 200, 0x000000, 0.6)
            .setStrokeStyle(2, 0x00ffff);

        const dronePreview = this.add.image(0, -30, droneType);
        dronePreview.setScale(0.1);

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

        button.on('pointerdown', onSelect);
    }

    createStartGameButton() {
        const startButton = this.add.text(400, 500, 'START GAME', {
            fontSize: '32px',
            color: '#00ffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
            align: 'center'
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerdown', () => {
            if (this.selectedDrone) {
                this.cameras.main.fade(500, 0, 0, 0);
                this.time.delayedCall(500, () => {
                    this.scene.start('GameScene', { selectedDrone: this.selectedDrone });
                });
            }
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
        for (let i = 0; i < 100; i++) {
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

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.deployMode = true;
        this.lastFired = 0;
        this.fireRate = 200;
        this.selectedDrone = 'drone'; // default
        this.drones = [];
        this.maxDrones = 3;
        this.deployCount = 0;
        this.gameStarted = false;
    }

    init(data) {
        if (data.selectedDrone) {
            this.selectedDrone = data.selectedDrone;
        }
    }

    preload() {
        // Ensure both drone types are loaded
        this.load.image('drone', 'assets/drone.png');
        this.load.image('drone2', 'assets/drone2.png');
        
        // Load other assets
        this.load.image('startBlock', 'assets/startBlock.png');
        this.load.image('laser', 'assets/laser.png');
        this.load.image('laser2', 'assets/laser2.png');
        this.load.image('map', 'assets/map.png');
        this.load.image('turret', 'assets/turret.png');
    }

    create() {
        this.physics.world.setBounds(0, 0, 1600, 1200);
        this.dronesGroup = this.physics.add.group();
        this.map = this.add.image(0, 0, 'map')
            .setOrigin(0, 0)
            .setDisplaySize(1600, 1200);

        this.turrets = this.physics.add.group({
            collideWorldBounds: true,
            allowGravity: false
        });

        this.droneLasers = this.physics.add.group({ allowGravity: false });
        this.turretLasers = this.physics.add.group({ allowGravity: false });

        this.createTurrets();

        this.cameras.main.setBounds(0, 0, 1600, 1200);
        this.cameras.main.scrollX = 0;
        this.cameras.main.scrollY = 600;

        this.cursors = this.input.keyboard.createCursorKeys();

        this.createUI();
        this.createDeployment();

        // Overlap: droneLasers hit turrets
        this.physics.add.overlap(this.droneLasers, this.turrets, this.hitTurret, null, this);
    }

    findNearestDroneToTurret(turret) {
        let nearest = null;
        let nearestDist = Infinity;
    
        this.drones.forEach(drone => {
            if (drone.active && drone.health > 0) {
                const dist = Phaser.Math.Distance.Between(turret.x, turret.y, drone.x, drone.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = drone;
                }
            }
        });
    
        return nearest;
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

    createUI() {
        this.healthText = this.add.text(10, 550, 'Health: 100', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0);

        this.energyText = this.add.text(10, 570, 'Energy: 100', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0);

        this.add.text(10, 10, 'Click in start area to deploy drone (up to 3)\nArrow keys to move\nSpace to shoot\nPress BEGIN when ready', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0);
    }

    createDeployment() {
        this.deployZone = this.add.sprite(100, 1100, 'startBlock')
            .setOrigin(0.5, 0.5)
            .setInteractive();

        this.deployZone.on('pointerdown', () => {
            if (!this.gameStarted && this.deployCount < this.maxDrones) {
                this.deployDrone(100, 1100, this.deployCount);
                this.deployCount++;
            }
        });
        
        // Create a "BEGIN" button to start the game after placing drones
        this.beginButton = this.add.text(200, 1100, 'BEGIN', {
            fontSize: '24px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5, 0.5).setInteractive();

        this.beginButton.on('pointerdown', () => {
            if (this.deployCount > 0) { 
                this.startGame();
            }
        });
    }

    deployDrone(x, y, index) {
        const drone = this.physics.add.sprite(x + (index * 50), y, this.selectedDrone);
    
        if (index === 0) {
            this.setupPlayerDrone(drone);
        } else {
            this.setupAIDrone(drone);
        }
        this.drones.push(drone);
        this.dronesGroup.add(drone);
    }

    setupPlayerDrone(drone) {
        drone.setOrigin(0.5, 1);
        drone.setCollideWorldBounds(true);

        const targetWidth = 100;
        const scaleRatio = targetWidth / drone.width;
        drone.setScale(scaleRatio);

        const droneWidth = drone.displayWidth * 5;
        const droneHeight = drone.displayHeight * 5;
        drone.body.setSize(droneWidth, droneHeight);

        drone.health = 100;
        drone.energy = 100;
        
        this.playerDrone = drone;
        this.cameras.main.startFollow(this.playerDrone, true, 0.09, 0.09);
    }

    setupAIDrone(drone) {
        drone.setOrigin(0.5, 1);
        drone.setCollideWorldBounds(true);
    
        const targetWidth = 100;
        const scaleRatio = targetWidth / drone.width;
        drone.setScale(scaleRatio);
    
        const droneWidth = drone.displayWidth * 5;
        const droneHeight = drone.displayHeight * 5;
        drone.body.setSize(droneWidth, droneHeight);
    
        drone.health = 50;
        drone.energy = 100;
        drone.isAI = true;
    
        drone.aiController = new AIDrone(this, drone);
    }

    startGame() {
        this.gameStarted = true;
        if (this.deployZone) this.deployZone.destroy();
        if (this.beginButton) this.beginButton.destroy();

        this.startTurretFiring();
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
        if (!this.gameStarted) return;
        const cameraView = this.cameras.main.worldView;
        
        this.turrets.getChildren().forEach(turret => {
            const closestDrone = this.findNearestDroneToTurret(turret);
            if (!closestDrone) return;
    
            if (closestDrone.x >= cameraView.x && 
                closestDrone.x <= cameraView.x + cameraView.width &&
                closestDrone.y >= cameraView.y && 
                closestDrone.y <= cameraView.y + cameraView.height) {
                
                const time = this.time.now;
                if (time > turret.lastFired + 2000) {
                    const angle = Phaser.Math.Angle.Between(
                        turret.x, turret.y,
                        closestDrone.x, closestDrone.y
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
    
                    this.physics.add.overlap(laser, this.dronesGroup, (laser, drone) => {
                        if (!laser.destroyed) {
                            this.hitDrone(drone, laser);
                            laser.destroyed = true;
                        }
                    }, null, this);
                    
                    turret.lastFired = time;
                }
            }
        });
    }

    hitTurret(laser, turret) {
        if (!laser.destroyed) {
            laser.destroyed = true;
            laser.destroy();
            turret.health--;
            if (turret.health <= 0) {
                turret.destroy();
                if (this.turrets.countActive() === 0) {
                    this.scene.start('VictoryScene');
                }
            }
        }
    }

    hitDrone(drone, laser) {
        drone.health -= 10;
        if (drone === this.playerDrone && drone.health <= 0) {
            this.scene.start('GameOverScene');
        } else if (drone !== this.playerDrone && drone.health <= 0) {
            drone.destroy();
        }
    }

    firePlayerLaser(drone, mouseX, mouseY) {
        const time = this.time.now;
        if (time > this.lastFired) {
            const angle = Phaser.Math.Angle.Between(drone.x, drone.y, mouseX, mouseY);

            const droneRadius = drone.displayHeight / 2;
            const startX = drone.x + Math.cos(angle) * droneRadius;
            const startY = drone.y + Math.sin(angle) * droneRadius;

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
            drone.energy = Math.max(0, drone.energy - 2);
            this.updateUI();
        }
    }

    updateUI() {
        if (this.playerDrone) {
            this.healthText.setText(`Health: ${Math.floor(this.playerDrone.health)}`);
            this.energyText.setText(`Energy: ${Math.floor(this.playerDrone.energy)}`);
        }
    }

    update() {
        if (this.gameStarted && this.playerDrone && this.playerDrone.active && this.playerDrone.health > 0) {
            const speed = 200;
            if (this.cursors.left.isDown) {
                this.playerDrone.setVelocityX(-speed);
            } else if (this.cursors.right.isDown) {
                this.playerDrone.setVelocityX(speed);
            } else {
                this.playerDrone.setVelocityX(0);
            }

            if (this.cursors.up.isDown) {
                this.playerDrone.setVelocityY(-speed);
            } else if (this.cursors.down.isDown) {
                this.playerDrone.setVelocityY(speed);
            } else {
                this.playerDrone.setVelocityY(0);
            }

            const mouseX = this.input.x + this.cameras.main.scrollX;
            const mouseY = this.input.y + this.cameras.main.scrollY;
            const angle = Phaser.Math.Angle.Between(
                this.playerDrone.x,
                this.playerDrone.y,
                mouseX,
                mouseY
            );
            this.playerDrone.setRotation(angle + Math.PI / 2);

            if (this.cursors.space.isDown && this.playerDrone.energy > 0) {
                this.firePlayerLaser(this.playerDrone, mouseX, mouseY);
            }

            if (!this.cursors.space.isDown) {
                this.playerDrone.energy = Math.min(100, this.playerDrone.energy + 0.1);
                this.updateUI();
            }
        }

        if (this.gameStarted) {
            this.drones.forEach((drone, index) => {
                if (index > 0 && drone.active && drone.health > 0 && drone.aiController) {
                    drone.aiController.update();
                }
            });
        }
    }

    findNearestTurret(drone) {
        let nearest = null;
        let nearestDist = Infinity;
        this.turrets.getChildren().forEach(turret => {
            const dist = Phaser.Math.Distance.Between(drone.x, drone.y, turret.x, turret.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = turret;
            }
        });
        return nearest;
    }

    fireAIDroneLaser(drone, turret) {
        const angle = Phaser.Math.Angle.Between(
            drone.x,
            drone.y,
            turret.x,
            turret.y
        );

        const droneRadius = drone.displayHeight / 2;
        const startX = drone.x + Math.cos(angle) * droneRadius;
        const startY = drone.y + Math.sin(angle) * droneRadius;

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
    scene: [StartScene, GameScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);
