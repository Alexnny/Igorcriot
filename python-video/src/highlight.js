// Realce de sintaxe Python (tokenizador simples) + renderização parcial p/ digitação.
const KW = new Set(['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'import', 'from', 'as',
  'try', 'except', 'finally', 'break', 'continue', 'pass', 'class', 'with', 'lambda', 'is', 'raise', 'global', 'yield']);
const CONST = new Set(['True', 'False', 'None']);
const BUILTIN = new Set(['print', 'input', 'int', 'float', 'str', 'bool', 'len', 'type', 'range', 'enumerate', 'list',
  'dict', 'set', 'tuple', 'max', 'min', 'sum', 'sorted', 'abs', 'round']);

export function tokenize(code) {
  const toks = [];
  let i = 0;
  const push = (text, cls) => toks.push({ text, cls });
  let prevWord = '';
  while (i < code.length) {
    const c = code[i];
    if (c === '#') {
      let j = code.indexOf('\n', i); if (j < 0) j = code.length;
      push(code.slice(i, j), 'com'); i = j; continue;
    }
    // strings (com prefixo f opcional)
    const isF = (c === 'f' || c === 'F') && (code[i + 1] === '"' || code[i + 1] === "'");
    if (c === '"' || c === "'" || isF) {
      const start = i;
      if (isF) i++;
      const q = code[i];
      const triple = code.slice(i, i + 3) === q.repeat(3);
      const endQ = triple ? q.repeat(3) : q;
      let j = i + endQ.length;
      while (j < code.length && code.slice(j, j + endQ.length) !== endQ && (triple || code[j] !== '\n')) j++;
      j = Math.min(code.length, j + endQ.length);
      const s = code.slice(start, j);
      if (isF) {
        // separa {expr}
        let k = 0, buf = '';
        while (k < s.length) {
          if (s[k] === '{') {
            if (buf) push(buf, 'str'); buf = '';
            const e = s.indexOf('}', k);
            push('{', 'fbr'); push(s.slice(k + 1, e), 'fex'); push('}', 'fbr');
            k = e + 1;
          } else { buf += s[k++]; }
        }
        if (buf) push(buf, 'str');
      } else push(s, triple ? 'doc' : 'str');
      i = j; prevWord = ''; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i; while (j < code.length && /[0-9._]/.test(code[j])) j++;
      push(code.slice(i, j), 'num'); i = j; continue;
    }
    if (/[A-Za-z_À-ÿ]/.test(c)) {
      let j = i; while (j < code.length && /[A-Za-z0-9_À-ÿ]/.test(code[j])) j++;
      const w = code.slice(i, j);
      let cls = 'id';
      if (KW.has(w)) cls = 'kw';
      else if (CONST.has(w)) cls = 'const';
      else if (prevWord === 'def') cls = 'fn';
      else if (BUILTIN.has(w) && code[j] === '(') cls = 'bi';
      else if (code[j] === '(') cls = 'call';
      else if (code[i - 1] === '.') cls = 'attr';
      push(w, cls); prevWord = w; i = j; continue;
    }
    if ('=+-*/%<>!&|'.includes(c)) {
      let j = i; while (j < code.length && '=+-*/%<>!&|'.includes(code[j])) j++;
      push(code.slice(i, j), 'op'); i = j; continue;
    }
    if ('()[]{}'.includes(c)) { push(c, 'br'); i++; continue; }
    push(c, c === '\n' ? 'nl' : 'pun'); i++;
  }
  return toks;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Retorna array de linhas HTML com os primeiros n caracteres.
export function renderPartial(toks, n) {
  const lines = [''];
  let left = n;
  for (const tk of toks) {
    if (left <= 0) break;
    const piece = tk.text.slice(0, left);
    left -= piece.length;
    const parts = piece.split('\n');
    parts.forEach((p, idx) => {
      if (idx > 0) lines.push('');
      if (p) lines[lines.length - 1] += `<span class="t-${tk.cls}">${esc(p)}</span>`;
    });
  }
  return lines;
}

// Destaca `código` inline em textos explicativos
export function inlineMd(s) {
  return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
}
