class GameEngine {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.board = [];
        this.selectedCell = null;
        this.score = 0;
        this.icons = ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png", "11.png", "12.png", "13.png", "14.png", "15.png", "16.png", "17.png", "18.png", "19.png", "20.png", "21.png", "22.png", "23.png", "24.png", "25.png", "26.png", "27.png", "28.png", "29.png", "30.png", "31.png", "32.png", "33.png", "34.png", "35.png", "36.png"];

        this.timeLeft = 120;
        this.timerInterval = null;
        this.isFrozen = false;
        this.lives = 5; // Số mạng chơi

        this.initMatrix();
        this.renderDOM();
        this.startTimer(); // Kích hoạt đồng hồ chạy ngay khi khởi tạo game
    }

    initMatrix() {
        let totalPlayableCells = this.rows * this.cols;
        let items = [];
        for (let i = 0; i < totalPlayableCells; i += 2) {
            let randomIcon = this.icons[Math.floor(Math.random() * this.icons.length)];
            items.push(randomIcon, randomIcon);
        }
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
                    this.board[r][c] = 0; // Viền ngoài padding
                } else {
                    this.board[r][c] = items.pop();
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
                // Gán thuộc tính dataset để dễ truy xuất lại cell sau này cho chức năng Gợi ý
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (this.board[r][c] !== 0) {
                    const img = document.createElement('img');
                    img.src = `./image/pokemon/${this.board[r][c]}`;
                    img.alt = "pokemon";
                    img.style.width = '80%';
                    img.style.height = '80%';
                    img.style.objectFit = 'contain';
                    img.style.pointerEvents = 'none'; // Ngăn lỗi click nhầm vào ảnh thay vì div
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
        if (this.board[r][c] === 0) return;

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
                if (this.bfsPathFinder(prev.r, prev.c, r, c)) {
                    // Cập nhật ma trận
                    this.board[prev.r][prev.c] = 0;
                    this.board[r][c] = 0;

                    prev.el.classList.remove('selected');
                    prev.el.classList.add('empty');
                    cellElement.classList.add('empty');

                    this.score += 10;
                    document.getElementById('score').innerText = this.score;

                    // Kiểm tra xem đã ăn hết bàn chưa để chiến thắng
                    this.checkWinCondition();
                } else {
                    // Đúng hình nhưng sai đường đi -> Trừ 1 mạng (mất 1 tim)
                    prev.el.classList.remove('selected');
                    this.handleWrongSelection();
                }
            } else {
                // Chọn 2 hình khác nhau -> Trừ 1 mạng (mất 1 tim)
                prev.el.classList.remove('selected');
                this.handleWrongSelection();
            }
            this.selectedCell = null;
        }
    }

    // Xử lý khi chọn sai
    handleWrongSelection() {
        this.lives--;
        this.updateHeartsUI();

        if (this.lives <= 0) {
            clearInterval(this.timerInterval);
            alert("Bạn đã hết lượt chơi! Game Over!");
            location.reload(); // Tải lại trang chơi ván mới
        }
    }

    // Cập nhật giao diện số lượng trái tim bên cột phải
    updateHeartsUI() {
        const heartIcons = document.querySelectorAll('.count-die .fa-heart');
        heartIcons.forEach((heart, index) => {
            if (index < this.lives) {
                heart.style.opacity = "1";
                heart.style.color = "#ff4d4d";
            } else {
                heart.style.opacity = "0.2"; // Trái tim bị mờ đi khi mất mạng
            }
        });
    }

    // Kiểm tra điều kiện thắng
    checkWinCondition() {
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.board[r][c] !== 0) return; // Vẫn còn hình chưa ăn
            }
        }
        clearInterval(this.timerInterval);
        alert(`Chúc mừng bạn đã chiến thắng với số điểm: ${this.score}!`);
        location.reload();
    }

    bfsPathFinder(r1, c1, r2, c2) {
        let queue = [];
        let visited = Array.from({
                length: this.rows + 2
            }, () =>
            Array.from({
                length: this.cols + 2
            }, () => [-1, -1, -1, -1])
        );

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
            if (current.r === r2 && current.c === r2 ? false : (current.r === r2 && current.c === c2)) return true;

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
                        }
                    }
                }
            }
        }
        return false;
    }

    // Chức năng Xáo trộn
    shuffleBoard() {
        let tempArr = [];
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.board[r][c] !== 0) {
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
                if (this.board[r][c] !== 0) {
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

    // Chức năng Gợi Ý (Đã sửa lỗi chọn phần tử DOM bằng dataset)
    findHint() {
        for (let r1 = 1; r1 <= this.rows; r1++) {
            for (let c1 = 1; c1 <= this.cols; c1++) {
                if (this.board[r1][c1] === 0) continue;

                for (let r2 = 1; r2 <= this.rows; r2++) {
                    for (let c2 = 1; c2 <= this.cols; c2++) {
                        if ((r1 !== r2 || c1 !== c2) && this.board[r1][c1] === this.board[r2][c2]) {
                            if (this.bfsPathFinder(r1, c1, r2, c2)) {
                                // Tìm chính xác cell dựa trên dataset đã gán lúc renderDOM
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

    // Quản lý Thời Gian
    startTimer() {
        const timeDisplay = document.querySelector('#time-head p:nth-child(2)');

        this.timerInterval = setInterval(() => {
            if (this.isFrozen) return;

            if (this.timeLeft > 0) {
                this.timeLeft--;
                let minutes = Math.floor(this.timeLeft / 60);
                let seconds = this.timeLeft % 60;
                timeDisplay.innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            } else {
                clearInterval(this.timerInterval);
                alert("Hết giờ! Game Over!");
                location.reload();
            }
        }, 1000);
    }

    // Đóng băng thời gian 5 giây
    freezeTime(durationInSeconds = 5) {
        this.isFrozen = true;
        console.log("Đã đóng băng thời gian!");

        setTimeout(() => {
            this.isFrozen = false;
            console.log("Hết hiệu lực đóng băng!");
        }, durationInSeconds * 1000);
    }
}

window.onload = () => {
    // Khởi tạo bàn chơi 6 hàng x 10 cột (hoặc kích thước bạn muốn)
    const game = new GameEngine(6, 10);

    // Xáo Trộn
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            game.shuffleBoard();
        });
    }

    // Gợi Ý 
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
        hintBtn.addEventListener('click', () => {
            game.findHint();
        });
    }

    // Đóng Băng (Sửa lại gọi đúng hàm freezeTime)
    const pauseBtn = document.getElementById('pause');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            game.freezeTime(5); // Đóng băng 5 giây
        });
    }
};