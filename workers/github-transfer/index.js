const OWNER = 'AdrianDie';
const ALLOWED_ORIGINS = ['https://dmarketing.no', 'https://www.dmarketing.no'];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204, origin);
    }

    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ ok: false, error: 'Method not allowed' }), 405, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse(JSON.stringify({ ok: false, error: 'Ugyldig JSON' }), 400, origin);
    }

    const { github_username, repo_name } = body;

    if (!github_username || !repo_name) {
      return corsResponse(JSON.stringify({ ok: false, error: 'Mangler github_username eller repo_name' }), 400, origin);
    }

    // Sanitize inputs — GitHub usernames: 1–39 alphanumeric/hyphen chars
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(github_username)) {
      return corsResponse(JSON.stringify({ ok: false, error: 'Ugyldig GitHub-brukernavn. Brukernavn kan kun inneholde bokstaver, tall og bindestrek.' }), 400, origin);
    }
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(repo_name)) {
      return corsResponse(JSON.stringify({ ok: false, error: 'Ugyldig repo-navn.' }), 400, origin);
    }

    const ghHeaders = {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'dmarketing-worker/1.0',
    };

    // Verify repo exists under AdrianDie
    const repoResp = await fetch(`https://api.github.com/repos/${OWNER}/${repo_name}`, { headers: ghHeaders });
    if (repoResp.status === 404) {
      return corsResponse(JSON.stringify({ ok: false, error: `Fant ikke repoet ${repo_name} under AdrianDie. Sjekk at repo-navnet er riktig.` }), 404, origin);
    }
    if (!repoResp.ok) {
      return corsResponse(JSON.stringify({ ok: false, error: 'Kunne ikke hente repo-info fra GitHub. Prøv igjen.' }), 500, origin);
    }

    // Verify that github_username is an accepted collaborator on the repo
    const collabResp = await fetch(
      `https://api.github.com/repos/${OWNER}/${repo_name}/collaborators/${github_username}`,
      { headers: ghHeaders }
    );

    if (collabResp.status === 404) {
      return corsResponse(
        JSON.stringify({ ok: false, error: 'Du er ikke registrert som samarbeidspartner på dette repoet. Har du akseptert GitHub-invitasjonen fra e-posten din?' }),
        403, origin
      );
    }
    if (collabResp.status !== 204) {
      return corsResponse(JSON.stringify({ ok: false, error: 'Kunne ikke verifisere GitHub-tilgangen din. Prøv igjen.' }), 500, origin);
    }

    // Initiate the transfer
    const transferResp = await fetch(
      `https://api.github.com/repos/${OWNER}/${repo_name}/transfer`,
      {
        method: 'POST',
        headers: { ...ghHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_owner: github_username }),
      }
    );

    if (!transferResp.ok) {
      const err = await transferResp.json().catch(() => ({}));
      return corsResponse(
        JSON.stringify({ ok: false, error: err.message || 'Overføringen feilet. Ta kontakt med Adrian.' }),
        500, origin
      );
    }

    return corsResponse(JSON.stringify({ ok: true }), 200, origin);
  },
};

function corsResponse(body, status, origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
