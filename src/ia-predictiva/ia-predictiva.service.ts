import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class IaPredictivaService {
  private openai: OpenAI;
  private readonly logger = new Logger(IaPredictivaService.name);
  
  // Cache simple por negocio
  private dashboardCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hora

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'fake-key',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
    });
  }

  async getDashboardData(negocioId: string) {
    const cache = this.dashboardCache.get(negocioId);
    if (cache && (Date.now() - cache.timestamp) < this.CACHE_TTL) {
      return cache.data;
    }

    const dataContext = await this.gatherBusinessContext(negocioId);

    const prompt = `
      Eres una IA experta en administración de negocios.
      A continuación te presento los datos actuales del negocio:
      ${JSON.stringify(dataContext)}
      
      Necesito que analices estos datos y me devuelvas un JSON estrictamente con la siguiente estructura:
      {
        "recomendaciones": [
          { "tipo": "COMPRA", "mensaje": "Comprar más cerveza", "prioridad": "ALTA" }
        ],
        "alertas": [
          { "tipo": "STOCK_CRITICO", "mensaje": "El producto X podría agotarse...", "prioridad": "ALTA" }
        ],
        "prediccionVentas": {
          "manana": { "valorEstimado": 500000, "nivelConfianza": "85%", "tendencia": "ALZA" },
          "semanal": { "valorEstimado": 3500000, "nivelConfianza": "90%", "tendencia": "ESTABLE" },
          "mensual": { "valorEstimado": 15000000, "nivelConfianza": "80%", "tendencia": "BAJA" }
        },
        "tendencias": {
          "crecimiento": ["Producto A", "Producto B"],
          "descenso": ["Producto C"]
        }
      }
      
      Basa tus recomendaciones, alertas, y predicciones de ventas estrictamente en los datos numéricos proporcionados.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gemini-1.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      let resultText = response.choices[0].message.content || '{}';
      if (resultText.includes('```json')) {
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '');
      }
      resultText = resultText.trim();
      
      const data = JSON.parse(resultText);

      this.dashboardCache.set(negocioId, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      this.logger.error('Error al consultar OpenAI para el dashboard, devolviendo datos simulados', error);
      
      const mockData = {
        recomendaciones: [
          { tipo: "COMPRA", mensaje: "Comprar más Cerveza Poker para el fin de semana.", prioridad: "ALTA" },
          { tipo: "OFERTA", mensaje: "Promocionar Aguardiente Antioqueño debido a sobrestock.", prioridad: "MEDIA" }
        ],
        alertas: [
          { tipo: "STOCK CRÍTICO", mensaje: "El Whisky Red Label está próximo a agotarse (quedan 2 unidades).", prioridad: "ALTA" }
        ],
        prediccionVentas: {
          manana: { valorEstimado: 2500000, nivelConfianza: "88%", tendencia: "ALZA" },
          semanal: { valorEstimado: 18500000, nivelConfianza: "92%", tendencia: "ESTABLE" },
          mensual: { valorEstimado: 75000000, nivelConfianza: "85%", tendencia: "ALZA" }
        },
        tendencias: {
          crecimiento: ["Cerveza Corona", "Tequila Don Julio"],
          descenso: ["Gaseosa Manzana", "Ron Viejo de Caldas"]
        }
      };

      this.dashboardCache.set(negocioId, {
        data: mockData,
        timestamp: Date.now()
      });

      return mockData;
    }
  }

  async chat(message: string, negocioId: string) {
    const dataContext = await this.gatherBusinessContext(negocioId);
    
    const prompt = `
      Eres una IA experta que asiste en la administración de este negocio.
      Responde a la consulta del usuario basándote ÚNICAMENTE en estos datos de sistema:
      ${JSON.stringify(dataContext)}
      
      Consulta del usuario: "${message}"
      
      Responde de forma clara, concisa y profesional.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gemini-1.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return { reply: response.choices[0].message.content };
    } catch (error) {
      this.logger.error('Error al consultar OpenAI para el chat, devolviendo respuesta simulada', error);
      return { reply: "Lo siento, actualmente no tengo conexión con OpenAI (falta API Key). Soy una versión de demostración y te sugiero reponer el stock crítico reportado." };
    }
  }

  private async gatherBusinessContext(negocioId: string) {
    // Para simplificar, buscamos los críticos donde stockActual <= stockMinimo
    const stockCriticoRaw = await this.prisma.$queryRaw<any[]>`
      SELECT nombre, "stockActual", "stockMinimo"
      FROM productos
      WHERE activo = true AND "stockActual" > 0 AND "stockActual" <= "stockMinimo" AND "negocioId" = ${negocioId}
      LIMIT 20
    `;

    const unMesAtras = new Date();
    unMesAtras.setDate(unMesAtras.getDate() - 30);

    const ventasRecientes = await this.prisma.venta.findMany({
      where: { fecha: { gte: unMesAtras }, estado: 'COMPLETADA', negocioId },
      select: { fecha: true, total: true, detalles: { select: { productoNombre: true, cantidad: true } } }
    });

    return {
      inventario: {
        productosBajoStock: stockCriticoRaw
      },
      ventas: {
        totalVentasUltimos30Dias: ventasRecientes.length,
        ingresosUltimos30Dias: ventasRecientes.reduce((acc, v) => acc + Number(v.total), 0),
        detallesVentas: ventasRecientes.flatMap(v => v.detalles)
      }
    };
  }
}
