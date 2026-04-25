(() => {
  const PIECES = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
  };

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const undoBtn = document.getElementById("undo");
  const newGameBtn = document.getElementById("new-game");

  let game = new Chess();
  let selectedSquare = null;
  let legalTargets = [];

  const toSquareId = (file, rank) => `${file}${rank}`;

  function createBoard() {
    boardEl.innerHTML = "";
    for (let rank = 8; rank >= 1; rank -= 1) {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
        const file = files[fileIndex];
        const square = document.createElement("button");
        square.type = "button";
        square.className = `square ${(rank + fileIndex) % 2 === 0 ? "light" : "dark"}`;
        square.dataset.square = toSquareId(file, rank);
        square.setAttribute("role", "gridcell");
        square.setAttribute("aria-label", `Square ${toSquareId(file, rank)}`);
        square.addEventListener("click", onSquareTap);
        boardEl.appendChild(square);
      }
    }
  }

  function getSquareEl(square) {
    return boardEl.querySelector(`[data-square="${square}"]`);
  }

  function clearHighlights() {
    boardEl.querySelectorAll(".selected, .legal").forEach((el) => {
      el.classList.remove("selected", "legal");
    });
  }

  function render() {
    const board = game.board();
    for (let rank = 8; rank >= 1; rank -= 1) {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
        const squareName = toSquareId(files[fileIndex], rank);
        const squareEl = getSquareEl(squareName);
        const piece = board[8 - rank][fileIndex];
        squareEl.textContent = piece ? PIECES[piece.color === "w" ? piece.type.toUpperCase() : piece.type] : "";
      }
    }

    clearHighlights();
    if (selectedSquare) {
      getSquareEl(selectedSquare)?.classList.add("selected");
      legalTargets.forEach((target) => getSquareEl(target)?.classList.add("legal"));
    }

    statusEl.textContent = getStatusText();
    undoBtn.disabled = game.history().length === 0;
  }

  function getStatusText() {
    if (game.isCheckmate()) {
      return `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins.`;
    }
    if (game.isDraw()) {
      if (game.isStalemate()) return "Draw by stalemate.";
      if (game.isInsufficientMaterial()) return "Draw by insufficient material.";
      if (game.isThreefoldRepetition()) return "Draw by repetition.";
      return "Draw.";
    }

    const side = game.turn() === "w" ? "White" : "Black";
    return game.inCheck() ? `${side} to move — Check!` : `${side} to move`;
  }

  function selectSquare(square) {
    selectedSquare = square;
    legalTargets = game.moves({ square, verbose: true }).map((move) => move.to);
  }

  function tryMove(from, to) {
    const needsPromotion = game
      .moves({ square: from, verbose: true })
      .some((m) => m.to === to && m.flags.includes("p"));

    const move = game.move({
      from,
      to,
      promotion: needsPromotion ? promptPromotion() : undefined,
    });

    return Boolean(move);
  }

  function promptPromotion() {
    const choice = window.prompt("Promote to (q, r, b, n)", "q")?.trim().toLowerCase();
    return ["q", "r", "b", "n"].includes(choice) ? choice : "q";
  }

  function onSquareTap(event) {
    if (game.isGameOver()) return;

    const tappedSquare = event.currentTarget.dataset.square;
    const piece = game.get(tappedSquare);

    if (!selectedSquare) {
      if (piece && piece.color === game.turn()) {
        selectSquare(tappedSquare);
        render();
      }
      return;
    }

    if (tappedSquare === selectedSquare) {
      selectedSquare = null;
      legalTargets = [];
      render();
      return;
    }

    if (tryMove(selectedSquare, tappedSquare)) {
      selectedSquare = null;
      legalTargets = [];
      render();
      return;
    }

    if (piece && piece.color === game.turn()) {
      selectSquare(tappedSquare);
      render();
      return;
    }

    selectedSquare = null;
    legalTargets = [];
    render();
  }

  undoBtn.addEventListener("click", () => {
    game.undo();
    selectedSquare = null;
    legalTargets = [];
    render();
  });

  newGameBtn.addEventListener("click", () => {
    game = new Chess();
    selectedSquare = null;
    legalTargets = [];
    render();
  });

  createBoard();
  render();
})();
