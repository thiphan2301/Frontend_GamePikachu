class GameEngine {
    constructor(level = 1) {
        this.currentLevel = level;
        this.setupLevelConfig(level);
        this.board = [];
        this.selectedCell = null;
        this.score = 0;
        this.icons = ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png", "11.png", "12.png", "13.png", "14.png", "15.png", "16.png", "17.png", "18.png", "19.png", "20.png", "21.png", "22.png", "23.png", "24.png", "25.png", "26.png", "27.png", "28.png", "29.png", "30.png", "31.png", "32.png", "33.png", "34.png", "35.png", "36.png"];
        this.timeLeft = 360;
        this.timerInterval = null;
        this.isFrozen = false;
        this.lives = 5;

        this.initMatrix();
        this.renderDOM();
        this.startTimer();
    }

    // Quản lý cấu hình theo từng Cấp Độ
    setupLevelConfig(level) {
        const levelElement = document.getElementById("level");

        // reset lv cũ khi sang level mới
        this.hasBomb = false;
        this.hasConveyor = false;
        this.hasGravity = false;
        this.hasObstacle = false;
        this.hasBlinking = false;
        this.bombTimeLeft = 0;
        this.conveyorCountdown = 0;

        switch (level) {
            case 1:
                this.rows = 6;
                this.cols = 10;
                break;
            case 2:
                this.rows = 7;
                this.cols = 11;
                this.hasGravity = true;
                break;
            case 3:
                this.rows = 8;
                this.cols = 12;
                this.hasObstacle = true;
                break;
            case 4:
                this.rows = 9;
                this.cols = 13;
                this.hasBlinking = true;
                break;
            case 5:
                this.rows = 9;
                this.cols = 13;
                this.hasBomb = true;
                this.bombTimeLeft = 50;
                break;
            case 6:
                this.rows = 8;
                this.cols = 12;
                this.hasConveyor = true;
                this.conveyorCountdown = 8;
                break;
            case 7:
                this.rows = 8;
                this.cols = 12;
                this.hasGravity = true;
                this.hasObstacle = true;
                break;
            case 8:
                this.rows = 9;
                this.cols = 13;
                this.hasBlinking = true;
                this.hasBomb = true;
                this.bombTimeLeft = 40; // Rút ngắn thời gian bom cho độ khó cao
                break;
            default:
                this.rows = 9;
                this.cols = 13;
                break;
        }

        // Cập nhật giá trị hiển thị lv hiện tại trên view
        if (levelElement) {
            levelElement.innerText = this.currentLevel;
        }
    }

    initMatrix() {
        let totalPlayableCells = this.rows * this.cols;
        let items = [];

        let obstacleCount = this.hasObstacle ? 8 : 0;
        let actualPlayable = totalPlayableCells - obstacleCount;

        // bớt 2 ô để thay bằng 2 quả bom cho lv5
        let bombCount = (this.currentLevel === 5) ? 2 : 0;

        for (let i = 0; i < actualPlayable; i += 2) {
            let randomIcon = this.icons[Math.floor(Math.random() * this.icons.length)];
            items.push(randomIcon, randomIcon);
        }

        // Thêm cặp icon quả bom nếu là lv5 (để người chơi phải tìm và nối 2 quả bom với nhau để gỡ)
        if (this.hasBomb) {
            items.push("bomb.png", "bomb.png"); // Bạn có thể chuẩn bị sẵn một file ảnh bomb.png trong thư mục image/pokemon/
        }

        // Thuật toán Fisher-Yates Shuffle
        for (let i = items.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = items[i];
            items[i] = items[j];
            items[j] = temp;
        }

        for (let r = 0; r <= this.rows + 1; r++) {
            this.board[r] = [];
            for (let c = 0; c <= this.cols + 1; c++) {
                if (r === 0 || r === this.rows + 1 || c === 0 || c === this.cols + 1) {
                    this.board[r][c] = 0;
                } else {
                    // Logic lv3 Sinh chướng ngại vật (-1)
                    if (this.hasObstacle && Math.random() < 0.15 && obstacleCount > 0) {
                        this.board[r][c] = -1;
                        obstacleCount--;
                    } else if (items.length > 0) {
                        this.board[r][c] = items.pop();
                    } else {
                        this.board[r][c] = 0;
                    }
                }
            }
        }
    }

    renderDOM() {
        const boardEl = document.getElementById('game-board');
        boardEl.style.gridTemplateColumns = `repeat(${this.cols}, 50px)`;
        boardEl.style.gridTemplateRows = `repeat(${this.rows}, 50px)`;
        boardEl.innerHTML = '';

        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (this.board[r][c] === -1) {
                    cell.classList.add('obstacle');
                    const icon = document.createElement('i');
                    icon.className = "fa-solid fa-cube";
                    icon.style.color = "#00f3ff";
                    cell.appendChild(icon);
                } else if (this.board[r][c] !== 0) {
                    const img = document.createElement('img');

                    // Kiểm tra nếu là quả bom (cho Level 5 và Level 8)
                    if (this.board[r][c] === "bomb.png") {
                        cell.classList.add('bomb');
                        img.src = `./image/pokemon/bomb.png`;
                    } else {
                        img.src = `./image/pokemon/${this.board[r][c]}`;
                    }

                    img.alt = "pokemon";
                    img.style.width = '80%';
                    img.style.height = '80%';
                    img.style.objectFit = 'contain';
                    img.style.pointerEvents = 'none';

                    // Hiệu ứng ẩn hiện nhấp nháy (Áp dụng cho Level 4 và Level 8 qua this.hasBlinking)
                    if (this.hasBlinking) {
                        img.classList.add('blinking-icon');
                    }

                    cell.appendChild(img);
                } else {
                    cell.classList.add('empty');
                }

                cell.addEventListener('click', () => this.handleLogic(r, c, cell));
                boardEl.appendChild(cell);
            }
        }
    }

    handleLogic(r, c, cellElement) {
        if (this.board[r][c] === 0 || this.board[r][c] === -1) return;

        if (!this.selectedCell) {
            this.selectedCell = {
                r,
                c,
                el: cellElement
            };
            cellElement.classList.add('selected');
        } else {
            let prev = this.selectedCell;

            if (prev.r === r && prev.c === c) {
                prev.el.classList.remove('selected');
                this.selectedCell = null;
                return;
            }

            if (this.board[prev.r][prev.c] === this.board[r][c]) {
                let pathPoints = [];
                if (this.bfsPathFinder(prev.r, prev.c, r, c, pathPoints)) {
                    // Vẽ đường nối neon sáng trên giao diện
                    this.drawPath(pathPoints);

                    // Cập nhật ma trận
                    this.board[prev.r][prev.c] = 0;
                    this.board[r][c] = 0;

                    prev.el.classList.remove('selected');
                    setTimeout(() => {
                        prev.el.classList.add('empty');
                        cellElement.classList.add('empty');
                    }, 250);

                    this.score += 10;
                    document.getElementById('score').innerText = this.score;

                    // Logic Trọng lực
                    if (this.hasGravity) {
                        this.applyGravity();
                    }

                    this.checkWinCondition();
                } else {
                    prev.el.classList.remove('selected');
                    this.handleWrongSelection();
                }
            } else {
                prev.el.classList.remove('selected');
                this.handleWrongSelection();
            }
            this.selectedCell = null;
        }
    }

    // Vẽ đường line nối 2 ô
    drawPath(points) {
        const boardEl = document.getElementById('game-board');
        let simplifiedPoints = [points[0]];
        for (let i = 1; i < points.length - 1; i++) {
            let prev = points[i - 1];
            let curr = points[i];
            let next = points[i + 1];
            if (!((prev.r === curr.r && curr.r === next.r) || (prev.c === curr.c && curr.c === next.c))) {
                simplifiedPoints.push(curr);
            }
        }
        simplifiedPoints.push(points[points.length - 1]);

        let lineElements = [];
        for (let i = 0; i < simplifiedPoints.length - 1; i++) {
            let p1 = simplifiedPoints[i];
            let p2 = simplifiedPoints[i + 1];

            let cellWidth = 56; // 50px cell + 6px gap
            let x1 = (p1.c - 1) * cellWidth + 25 + 20;
            let y1 = (p1.r - 1) * cellWidth + 25 + 20;
            let x2 = (p2.c - 1) * cellWidth + 25 + 20;
            let y2 = (p2.r - 1) * cellWidth + 25 + 20;

            const line = document.createElement('div');
            line.className = 'line-segment';

            if (p1.r === p2.r) {
                line.style.top = `${y1 - 3}px`;
                line.style.left = `${Math.min(x1, x2)}px`;
                line.style.width = `${Math.abs(x1 - x2)}px`;
                line.style.height = `6px`;
            } else {
                line.style.left = `${x1 - 3}px`;
                line.style.top = `${Math.min(y1, y2)}px`;
                line.style.width = `6px`;
                line.style.height = `${Math.abs(y1 - y2)}px`;
            }

            boardEl.appendChild(line);
            lineElements.push(line);
        }

        setTimeout(() => {
            lineElements.forEach(line => line.remove());
        }, 350);
    }

    // Xử lý trọng lực
    applyGravity() {
        for (let c = 1; c <= this.cols; c++) {
            for (let r = this.rows; r > 1; r--) {
                if (this.board[r][c] === 0) {
                    for (let k = r - 1; k >= 1; k--) {
                        if (this.board[k][c] !== 0 && this.board[k][c] !== -1) {
                            this.board[r][c] = this.board[k][c];
                            this.board[k][c] = 0;
                            break;
                        }
                    }
                }
            }
        }
        setTimeout(() => this.renderDOM(), 250);
    }

    checkWinCondition() {
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.board[r][c] !== 0 && this.board[r][c] !== -1) return;
            }
        }
        clearInterval(this.timerInterval);
        alert(`Chúc mừng! Hoàn thành Cấp Độ ${this.currentLevel}! Chuyển sang màn tiếp theo.`);

        this.currentLevel++;
        if (this.currentLevel > 8) this.currentLevel = 1;

        this.setupLevelConfig(this.currentLevel);
        this.board = [];
        this.timeLeft = 360;
        this.initMatrix();
        this.renderDOM();
        this.startTimer();
    }

    handleWrongSelection() {
        this.lives--;
        this.updateHeartsUI();
        if (this.lives <= 0) {
            clearInterval(this.timerInterval);
            alert("Hết mạng! Game Over!");
            location.reload();
        }
    }

    updateHeartsUI() {
        const heartIcons = document.querySelectorAll('.count-die .fa-heart');
        heartIcons.forEach((heart, index) => {
            heart.style.opacity = index < this.lives ? "1" : "0.2";
        });
    }

    bfsPathFinder(r1, c1, r2, c2, pathPoints = null) {
        let queue = [];
        let visited = Array.from({
                length: this.rows + 2
            }, () =>
            Array.from({
                length: this.cols + 2
            }, () => [-1, -1, -1, -1])
        );
        let parentMap = {};

        const dR = [-1, 0, 1, 0];
        const dC = [0, 1, 0, -1];

        for (let dir = 0; dir < 4; dir++) {
            queue.push({
                r: r1,
                c: c1,
                direction: dir,
                turns: 0
            });
            visited[r1][c1][dir] = 0;
        }

        while (queue.length > 0) {
            let current = queue.shift();

            if (current.r === r2 && current.c === c2) {
                if (pathPoints) {
                    let currKey = `${current.r},${current.c},${current.direction}`;
                    let tempPath = [{
                        r: r2,
                        c: c2
                    }];
                    while (parentMap[currKey]) {
                        let prev = parentMap[currKey];
                        tempPath.push({
                            r: prev.r,
                            c: prev.c
                        });
                        currKey = `${prev.r},${prev.c},${prev.dir}`;
                    }
                    tempPath.reverse();
                    pathPoints.push(...tempPath);
                }
                return true;
            }

            for (let i = 0; i < 4; i++) {
                let nextR = current.r + dR[i];
                let nextC = current.c + dC[i];
                let nextTurns = current.turns + (current.direction !== i ? 1 : 0);

                if (nextTurns > 2) continue;

                if (nextR >= 0 && nextR <= this.rows + 1 && nextC >= 0 && nextC <= this.cols + 1) {
                    if (this.board[nextR][nextC] === 0 || (nextR === r2 && nextC === c2)) {
                        if (visited[nextR][nextC][i] === -1 || visited[nextR][nextC][i] > nextTurns) {
                            visited[nextR][nextC][i] = nextTurns;
                            queue.push({
                                r: nextR,
                                c: nextC,
                                direction: i,
                                turns: nextTurns
                            });

                            if (pathPoints) {
                                parentMap[`${nextR},${nextC},${i}`] = {
                                    r: current.r,
                                    c: current.c,
                                    dir: current.direction
                                };
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    shuffleBoard() {
        let tempArr = [];
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.board[r][c] !== 0 && this.board[r][c] !== -1) {
                    tempArr.push(this.board[r][c]);
                }
            }
        }
        if (tempArr.length === 0) return;

        for (let i = tempArr.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = tempArr[i];
            tempArr[i] = tempArr[j];
            tempArr[j] = temp;
        }

        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.board[r][c] !== 0 && this.board[r][c] !== -1) {
                    this.board[r][c] = tempArr.pop();
                }
            }
        }
        if (this.selectedCell) {
            this.selectedCell.el.classList.remove('selected');
            this.selectedCell = null;
        }
        this.renderDOM();
    }

    findHint() {
        for (let r1 = 1; r1 <= this.rows; r1++) {
            for (let c1 = 1; c1 <= this.cols; c1++) {
                if (this.board[r1][c1] === 0 || this.board[r1][c1] === -1) continue;

                for (let r2 = 1; r2 <= this.rows; r2++) {
                    for (let c2 = 1; c2 <= this.cols; c2++) {
                        if ((r1 !== r2 || c1 !== c2) && this.board[r1][c1] === this.board[r2][c2]) {
                            if (this.bfsPathFinder(r1, c1, r2, c2)) {
                                const cell1 = document.querySelector(`[data-row="${r1}"][data-col="${c1}"]`);
                                const cell2 = document.querySelector(`[data-row="${r2}"][data-col="${c2}"]`);
                                if (cell1 && cell2) {
                                    cell1.classList.add('hint');
                                    cell2.classList.add('hint');
                                    setTimeout(() => {
                                        cell1.classList.remove('hint');
                                        cell2.classList.remove('hint');
                                    }, 2000);
                                }
                                return;
                            }
                        }
                    }
                }
            }
        }
    }

    startTimer() {
        const timeDisplay = document.querySelector('#time-head p:nth-child(2)');
        this.timerInterval = setInterval(() => {
            if (this.isFrozen) return;

            if (this.timeLeft > 0) {
                this.timeLeft--;
                let m = Math.floor(this.timeLeft / 60);
                let s = this.timeLeft % 60;
                timeDisplay.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

                // lv5: Xử lý đếm ngược cho Bom
                if (this.hasBomb) {
                    this.bombTimeLeft--;
                    if (this.bombTimeLeft <= 0) {
                        clearInterval(this.timerInterval);
                        alert("Bom đã phát nổ! Game Over!");
                        location.reload();
                    }
                }
                // lv6: Đếm ngược thời gian dịch chuyển băng chuyền
                if (this.hasConveyor) {
                    this.conveyorCountdown--;
                    if (this.conveyorCountdown <= 0) {
                        this.conveyorCountdown = 8; // Reset lại chu kỳ 8 giây
                        this.shiftConveyorBelt();
                    }
                }
            } else {
                clearInterval(this.timerInterval);
                alert("Hết giờ! Game Over!");
                location.reload();
            }
        }, 1000);
    }

    freezeTime(sec = 5) {
        this.isFrozen = true;
        setTimeout(() => {
            this.isFrozen = false;
        }, sec * 1000);
    }

    // logic băng chuyền lv6
    shiftConveyorBelt() {
        if (!this.hasConveyor) return;
        // Nếu người chơi đang chọn dở một ô, hủy chọn để tránh lỗi logic tọa độ
        if (this.selectedCell) {
            this.selectedCell.el.classList.remove('selected');
            this.selectedCell = null;
        }

        // Duyệt qua từng hàng để trượt
        for (let r = 1; r <= this.rows; r++) {
            if (r % 2 === 0) {
                // Hàng chẵn: Dịch chuyển sang phải (Phần tử cuối vòng về đầu tiên)
                let lastVal = this.board[r][this.cols];
                for (let c = this.cols; c > 1; c--) {
                    this.board[r][c] = this.board[r][c - 1];
                }
                this.board[r][1] = lastVal;
            } else {
                // Hàng lẻ: Dịch chuyển sang trái (Phần tử đầu vòng về cuối cùng)
                let firstVal = this.board[r][1];
                for (let c = 1; c < this.cols; c++) {
                    this.board[r][c] = this.board[r][c + 1];
                }
                this.board[r][this.cols] = firstVal;
            }
        }
        // Render lại giao diện ngay lập tức sau khi trượt
        this.renderDOM();
    }
}

