"""HN Services hero — footage pipeline (v2).
Two frame sets from the same edit:
  d  1600x900  landscape, for desktop/tablet
  m  720x1280  portrait, re-framed per shot (focus x), for phones
Every shot gets the same grade and N WebP frames, then each shot is packed
into one file (concatenated WebP + offsets in manifest.json)."""
import json, os, subprocess, sys, shutil
from PIL import Image

N = 30
SETS = {"d": (1600, 900, 60), "m": (720, 1280, 60)}
GRADE = ("eq=contrast=1.06:saturation=0.82:gamma=0.97,"
         "colorbalance=rs=-0.05:bs=0.05:rh=0.05:gh=0.02:bh=-0.04")

# id, source, start, dur, pre (landscape only), exposure, portrait focus x (0..1)
SHOTS = [
    ("s01", "5474275", 0.0, 6.0, "", "eq=brightness=-0.07", 0.50),   # rosto + código
    ("s02", "14970182", 0.0, 6.4, "", "", 0.60),                     # dev à noite
    ("s03", "852063", 60.0, 8.0, "", "eq=brightness=-0.05", 0.58),   # esboço
    ("s04", "7989474", 0.0, 6.0, "", "eq=brightness=-0.05", 0.55),   # mãos, top-down
    ("s05", "6804128", 4.0, 6.0, "", "eq=brightness=-0.03", 0.62),   # time
    ("s06", "aisle", 0, 0, "", "", 0.50),                            # corredor 2.5D
    ("s07", "7140931", 0.0, 6.0, "crop=iw/1.3:ih/1.3:(iw-iw/1.3)/2:ih-ih/1.3", "", 0.45),
    ("s08", "1085656", 2.0, 6.0, "", "eq=saturation=0.75", 0.62),    # cabos
    ("s09", "16667320", 0.0, 8.0, "", "", 0.52),                     # Capibaribe
    ("s10", "16671042", 28.0, 10.0, "", "", 0.52),                   # Ponte Estaiada
    ("s11", "8441631", 45.5, 8.0, "", "", 0.50),                     # dona do café à mesa
    ("s12", "8426095", 0.0, 8.0, "", "", 0.62),                      # avental
    ("s13", "8657613", 8.0, 6.0, "", "", 0.62),                      # pagamento
    ("s14", "8061760", 0.0, 6.0, "crop=iw:iw*9/16:0:1920", "", 0.50),# aperto (vertical na origem)
    ("s15", "14392820", 0.0, 10.0, "", "eq=brightness=0.02", 0.50),  # nascer do sol
]

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-1500:]); sys.exit(1)

def video(set_, out, src, ss, dur, pre, extra, fx):
    W, H, Q = SETS[set_]
    if set_ == "d":
        frame = [pre, f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos", f"crop={W}:{H}"]
    else:  # portrait: crop the widest 9:16 window around fx (vertical sources keep their full frame)
        frame = [f"crop='min(iw,ih*9/16)':'min(ih,iw*16/9)':'(iw-min(iw,ih*9/16))*{fx}':'(ih-min(ih,iw*16/9))*0.5'",
                 f"scale={W}:{H}:flags=lanczos"]
    chain = [f for f in frame + [GRADE, extra, f"fps={N}/{dur}"] if f]
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(ss), "-t", str(dur), "-i", f"src/{src}.mp4",
         "-vf", ",".join(chain), "-frames:v", str(N), "-c:v", "libwebp", "-quality", str(Q), f"{out}/%02d.webp"])

def aisle(set_, out):
    W, H, Q = SETS[set_]
    img = Image.open("stills/aisle.png").convert("RGB"); iw, ih = img.size
    vx, vy = iw * 0.5, ih * 0.535
    bw0 = min(iw, ih * W / H); bh0 = bw0 * H / W           # widest window with the output aspect
    tmp = f"/tmp/claude-0/aisle-{set_}"; shutil.rmtree(tmp, True); os.makedirs(tmp)
    for i in range(N):
        t = i / (N - 1); z = 1.0 + 0.55 * t
        bw, bh = bw0 / z, bh0 / z
        cx = iw / 2 + (vx - iw / 2) * t; cy = ih / 2 + (vy - ih / 2) * t
        img.transform((W, H), Image.EXTENT, (cx - bw/2, cy - bh/2, cx + bw/2, cy + bh/2), Image.BICUBIC).save(f"{tmp}/{i+1:02d}.png")
    run(["ffmpeg", "-v", "error", "-y", "-framerate", "25", "-i", f"{tmp}/%02d.png", "-vf", GRADE,
         "-c:v", "libwebp", "-quality", str(Q), f"{out}/%02d.webp"])

if __name__ == "__main__":
    only = sys.argv[1:]
    man = {"n": N, "shots": [s[0] for s in SHOTS], "sets": {}}
    for set_ in SETS:
        man["sets"][set_] = {}
        os.makedirs(f"public/pack/{set_}", exist_ok=True)
        for sid, src, ss, dur, pre, extra, fx in SHOTS:
            out = f"build/{set_}/{sid}"
            if not only or sid in only:
                shutil.rmtree(out, True); os.makedirs(out)
                aisle(set_, out) if src == "aisle" else video(set_, out, src, ss, dur, pre, extra, fx)
            offs, blob = [], b""
            for f in sorted(os.listdir(out)):
                d = open(f"{out}/{f}", "rb").read(); offs.append([len(blob), len(d)]); blob += d
            open(f"public/pack/{set_}/{sid}.bin", "wb").write(blob)
            man["sets"][set_][sid] = offs
            print(set_, sid, len(offs), f"{len(blob)//1024} KB", flush=True)
    json.dump(man, open("public/pack/manifest.json", "w"))
