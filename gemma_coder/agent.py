#!/usr/bin/env python3
"""
gemma_coder — lokal agentic AI-kodingsassistent drevet av Ollama
ReAct-loop: tenk → handling → observer → gjenta
"""

import sys
import json
import re
import subprocess
import fnmatch
import textwrap
from pathlib import Path
from datetime import datetime

import requests
import click
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.rule import Rule
from rich.prompt import Confirm, Prompt

# ── konfigurasjon ──────────────────────────────────────────────────────────────
SCRIPT_DIR      = Path(__file__).resolve().parent
OLLAMA_URL      = "http://localhost:11434/api/generate"
DEFAULT_MODEL   = "codegemma"
HISTORY_FILE    = SCRIPT_DIR / ".gemma_history.json"
RULES_FILE      = Path("REGLER.md")          # prosjektregler (som CLAUDE.md)
CONTEXT_FILE    = SCRIPT_DIR / "KONTEKST.md"  # bakgrunn om bruker/prosjekter
MEMORY_DIR      = SCRIPT_DIR / "minne"        # vedvarende minne (som Claude Code)
MEMORY_INDEX    = MEMORY_DIR / "MINNE.md"
MAX_FILE_BYTES  = 40_000                      # maks filstørrelse sendt til modellen
MAX_ITER        = 12                          # maks agentic-runder per spørring
SKIP_DIRS       = {".git","node_modules","venv","__pycache__",".next",
                   "dist","build",".venv","env","coverage",".mypy_cache"}
SKIP_EXT        = {".png",".jpg",".jpeg",".gif",".webp",".svg",".ico",
                   ".woff",".woff2",".ttf",".eot",".otf",".mp4",".mp3",
                   ".zip",".tar",".gz",".pdf",".exe",".dll",".so",".pyc"}

console = Console()

# ── Ollama ─────────────────────────────────────────────────────────────────────
def check_ollama() -> bool:
    try:
        return requests.get("http://localhost:11434/", timeout=3).status_code == 200
    except Exception:
        return False

def list_models() -> list[str]:
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=5)
        return [m["name"] for m in r.json().get("models", [])]
    except Exception:
        return []

def call_model(prompt: str, model: str, history: list[dict]) -> str:
    # Bygg opp fullstendig prompt med historikk
    full = prompt
    if history:
        hist_text = "\n".join(
            f"Bruker: {h['user']}\nAssistent: {h['assistant']}" for h in history[-6:]
        )
        full = f"SAMTALEHISTORIKK (siste runder):\n{hist_text}\n\n{prompt}"
    payload = {
        "model": model,
        "prompt": full,
        "stream": False,
        "options": {"temperature": 0.15, "num_ctx": 8192},
    }
    with console.status(f"[bold green]{model} tenker...[/bold green]"):
        r = requests.post(OLLAMA_URL, json=payload, timeout=180)
        r.raise_for_status()
    return r.json().get("response", "").strip()

# ── prosjektsøk ───────────────────────────────────────────────────────────────
def read_gitignore(root: Path) -> list[str]:
    gi = root / ".gitignore"
    if not gi.exists():
        return []
    patterns = []
    for line in gi.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            patterns.append(line)
    return patterns

def is_ignored(path: Path, root: Path, gi_patterns: list[str]) -> bool:
    rel = str(path.relative_to(root)).replace("\\", "/")
    for pat in gi_patterns:
        if fnmatch.fnmatch(rel, pat) or fnmatch.fnmatch(path.name, pat):
            return True
    return False

def list_project_files(root: Path = Path("."), max_files: int = 300) -> list[Path]:
    root = root.resolve()
    gi  = read_gitignore(root)
    out = []
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if any(d in SKIP_DIRS for d in p.parts):
            continue
        if p.suffix.lower() in SKIP_EXT:
            continue
        if is_ignored(p, root, gi):
            continue
        out.append(p)
        if len(out) >= max_files:
            break
    return sorted(out)

