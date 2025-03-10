import argparse

from .explorer import ExploradorTematico

def main():
    parser = argparse.ArgumentParser(description="Generador de gráficos de nodos para desglosar ideas.")
    parser.add_argument("--idea", type=str, help="Idea principal", default="Segunda Guerra Mundial")
    parser.add_argument("--modo", type=str, default="investigar", help="Modo a usar")
    parser.add_argument("--profundidad", type=int, default=3, help="Profundidad máxima de desglose")
    args = parser.parse_args()

    explorador = ExploradorTematico(args.idea, modo=args.modo)
    explorador.ejecutar(profundidad=args.profundidad)

if __name__ == "__main__":
    main()