window.onload = () => {
    const game = new GameEngine(1);

    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => game.shuffleBoard());

    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) hintBtn.addEventListener('click', () => game.findHint());

    const pauseBtn = document.getElementById('pause');
    if (pauseBtn) pauseBtn.addEventListener('click', () => game.freezeTime(5));

    // --- CƠ CHẾ CHỌN LEVEL MỚI (Bấm vào nút Cấp Độ hiện menu chọn) ---
    const levelMenuBtn = document.getElementById('level-menu-btn');
    const levelDropdown = document.getElementById('level-dropdown');

    if (levelMenuBtn && levelDropdown) {
        // Click vào nút Cấp Độ để bật/tắt bảng chọn
        levelMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            levelDropdown.classList.toggle('show');
        });

        // Click ra ngoài thì ẩn menu đi
        document.addEventListener('click', () => {
            levelDropdown.classList.remove('show');
        });

        // Chọn một level cụ thể trong danh sách
        const levelOptions = levelDropdown.querySelectorAll('div');
        levelOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                let selectedLevel = parseInt(option.getAttribute('data-lvl'));

                // Thực hiện chuyển màn
                clearInterval(game.timerInterval);
                game.currentLevel = selectedLevel;
                game.setupLevelConfig(game.currentLevel);
                game.board = [];
                game.selectedCell = null;
                game.timeLeft = 360;
                game.initMatrix();
                game.renderDOM();
                game.startTimer();

                levelDropdown.classList.remove('show');
            });
        });
    }
};