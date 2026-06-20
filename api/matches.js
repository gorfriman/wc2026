// Vercel Serverless Function — прокси к football-data.org
// Браузеру нельзя ходить в API напрямую (CORS + ключ светится).
// Эта функция выполняется на сервере Vercel, подставляет ключ
// из переменной окружения FOOTBALL_API_KEY и отдаёт результат фронтенду.

export default async function handler(req, res) {
  const API_KEY = process.env.FOOTBALL_API_KEY;
  const WC_ID = 2000; // ID ЧМ на football-data.org (competition WC)

  if (!API_KEY) {
    res.status(500).json({ error: "FOOTBALL_API_KEY не задан в Environment Variables Vercel" });
    return;
  }

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${WC_ID}/matches`,
      { headers: { "X-Auth-Token": API_KEY } }
    );

    if (!response.ok) {
      res.status(response.status).json({ error: `API вернул ${response.status}` });
      return;
    }

    const data = await response.json();

    // кэш на 30 секунд на стороне Vercel CDN — бережём лимит API (10 запр/мин)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: "Не удалось получить данные от API", detail: String(e) });
  }
}
