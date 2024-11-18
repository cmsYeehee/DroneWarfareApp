class DeployScene extends Phaser.Scene {
    constructor() {
        super('DeployScene');
        this.deployMode = true;
        this.drone = null;
        this.deployZone = null;
        this.lastFired = 0;
        this.fireRate = 200;
    }

    preload() {
        // Load sprites from assets folder
        this.load.image('drone', 'assets/drone.png');
        this.load.image('laser', 'assets/laser.png');
    }

    create() {
        // Create deployment zone
        this.deployZone = this.add.rectangle(100, 300, 200, 150, 0x666666, 0.5);
        this.deployZone.setInteractive();

        // Instructions text
        this.add.text(10, 10, 'Click in gray zone to deploy drone\nArrow keys to move\nSpace to shoot', {
            font: '16px Arial',
            fill: '#ffffff'
        });

        // Handle deployment click
        this.deployZone.on('pointerdown', (pointer) => {
            if (this.deployMode && !this.drone) {
                this.createDrone(pointer.x, pointer.y);
                this.deployMode = false;
            }
        });

        // Set up controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create group for lasers
        this.lasers = this.add.group();
    }

    createDrone(x, y) {
        this.drone = this.physics.add.sprite(x, y, 'drone');
        this.drone.setCollideWorldBounds(true);
        
        // Scale drone to be about half the size of deploy zone (200x150)
        const targetWidth = 100; // Half of deploy zone width
        const scaleRatio = targetWidth / this.drone.width;
        this.drone.setScale(scaleRatio);
        
        // Add drag to make movement smoother
        this.drone.setDamping(true);
        this.drone.setDrag(0.95);
        
        // Add drone stats
        this.drone.data = {
            health: 100,
            energy: 100
        };

        // Add UI for drone stats
        this.healthText = this.add.text(10, 550, `Health: ${this.drone.data.health}`, {
            font: '16px Arial',
            fill: '#ffffff'
        });
        this.energyText = this.add.text(10, 570, `Energy: ${this.drone.data.energy}`, {
            font: '16px Arial',
            fill: '#ffffff'
        });
    }

    fireLaser() {
        const time = this.time.now;
        if (time > this.lastFired) {
            // Position laser at bottom of drone
            const laser = this.physics.add.sprite(
                this.drone.x, 
                this.drone.y + (this.drone.displayHeight / 3), 
                'laser'
            );
            
            // Scale laser to be 1/8 of drone size
            const laserScale = (this.drone.displayWidth / 8) / laser.width;
            laser.setScale(laserScale);
            
            laser.setVelocityX(400);
            
            // Remove laser after 1.5 seconds
            this.time.delayedCall(1500, () => {
                laser.destroy();
            });

            this.lastFired = time + this.fireRate;
            
            // Decrease energy on fire
            this.drone.data.energy = Math.max(0, this.drone.data.energy - 2);
            this.updateUI();
        }
    }

    updateUI() {
        if (this.drone) {
            this.healthText.setText(`Health: ${Math.floor(this.drone.data.health)}`);
            this.energyText.setText(`Energy: ${Math.floor(this.drone.data.energy)}`);
        }
    }

    update() {
        if (this.drone) {
            // Calculate velocity based on input
            let velocityX = 0;
            let velocityY = 0;
            const speed = 160;

            if (this.cursors.left.isDown) {
                velocityX = -speed;
            } else if (this.cursors.right.isDown) {
                velocityX = speed;
            }

            if (this.cursors.up.isDown) {
                velocityY = -speed;
            } else if (this.cursors.down.isDown) {
                velocityY = speed;
            }

            // Apply diagonal movement correction
            if (velocityX !== 0 && velocityY !== 0) {
                velocityX *= 0.707;
                velocityY *= 0.707;
            }

            // Set velocity
            this.drone.setVelocity(velocityX, velocityY);

            // Handle shooting
            if (this.cursors.space.isDown && this.drone.data.energy > 0) {
                this.fireLaser();
            }

            // Regenerate energy when not firing
            if (!this.cursors.space.isDown) {
                this.drone.data.energy = Math.min(100, this.drone.data.energy + 0.1);
                this.updateUI();
            }
        }
    }
}
 //aa
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
    scene: DeployScene
};

const game = new Phaser.Game(config);