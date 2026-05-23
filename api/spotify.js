export default async function handler(req, res) {
  const CLIENT_ID =
      process.env.SPOTIFY_CLIENT_ID

  const CLIENT_SECRET =
      process.env.SPOTIFY_CLIENT_SECRET

  const REFRESH_TOKEN =
      process.env.SPOTIFY_REFRESH_TOKEN

  // =========================
  // refresh access token
  // =========================

  const tokenResponse = await fetch(
      'https://accounts.spotify.com/api/token',
      {
        method: 'POST',

        headers: {
          Authorization:
              'Basic ' +
              Buffer.from(
                  CLIENT_ID +
                  ':' +
                  CLIENT_SECRET
              ).toString('base64'),

          'Content-Type':
              'application/x-www-form-urlencoded'
        },

        body:
            'grant_type=refresh_token&refresh_token=' +
            REFRESH_TOKEN
      }
  )

  const tokenData =
      await tokenResponse.json()

  const accessToken =
      tokenData.access_token

  // =========================
  // route type
  // =========================

  const { type, id } = req.query

  // =====================================
  // 1. current user profile
  // /api/spotify?type=me
  // =====================================

  if (type === 'me') {
    const response = await fetch(
        'https://api.spotify.com/v1/me',
        {
          headers: {
            Authorization:
                `Bearer ${accessToken}`
          }
        }
    )

    const data =
        await response.json()

    return res.status(200).json({
      name: data.display_name,

      avatar:
          data.images?.[0]?.url || null,

      profile:
      data.external_urls.spotify
    })
  }

  // =====================================
  // 2. current playing
  // /api/spotify?type=now-playing
  // =====================================

  if (type === 'now-playing') {
    const response = await fetch(
        'https://api.spotify.com/v1/me/player/currently-playing',
        {
          headers: {
            Authorization:
                `Bearer ${accessToken}`
          }
        }
    )

    if (response.status === 204) {
      return res.status(200).json({
        isPlaying: false
      })
    }

    const song =
        await response.json()

    return res.status(200).json({
      isPlaying:
      song.is_playing,

      title:
      song.item.name,

      artist:
          song.item.artists
              .map(a => a.name)
              .join(', '),

      album:
      song.item.album.name,

      albumImage:
      song.item.album.images[0].url,

      songUrl:
      song.item.external_urls.spotify
    })
  }

  // =====================================
  // 3. current playback state
  // /api/spotify?type=player
  // =====================================

  if (type === 'player') {
    const response = await fetch(
        'https://api.spotify.com/v1/me/player',
        {
          headers: {
            Authorization:
                `Bearer ${accessToken}`
          }
        }
    )

    const data =
        await response.json()

    return res.status(200).json(data)
  }

  // =====================================
  // 4. top tracks
  // /api/spotify?type=top-tracks
  // =====================================

  if (type === 'top-tracks') {
    const response = await fetch(
        'https://api.spotify.com/v1/me/top/tracks?limit=20',
        {
          headers: {
            Authorization:
                `Bearer ${accessToken}`
          }
        }
    )

    const data =
        await response.json()

    const tracks =
        data.items.map(track => ({
          id: track.id,

          title:
          track.name,

          artist:
              track.artists
                  .map(a => a.name)
                  .join(', '),

          cover:
          track.album.images[0].url,

          url:
          track.external_urls.spotify
        }))

    return res.status(200).json(tracks)
  }

  // =====================================
  // 5. top artists
  // /api/spotify?type=top-artists
  // =====================================

  if (type === 'top-artists') {
    const response = await fetch(
        'https://api.spotify.com/v1/me/top/artists?limit=20',
        {
          headers: {
            Authorization:
                `Bearer ${accessToken}`
          }
        }
    )

    const data =
        await response.json()

    const artists =
        data.items.map(artist => ({
          id: artist.id,

          name:
          artist.name,

          image:
              artist.images?.[0]?.url || null,

          genres:
          artist.genres,

          followers:
              artist.followers?.total || 0,

          url:
          artist.external_urls.spotify
        }))

    return res.status(200).json(artists)
  }

  // =====================================
  // 6. following artists
  // /api/spotify?type=following
  // =====================================

  if (type === 'following') {
    const response = await fetch(
        'https://api.spotify.com/v1/me/following?type=artist&limit=20',
        {
          headers: {
            Authorization:
                `Bearer ${accessToken}`
          }
        }
    )

    const data =
        await response.json()

    const artists =
        data.artists.items.map(artist => ({
          id: artist.id,

          name:
          artist.name,

          image:
              artist.images?.[0]?.url || null,

          genres:
          artist.genres,

          followers:
              artist.followers?.total || 0,

          url:
          artist.external_urls.spotify
        }))

    return res.status(200).json(artists)
  }

  // =====================================
  // 7. artist detail
  // /api/spotify?type=artist&id=xxxx
  // =====================================

  if (type === 'artist') {
    const response = await fetch(
        `https://api.spotify.com/v1/artists/${id}`,
        {
          headers: {
            Authorization:
                `Bearer ${accessToken}`
          }
        }
    )

    const artist =
        await response.json()

    return res.status(200).json({
      id:
      artist.id,

      name:
      artist.name,

      image:
          artist.images?.[0]?.url || null,

      followers:
          artist.followers?.total || 0,

      genres:
      artist.genres,

      popularity:
      artist.popularity,

      spotify:
      artist.external_urls.spotify
    })
  }

  // =====================================
  // invalid route
  // =====================================

  return res.status(400).json({
    error:
        'invalid type'
  })
}