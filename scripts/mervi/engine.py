"""
Motor de pixel art de Mervi (mascota oficial de Mercav).

Mervi se dibuja directamente sobre una grilla lógica de 96 x 96: cada píxel del sprite es un píxel de la grilla.
Las formas grandes (cabeza, hoodie, mangas, cola, props) se describen con geometría simple en un espacio de diseño
de 144 y se evalúan en el centro de cada píxel lógico, sin antialias. El volumen es cel shading de 3 tonos por
material (sombra, base, luz) y un cuarto tono solo como brillo puntual. Contorno negro de 1 píxel y líneas internas
de 1 píxel. Los detalles que definen al personaje (ojos, boca, nariz, almohadillas, la M de la kippah) son matrices
dibujadas a mano, píxel por píxel. Nada se dibuja en alta resolución para después pixelarlo.
"""
import math
from PIL import Image

DESIGN = 144          # espacio de diseño de la geometría
W = H = 96            # grilla lógica
S = W / DESIGN
OUTLINE = (10, 10, 14)


def L(v):
    """Coordenada de diseño a píxel lógico."""
    return int(math.floor(v * S))


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# Paleta central: 3 tonos por material (sombra, base, luz) y, en algunos, un cuarto tono de brillo puntual.
RAMPS = {
    'fur':     ['#101117', '#1c1e27', '#2c2f3b', '#424656'],
    'white':   ['#bdb6a9', '#e2ddd2', '#f8f7f3'],
    'pink':    ['#c96f7a', '#eba3a8', '#f6c9cb'],
    'hoodie':  ['#14151c', '#23252f', '#323643', '#474c5d'],
    'kippah':  ['#08090c', '#15161c', '#23252d'],
    'gold':    ['#8a6420', '#c39536', '#e6bd55', '#fbe7a1'],
    'amber':   ['#5a3412', '#a8702f', '#d9a050', '#f0c97a'],
    'device':  ['#0f1014', '#1d1f26', '#2c2f38', '#40444f'],
    'leather': ['#4a2814', '#6e3f1f', '#93592d'],
    'paper':   ['#d9cfba', '#f4eedf'],
    'bulb':    ['#d9a900', '#ffd91a', '#fff3a0'],
    'ocean':   ['#123d68', '#1d5c96', '#3480c4'],
    'land':    ['#16703f', '#22a05a', '#3fd17a'],
    'glass':   ['#060608', '#14151b', '#262935'],
    'magenta': ['#c41d62', '#ff3d8b', '#ff8ab8'],
    'green':   ['#159447', '#2ee06f', '#8cf2b0'],
    'yellow':  ['#d4b600', '#ffe11a', '#fff38a'],
    'cyan':    ['#1286a3', '#2cc6e6', '#9ce9f7'],
}
RGB = {k: [hexrgb(c) for c in v] for k, v in RAMPS.items()}
LIGHT = (-0.5, -0.72, 0.55)
_n = math.sqrt(sum(c * c for c in LIGHT))
LIGHT = tuple(c / _n for c in LIGHT)


# ---------------------------------------------------------------- formas (espacio de diseño)
class Shape:
    def __init__(self, inside, normal, bbox):
        self.inside, self.normal, self.bbox = inside, normal, bbox


def ellipse(cx, cy, rx, ry, squash=1.0):
    def inside(x, y):
        return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0

    def normal(x, y):
        u, v = (x - cx) / rx, (y - cy) / ry
        return (u, v, math.sqrt(max(0.0, 1 - u * u - v * v)) * squash + 0.15)
    return Shape(inside, normal, (cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1))


def superellipse(cx, cy, rx, ry, p=2.6):
    def inside(x, y):
        return abs((x - cx) / rx) ** p + abs((y - cy) / ry) ** p <= 1.0

    def normal(x, y):
        u, v = (x - cx) / rx, (y - cy) / ry
        return (u * 0.9, v * 0.9, math.sqrt(max(0.0, 1 - min(1.0, u * u + v * v))) + 0.2)
    return Shape(inside, normal, (cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1))


def _seg(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy or 1e-9
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L2))
    qx, qy = ax + t * dx, ay + t * dy
    return math.hypot(px - qx, py - qy), t, (px - qx, py - qy)


def bezier(pts, n=24):
    out = []
    for i in range(n + 1):
        t = i / n
        if len(pts) == 3:
            a, b, c = pts
            x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0]
            y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]
        else:
            a, b, c, d = pts
            x = (1 - t) ** 3 * a[0] + 3 * (1 - t) ** 2 * t * b[0] + 3 * (1 - t) * t * t * c[0] + t ** 3 * d[0]
            y = (1 - t) ** 3 * a[1] + 3 * (1 - t) ** 2 * t * b[1] + 3 * (1 - t) * t * t * c[1] + t ** 3 * d[1]
        out.append((x, y))
    return out


