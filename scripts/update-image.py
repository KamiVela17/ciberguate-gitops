#!/usr/bin/env python3
import pathlib
import sys


def update_image(environment: str, image_name: str, new_name: str, new_tag: str) -> None:
    path = pathlib.Path(__file__).resolve().parents[1] / "overlays" / environment / "kustomization.yaml"
    lines = path.read_text(encoding="utf-8").splitlines()
    updated = False
    for index, line in enumerate(lines):
        if line.strip() == f"- name: {image_name}":
            if index + 2 >= len(lines):
                break
            lines[index + 1] = f"    newName: {new_name}"
            lines[index + 2] = f"    newTag: {new_tag}"
            updated = True
            break
    if not updated:
        raise SystemExit(f"No se encontró la imagen {image_name} en {path}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        raise SystemExit("Uso: update-image.py <ambiente> <imagen> <repositorio> <sha>")
    update_image(*sys.argv[1:])
