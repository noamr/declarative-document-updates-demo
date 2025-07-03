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
if (!process.env.PROD) {
    const vite = await createServer({
        server: {
            middlewareMode: true
        },
        appType: 'custom',
        base,
    })
    app.use(vite.middlewares)

}


const index_template = await readFile(`./index.html`, 'utf-8');


async function tmdb_get(path) {
    const response = await fetch(`https://api.themoviedb.org/3/${path}`, {
        headers: {
            Authorization: `Bearer ${TMDB_TOKEN}`
        }
    });
    return await response.json();
}

function image_url(path, width = 300) {
    return `https://image.tmdb.org/t/p/w${width}${path}`
}

function full_image(src, alt) {
    return `<img width=500 height=750 class=hero
                    src="${image_url(src, 500)}"
                    alt="${alt}"
                >
`
}

function poster(src, alt) {
    return `<img width=300 height=450 class=poster
                    src="${image_url(src, 300)}"
                    alt="${alt}"
                >
`
}

const genres_promise = tmdb_get("genre/movie/list");

export async function get_common_content() {
    const {
        genres
    } = await genres_promise;
    return `<h-template for=genres>
        <ul>
            ${genres.map(result => `
            <li style="view-transition-name: movie-${result.id}">
                <a href="/genre/${result.id}">${result.name}</a>
            </li>`).join("")}
        </ul>
    </h-template>
    `;
}

function people_list(people) {
    return `
                <ul class=grid>
                    ${people.map(result => `
                    <li style="view-transition-name: person-${result.id}">
                        <a href="/person/${result.id}">
                            ${poster(result.profile_path, result.name)}
                            <span class=person>${result.name}</span>
                        </a>
                    </li>`).join("")}
                </ul>`;

}

const common_content = get_common_content();

/**
 *
 * @param {import("express").Response} res
 * @param {string} title
 */
function send_header(res, title) {
    res.status(200);
    res.writeHead(200, "OK", {
        'Content-Type': 'text/html'
    });

    res.write(index_template);
    res.write(`<h-template for=title>${title}</h-template>`);
    return common_content.then(c => res.write(c));
}

function movie_list(list) {
    return `<ul class=grid>
            ${list.map(result => `
            <li>
                <a href="/movie/${result.id}">
                ${poster(result.poster_path, result.original_title)}
                <span class=movie-title>${result.original_title}</span>
                </a>
            </li>`).join("")}
        </ul>
    </h-template>
    `;
}

async function get_movies(res, path, view, title) {
    const movie_data = await tmdb_get(path);
    const head = send_header(res, title);
    res.write(`<h-template for=${view}>${movie_list(movie_data.results)}</h-template>`);
    await head;
    res.end();
}

function update(res, id, content) {
    res.write(`<h-template for="${id}">${content}</h-template>`);
}

app.get("/movies", (req, res) => {
    const {
        q
    } = req.query;
    if (q)
        get_movies(res, "search/movie?query=" + q, 'movies', `Movies: ${q}`);
    else
        get_movies(res, "discover/movie", 'movies', 'Movies - popular');
});

app.get("/people", async (req, res) => {
    const {
        q
    } = req.query;
    const people_data = q ?
        await tmdb_get("search/person?query=" + q) :
        await tmdb_get("person/popular");
    const head = send_header(res, "People");
    res.write(`<h-template for=people>${people_list(people_data.results)}</h-template>`);
    await head;
    res.end();
});

app.get("/genre/:genre/", async (req, res) => {
    const {
        genres
    } = await genres_promise;
    const genre = genres.find(g => g.id === +req.params.genre);
    const head = send_header(res, `Movies - ${genre.name}`);
    await Promise.all([head, tmdb_get(`discover/movie?with_genres=${genre.id}`).then(data =>
        update(res, "genre", movie_list(data.results)))])
    res.end();
});

app.get("/person/:person/", async (req, res) => {
    const person_data = await tmdb_get(`person/${req.params.person}`);
    const head = send_header(res, `Movies - ${person_data.name}`);
    update(res, "person", `
            <section class=card style="view-transition-name: person-${person_data.id}">
                <h2 class=title>${person_data.name}</h2>
                <article class=bio>${person_data.biography}</article>
                ${full_image(person_data.profile_path, person_data.name)}
            </section>
        `);
    await Promise.all([head, tmdb_get(`person/${req.params.person}/movie_credits`).then(({
        cast
    }) => update(res, "credits", movie_list(cast)))]);
    res.end();
});

app.get("/movie/:movie/", async (req, res) => {
    const credits_promise = tmdb_get(`movie/${req.params.movie}/credits`);
    const movie_data = await tmdb_get(`movie/${req.params.movie}`);
    const head = send_header(res, `Movies - ${movie_data.title}`);
    update(res, 'movie', `
        <section class=card data-id="movie-${movie_data.id}">
            <h2 class=title>${movie_data.title}</h2>
            ${full_image(movie_data.poster_path, movie_data.title)}
            <article class=overview>${movie_data.overview}</article>
        </section>
    `);

    await Promise.all([head, credits_promise.then(({
        cast
    }) => update(res, "cast", people_list(cast)))]);
    res.end();
});

app.get("/", (req, res) => {
    res.redirect("/movies");
})

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)
});