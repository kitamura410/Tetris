import * as React from 'react';
import { useEffect, useReducer } from 'react';
import { TetrisView } from './TetrisView';
import { BlockCreator } from './BlockCreator'
const deepMerge = require('deepmerge')

interface Cell {
  exist: Boolean,
  backgroundColor: String
}

interface CellPosY {
  exist: Boolean,
  backgroundColor: String
}

interface CellPosX {
  0: CellPosY,
  1: CellPosY,
  2: CellPosY,
  3: CellPosY,
  4: CellPosY,
  5: CellPosY,
  6: CellPosY,
  7: CellPosY,
  8: CellPosY,
  9: CellPosY,
  10: CellPosY,
  11: CellPosY,
  12: CellPosY,
  13: CellPosY,
  14: CellPosY,
  15: CellPosY,
  16: CellPosY,
  17: CellPosY,
  18: CellPosY,
  19: CellPosY,
}

interface Cells {
  0: CellPosX,
  1: CellPosX,
  2: CellPosX,
  3: CellPosX,
  4: CellPosX,
  5: CellPosX,
  6: CellPosX,
  7: CellPosX,
  8: CellPosX,
  9: CellPosX,
}

const blankCell: Cell = {
  exist: false,
  backgroundColor: 'gray'
}

interface Block {
  name: String,
  axisOfRotation: {
    x: number,
    y: number
  }
  cells: Object,
}
const colNumber: number = 10;
const rowNumber: number = 20;

const getBlankCells = (): Cells => {
  let preCells;
  preCells = {}

  for (let x = 0; x < colNumber; x++) {
    preCells[x] = {}
  }
  for (let x = 0; x < colNumber; x++) {
    for (let y = 0; y < rowNumber; y++) {
      preCells[x][y] = blankCell
    }
  }

  const cells: Cells = preCells
  return cells
}

const shiftBlockPos = (shiftBlock: Block, addX: number, addY: number): Block => {
  const shiftedBlock = {
    name: shiftBlock.name,
    axisOfRotation: {
      x: null,
      y: null
    },
    cells: {}
  }
  for (let posXStr in shiftBlock.cells) {
    for (let posYStr in shiftBlock.cells[posXStr]) {
      const posX: number = Number(posXStr)
      const posY: number = Number(posYStr)

      if (!shiftedBlock.cells.hasOwnProperty(posX + addX)) {
        shiftedBlock.cells[posX + addX] = {}
      }
      if (!shiftedBlock.cells[posX + addX].hasOwnProperty(posY + addY)) {
        shiftedBlock.cells[posX + addX][posY + addY] = {}
      }
      shiftedBlock.cells[posX + addX][posY + addY] = shiftBlock.cells[posX][posY]
    }
  }
  shiftedBlock.axisOfRotation.x = shiftBlock.axisOfRotation.x + addX
  shiftedBlock.axisOfRotation.y = shiftBlock.axisOfRotation.y + addY
  return shiftedBlock
}

const shiftBlockIfStickout = (shiftBlock: Block): Block => {
  let shiftedBlock = {
    name: shiftBlock.name,
    axisOfRotation: shiftBlock.axisOfRotation,
    cells: {},
  }
  const overlapPos = {
    x: 0,
    y: 0
  }
  for (let posXStr in shiftBlock.cells) {
    for (let posYStr in shiftBlock.cells[posXStr]) {
      const posX: number = Number(posXStr)
      const posY: number = Number(posYStr)
      if (posX >= colNumber) {
        if (Math.abs(overlapPos.x) < Math.abs(colNumber - posX - 1)) overlapPos.x = colNumber - posX - 1
      }
      if (posX < 0) {
        if (Math.abs(overlapPos.x) < Math.abs(posX)) overlapPos.x = - posX
      }
      if (posY >= rowNumber) {
        if (Math.abs(overlapPos.y) < Math.abs(colNumber - posY - 1)) overlapPos.y = rowNumber - posY - 1
      }
      if (posY < 0) {
        if (Math.abs(overlapPos.y) < Math.abs(posY)) overlapPos.y = - posY
      }
    }
    shiftedBlock = shiftBlockPos(shiftBlock, overlapPos.x, overlapPos.y)
  }
  return shiftedBlock
}

