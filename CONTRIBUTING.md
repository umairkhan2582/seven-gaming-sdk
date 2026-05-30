# Contributing to Seven Gaming SDK

Thank you for your interest in contributing! This project welcomes contributions of all kinds — bug reports, feature requests, documentation improvements, new game templates, and code.

---

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/seven-gaming-sdk.git
cd seven-gaming-sdk
```

### 2. Install Dependencies

```bash
# SDK
cd sdk && npm install

# Contracts
cd contracts && npm install
```

### 3. Run Tests (SDK)

```bash
cd sdk && npm test
```

---

## What to Contribute

### High Priority
- 🎮 **New game templates** — Unity, Godot, Phaser, three.js, vanilla JS
- 📚 **Documentation** — examples, tutorials, translations
- 🔌 **Game engine plugins** — Unity, Godot, Unreal (C++/Blueprint improvements)
- 🐛 **Bug fixes** — see open issues

### Ideas Welcome
- React Native / mobile game support
- WebSocket live transaction subscriptions
- Additional smart contract patterns
- CLI tool for project scaffolding

---

## Code Style

- TypeScript for all SDK code — strict mode, no `any`
- Solidity contracts — follow NatSpec comments convention
- Keep templates dependency-free or minimal
- All public functions must have JSDoc comments

---

## Submitting a Pull Request

1. Create a branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Test locally against `https://theseven.meme` (no API key needed)
4. Commit with a descriptive message: `feat: add Unity WebGL template`
5. Open a PR with a clear description of what and why

### Commit Message Format

```
type: short description

Types: feat | fix | docs | chore | refactor | test
```

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/umairkhan2582/seven-gaming-sdk/issues) with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser / Node version (if relevant)

---

## License

By contributing, you agree your contributions will be licensed under the [MIT License](LICENSE).