def read_file_safe(path: Path) -> str:
    if not path.exists():
        return f"[FEIL] Fil ikke funnet: {path}"
    if path.stat().st_size > MAX_FILE_BYTES:
        return f"[ADVARSEL] Fil for stor ({path.stat().st_size} bytes), viser første {MAX_FILE_BYTES} bytes:\n" \
               + path.read_bytes()[:MAX_FILE_BYTES].decode("utf-8", errors="replace")
    try:
        return path.read_text(encoding="utf-8")
    except Exception as e:
        return f"[FEIL] Kunne ikke lese {path}: {e}"

def grep_files(pattern: str, root: Path = Path("."), glob: str = "*") -> str:
    results = []
    files = list_project_files(root)
    regex = re.compile(pattern, re.IGNORECASE)
    for f in files:
        if not fnmatch.fnmatch(f.name, glob) and glob != "*":
            continue
        try:
            for i, line in enumerate(f.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                if regex.search(line):
                    results.append(f"{f}:{i}: {line}")
                    if len(results) > 200:
                        results.append("... (avkortet)")
                        return "\n".join(results)
        except Exception:
            pass
    return "\n".join(results) if results else "(ingen treff)"

def glob_files(pattern: str, root: Path = Path(".")) -> str:
    matches = [str(p) for p in Path(root).rglob(pattern)
               if not any(d in SKIP_DIRS for d in p.parts)]
    return "\n".join(matches) if matches else "(ingen filer funnet)"

# ── verktøy: skriving og redigering ──────────────────────────────────────────
def write_file(path: Path, content: str) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return f"✓ Skrev {path} ({len(content)} tegn)"

def edit_file(path: Path, old_text: str, new_text: str) -> str:
    if not path.exists():
        return f"[FEIL] Fil ikke funnet: {path}"
    content = path.read_text(encoding="utf-8")
    if old_text not in content:
        return f"[FEIL] Fant ikke teksten i {path}. Sjekk at den er identisk med filen."
    updated = content.replace(old_text, new_text, 1)
    path.write_text(updated, encoding="utf-8")
    return f"✓ Redigerte {path}"

def run_command(cmd: str, cwd: Path = Path(".")) -> str:
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True,
            timeout=60, cwd=cwd
        )
        out = result.stdout.strip()
        err = result.stderr.strip()
        parts = []
        if out:
            parts.append(f"STDOUT:\n{out}")
        if err:
            parts.append(f"STDERR:\n{err}")
        parts.append(f"Exit-kode: {result.returncode}")
        return "\n".join(parts) if parts else "(ingen output)"
    except subprocess.TimeoutExpired:
        return "[FEIL] Kommando tok for lang tid (timeout 60s)"
    except Exception as e:
        return f"[FEIL] {e}"

# ── regler / kontekst / minne (som CLAUDE.md + memory) ───────────────────────
def load_rules(root: Path) -> str:
    for f in [RULES_FILE, root / "CLAUDE.md", root / "AGENTS.md",
              root / "GEMINI.md", SCRIPT_DIR / "REGLER.md"]:
        if f.exists():
            return f.read_text(encoding="utf-8")
    return ""

def load_context() -> str:
    """Last KONTEKST.md — bakgrunn om bruker og prosjekter."""
    if CONTEXT_FILE.exists():
        return CONTEXT_FILE.read_text(encoding="utf-8")
    return ""

def load_memory() -> str:
    """Last hele minnet: indeks + alle enkeltminner."""
    if not MEMORY_DIR.exists():
        return ""
    parts = []
    if MEMORY_INDEX.exists():
        parts.append(MEMORY_INDEX.read_text(encoding="utf-8"))
    for f in sorted(MEMORY_DIR.glob("*.md")):
        if f.name == "MINNE.md":
            continue
        parts.append(f"\n--- minne/{f.name} ---\n{f.read_text(encoding='utf-8')}")
    return "\n".join(parts)