def tube(points, r0, r1=None):
    """Cilindro a lo largo de una polilínea, con radio de r0 a r1."""
    r1 = r0 if r1 is None else r1
    segs = list(zip(points[:-1], points[1:]))
    lens = [math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in segs]
    total = sum(lens) or 1
    acc = [0]
    for l in lens:
        acc.append(acc[-1] + l)

    def query(x, y):
        best = (1e9, 0, (0, 0))
        for i, (a, b) in enumerate(segs):
            d, t, v = _seg(x, y, a[0], a[1], b[0], b[1])
            if d < best[0]:
                best = (d, (acc[i] + t * lens[i]) / total, v)
        return best

    def inside(x, y):
        d, t, _ = query(x, y)
        return d <= r0 + (r1 - r0) * t

    def normal(x, y):
        d, t, (vx, vy) = query(x, y)
        r = r0 + (r1 - r0) * t
        k = min(1.0, d / max(r, 0.01))
        if d > 1e-6:
            vx, vy = vx / d * k, vy / d * k
        else:
            vx, vy = 0, 0
        return (vx, vy, math.sqrt(max(0.0, 1 - k * k)) + 0.2)
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    rm = max(r0, r1)
    return Shape(inside, normal, (min(xs) - rm - 1, min(ys) - rm - 1, max(xs) + rm + 1, max(ys) + rm + 1))


