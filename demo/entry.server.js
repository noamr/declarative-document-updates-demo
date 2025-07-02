import {
    readFile
} from "fs/promises";
import express from 'express'
import {
    createServer
} from 'vite';

const app = express()
const {
    TMDB_TOKEN
} = process.env;
const port = process.env.PORT || 5174
const base = process.env.BASE || '/'

const index_template = await readFile('./demo/index.html', 'utf-8');

const vite = await createServer({
    server: {
        middlewareMode: true
    },
    appType: 'custom',
    base,
})
app.use(vite.middlewares)

async function tmdb_get(path) {
    const response = await fetch(`https://api.themoviedb.org/3/${path}`, {
        headers: {
            Authorization: `Bearer ${TMDB_TOKEN}`
        }
    });
    return await response.json();
}

async function get_movies(path, view) {
    const movie_data = await tmdb_get(path);
    return `<h-template for="${view}">
        <ul class=grid>
            ${movie_data.results.map(result => `
            <li>
                <a href="/movie/${result.id}">
                <img width=300 height=450 class=poster src="${image_url(result.poster_path)}"></img>
                <span class=movie-title>${result.original_title}</span>
                </a>
            </li>`).join("")}
        </ul>
    </h-template>
    `;

}

function image_url(path, width = 300) {
    return `https://image.tmdb.org/t/p/w${width}${path}`
}

const genres_promise = tmdb_get("genre/movie/list");

export async function get_common_content() {
    const {
        genres
    } = await genres_promise;
    return `<h-template for=genres>
        <ul>
            ${genres.map(result => `
            <li>
                <a href="/genre/${result.id}">${result.name}</a>
            </li>`).join("")}
        </ul>
    </h-template>
    `;
}


function get(path, handler) {
    app.get(path, async (req, res) => {
        const [content, common_content] = await Promise.all([
            handler(req, res), get_common_content()
        ]);
        res.status(200).set({
            'Content-Type': 'text/html'
        }).send(index_template + content + await common_content);
    });
}

get("/movies", async req => {
    const {
        q
    } = req.query;
    if (q)
        return get_movies("search/movie?query=" + q, 'movies');
    else
        return get_movies("discover/movie", 'movies');
});

get("/people", async req => {
    const {
        q
    } = req.query;
    const people_data = q ?
        await tmdb_get("search/person?query=" + q) :
        await tmdb_get("person/popular");
    return `<h-template for=people>
                <ul class=grid>
                    ${people_data.results.map(result => `
                    <li>
                        <a href="/person/${result.id}">
                        <img
                            width=300 height=450 class=poster
                            src="${image_url(result.profile_path)}"
                            alt="${result.name} profile image">
                        <span class=person>${result.name}</span>
                        </a>
                    </li>`).join("")}
                </ul>
            </h-template>`;
});

get("/genre/:genre/", async req => {
    const {
        genres
    } = await genres_promise;
    const genre = genres.find(g => g.id === +req.params.genre);
    return `
        <h-template for=title>Movies - ${genre.name}</h-template>
        ${await get_movies(`discover/movie?with_genres=${genre.id}`, 'genre')}
    `
});

get("/person/:person/", async req => {
    const person_data = await tmdb_get(`person/${req.params.person}`);
    return `
        <h-template for=title>Movies - ${person_data.name}</h-template>
        <h-template for="person">
                <img width=500 height=750 class=full
                    src="${image_url(person_data.profile_path)}"
                    alt="${person_data.name}"
                >
                <h2 class=title>${person_data.name}</h2>
            </ul>
        </h-template>
        `;
});

get("/movie/:movie/", async req => {
    const movie_data = await tmdb_get(`movie/${req.params.movie}`);
    return `
        <h-template for=title>Movies - ${movie_data.title}</h-template>
        <h-template for="movie">
            <h2 class=title>${movie_data.title}</h2>
            <img width=500 height=750 class=full src="${image_url(movie_data.poster_path)}"></img>
        </h-template>
    `;
});

app.get("/", (req, res) => {
    res.redirect("/movies");
})

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)
});