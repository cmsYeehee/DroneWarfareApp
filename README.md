# DroneWarfareApp
Here is what has been completed so far.
    The program uses phaser as it engine, you don't need to download anything, you can either doload or link it in code using 
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>


Visual textures have been added to the game in the assets class

So far, Three classes have been made, the Turret, Player and game classes

Turret: Manages Defensive turrets, including targeting and firing at the player as well as the health and the damage they deal

Player: Incorporates the spawning of the player drone and controlling that one drone, with controls and firing implemented.

game: Runs the game and background, implementing the scrolling screen mechanic and the spawn area of the map.

What needs to continue to be worked on:

Please implement adding drone2 in the assets folder so that the player can place multiple drones or play different drones. This should be updated by creating a new class, called the AI drone class which makes the non-player drones have AI. Currently, only one drone can be placed, and I want multiple drones to be allowed to be placed and AI behavior specified in the techSpec to be operational for those other drones.



To restate what I want to be worked on

1. Changing starting area so multiple drones can be placed, up to 3 drones. Add a start button the player clicks to initiate the game now, rather than just slicking on the deployment area

Drone2 asset has been made and now is selectable. multiple drone feature still needs to be worked on.

2. Giving the player the two options to place down the two different types of drones
3. Adding AI to the non-player controlled drones, the player drone will be the first drone placed down. This AI behavior is specified as follows. Should look for the nearest turret as fire at it while rotating clockwise slowly around that target.


Adding a game over screen drone has been destroyed or a victory screen when all turrets on the map are destroyed.


