const { addonBuilder, publishToCentral } = require("stremio-addon-sdk")
const discordRPC = require("discord-rpc")


const clientId = process.env.CLIENT_ID
const tmdbApiKey = process.env.TMDB_API_KEY
const posterPath = "https://image.tmdb.org/t/p/w200"
const stremioLogo = "https://cdn.icon-icons.com/icons2/3053/PNG/512/stremio_macos_bigsur_icon_189687.png"

discordRPC.register(clientId)
const rpc = new discordRPC.Client({ transport: "ipc" })

const manifest = {
	"id": "community.discordrichpresence",
	"version": "0.0.1",
	"catalogs": [],
	"resources": [
		"subtitles",
		"stream",
		"meta",
	],
	"types": [ "movie", "series", "channel", "tv"],
	"name": "Discord Rich Presence",
	"description": "Discord Rich Presence for Stremio",
	"idPrefixes": ["tt"],
}
const builder = new addonBuilder(manifest)

async function getMovieData(id) {
	const movieDataRaw = await fetch(`https://api.themoviedb.org/3/find/${id}?external_source=imdb_id`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${tmdbApiKey}`,
			"Content-Type": "application/json",
		}
	})
	const movieData = await movieDataRaw.json()

	const firstResult = movieData.movie_results.find(result => result) || movieData.person_results.find(result => result) || movieData.tv_results.find(result => result) || movieData.tv_episode_results.find(result => result) || movieData.tv_season_results.find(result => result);

	return {
		original_name: firstResult.name || firstResult.original_name || firstResult.title || firstResult.original_title,
		poster_path: firstResult.poster_path,
		poster_url: `${posterPath}${firstResult.poster_path}`
	}
}

function setDiscordActivity({details, state, largeImageKey, smallImageKey, buttons}) {
	rpc.setActivity({
		details: details,
		state: state,
		largeImageKey: largeImageKey,
		// smallImageKey: smallImageKey,
		buttons: buttons,
		instance: false,

	})
}

builder.defineSubtitlesHandler(async function(args) {
	console.log("Subtitles Handler")
	const id = args.id.split(":")

	const movieData = await getMovieData(id[0])

	if(args.type === "series") {
		setDiscordActivity({
			details: `👀 ${movieData.original_name}`,
			state: `🔍 Temporada ${id[1]}, episódio ${id[2]}`,
			largeImageKey: movieData.poster_url,
			smallImageKey: stremioLogo,
			buttons: [
				{ label: "Assista na Stremio", url: `stremio:///detail/${args.type}/${id[0]}` }
			]
		
		})
	}

	if(args.type === "movie") {
		setDiscordActivity({
			details: `👀 ${movieData.original_name}`,
			state: `🍿 Comendo pipoca`,
			largeImageKey: movieData.poster_url,
			smallImageKey: stremioLogo,
			buttons: [
				{ label: "Assista na Stremio", url: `stremio:///detail/${args.type}/${id[0]}` }
			]
		
		})
	}

	return Promise.resolve({ subtitles: [] , cacheMaxAge: 0})
})

builder.defineStreamHandler(async function(args) {
	console.log("Stream Handler")
	const id = args.id.split(":")

	const movieData = await getMovieData(id[0])

	setDiscordActivity({
		details: movieData.original_name,
		state: "Escolhendo algo para assistir...",
		largeImageKey: movieData.poster_url,
		smallImageKey: stremioLogo,
	})

	return Promise.resolve({ streams: {} , cacheMaxAge: 0})
})

builder.defineMetaHandler(async function(args) {
	console.log("Meta Handler")

	const movieData = await getMovieData(args.id)

	setDiscordActivity({
		details: movieData.original_name,
		state: "Escolhendo algo para assistir...",
		largeImageKey: movieData.poster_url,
		smallImageKey: stremioLogo,
	})

	return Promise.resolve({ meta: {} , cacheMaxAge: 0})
})


rpc.login({ clientId }).catch(console.error)

module.exports = builder.getInterface()