// AIDrone.js
class AIDrone {
    constructor(scene, sprite) {
        this.scene = scene;
        this.sprite = sprite;
        this.targetTurret = null;
        this.fireRate = 2000; // Slower firing rate
        this.lastFired = 0;
        this.fireDistance = 200;
    }

    update() {
        if (!this.sprite || this.sprite.data.health <= 0) return;

        // Find nearest turret if none selected or turret destroyed
        if (!this.targetTurret || !this.targetTurret.active) {
            this.targetTurret = this.findNearestTurret();
        }

        if (this.targetTurret) {
            this.moveAndAttackTarget();
        }

        // Regenerate energy if not firing
        if (this.sprite.data.energy < 100 && !this.isFiring) {
            this.sprite.data.energy = Math.min(100, this.sprite.data.energy + 0.1);
        }
    }

    findNearestTurret() {
        let nearest = null;
        let nearestDist = Infinity;
        this.scene.turrets.getChildren().forEach(turret => {
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
        const dist = Phaser.Math.Distance.Between(
            this.sprite.x,
            this.sprite.y,
            this.targetTurret.x,
            this.targetTurret.y
        );
    
        // Always face the turret
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            this.targetTurret.x,
            this.targetTurret.y
        );
        this.sprite.setRotation(angle + Math.PI / 2);
    
        const time = this.scene.time.now;
    
        if (dist < this.fireDistance) {
            // Close enough to fire: Stop moving
            this.sprite.setVelocity(0, 0);
    
            // Fire if allowed
            if (time > this.lastFired && this.sprite.data.energy > 0) {
                this.fireLaserAtTurret(this.targetTurret);
                this.lastFired = time + this.fireRate;
                this.sprite.data.energy = Math.max(0, this.sprite.data.energy - 2);
            }
        } else {
            // Not close enough: move closer
            const speed = 10; 
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

        const speed = 5;
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
