import { api } from '../adapters/api.adapter';

export interface RankingItem {
  id: string;
  juego: 'runner' | 'snake';
  usuarioId: number;
  usuarioNombre: string;
  usuarioRol: 'admin' | 'supervisor' | 'recepcionista' | string;
  puntaje: number;
  updatedAt: string;
}

export interface RankingCompleto {
  runner: RankingItem[];
  snake: RankingItem[];
}

export interface ResultadoGuardadoRecord {
  esNuevoRecord: boolean;
  mejorPuntaje: number;
  ranking: RankingItem[];
}

export class JuegosRepository {
  async obtenerRanking(): Promise<RankingCompleto> {
    try {
      const { data } = await api.get<RankingCompleto>('juegos/ranking');
      return {
        runner: Array.isArray(data?.runner) ? data.runner : [],
        snake: Array.isArray(data?.snake) ? data.snake : [],
      };
    } catch {
      return { runner: [], snake: [] };
    }
  }

  async guardarRecord(juego: 'runner' | 'snake', puntaje: number): Promise<ResultadoGuardadoRecord | null> {
    try {
      const { data } = await api.post<ResultadoGuardadoRecord>('juegos/record', {
        juego,
        puntaje,
      });
      return data;
    } catch {
      return null;
    }
  }
}
