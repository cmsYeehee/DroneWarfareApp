class AIDrone {
    constructor(scene, sprite) {
        console.log('AIDrone constructor called with:', {
            sceneExists: !!scene,
            spriteExists: !!sprite
        });
        this.scene = scene;
        this.sprite = sprite;
        this.targetTurret = null;
        this.fireRate = 2000; // Slower firing rate
        this.lastFired = 0;
        this.fireDistance = 200; // Matching the value in moveAndAttackTarget
        
        console.log('AIDrone constructor complete');
    }

    update() {
        console.log('AIDrone update called');
        // Instead of this.sprite.data.health, use this.sprite.health
        if (!this.sprite || this.sprite.health <= 0) {
            console.log('Sprite invalid or health <= 0, skipping update');
            return;
        }
    
        if (!this.targetTurret || !this.targetTurret.active) {
            console.log('Finding new target turret');
            this.targetTurret = this.findNearestTurret();
            console.log('New target turret found:', !!this.targetTurret);
        }
    
        if (!this.targetTurret) {
            console.log('No valid target turret, stopping movement');
            this.sprite.setVelocity(0, 0);
            return;
        }
    
        this.moveAndAttackTarget();
    }

    findNearestTurret() {
        console.log('Finding nearest turret');
        let nearest = null;
        let nearestDist = Infinity;
    
        const turrets = this.scene.turrets.getChildren();
        console.log('Available turrets:', turrets.length);
    
        turrets.forEach(turret => {
            if (!turret.active) return;
            const dist = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                turret.x, turret.y
            );
    
            console.log('Checking turret distance:', dist);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = turret;
                console.log('New nearest turret found at distance:', dist);
            }
        });
    
        return nearest;
    }

    moveAndAttackTarget() {
        if (!this.targetTurret || !this.targetTurret.active) {
            console.log('Target turret invalid, skipping movement');
            return;
        }

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

        const stopDistance = this.fireDistance - 50;
        console.log('Current distance to target:', dist, 'Stop distance:', stopDistance);

        if (dist < stopDistance) {
            console.log('Within stop distance, halting movement');
            this.sprite.setVelocity(0, 0);
            if (dist < this.fireDistance) {
                const time = this.scene.time.now;
                if (time > this.lastFired && this.sprite.energy > 0) {
                    console.log('Firing at turret');
                    this.fireLaserAtTurret(this.targetTurret);
                    this.lastFired = time + this.fireRate;
                    this.sprite.energy = Math.max(0, this.sprite.energy - 2);
                }
            }
        } else {
            const speed = 100;
            console.log('Moving towards target with speed:', speed);
            this.sprite.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }
    }

    fireLaserAtTurret(turret) {
        console.log('Firing laser at turret');
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

        console.log('Laser fired with properties:', {
            startPosition: { x: startX, y: startY },
            angle: angle,
            speed: speed
        });

        this.scene.time.delayedCall(2000, () => {
            if (laser && !laser.destroyed) {
                laser.destroy();
                console.log('Laser destroyed after timeout');
            }
        });
    }
}

// Make sure AIDrone is globally accessible
window.AIDrone = AIDrone;