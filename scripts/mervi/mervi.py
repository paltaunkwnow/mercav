"""
Mervi: el personaje y sus 12 poses, sobre el motor de engine.py (grilla lógica de 96 x 96).
Uso: python3 scripts/mervi/mervi.py [carpeta-de-vista-previa]
Exporta public/mervi/<pose>.png (sprite oficial, fondo transparente), public/mervi/web/<pose>.png (tira de cuadros
con borde de sticker de 1 px para la web) y public/mervi/mervi-character-sheet.png.
Todo se escala solo con vecino más cercano y factores enteros.
"""
import math, os, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from engine import (W, H, S, L, OUTLINE, RGB, Sprite, Shape, ellipse, superellipse, tube, bezier, poly, union, clip, with_normal, hexrgb)

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CX = 72                 # centro del personaje en el espacio de diseño (48 en la grilla lógica)
INK = '#2a1d21'         # líneas de la cara sobre el blanco
WHISKER = '#cfcac0'
G = {'K': OUTLINE, 'g': '#8a6420', 'G': '#e6bd55', 'L': '#fbe7a1', 'm': '#c39536'}

# ---------------------------------------------------------------- isotipo de Mercav, tomado del logo oficial
_LOGO = None
def logo_mask(w, h):
    global _LOGO
    if _LOGO is None:
        im = Image.open(os.path.join(ROOT, 'public', 'images', 'logo.png')).convert('RGBA')
        px = im.load()
        pts = {(x, y) for y in range(im.height) for x in range(im.width) if px[x, y][3] > 128 and px[x, y][0] - px[x, y][2] > 60}
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        _LOGO = (pts, min(xs), min(ys), max(xs), max(ys))
    pts, x0, y0, x1, y1 = _LOGO
    out = set()
    sw, sh = (x1 - x0 + 1) / w, (y1 - y0 + 1) / h
    for j in range(h):
        for i in range(w):
            tot = hit = 0
            for yy in range(int(y0 + j * sh), int(y0 + (j + 1) * sh)):
                for xx in range(int(x0 + i * sw), int(x0 + (i + 1) * sw)):
                    tot += 1
                    hit += (xx, yy) in pts
            if tot and hit / tot >= 0.3:
                out.add((i, j))
    return out

def draw_logo(s, lx, ly, w, h):
    """Isotipo en píxeles lógicos: arriba la luz, abajo la sombra del dorado."""
    m = logo_mask(w, h)
    for (i, j) in m:
        s.putl(lx + i, ly + j, '#fbe7a1' if j <= h * 0.2 else '#e6bd55' if j < h * 0.75 else '#c39536')

# La M chiquita de la kippah, dibujada a mano: pata izquierda corta y la derecha que baja y se curva (como el isotipo).
MINI_M = ["G...G", "GG.GG", "G.G.G", "....G", ".GGG."]

# ---------------------------------------------------------------- ojos, boca y nariz (matrices dibujadas a mano)
EYE = {
    'open':  ["...KKKK...", ".KKDDDDKK.", ".KDDDDDDK.", "KDDPPPPDDK", "KAWWPPPPAK", "KAWWPPPPAK", "KAAPPPPPAK", "KAAPPPPWAK", ".KBAPPABK.", ".KKBBBBKK.", "...KKKK..."],
    'up':    ["...KKKK...", ".KKDDDDKK.", ".KDPPPPDK.", "KDWWPPPPDK", "KAWWPPPPAK", "KAAPPPPPAK", "KAAPPPPWAK", "KAAAAAAAAK", ".KBAAAABK.", ".KKBBBBKK.", "...KKKK..."],
    'right': ["...KKKK...", ".KKDDDDKK.", ".KDDDDDDK.", "KDDDPPPPDK", "KAAWWPPPPK", "KAAWWPPPPK", "KAAAPPPPPK", "KAAAPPPPWK", ".KBAAPPPK.", ".KKBBBBKK.", "...KKKK..."],
    'focus': ["...KKKK...", ".KKKKKKKK.", ".KKKKKKKK.", "KKKKKKKKKK", "KDDDDDDDDK", "KAWWPPPPAK", "KAWWPPPPAK", "KAAPPPPWAK", ".KBAPPABK.", ".KKBBBBKK.", "...KKKK..."],
    'surprised': ["..KKKKKK..", ".KDDDDDDK.", "KAAAAAAAAK", "KAAWPPAAAK", "KAAWPPAAAK", "KAAAPPAAAK", "KAAAAAAAAK", "KBAAAAAABK", ".KBBBBBBK.", "..KKKKKK.."],
    'happy': ["...KKKK...", ".KKBBBBKK.", "KBB....BBK", "K........K"],
    'closed': ["K........K", "KBB....BBK", ".KKBBBBKK.", "...KKKK..."],
}
EYE_COLORS = {'K': OUTLINE, 'D': '#5a3412', 'A': '#c98f43', 'B': '#f0c97a', 'P': '#050507', 'W': '#ffffff'}

