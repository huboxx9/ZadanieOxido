# AiArtykul

Prosty program do przetwarzania artykułów z użyciem OpenAI API (GPT i DALL-E).

## Wymagania
- Node.js
- Klucz API OpenAI

## Instalacja

1. Zainstaluj zależności:
   ```bash
   npm install
   ```
zależności zostaną zainstalowane z pliku package.json

2. Dodaj swój klucz API do pliku .env :
   ```
   OPENAI_API_KEY=twój_klucz_api
   ```

3. Umieść tekst artykułu w pliku `article.txt` - by było łatwiej zostawię tekst w pliku.

## Użycie

```bash
npm start
```

Program wygeneruje cztery pliki:
- `article.html` - zawierający sam kod HTML artykułu
- `template.html` - szablon do wyświetlania artykułów
- `preview.html` - podgląd artykułu ze znacznikami placeholder dla obrazów
- `preview-full.html` - pełny podgląd artykułu z wygenerowanymi obrazami przez DALL-E

## Struktura projektu
```
.
├── src/
│   └── index.js      # Główny plik aplikacji
├── .env              # Konfiguracja (klucz API)
├── article.txt       # Plik wejściowy z artykułem
├── package.json      # Konfiguracja projektu
└── README.md         # Dokumentacja
```"# ZadanieOxido" 
