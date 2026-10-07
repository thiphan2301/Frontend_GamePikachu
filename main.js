class GameEngine {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.board = []; // Ma trận lưu state
        this.selectedCell = null; // biến state (trạng thái) dùng để lưu bộ nhớ đệm về ô đầu tiên mà người chơi vừa click vào. {r, c, el}  
        this.score = 0;
        this.icons = ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png" ];

        this.initMatrix();
        this.renderDOM();
    }

    initMatrix() {
        // mảng 1D chứa các cặp item
        let totalPlayableCells = this.rows * this.cols;
        let items = [];
        for (let i = 0; i < totalPlayableCells; i += 2) {
            let randomIcon = this.icons[Math.floor(Math.random() * this.icons.length)];
            items.push(randomIcon, randomIcon);
        }
        // Shuffle mảng ngẫu nhiên (Fisher-Yates)
        items.sort(() => Math.random() - 0.5);

        // Build Ma trận (Matrix) có Padding
        // note: bọc ma trận bằng viền các số 0 (Empty) để đường dẫn có thể vòng ra ngoài biên.
        // Kích thước thật của ma trận sẽ là (rows + 2) x (cols + 2)
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
        // Set CSS Grid linh động theo params
        boardEl.style.gridTemplateColumns = `repeat(${this.cols}, 50px)`;
        boardEl.style.gridTemplateRows = `repeat(${this.rows}, 50px)`;
        boardEl.innerHTML = ''; // Clear DOM cũ

        // Chỉ render phần lõi playable (từ 1 đến rows/cols), bỏ qua viền padding
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';

                if (this.board[r][c] !== 0) {
                    const img = document.createElement('img');
                    // Nối chuỗi đường dẫn thư mục với tên file từ ma trận
                    img.src = `./image/pokemon/${this.board[r][c]}`;
                    img.alt = "pokemon";

                    // Đảm bảo ảnh nằm gọn trong cell
                    img.style.width = '80%';
                    img.style.height = '80%';
                    img.style.objectFit = 'contain';
                    img.style.pointerEvents = 'none'; // Ngăn lỗi click nhầm vào ảnh thay vì div

                    cell.appendChild(img);
                } else {
                    cell.classList.add('empty');
                }

                // Lắng nghe event click, truyền toạ độ r, c vào
                cell.addEventListener('click', () => this.handleLogic(r, c, cell));
                boardEl.appendChild(cell);
            }
        }
    }

    handleLogic(r, c, cellElement) {
        if (this.board[r][c] === 0) return; // Ignore click vào ô trống

        if (!this.selectedCell) {
            // State: Chưa chọn ô nào -> Đánh dấu ô đầu tiên
            this.selectedCell = {
                r,
                c,
                el: cellElement
            };
            cellElement.classList.add('selected');
        } else {
            // State: Đã chọn ô đầu, giờ xét ô thứ hai
            let prev = this.selectedCell;

            // Nếu click lại chính ô đó -> Huỷ chọn
            if (prev.r === r && prev.c === c) {
                prev.el.classList.remove('selected');
                this.selectedCell = null;
                return;
            }

            // Check match value VÀ thuật toán tìm đường (BFS)
            if (this.board[prev.r][prev.c] === this.board[r][c]) {
                if (this.bfsPathFinder(prev.r, prev.c, r, c)) {
                    // Cập nhật State Matrix
                    this.board[prev.r][prev.c] = 0;
                    this.board[r][c] = 0;

                    // Cập nhật DOM (Ẩn thẻ div)
                    prev.el.classList.remove('selected');
                    prev.el.classList.add('empty');
                    cellElement.classList.add('empty');

                    // Cộng điểm
                    this.score += 10;
                    document.getElementById('score').innerText = this.score;
                } else {
                    prev.el.classList.remove('selected');
                }
            } else {
                // Sai Item -> Huỷ chọn
                prev.el.classList.remove('selected');
            }
            this.selectedCell = null;
        }
    }

    // Thuật toán BFS kiểm tra tối đa 2 lần rẽ (3 đoạn thẳng)
    bfsPathFinder(r1, c1, r2, c2) {
        let queue = [];
        // Mảng visited 3D: visited[r][c][dir] lưu số turns tối thiểu để tránh lặp vô hạn
        let visited = Array.from({
                length: this.rows + 2
            }, () =>
            Array.from({
                length: this.cols + 2
            }, () => [-1, -1, -1, -1])
        );

        // Vector điều hướng: Lên(0), Phải(1), Xuống(2), Trái(3)
        const dR = [-1, 0, 1, 0];
        const dC = [0, 1, 0, -1];

        // Khởi tạo điểm đầu, đi ra 4 hướng
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
            let current = queue.shift(); // Dequeue

            if (current.r === r2 && current.c === c2) return true; // Reached Target

            for (let i = 0; i < 4; i++) {
                let nextR = current.r + dR[i];
                let nextC = current.c + dC[i];

                // Tính số lần rẽ: nếu hướng đi tiếp (i) khác hướng đang đi (current.direction) thì turns + 1
                let nextTurns = current.turns + (current.direction !== i ? 1 : 0);

                if (nextTurns > 2) continue; // Constraint của game Pikachu: Tối đa 2 lần rẽ

                // Kiểm tra index biên của Matrix
                if (nextR >= 0 && nextR <= this.rows + 1 && nextC >= 0 && nextC <= this.cols + 1) {

                    // Ô đi tới phải là ô trống (0) HOẶC là ô đích (r2, c2)
                    if (this.board[nextR][nextC] === 0 || (nextR === r2 && nextC === c2)) {

                        // Kỹ thuật Pruning: Nếu chưa đi qua hoặc tìm được đường tới ô đó ít turns hơn
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
        return false; // Queue cạn mà chưa tới đích -> Không có đường
    }
}

// Chạy Game khi Load DOM xong
window.onload = () => {
    // Khởi tạo board 
    const game = new GameEngine(6, 10);
};