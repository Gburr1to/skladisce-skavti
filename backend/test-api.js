require('dotenv').config();
const http = require('http');
const app = require('./app');
const mongoose = require('mongoose');

// ANSI barvne kode za lep izpis
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
const TEST_PREFIX = `test_${Date.now()}`;

function assert(condition, message) {
    if (condition) {
        console.log(`  ${GREEN}✔${RESET} ${message}`);
        passed++;
    } else {
        console.error(`  ${RED}✖ NAPAKA:${RESET} ${message}`);
        failed++;
    }
}

async function request(baseUrl, method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
        method,
        headers,
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${baseUrl}${path}`, options);
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await res.json();
    } else {
        data = await res.text();
    }
    return { status: res.status, data };
}

async function runTests() {
    console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}${CYAN}     AVTOMATSKO TESTIRANJE SKAVTSKEGA SKLADIŠČA (API MVP)     ${RESET}`);
    console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}\n`);

    // Počakamo na povezavo z bazo
    if (mongoose.connection.readyState !== 1) {
        console.log(`${YELLOW}Čakam na MongoDB povezavo...${RESET}`);
        await new Promise((resolve) => {
            if (mongoose.connection.readyState === 1) return resolve();
            mongoose.connection.once('connected', resolve);
        });
    }
    console.log(`${GREEN}Povezava z bazo vzpostavljena.${RESET}\n`);

    // Zaženemo testni strežnik na naključnem prostem portu
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`${BLUE}Testni strežnik posluša na:${RESET} ${baseUrl}\n`);

    let authToken = null;
    let createdUserId = null;
    let createdClosetId = null;
    let createdShelfId = null;
    let createdArticleId = null;
    let createdArticleQR = null;
    let createdShoppingId = null;
    const testKeyHolderName = `TestIme_${TEST_PREFIX}`;

    try {
        // -------------------------------------------------------------
        // 1. SWAGGER DOKUMENTACIJA
        // -------------------------------------------------------------
        console.log(`${BOLD}[1. Swagger dokumentacija]${RESET}`);
        const swaggerRes = await request(baseUrl, 'GET', '/api-docs/');
        assert(swaggerRes.status === 200, 'GET /api-docs/ vrne status 200 OK');

        // -------------------------------------------------------------
        // 2. UPORABNIKI & AVTENTIKACIJA
        // -------------------------------------------------------------
        console.log(`\n${BOLD}[2. Uporabniki & Avtentikacija]${RESET}`);
        const testUser = {
            username: `user_${TEST_PREFIX}`,
            password: 'superSecretPassword123',
            picture: 'https://example.com/avatar.jpg'
        };

        // Ustvari uporabnika
        const regRes = await request(baseUrl, 'POST', '/users', testUser);
        assert(regRes.status === 201 && regRes.data.username === testUser.username, 'POST /users ustvari novega uporabnika');
        assert(!regRes.data.password, 'Geslo je varno izločeno iz odgovora');
        createdUserId = regRes.data._id;

        // Prijava
        const loginRes = await request(baseUrl, 'POST', '/users/login', {
            username: testUser.username,
            password: testUser.password
        });
        assert(loginRes.status === 200 && loginRes.data.token, 'POST /users/login vrne veljaven JWT žeton');
        authToken = loginRes.data.token;

        // Napačna prijava
        const wrongLoginRes = await request(baseUrl, 'POST', '/users/login', {
            username: testUser.username,
            password: 'napacnoGeslo'
        });
        assert(wrongLoginRes.status === 401, 'POST /users/login zavrne napačno geslo (401)');

        // Profil z žetonom
        const profileRes = await request(baseUrl, 'GET', '/users/profile', null, authToken);
        assert(profileRes.status === 200 && profileRes.data.username === testUser.username, 'GET /users/profile vrne podatke prijavljenega uporabnika');

        // Profil brez žetona
        const noAuthProfileRes = await request(baseUrl, 'GET', '/users/profile');
        assert(noAuthProfileRes.status === 401, 'GET /users/profile brez žetona vrne 401 Unauthorized');

        // Seznam uporabnikov
        const usersListRes = await request(baseUrl, 'GET', '/users');
        assert(usersListRes.status === 200 && Array.isArray(usersListRes.data), 'GET /users vrne seznam uporabnikov');

        // -------------------------------------------------------------
        // 3. IMETNIKI KLJUČA (TODO: zgolj imena, ne modeli!)
        // -------------------------------------------------------------
        console.log(`\n${BOLD}[3. Imetniki ključa (samo imena)]${RESET}`);
        // Dodaj imetnika
        const addKeyRes = await request(baseUrl, 'POST', '/users/key-holders', { name: testKeyHolderName });
        assert(addKeyRes.status === 201 && Array.isArray(addKeyRes.data), 'POST /users/key-holders doda imetnika');
        assert(addKeyRes.data.includes(testKeyHolderName), 'Odgovor vsebuje dodano ime');

        // Pridobi imetnike
        const getKeyRes = await request(baseUrl, 'GET', '/users/key-holders');
        assert(getKeyRes.status === 200 && Array.isArray(getKeyRes.data), 'GET /users/key-holders vrne seznam');
        assert(typeof getKeyRes.data[0] === 'string', 'Kriterij TODO izpolnjen: elementi so zgolj nizi (imena), ne objekti');

        // Izbriši imetnika
        const delKeyRes = await request(baseUrl, 'DELETE', `/users/key-holders/${encodeURIComponent(testKeyHolderName)}`);
        assert(delKeyRes.status === 200 && !delKeyRes.data.includes(testKeyHolderName), 'DELETE /users/key-holders/:name odstrani imetnika');

        // -------------------------------------------------------------
        // 4. OMARE (Closets)
        // -------------------------------------------------------------
        console.log(`\n${BOLD}[4. Omare (Closets)]${RESET}`);
        // Ustvari omaro
        const closetRes = await request(baseUrl, 'POST', '/closet', {
            name: `Glavna Omara ${TEST_PREFIX}`,
            location: 'Klet skavtske sobe',
            picture: 'https://example.com/omara.jpg'
        });
        assert(closetRes.status === 201 && closetRes.data._id, 'POST /closet ustvari novo omaro');
        createdClosetId = closetRes.data._id;

        // Seznam omar
        const closetListRes = await request(baseUrl, 'GET', '/closet');
        assert(closetListRes.status === 200 && closetListRes.data.some(c => c._id === createdClosetId), 'GET /closet vrne seznam omar z novo omaro');

        // Podatki o omari
        const singleClosetRes = await request(baseUrl, 'GET', `/closet/${createdClosetId}`);
        assert(singleClosetRes.status === 200 && singleClosetRes.data.name.includes(TEST_PREFIX), 'GET /closet/:id vrne pravilno omaro');

        // Posodobi omaro
        const updateClosetRes = await request(baseUrl, 'PUT', `/closet/${createdClosetId}`, {
            name: `Posodobljena Omara ${TEST_PREFIX}`,
            location: '1. nadstropje'
        });
        assert(updateClosetRes.status === 200 && updateClosetRes.data.location === '1. nadstropje', 'PUT /closet/:id posodobi podatke omare');

        // -------------------------------------------------------------
        // 5. POLICE (Shelves) & Opis kaj sodi gor
        // -------------------------------------------------------------
        console.log(`\n${BOLD}[5. Police (Shelves) z opisom namena]${RESET}`);
        // Ustvari polico v omari z opisom
        const shelfRes = await request(baseUrl, 'POST', '/shelf', {
            name: `Polica za šotore ${TEST_PREFIX}`,
            description: 'Tukaj sodijo izključno šotori, ponjave in klini',
            location: 'Spodnji del omare',
            closet: createdClosetId
        });
        assert(shelfRes.status === 201 && shelfRes.data._id, 'POST /shelf ustvari polico s povezavo do omare');
        assert(shelfRes.data.description === 'Tukaj sodijo izključno šotori, ponjave in klini', 'Polica ima pravilno shranjen opis, kaj sodi gor');
        createdShelfId = shelfRes.data._id;

        // Seznam polic
        const shelfListRes = await request(baseUrl, 'GET', '/shelf');
        assert(shelfListRes.status === 200 && shelfListRes.data.some(s => s._id === createdShelfId), 'GET /shelf vrne seznam polic');

        // Police znotraj omare (Ideje točka 8)
        const closetShelvesRes = await request(baseUrl, 'GET', `/closet/${createdClosetId}/shelves`);
        assert(closetShelvesRes.status === 200 && closetShelvesRes.data.some(s => s._id === createdShelfId), 'GET /closet/:id/shelves vrne police te omare');

        // -------------------------------------------------------------
        // 6. ARTIKLI (Articles) & Avtomatska QR koda & Iskanje
        // -------------------------------------------------------------
        console.log(`\n${BOLD}[6. Artikli (Articles), QR kode in Iskanje]${RESET}`);
        // Ustvari artikel na polici (brez ročne QR kode -> avtomatska generacija)
        const articleRes = await request(baseUrl, 'POST', '/article', {
            name: `Veliki Taborniški Šotor ${TEST_PREFIX}`,
            description: 'Šotor za 6 oseb z aluminijastimi palicami',
            quantity: 3,
            shelf: createdShelfId,
            picture: 'https://example.com/sotor.jpg'
        });
        assert(articleRes.status === 201 && articleRes.data._id, 'POST /article ustvari nov artikel');
        assert(articleRes.data.qr && articleRes.data.qr.startsWith('SKAVT-ART-'), 'Avtomatsko generirana unikatna QR koda');
        assert(articleRes.data.qrImage && articleRes.data.qrImage.startsWith('data:image/png;base64,'), 'Avtomatsko generirana QR slika v Base64 obliki');
        createdArticleId = articleRes.data._id;
        createdArticleQR = articleRes.data.qr;

        // Artikli na polici (Ideje točka 11)
        const shelfArticlesRes = await request(baseUrl, 'GET', `/shelf/${createdShelfId}/articles`);
        assert(shelfArticlesRes.status === 200 && shelfArticlesRes.data.some(a => a._id === createdArticleId), 'GET /shelf/:id/articles vrne artikle na določeni polici');

        // Iskanje artikla po imenu z lokacijo polica -> omara (Ideje točka 14)
        const searchRes = await request(baseUrl, 'GET', `/article/search?q=${encodeURIComponent(TEST_PREFIX)}`);
        assert(searchRes.status === 200 && searchRes.data.length > 0, 'GET /article/search najde artikel po iskalnem nizu');
        const foundArticle = searchRes.data.find(a => a._id === createdArticleId);
        assert(foundArticle && foundArticle.shelf && foundArticle.shelf.name, 'Najdeni artikel vsebuje podatke o polici');
        assert(foundArticle && foundArticle.shelf.closet && foundArticle.shelf.closet.name, 'Polica artikla vsebuje podatke o omari (celotna pot lokacije)');

        // Iskanje artikla po QR kodi (skeniranje s kamero)
        const qrSearchRes = await request(baseUrl, 'GET', `/article/qr/${createdArticleQR}`);
        assert(qrSearchRes.status === 200 && qrSearchRes.data._id === createdArticleId, 'GET /article/qr/:code takoj najde artikel ob skeniranju QR kode');

        // Regeneriranje QR kode
        const regenQRRes = await request(baseUrl, 'POST', `/article/${createdArticleId}/generate-qr`);
        assert(regenQRRes.status === 200 && regenQRRes.data.qr !== createdArticleQR, 'POST /article/:id/generate-qr uspešno obnovi QR kodo');

        // -------------------------------------------------------------
        // 7. NAKUPOVALNI SEZNAM (buyArticle / Shopping)
        // -------------------------------------------------------------
        console.log(`\n${BOLD}[7. Nakupovalni seznam (Shopping / buyArticle)]${RESET}`);
        // Dodaj na seznam
        const shopRes = await request(baseUrl, 'POST', '/shopping', {
            name: `Plinska jeklenka 5kg ${TEST_PREFIX}`,
            person: 'Luka Kovač',
            isPurchased: false
        });
        assert(shopRes.status === 201 && shopRes.data._id, 'POST /shopping doda artikel na nakupovalni seznam');
        assert(shopRes.data.person === 'Luka Kovač' && shopRes.data.isPurchased === false, 'Pravilno shranjeno ime osebe in status');
        createdShoppingId = shopRes.data._id;

        // Seznam
        const shopListRes = await request(baseUrl, 'GET', '/shopping?purchased=false');
        assert(shopListRes.status === 200 && shopListRes.data.some(i => i._id === createdShoppingId), 'GET /shopping filtrira nekupljene artikle');

        // Preklopi kupljeno (Ideje točka 4)
        const toggleRes = await request(baseUrl, 'PATCH', `/shopping/${createdShoppingId}/toggle-purchased`);
        assert(toggleRes.status === 200 && toggleRes.data.isPurchased === true, 'PATCH /shopping/:id/toggle-purchased označi artikel kot kupljen');

        // -------------------------------------------------------------
        // 8. BRISANJE & ČIŠČENJE TESTNIH PODATKOV
        // -------------------------------------------------------------
        console.log(`\n${BOLD}[8. Čiščenje testnih podatkov]${RESET}`);
        if (createdArticleId) {
            const delArt = await request(baseUrl, 'DELETE', `/article/${createdArticleId}`);
            assert(delArt.status === 200, 'DELETE /article/:id uspešno izbrisan');
        }
        if (createdShelfId) {
            const delShelf = await request(baseUrl, 'DELETE', `/shelf/${createdShelfId}`);
            assert(delShelf.status === 200, 'DELETE /shelf/:id uspešno izbrisana');
        }
        if (createdClosetId) {
            const delCloset = await request(baseUrl, 'DELETE', `/closet/${createdClosetId}`);
            assert(delCloset.status === 200, 'DELETE /closet/:id uspešno izbrisana');
        }
        if (createdShoppingId) {
            const delShop = await request(baseUrl, 'DELETE', `/shopping/${createdShoppingId}`);
            assert(delShop.status === 200, 'DELETE /shopping/:id uspešno izbrisan');
        }
        if (createdUserId) {
            const delUser = await request(baseUrl, 'DELETE', `/users/${createdUserId}`);
            assert(delUser.status === 200, 'DELETE /users/:id uspešno izbrisan');
        }

    } catch (err) {
        console.error(`${RED}Nepričakovana napaka med testiranjem:${RESET}`, err);
        failed++;
    } finally {
        server.close();
        await mongoose.connection.close();
    }

    // Povzetek
    console.log(`\n${BOLD}═══════════════════════════════════════════════════════════════${RESET}`);
    if (failed === 0) {
        console.log(`${BOLD}${GREEN}✔ VSI TESTI USPEŠNI! (${passed} uspešnih, 0 napak)${RESET}`);
    } else {
        console.log(`${BOLD}${RED}✖ ŠTEVILO NAPAK: ${failed} (Uspešnih: ${passed})${RESET}`);
    }
    console.log(`${BOLD}═══════════════════════════════════════════════════════════════${RESET}\n`);

    process.exit(failed === 0 ? 0 : 1);
}

runTests();
