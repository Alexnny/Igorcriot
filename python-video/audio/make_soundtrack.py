#!/usr/bin/env python3
"""Trilha sonora synthwave + efeitos sonoros (SFX) sincronizados com a timeline do vídeo.

Tudo é sintetizado do zero com numpy (síntese aditiva, sem samples externos):
  - música: pad de acordes, baixo pulsante, arpejo com delay, bateria eletrônica
  - SFX: whoosh, impacto, blips, teclas digitando, execução, conquista, fanfarra

Uso: python3 audio/make_soundtrack.py audio/events.json saida.wav
"""
import json
import sys
import wave

import numpy as np

SR = 44100
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
LOOP_BARS = 8
LOOP = BAR * LOOP_BARS
rng = np.random.default_rng(42)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def saw_additive(freq, dur, bright=3000.0, detune_cents=(0,), phase_seed=0):
    """Dente-de-serra limitada em banda (soma de harmônicos) com 'brilho' controlado."""
    t = t_axis(dur)
    out = np.zeros_like(t)
    r = np.random.default_rng(phase_seed)
    for dc in detune_cents:
        f = freq * 2 ** (dc / 1200)
        nmax = max(1, int(min(bright * 2.5, 16000) / f))
        for n in range(1, nmax + 1):
            w = (1.0 / n) * np.exp(-((n * f) / bright) ** 2)
            if w < 1e-3:
                break
            out += w * np.sin(2 * np.pi * n * f * t + r.random() * 6.283)
    return out / len(detune_cents)


def env_adsr(n, a, d, s, r, sr=SR):
    e = np.ones(n) * s
    na, nd, nr = int(a * sr), int(d * sr), int(r * sr)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na, endpoint=False) if na else e[:na]
    end_d = min(n, na + nd)
    if end_d > na:
        e[na:end_d] = np.linspace(1, s, end_d - na, endpoint=False)
    if nr and n > nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def place(buf, sig, start_s, gain=1.0, pan=0.0, wrap=False):
    """Soma sinal mono/estéreo em buf (estéreo) no tempo start_s."""
    if sig.ndim == 1:
        l = sig * np.cos((pan + 1) * np.pi / 4)
        r = sig * np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([l, r], 1) * 1.4142
    i0 = int(round(start_s * SR))
    n = len(sig)
    if wrap:
        idx = (np.arange(n) + i0) % len(buf)
        np.add.at(buf, idx, sig * gain)
        return
    if i0 >= len(buf):
        return
    i1 = min(len(buf), i0 + n)
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
        i1 = min(len(buf), len(sig))
    buf[i0:i1] += sig[: i1 - i0] * gain


def impulse_response(dur=2.4, decay=2.8, bright=0.55, seed=1):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for c in range(2):
        noise = r.standard_normal(n)
        # suaviza (filtra agudos) via média móvel no domínio da frequência
        spec = np.fft.rfft(noise)
        f = np.fft.rfftfreq(n, 1 / SR)
        spec *= np.exp(-(f / (9000 * bright)) ** 2)
        noise = np.fft.irfft(spec, n)
        ir[:, c] = noise * np.exp(-t * decay)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]
    return ir / np.sqrt((ir ** 2).sum(0, keepdims=True)) * 0.5


def convolve(sig, ir, circular=False):
    """Convolução via FFT. circular=True → cauda volta ao início (loops sem emenda)."""
    out = np.zeros_like(sig) if circular else np.zeros((len(sig) + len(ir) - 1, 2))
    for c in range(2):
        if circular:
            n = len(sig)
            irc = np.zeros(n)
            m = min(n, len(ir))
            irc[:m] = ir[:m, c]
            out[:, c] = np.fft.irfft(np.fft.rfft(sig[:, c]) * np.fft.rfft(irc), n)
        else:
            n = len(sig) + len(ir) - 1
            N = 1 << (n - 1).bit_length()
            out[:, c] = np.fft.irfft(np.fft.rfft(sig[:, c], N) * np.fft.rfft(ir[:, c], N), N)[:n]
    return out