def eye(s, lx, ly, kind, side):
    rows = EYE[kind]
    oy = 4 if kind in ('happy', 'closed') else 0
    s.stamp(lx, ly + oy, rows, EYE_COLORS)
    if kind in ('open', 'up', 'right', 'focus', 'surprised'):
        # pestaña en la esquina de afuera
        if side < 0:
            s.putl(lx - 1, ly + 2, OUTLINE); s.putl(lx - 1, ly + 1, OUTLINE)
        else:
            s.putl(lx + 10, ly + 2, OUTLINE); s.putl(lx + 10, ly + 1, OUTLINE)

MOUTH = {
    'smile': ["K..KK..K", ".KK..KK."],
    'open':  ["K..KK..K", ".KRRRRK.", "..KTTK.."],
    'laugh': ["K.KKKK.K", ".KRRRRK.", ".KRTTRK.", "..KKKK.."],
    'o':     ["...KK...", "..KRRK..", "..KRRK..", "...KK..."],
    'calm':  ["..K..K..", "...KK..."],
    'smug':  ["......K.", "..KKKK.."],
    'sleep': ["........", "...KK..."],
}
MOUTH_COLORS = {'K': INK, 'R': '#6e2633', 'T': '#e27f8c'}

def face_parts(s, hx, hy, eyes='open', mouth='smile', blush=1, whiskers=True, eyes_on=True):
    """Cara en la grilla lógica. (hx, hy) es el centro de la cabeza en diseño."""
    cx, cy = L(hx), L(hy)          # centro lógico (48, 34 en la pose base)
    if eyes_on:
        for side in (-1, 1):
            kind = eyes if isinstance(eyes, str) else eyes[0 if side < 0 else 1]
            eye(s, cx - 18 if side < 0 else cx + 8, cy - 4, kind, side)
    s.stamp(cx - 2, cy + 8, ["BPPP", ".PP."], {'P': '#eba3a8', 'B': '#f6c9cb'})
    s.stamp(cx - 4, cy + 10, MOUTH[mouth], MOUTH_COLORS)
    if blush:
        rows = ["BPPP", "PPPP"] if blush > 1 else ["BPP.", ".PP."]
        s.stamp(cx - 20, cy + 9, rows, {'P': '#eba3a8', 'B': '#f6c9cb'})
        s.stamp(cx + 16, cy + 9, rows, {'P': '#eba3a8', 'B': '#f6c9cb'})
    if whiskers:
        for (x0, y0, x1, y1) in ((cx - 22, cy + 9, cx - 30, cy + 8), (cx - 22, cy + 12, cx - 29, cy + 14)):
            s.linel(x0, y0, x1, y1, WHISKER)
            s.linel(2 * cx - 1 - x0, y0, 2 * cx - 1 - x1, y1, WHISKER)

# ---------------------------------------------------------------- cabeza
def head_parts(s, hx=CX, hy=52, ear_droop=0):
    head = ellipse(hx, hy, 40, 32.5, squash=0.9)
    cheekL = ellipse(hx - 35, hy + 12, 9.5, 8.5)
    cheekR = ellipse(hx + 35, hy + 12, 9.5, 8.5)
    tuftL = poly([(hx - 44, hy + 14), (hx - 48, hy + 20), (hx - 40, hy + 18)])
    tuftR = poly([(hx + 44, hy + 14), (hx + 48, hy + 20), (hx + 40, hy + 18)])
    d = ear_droop
    for k in (-1, 1):
        s.add(poly([(hx + k * 39, hy - 12), (hx + k * (36 + d), hy - 38 + d), (hx + k * (32 + d), hy - 46 + d * 1.5),
                    (hx + k * (28 + d), hy - 45 + d * 1.5), (hx + k * 10, hy - 28)]), 'fur', 'head', line=True)
    s.add(union(head, cheekL, cheekR, tuftL, tuftR), 'fur', 'head', line=True)
    for k, bias in ((-1, 0.05), (1, -0.18)):
        s.add(poly([(hx + k * 34, hy - 17), (hx + k * (32 + d), hy - 37 + d), (hx + k * (30 + d), hy - 41 + d * 1.5),
                    (hx + k * (28 + d), hy - 40 + d * 1.5), (hx + k * 15, hy - 27)]), 'pink', 'ear', flat=True, bias=bias, ao=False)
    mask = union(ellipse(hx - 1, hy + 15, 23, 15.5), poly([(hx, hy - 25), (hx - 7, hy + 4), (hx + 7, hy + 4)]),
                 ellipse(hx - 8, hy + 11, 13, 10), ellipse(hx, hy + 27, 14, 6))
    s.add(with_normal(clip(mask, union(head, cheekL, cheekR)), head), 'white', 'head', bias=0.12)
    return head

