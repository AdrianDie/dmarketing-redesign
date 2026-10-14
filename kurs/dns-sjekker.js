/* DNS-sjekker for hurtigstart (steg 3c).
   Slår opp offentlige DNS-poster via Cloudflare DNS-over-HTTPS og sorterer dem i
   slett / behold / la stå. Etter-sjekken sammenligner med det som ble lagret i
   før-sjekken (localStorage), og sjekker navnetjenere, e-post og nettside.
   Bruk: <div data-dns-sjekker="for"></div> eller <div data-dns-sjekker="etter"></div> */
(function () {
  'use strict';

  var DOH = 'https://cloudflare-dns.com/dns-query';
  var TYPE = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28, SRV: 33 };
  var SUBS = ['mail', 'webmail', 'smtp', 'imap', 'pop', 'pop3', 'ftp', 'autodiscover', 'autoconfig',
    'lyncdiscover', 'sip', 'enterpriseregistration', 'enterpriseenrollment', 'email', 'ssh'];
  // DKIM-navn Cloudflare-skanningen ofte ikke plukker opp (f.eks. one.com: rsa1/rsa2/ed1/ed2).
  var DKIM = ['selector1', 'selector2', 'google', 'default', 'k1', 'k2', 'k3', 's1', 's2', 'mail', 'dkim',
    'dkim1', 'dkim2', 'key1', 'key2', 'sig1', 'smtp', 'mandrill', 'zoho', 'rsa1', 'rsa2', 'ed1', 'ed2',
    'fm1', 'fm2', 'fm3', 'protonmail', 'protonmail2', 'protonmail3', 'mxvault', 'cm', 'smtpapi', 'mailjet'];
  var SRV = ['_autodiscover._tcp', '_sip._tls', '_sipfederationtls._tcp'];
  var CF_V4 = ['173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
    '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
    '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'];
  var MAIL = [['outlook.com', 'Microsoft 365'], ['google.com', 'Google Workspace (Gmail)'],
    ['googlemail.com', 'Google Workspace (Gmail)'], ['one.com', 'One.com'], ['domeneshop.no', 'Domeneshop'],
    ['webhuset.no', 'Webhuset'], ['proisp', 'PRO ISP'], ['zoho', 'Zoho Mail'], ['secureserver.net', 'GoDaddy'],
    ['icloud.com', 'iCloud'], ['mimecast', 'Mimecast'], ['pphosted.com', 'Proofpoint'], ['fastmail', 'Fastmail'],
    ['ionos', 'IONOS'], ['simply.com', 'Simply.com'], ['uniweb', 'Uniweb']];
  var NSP = [['ns.cloudflare.com', 'Cloudflare'], ['hyp.net', 'Domeneshop'], ['one.com', 'One.com'],
    ['webhuset', 'Webhuset'], ['domene.no', 'Domene.no'], ['domaincontrol.com', 'GoDaddy'],
    ['registrar-servers.com', 'Namecheap'], ['proisp', 'PRO ISP'], ['uniweb', 'Uniweb'], ['ionos', 'IONOS'],
    ['simply.com', 'Simply.com']];
  var STORE = 'dns_sjekk_v1_';

  // ─── Hjelpere ─────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clean(h) { return String(h || '').toLowerCase().replace(/\.$/, ''); }
  function lastWord(v) { return v.split(' ').pop(); }

  function norm(input) {
    var s = String(input || '').trim().toLowerCase();
    if (s.indexOf('@') !== -1) s = s.split('@').pop();
    s = s.replace(/^[a-z]+:\/\//, '').split(/[\/?#]/)[0].replace(/:\d+$/, '').replace(/^www\./, '').replace(/\.$/, '');
    try { s = new URL('http://' + s).hostname; } catch (e) { return null; }
    return /^[a-z0-9.-]+\.[a-z0-9-]{2,}$/.test(s) ? s : null;
  }

  function matches(host, key) {
    return key.indexOf('.') === -1 ? host.indexOf(key) !== -1
      : host === key || host.slice(-key.length - 1) === '.' + key;
  }
  function provider(hosts, list) {
    for (var i = 0; i < hosts.length; i++) {
      for (var j = 0; j < list.length; j++) if (matches(hosts[i], list[j][0])) return list[j][1];
    }
    return null;
  }
  function isCfNs(h) { return matches(h, 'ns.cloudflare.com'); }

  function ip2n(ip) {
    var p = ip.split('.');
    return p.length === 4 ? ((+p[0] << 24) >>> 0) + (+p[1] << 16) + (+p[2] << 8) + (+p[3]) : null;
  }
  function isCfIp(ip) {
    if (ip.indexOf(':') !== -1) return /^(2606:4700|2803:f800|2405:b500|2405:8100|2a06:98c0|2c0f:f248|2400:cb00):/i.test(ip);
    var n = ip2n(ip);
    if (n === null) return false;
    return CF_V4.some(function (c) {
      var s = c.split('/'), mask = (~0 << (32 - +s[1])) >>> 0;
      return ((n & mask) >>> 0) === ((ip2n(s[0]) & mask) >>> 0);
    });
  }

  function save(d, snap) { try { localStorage.setItem(STORE + d, JSON.stringify(snap)); } catch (e) {} }
  function load(d) { try { return JSON.parse(localStorage.getItem(STORE + d) || 'null'); } catch (e) { return null; } }

  // ─── DNS-oppslag ──────────────────────────────────────────────────────────
  function query(name, type) {
    return fetch(DOH + '?name=' + encodeURIComponent(name) + '&type=' + type, {
      headers: { accept: 'application/dns-json' }
    }).then(function (r) {
      if (!r.ok) throw new Error('http');
      return r.json();
    });
  }

  function fmt(type, data) {
    if (type === 'TXT') return String(data).replace(/"\s+"/g, '').replace(/^"|"$/g, '');
    if (type === 'MX' || type === 'SRV') {
      var p = String(data).split(/\s+/);
      p[p.length - 1] = clean(p[p.length - 1]);
      return p.join(' ');
    }
    if (type === 'CNAME' || type === 'NS') return clean(data);
    return String(data);
  }

  // Slår opp ett navn. Ligger det en CNAME der, er det den vi rapporterer.
  function probe(name, type) {
    return query(name, type).then(function (res) {
      var ans = (res.Answer || []).filter(function (a) { return clean(a.name) === name; });
      var cn = ans.filter(function (a) { return a.type === TYPE.CNAME; });
      if (cn.length) return { type: 'CNAME', name: name, values: [fmt('CNAME', cn[0].data)], asked: type };
      var v = ans.filter(function (a) { return a.type === TYPE[type]; });
      if (!v.length) return null;
      return { type: type, name: name, values: v.map(function (a) { return fmt(type, a.data); }), asked: type };
    }, function () { return null; });
  }

  function rows(rec) {
    return rec.values.map(function (v) { return { type: rec.type, name: rec.name, value: v, asked: rec.asked }; });
  }

  function nameservers(d) {
    return query(d, 'NS').then(function (res) {
      if (res.Status === 3) throw new Error('nx');
      var ns = (res.Answer || []).filter(function (a) {
        return a.type === TYPE.NS && clean(a.name) === d;
      }).map(function (a) { return clean(a.data); });
      if (!ns.length) throw new Error('notapex');
      return ns;
    });
  }

  // ─── Før-sjekk ────────────────────────────────────────────────────────────
  function analyze(d) {
    return nameservers(d).then(function (ns) {
      var jobs = {
        a: probe(d, 'A'), aaaa: probe(d, 'AAAA'), mx: probe(d, 'MX'), txt: probe(d, 'TXT'),
        www: probe('www.' + d, 'A'), www6: probe('www.' + d, 'AAAA'), wwwmx: probe('www.' + d, 'MX'),
        wild: probe('dmsjekk-' + Math.random().toString(36).slice(2, 10) + '.' + d, 'A'),
        dmarc: probe('_dmarc.' + d, 'TXT')
      };
      var keys = Object.keys(jobs);
      var lists = [
        Promise.all(SUBS.map(function (s) { return probe(s + '.' + d, 'A'); })),
        Promise.all(DKIM.map(function (s) { return probe(s + '._domainkey.' + d, 'TXT'); })),
        Promise.all(SRV.map(function (s) { return probe(s + '.' + d, 'SRV'); }))
      ];
      return Promise.all(keys.map(function (k) { return jobs[k]; }).concat(lists)).then(function (r) {
        var o = {};
        keys.forEach(function (k, i) { o[k] = r[i]; });
        o.subs = r[keys.length].filter(Boolean);
        o.dkim = r[keys.length + 1].filter(Boolean);
        o.srv = r[keys.length + 2].filter(Boolean);
        o.mxHosts = o.mx ? o.mx.values.map(lastWord) : [];
        // E-postservere på eget domene som ikke står i SUBS-lista, må også slås opp.
        var known = o.subs.map(function (s) { return s.name; });
        var extra = o.mxHosts.filter(function (h) {
          return h !== d && h !== 'www.' + d && matches(h, d) && known.indexOf(h) === -1;
        });
        return Promise.all(extra.map(function (h) { return probe(h, 'A'); })).then(function (more) {
          o.subs = o.subs.concat(more.filter(Boolean));
          return classify(d, ns, o);
        });
      });
    });
  }

  function classify(d, ns, o) {
    var res = {
      domain: d, ns: ns, onCf: ns.every(isCfNs), nsProvider: provider(ns, NSP),
      mxHosts: o.mxHosts, mailProvider: provider(o.mxHosts, MAIL),
      slett: [], behold: [], lastaa: [],
      stop: o.mxHosts.some(function (h) { return h === d || h === 'www.' + d; })
    };
    var old = [];

    [o.a, o.aaaa].forEach(function (r) {
      if (!r) return;
      res.slett = res.slett.concat(rows(r));
      if (r.type !== 'CNAME') old = old.concat(r.values);
    });
    if (o.www) {
      res.slett = res.slett.concat(rows(o.www));
      if (o.www.type !== 'CNAME') {
        old = old.concat(o.www.values);
        if (o.www6) res.slett = res.slett.concat(rows(o.www6));
      }
    }

    // MX på www (one.com legger inn det) skal stå, selv om www sin A/CNAME slettes.
    var wwwmx = o.wwwmx && o.wwwmx.type === 'MX' ? o.wwwmx : null;
    [o.mx, wwwmx, o.txt, o.dmarc].concat(o.dkim, o.srv).forEach(function (r) {
      if (r) res.behold = res.behold.concat(rows(r));
    });

    // Wildcard (*) svarer på alle navn. Navn som bare treffer wildcarden er ikke ekte poster.
    var wsig = o.wild ? o.wild.type + ':' + o.wild.values.slice().sort().join(',') : null;
    if (o.wild) res.lastaa = res.lastaa.concat(rows({ type: o.wild.type, name: '*.' + d, values: o.wild.values, asked: 'A' }));

    o.subs.forEach(function (r) {
      var mxTarget = o.mxHosts.indexOf(r.name) !== -1;
      if (!mxTarget && r.type + ':' + r.values.slice().sort().join(',') === wsig) return;
      var rr = rows(r);
      if (mxTarget) {
        rr.forEach(function (x) { x.note = 'Trengs for e-posten din'; });
        res.behold = res.behold.concat(rr);
      } else if (r.type !== 'CNAME' && r.values.some(function (v) { return old.indexOf(v) !== -1; })) {
        res.lastaa = res.lastaa.concat(rr);
      } else {
        res.behold = res.behold.concat(rr);
      }
    });

    res.behold.forEach(function (x) { x.grey = x.type === 'A' || x.type === 'AAAA' || x.type === 'CNAME'; });
    res.old = old;
    return res;
  }

  // ─── Etter-sjekk ──────────────────────────────────────────────────────────
  function after(d) {
    var snap = load(d);
    return nameservers(d).then(function (ns) {
      var items = [];
      if (!ns.every(isCfNs)) {
        items.push(['wait', 'Navnetjenerne er ikke byttet ennå',
          'Domenet bruker fortsatt: ' + ns.join(', ') + '. Har du lagret Cloudflare sine to hos leverandøren, kan det ta fra noen minutter til 24 timer før byttet slår gjennom. Prøv igjen litt senere.']);
        return { items: items, snap: snap };
      }
      items.push(['ok', 'Cloudflare styrer nå domenet ditt', ns.join(', ')]);

      var saved = snap ? snap.behold.filter(function (x) { return x.type !== 'MX'; }) : [];
      var keys = [];
      saved.forEach(function (x) { var k = x.name + '|' + x.asked; if (keys.indexOf(k) === -1) keys.push(k); });

      var jobs = [probe(d, 'MX'), probe(d, 'A'), probe('www.' + d, 'A')].concat(keys.map(function (k) {
        var p = k.split('|');
        return probe(p[0], p[1]);
      }));

      return Promise.all(jobs).then(function (r) {
        // E-post
        var mxHosts = r[0] ? r[0].values.map(lastWord) : [];
        var savedMx = snap ? snap.behold.filter(function (x) { return x.type === 'MX'; }) : [];
        var lostMx = savedMx.filter(function (x) { return mxHosts.indexOf(lastWord(x.value)) === -1; });
        var mailName = provider(mxHosts, MAIL) || mxHosts[0];
        if (lostMx.length) {
          items.push(['bad', mxHosts.length ? 'Noen e-postposter mangler' : 'E-posten din mangler',
            'Legg inn disse i Cloudflare (Add record, Type MX), ellers får du ikke e-post:', lostMx]);
        } else if (mxHosts.length && savedMx.length) {
          items.push(['ok', 'E-posten går fortsatt til ' + mailName, 'MX-postene er de samme som før byttet.']);
        } else if (mxHosts.length) {
          items.push(['ok', 'E-posten peker til ' + mailName,
            'Vi har ingen før-sjekk lagret i denne nettleseren, så vi kan ikke sammenligne. Er dette e-postleverandøren din, er alt i orden.']);
        } else if (!snap) {
          items.push(['warn', 'Fant ingen e-postposter (MX)',
            'Har du e-post på domenet, må MX-postene fra den gamle leverandøren legges inn i Cloudflare. Ta kontakt med oss hvis du er usikker.']);
        }

        // Andre poster fra før-sjekken
        var missing = [], proxied = [];
        keys.forEach(function (k, i) {
          var cur = r[3 + i];
          var curVals = cur ? cur.values.map(function (v) { return v.toLowerCase(); }) : [];
          saved.filter(function (x) { return x.name + '|' + x.asked === k; }).forEach(function (x) {
            if (curVals.indexOf(x.value.toLowerCase()) !== -1) return;
            if (x.grey && cur && cur.type !== 'CNAME' && cur.values.every(isCfIp)) proxied.push(x);
            else missing.push(x);
          });
        });
        if (proxied.length) {
          items.push(['bad', 'Disse må settes til grå sky',
            'Klikk Edit på hver av dem i Cloudflare og bytt fra Proxied (oransje sky) til DNS only (grå sky). Ellers kan e-post og andre tjenester slutte å virke.', proxied]);
        }
        if (missing.length) {
          items.push(['warn', 'Disse postene fant vi ikke igjen',
            'De lå hos den gamle leverandøren. Legg dem inn i Cloudflare med Add record, med nøyaktig samme Type, Name og verdi:', missing]);
        }
        if (saved.length && !proxied.length && !missing.length) {
          items.push(['ok', 'De andre postene er på plass', saved.length + ' poster fra før-sjekken er sjekket.']);
        }

        // Nettsiden
        [[r[1], d], [r[2], 'www.' + d]].forEach(function (p) {
          var rec = p[0], name = p[1];
          if (!rec) {
            items.push(['wait', name + ' er ikke koblet til nettsiden ennå',
              'Gjør steg 4 under (Add Domain). Har du gjort det, vent noen minutter og sjekk igjen.']);
          } else if (rec.type === 'CNAME') {
            items.push(['bad', name + ' peker fortsatt til den gamle nettsiden',
              'Slett CNAME-posten for ' + name + ' (verdi ' + rec.values[0] + ') i Cloudflare, og gjør så steg 4.']);
          } else if (rec.values.every(isCfIp)) {
            items.push(['ok', name + ' peker til Cloudflare', 'Det er her den nye nettsiden ligger.']);
          } else {
            var gammel = snap && rec.values.some(function (v) { return snap.old.indexOf(v) !== -1; });
            items.push(['bad', name + (gammel ? ' peker fortsatt til den gamle nettsiden' : ' peker ikke til Cloudflare'),
              'Slett A-posten for ' + name + ' med verdien ' + rec.values.join(', ') + ' i Cloudflare, og gjør så steg 4.']);
          }
        });

        return { items: items, snap: snap };
      });
    });
  }

  // ─── Visning ──────────────────────────────────────────────────────────────
  function displayName(name, d) {
    if (name === d) return esc(d) + ' <span class="dns-dim">(selve domenet)</span>';
    return esc(name.slice(0, -(d.length + 1)));
  }

  function rowHtml(x, d) {
    var val = x.value, meta = [];
    if (x.type === 'MX') { var p = val.split(' '); val = p[1]; meta.push('Prioritet ' + p[0]); }
    if (x.note) meta.push(x.note);
    if (x.grey) meta.push('Skal være grå sky (DNS only)');
    return '<div class="dns-row"><span class="dns-type">' + esc(x.type) + '</span>' +
      '<div class="dns-main"><div class="dns-name">' + displayName(x.name, d) + '</div>' +
      '<div class="dns-val">' + esc(val) + '</div>' +
      (meta.length ? '<div class="dns-meta">' + esc(meta.join(' · ')) + '</div>' : '') + '</div>' +
      '<button type="button" class="dns-copy" data-copy="' + esc(val) + '">Kopier</button></div>';
  }

  function box(kind, html) { return '<div class="dns-box dns-' + kind + '">' + html + '</div>'; }

  function section(kind, title, text, list, d, empty) {
    var body = list.length ? list.map(function (x) { return rowHtml(x, d); }).join('') : '<p class="dns-dim">' + empty + '</p>';
    return '<div class="dns-sec dns-sec-' + kind + '"><h5>' + title + '</h5><p>' + text + '</p>' + body + '</div>';
  }

  function renderFor(res) {
    var d = res.domain;
    var h = '<div class="dns-sum"><div><b>Domenet ditt:</b> ' + esc(d) + '</div>';
    if (res.nsProvider) h += '<div><b>DNS-en ligger i dag hos:</b> ' + esc(res.nsProvider) + '</div>';
    h += '<div><b>E-posten din:</b> ' + (res.mxHosts.length
      ? esc(res.mailProvider || 'egen e-postserver (' + res.mxHosts[0] + ')')
      : 'fant ingen e-post på domenet') + '</div></div>';

    if (res.onCf) {
      return h + box('info', 'Domenet ditt bruker allerede Cloudflare sine navnetjenere. Da viser oppslaget det som ligger i Cloudflare nå, ikke det som lå hos den gamle leverandøren, så lista blir ikke riktig. Har du allerede byttet navnetjenere, bruk «Sjekk at alt virker» i steg 4 i stedet.');
    }

    if (res.stop) {
      h += box('bad', '<b>Stopp, ikke slett noe ennå.</b> E-posten din går via samme adresse som den gamle nettsiden. Sletter du A-posten, kan e-posten slutte å virke. Send oss en e-post på <a href="mailto:adrian@dmarketing.no">adrian@dmarketing.no</a>, så hjelper vi deg med dette steget.');
    } else {
      h += section('slett', 'Slett disse i Cloudflare', 'Dette er den gamle nettsiden. Klikk <b>Delete</b> på hver av dem.',
        res.slett, d, 'Fant ingen gamle nettsideposter. Du trenger ikke slette noe.');
    }
    h += section('behold', 'Behold disse', 'Alle må stå i Cloudflare-lista. Mangler en, klikk <b>Add record</b> og legg den inn med samme Type, Name og verdi. Poster som slutter på <b>_domainkey</b> blir ofte borte, så sjekk dem ekstra. Er en «grå sky»-post satt til <b>Proxied</b> (oransje sky), klikk <b>Edit</b> og bytt til <b>DNS only</b>.',
      res.behold, d, 'Fant ingen e-postposter eller andre poster som må stå.');
    if (res.lastaa.length) {
      h += section('la', 'La disse stå', 'De kan være i bruk av e-post eller andre tjenester, og skader ikke den nye nettsiden.',
        res.lastaa, d, '');
    }
    h += '<p class="dns-foot">Ser du poster i Cloudflare som ikke står her? La dem stå. Det eneste du skal slette er de røde.</p>';
    return h;
  }

  var ICON = { ok: '✓', wait: '…', warn: '!', bad: '✕' };

  function renderAfter(out, d) {
    var h = '';
    if (!out.snap) h += '<p class="dns-dim">Vi fant ingen før-sjekk for ' + esc(d) + ' i denne nettleseren, så vi sjekker bare det viktigste.</p>';
    out.items.forEach(function (it) {
      h += '<div class="dns-check dns-check-' + it[0] + '"><span class="dns-ico">' + ICON[it[0]] + '</span><div class="dns-main">' +
        '<div class="dns-ctitle">' + esc(it[1]) + '</div><div class="dns-ctext">' + esc(it[2]) + '</div>' +
        (it[3] ? it[3].map(function (x) { return rowHtml(x, d); }).join('') : '') + '</div></div>';
    });
    var allOk = out.items.every(function (it) { return it[0] === 'ok'; });
    if (allOk) h += box('ok', '<b>Alt ser bra ut.</b> Det kan ta opptil en time før nettsiden vises med hengelås i nettleseren.');
    return h;
  }

  function errMsg(err, d) {
    if (err.message === 'nx') return 'Fant ikke domenet «' + esc(d) + '». Sjekk at det er stavet riktig.';
    if (err.message === 'notapex') return 'Skriv inn selve domenet, for eksempel dittfirma.no, ikke en underadresse.';
    return 'Klarte ikke å slå opp domenet. Sjekk internettforbindelsen og prøv igjen.';
  }

  var TEXT = {
    'for': {
      title: 'Få din personlige DNS-liste',
      intro: 'Skriv inn domenet ditt, så får du vite nøyaktig hvilke poster du skal slette og hvilke som må stå.',
      btn: 'Sjekk domenet'
    },
    etter: {
      title: 'Sjekk at alt virker',
      intro: 'Sjekker at Cloudflare har tatt over, at e-posten virker og at domenet viser den nye nettsiden. Kjør den så ofte du vil.',
      btn: 'Sjekk nå'
    }
  };

  var CSS = '.dns-wrap{background:#fff;border:2px solid #0339f8;border-radius:16px;padding:22px;margin:1.5rem 0;font-family:Inter,sans-serif;color:#3F3F46}' +
    '.dns-wrap h4{font-family:Archivo,sans-serif;font-weight:800;font-size:1.1rem;color:#09090B;margin:6px 0 6px}' +
    '.dns-tag{display:inline-block;background:#EEF2FF;color:#0339f8;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:6px}' +
    '.dns-wrap p{font-size:.92rem;line-height:1.6;margin:0 0 .75rem}' +
    '.dns-form{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 4px}' +
    '.dns-form input{flex:1 1 200px;min-width:0;border:1.5px solid #D4D4D8;border-radius:10px;padding:11px 14px;font-size:1rem;font-family:inherit;color:#09090B}' +
    '.dns-form input:focus{outline:none;border-color:#0339f8;box-shadow:0 0 0 3px rgba(3,57,248,.15)}' +
    '.dns-form button{background:#0339f8;color:#fff;border:none;border-radius:10px;padding:11px 20px;font-weight:700;font-size:.95rem;cursor:pointer;font-family:Archivo,sans-serif}' +
    '.dns-form button:disabled{opacity:.6;cursor:default}' +
    '.dns-out:not(:empty){margin-top:16px}' +
    '.dns-sum{background:#F4F4F5;border-radius:10px;padding:12px 14px;font-size:.9rem;line-height:1.7;margin-bottom:14px;word-break:break-word}' +
    '.dns-sum b{color:#09090B}' +
    '.dns-sec{border-radius:12px;padding:14px;margin-bottom:12px;border:1.5px solid}' +
    '.dns-sec h5{font-family:Archivo,sans-serif;font-weight:800;font-size:1rem;margin:0 0 4px}' +
    '.dns-sec p{font-size:.88rem;margin:0 0 10px}' +
    '.dns-sec-slett{background:#FEF2F2;border-color:#FCA5A5}.dns-sec-slett h5{color:#B91C1C}' +
    '.dns-sec-behold{background:#F0FDF4;border-color:#86EFAC}.dns-sec-behold h5{color:#15803D}' +
    '.dns-sec-la{background:#FAFAFA;border-color:#E4E4E7}.dns-sec-la h5{color:#52525B}' +
    '.dns-row{display:flex;align-items:flex-start;gap:10px;background:#fff;border:1px solid #E4E4E7;border-radius:8px;padding:9px 10px;margin-top:6px}' +
    '.dns-type{flex:0 0 auto;min-width:48px;text-align:center;background:#09090B;color:#fff;font-size:.72rem;font-weight:700;border-radius:5px;padding:3px 6px;margin-top:1px}' +
    '.dns-main{flex:1 1 auto;min-width:0}' +
    '.dns-name{font-weight:600;color:#09090B;font-size:.88rem}' +
    '.dns-val{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.8rem;color:#3F3F46;word-break:break-all;margin-top:2px}' +
    '.dns-meta{font-size:.75rem;color:#0339f8;font-weight:600;margin-top:3px}' +
    '.dns-copy{flex:0 0 auto;background:#F4F4F5;border:1px solid #E4E4E7;border-radius:6px;font-size:.75rem;font-weight:600;padding:4px 9px;cursor:pointer;color:#3F3F46}' +
    '.dns-dim{color:#71717A;font-weight:400}' +
    '.dns-foot{font-size:.82rem!important;color:#52525B;font-style:italic}' +
    '.dns-box{border-radius:10px;padding:12px 14px;font-size:.9rem;line-height:1.6;margin-bottom:12px}' +
    '.dns-box a{color:inherit;font-weight:700}' +
    '.dns-info{background:#EEF2FF;color:#1E3A8A}.dns-bad{background:#FEF2F2;color:#991B1B;border:1.5px solid #FCA5A5}.dns-ok{background:#F0FDF4;color:#14532D;border:1.5px solid #86EFAC}' +
    '.dns-check{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid #F4F4F5}' +
    '.dns-check:first-of-type{border-top:none}' +
    '.dns-ico{flex:0 0 26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;color:#fff}' +
    '.dns-check-ok .dns-ico{background:#16A34A}.dns-check-wait .dns-ico{background:#A1A1AA}.dns-check-warn .dns-ico{background:#D97706}.dns-check-bad .dns-ico{background:#DC2626}' +
    '.dns-ctitle{font-weight:700;color:#09090B;font-size:.92rem}' +
    '.dns-ctext{font-size:.86rem;line-height:1.55;word-break:break-word}' +
    '@media (max-width:600px){.dns-wrap{padding:14px;border-radius:12px}.dns-sec{padding:10px}.dns-row{flex-wrap:wrap;gap:6px 8px}.dns-copy{margin-left:auto}}';

  function mount(el) {
    var mode = el.getAttribute('data-dns-sjekker') === 'etter' ? 'etter' : 'for';
    var t = TEXT[mode];
    el.className += ' dns-wrap not-prose';
    el.innerHTML = '<span class="dns-tag">Verktøy</span><h4>' + t.title + '</h4><p>' + t.intro + '</p>' +
      '<form class="dns-form"><input type="text" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="dittfirma.no" aria-label="Domenet ditt">' +
      '<button type="submit">' + t.btn + '</button></form><div class="dns-out" aria-live="polite"></div>';

    var input = el.querySelector('input'), btn = el.querySelector('button'), out = el.querySelector('.dns-out');
    try { var last = localStorage.getItem(STORE + 'sist'); if (last) input.value = last; } catch (e) {}

    el.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = norm(input.value);
      if (!d) { out.innerHTML = box('bad', 'Skriv inn domenet ditt, for eksempel dittfirma.no.'); return; }
      try { localStorage.setItem(STORE + 'sist', d); } catch (err) {}
      btn.disabled = true;
      btn.textContent = 'Sjekker…';
      out.innerHTML = '<p class="dns-dim">Slår opp DNS-postene for ' + esc(d) + '…</p>';

      var job = mode === 'etter'
        ? after(d).then(function (res) { return renderAfter(res, d); })
        : analyze(d).then(function (res) {
          if (!res.onCf) save(d, { t: Date.now(), old: res.old, behold: res.behold });
          return renderFor(res);
        });

      job.then(function (html) { out.innerHTML = html; }, function (err) { out.innerHTML = box('bad', errMsg(err, d)); })
        .then(function () { btn.disabled = false; btn.textContent = t.btn; });
    });

    el.addEventListener('click', function (e) {
      var b = e.target.closest('.dns-copy');
      if (!b || !navigator.clipboard) return;
      navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () {
        b.textContent = 'Kopiert ✓';
        setTimeout(function () { b.textContent = 'Kopier'; }, 1500);
      });
    });
  }

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  Array.prototype.forEach.call(document.querySelectorAll('[data-dns-sjekker]'), mount);
})();
