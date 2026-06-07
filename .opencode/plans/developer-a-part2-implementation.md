# Developer A — Part 2 Implementation

## Problem
- Server sends `PLAYER_LIST`, `PLAYER_JOINED`, `PLAYER_LEFT`, `GAME_STATE`
- Client listens for `state` and `playerDisconnected` — **mismatch**
- No special attack (K key) support

## Files to change (all under `client/src/`)

### 1. `scenes/MenuScene.js`
**Remove:**
- `state` listener (line 40-46)

**Add:**
- `PLAYER_LIST` listener → set `this.playerCount = msg.players.length + 1`, update text
- `PLAYER_JOINED` listener → increment count, update text
- `PLAYER_LEFT` listener → decrement count, update text
- `GAME_STATE` listener → transition to GameScene

Also add `this.playerCount = 0` in `create()`.

### 2. `scenes/GameScene.js`
**Line 27:** Change keys to `'W,A,S,D,J,K,SHIFT'` (add K)

**Line 34:** Change `'state'` → `'GAME_STATE'`

**Line 37:** Change `'playerDisconnected'` → `'PLAYER_LEFT'`

**Method rename:** `handleDisconnect` → `handlePlayerLeft` (body same, uses `msg.playerId`)

**In `update()`:** Add:
```js
const specialAttack = Phaser.Input.Keyboard.JustDown(this.keys.K);
if (specialAttack) {
  this.connection.send('specialAttack');
}
```

**Update `handleLocalInput` call** to pass `specialAttack`:
```js
this.localPlayer.handleLocalInput({ left, right, jump, attack, specialAttack, shield });
```

### 3. `entities/Player.js`
**New state variables** (after `attackCooldown`):
```js
this.specialAttacking = false;
this.specialAttackTimer = 0;
this.specialAttackCooldown = 0;
```

**In `handleLocalInput`:**
- Extract `specialAttack` from input
- Add after normal attack check:
```js
if (specialAttack && !this.specialAttacking && !this.attacking && this.specialAttackCooldown <= 0) {
  this.startSpecialAttack();
}
```
- Update normal attack condition to also check `!this.specialAttacking`

**New method:**
```js
startSpecialAttack() {
  this.specialAttacking = true;
  this.specialAttackTimer = 300;
  this.specialAttackCooldown = 600;
}
```

**In `applyState`:** Add after `state.attacking` check:
```js
if (state.specialAttacking && !this.specialAttacking) {
  this.startSpecialAttack();
}
```

**In `preUpdate`:** Add special attack timer/cooldown logic (same pattern as normal attack)

**In `updateVisuals`:** Replace attack rendering with priority check:
```js
if (this.specialAttacking) {
  // Orange larger hitbox: 56x36, offset -68/+12
} else if (this.attacking) {
  // Yellow normal hitbox: 40x28, offset -56/+16
} else {
  // Hide
}
```

## After changes
Run: `cd client && npx vite build` to verify.