def head_details(s, hx=CX, hy=52):
    # mechones claros dentro de las orejas
    cx, cy = L(hx), L(hy)
    for (x0, y0, x1, y1) in ((cx - 20, cy - 14, cx - 18, cy - 20), (cx - 17, cy - 14, cx - 16, cy - 18)):
        s.linel(x0, y0, x1, y1, '#e2ddd2')
        s.linel(2 * cx - 1 - x0, y0, 2 * cx - 1 - x1, y1, '#bdb6a9')

def kippah(s, kx=CX + 8, ky=23, rx=20, ry=11.5):
    """Gorrito sobre la coronilla: el borde sigue la curva de la cabeza y baja un poco a la derecha."""
    dome = ellipse(kx, ky, rx, ry, squash=0.8)

    def inside(x, y):
        u = (x - kx) / rx
        return dome.inside(x, y) and y <= ky + 3.5 - 5.0 * u * u + 1.5 * u
    s.add(Shape(inside, dome.normal, dome.bbox), 'kippah', 'kippah', line=True, bias=0.08)
    return (kx, ky, rx, ry)

def kippah_details(s, k):
    kx, ky, rx, ry = k
    cols = {}
    ox, oy = s.lo()
    for (x, y), i in s.owner.items():
        if i >= 0 and s.parts[i].group == 'kippah':
            cols.setdefault(x - ox, []).append(y - oy)
    for x, ys in cols.items():
        yb, top = max(ys), min(ys)
        if yb - top >= 2:
            rel = (x / S - kx) / rx
            s.putl(x, yb - 1, '#fbe7a1' if rel < -0.4 else '#e6bd55' if rel < 0.35 else '#c39536')
    s.stamp(L(kx) - 2, L(ky) - 6, MINI_M, G)

# ---------------------------------------------------------------- cuerpo
def body_parts(s, by=108, hood=True):
    s.add(superellipse(CX, by, 30, 25, 2.4), 'hoodie', 'body', line=True)
    if hood:
        s.add(ellipse(CX, by - 23, 30, 10), 'hoodie', 'body', bias=-0.06)

def body_details(s, by=108, logo=True, strings=True, pocket=True, folds=True):
    if strings:
        for (x0, x1) in ((CX - 9, CX - 10), (CX + 9, CX + 10)):
            s.line(x0, by - 22, x1, by - 9, '#e6bd55')
            lx, ly = L(x1), L(by - 9)
            s.putl(lx, ly + 1, '#fbe7a1'); s.putl(lx, ly + 2, '#c39536')
    if logo:
        draw_logo(s, L(CX) - 5, L(by - 8), 10, 10)
    if pocket:
        for lx in range(L(CX - 15), L(CX + 15) + 1):
            dx = (lx + 0.5 - L(CX)) / 10
            ly = L(by + 10) + round(dx * dx)
            if s.group_l(lx, ly) == 'body':
                s.putl(lx, ly, RGB['hoodie'][0])
    if folds:
        for (x0, y0, x1, y1) in ((CX - 22, by - 13, CX - 19, by - 6), (CX + 22, by - 13, CX + 19, by - 6), (CX + 9, by + 17, CX + 13, by + 20)):
            if s.group_at(x0, y0) == 'body':
                s.line(x0, y0, x1, y1, RGB['hoodie'][0])

def arm(s, pts, group, r=7.0, paw_at=None, paw_r=(7.5, 6.2)):
    s.add(tube(pts, r, r - 0.6), 'hoodie', group, line=True)
    if paw_at:
        paw(s, paw_at, group, paw_r)

def paw(s, at, group, r=(7.5, 6.2)):
    s.add(ellipse(at[0], at[1], *r), 'white', group + '_paw', line=True, bias=0.05)

def paw_pads(s, x, y):
    """Almohadillas de una pata vista de frente (centro en diseño)."""
    s.stamp(L(x) - 2, L(y) - 2, ["P.P.P", ".....", ".PPP.", ".PPP."], {'P': '#eba3a8'})

def cuff(s, pts, group):
    (ax, ay), (bx, by) = pts[-2], pts[-1]
    dx, dy = bx - ax, by - ay
    n = math.hypot(dx, dy) or 1
    ux, uy = dx / n, dy / n
    nx, ny = -uy, ux
    cx_, cy_ = bx - ux * 3.5, by - uy * 3.5
    seen = set()
    for t in range(-9, 10):
        p = (L(cx_ + nx * t), L(cy_ + ny * t))
        if p not in seen and s.group_l(*p) == group:
            seen.add(p)
            s.putl(p[0], p[1], RGB['hoodie'][0])

def paw_toes(s, x, y):
    for dx in (-2, 2):
        p = (L(x) + dx - (1 if dx > 0 else 0), L(y))
        if (s.group_l(*p) or '').endswith('_paw'):
            s.putl(p[0], p[1], '#bdb6a9')

def feet(s, by=132, spread=19):
    for fx in (CX - spread, CX + spread):
        s.add(ellipse(fx, by, 11, 6.5), 'white', 'feet', line=True, bias=0.05)

