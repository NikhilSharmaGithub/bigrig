#!/usr/bin/env python3
"""Generates the original studio-style product illustrations in public/products/.

One SVG per demo product slug (see ART below). Each drawing is built from simple
shapes on a shared light backdrop; no manufacturer photos, logos or brand marks.
Re-run after editing: python3 scripts/generate-product-art.py
"""
import math
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "products")

STEEL_DARK = "#2b303a"
STEEL = "#4a515e"
STEEL_MID = "#6b7280"
STEEL_LIGHT = "#a3aab6"
HIGHLIGHT = "#dfe3e9"
RUBBER = "#1d2027"
RED = "#e4002b"
AMBER = "#f5a524"
COPPER = "#b87333"

DEFS = f"""<defs>
  <radialGradient id="bg" cx="50%" cy="38%" r="75%">
    <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6e9ee"/>
  </radialGradient>
  <linearGradient id="metal" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="{STEEL}"/><stop offset=".35" stop-color="{STEEL_LIGHT}"/>
    <stop offset=".55" stop-color="{HIGHLIGHT}"/><stop offset="1" stop-color="{STEEL_MID}"/>
  </linearGradient>
  <linearGradient id="metalV" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="{HIGHLIGHT}"/><stop offset=".5" stop-color="{STEEL_LIGHT}"/>
    <stop offset="1" stop-color="{STEEL}"/>
  </linearGradient>
  <linearGradient id="dark" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="{RUBBER}"/><stop offset=".45" stop-color="{STEEL}"/>
    <stop offset="1" stop-color="{RUBBER}"/>
  </linearGradient>
  <linearGradient id="red" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#a8001f"/><stop offset=".45" stop-color="{RED}"/>
    <stop offset="1" stop-color="#8e001a"/>
  </linearGradient>
  <radialGradient id="amber" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#ffe29a"/><stop offset=".6" stop-color="{AMBER}"/>
    <stop offset="1" stop-color="#c77700"/>
  </radialGradient>
  <radialGradient id="lens" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#cfe6ff"/>
    <stop offset="1" stop-color="#7d93ad"/>
  </radialGradient>
  <radialGradient id="redlens" cx="40%" cy="35%" r="70%">
    <stop offset="0" stop-color="#ff8a95"/><stop offset=".6" stop-color="{RED}"/>
    <stop offset="1" stop-color="#7a0016"/>
  </radialGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="14"/>
  </filter>
</defs>"""


