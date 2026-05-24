export default async function handler(req, res) {
  const STEAM_API_KEY = process.env.STEAM_API_KEY;
  const STEAM_ID = process.env.STEAM_ID;

  try {
    const response = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=true&include_played_free_games=true`
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Steam data",
    });
  }
}