def feet_details(s, by=132, spread=19):
    for fx in (CX - spread, CX + spread):
        for dx in (-3, 3):
            p = (L(fx) + dx - (1 if dx > 0 else 0), L(by) + 1)
            if s.group_l(*p) == 'feet':
                s.putl(p[0], p[1], '#bdb6a9')

def tail(s, pts, r0=6.5, r1=4.2):
    s.add(tube(bezier(pts, 30), r0, r1), 'fur', 'tail', line=True)

# ---------------------------------------------------------------- props a pincel (en píxeles lógicos)
def small_heart(s, lx, ly, color='#eba3a8', light='#f6c9cb'):
    rows = [".X.X.", "XXXXX", "XXXXX", ".XXX.", "..X.."]
    keys = []
    for j, row in enumerate(rows):
        for i, c in enumerate(row):
            if c == 'X':
                s.putl(lx + i, ly + j, light if (i, j) == (0, 1) else color)
                keys.append((lx + i + s.lo()[0], ly + j + s.lo()[1]))
    s.outline_props(keys)

def sparkle(s, lx, ly, size=1, color='#ffe11a', core='#fff38a'):
    keys = []
    for k in range(-size, size + 1):
        for (px_, py_) in ((lx + k, ly), (lx, ly + k)):
            s.putl(px_, py_, core if k == 0 else color)
            keys.append((px_ + s.lo()[0], py_ + s.lo()[1]))
    s.outline_props(keys)

def zglyph(s, lx, ly, n, color='#e6bd55', shade='#c39536'):
    keys = set()
    for i in range(n):
        keys.add((lx + i, ly)); keys.add((lx + i, ly + n - 1)); keys.add((lx + n - 1 - i, ly + i))
    for (px_, py_) in keys:
        s.putl(px_, py_, shade if py_ == ly + n - 1 else color)
    s.outline_props([(px_ + s.lo()[0], py_ + s.lo()[1]) for (px_, py_) in keys])

def confetti(s, frame):
    pieces = [(12, 14, 'magenta', 0), (22, 6, 'yellow', 1), (74, 8, 'green', 0), (84, 20, 'cyan', 1), (6, 34, 'green', 1),
              (87, 38, 'magenta', 0), (66, 2, 'yellow', 0), (34, 3, 'cyan', 0), (15, 52, 'yellow', 0), (82, 56, 'yellow', 1)]
    keys = []
    for (x, y, mat, horiz) in pieces:
        y += frame * 3
        horiz = horiz ^ frame
        cells = [(0, 0), (1, 0)] if horiz else [(0, 0), (0, 1)]
        for (dx, dy) in cells:
            s.putl(x + dx, y + dy, RGB[mat][2] if (dx, dy) == (0, 0) else RGB[mat][1], raw=True)
            keys.append((x + dx, y + dy))
    s.outline_props(keys)

def magen_david(s, lx, ly, r=5, color='#e6bd55', shade='#c39536'):
    """Estrella de David en línea dorada de 1 píxel (tapa del libro)."""
    up = [(lx, ly - r), (lx - round(r * 0.87), ly + round(r * 0.5)), (lx + round(r * 0.87), ly + round(r * 0.5))]
    dn = [(lx, ly + r), (lx - round(r * 0.87), ly - round(r * 0.5)), (lx + round(r * 0.87), ly - round(r * 0.5))]
    for tri, col in ((up, color), (dn, shade)):
        for a, b in ((0, 1), (1, 2), (2, 0)):
            s.linel(tri[a][0], tri[a][1], tri[b][0], tri[b][1], col)

def heart_shape(cx, cy, r):
    return union(ellipse(cx - r * 0.55, cy - r * 0.15, r * 0.6, r * 0.6), ellipse(cx + r * 0.55, cy - r * 0.15, r * 0.6, r * 0.6),
                 poly([(cx - r * 1.1, cy + r * 0.05), (cx + r * 1.1, cy + r * 0.05), (cx, cy + r * 1.15)]))

# ---------------------------------------------------------------- poses
REST_L = [(46, 95), (50, 108), (57, 114)]
REST_R = [(98, 95), (94, 108), (87, 114)]

def finish(s, k, arms=(), eyes='open', mouth='smile', blush=1, logo=True, pocket=True, feet_on=True, hx=CX, hy=52, eyes_on=True):
    body_details(s, logo=logo, pocket=pocket)
    for pts, g in arms:
        cuff(s, pts, g)
    if feet_on:
        feet_details(s)
    kippah_details(s, k)
    head_details(s, hx, hy)
    face_parts(s, hx, hy, eyes=eyes, mouth=mouth, blush=blush, eyes_on=eyes_on)

def start(s, tail_pts, behind=(), feet_on=True, tail_r=(6.5, 4.2)):
    tail(s, tail_pts, *tail_r)
    body_parts(s)
    if feet_on:
        feet(s)
    for pts, g, pw in behind:
        arm(s, pts, g, paw_at=pw)

