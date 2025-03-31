document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const board = document.getElementById('board');
    const statusMessage = document.getElementById('status-message');
    const newGameButton = document.getElementById('new-game');
    const difficultySelect = document.getElementById('difficulty');
    const checkButton = document.getElementById('check');
    const hintButton = document.getElementById('hint');
    const solveButton = document.getElementById('solve');
    const numberButtons = document.querySelectorAll('.number');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    // Game state
    let selectedCell = null;
    let puzzle = [];
    let solution = [];
    let difficulty = 'easy';
    let hintsUsed = 0;
    
    // Timer variables
    let timerInterval = null;
    let seconds = 0;
    let minutes = 0;
    
    // Constants for difficulty levels (numbers to remove)
    const DIFFICULTY_LEVELS = {
        easy: 30,
        medium: 40,
        hard: 50
    };
    
    // Initialize game
    createBoard();
    generateNewGame();
    
    // Event listeners
    newGameButton.addEventListener('click', generateNewGame);
    difficultySelect.addEventListener('change', (e) => {
        difficulty = e.target.value;
        generateNewGame();
    });
    checkButton.addEventListener('click', checkSolution);
    hintButton.addEventListener('click', giveHint);
    solveButton.addEventListener('click', showSolution);
    
    numberButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (selectedCell && !selectedCell.classList.contains('fixed')) {
                const number = button.getAttribute('data-number');
                
                if (number === '0') {
                    selectedCell.textContent = '';
                    selectedCell.setAttribute('data-value', '0');
                } else {
                    selectedCell.textContent = number;
                    selectedCell.setAttribute('data-value', number);
                }
                
                selectedCell.classList.remove('error');
                checkForErrors();
            }
        });
    });
    
    /**
     * Timer functions
     */
    function startTimer() {
        // Reset timer if it's already running
        stopTimer();
        
        seconds = 0;
        minutes = 0;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            seconds++;
            if (seconds >= 60) {
                seconds = 0;
                minutes++;
            }
            updateTimerDisplay();
        }, 1000);
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    function updateTimerDisplay() {
        minutesElement.textContent = minutes.toString().padStart(2, '0');
        secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
    
    /**
     * Creates the 9x9 Sudoku board
     */
    function createBoard() {
        board.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-row', i);
                cell.setAttribute('data-col', j);
                cell.setAttribute('data-value', '0');
                
                // Add event listener to select cell
                cell.addEventListener('click', () => {
                    if (selectedCell) {
                        selectedCell.classList.remove('selected');
                    }
                    selectedCell = cell;
                    cell.classList.add('selected');
                });
                
                board.appendChild(cell);
            }
        }
    }
    
    /**
     * Generates a new Sudoku puzzle and solution
     */
    function generateNewGame() {
        // Reset status message
        statusMessage.textContent = '';
        statusMessage.className = '';
        
        // Reset hints counter
        hintsUsed = 0;
        
        // Generate a solved Sudoku board
        solution = generateSolvedGrid();
        
        // Create a puzzle by removing numbers from the solution
        puzzle = createPuzzle(solution, DIFFICULTY_LEVELS[difficulty]);
        
        // Reset the board with the new puzzle
        resetBoard();
        
        // Start the timer
        startTimer();
    }
    
    /**
     * Fills the board with the generated puzzle
     */
    function resetBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('selected', 'error', 'fixed', 'hint');
            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));
            const value = puzzle[row][col];
            
            cell.setAttribute('data-value', value);
            
            if (value === 0) {
                cell.textContent = '';
            } else {
                cell.textContent = value;
                cell.classList.add('fixed');
            }
        });
        
        selectedCell = null;
    }
    
    /**
     * Generates a solved Sudoku grid
     * @returns {Array} 9x9 solved Sudoku grid
     */
    function generateSolvedGrid() {
        // Initialize empty 9x9 grid
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        
        // Fill diagonal boxes first (they are independent)
        for (let i = 0; i < 9; i += 3) {
            fillBox(grid, i, i);
        }
        
        // Fill remaining cells
        solveSudoku(grid);
        
        return grid;
    }
    
    /**
     * Fill a 3x3 box with numbers 1-9
     * @param {Array} grid - The Sudoku grid
     * @param {number} row - Starting row of the box
     * @param {number} col - Starting column of the box
     */
    function fillBox(grid, row, col) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(nums);
        
        let index = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                grid[row + i][col + j] = nums[index++];
            }
        }
    }
    
    /**
     * Solve the Sudoku puzzle using backtracking
     * @param {Array} grid - The Sudoku grid to solve
     * @returns {boolean} Whether the puzzle was solved
     */
    function solveSudoku(grid) {
        let row = 0;
        let col = 0;
        let isEmpty = false;
        
        // Find empty cell
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (grid[i][j] === 0) {
                    row = i;
                    col = j;
                    isEmpty = true;
                    break;
                }
            }
            if (isEmpty) break;
        }
        
        // If no empty cell found, puzzle is solved
        if (!isEmpty) return true;
        
        // Try digits 1-9
        for (let num = 1; num <= 9; num++) {
            if (isSafe(grid, row, col, num)) {
                grid[row][col] = num;
                
                if (solveSudoku(grid)) {
                    return true;
                }
                
                grid[row][col] = 0;
            }
        }
        
        return false;
    }
    
    /**
     * Check if it's safe to place a number at the given position
     * @param {Array} grid - The Sudoku grid
     * @param {number} row - Row to check
     * @param {number} col - Column to check
     * @param {number} num - Number to check
     * @returns {boolean} Whether it's safe to place the number
     */
    function isSafe(grid, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) return false;
        }
        
        // Check column
        for (let x = 0; x < 9; x++) {
            if (grid[x][col] === num) return false;
        }
        
        // Check 3x3 box
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[i + startRow][j + startCol] === num) return false;
            }
        }
        
        return true;
    }
    
    /**
     * Creates a puzzle by removing numbers from a solved grid
     * @param {Array} solvedGrid - The fully solved Sudoku grid
     * @param {number} numbersToRemove - How many numbers to remove
     * @returns {Array} The puzzle grid with some numbers removed
     */
    function createPuzzle(solvedGrid, numbersToRemove) {
        // Create a deep copy of the solved grid
        const puzzle = JSON.parse(JSON.stringify(solvedGrid));
        
        // Create an array of all positions
        const positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        
        // Shuffle positions
        shuffleArray(positions);
        
        // Remove numbers
        let count = 0;
        while (count < numbersToRemove && positions.length > 0) {
            const [row, col] = positions.pop();
            const temp = puzzle[row][col];
            puzzle[row][col] = 0;
            
            // Check if the puzzle still has a unique solution
            const copy = JSON.parse(JSON.stringify(puzzle));
            if (countSolutions(copy) === 1) {
                count++;
            } else {
                // If not, restore the value
                puzzle[row][col] = temp;
            }
        }
        
        return puzzle;
    }
    
    /**
     * Count the number of solutions for a Sudoku puzzle
     * @param {Array} grid - The Sudoku grid to check
     * @returns {number} Number of solutions found
     */
    function countSolutions(grid) {
        let solutions = 0;
        
        function solve(g) {
            if (solutions > 1) return; // Stop if we found more than one solution
            
            let row = -1;
            let col = -1;
            let isEmpty = false;
            
            // Find empty cell
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (g[i][j] === 0) {
                        row = i;
                        col = j;
                        isEmpty = true;
                        break;
                    }
                }
                if (isEmpty) break;
            }
            
            // If no empty cell found, we found a solution
            if (!isEmpty) {
                solutions++;
                return;
            }
            
            // Try digits 1-9
            for (let num = 1; num <= 9; num++) {
                if (isSafe(g, row, col, num)) {
                    g[row][col] = num;
                    solve(g);
                    g[row][col] = 0;
                }
            }
        }
        
        solve(grid);
        return solutions;
    }
    
    /**
     * Shuffle array in place
     * @param {Array} array - Array to shuffle
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /**
     * Gives a hint by revealing one correct cell
     */
    function giveHint() {
        // Find all empty cells
        const cells = document.querySelectorAll('.cell');
        const emptyCells = Array.from(cells).filter(cell => {
            const value = parseInt(cell.getAttribute('data-value')) || 0;
            return value === 0;
        });
        
        if (emptyCells.length === 0) {
            statusMessage.textContent = '没有空白格子需要提示';
            statusMessage.className = 'error';
            return;
        }
        
        // Randomly select one empty cell
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const hintCell = emptyCells[randomIndex];
        
        // Get correct value from solution
        const row = parseInt(hintCell.getAttribute('data-row'));
        const col = parseInt(hintCell.getAttribute('data-col'));
        const correctValue = solution[row][col];
        
        // Fill in the value
        hintCell.textContent = correctValue;
        hintCell.setAttribute('data-value', correctValue);
        hintCell.classList.add('hint');
        
        // Update status message
        hintsUsed++;
        statusMessage.textContent = `已提示 ${hintsUsed} 次`;
        statusMessage.className = '';
        
        // Check for errors after adding the hint
        checkForErrors();
    }
    
    /**
     * Checks if the current state is a valid solution
     */
    function checkSolution() {
        const cells = document.querySelectorAll('.cell');
        let isComplete = true;
        let isCorrect = true;
        
        cells.forEach(cell => {
            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));
            const value = parseInt(cell.getAttribute('data-value')) || 0;
            
            if (value === 0) {
                isComplete = false;
            } else if (value !== solution[row][col]) {
                isCorrect = false;
            }
        });
        
        if (!isComplete) {
            statusMessage.textContent = '请完成整个数独!';
            statusMessage.className = 'error';
        } else if (!isCorrect) {
            statusMessage.textContent = '有错误，请检查!';
            statusMessage.className = 'error';
        } else {
            statusMessage.textContent = '恭喜，解决正确!';
            statusMessage.className = 'success';
            stopTimer();
        }
    }
    
    /**
     * Shows the solution for the current puzzle
     */
    function showSolution() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach(cell => {
            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));
            const value = solution[row][col];
            
            cell.textContent = value;
            cell.setAttribute('data-value', value);
            cell.classList.remove('error');
        });
        
        statusMessage.textContent = '已显示解决方案';
        statusMessage.className = '';
        
        stopTimer();
    }
    
    /**
     * Checks for errors in the current state
     */
    function checkForErrors() {
        const cells = document.querySelectorAll('.cell');
        
        // Clear all errors
        cells.forEach(cell => cell.classList.remove('error'));
        
        // Check rows
        for (let row = 0; row < 9; row++) {
            checkDuplicates(cells, cell => parseInt(cell.getAttribute('data-row')) === row);
        }
        
        // Check columns
        for (let col = 0; col < 9; col++) {
            checkDuplicates(cells, cell => parseInt(cell.getAttribute('data-col')) === col);
        }
        
        // Check 3x3 boxes
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                checkDuplicates(cells, cell => {
                    const row = parseInt(cell.getAttribute('data-row'));
                    const col = parseInt(cell.getAttribute('data-col'));
                    return Math.floor(row / 3) === boxRow && Math.floor(col / 3) === boxCol;
                });
            }
        }
    }
    
    /**
     * Checks for duplicates in a specific set of cells
     * @param {NodeList} cells - All cells
     * @param {Function} selector - Function to select cells to check
     */
    function checkDuplicates(cells, selector) {
        const values = {};
        const selectedCells = Array.from(cells).filter(selector);
        
        // First pass: count values
        selectedCells.forEach(cell => {
            const value = parseInt(cell.getAttribute('data-value')) || 0;
            if (value !== 0) {
                if (value in values) {
                    values[value].push(cell);
                } else {
                    values[value] = [cell];
                }
            }
        });
        
        // Second pass: mark duplicates
        Object.values(values).forEach(cells => {
            if (cells.length > 1) {
                cells.forEach(cell => cell.classList.add('error'));
            }
        });
    }
});
