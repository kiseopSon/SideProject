# CLI for IDM-VTON try-on. Run from IDM-VTON root: python gradio_demo/run_tryon_cli.py --human ... --garment ... --output ...
# Uses GPU (cuda:0) when available.
from __future__ import annotations

import argparse
import gc
import os
import sys

from PIL import Image


def main():
    ap = argparse.ArgumentParser(description="IDM-VTON try-on CLI (GPU)")
    ap.add_argument("--human", required=True, help="Path to person image")
    ap.add_argument("--garment", required=True, help="Path to garment image")
    ap.add_argument("--output", required=True, help="Path to save result PNG")
    ap.add_argument("--garment_des", default="upper body clothing", help="Garment description")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--denoise_steps", type=int, default=30)
    ap.add_argument("--no_crop", action="store_true", help="Disable auto-crop")
    args = ap.parse_args()

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    gradio_demo = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)
    for d in (gradio_demo, root):
        if d not in sys.path:
            sys.path.insert(0, d)

    gc.collect()
    from gradio_demo import app

    human_pil = Image.open(args.human).convert("RGB")
    garm_pil = Image.open(args.garment).convert("RGB")
    inp = {"background": human_pil, "layers": None}

    out_img, _ = app.start_tryon(
        inp,
        garm_pil,
        args.garment_des,
        is_checked=True,
        is_checked_crop=not args.no_crop,
        denoise_steps=args.denoise_steps,
        seed=args.seed,
    )
    out_img.save(args.output)
    print("Saved:", args.output)


if __name__ == "__main__":
    main()
