export class Physics {
    constructor() {

    }

    checkCollision(entity1, entity2) {
        if (!entity1.active || !entity2.active) return false;

        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        
        const distanceSquared = dx * dx + dy * dy;
        const radiiSum = (entity1.radius || 10) + (entity2.radius || 10);

        

        return distanceSquared < (radiiSum * radiiSum);
    }
}