def pose_normal(frame=0, blink=False):
    s = Sprite()
    start(s, [(96, 128), (128, 128), (134, 98), (116 + frame * 5, 86 - frame * 3)], [(REST_L, 'armL', (59, 116)), (REST_R, 'armR', (85, 116))])
    head_parts(s); k = kippah(s)
    s.render()
    finish(s, k, [(REST_L, 'armL'), (REST_R, 'armR')], eyes='closed' if blink else 'open')
    paw_toes(s, 59, 117); paw_toes(s, 85, 117)
    return s

def pose_saludando(frame=0, blink=False):
    s = Sprite()
    start(s, [(96, 128), (126, 130), (136, 104), (124, 90 + frame * 4)], [(REST_L, 'armL', (59, 116))])
    head_parts(s); k = kippah(s)
    up = [(98, 93), (110, 80), (117, 66)] if frame == 0 else [(98, 93), (108, 79), (111, 64)]
    pw = (118, 58) if frame == 0 else (111, 56)
    arm(s, up, 'armR'); paw(s, pw, 'armR', (8, 8))
    s.render()
    finish(s, k, [(REST_L, 'armL'), (up, 'armR')], eyes=('closed' if blink else 'open', 'happy'), mouth='open')
    paw_toes(s, 59, 117)
    paw_pads(s, *pw)
    for (x0, y0, x1, y1) in ((129, 49, 132, 46), (131, 57, 135, 56), (129, 65, 132, 67)):
        s.line(x0 - frame * 7, y0, x1 - frame * 7, y1, '#e6bd55')
    return s

def pose_celebrando(frame=0, blink=False):
    s = Sprite()
    s.shadow(CX, 139, 26 - frame * 3, 3)
    s.oy = -9 if frame == 0 else -4
    tail(s, [(96, 126), (124, 124), (132, 100), (126, 84)])
    body_parts(s)
    for fx in (CX - 15, CX + 15):
        s.add(ellipse(fx, 130, 10, 6), 'white', 'feet', line=True, bias=0.05)
    head_parts(s); k = kippah(s)
    A = [(48, 92), (34, 78), (26, 62)]
    B = [(96, 92), (110, 78), (118, 62)]
    arm(s, A, 'armL'); paw(s, (25, 56), 'armL', (8, 7.5))
    arm(s, B, 'armR'); paw(s, (119, 56), 'armR', (8, 7.5))
    s.render()
    finish(s, k, [(A, 'armL'), (B, 'armR')], eyes='happy', mouth='laugh', blush=2, feet_on=False)
    paw_pads(s, 25, 56); paw_pads(s, 119, 56)
    s.oy = 0
    confetti(s, frame)
    return s

def pose_programador(frame=0, blink=False):
    s = Sprite()
    start(s, [(96, 128), (128, 128), (136, 100), (122, 86 + frame * 3)], feet_on=False)
    A = [(46, 95), (52, 104), (56, 110)]
    B = [(98, 95), (92, 104), (88, 110)]
    arm(s, A, 'armL'); arm(s, B, 'armR')
    head_parts(s); k = kippah(s)
    s.add(poly([(44, 103), (100, 103), (98, 127), (46, 127)]), 'device', 'laptop', line=True, flat=True, bias=0.02)
    s.add(poly([(34, 127), (110, 127), (114, 134), (30, 134)]), 'device', 'laptop_base', line=True, flat=True, bias=0.22)
    s.render()
    body_details(s, logo=False, pocket=False, folds=False)
    kippah_details(s, k); head_details(s)
    face_parts(s, CX, 52, eyes='closed' if blink else 'focus', mouth='calm')
    for lx in range(L(46), L(98)):
        s.putl(lx, L(103) + 1, RGB['device'][2])
    draw_logo(s, L(CX) - 4, L(110), 8, 8)
    for i, (x, y, mat) in enumerate(((14, 46, 'cyan'), (79, 42, 'yellow'), (85, 56, 'cyan'), (10, 62, 'yellow'))):
        if (i + frame) % 2 == 0:
            sparkle(s, x, y - frame, 1, RGB[mat][1], RGB[mat][2])
    return s

def pose_smartphone(frame=0, blink=False):
    s = Sprite()
    start(s, [(94, 128), (124, 132), (136, 106), (128, 92 - frame * 3)], [(REST_L, 'armL', (59, 116))])
    head_parts(s); k = kippah(s)
    B = [(98, 94), (104, 98), (106, 96)]
    arm(s, B, 'armR')
    s.add(superellipse(108, 84, 9.5, 15, 5), 'device', 'phone', line=True, bias=0.05)
    paw(s, (104, 96), 'armR', (6.5, 6))
    s.render()
    finish(s, k, [(REST_L, 'armL'), (B, 'armR')], eyes='closed' if blink else 'right', mouth='smile')
    paw_toes(s, 59, 117)
    draw_logo(s, L(108) - 3, L(76), 6, 6)
    if frame == 0:
        sparkle(s, 82, 42, 2)
    else:
        small_heart(s, 78, 37, '#e6bd55', '#fbe7a1')
    return s

