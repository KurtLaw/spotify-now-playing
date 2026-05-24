export default async function handler(req, res) {
  const STEAM_API_KEY = process.env.STEAM_API_KEY;
  const STEAM_ID = process.env.STEAM_ID;

  const { type } = req.query;

  // =====================================
  // CORS
  // =====================================

  res.setHeader(
      'Access-Control-Allow-Origin',
      '*'
  )

  res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, OPTIONS'
  )

  res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type'
  )

  // preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // =========================================
    // 玩家资料
    // /api/steam?type=profile
    // =========================================
    if (type === "profile") {
      const response = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${STEAM_ID}`
      );

      const data = await response.json();

      const player = data.response.players[0];

      const statusMap = {
        0: "Offline",
        1: "Online",
        2: "Busy",
        3: "Away",
        4: "Snooze",
        5: "Looking to trade",
        6: "Looking to play",
      };

      return res.status(200).json({
        steamid: player.steamid,

        username: player.personaname,

        avatar: player.avatarfull,

        profileurl: player.profileurl,

        status:
            statusMap[player.personastate] || "Unknown",
      });
    }

    // =========================================
    // 当前游戏
    // /api/steam?type=current
    // =========================================
    if (type === "current") {
      const response = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${STEAM_ID}`
      );

      const data = await response.json();

      const player = data.response.players[0];

      if (!player.gameextrainfo) {
        return res.status(200).json({
          playing: false,
        });
      }

      return res.status(200).json({
        playing: true,

        game: {
          appid: player.gameid,

          name: player.gameextrainfo,

          image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${player.gameid}/header.jpg`,
        },
      });
    }

    // =========================================
    // 最近游玩
    // /api/steam?type=recent
    // =========================================
    if (type === "recent") {
      const response = await fetch(
          `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}`
      );

      const data = await response.json();

      const games = (data.response.games || []).map(
          (game) => ({
            ...game,

            hours: Math.floor(
                game.playtime_forever / 60
            ),

            image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
          })
      );

      return res.status(200).json(games);
    }

    // =========================================
    // 游戏库
    // /api/steam?type=library
    // =========================================
    if (type === "library") {
      const response = await fetch(
          `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=true&include_played_free_games=true`
      );

      const data = await response.json();

      const games = (data.response.games || []).map(
          (game) => ({
            ...game,

            hours: Math.floor(
                game.playtime_forever / 60
            ),

            image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
          })
      );

      return res.status(200).json(games);
    }

    // =========================================
    // 默认返回
    // =========================================
    return res.status(400).json({
      error:
          "Invalid type. Use profile/current/recent/library",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Steam API error",
    });
  }
}