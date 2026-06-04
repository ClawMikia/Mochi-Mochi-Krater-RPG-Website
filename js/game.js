class BattleEngine {
  constructor(team1, team2) {
    this.team1 = team1.map(m => ({ ...m, currentHp: m.hp, index: m.index, alive: true, moves: getMovesForMonster(m) }));
    this.team2 = team2.map(m => ({ ...m, currentHp: m.hp, index: m.index, alive: true, moves: getMovesForMonster(m) }));
    this.log = [];
    this.turn = 1;
    this.currentMonster = this.team1[0];
    this.opponent = this.team2[0];
    this.gameOver = false;
    this.winner = null;
  }

  getActiveMonster(team) {
    return team.find(m => m.alive) || null;
  }

  calculateDamage(attacker, defender, move) {
    const basePower = move.power || 40;
    const attack = attacker.atk;
    const defense = defender.def;
    const effectiveness = this.getTypeEffectiveness(move, defender);
    const randomFactor = 0.85 + Math.random() * 0.3;
    let damage = Math.floor((basePower + (attack * 0.3) - (defense * 0.2)) * effectiveness * randomFactor);
    damage = Math.max(1, damage);
    return { damage, effectiveness };
  }

  getTypeEffectiveness(move, defender) {
    const superEffective = {
      'Fire': ['Ice', 'Botany'],
      'Water': ['Fire', 'Geology'],
      'Electric': ['Water', 'Tech'],
      'Botany': ['Water', 'Geology'],
      'Ice': ['Botany', 'Wind'],
      'Dark': ['Sound', 'Internet'],
      'Sound': ['Dark', 'Electric'],
      'Tech': ['Internet', 'Appliances'],
      'Internet': ['Sound', 'Music'],
      'Geology': ['Fire', 'Ice'],
      'Math': ['Tech', 'Software'],
      'Physics': ['Math', 'Software'],
      'Chemistry': ['Botany', 'Geology'],
      'Biology': ['Botany', 'Food'],
      'Music': ['Sound', 'Internet'],
      'Breakfast': ['Dessert', 'Snack'],
      'Spice': ['Dessert', 'Food'],
      'Mexican': ['Fast Food', 'Snack'],
      'Feline': ['Marsupial', 'Rodent'],
      'Canine': ['Feline', 'Livestock'],
      'Bird': ['Insect', 'Mammal'],
      'Mammal': ['Bird', 'Reptile'],
      'Marsupial': ['Mammal', 'Lagomorph'],
      'Rodent': ['Reptile', 'Amphibian'],
      'Marine': ['Fire', 'Geology'],
      'Wind': ['Bird', 'Insect']
    };

    const notVeryEffective = {
      'Fire': ['Fire', 'Geology'],
      'Water': ['Water', 'Electric'],
      'Electric': ['Electric', 'Tech'],
      'Botany': ['Fire', 'Botany'],
      'Ice': ['Ice', 'Fire'],
      'Dark': ['Dark', 'Math'],
      'Sound': ['Sound', 'Dark'],
      'Tech': ['Electric', 'Tech'],
      'Internet': ['Internet', 'Tech'],
      'Geology': ['Geology', 'Water'],
      'Math': ['Math', 'Physics'],
      'Physics': ['Physics', 'Chemistry'],
      'Chemistry': ['Chemistry', 'Physics'],
      'Biology': ['Biology', 'Chemistry'],
      'Music': ['Music', 'Sound'],
      'Breakfast': ['Breakfast', 'Food'],
      'Spice': ['Spice', 'Mexican'],
      'Mexican': ['Mexican', 'Breakfast'],
      'Feline': ['Feline', 'Canine'],
      'Canine': ['Canine', 'Feline'],
      'Bird': ['Bird', 'Electric'],
      'Mammal': ['Mammal', 'Marsupial'],
      'Marsupial': ['Marsupial', 'Mammal'],
      'Rodent': ['Rodent', 'Bird'],
      'Marine': ['Water', 'Electric'],
      'Wind': ['Wind', 'Geology']
    };

    if (superEffective[move.type] && superEffective[move.type].includes(defender.type)) return 2.0;
    if (notVeryEffective[move.type] && notVeryEffective[move.type].includes(defender.type)) return 0.5;
    return 1.0;
  }

  attack(attackerTeam, defenderTeam, move) {
    const attacker = this.getActiveMonster(attackerTeam);
    const defender = this.getActiveMonster(defenderTeam);
    if (!attacker || !defender) return null;

    const { damage, effectiveness } = this.calculateDamage(attacker, defender, move);
    defender.currentHp = Math.max(0, defender.currentHp - damage);

    this.log.push({
      turn: this.turn,
      attacker: attacker.name,
      defender: defender.name,
      damage,
      effectiveness,
      move: move.name,
      defenderCurrentHp: defender.currentHp,
      defenderMaxHp: defender.hp,
      attackerTeam: attacker === this.currentMonster ? 'player1' : 'player2'
    });

    if (defender.currentHp <= 0) {
      defender.alive = false;
      this.log.push({
        turn: this.turn,
        message: `${defender.name} fainted!`,
        type: 'system'
      });

      const nextMonster = this.getActiveMonster(defenderTeam);
      if (!nextMonster) {
        this.gameOver = true;
this.winner = attackerTeam === this.team1 ? 'player' : 'cpu';
       this.log.push({
         turn: this.turn,
         message: `${this.winner === 'player' ? 'Player' : 'CPU'} wins!`,
         type: 'system'
       });
      } else if (nextMonster.id !== defender.id) {
        if (attackerTeam === this.team1) {
          this.opponent = nextMonster;
          this.log.push({
            turn: this.turn,
            message: `Opponent sent out ${nextMonster.name}!`,
            type: 'system'
          });
        } else {
          this.currentMonster = nextMonster;
          this.log.push({
            turn: this.turn,
            message: `Player sent out ${nextMonster.name}!`,
            type: 'system'
          });
        }
      }
    }

    if (this.turn >= 500) {
      this.gameOver = true;
      this.winner = 'draw';
    }

    this.turn++;
    return { attacker, defender, damage, effectiveness, move, defenderCurrentHp: defender.currentHp, defenderMaxHp: defender.hp };
  }

  switchMonster(team, monsterIndex) {
    const newMonster = team.find(m => m.index === monsterIndex && m.alive);
    if (!newMonster) return false;

    if (team === this.team1) this.currentMonster = newMonster;
    else this.opponent = newMonster;

    this.log.push({
      turn: this.turn,
      message: `${team === this.team1 ? 'Player' : 'CPU'} switched to ${newMonster.name}!`,
      type: 'system'
    });
    this.turn++;
    return true;
  }

  getState() {
    return {
      team1: this.team1,
      team2: this.team2,
      currentMonster: this.currentMonster,
      opponent: this.opponent,
      log: this.log,
      turn: this.turn,
      gameOver: this.gameOver,
      winner: this.winner
    };
  }

  cpuTurn() {
    const cpuTeam = this.team2;
    const playerTeam = this.team1;
    if (this.gameOver) return null;

    const activeMonster = this.getActiveMonster(cpuTeam);
    if (!activeMonster) return null;

    const shouldSwitch = Math.random() < 0.15;
    if (shouldSwitch) {
      const available = cpuTeam.filter(m => m.alive && m !== activeMonster);
      if (available.length > 0) {
        const chosen = available[Math.floor(Math.random() * available.length)];
        this.switchMonster(cpuTeam, chosen.index);
        return { action: 'switch', monster: chosen };
      }
    }

    const move = activeMonster.moves[Math.floor(Math.random() * activeMonster.moves.length)];
    const result = this.attack(cpuTeam, playerTeam, move);
    return { action: 'attack', ...result };
  }
}