def poly(pts, tilt=(0.0, -0.25)):
    def inside(x, y):
        c = False
        j = len(pts) - 1
        for i in range(len(pts)):
            xi, yi = pts[i]
            xj, yj = pts[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi:
                c = not c
            j = i
        return c

    def normal(x, y):
        return (tilt[0], tilt[1], 1.0)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return Shape(inside, normal, (min(xs) - 1, min(ys) - 1, max(xs) + 1, max(ys) + 1))


def union(*shapes):
    def inside(x, y):
        return any(s.inside(x, y) for s in shapes)

    def normal(x, y):
        for s in shapes:
            if s.inside(x, y):
                return s.normal(x, y)
        return (0, 0, 1)
    bb = [s.bbox for s in shapes]
    return Shape(inside, normal, (min(b[0] for b in bb), min(b[1] for b in bb), max(b[2] for b in bb), max(b[3] for b in bb)))


def clip(shape, by, keep=True):
    def inside(x, y):
        return shape.inside(x, y) and (by.inside(x, y) if keep else not by.inside(x, y))
    return Shape(inside, shape.normal, shape.bbox)


def with_normal(shape, normal_shape):
    """Forma de una pieza con el volumen de otra (la máscara blanca usa la curvatura de la cabeza)."""
    return Shape(shape.inside, normal_shape.normal, shape.bbox)


# ---------------------------------------------------------------- piezas y sprite
class Part:
    def __init__(self, shape, mat, group, line=False, bias=0.0, ao=True, flat=False):
        self.shape, self.mat, self.group, self.line, self.bias, self.ao, self.flat = shape, mat, group, line, bias, ao, flat


class Sprite:
    def __init__(self):
        self.parts = []
        self.px = {}       # (x, y) lógico -> color
        self.owner = {}    # (x, y) lógico -> índice de pieza (-1: pincel)
        self.alpha = {}    # (x, y) lógico -> alfa (sombra en el piso)
        self.ox = 0        # corrimiento del personaje, en unidades de diseño
        self.oy = 0

    # ---- piezas
    def add(self, shape, *args, **kw):
        if self.ox or self.oy:
            ox, oy, base = self.ox, self.oy, shape
            shape = Shape(lambda x, y: base.inside(x - ox, y - oy), lambda x, y: base.normal(x - ox, y - oy),
                          (base.bbox[0] + ox, base.bbox[1] + oy, base.bbox[2] + ox, base.bbox[3] + oy))
        self.parts.append(Part(shape, *args, **kw))
        return self

    def render(self):
        light = {}
        for i, part in enumerate(self.parts):
            x0, y0, x1, y1 = part.shape.bbox
            for y in range(max(0, L(y0) - 1), min(H, L(y1) + 2)):
                for x in range(max(0, L(x0) - 1), min(W, L(x1) + 2)):
                    dx, dy = (x + 0.5) / S, (y + 0.5) / S
                    if part.shape.inside(dx, dy):
                        self.owner[(x, y)] = i
                        if part.flat:
                            l = 0.6 + part.bias
                        else:
                            n = part.shape.normal(dx, dy)
                            m = math.sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2) or 1
                            d = (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / m
                            l = 0.15 + 0.85 * max(0.0, d) + part.bias
                        light[(x, y)] = l
        for (x, y), i in self.owner.items():
            part = self.parts[i]
            ramp = RGB[part.mat]
            l = light[(x, y)]
            # cel shading: sombra / base / luz; el cuarto tono solo como brillo puntual
            if len(ramp) == 2:
                idx = 0 if l < 0.55 else 1
            else:
                idx = 0 if l < 0.42 else 1 if l < 0.74 else 2
                if len(ramp) >= 4 and l > 0.95:
                    idx = 3
            if part.ao:
                # sombra de contacto: la banda de 2 píxeles bajo la pieza que está encima baja un tono
                for dx, dy in ((0, -1), (0, -2)):
                    j = self.owner.get((x + dx, y + dy))
                    if j is not None and j > i and self.parts[j].group != part.group:
                        idx = max(0, min(idx, 2) - 1)
                        break
            self.px[(x, y)] = ramp[idx]
        # líneas internas de 1 píxel entre piezas de distinto grupo
        for (x, y), i in list(self.owner.items()):
            part = self.parts[i]
            if not part.line:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                j = self.owner.get((x + dx, y + dy))
                if j is not None and j < i and self.parts[j].group != part.group:
                    self.px[(x, y)] = OUTLINE
                    break
        # contorno exterior negro de 1 píxel
        for (x, y) in list(self.owner.keys()):
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if (x + dx, y + dy) not in self.owner:
                    self.px[(x, y)] = OUTLINE
                    break
        return self

    # ---- pinceles
    def lo(self):
        return round(self.ox * S), round(self.oy * S)

    def putl(self, x, y, color, own=True, raw=False):
        """Píxel lógico (relativo al corrimiento del personaje, salvo raw)."""
        if not raw:
            ox, oy = self.lo()
            x, y = x + ox, y + oy
        x, y = int(x), int(y)
        if 0 <= x < W and 0 <= y < H:
            self.px[(x, y)] = hexrgb(color) if isinstance(color, str) else color
            if own and (x, y) not in self.owner:
                self.owner[(x, y)] = -1

    def put(self, x, y, color, own=True):
        """Píxel en coordenadas de diseño."""
        ox, oy = self.lo()
        self.putl(L(x + self.ox) - ox, L(y + self.oy) - oy, color, own)

    def stamp(self, x, y, rows, colors):
        """Matriz dibujada a mano; (x, y) es su esquina en píxeles lógicos."""
        for j, row in enumerate(rows):
            for i, c in enumerate(row):
                if c in colors:
                    self.putl(x + i, y + j, colors[c])

    def linel(self, x0, y0, x1, y1, color, own=True):
        """Recta de Bresenham en píxeles lógicos."""
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.putl(x0, y0, color, own)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def line(self, x0, y0, x1, y1, color, own=True):
        """Recta con extremos en coordenadas de diseño."""
        self.linel(L(x0), L(y0), L(x1), L(y1), color, own)

    def group_l(self, x, y):
        """Grupo de la pieza en un píxel lógico del personaje."""
        ox, oy = self.lo()
        i = self.owner.get((int(x) + ox, int(y) + oy))
        return self.parts[i].group if i is not None and i >= 0 else None

    def group_at(self, x, y):
        """Grupo de la pieza en un punto de diseño del personaje."""
        i = self.owner.get((L(x + self.ox), L(y + self.oy)))
        return self.parts[i].group if i is not None and i >= 0 else None

    def shadow(self, cx, cy, rx, ry, a=0.18):
        cx, cy, rx, ry = (cx + self.ox) * S, (cy + self.oy) * S, rx * S, ry * S
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1 and (x, y) not in self.px:
                    self.alpha[(x, y)] = a

    def outline_props(self, keys):
        """Contorno negro para detalles pintados a pincel (confeti, corazones chicos, Z…). keys: píxeles lógicos absolutos."""
        keys = set(keys)
        for (x, y) in keys:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if q not in keys and q not in self.px and 0 <= q[0] < W and 0 <= q[1] < H:
                    self.px[q] = OUTLINE
                    self.owner.setdefault(q, -1)

    def image(self, scale=1, border=None, skip=((207, 202, 192),)):
        img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        p = img.load()
        for (x, y), a in self.alpha.items():
            p[x, y] = (11, 10, 9, int(255 * a))
        if border:
            b = hexrgb(border)
            filled = set(self.px.keys())
            # borde de sticker de 1 píxel lógico; los bigotes no llevan borde
            for (x, y) in [k for k, c in self.px.items() if c not in skip]:
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        q = (x + dx, y + dy)
                        if q not in filled and 0 <= q[0] < W and 0 <= q[1] < H:
                            p[q[0], q[1]] = b + (255,)
        for (x, y), c in self.px.items():
            p[x, y] = c + (255,)
        if scale != 1:
            img = img.resize((W * scale, H * scale), Image.NEAREST)
        return img
# creado por pato dev y askforvini
