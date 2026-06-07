# Platform Fighter IO - Developer Tasks

## Developer A - Gameplay / Client



### Core Systems

* Set up Phaser 3 project
* Create player controller
* Implement movement

  * Move left/right
  * Jump
  * Double jump
* Create map and platforms
* Implement collision detection

### Combat

* Normal attack (J)
* Special attack (K)
* Attack hitboxes
* Shield system (Left Shift)
* Knockback effects
* Damage percentage system

### Visuals

* Player animations
* Attack animations
* Damage UI
* Stock UI
* Winner screen

### Game Logic

* Death detection
* Respawn system
* Stock system
* Win condition

---

## Developer B - Backend / Networking

### Server

* Set up Node.js server
* Set up WebSocket server
* Handle player connections
* Handle player disconnections

### Multiplayer

* Synchronize player movement
* Synchronize attacks
* Synchronize shield state
* Synchronize damage
* Synchronize stocks

### Game State

* Manage lobbies
* Manage matches
* Track players
* Handle deaths
* Handle respawns
* Handle win conditions

### Deployment

* Deploy server
* Monitor server logs
* Performance testing

---

## Shared

### Network Messages

```text
move
jump
attack
specialAttack
shieldStart
shieldEnd
```

### Player State

```text
id
x
y
velocity
damage
stocks
facing
shielding
```

### MVP Complete When

* Players can join a room
* Players can move and jump
* Players can attack and shield
* Damage and knockback work
* Stocks work
* Winner is declared
* Playable in browser with multiple players

```

A good rule is: **Developer A owns everything rendered in Phaser. Developer B owns everything sent over the network.** That minimizes merge conflicts and keeps responsibilities clear.
```
