import { config } from 'dotenv';
import { OpenAI } from 'openai';
import { readFile, writeFile } from 'fs/promises';

config();

if (!process.env.OPENAI_API_KEY) {
  console.error('Brak klucza API OpenAI w pliku .env');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const template = `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Podgląd Artykułu</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        img { max-width: 100%; height: auto; margin: 1rem 0; }
        figcaption { font-style: italic; color: #666; margin-top: 0.5rem; }
        article { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    </style>
</head>
<body>
    <article class="container">
        <!-- Tutaj zostanie wstawiona treść artykułu -->
    </article>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

async function generateImage(prompt) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });
    return response.data[0].url;
  } catch (error) {
    console.error('Błąd podczas generowania obrazu:', error.message);
    return null;
  }
}

async function extractImagePrompts(html) {
  const imgRegex = /<img[^>]+alt="([^"]+)"[^>]*>/g;
  const prompts = [];
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    prompts.push(match[1]);
  }
  
  return prompts;
}

async function replaceImagesWithGenerated(html, imageUrls) {
  let newHtml = html;
  let i = 0;
  
  newHtml = newHtml.replace(/<img[^>]+>/g, (match) => {
    if (i < imageUrls.length && imageUrls[i]) {
      const newImg = match.replace('src="image_placeholder.jpg"', `src="${imageUrls[i]}"`);
      i++;
      return newImg;
    }
    return match;
  });
  
  return newHtml;
}

async function processArticle() {
  try {
    const article = await readFile('article.txt', 'utf-8');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Jesteś ekspertem w formatowaniu treści HTML. Formatuj artykuły używając semantycznego HTML, dodając odpowiednie miejsca na obrazy z dokładnymi opisami do generacji AI."
        },
        {
          role: "user",
          content: `Przekształć poniższy artykuł na format HTML zgodnie z wymaganiami:
- Użyj odpowiednich tagów HTML do strukturyzacji treści
- Dodaj miejsca na obrazy używając <img src="image_placeholder.jpg">
- Każdy obrazek powinien mieć atrybut alt zawierający dokładny prompt do generacji AI
- Dodaj podpisy pod obrazkami używając odpowiednich tagów HTML
- Nie dodawaj CSS ani JavaScript
- Nie dodawaj tagów <html>, <head> ani <body>
- Skup się na semantycznej strukturze HTML

Artykuł:
${article}`
        }
      ],
      temperature: 0.7,
    });

    const htmlContent = completion.choices[0].message.content;
    
    // Zapisz podstawowy HTML
    await writeFile('article.html', htmlContent, 'utf-8');
    await writeFile('template.html', template, 'utf-8');
    
    // Zapisz preview z placeholderami
    const preview = template.replace('<!-- Tutaj zostanie wstawiona treść artykułu -->', htmlContent);
    await writeFile('preview.html', preview, 'utf-8');
    
    // Generuj obrazy i zapisz pełny preview
    const imagePrompts = await extractImagePrompts(htmlContent);
    const imageUrls = await Promise.all(imagePrompts.map(prompt => generateImage(prompt)));
    const htmlWithImages = await replaceImagesWithGenerated(htmlContent, imageUrls);
    const previewFull = template.replace('<!-- Tutaj zostanie wstawiona treść artykułu -->', htmlWithImages);
    await writeFile('preview-full.html', previewFull, 'utf-8');

    console.log('\nPrzetwarzanie zakończone pomyślnie!');
    console.log('Wygenerowane pliki:');
    console.log('- article.html: Zawiera przetworzoną treść HTML');
    console.log('- template.html: Pusty szablon do przyszłych artykułów');
    console.log('- preview.html: Podgląd ze znacznikami placeholder dla obrazów');
    console.log('- preview-full.html: Pełny podgląd z wygenerowanymi obrazami');

  } catch (error) {
    console.error('Błąd podczas przetwarzania artykułu:', error.message);
    process.exit(1);
  }
}

processArticle();