def svg(body: str, label: str, shadow_w: int = 260) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="{label}">
{DEFS}
<rect width="800" height="800" fill="url(#bg)"/>
<ellipse cx="400" cy="660" rx="{shadow_w}" ry="34" fill="#000" opacity=".16" filter="url(#soft)"/>
{body}
</svg>
"""


def cylinder(x, y, w, h, fill="url(#metal)", top="#cfd4db", rim=STEEL_DARK):
    ry = w * 0.16
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>'
            f'<ellipse cx="{x + w / 2}" cy="{y + h}" rx="{w / 2}" ry="{ry}" fill="{fill}"/>'
            f'<ellipse cx="{x + w / 2}" cy="{y}" rx="{w / 2}" ry="{ry}" fill="{top}" stroke="{rim}" stroke-width="3"/>')


# ---------------------------------------------------------------- drawings
def spin_filter(band=RED):
    return (cylinder(290, 250, 220, 360, fill="url(#metal)")
            + f'<rect x="290" y="380" width="220" height="110" fill="{band}" opacity=".92"/>'
            + '<rect x="290" y="380" width="220" height="110" fill="url(#metal)" opacity=".25"/>'
            + f'<ellipse cx="400" cy="250" rx="80" ry="22" fill="{STEEL}"/>'
            + f'<ellipse cx="400" cy="250" rx="32" ry="9" fill="{RUBBER}"/>'
            + "".join(f'<circle cx="{400 + 56 * math.cos(a)}" cy="{250 + 15 * math.sin(a)}" r="6" fill="{STEEL_DARK}"/>'
                      for a in [i * math.pi / 4 for i in range(8)]))


def air_filter():
    pleats = "".join(f'<line x1="{x}" y1="215" x2="{x}" y2="585" stroke="{STEEL}" stroke-width="3" opacity=".55"/>'
                     for x in range(292, 510, 14))
    return (f'<rect x="280" y="200" width="240" height="400" fill="#f2e7c9"/>' + pleats
            + cylinder(270, 170, 260, 40, fill="url(#dark)", top="#3a404c")
            + f'<rect x="270" y="590" width="260" height="40" fill="url(#dark)"/>'
            + f'<ellipse cx="400" cy="630" rx="130" ry="30" fill="url(#dark)"/>'
            + f'<ellipse cx="400" cy="170" rx="70" ry="18" fill="{RUBBER}"/>')


def water_pump():
    return (f'<rect x="420" y="360" width="190" height="70" rx="14" fill="url(#metalV)"/>'
            f'<circle cx="360" cy="400" r="170" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>'
            f'<circle cx="360" cy="400" r="95" fill="{STEEL_DARK}"/>'
            f'<circle cx="360" cy="400" r="80" fill="url(#metal)"/>'
            + "".join(f'<circle cx="{360 + 130 * math.cos(a)}" cy="{400 + 130 * math.sin(a)}" r="12" fill="{STEEL_DARK}"/>'
                      for a in [i * math.pi / 3 for i in range(6)])
            + f'<circle cx="360" cy="400" r="22" fill="{RUBBER}"/>')


def air_dryer():
    return (f'<rect x="250" y="520" width="300" height="100" rx="12" fill="url(#metalV)" stroke="{STEEL_DARK}" stroke-width="3"/>'
            + "".join(f'<circle cx="{x}" cy="570" r="16" fill="{STEEL_DARK}"/>' for x in (300, 500))
            + f'<rect x="300" y="250" width="200" height="280" fill="url(#dark)"/>'
            f'<ellipse cx="400" cy="250" rx="100" ry="70" fill="url(#dark)"/>'
            f'<rect x="300" y="420" width="200" height="16" fill="{RED}"/>')


def brake_shoes():
    def shoe(cx, flip):
        s = -1 if flip else 1
        return (f'<path d="M {cx} 250 A 170 170 0 0 {1 if flip else 0} {cx} 590" fill="none" stroke="url(#metal)" stroke-width="48"/>'
                f'<path d="M {cx + s * -28} 270 A 150 150 0 0 {1 if flip else 0} {cx + s * -28} 570" fill="none" stroke="#6b4a2f" stroke-width="30"/>')
    return shoe(330, False) + shoe(470, True)


def slack_adjuster():
    splines = "".join(f'<line x1="{470 + 34 * math.cos(a)}" y1="{470 + 34 * math.sin(a)}" x2="{470 + 50 * math.cos(a)}" y2="{470 + 50 * math.sin(a)}" stroke="{STEEL_DARK}" stroke-width="6"/>'
                      for a in [i * math.pi / 10 for i in range(20)])
    return (f'<path d="M 470 470 L 250 200" stroke="url(#metal)" stroke-width="70" stroke-linecap="round"/>'
            f'<circle cx="250" cy="200" r="30" fill="{STEEL_DARK}"/><circle cx="250" cy="200" r="12" fill="#e6e9ee"/>'
            f'<circle cx="470" cy="470" r="105" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>'
            f'<circle cx="470" cy="470" r="52" fill="#e6e9ee"/>' + splines
            + f'<rect x="545" y="440" width="70" height="60" rx="10" fill="{STEEL_DARK}"/>')


def leaf_spring():
    leaves = "".join(f'<path d="M {150 + i * 40} {380 + i * 22} Q 400 {470 + i * 26} {650 - i * 40} {380 + i * 22}" fill="none" stroke="{c}" stroke-width="22" stroke-linecap="round"/>'
                     for i, c in enumerate(["#3a404c", "#343a45", "#2e333d", "#292d36"]))
    return (leaves
            + f'<circle cx="140" cy="370" r="34" fill="none" stroke="#3a404c" stroke-width="20"/>'
            f'<circle cx="660" cy="370" r="34" fill="none" stroke="#3a404c" stroke-width="20"/>'
            f'<rect x="370" y="420" width="60" height="120" rx="8" fill="url(#metal)"/>')


def shock():
    return (f'<rect x="375" y="140" width="50" height="150" fill="url(#metal)"/>'
            f'<circle cx="400" cy="130" r="42" fill="none" stroke="{STEEL_DARK}" stroke-width="22"/>'
            + cylinder(330, 280, 140, 330, fill="url(#red)", top="#ff4d68")
            + f'<circle cx="400" cy="660" r="42" fill="none" stroke="{STEEL_DARK}" stroke-width="22"/>')


def coil_cord():
    loops = "".join(f'<ellipse cx="{230 + i * 38}" cy="400" rx="30" ry="120" fill="none" stroke="#1f7a3a" stroke-width="16"/>'
                    for i in range(9))
    plug = lambda x: (f'<rect x="{x}" y="340" width="90" height="120" rx="18" fill="{STEEL_DARK}"/>'
                      f'<circle cx="{x + 45}" cy="400" r="34" fill="url(#metal)"/>')
    return loops + plug(110) + plug(600)


def alternator():
    fins = "".join(f'<rect x="{300 + i * 26}" y="250" width="12" height="300" rx="6" fill="{STEEL_DARK}" opacity=".45"/>'
                   for i in range(8))
    return (f'<circle cx="420" cy="400" r="170" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>' + fins
            + f'<rect x="170" y="370" width="90" height="60" fill="url(#metalV)"/>'
            f'<circle cx="190" cy="400" r="70" fill="{RUBBER}"/><circle cx="190" cy="400" r="40" fill="url(#metal)"/>'
            f'<circle cx="590" cy="250" r="26" fill="{STEEL_DARK}"/><circle cx="590" cy="550" r="26" fill="{STEEL_DARK}"/>')


def ac_compressor():
    return (cylinder(330, 250, 280, 300, fill="url(#metal)")
            + f'<circle cx="260" cy="400" r="120" fill="{RUBBER}"/>'
            f'<circle cx="260" cy="400" r="85" fill="url(#metal)"/><circle cx="260" cy="400" r="30" fill="{STEEL_DARK}"/>'
            f'<rect x="500" y="200" width="46" height="60" rx="8" fill="{STEEL_DARK}"/>'
            f'<rect x="420" y="200" width="46" height="60" rx="8" fill="{STEEL_DARK}"/>')


def serpentine_belt():
    ribs = "".join(f'<path d="M 200 {300 + i * 8} Q 400 {230 + i * 8} 600 {300 + i * 8}" fill="none" stroke="#3a404c" stroke-width="2"/>'
                   for i in range(4))
    return (f'<rect x="150" y="260" width="500" height="280" rx="140" fill="none" stroke="{RUBBER}" stroke-width="44"/>'
            + ribs + f'<rect x="150" y="260" width="500" height="280" rx="140" fill="none" stroke="#3a404c" stroke-width="4" stroke-dasharray="10 10"/>')


def coolant_hose():
    return (f'<path d="M 200 250 C 200 450 600 350 600 560" fill="none" stroke="{RUBBER}" stroke-width="90" stroke-linecap="round"/>'
            f'<path d="M 200 250 C 200 450 600 350 600 560" fill="none" stroke="#3a404c" stroke-width="30" opacity=".5"/>'
            f'<rect x="150" y="235" width="100" height="30" rx="6" fill="url(#metal)"/>'
            f'<rect x="550" y="545" width="100" height="30" rx="6" fill="url(#metal)"/>')


def radiator():
    grid = "".join(f'<line x1="{x}" y1="250" x2="{x}" y2="550" stroke="{STEEL}" stroke-width="3"/>' for x in range(230, 572, 12))
    return (f'<rect x="220" y="250" width="360" height="300" fill="#8f96a3"/>' + grid
            + f'<rect x="200" y="200" width="400" height="60" rx="10" fill="url(#dark)"/>'
            f'<rect x="200" y="540" width="400" height="60" rx="10" fill="url(#dark)"/>'
            f'<rect x="560" y="170" width="40" height="40" rx="6" fill="url(#metal)"/>')


def u_joint():
    cap = lambda x, y: f'<circle cx="{x}" cy="{y}" r="58" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/><circle cx="{x}" cy="{y}" r="22" fill="{STEEL_DARK}"/>'
    return (f'<rect x="370" y="230" width="60" height="340" fill="url(#metal)"/>'
            f'<rect x="230" y="370" width="340" height="60" fill="url(#metalV)"/>'
            + cap(400, 210) + cap(400, 590) + cap(210, 400) + cap(590, 400)
            + f'<circle cx="400" cy="400" r="44" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>')


def bearing():
    balls = "".join(f'<circle cx="{400 + 125 * math.cos(a)}" cy="{400 + 125 * math.sin(a)}" r="26" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="2"/>'
                    for a in [i * math.pi / 6 for i in range(12)])
    return (f'<circle cx="400" cy="400" r="190" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>'
            f'<circle cx="400" cy="400" r="155" fill="{STEEL_DARK}"/>' + balls
            + f'<circle cx="400" cy="400" r="95" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>'
            f'<circle cx="400" cy="400" r="62" fill="#e6e9ee"/>')


def wheel_seal():
    return (f'<circle cx="400" cy="400" r="200" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>'
            f'<circle cx="400" cy="400" r="160" fill="{RED}"/>'
            f'<circle cx="400" cy="400" r="120" fill="{RUBBER}"/>'
            f'<circle cx="400" cy="400" r="100" fill="#e6e9ee"/>')


def lug_nuts():
    def nut(cx, cy, r):
        hexp = " ".join(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}" for a in [i * math.pi / 3 + math.pi / 6 for i in range(6)])
        return (f'<circle cx="{cx}" cy="{cy + 10}" r="{r * 1.18}" fill="{STEEL}"/>'
                f'<polygon points="{hexp}" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>'
                f'<circle cx="{cx}" cy="{cy}" r="{r * 0.42}" fill="{STEEL_DARK}"/>')
    return nut(290, 470, 95) + nut(510, 470, 95) + nut(400, 300, 95)


def hub():
    studs = "".join(f'<circle cx="{400 + 140 * math.cos(a)}" cy="{400 + 140 * math.sin(a)}" r="18" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="3"/>'
                    for a in [i * math.pi / 5 for i in range(10)])
    return (f'<circle cx="400" cy="400" r="210" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>'
            f'<circle cx="400" cy="400" r="175" fill="{STEEL}"/>' + studs
            + f'<circle cx="400" cy="400" r="90" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>'
            f'<circle cx="400" cy="400" r="50" fill="{RED}"/>')


def mirror():
    return (f'<rect x="300" y="150" width="200" height="440" rx="18" fill="{RUBBER}"/>'
            f'<rect x="318" y="168" width="164" height="404" rx="10" fill="url(#lens)"/>'
            f'<path d="M 500 250 L 610 250 L 610 490 L 500 490" fill="none" stroke="url(#metalV)" stroke-width="22"/>')


def marker_lights():
    return "".join(f'<ellipse cx="{x}" cy="460" rx="58" ry="22" fill="{RUBBER}"/>'
                   f'<path d="M {x - 52} 455 A 52 60 0 0 1 {x + 52} 455 Z" fill="url(#amber)"/>'
                   for x in (160, 280, 400, 520, 640))


def headlamp():
    return (f'<circle cx="400" cy="400" r="210" fill="{RUBBER}"/>'
            f'<circle cx="400" cy="400" r="180" fill="url(#lens)"/>'
            + "".join(f'<circle cx="{400 + 90 * math.cos(a)}" cy="{400 + 90 * math.sin(a)}" r="36" fill="#ffffff" stroke="#9fb4cc" stroke-width="4"/>'
                      for a in [i * math.pi / 3 for i in range(6)])
            + '<circle cx="400" cy="400" r="40" fill="#ffffff" stroke="#9fb4cc" stroke-width="4"/>')


def stt_lamp():
    dots = "".join(f'<circle cx="{400 + r * math.cos(a)}" cy="{400 + r * math.sin(a)}" r="14" fill="#ffd0d5" opacity=".85"/>'
                   for r in (70, 130) for a in [i * math.pi / (4 if r == 70 else 7) for i in range(8 if r == 70 else 14)])
    return (f'<circle cx="400" cy="400" r="200" fill="{RUBBER}"/>'
            f'<circle cx="400" cy="400" r="170" fill="url(#redlens)"/>' + dots)


def landing_gear():
    leg = lambda x: (f'<rect x="{x}" y="180" width="80" height="330" fill="url(#metal)"/>'
                     f'<rect x="{x + 12}" y="500" width="56" height="110" fill="{STEEL}"/>'
                     f'<rect x="{x - 30}" y="600" width="140" height="26" rx="6" fill="{STEEL_DARK}"/>')
    return (leg(220) + leg(500)
            + f'<rect x="300" y="300" width="200" height="30" fill="{STEEL_DARK}"/>'
            f'<path d="M 580 250 L 680 250 L 680 330" fill="none" stroke="{RED}" stroke-width="18" stroke-linecap="round"/>')


def nosebox():
    sock = lambda x: f'<circle cx="{x}" cy="400" r="70" fill="{STEEL_DARK}"/><circle cx="{x}" cy="400" r="48" fill="url(#metal)"/>'
    return (f'<rect x="200" y="240" width="400" height="320" rx="20" fill="url(#metalV)" stroke="{STEEL_DARK}" stroke-width="4"/>'
            + sock(310) + sock(490)
            + "".join(f'<circle cx="{x}" cy="{y}" r="10" fill="{STEEL_DARK}"/>' for x in (225, 575) for y in (265, 535)))


def relay_valve():
    port = lambda x, y: f'<circle cx="{x}" cy="{y}" r="28" fill="{STEEL_DARK}"/><circle cx="{x}" cy="{y}" r="14" fill="url(#metal)"/>'
    return (f'<rect x="220" y="360" width="360" height="220" rx="20" fill="url(#metalV)" stroke="{STEEL_DARK}" stroke-width="4"/>'
            + cylinder(300, 230, 200, 140, fill="url(#metal)")
            + port(270, 470) + port(530, 470) + port(400, 520)
            + f'<rect x="385" y="190" width="30" height="50" fill="{STEEL_DARK}"/>')


def grease():
    tube = lambda x: (cylinder(x, 220, 110, 380, fill="url(#red)", top="#ff4d68")
                      + f'<rect x="{x}" y="330" width="110" height="80" fill="#ffffff" opacity=".85"/>')
    return tube(190) + tube(345) + tube(500)


def hose_clamps():
    def clamp(cx, cy, r):
        return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="url(#metal)" stroke-width="22"/>'
                f'<rect x="{cx + r - 30}" y="{cy - 28}" width="60" height="56" rx="8" fill="{STEEL}"/>'
                f'<circle cx="{cx + r}" cy="{cy}" r="16" fill="{STEEL_DARK}"/>')
    return clamp(300, 330, 120) + clamp(490, 470, 110) + clamp(290, 540, 80)


def def_jug():
    return (f'<path d="M 250 250 L 520 250 L 560 300 L 560 610 L 250 610 Z" fill="#f4f6f8" stroke="{STEEL_LIGHT}" stroke-width="5"/>'
            f'<path d="M 470 250 L 470 180 L 540 180 L 560 300" fill="none" stroke="{STEEL_LIGHT}" stroke-width="50"/>'
            f'<path d="M 470 250 L 470 180 L 540 180 L 560 300" fill="none" stroke="#f4f6f8" stroke-width="40"/>'
            f'<rect x="300" y="200" width="90" height="60" rx="8" fill="#1e63c6"/>'
            f'<rect x="270" y="380" width="270" height="120" rx="10" fill="#1e63c6"/>'
            f'<rect x="270" y="470" width="270" height="12" fill="#ffffff" opacity=".6"/>')


def clutch_kit():
    springs = "".join(f'<circle cx="{400 + 115 * math.cos(a)}" cy="{400 + 115 * math.sin(a)}" r="22" fill="{STEEL_DARK}"/>'
                      for a in [i * math.pi / 4 for i in range(8)])
    return (f'<circle cx="400" cy="400" r="215" fill="#6b4a2f"/>'
            f'<circle cx="400" cy="400" r="180" fill="url(#metal)" stroke="{STEEL_DARK}" stroke-width="4"/>' + springs
            + f'<circle cx="400" cy="400" r="70" fill="{STEEL_DARK}"/><circle cx="400" cy="400" r="34" fill="#e6e9ee"/>')


def wiper_blade():
    return (f'<rect x="120" y="390" width="560" height="26" rx="6" fill="{RUBBER}"/>'
            f'<path d="M 140 390 L 400 340 L 660 390" fill="none" stroke="{STEEL_DARK}" stroke-width="22" stroke-linejoin="round"/>'
            f'<rect x="370" y="310" width="60" height="40" rx="8" fill="url(#metal)"/>')


ART = {
    "fleetguard-fuel-water-sep-fs1280": ("Fuel/water separator", lambda: spin_filter("#1e63c6")),
    "fleetguard-oil-filter-lf9009": ("Spin-on lube filter", lambda: spin_filter(RED)),
    "donaldson-primary-air-p181050": ("Primary air filter", air_filter),
    "alliance-water-pump-wp1163": ("Water pump assembly", water_pump),
    "bendix-air-dryer-ad-ip": ("Air dryer assembly", air_dryer),
    "meritor-brake-shoe-kit-4707": ("Brake shoe kit", brake_shoes),
    "haldex-slack-adjuster-auto": ("Automatic slack adjuster", slack_adjuster),
    "alliance-leaf-spring-front": ("Front leaf spring", leaf_spring),
    "meritor-shock-absorber-hd": ("Heavy-duty shock absorber", shock),
    "phillips-7way-cord-15ft": ("Coiled trailer cord", coil_cord),
    "alliance-alternator-160a": ("Alternator", alternator),
    "gates-serpentine-belt-k08": ("Serpentine belt", serpentine_belt),
    "alliance-radiator-cascadia": ("Radiator assembly", radiator),
    "gates-coolant-hose-upper": ("Coolant hose", coolant_hose),
    "bendix-ac-compressor-tu-flo": ("A/C compressor", ac_compressor),
    "dana-u-joint-1810": ("U-joint", u_joint),
    "alliance-pilot-bearing": ("Pilot bearing", bearing),
    "stemco-wheel-seal-guardian": ("Wheel seal", wheel_seal),
    "alliance-lug-nut-flange": ("Flanged lug nuts", lug_nuts),
    "stemco-hub-assembly-trailer": ("Trailer hub assembly", hub),
    "alliance-west-coast-mirror": ("West coast mirror head", mirror),
    "grote-cab-marker-amber-5pk": ("Amber cab marker lights", marker_lights),
    "grote-led-headlamp-7in": ("LED headlamp", headlamp),
    "grote-led-stt-lamp-4in": ("LED stop/tail/turn lamp", stt_lamp),
    "alliance-landing-gear-2speed": ("Landing gear set", landing_gear),
    "phillips-trailer-nosebox": ("Trailer nosebox", nosebox),
    "haldex-trailer-brake-valve": ("ABS relay valve", relay_valve),
    "alliance-grease-cartridge-14oz": ("Grease cartridges", grease),
    "gates-hose-clamp-kit": ("Hose clamp kit", hose_clamps),
    "alliance-def-fluid-25gal": ("Diesel exhaust fluid jug", def_jug),
    "dana-clutch-kit-15-5": ("Clutch kit", clutch_kit),
    "alliance-wiper-blade-22": ("Wiper blade", wiper_blade),
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for slug, (label, draw) in ART.items():
        with open(os.path.join(OUT, f"{slug}.svg"), "w") as f:
            f.write(svg(draw(), label))
    print(f"wrote {len(ART)} illustrations to public/products/")