const shiftBlockIfOverlaping = (fixedCells: Cells, shiftedBlock: Block, shiftBlock: Block): Block => {
  let noOverlapingBlock = {
    name: shiftedBlock.name,
    axisOfRotation: shiftedBlock.axisOfRotation,
    cells: {},
  }
  const overlapPos = {
    x: 0,
    y: 0
  }
  let pierceFlg = false;
  for (let posXStr in shiftedBlock.cells) {
    if (pierceFlg) overlapPos.x = overlapPos.x * 2;

    for (let posYStr in shiftedBlock.cells[posXStr]) {
      const posX: number = Number(posXStr)
      const posY: number = Number(posYStr)

      if (fixedCells[posX][posY].exist) {
        if (shiftBlock.axisOfRotation.x - posX > 0) {
          overlapPos.x = overlapPos.x ? overlapPos.x : 1;
          pierceFlg = true
        } else {
          overlapPos.x = overlapPos.x ? overlapPos.x : -1;
          pierceFlg = true
        }

        if (posX === shiftBlock.axisOfRotation.x) {
          if (Math.abs(posY) > Math.abs(overlapPos.y)) {
            if (posY > shiftedBlock.axisOfRotation.y) {
              overlapPos.y = shiftedBlock.axisOfRotation.y - posY
            } else {
              overlapPos.y = posY - shiftedBlock.axisOfRotation.y
            }
          }
        }
      }
    }
  }
  noOverlapingBlock = shiftBlockPos(shiftedBlock, overlapPos.x, overlapPos.y)

  return noOverlapingBlock
}

const spinActiveBlock = (fixedCells: Cells, spinBlock: Block) => {
  if (spinBlock.name === 'square') return spinBlock;

  let spinedBlockOrigin: Block = {
    ...spinBlock,
    axisOfRotation: {
      x: 0,
      y: 0
    },
    cells: {}
  }

  let spinBlockOrigin = shiftBlockPos(spinBlock, -spinBlock.axisOfRotation.x, -spinBlock.axisOfRotation.y);

  for (let posXStr in spinBlockOrigin.cells) {
    for (let posYStr in spinBlockOrigin.cells[posXStr]) {
      const posX: number = Number(posXStr)
      const posY: number = Number(posYStr)

      if (!spinedBlockOrigin.cells.hasOwnProperty(-posY)) {
        spinedBlockOrigin.cells[-posY] = {}
      }
      if (!spinedBlockOrigin.cells[-posY].hasOwnProperty(posX)) {
        spinedBlockOrigin.cells[-posY][posX] = {}
      }
      spinedBlockOrigin.cells[-posY][posX] = spinBlockOrigin.cells[posX][posY]
    }
  }

  let spinedBlock = shiftBlockPos(spinedBlockOrigin, spinBlock.axisOfRotation.x, spinBlock.axisOfRotation.y);

  spinedBlock = shiftBlockIfStickout(spinedBlock)
  spinedBlock = shiftBlockIfOverlaping(fixedCells, spinedBlock, spinBlock)

  if (!canExistBlock(fixedCells, spinedBlock)) return spinBlock

  return spinedBlock
}

const shouldFixActiveBlock = (activeBlock, fixedCells): Boolean => {
  for (let posXStr in activeBlock.cells) {
    for (let posYStr in activeBlock.cells[posXStr]) {
      const posX: number = Number(posXStr)
      const posY: number = Number(posYStr)
      // 一番下に落ちた時
      if (posY === rowNumber - 1) return true
      // 下にブロックがある時
      if (!activeBlock.cells[posX].hasOwnProperty(posY + 1) && fixedCells[posX][posY + 1].exist === true)
        return true;
    }
  }
  return false
}

const removeColIfFulledCol = (fixedCells: Cells): Cells => {
  const removeColList = extractColShouldRemove(fixedCells)

  let newFixedCells = fixedCells;
  removeColList.forEach((removePosY) => {
    newFixedCells = removeCol(removePosY, newFixedCells)
  })
  return newFixedCells
}

const extractColShouldRemove = (fixedCells: Cells) => {
  const removeColList = []
  for (let posYStr in fixedCells[0]) {
    const posY: number = Number(posYStr)
    let removeFlg = true;
    for (let posXStr in fixedCells) {
      const posX: number = Number(posXStr)
      if (!fixedCells[posX][posY].exist) removeFlg = false;
    }
    if (removeFlg) removeColList.push(posY)
  }
  return removeColList;
}

