class Turret {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.turrets.create(x, y, 'turret');
        this.init();
    }

    init() {
        this.sprite.health = 5;
        this.sprite.setScale(1/15);
        this.sprite.lastFired = 0;
        this.sprite.body.immovable = true;
        this.sprite.body.setSize(this.sprite.width * 0.5, this.sprite.height * 0.5);
    }

    fireLaser(targetX, targetY) {
        const time = this.scene.time.now;
        if (time > this.sprite.lastFired + 2000) {
            const angle = Phaser.Math.Angle.Between(
                this.sprite.x,
                this.sprite.y,
                targetX,
                targetY
            );

            const laser = this.scene.physics.add.sprite(this.sprite.x, this.sprite.y, 'laser2');
            this.scene.turretLasers.add(laser);
            laser.setScale(0.2);
            laser.setTint(0xff0000);
            laser.body.setSize(20, 4);

            const speed = 150;
            laser.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            laser.setRotation(angle);

            this.scene.time.delayedCall(3000, () => {
                if (laser && !laser.destroyed) {
                    laser.destroy();
                }
            });

            this.sprite.lastFired = time;
            return laser;
        }
        return null;
    }

    takeDamage() {
        this.sprite.health--;
        return this.sprite.health <= 0;
    }

    isVisible(cameraView) {
        return (
            this.sprite.x >= cameraView.x && 
            this.sprite.x <= cameraView.x + cameraView.width &&
            this.sprite.y >= cameraView.y && 
            this.sprite.y <= cameraView.y + cameraView.height
        );
    }
}