// AIDrone.js

class AIDrone {
    constructor(scene, sprite) {
        this.scene = scene;
        this.sprite = sprite;
        this.targetTurret = null;
        this.fireRate = 2000; // Slower firing rate
        this.lastFired = 0;
        this.fireDistance = 50;
    }

    update() {
        // Instead of this.sprite.data.health, use this.sprite.health
        if (!this.sprite || this.sprite.health <= 0) return;
    
        if (!this.targetTurret || !this.targetTurret.active) {
            this.targetTurret = this.findNearestTurret();
        }
    
        if (!this.targetTurret) {
            this.sprite.setVelocity(0, 0);
            return;
        }
    
        this.moveAndAttackTarget();
    }

    findNearestTurret() {
        let nearest = null;
        let nearestDist = Infinity;
    
        this.scene.turrets.getChildren().forEach(turret => {
            if (!turret.active) return;
            const dist = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                turret.x, turret.y
            );
    
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = turret;
            }
        });
    
        return nearest;
    }

    moveAndAttackTarget() {
        if (!this.targetTurret || !this.targetTurret.active) return;

        this.fireDistance = 200;
        const stopDistance = this.fireDistance - 50;

        const dist = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            this.targetTurret.x,
            this.targetTurret.y
        );

        const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            this.targetTurret.x,
            this.targetTurret.y
        );

        this.sprite.setRotation(angle + Math.PI / 2);

        if (dist < stopDistance) {
            this.sprite.setVelocity(0, 0);
            if (dist < this.fireDistance) {
                const time = this.scene.time.now;
                // Use this.sprite.energy here, not this.sprite.data.energy
                if (time > this.lastFired && this.sprite.energy > 0) {
                    this.fireLaserAtTurret(this.targetTurret);
                    this.lastFired = time + this.fireRate;
                    this.sprite.energy = Math.max(0, this.sprite.energy - 2);
                }
            }
        } else {
            const speed = 100; 
            this.sprite.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }
    }

    fireLaserAtTurret(turret) {
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            turret.x,
            turret.y
        );

        const droneRadius = this.sprite.displayHeight / 2;
        const startX = this.sprite.x + Math.cos(angle) * droneRadius;
        const startY = this.sprite.y + Math.sin(angle) * droneRadius;

        const laser = this.scene.physics.add.sprite(startX, startY, 'laser');
        this.scene.droneLasers.add(laser);
        
        const laserScale = 0.375;
        laser.setScale(laserScale);
        laser.body.setSize(20, 4);

        const speed = 300;
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
    }
}