def lowpass_fft(sig, cutoff, circular=True):
    n = len(sig)
    f = np.fft.rfftfreq(n, 1 / SR)
    h = 1 / np.sqrt(1 + (f / cutoff) ** 4)
    out = np.zeros_like(sig)
    for c in range(sig.shape[1]):
        out[:, c] = np.fft.irfft(np.fft.rfft(sig[:, c]) * h, n)
    return out


def highpass_fft(x, cutoff):
    n = len(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    h = 1 / np.sqrt(1 + (cutoff / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(np.fft.rfft(x) * h, n)


# ------------------------------------------------------------------ MÚSICA
# Lá menor: Am – F – C – G | Am – F – Dm – E
PROG = [
    (57, [57, 60, 64, 69]),  # Am
    (53, [53, 57, 60, 65]),  # F
    (48, [55, 60, 64, 67]),  # C
    (55, [55, 59, 62, 67]),  # G
    (57, [57, 60, 64, 69]),  # Am
    (53, [53, 57, 60, 65]),  # F
    (50, [53, 57, 62, 65]),  # Dm
    (52, [52, 56, 59, 64]),  # E
]
REVERB = impulse_response(2.6, 2.4, 0.6, seed=3)


def kick():
    t = t_axis(0.45)
    f = 48 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    click = rng.standard_normal(len(t)) * np.exp(-t * 300) * 0.25
    return np.tanh((s + click) * 1.6) * 0.9


def snare():
    t = t_axis(0.35)
    noise = highpass_fft(rng.standard_normal(len(t)), 1200) * np.exp(-t * 16)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 22)
    return (noise * 0.55 + tone * 0.45)


def hat(open_=False):
    t = t_axis(0.22 if open_ else 0.06)
    n = highpass_fft(rng.standard_normal(len(t)), 7000)
    return n * np.exp(-t * (14 if open_ else 70)) * 0.35


KICK, SNARE, HAT, OHAT = kick(), snare(), hat(), hat(True)


def build_loop(kind):
    n = int(LOOP * SR)
    pad = np.zeros((n, 2))
    bass = np.zeros((n, 2))
    arp = np.zeros((n, 2))
    drums = np.zeros((n, 2))
    for b, (root, chord) in enumerate(PROG):
        t0 = b * BAR
        # PAD: acordes com 3 vozes desafinadas, ataque lento
        for k, note in enumerate(chord):
            s = saw_additive(midi(note), BAR + 0.6, bright=1500 if kind != 'C' else 1100, detune_cents=(-9, 0, 9), phase_seed=b * 10 + k)
            s *= env_adsr(len(s), 0.35, 0.4, 0.8, 0.6)
            place(pad, s, t0, gain=0.055, pan=(k - 1.5) * 0.35, wrap=True)
        if kind in ('A', 'B'):
            # BAIXO pulsante em colcheias (oitava abaixo)
            for e in range(8):
                f = midi(root - 12)
                s = saw_additive(f, BEAT / 2 * 0.92, bright=520, detune_cents=(0, 6), phase_seed=e)
                s += 0.6 * np.sin(2 * np.pi * f / 2 * t_axis(len(s) / SR))
                s *= env_adsr(len(s), 0.004, 0.12, 0.55, 0.03)
                place(bass, s, t0 + e * BEAT / 2, gain=0.16 if kind == 'A' else 0.09, wrap=True)
            # ARPEJO em semicolcheias
            pattern = [0, 1, 2, 3, 2, 1, 2, 3]
            for e in range(16):
                note = chord[pattern[e % 8]] + 12
                s = saw_additive(midi(note), 0.22, bright=2600, detune_cents=(0,), phase_seed=e + b)
                s *= np.exp(-t_axis(len(s) / SR) * 16)
                place(arp, s, t0 + e * BEAT / 4, gain=0.05, pan=0.5 if e % 2 else -0.5, wrap=True)
        if kind == 'A':
            for beat in range(4):
                place(drums, KICK, t0 + beat * BEAT, gain=0.5, wrap=True)
                if beat in (1, 3):
                    place(drums, SNARE, t0 + beat * BEAT, gain=0.32, wrap=True)
            for e in range(8):
                place(drums, OHAT if e % 2 else HAT, t0 + e * BEAT / 2, gain=0.16 if e % 2 else 0.12, pan=0.25, wrap=True)
    # delay ping-pong (colcheia pontuada) no arpejo — circular p/ loop perfeito
    d = int(BEAT * 0.75 * SR)
    fb = arp.copy()
    acc = arp.copy()
    for i in range(1, 5):
        fb = np.roll(fb[:, ::-1], d, axis=0) * 0.45
        acc += fb
    arp = lowpass_fft(acc, 3800)
    # sidechain: pad e baixo "respiram" com o bumbo
    if kind == 'A':
        tt = (np.arange(n) / SR) % BEAT
        duck = 1 - 0.55 * np.exp(-tt * 9)
        pad *= duck[:, None]
        bass *= duck[:, None]
    wet = convolve(pad * 0.7 + arp * 0.6 + drums * 0.15, REVERB, circular=True)
    mix = pad + bass + arp + drums + wet * 0.55
    return mix


# ------------------------------------------------------------------ SFX
def sfx_whoosh(dur=1.1, up=True, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    spec = np.fft.rfft(noise)
    f = np.fft.rfftfreq(n, 1 / SR)
    # varredura aproximada: soma de bandas com envelopes deslocados
    out = np.zeros(n)
    for k, fc in enumerate(np.geomspace(300, 6000, 10)):
        band = np.fft.irfft(spec * np.exp(-((f - fc) / (fc * 0.35)) ** 2), n)
        center = (k / 9) if up else 1 - k / 9
        out += band * np.exp(-((t / dur - (0.15 + 0.6 * center)) / 0.18) ** 2)
    out *= np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return out / (np.abs(out).max() + 1e-9) * 0.5 * gain


def sfx_impact():
    t = t_axis(2.2)
    f = 38 + 90 * np.exp(-t * 10)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    noise = highpass_fft(rng.standard_normal(len(t)), 200) * np.exp(-t * 9) * 0.35
    shimmer = sum(np.sin(2 * np.pi * midi(m) * t) * np.exp(-t * 1.6) for m in (81, 88, 93)) * 0.05
    return np.tanh((s + noise) * 1.4) * 0.8 + shimmer


def bell(freq, dur=1.2, decay=3.5, idx=2.0):
    t = t_axis(dur)
    mod = np.sin(2 * np.pi * freq * 3.5 * t) * idx * np.exp(-t * 6)
    return np.sin(2 * np.pi * freq * t + mod) * np.exp(-t * decay)


def sfx_title():
    out = np.zeros(int(1.8 * SR))
    for i, m in enumerate((69, 76, 81, 88)):
        s = bell(midi(m), 1.6, 3.0, 1.2) * 0.22
        i0 = int(i * 0.06 * SR)
        out[i0:i0 + len(s)] += s[: len(out) - i0]
    return out


def sfx_blip(f0=880, f1=1320, dur=0.12, gain=0.28):
    t = t_axis(dur)
    f = f0 + (f1 - f0) * (t / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * gain


def sfx_key(seed):
    r = np.random.default_rng(seed)
    t = t_axis(0.035)
    n = r.standard_normal(len(t)) * np.exp(-t * 260)
    tick = np.sin(2 * np.pi * (1800 + r.random() * 900) * t) * np.exp(-t * 400)
    return (highpass_fft(n, 2500) * 0.6 + tick * 0.4) * 0.22


def sfx_run():
    out = np.zeros(int(0.9 * SR))
    for i, m in enumerate((72, 76, 79, 84)):
        s = sfx_blip(midi(m), midi(m) * 1.01, 0.25, 0.22)
        i0 = int(i * 0.055 * SR)
        out[i0:i0 + len(s)] += s
    return out


def sfx_tip():
    out = np.zeros(int(1.6 * SR))
    for i, m in enumerate((84, 91)):
        s = bell(midi(m), 1.3, 3.2, 1.5) * 0.2
        i0 = int(i * 0.12 * SR)
        out[i0:i0 + len(s)] += s
    return out


def sfx_achieve(big=False):
    notes = (72, 76, 79, 84, 88, 91) if big else (72, 76, 79, 84)
    out = np.zeros(int((2.6 if big else 2.0) * SR))
    for i, m in enumerate(notes):
        s = bell(midi(m), 1.6, 2.6, 1.8) * 0.2
        sq = np.sign(np.sin(2 * np.pi * midi(m) * t_axis(0.16))) * np.exp(-t_axis(0.16) * 18) * 0.06
        i0 = int(i * 0.09 * SR)
        out[i0:i0 + len(s)] += s[: len(out) - i0]
        out[i0:i0 + len(sq)] += sq
    sparkle = highpass_fft(rng.standard_normal(len(out)), 8000) * np.exp(-t_axis(len(out) / SR) * 3) * 0.05
    return out + sparkle


def sfx_boot():
    out = np.zeros(int(4.5 * SR))
    for i in range(5):
        s = sfx_blip(600 + i * 120, 600 + i * 120, 0.08, 0.16)
        i0 = int((0.3 + i * 0.75) * SR)
        out[i0:i0 + len(s)] += s
        s2 = sfx_blip(1200 + i * 200, 1200 + i * 200, 0.05, 0.1)
        i1 = i0 + int(0.12 * SR)
        out[i1:i1 + len(s2)] += s2
    return out


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    ev_path, out_path = sys.argv[1], sys.argv[2]
    data = json.load(open(ev_path))
    dur = data['duration'] + 0.5
    events = data['events']
    N = int(dur * SR)
    print(f'duração {dur:.1f}s, eventos {len(events)}')

    loops = {k: build_loop(k) for k in ('A', 'B', 'C')}
    print('loops prontos')
    music = np.zeros((N, 2))
    L = len(loops['A'])
    nblocks = int(np.ceil(N / L))
    plan = []
    for k in range(nblocks):
        if k == 0:
            kind = 'C'
        elif k == 1:
            kind = 'B'
        elif k >= nblocks - 1:
            kind = 'C'
        else:
            kind = 'B' if (k - 2) % 6 == 5 else 'A'
        plan.append(kind)
        i0 = k * L
        i1 = min(N, i0 + L)
        music[i0:i1] += loops[kind][: i1 - i0]
    print('arranjo:', ''.join(plan))
    # fade in/out
    fi = int(3 * SR)
    music[:fi] *= np.linspace(0, 1, fi)[:, None] ** 2
    fo = int(6 * SR)
    music[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5

    sfx = np.zeros((N, 2))
    cache = {}
    for i, e in enumerate(events):
        tp, t = e['type'], e['t']
        if tp == 'key':
            place(sfx, sfx_key(i), t, gain=0.55, pan=(rng.random() - 0.5) * 0.3)
            continue
        if tp not in cache:
            cache[tp] = {
                'whoosh': lambda: sfx_whoosh(1.1, True, 0.9),
                'swoosh': lambda: sfx_whoosh(0.7, False, 0.6),
                'impact': sfx_impact,
                'title': sfx_title,
                'point': lambda: sfx_blip(660, 990, 0.14, 0.2),
                'blip': lambda: sfx_blip(1200, 1500, 0.07, 0.1),
                'run': sfx_run,
                'line': lambda: sfx_blip(1500, 1500, 0.05, 0.07),
                'tip': sfx_tip,
                'achieve': sfx_achieve,
                'fanfare': lambda: sfx_achieve(True),
                'boot': sfx_boot,
            }[tp]()
        place(sfx, cache[tp], t, gain=1.0, pan=0.0)
    sfx_wet = convolve(sfx, impulse_response(1.6, 3.5, 0.7, seed=9))[:N]
    out = music * 0.62 + sfx * 0.85 + sfx_wet * 0.28
    # master: compressão suave + normalização
    peak = np.percentile(np.abs(out), 99.95)
    out = out / (peak + 1e-9) * 0.8
    out = np.tanh(out * 1.1) / np.tanh(1.1)
    out *= 0.89
    write_wav(out_path, out)
    print('ok ->', out_path)


if __name__ == '__main__':
    main()