def pose_comunidad(frame=0, blink=False):
    s = Sprite()
    start(s, [(96, 128), (128, 128), (134, 98), (118, 86 + frame * 3)])
    head_parts(s); k = kippah(s)
    A = [(46, 95), (47, 104), (53, 108)]
    B = [(98, 95), (97, 104), (91, 108)]
    arm(s, A, 'armL'); arm(s, B, 'armR')
    r = 17 + frame * 1.5
    hs = heart_shape(CX, 104, r)
    s.add(with_normal(hs, ellipse(CX, 104, r * 1.1, r * 1.05)), 'gold', 'heart', line=True, bias=0.05)
    paw(s, (54, 107), 'armL', (7, 6)); paw(s, (90, 107), 'armR', (7, 6))
    s.render()
    finish(s, k, [(A, 'armL'), (B, 'armR')], eyes='happy', mouth='open', blush=2, logo=False, pocket=False)
    s.stamp(L(CX) - 8, L(104) - 6, ["WW", "W."], {'W': '#fffbe0'})
    small_heart(s, 9, 25 - frame * 2); small_heart(s, 80, 19 - frame * 2, '#e6bd55', '#fbe7a1'); small_heart(s, 84, 46 - frame)
    return s

def pose_pensativo(frame=0, blink=False):
    s = Sprite()
    start(s, [(96, 128), (126, 130), (134, 102), (120, 90 + frame * 3)])
    A = [(46, 96), (56, 110), (76, 112)]
    arm(s, A, 'armL', paw_at=(79, 111))
    head_parts(s); k = kippah(s)
    B = [(98, 95), (98, 86), (88, 80)]
    arm(s, B, 'armR'); paw(s, (84, 78), 'armR', (7, 6))
    s.add(ellipse(118, 15, 8.5, 8.5), 'bulb', 'bulb', line=True, bias=0.1 + frame * 0.2)
    s.add(poly([(114, 22), (122, 22), (121, 29), (115, 29)]), 'device', 'bulb_base', line=True, flat=True, bias=0.25)
    s.render()
    finish(s, k, [(A, 'armL'), (B, 'armR')], eyes='closed' if blink else 'up', mouth='calm')
    s.stamp(L(118) - 3, L(15) - 3, ["WW", "W."], {'W': '#ffffff'})
    if frame == 0:
        for (x0, y0, x1, y1) in ((70, 4, 68, 3), (88, 4, 90, 3), (70, 12, 68, 13), (88, 12, 90, 13), (79, 1, 79, 0)):
            s.linel(x0, y0, x1, y1, '#ffe11a')
    return s

def pose_cool(frame=0, blink=False):
    s = Sprite()
    start(s, [(96, 128), (128, 126), (136, 96), (124, 82)])
    head_parts(s); k = kippah(s)
    A = [(46, 96), (60, 104), (86, 104)]
    B = [(98, 96), (84, 106), (58, 106)]
    arm(s, A, 'armL'); paw(s, (88, 103), 'armL', (6.5, 5.5))
    arm(s, B, 'armR'); paw(s, (55, 106), 'armR', (7, 6))
    for side in (-1, 1):
        s.add(superellipse(CX + side * 18, 55, 13, 8.5, 3.2), 'glass', 'glasses', line=True, bias=0.1)
    s.add(poly([(64, 51), (80, 51), (80, 54), (64, 54)]), 'glass', 'glasses', line=True, flat=True)
    s.render()
    finish(s, k, [(A, 'armL'), (B, 'armR')], mouth='smug', logo=False, pocket=False, eyes_on=False)
    draw_logo(s, L(CX) - 4, L(110), 9, 9)
    for side in (-1, 1):
        lx = L(CX + side * 18)
        s.linel(lx - 5, L(51), lx - 3, L(51) + 2, '#9aa0b4')
        s.linel(lx - 3, L(51), lx - 1, L(51) + 2, '#5a5f70')
    sparkle(s, 83, 26 - frame, 2 - frame); sparkle(s, 13, 20 + frame, 1 + frame)
    return s

def pose_sorprendido(frame=0, blink=False):
    s = Sprite()
    start(s, [(96, 126), (124, 124), (132, 92), (128, 70)], tail_r=(8, 6))
    head_parts(s, ear_droop=-3); k = kippah(s)
    A = [(46, 95), (38, 88), (34, 82)]
    B = [(98, 95), (106, 88), (110, 82)]
    arm(s, A, 'armL'); paw(s, (33, 78), 'armL', (7.5, 7))
    arm(s, B, 'armR'); paw(s, (111, 78), 'armR', (7.5, 7))
    s.render()
    finish(s, k, [(A, 'armL'), (B, 'armR')], eyes='surprised', mouth='o', blush=0)
    paw_pads(s, 33, 78); paw_pads(s, 111, 78)
    for (x0, y0, x1, y1) in ((9, 12, 13, 16), (6, 23, 11, 23), (86, 12, 82, 16), (89, 23, 84, 23), (48, 1, 48, 3)):
        s.linel(x0 + frame, y0, x1 + frame, y1, '#ffe11a')
    return s