def save_memory(name: str, description: str, body: str, mem_type: str = "project") -> str:
    """Lagre et nytt minne (som Claude Code sitt memory-system)."""
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^a-z0-9-]", "", name.lower().replace(" ", "-")) or "minne"
    fpath = MEMORY_DIR / f"{slug}.md"
    content = f"---\ntype: {mem_type}\n---\n{body}\n"
    fpath.write_text(content, encoding="utf-8")
    # Oppdater indeksen
    index = MEMORY_INDEX.read_text(encoding="utf-8") if MEMORY_INDEX.exists() else "# Minne — gemma_coder\n"
    line = f"- [{name}]({slug}.md) — {description}"
    if slug not in index:
        index = index.rstrip() + "\n" + line + "\n"
        MEMORY_INDEX.write_text(index, encoding="utf-8")
    return f"✓ Lagret minne: {slug}.md"

# ── samtalehistorikk ──────────────────────────────────────────────────────────
def load_history() -> list[dict]:
    if HISTORY_FILE.exists():
        try:
            return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []

def save_history(history: list[dict]):
    HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2),
                             encoding="utf-8")

# ── ReAct-parser ──────────────────────────────────────────────────────────────
ACTION_RE = re.compile(
    r"ACTION:\s*(\w+)\n(.*?)(?=ACTION:|\Z)", re.DOTALL | re.IGNORECASE
)

def parse_actions(text: str) -> list[dict]:
    actions = []
    for m in ACTION_RE.finditer(text):
        name = m.group(1).strip().lower()
        body = m.group(2).strip()
        params = {}
        for line in body.splitlines():
            if ":" in line:
                k, _, v = line.partition(":")
                params[k.strip().lower()] = v.strip()
        # Håndter flerlinjet innhold (f.eks. content, old, new)
        for key in ("content", "old", "new"):
            block_re = re.compile(
                rf"{key}:\s*```[^\n]*\n(.*?)```", re.DOTALL | re.IGNORECASE
            )
            bm = block_re.search(body)
            if bm:
                params[key] = bm.group(1)
        actions.append({"name": name, "params": params})
    return actions

def execute_action(action: dict, root: Path) -> str:
    n = action["name"]
    p = action["params"]
    if n == "read_file":
        return read_file_safe(root / p.get("path", ""))
    elif n == "list_files":
        files = list_project_files(root)
        return "\n".join(str(f.relative_to(root)) for f in files)
    elif n == "search" or n == "grep":
        return grep_files(p.get("pattern", ""), root, p.get("glob", "*"))
    elif n == "glob":
        return glob_files(p.get("pattern", "**/*"), root)
    elif n == "write_file":
        return write_file(root / p.get("path", ""), p.get("content", ""))
    elif n == "edit_file":
        return edit_file(root / p.get("path", ""), p.get("old", ""), p.get("new", ""))
    elif n == "run" or n == "run_command":
        return run_command(p.get("cmd", ""), root)
    elif n == "git":
        return run_command(f"git {p.get('cmd', 'status')}", root)
    elif n == "save_memory":
        return save_memory(
            p.get("name", "minne"),
            p.get("description", ""),
            p.get("content", p.get("body", "")),
            p.get("type", "project"),
        )
    elif n == "done":
        return "__DONE__"
    else:
        return f"[UKJENT HANDLING: {n}]"

# ── systemprompt ───────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """Du er en ekspert AI-kodingsassistent som kjører lokalt. Du hjelper med å lese, endre og kjøre kode.

Du har tilgang til disse verktøyene. Bruk dem ved å skrive eksakt slik:

ACTION: read_file
path: src/index.js

ACTION: list_files

ACTION: search
pattern: funksjonsNavn
glob: *.py

