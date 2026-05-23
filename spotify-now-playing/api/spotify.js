export default async function handler(req, res) {
  // 1. refresh access token
  const tokenResponse = await fetch(
    'https://accounts.spotify.com/api/token',
    {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
            ':' +
            process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64'),

        'Content-Type':
          'application/x-www-form-urlencoded'
      },

      body:
        'grant_type=refresh_token&refresh_token=' +
        process.env.SPOTIFY_REFRESH_TOKEN
    }
  )

  const tokenData = await tokenResponse.json()

  // 2. get current song
  const spotifyResponse = await fetch(
    'https://api.spotify.com/v1/me/player/currently-playing',
    {
      headers: {
        Authorization:
          `Bearer ${tokenData.access_token}`
      }
    }
  )

  // nothing playing
  if (spotifyResponse.status === 204) {
    return res.status(200).json({
      isPlaying: false
    })
  }

  const song = await spotifyResponse.json()

  return res.status(200).json({
    isPlaying: song.is_playing,

    title: song.item.name,

    artist: song.item.artists
      .map(a => a.name)
      .join(', '),

    album: song.item.album.name,

    albumImage:
      song.item.album.images[0].url,

    songUrl:
      song.item.external_urls.spotify
  })
}