def pose_durmiendo(frame=0, blink=False):
    s = Sprite()
    s.shadow(80, 138, 50, 3, 0.15)
    s.add(superellipse(86, 117, 46, 19 + frame * 1.5, 2.2), 'hoodie', 'body', line=True)
    hx, hy = 56, 92
    head_parts(s, hx, hy, ear_droop=4)
    k = kippah(s, hx + 8, hy - 29)
    paw(s, (40, 123), 'armL', (8.5, 5.5)); paw(s, (63, 125), 'armR', (8.5, 5.5))
    s.add(tube(bezier([(128, 118), (140, 136), (100, 140), (70, 134)], 30), 6.5, 4.2), 'fur', 'tail', line=True)
    s.render()
    s.line(97, 103, 104, 102, RGB['hoodie'][3]); s.line(112, 105, 119, 108, RGB['hoodie'][3])
    draw_logo(s, L(102), L(110), 8, 8)
    kippah_details(s, k); head_details(s, hx, hy)
    face_parts(s, hx, hy, eyes='closed', mouth='sleep', blush=1)
    zglyph(s, 66 + frame, 30 - frame, 5)
    zglyph(s, 76 + frame, 19 - frame, 4)
    zglyph(s, 84, 9 - frame, 3)
    return s

def pose_libro(frame=0, blink=False):
    s = Sprite()
    start(s, [(96, 128), (128, 128), (134, 100), (118 + frame * 4, 88)])
    head_parts(s); k = kippah(s)
    A = [(46, 95), (47, 102), (52, 104)]
    B = [(98, 95), (97, 102), (92, 104)]
    arm(s, A, 'armL'); arm(s, B, 'armR')
    s.add(poly([(50, 85), (95, 85), (95, 119), (50, 119)]), 'leather', 'book', line=True, flat=True)
    s.add(poly([(50, 85), (55, 85), (55, 119), (50, 119)]), 'leather', 'book_spine', line=True, flat=True, bias=-0.25)
    paw(s, (52, 103), 'armL', (6.5, 6)); paw(s, (93, 103), 'armR', (6.5, 6))
    s.render()
    finish(s, k, [(A, 'armL'), (B, 'armR')], eyes='closed' if blink else 'focus', mouth='smile', logo=False, pocket=False)
    for lx in range(L(56), L(95)):
        s.putl(lx, L(85) - 1, RGB['paper'][1] if lx % 3 else RGB['paper'][0])
    x0, y0, x1, y1 = L(59), L(89), L(91), L(116)
    for lx in range(x0, x1 + 1):
        s.putl(lx, y0, '#c39536'); s.putl(lx, y1, '#8a6420')
    for ly in range(y0, y1 + 1):
        s.putl(x0, ly, '#c39536'); s.putl(x1, ly, '#8a6420')
    magen_david(s, (x0 + x1) // 2, (y0 + y1) // 2, 5)
    return s

# Latinoamérica en la pantalla del monitor (píxeles lógicos relativos a la pantalla de 30 x 25).
LATAM = [
    [(1, 1), (6, 1), (7, 3), (8, 5), (10, 6), (12, 7), (13, 9), (12, 9), (10, 8), (8, 7), (6, 5), (4, 3), (2, 2)],
    [(13, 9), (16, 7), (20, 7), (23, 9), (26, 11), (28, 12), (28, 14), (25, 16), (23, 18), (21, 20), (20, 22), (18, 24), (17, 24), (16, 20), (15, 17), (14, 14), (13, 11)],
    [(15, 5), (18, 5), (18, 6), (15, 6)],
]
CITIES = [(6, 4), (11, 8), (16, 9), (15, 13), (18, 14), (18, 20), (20, 18), (23, 13)]

def pose_emprendedor(frame=0, blink=False):
    s = Sprite()
    s.add(poly([(84, 108), (144, 108), (144, 114), (84, 114)]), 'leather', 'desk', line=True, flat=True, bias=0.1)
    s.add(poly([(88, 114), (92, 114), (92, 136), (88, 136)]), 'leather', 'desk', line=True, flat=True, bias=-0.15)
    s.add(poly([(136, 114), (140, 114), (140, 136), (136, 136)]), 'leather', 'desk', line=True, flat=True, bias=-0.15)
    s.add(poly([(110, 94), (118, 94), (118, 106), (110, 106)]), 'device', 'monitor_neck', line=True, flat=True, bias=0.1)
    s.add(ellipse(114, 107, 13, 3), 'device', 'monitor_neck', line=True, bias=0.2)
    s.add(poly([(88, 50), (142, 50), (142, 96), (88, 96)]), 'device', 'monitor', line=True, flat=True, bias=0.05)
    s.ox = -24
    start(s, [(96, 128), (122, 132), (132, 108), (122, 96)], [(REST_L, 'armL', (59, 116))])
    head_parts(s); k = kippah(s)
    B = [(98, 94), (108, 86), (116, 80)]
    arm(s, B, 'armR'); paw(s, (119, 78), 'armR', (7, 6.5))
    s.render()
    finish(s, k, [(REST_L, 'armL'), (B, 'armR')], eyes='closed' if blink else 'right', mouth='open')
    paw_toes(s, 59, 117)
    s.ox = 0
    sx, sy = L(88) + 2, L(50) + 2
    for y in range(sy, sy + 27):
        for x in range(sx, sx + 32):
            s.putl(x, y, RGB['ocean'][1] if (y - sy) % 6 else RGB['ocean'][2])
    for shape in LATAM:
        sh = poly([(sx + x, sy + y) for (x, y) in shape])
        x0, y0, x1, y1 = [int(v) for v in sh.bbox]
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if sh.inside(x + 0.5, y + 0.5):
                    s.putl(x, y, RGB['land'][2] if (x + 2 * y) % 7 == 0 else RGB['land'][1])
    pts = [(sx + x, sy + y) for (x, y) in CITIES]
    for a, b in zip(pts[:-1], pts[1:]):
        s.linel(a[0], a[1], b[0], b[1], '#c39536')
    for i, (x, y) in enumerate(pts):
        s.putl(x, y, '#fbe7a1' if (i + frame) % 2 == 0 else '#e6bd55')
    for x in range(sx + 1, sx + 11):
        s.putl(x, sy + 25, '#e6bd55' if x < sx + 6 + frame * 3 else RGB['ocean'][0])
    return s

POSES = {
    'normal': pose_normal,
    'saludando': pose_saludando,
    'celebrando': pose_celebrando,
    'programador': pose_programador,
    'smartphone': pose_smartphone,
    'comunidad': pose_comunidad,
    'pensativo': pose_pensativo,
    'cool': pose_cool,
    'sorprendido': pose_sorprendido,
    'durmiendo': pose_durmiendo,
    'libro': pose_libro,
    'emprendedor': pose_emprendedor,
}
# poses con ojos abiertos: la tira web trae un cuadro de parpadeo
BLINKS = {'normal', 'saludando', 'programador', 'smartphone', 'pensativo', 'emprendedor', 'libro'}

def build_sheet(sprites, big=6, small=3):
    pad, gap = 48, 24
    cell = W * small
    grid_w = cell * 4 + gap * 3
    width = pad + W * big + pad + grid_w + pad
    height = max(W * big, cell * 3 + gap * 2) + pad * 2
    sheet = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    sheet.alpha_composite(sprites['normal'].image(big), (pad, (height - W * big) // 2))
    for i, name in enumerate(POSES):
        x = pad + W * big + pad + (i % 4) * (cell + gap)
        y = pad + (i // 4) * (cell + gap)
        sheet.alpha_composite(sprites[name].image(small), (x, y))
    return sheet

def provenance(what):
    """Origen del raster, en el chunk de texto que lee Impeccable (impeccable:prompt)."""
    from PIL.PngImagePlugin import PngInfo
    info = PngInfo()
    info.add_text('impeccable:prompt', f'Origen: {what} de Mervi, la mascota de Mercav, generado por código con scripts/mervi/mervi.py '
                  '(pixel art procedural en una grilla de 96 x 96, sin imágenes de entrada ni modelos generativos).')
    return info

if __name__ == '__main__':
    out = os.path.join(ROOT, 'public', 'mervi')
    web = os.path.join(out, 'web')
    os.makedirs(web, exist_ok=True)
    preview = sys.argv[1] if len(sys.argv) > 1 else None
    sprites = {}
    for name, fn in POSES.items():
        f0 = fn(0)
        sprites[name] = f0
        f0.image().save(os.path.join(out, f'{name}.png'), optimize=True, pnginfo=provenance(f'sprite "{name}"'))
        frames = [f0, fn(1)] + ([fn(0, blink=True)] if name in BLINKS else [])
        strip = Image.new('RGBA', (W * len(frames), H), (0, 0, 0, 0))
        for i, fr in enumerate(frames):
            strip.alpha_composite(fr.image(border='#f8f7f3'), (i * W, 0))
        strip.save(os.path.join(web, f'{name}.png'), optimize=True, pnginfo=provenance(f'tira de animación "{name}"'))
    sheet = build_sheet(sprites)
    sheet.convert('RGB').save(os.path.join(out, 'mervi-character-sheet.png'), optimize=True, pnginfo=provenance('hoja de personaje'))
    if preview:
        sheet.save(os.path.join(preview, 'sheet-96.png'))
    print('ok', len(sprites))
# creado por pato dev y askforvini
