interface BetweenScreenProps {
  round: number;
  onNext: () => void;
}

export function BetweenScreen({ round, onNext }: BetweenScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-24 gap-8">
      <h2 className="text-3xl md:text-4xl font-extrabold">
        ¿Preparado para la <span className="text-primary">ronda {round}</span>?
      </h2>
      <button
        onClick={onNext}
        className="rounded-md bg-white text-primary-foreground font-bold px-10 py-3 text-lg hover:opacity-90"
      >
        Siguiente
      </button>
    </div>
  );
}