const removeCol = (removePosY: number, fixedCells: Cells): Cells => {
  const removedCells = getBlankCells();
  for (let posXStr in fixedCells) {
    for (let posYStr in fixedCells[posXStr]) {
      const posX: number = Number(posXStr)
      const posY: number = Number(posYStr)
      if (posY === 0) continue;

      if (posY > removePosY) removedCells[posX][posY] = fixedCells[posX][posY]

      removedCells[posX][posY] = fixedCells[posX][posY - 1]
    }
  }
  return removedCells
}

const canExistBlock = (fixedCells: Cells, block: Block): boolean => {
  for (let posXStr in block.cells) {
    for (let posYStr in block.cells[posXStr]) {
      const posX: number = Number(posXStr)
      const posY: number = Number(posYStr)

      if (posX < 0 || posX >= colNumber || posY < 0 || posY >= rowNumber) return false

      if (fixedCells[posX][posY].exist) return false
    }
  }
  return true
}


const reducer = (tetrisState, action) => {
  switch (action.type) {
    case 'putActiveBlock':
      const newBlock = BlockCreator();

      return {
        ...tetrisState,
        viewCells: deepMerge(tetrisState.fixedCells, newBlock.cells),
        activeBlock: newBlock
      }
    case 'shiftActiveBlockLeft':
      let leftShiftedBlock = shiftBlockPos(tetrisState.activeBlock, -1, 0)
      leftShiftedBlock = shiftBlockIfStickout(leftShiftedBlock)
      leftShiftedBlock = shiftBlockIfOverlaping(tetrisState.fixedCells, leftShiftedBlock, tetrisState.activeBlock)

      return {
        ...tetrisState,
        viewCells: deepMerge(tetrisState.fixedCells, leftShiftedBlock.cells),
        activeBlock: leftShiftedBlock
      }
    case 'shiftActiveBlockRight':
      let rightShiftedBlock = shiftBlockPos(tetrisState.activeBlock, 1, 0)
      rightShiftedBlock = shiftBlockIfStickout(rightShiftedBlock)
      rightShiftedBlock = shiftBlockIfOverlaping(tetrisState.fixedCells, rightShiftedBlock, tetrisState.activeBlock)

      return {
        ...tetrisState,
        viewCells: deepMerge(tetrisState.fixedCells, rightShiftedBlock.cells),
        activeBlock: rightShiftedBlock
      }
    case 'shiftActiveBlockUnder':
      let shiftedActiveBlock = shiftBlockPos(tetrisState.activeBlock, 0, 1)
      let newFixedCells = null;
      let newActiveBlock = null
      if (shouldFixActiveBlock(shiftedActiveBlock, tetrisState.fixedCells)) {
        newFixedCells = deepMerge(tetrisState.fixedCells, shiftedActiveBlock.cells)
        newFixedCells = removeColIfFulledCol(newFixedCells)
        newActiveBlock = BlockCreator()
      }

      return {
        ...tetrisState,
        viewCells: deepMerge(tetrisState.fixedCells, shiftedActiveBlock.cells),
        fixedCells: newFixedCells ? newFixedCells : tetrisState.fixedCells,
        activeBlock: newActiveBlock ? newActiveBlock : shiftedActiveBlock
      }
    case 'spinActiveBlock':
      const spinedBlock = spinActiveBlock(tetrisState.fixedCells, tetrisState.activeBlock);


      return {
        ...tetrisState,
        viewCells: deepMerge(tetrisState.fixedCells, spinedBlock.cells),
        activeBlock: spinedBlock
      }
    default: return tetrisState
  }
}
const Tetris = () => {
  const [tetrisState, dispatch] = useReducer(reducer, {
    viewCells: getBlankCells(),
    fixedCells: getBlankCells(),
    activeBlock: null
  })

  useEffect(() => {
    if (!tetrisState.activeBlock) return

    var timeoutId = setTimeout(() => {
      dispatch({ type: 'shiftActiveBlockUnder' })
    }, 300)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [tetrisState.activeBlock])

  return (
    <TetrisView
      cells={tetrisState.viewCells}
      clickEvent={{
        moveLeft: () => { dispatch({ type: 'shiftActiveBlockLeft' }) },
        moveRight: () => { dispatch({ type: 'shiftActiveBlockRight' }) },
        moveBottom: () => { dispatch({ type: 'shiftActiveBlockUnder' }) },
        startGame: () => { dispatch({ type: 'putActiveBlock' }) },
        spin: () => { dispatch({ type: 'spinActiveBlock' }) },
      }}
    />
  )
}

export { Tetris }