ACTION: glob
pattern: **/*.css

ACTION: write_file
path: src/ny_fil.js
content: ```
// kode her
```

ACTION: edit_file
path: src/index.js
old: ```
gammel kode her (nøyaktig)
```
new: ```
ny kode her
```

ACTION: run_command
cmd: npm test

ACTION: git
cmd: status

ACTION: save_memory
name: Kort tittel
description: Én linje for indeksen
type: project
content: ```
Fakta du vil huske til neste samtale.
```

ACTION: done

VIKTIGE REGLER (jobb som Claude Code):
- Tenk steg for steg. Bruk verktøy for å UTFORSKE koden (read_file, search, list_files) FØR du endrer noe.
- Bruk edit_file (presist) fremfor write_file (full overskriving) når det er mulig.
- Etter run_command: les output og fiks eventuelle feil. Verifiser før du sier deg ferdig.
- Ikke legg til funksjonalitet brukeren ikke ba om. Ikke reformater kode du ikke endrer.
- Vær konkret og direkte. Ikke skriv lange forklaringer når en kort holder.
- Følg PROSJEKTREGLER og KONTEKST som er gitt deg. Respekter MINNE fra tidligere samtaler.
- Når du lærer noe varig viktig om brukeren eller prosjektet: bruk save_memory.
- Avslutt alltid med ACTION: done når oppgaven er ferdig.
- Skriv bare på norsk. Svar med ACTION-blokker, ikke bare tekst, når du skal gjøre noe.
"""

# ── agentic loop ───────────────────────────────────────────────────────────────
def run_agent(instruction: str, model: str, root: Path, history: list[dict],
              auto_approve: bool = False):
    rules = load_rules(root)
    context = load_context()
    memory = load_memory()
    project_files = list_project_files(root)
    file_list = "\n".join(str(f.relative_to(root)) for f in project_files[:100])

    context_block = f"KONTEKST (bakgrunn om bruker og prosjekter):\n{context}\n" if context else ""
    memory_block  = f"MINNE (fakta fra tidligere samtaler):\n{memory}\n" if memory else ""
    rules_block   = f"PROSJEKTREGLER:\n{rules}" if rules else ""
    more          = "... og flere" if len(project_files) > 100 else ""

    prompt = f"""{SYSTEM_PROMPT}

{context_block}
{memory_block}
{rules_block}

PROSJEKTFILER (oversikt):
{file_list}
{more}

BRUKERENS INSTRUKSJON:
{instruction}

Start med å tenke på hva du trenger å gjøre, bruk deretter verktøyene steg for steg.
"""

    conversation = prompt
    full_response_parts = []

    for iteration in range(MAX_ITER):
        console.print(Rule(f"[dim]Runde {iteration + 1}[/dim]"))
        raw = call_model(conversation, model, history)
        full_response_parts.append(raw)

        # Vis modellens respons
        console.print(Panel(raw, title="[bold cyan]Gemma[/bold cyan]", expand=False))

        actions = parse_actions(raw)

        if not actions:
            # Ingen handlinger → modellen er ferdig med svar
            break

        observations = []
        done = False
        for action in actions:
            if action["name"] == "done":
                done = True
                break

            # Bekreft destruktive handlinger
            destructive = action["name"] in ("write_file", "edit_file", "run_command", "git")
            if destructive and not auto_approve:
                console.print(f"\n[yellow]Handling: {action['name']}[/yellow] {action['params']}")
                if not Confirm.ask("Tillat denne handlingen?", default=True):
                    observations.append(f"AVVIST: bruker avviste {action['name']}")
                    continue

            result = execute_action(action, root)
            console.print(f"[dim]→ {action['name']}: {str(result)[:200]}[/dim]")
            observations.append(f"RESULTAT av {action['name']}:\n{result}")

        if done:
            break

        # Legg observasjoner til i samtalen og iterer
        obs_text = "\n\n".join(observations)
        conversation += f"\n\nASSISTENT:\n{raw}\n\nOBSERVASJONER:\n{obs_text}\n\nFortsett:"

    final = "\n\n".join(full_response_parts)
    history.append({
        "user": instruction,
        "assistant": final[:2000],  # Lagre ikke ubegrenset
        "time": datetime.now().isoformat()
    })
    save_history(history)
    return final

# ── CLI ────────────────────────────────────────────────────────────────────────
@click.group()
def cli():
    """gemma_coder — lokal AI-kodingsagent med full prosjekttilgang"""
    pass

@cli.command()
@click.argument("instruction", required=False)
@click.option("-m", "--model", default=DEFAULT_MODEL, show_default=True)
@click.option("-r", "--root", default=".", type=click.Path(exists=True),
              help="Prosjektmappe (standard: gjeldende mappe)")
@click.option("-y", "--yes", is_flag=True, help="Godkjenn alle handlinger automatisk")
def run(instruction, model, root, yes):
    """Kjør en instruksjon. Uten instruksjon starter interaktiv modus."""
    if not check_ollama():
        console.print("[bold red]Ollama kjører ikke.[/bold red] Start med: ollama serve")
        sys.exit(1)

    history = load_history()
    root_path = Path(root).resolve()

    if instruction:
        run_agent(instruction, model, root_path, history, auto_approve=yes)
    else:
        # Interaktiv modus (REPL)
        console.print(Panel(
            f"[bold green]gemma_coder interaktiv modus[/bold green]\n"
            f"Modell: {model} | Rot: {root_path}\n"
            f"Skriv 'avslutt' for å avslutte | 'tøm' for å slette historikk",
            title="gemma_coder"
        ))
        while True:
            try:
                instr = Prompt.ask("\n[bold cyan]Du[/bold cyan]")
            except (EOFError, KeyboardInterrupt):
                break
            if instr.lower() in ("avslutt", "exit", "quit", "q"):
                break
            if instr.lower() in ("tøm", "clear", "reset"):
                history.clear()
                save_history(history)
                console.print("[dim]Historikk slettet.[/dim]")
                continue
            if not instr.strip():
                continue
            run_agent(instr, model, root_path, history, auto_approve=yes)

@cli.command()
def models():
    """List installerte Ollama-modeller."""
    if not check_ollama():
        console.print("[bold red]Ollama kjører ikke.[/bold red]")
        sys.exit(1)
    ms = list_models()
    if not ms:
        console.print("Ingen modeller. Kjør: [bold]ollama pull codegemma[/bold]")
        return
    for m in ms:
        console.print(f"  • {m}")

@cli.command()
def status():
    """Sjekk Ollama-tilkobling, kontekst, minne og prosjektfiler."""
    if check_ollama():
        ms = list_models()
        console.print(f"[bold green]✓ Ollama kjører[/bold green] — {len(ms)} modell(er): {', '.join(ms)}")
    else:
        console.print("[bold red]✗ Ollama svarer ikke[/bold red]")
    console.print(f"[{'green' if CONTEXT_FILE.exists() else 'red'}]KONTEKST.md: {'lastet' if CONTEXT_FILE.exists() else 'mangler'}[/]")
    n_mem = len(list(MEMORY_DIR.glob('*.md'))) - 1 if MEMORY_DIR.exists() else 0
    console.print(f"[{'green' if n_mem > 0 else 'yellow'}]Minne: {max(n_mem,0)} fakta lagret[/]")
    files = list_project_files()
    console.print(f"[dim]Finner {len(files)} filer i prosjektet[/dim]")


@cli.command()
def memory():
    """Vis alt agenten husker (kontekst + minne)."""
    if MEMORY_INDEX.exists():
        console.print(Panel(MEMORY_INDEX.read_text(encoding="utf-8"),
                            title="[bold cyan]Minne-indeks[/bold cyan]"))
    else:
        console.print("[dim]Ingen minner ennå.[/dim]")

@cli.command()
def history():
    """Vis samtalehistorikk."""
    h = load_history()
    if not h:
        console.print("[dim]Ingen historikk.[/dim]")
        return
    for i, entry in enumerate(h, 1):
        console.print(f"\n[bold]{i}.[/bold] [{entry.get('time','?')}]")
        console.print(f"  Bruker: {entry['user'][:100]}")
        console.print(f"  Svar:   {entry['assistant'][:100]}...")

@cli.command("clear-history")
def clear_history():
    """Slett samtalehistorikk."""
    if HISTORY_FILE.exists():
        HISTORY_FILE.unlink()
    console.print("[dim]Historikk slettet.[/dim]")

@cli.command()
@click.argument("root", default=".", type=click.Path(exists=True))
def files(root):
    """List alle prosjektfiler agenten kan lese."""
    fs = list_project_files(Path(root))
    console.print(f"[bold]{len(fs)} filer:[/bold]")
    for f in fs:
        console.print(f"  {f}")

if __name__ == "__main__":
    cli()
