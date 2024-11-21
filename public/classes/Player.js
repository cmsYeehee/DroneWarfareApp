class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'drone');
        this.init();
    }

    init() {
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setCollideWorldBounds(true);
        
        const targetWidth = 100;
        const scaleRatio = targetWidth / this.sprite.width;
        this.sprite.setScale(scaleRatio);
        
        const droneWidth = this.sprite.displayWidth * 5;
        const droneHeight = this.sprite.displayHeight * 5;
        this.sprite.body.setSize(droneWidth, droneHeight);

        this.sprite.data = {
            health: 100,
            energy: 100
        };

        this.lastFired = 0;
        this.fireRate = 200;
    }

    fireLaser(mouseX, mouseY) {
        const time = this.scene.time.now;
        if (time > this.lastFired) {
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x,
                this.sprite.y,
                mouseX,
                mouseY
            );

            const droneRadius = this.sprite.displayHeight / 2;
            const startX = this.sprite.x + Math.cos(angle) * droneRadius;
            const startY = this.sprite.y + Math.sin(angle) * droneRadius;

            const laser = this.scene.physics.add.sprite(startX, startY, 'laser');
            this.scene.droneLasers.add(laser);
            
            const laserScale = 0.375;
            laser.setScale(laserScale);
            laser.body.setSize(20, 4);

            const speed = 500;
            laser.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            laser.setRotation(angle);

            this.scene.time.delayedCall(2000, () => {
                if (laser && !laser.destroyed) {
                    laser.destroy();
                }
            });

            this.lastFired = time + this.fireRate;
            this.sprite.data.energy = Math.max(0, this.sprite.data.energy - 2);
            return true;
        }
        return false;
    }

    takeDamage(amount) {
        this.sprite.data.health -= amount;
        return this.sprite.data.health <= 0;
    }

    update(cursors, mouseX, mouseY) {
        const speed = 200;

        if (cursors.left.isDown) {
            this.sprite.setVelocityX(-speed);
        } else if (cursors.right.isDown) {
            this.sprite.setVelocityX(speed);
        } else {
            this.sprite.setVelocityX(0);
        }

        if (cursors.up.isDown) {
            this.sprite.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
            this.sprite.setVelocityY(speed);
        } else {
            this.sprite.setVelocityY(0);
        }

        const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            mouseX,
            mouseY
        );
        this.sprite.setRotation(angle + Math.PI / 2);

        if (!cursors.space.isDown) {
            this.sprite.data.energy = Math.min(100, this.sprite.data.energy + 0.1);
        }
    }
}