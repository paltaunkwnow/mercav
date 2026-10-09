/**
 * LRU chico en memoria del proceso. Los cálculos por año (feriados, calendario hebreo) son
 * deterministas: el mismo país, región, fuentes y año dan siempre lo mismo.
 * Lo que devuelve se comparte entre pedidos: no hay que mutarlo.
 */
export function lru<V>(max: number) {
  const map = new Map<string, V>();
  return {
    get(key: string, make: () => V): V {
      const hit = map.get(key);
      if (hit !== undefined) {
        // Al final = usado hace poco.
        map.delete(key);
        map.set(key, hit);
        return hit;
      }
      const value = make();
      map.set(key, value);
      if (map.size > max) {
        const oldest = map.keys().next().value;
        if (oldest !== undefined) map.delete(oldest);
      }
      return value;
    },
    clear() {
      map.clear();
    },
  };
}
// creado por pato dev y askforvini
