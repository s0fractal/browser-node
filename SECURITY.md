# 🔐 Security & Gatekeeper

## Проблема: "Програму пошкоджено"

macOS блокує непідписані додатки. Ось як виправити:

### Метод 1: Швидкий фікс (рекомендовано)
```bash
# Видалити quarantine атрибут
sudo xattr -cr "/Applications/Browser Node.app"

# Додати до винятків
sudo spctl --add "/Applications/Browser Node.app"
```

### Метод 2: Дозволити всі додатки
```bash
# Вимкнути Gatekeeper повністю
sudo spctl --master-disable
```

Потім в System Settings > Privacy & Security > вибрати "Anywhere"

### Метод 3: Правий клік
1. Знайди Browser Node в Applications
2. Right-click (або Control+click)
3. Вибери "Open"
4. В діалозі натисни "Open" ще раз

### Метод 4: Terminal launch
```bash
open -a "Browser Node" --args --no-quarantine
```

## 🎯 Чому це безпечно?

Browser Node - open source проект:
- Код повністю відкритий на GitHub
- Ти можеш перевірити кожен рядок
- Збудований локально через Homebrew
- Частина s0fractal колективу

## 🔮 Майбутнє

Працюємо над:
- Apple Developer сертифікатом
- Notarization процесом
- Автоматичним підписом через GitHub Actions

А поки - trust the fractal! 🌀