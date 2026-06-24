/**
 * Script: seed-productos.ts
 * Agrega un catálogo completo de productos al inventario de Dulcinea Exclusive VIP
 */
import { PrismaClient, Categoria, Unidad } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const negocio = await prisma.negocio.findFirstOrThrow();
  const negocioId = negocio.id;

  console.log(`Agregando productos al negocio: ${negocio.nombre}`);

  const productos = [
    // ─── LICORES ────────────────────────────────────────────────────────────
    { codigo: 'LIC-001', nombre: 'Ron Bacardí Añejo 750ml',       categoria: Categoria.LICOR,       marca: 'Bacardí',         unidad: Unidad.BOTELLA, precioCompra: 45000,  precioVenta: 75000,  stockActual: 24, stockMinimo: 6  },
    { codigo: 'LIC-002', nombre: "Whisky Jack Daniel's 750ml",    categoria: Categoria.LICOR,       marca: "Jack Daniel's",   unidad: Unidad.BOTELLA, precioCompra: 120000, precioVenta: 180000, stockActual: 12, stockMinimo: 4  },
    { codigo: 'LIC-003', nombre: 'Vodka Absolut 750ml',           categoria: Categoria.LICOR,       marca: 'Absolut',         unidad: Unidad.BOTELLA, precioCompra: 75000,  precioVenta: 120000, stockActual: 10, stockMinimo: 4  },
    { codigo: 'LIC-004', nombre: 'Ron Medellín Añejo 750ml',      categoria: Categoria.LICOR,       marca: 'Medellín',        unidad: Unidad.BOTELLA, precioCompra: 38000,  precioVenta: 60000,  stockActual: 18, stockMinimo: 6  },
    { codigo: 'LIC-005', nombre: 'Aguardiente Antioqueño 750ml',  categoria: Categoria.LICOR,       marca: 'Fábrica de Licores de Antioquia', unidad: Unidad.BOTELLA, precioCompra: 22000, precioVenta: 35000, stockActual: 30, stockMinimo: 10 },
    { codigo: 'LIC-006', nombre: 'Aguardiente Cristal 750ml',     categoria: Categoria.LICOR,       marca: 'Cristal',         unidad: Unidad.BOTELLA, precioCompra: 20000,  precioVenta: 32000,  stockActual: 24, stockMinimo: 10 },
    { codigo: 'LIC-007', nombre: 'Vodka Smirnoff 750ml',          categoria: Categoria.LICOR,       marca: 'Smirnoff',        unidad: Unidad.BOTELLA, precioCompra: 55000,  precioVenta: 85000,  stockActual: 8,  stockMinimo: 4  },
    { codigo: 'LIC-008', nombre: 'Tequila José Cuervo Gold 750ml',categoria: Categoria.LICOR,       marca: 'José Cuervo',     unidad: Unidad.BOTELLA, precioCompra: 95000,  precioVenta: 150000, stockActual: 6,  stockMinimo: 2  },
    { codigo: 'LIC-009', nombre: 'Ron Dictador 12 años 750ml',    categoria: Categoria.LICOR,       marca: 'Dictador',        unidad: Unidad.BOTELLA, precioCompra: 130000, precioVenta: 200000, stockActual: 4,  stockMinimo: 2  },
    { codigo: 'LIC-010', nombre: 'Whisky Johnnie Walker Red 750ml', categoria: Categoria.LICOR,     marca: 'Johnnie Walker',  unidad: Unidad.BOTELLA, precioCompra: 85000,  precioVenta: 135000, stockActual: 10, stockMinimo: 4  },
    { codigo: 'LIC-011', nombre: 'Whisky Johnnie Walker Black 750ml', categoria: Categoria.LICOR,   marca: 'Johnnie Walker',  unidad: Unidad.BOTELLA, precioCompra: 160000, precioVenta: 250000, stockActual: 6,  stockMinimo: 2  },
    { codigo: 'LIC-012', nombre: 'Gin Hendricks 750ml',           categoria: Categoria.LICOR,       marca: "Hendrick's",      unidad: Unidad.BOTELLA, precioCompra: 140000, precioVenta: 220000, stockActual: 4,  stockMinimo: 2  },
    { codigo: 'LIC-013', nombre: 'Gin Tanqueray 750ml',           categoria: Categoria.LICOR,       marca: 'Tanqueray',       unidad: Unidad.BOTELLA, precioCompra: 90000,  precioVenta: 145000, stockActual: 5,  stockMinimo: 2  },
    { codigo: 'LIC-014', nombre: 'Champagne Moët & Chandon 750ml',categoria: Categoria.LICOR,       marca: 'Moët & Chandon',  unidad: Unidad.BOTELLA, precioCompra: 280000, precioVenta: 420000, stockActual: 6,  stockMinimo: 2  },
    { codigo: 'LIC-015', nombre: 'Vino Tinto Concha y Toro 750ml',categoria: Categoria.LICOR,       marca: 'Concha y Toro',   unidad: Unidad.BOTELLA, precioCompra: 35000,  precioVenta: 58000,  stockActual: 12, stockMinimo: 4  },
    { codigo: 'LIC-016', nombre: 'Ron Havana Club 7 años 750ml',  categoria: Categoria.LICOR,       marca: 'Havana Club',     unidad: Unidad.BOTELLA, precioCompra: 88000,  precioVenta: 140000, stockActual: 8,  stockMinimo: 3  },
    { codigo: 'LIC-017', nombre: 'Brandy Torres 10 750ml',        categoria: Categoria.LICOR,       marca: 'Torres',          unidad: Unidad.BOTELLA, precioCompra: 70000,  precioVenta: 110000, stockActual: 5,  stockMinimo: 2  },
    { codigo: 'LIC-018', nombre: 'Baileys Irish Cream 750ml',     categoria: Categoria.LICOR,       marca: "Baileys",         unidad: Unidad.BOTELLA, precioCompra: 80000,  precioVenta: 125000, stockActual: 6,  stockMinimo: 2  },

    // ─── CERVEZAS ───────────────────────────────────────────────────────────
    { codigo: 'CER-001', nombre: 'Cerveza Club Colombia Roja x24', categoria: Categoria.CERVEZA,    marca: 'Bavaria',         unidad: Unidad.CAJA,    precioCompra: 62000,  precioVenta: 96000,  stockActual: 20, stockMinimo: 8  },
    { codigo: 'CER-002', nombre: 'Cerveza Heineken 330ml x24',    categoria: Categoria.CERVEZA,     marca: 'Heineken',        unidad: Unidad.CAJA,    precioCompra: 85000,  precioVenta: 130000, stockActual: 15, stockMinimo: 6  },
    { codigo: 'CER-003', nombre: 'Cerveza Corona 355ml x24',      categoria: Categoria.CERVEZA,     marca: 'Modelo',          unidad: Unidad.CAJA,    precioCompra: 90000,  precioVenta: 140000, stockActual: 12, stockMinimo: 6  },
    { codigo: 'CER-004', nombre: 'Cerveza Poker x24',             categoria: Categoria.CERVEZA,     marca: 'Bavaria',         unidad: Unidad.CAJA,    precioCompra: 48000,  precioVenta: 75000,  stockActual: 20, stockMinimo: 8  },
    { codigo: 'CER-005', nombre: 'Cerveza Águila x24',            categoria: Categoria.CERVEZA,     marca: 'Bavaria',         unidad: Unidad.CAJA,    precioCompra: 46000,  precioVenta: 72000,  stockActual: 25, stockMinimo: 10 },
    { codigo: 'CER-006', nombre: 'Cerveza Budweiser 330ml x24',   categoria: Categoria.CERVEZA,     marca: 'AB InBev',        unidad: Unidad.CAJA,    precioCompra: 72000,  precioVenta: 110000, stockActual: 10, stockMinimo: 4  },
    { codigo: 'CER-007', nombre: 'Cerveza Stella Artois 330ml x24', categoria: Categoria.CERVEZA,   marca: 'AB InBev',        unidad: Unidad.CAJA,    precioCompra: 80000,  precioVenta: 125000, stockActual: 8,  stockMinimo: 4  },
    { codigo: 'CER-008', nombre: 'Cerveza Club Colombia Negra x24', categoria: Categoria.CERVEZA,   marca: 'Bavaria',         unidad: Unidad.CAJA,    precioCompra: 65000,  precioVenta: 100000, stockActual: 10, stockMinimo: 4  },

    // ─── ENERGIZANTES ───────────────────────────────────────────────────────
    { codigo: 'ENE-001', nombre: 'Red Bull 250ml',                categoria: Categoria.ENERGIZANTE, marca: 'Red Bull',        unidad: Unidad.LATA,    precioCompra: 5500,   precioVenta: 9000,   stockActual: 48, stockMinimo: 24 },
    { codigo: 'ENE-002', nombre: 'Red Bull 355ml',                categoria: Categoria.ENERGIZANTE, marca: 'Red Bull',        unidad: Unidad.LATA,    precioCompra: 7000,   precioVenta: 12000,  stockActual: 36, stockMinimo: 18 },
    { codigo: 'ENE-003', nombre: 'Monster Energy Verde 473ml',    categoria: Categoria.ENERGIZANTE, marca: 'Monster',         unidad: Unidad.LATA,    precioCompra: 6000,   precioVenta: 10000,  stockActual: 30, stockMinimo: 12 },
    { codigo: 'ENE-004', nombre: 'Monster Energy Ultra 473ml',    categoria: Categoria.ENERGIZANTE, marca: 'Monster',         unidad: Unidad.LATA,    precioCompra: 6500,   precioVenta: 11000,  stockActual: 24, stockMinimo: 12 },
    { codigo: 'ENE-005', nombre: 'Vive 100 250ml',                categoria: Categoria.ENERGIZANTE, marca: 'Vive 100',        unidad: Unidad.UNIDAD,  precioCompra: 2800,   precioVenta: 5000,   stockActual: 36, stockMinimo: 18 },

    // ─── GASEOSAS ───────────────────────────────────────────────────────────
    { codigo: 'GAS-001', nombre: 'Coca-Cola 250ml',               categoria: Categoria.GASEOSA,     marca: 'Coca-Cola',       unidad: Unidad.UNIDAD,  precioCompra: 2200,   precioVenta: 4000,   stockActual: 48, stockMinimo: 24 },
    { codigo: 'GAS-002', nombre: 'Coca-Cola 400ml',               categoria: Categoria.GASEOSA,     marca: 'Coca-Cola',       unidad: Unidad.UNIDAD,  precioCompra: 3000,   precioVenta: 5000,   stockActual: 36, stockMinimo: 18 },
    { codigo: 'GAS-003', nombre: 'Coca-Cola 2L',                  categoria: Categoria.GASEOSA,     marca: 'Coca-Cola',       unidad: Unidad.UNIDAD,  precioCompra: 4500,   precioVenta: 7500,   stockActual: 24, stockMinimo: 12 },
    { codigo: 'GAS-004', nombre: 'Sprite 400ml',                  categoria: Categoria.GASEOSA,     marca: 'Coca-Cola',       unidad: Unidad.UNIDAD,  precioCompra: 2800,   precioVenta: 5000,   stockActual: 30, stockMinimo: 18 },
    { codigo: 'GAS-005', nombre: 'Seven Up 400ml',                categoria: Categoria.GASEOSA,     marca: 'PepsiCo',         unidad: Unidad.UNIDAD,  precioCompra: 2800,   precioVenta: 5000,   stockActual: 24, stockMinimo: 12 },
    { codigo: 'GAS-006', nombre: 'Pepsi 400ml',                   categoria: Categoria.GASEOSA,     marca: 'PepsiCo',         unidad: Unidad.UNIDAD,  precioCompra: 2800,   precioVenta: 5000,   stockActual: 24, stockMinimo: 12 },
    { codigo: 'GAS-007', nombre: 'Ginger Ale Schweppes 250ml',    categoria: Categoria.GASEOSA,     marca: 'Schweppes',       unidad: Unidad.UNIDAD,  precioCompra: 3000,   precioVenta: 5500,   stockActual: 24, stockMinimo: 12 },
    { codigo: 'GAS-008', nombre: 'Tónica Schweppes 250ml',        categoria: Categoria.GASEOSA,     marca: 'Schweppes',       unidad: Unidad.UNIDAD,  precioCompra: 3000,   precioVenta: 5500,   stockActual: 24, stockMinimo: 12 },

    // ─── AGUA ───────────────────────────────────────────────────────────────
    { codigo: 'AGU-001', nombre: 'Agua Cristal 600ml',            categoria: Categoria.AGUA,        marca: 'Cristal',         unidad: Unidad.UNIDAD,  precioCompra: 1200,   precioVenta: 2500,   stockActual: 60, stockMinimo: 24 },
    { codigo: 'AGU-002', nombre: 'Agua Cristal 1.5L',             categoria: Categoria.AGUA,        marca: 'Cristal',         unidad: Unidad.UNIDAD,  precioCompra: 2000,   precioVenta: 4000,   stockActual: 36, stockMinimo: 18 },
    { codigo: 'AGU-003', nombre: 'Agua con Gas San Pellegrino 750ml', categoria: Categoria.AGUA,    marca: 'San Pellegrino',  unidad: Unidad.BOTELLA, precioCompra: 8000,   precioVenta: 14000,  stockActual: 24, stockMinimo: 12 },
    { codigo: 'AGU-004', nombre: 'Agua Manantial 600ml',          categoria: Categoria.AGUA,        marca: 'Manantial',       unidad: Unidad.UNIDAD,  precioCompra: 1000,   precioVenta: 2000,   stockActual: 48, stockMinimo: 24 },

    // ─── INSUMOS ────────────────────────────────────────────────────────────
    { codigo: 'INS-001', nombre: 'Limón x kg',                    categoria: Categoria.INSUMO,      marca: null,              unidad: Unidad.KILOGRAMO, precioCompra: 4000, precioVenta: 7000,   stockActual: 5,  stockMinimo: 2  },
    { codigo: 'INS-002', nombre: 'Menta fresca x manojo',         categoria: Categoria.INSUMO,      marca: null,              unidad: Unidad.UNIDAD,  precioCompra: 3000,   precioVenta: 5000,   stockActual: 6,  stockMinimo: 3  },
    { codigo: 'INS-003', nombre: 'Azúcar blanca x kg',            categoria: Categoria.INSUMO,      marca: null,              unidad: Unidad.KILOGRAMO, precioCompra: 4500, precioVenta: 7000,   stockActual: 4,  stockMinimo: 2  },
    { codigo: 'INS-004', nombre: 'Hielo x bolsa 5kg',             categoria: Categoria.INSUMO,      marca: null,              unidad: Unidad.PAQUETE, precioCompra: 4000,   precioVenta: 7000,   stockActual: 20, stockMinimo: 10 },
    { codigo: 'INS-005', nombre: 'Jugo de naranja 1L',            categoria: Categoria.INSUMO,      marca: 'Del Valle',       unidad: Unidad.LITRO,   precioCompra: 5500,   precioVenta: 9000,   stockActual: 10, stockMinimo: 4  },
    { codigo: 'INS-006', nombre: 'Jugo de piña 1L',               categoria: Categoria.INSUMO,      marca: 'Del Valle',       unidad: Unidad.LITRO,   precioCompra: 5500,   precioVenta: 9000,   stockActual: 8,  stockMinimo: 4  },
    { codigo: 'INS-007', nombre: 'Granadina 750ml',               categoria: Categoria.INSUMO,      marca: 'Monin',           unidad: Unidad.BOTELLA, precioCompra: 18000,  precioVenta: 30000,  stockActual: 4,  stockMinimo: 2  },
    { codigo: 'INS-008', nombre: 'Jarabe de Simple 750ml',        categoria: Categoria.INSUMO,      marca: 'Monin',           unidad: Unidad.BOTELLA, precioCompra: 16000,  precioVenta: 26000,  stockActual: 4,  stockMinimo: 2  },
    { codigo: 'INS-009', nombre: 'Sal para margarita x kg',       categoria: Categoria.INSUMO,      marca: null,              unidad: Unidad.KILOGRAMO, precioCompra: 2000, precioVenta: 4000,   stockActual: 2,  stockMinimo: 1  },
    { codigo: 'INS-010', nombre: 'Vasos desechables x100',        categoria: Categoria.INSUMO,      marca: null,              unidad: Unidad.PAQUETE, precioCompra: 8000,   precioVenta: 13000,  stockActual: 5,  stockMinimo: 2  },
    { codigo: 'INS-011', nombre: 'Pitillos x200',                 categoria: Categoria.INSUMO,      marca: null,              unidad: Unidad.PAQUETE, precioCompra: 5000,   precioVenta: 8000,   stockActual: 6,  stockMinimo: 2  },
    { codigo: 'INS-012', nombre: 'Servilletas x100',              categoria: Categoria.INSUMO,      marca: null,              unidad: Unidad.PAQUETE, precioCompra: 3500,   precioVenta: 6000,   stockActual: 10, stockMinimo: 4  },

    // ─── OTROS ──────────────────────────────────────────────────────────────
    { codigo: 'OTR-001', nombre: 'Cigarrillos Marlboro x20',      categoria: Categoria.OTRO,        marca: 'Marlboro',        unidad: Unidad.PAQUETE, precioCompra: 13000,  precioVenta: 18000,  stockActual: 20, stockMinimo: 10 },
    { codigo: 'OTR-002', nombre: 'Cigarrillos Lucky Strike x20',  categoria: Categoria.OTRO,        marca: 'Lucky Strike',    unidad: Unidad.PAQUETE, precioCompra: 12000,  precioVenta: 17000,  stockActual: 15, stockMinimo: 8  },
    { codigo: 'OTR-003', nombre: 'Snacks papas fritas x30g',      categoria: Categoria.OTRO,        marca: 'Margarita',       unidad: Unidad.UNIDAD,  precioCompra: 1500,   precioVenta: 3000,   stockActual: 30, stockMinimo: 15 },
    { codigo: 'OTR-004', nombre: 'Chicles Trident x12',           categoria: Categoria.OTRO,        marca: 'Trident',         unidad: Unidad.UNIDAD,  precioCompra: 1800,   precioVenta: 3000,   stockActual: 20, stockMinimo: 10 },
  ];

  let creados = 0;
  for (const p of productos) {
    await prisma.producto.create({
      data: { ...p, negocioId },
    });
    creados++;
  }

  console.log(`\n✅  ${creados} productos agregados al inventario de "${negocio.nombre}"`);
  console.log('\nResumen por categoría:');
  const resumen = productos.reduce((acc, p) => {
    acc[p.categoria] = (acc[p.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(resumen).forEach(([cat, qty]) => console.log(`  ${cat.padEnd(15)} → ${qty} productos`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
