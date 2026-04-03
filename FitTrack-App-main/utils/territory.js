import { MAP_ROWS, MAP_COLS } from '../constants';

export function initTerritory() {
  const grid = Array(MAP_ROWS).fill(null).map(() => Array(MAP_COLS).fill(null));
  const paint = (player, cells) =>
    cells.forEach(([r, c]) => { if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) grid[r][c] = player; });

  paint('you',    [[5,3],[5,4],[5,5],[6,3],[6,4],[6,5],[7,4],[7,5],[8,4],[8,5],[9,4],[9,5],[10,4],[10,5],[11,4],[11,5],[12,4],[12,5]]);
  paint('marcus', [[2,8],[2,9],[2,10],[2,11],[3,8],[3,9],[3,10],[3,11],[4,8],[4,9],[4,10],[4,11],[5,8],[5,9],[5,10],[5,11],[6,8],[6,9],[6,10],[6,11],[7,8],[7,9],[7,10],[7,11],[8,8],[8,9],[8,10],[8,11],[9,8],[9,9],[9,10],[9,11],[10,8],[10,9],[10,10],[10,11],[11,8],[11,9],[11,10],[11,11],[12,8],[12,9]]);
  paint('priya',  [[14,3],[14,4],[14,5],[15,3],[15,4],[15,5],[16,3],[16,4],[16,5],[17,3],[17,4],[17,5],[18,3],[18,4],[18,5]]);
  paint('jake',   [[13,11],[13,12],[14,11],[14,12],[15,11],[15,12],[16,11],[16,12],[17,11]]);
  return grid;
}

export function countCells(territory, owner) {
  return territory.flat().filter(c => c === owner).length;
}

export function isAdjacentToPlayer(territory, row, col) {
  return [[row-1,col],[row+1,col],[row,col-1],[row,col+1]]
    .filter(([r,c]) => r>=0 && r<MAP_ROWS && c>=0 && c<MAP_COLS)
    .some(([r,c]) => territory[r][c] === 'you');
}
