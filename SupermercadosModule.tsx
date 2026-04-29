import React from 'react';

// ══════════════════════════════════════════════════════════════════
// DATOS — Ciudades
// ══════════════════════════════════════════════════════════════════
const CITIES = [
  { id:'c1', name:'Malabo',     provincia:'Bioko Norte',   estado:true },
  { id:'c2', name:'Bata',       provincia:'Litoral',       estado:true },
  { id:'c3', name:'Mongomo',    provincia:'Wele-Nzas',     estado:true },
  { id:'c4', name:'Añisoc',     provincia:'Wele-Nzas',     estado:true },
  { id:'c5', name:'Evinayong',  provincia:'Centro Sur',    estado:true },
];

// ══════════════════════════════════════════════════════════════════
// DATOS — Supermercados
// ══════════════════════════════════════════════════════════════════
const SUPERMARKETS = [
  { id:'sm1', nombre:'Martínez Hermanos', ciudad_id:'c1', logo:'MH', color:'#C0392B', color2:'#E74C3C',
    descripcion:'Supermercado familiar con amplia variedad de productos nacionales e importados.',
    direccion:'Av. de la Independencia, Malabo', telefono:'+240 222 20 01 01',
    horario:'L-S 8:00-21:00 / D 9:00-15:00', cobertura:'Malabo Centro',
    delivery:true, recogida:true, minOrder:5000, deliveryFee:500, estado:true },
  { id:'sm2', nombre:'EGTC Malabo',       ciudad_id:'c1', logo:'EG', color:'#1B3A6B', color2:'#2A5298',
    descripcion:'Cadena nacional con productos de calidad y precios competitivos.',
    direccion:'Barrio Caracolas, Malabo',        telefono:'+240 222 20 01 02',
    horario:'L-D 7:30-22:00', cobertura:'Malabo',
    delivery:true, recogida:true, minOrder:8000, deliveryFee:0, estado:true },
  { id:'sm3', nombre:'Guinaco',           ciudad_id:'c1', logo:'GN', color:'#065F46', color2:'#00c8a0',
    descripcion:'Productos locales y de importación. Especialidad en frescos.',
    direccion:'Ela Nguema, Malabo',              telefono:'+240 222 20 01 03',
    horario:'L-S 8:00-20:00', cobertura:'Ela Nguema  -  Malabo II',
    delivery:true, recogida:true, minOrder:4000, deliveryFee:500, estado:true },
  { id:'sm4', nombre:'Pegasos Express',   ciudad_id:'c1', logo:'PE', color:'#92400E', color2:'#F59E0B',
    descripcion:'Tienda express con los productos esenciales del día a día.',
    direccion:'Malabo II, Malabo',               telefono:'+240 222 20 01 04',
    horario:'L-D 7:00-23:00', cobertura:'Malabo II  -  Aeropuerto',
    delivery:false, recogida:true, minOrder:0, deliveryFee:0, estado:true },
  { id:'sm5', nombre:'Caba Market',       ciudad_id:'c1', logo:'CM', color:'#4C1D95', color2:'#6B5BD6',
    descripcion:'Supermercado moderno con sección de electrónica y hogar.',
    direccion:'Puerto, Malabo',                  telefono:'+240 222 20 01 05',
    horario:'L-S 9:00-21:00', cobertura:'Puerto  -  Centro',
    delivery:true, recogida:true, minOrder:6000, deliveryFee:300, estado:true },
  { id:'sm6', nombre:'Getco',             ciudad_id:'c2', logo:'GT', color:'#0A4A8A', color2:'#00b4e6',
    descripcion:'Principal supermercado de Bata con amplio surtido.',
    direccion:'Centro de Bata',                  telefono:'+240 222 20 02 01',
    horario:'L-D 7:30-22:00', cobertura:'Bata Centro',
    delivery:true, recogida:true, minOrder:6000, deliveryFee:500, estado:true },
  { id:'sm7', nombre:'Comercial Santy',   ciudad_id:'c2', logo:'CS', color:'#831843', color2:'#EC4899',
    descripcion:'Tienda familiar con productos frescos y de importación.',
    direccion:'Paseo Marítimo, Bata',            telefono:'+240 222 20 02 02',
    horario:'L-S 8:00-21:00', cobertura:'Litoral  -  Bata',
    delivery:true, recogida:true, minOrder:5000, deliveryFee:300, estado:true },
  { id:'sm8', nombre:'EGTC Bata',         ciudad_id:'c2', logo:'EG', color:'#1B3A6B', color2:'#2A5298',
    descripcion:'Sucursal EGTC en Bata con todos los productos de la cadena.',
    direccion:'Nkolombong, Bata',                telefono:'+240 222 20 02 03',
    horario:'L-D 8:00-21:00', cobertura:'Bata',
    delivery:true, recogida:true, minOrder:7000, deliveryFee:500, estado:true },
  { id:'sm9', nombre:'EGTC Mongomo',      ciudad_id:'c3', logo:'EG', color:'#1B3A6B', color2:'#2A5298',
    descripcion:'Sucursal EGTC en Mongomo.',
    direccion:'Centro Mongomo',                  telefono:'+240 222 20 03 01',
    horario:'L-S 8:00-20:00', cobertura:'Mongomo',
    delivery:false, recogida:true, minOrder:0, deliveryFee:0, estado:true },
  { id:'sm10',nombre:'EGTC Añisoc',       ciudad_id:'c4', logo:'EG', color:'#1B3A6B', color2:'#2A5298',
    descripcion:'Sucursal EGTC en Añisoc.',
    direccion:'Centro Añisoc',                   telefono:'+240 222 20 04 01',
    horario:'L-S 8:00-20:00', cobertura:'Añisoc',
    delivery:false, recogida:true, minOrder:0, deliveryFee:0, estado:true },
  { id:'sm11',nombre:'Supermercado Evinayong Plaza', ciudad_id:'c5', logo:'EP', color:'#065F46', color2:'#00c8a0',
    descripcion:'Supermercado principal de Evinayong con productos variados.',
    direccion:'Plaza Central, Evinayong',        telefono:'+240 222 20 05 01',
    horario:'L-S 8:00-20:00', cobertura:'Evinayong',
    delivery:false, recogida:true, minOrder:0, deliveryFee:0, estado:true },
];

// ══════════════════════════════════════════════════════════════════
// DATOS — Categorías
// ══════════════════════════════════════════════════════════════════
const CATEGORIES = [
  { id:'cat01', nombre:'Agua',                  icono:'💧', color:'#00b4e6' },
  { id:'cat02', nombre:'Refrescos',             icono:'🥤', color:'#E74C3C' },
  { id:'cat03', nombre:'Zumos',                 icono:'🍊', color:'#F59E0B' },
  { id:'cat04', nombre:'Leche y Lácteos',       icono:'🥛', color:'#6B5BD6' },
  { id:'cat05', nombre:'Arroz y Pasta',         icono:'🌾', color:'#92400E' },
  { id:'cat06', nombre:'Conservas',             icono:'🥫', color:'#C0392B' },
  { id:'cat07', nombre:'Aceites y Condimentos', icono:'🫙', color:'#D97706' },
  { id:'cat08', nombre:'Snacks',                icono:'🍿', color:'#EC4899' },
  { id:'cat09', nombre:'Galletas',              icono:'🍪', color:'#92400E' },
  { id:'cat10', nombre:'Chocolates',            icono:'🍫', color:'#78350F' },
  { id:'cat11', nombre:'Limpieza',              icono:'🧹', color:'#0A4A8A' },
  { id:'cat12', nombre:'Higiene Personal',      icono:'🧴', color:'#065F46' },
  { id:'cat13', nombre:'Congelados',            icono:'🧊', color:'#00b4e6' },
  { id:'cat14', nombre:'Frutas y Verduras',     icono:'🥦', color:'#16A34A' },
  { id:'cat15', nombre:'Carnes',                icono:'🥩', color:'#DC2626' },
  { id:'cat16', nombre:'Panadería',             icono:'🍞', color:'#D97706' },
  { id:'cat17', nombre:'Bebidas Energéticas',   icono:'⚡', color:'#F59E0B' },
  { id:'cat18', nombre:'Cervezas',              icono:'🍺', color:'#92400E' },
  { id:'cat19', nombre:'Licores',               icono:'🥃', color:'#4C1D95' },
];

// ══════════════════════════════════════════════════════════════════
// DATOS — Productos (muestra representativa por categoría)
// ══════════════════════════════════════════════════════════════════
type Prod = { id:string; sm_ids:string[]; cat_id:string; nombre:string; marca:string; desc:string; precio:number; unidad:string; img:string; stock:number; destacado:boolean };

const PRODUCTS: Prod[] = [
  // Agua
  { id:'p001', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7','sm8'], cat_id:'cat01', nombre:'Agua Mineral 1.5L',    marca:'Aquarel',      desc:'Agua mineral natural sin gas',                precio:500,   unidad:'botella', img:'💧', stock:200, destacado:true  },
  { id:'p002', sm_ids:['sm1','sm2','sm6'],                               cat_id:'cat01', nombre:'Agua con Gas 1L',      marca:'Perrier',      desc:'Agua mineral con gas natural',                precio:900,   unidad:'botella', img:'💧', stock:80,  destacado:false },
  { id:'p003', sm_ids:['sm1','sm2','sm3','sm6','sm7'],                   cat_id:'cat01', nombre:'Agua 5L Garrafa',      marca:'Aquarel',      desc:'Garrafa de agua mineral 5 litros',            precio:1800,  unidad:'garrafa', img:'🪣', stock:60,  destacado:false },
  // Refrescos
  { id:'p004', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7','sm8'], cat_id:'cat02', nombre:'Coca-Cola 1.5L',       marca:'Coca-Cola',    desc:'Refresco de cola clásico',                    precio:1200,  unidad:'botella', img:'🥤', stock:150, destacado:true  },
  { id:'p005', sm_ids:['sm1','sm2','sm6','sm7'],                         cat_id:'cat02', nombre:'Fanta Naranja 1.5L',   marca:'Fanta',        desc:'Refresco de naranja',                         precio:1100,  unidad:'botella', img:'🍊', stock:120, destacado:false },
  { id:'p006', sm_ids:['sm1','sm2','sm3','sm6'],                         cat_id:'cat02', nombre:'Sprite 1.5L',          marca:'Sprite',       desc:'Refresco de lima-limón',                      precio:1100,  unidad:'botella', img:'🥤', stock:100, destacado:false },
  { id:'p007', sm_ids:['sm1','sm2','sm5','sm6','sm7'],                   cat_id:'cat02', nombre:'Malabo Beer 33cl',     marca:'Malabo Beer',  desc:'Cerveza local de Guinea Ecuatorial',          precio:800,   unidad:'lata',    img:'🍺', stock:200, destacado:true  },
  // Zumos
  { id:'p008', sm_ids:['sm1','sm2','sm3','sm6','sm7'],                   cat_id:'cat03', nombre:'Zumo Naranja 1L',      marca:'Don Simón',    desc:'Zumo de naranja sin pulpa',                   precio:1500,  unidad:'brick',   img:'🍊', stock:90,  destacado:false },
  { id:'p009', sm_ids:['sm1','sm2','sm6'],                               cat_id:'cat03', nombre:'Zumo Tropical 1L',     marca:'Tropicana',    desc:'Mezcla de frutas tropicales',                 precio:1800,  unidad:'brick',   img:'🥭', stock:60,  destacado:false },
  // Lácteos
  { id:'p010', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7','sm8'], cat_id:'cat04', nombre:'Leche Entera 1L',      marca:'Puleva',       desc:'Leche entera UHT',                            precio:1100,  unidad:'brick',   img:'🥛', stock:180, destacado:true  },
  { id:'p011', sm_ids:['sm1','sm2','sm6','sm7'],                         cat_id:'cat04', nombre:'Yogur Natural x4',     marca:'Danone',       desc:'Yogur natural sin azúcar, pack 4',            precio:2200,  unidad:'pack',    img:'🥛', stock:70,  destacado:false },
  { id:'p012', sm_ids:['sm1','sm2','sm5','sm6'],                         cat_id:'cat04', nombre:'Queso Gouda 200g',     marca:'Edam',         desc:'Queso Gouda en lonchas',                      precio:3500,  unidad:'pieza',   img:'🧀', stock:40,  destacado:false },
  { id:'p013', sm_ids:['sm1','sm2','sm3','sm6','sm7'],                   cat_id:'cat04', nombre:'Mantequilla 250g',     marca:'Président',    desc:'Mantequilla sin sal',                         precio:2200,  unidad:'paquete', img:'🧈', stock:55,  destacado:false },
  // Arroz y Pasta
  { id:'p014', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7','sm8','sm9','sm10','sm11'], cat_id:'cat05', nombre:'Arroz Largo 5kg', marca:'Brillante', desc:'Arroz largo de grano fino', precio:4500, unidad:'saco', img:'🌾', stock:300, destacado:true },
  { id:'p015', sm_ids:['sm1','sm2','sm3','sm6','sm7'],                   cat_id:'cat05', nombre:'Espagueti 500g',       marca:'Barilla',      desc:'Pasta espagueti de sémola',                   precio:800,   unidad:'paquete', img:'🍝', stock:150, destacado:false },
  { id:'p016', sm_ids:['sm1','sm2','sm6'],                               cat_id:'cat05', nombre:'Macarrones 500g',      marca:'Gallo',        desc:'Macarrones de sémola de trigo',               precio:750,   unidad:'paquete', img:'🍝', stock:120, destacado:false },
  // Conservas
  { id:'p017', sm_ids:['sm1','sm2','sm3','sm4','sm6','sm7'],             cat_id:'cat06', nombre:'Atún en Aceite 160g',  marca:'Calvo',        desc:'Atún claro en aceite de oliva',               precio:1500,  unidad:'lata',    img:'🐟', stock:200, destacado:true  },
  { id:'p018', sm_ids:['sm1','sm2','sm6','sm7'],                         cat_id:'cat06', nombre:'Sardinas en Tomate',   marca:'Cabo de Peñas',desc:'Sardinas en salsa de tomate',                 precio:900,   unidad:'lata',    img:'🐟', stock:180, destacado:false },
  { id:'p019', sm_ids:['sm1','sm2','sm3','sm6'],                         cat_id:'cat06', nombre:'Tomate Frito 400g',    marca:'Orlando',      desc:'Tomate frito natural',                        precio:1200,  unidad:'lata',    img:'🍅', stock:160, destacado:false },
  // Aceites y Condimentos
  { id:'p020', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7','sm8','sm9','sm10','sm11'], cat_id:'cat07', nombre:'Aceite de Palma 1L', marca:'Local GQ', desc:'Aceite de palma rojo natural', precio:1800, unidad:'botella', img:'🫙', stock:250, destacado:true },
  { id:'p021', sm_ids:['sm1','sm2','sm6','sm7'],                         cat_id:'cat07', nombre:'Aceite Girasol 1L',    marca:'Koipesol',     desc:'Aceite de girasol refinado',                  precio:2200,  unidad:'botella', img:'🫙', stock:100, destacado:false },
  { id:'p022', sm_ids:['sm1','sm2','sm3','sm6'],                         cat_id:'cat07', nombre:'Sal Yodada 500g',      marca:'Salinera GQ',  desc:'Sal yodada para consumo humano',              precio:300,   unidad:'bolsa',   img:'🧂', stock:300, destacado:false },
  { id:'p023', sm_ids:['sm1','sm2','sm6','sm7'],                         cat_id:'cat07', nombre:'Azúcar Blanco 1kg',    marca:'Azucarera',    desc:'Azúcar blanco refinado',                      precio:700,   unidad:'bolsa',   img:'🍬', stock:280, destacado:false },
  // Snacks
  { id:'p024', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7'],       cat_id:'cat08', nombre:'Patatas Fritas 150g',  marca:'Lay\'s',       desc:'Patatas fritas sabor original',               precio:1200,  unidad:'bolsa',   img:'🍿', stock:120, destacado:false },
  { id:'p025', sm_ids:['sm1','sm2','sm6'],                               cat_id:'cat08', nombre:'Palomitas Microondas', marca:'Act II',       desc:'Palomitas para microondas, sabor mantequilla',precio:1500,  unidad:'pack',    img:'🍿', stock:80,  destacado:false },
  // Galletas
  { id:'p026', sm_ids:['sm1','sm2','sm3','sm4','sm6','sm7'],             cat_id:'cat09', nombre:'Galletas María 200g',  marca:'Fontaneda',    desc:'Galletas María clásicas',                     precio:800,   unidad:'paquete', img:'🍪', stock:200, destacado:false },
  { id:'p027', sm_ids:['sm1','sm2','sm6'],                               cat_id:'cat09', nombre:'Oreo 154g',            marca:'Oreo',         desc:'Galletas de chocolate con crema',             precio:1400,  unidad:'paquete', img:'🍪', stock:90,  destacado:false },
  // Chocolates
  { id:'p028', sm_ids:['sm1','sm2','sm5','sm6','sm7'],                   cat_id:'cat10', nombre:'Chocolate con Leche',  marca:'Milka',        desc:'Tableta de chocolate con leche 100g',         precio:2200,  unidad:'tableta', img:'🍫', stock:70,  destacado:false },
  // Limpieza
  { id:'p029', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7','sm8'], cat_id:'cat11', nombre:'Detergente Polvo 1kg', marca:'Ariel',        desc:'Detergente en polvo para ropa',               precio:2200,  unidad:'caja',    img:'🧺', stock:150, destacado:true  },
  { id:'p030', sm_ids:['sm1','sm2','sm3','sm6','sm7'],                   cat_id:'cat11', nombre:'Lejía 1L',             marca:'Estrella',     desc:'Lejía desinfectante multiusos',               precio:800,   unidad:'botella', img:'🧴', stock:180, destacado:false },
  { id:'p031', sm_ids:['sm1','sm2','sm6','sm7'],                         cat_id:'cat11', nombre:'Lavavajillas 500ml',   marca:'Fairy',        desc:'Lavavajillas concentrado',                    precio:1200,  unidad:'botella', img:'🍽️', stock:130, destacado:false },
  { id:'p032', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7','sm8'], cat_id:'cat11', nombre:'Papel Higiénico x4',   marca:'Scottex',      desc:'Papel higiénico suave, 4 rollos',             precio:1800,  unidad:'pack',    img:'🧻', stock:200, destacado:false },
  // Higiene
  { id:'p033', sm_ids:['sm1','sm2','sm3','sm4','sm6','sm7'],             cat_id:'cat12', nombre:'Jabón de Baño x3',     marca:'Palmolive',    desc:'Jabón hidratante, pack 3 unidades',           precio:1500,  unidad:'pack',    img:'🧼', stock:160, destacado:false },
  { id:'p034', sm_ids:['sm1','sm2','sm6','sm7'],                         cat_id:'cat12', nombre:'Champú 400ml',         marca:'H&S',          desc:'Champú anticaspa',                            precio:2800,  unidad:'botella', img:'🧴', stock:90,  destacado:false },
  { id:'p035', sm_ids:['sm1','sm2','sm3','sm6'],                         cat_id:'cat12', nombre:'Pasta Dental 75ml',    marca:'Colgate',      desc:'Pasta dental con flúor',                      precio:1200,  unidad:'tubo',    img:'🦷', stock:140, destacado:false },
  { id:'p036', sm_ids:['sm1','sm2','sm5','sm6','sm7'],                   cat_id:'cat12', nombre:'Pañales Talla 3 x30',  marca:'Dodot',        desc:'Pañales bebé talla 3 (4-9kg)',                precio:8500,  unidad:'paquete', img:'👶', stock:50,  destacado:false },
  // Congelados
  { id:'p037', sm_ids:['sm1','sm2','sm5','sm6','sm7'],                   cat_id:'cat13', nombre:'Pollo Congelado 1kg',  marca:'Granja Local', desc:'Pollo troceado congelado',                    precio:4500,  unidad:'kg',      img:'🍗', stock:80,  destacado:true  },
  { id:'p038', sm_ids:['sm1','sm2','sm6'],                               cat_id:'cat13', nombre:'Gambas Congeladas 500g',marca:'Pesca GQ',    desc:'Gambas peladas congeladas',                   precio:6500,  unidad:'bolsa',   img:'🦐', stock:40,  destacado:false },
  // Frutas y Verduras
  { id:'p039', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7','sm8','sm9','sm10','sm11'], cat_id:'cat14', nombre:'Plátano Macho x5', marca:'Local GQ', desc:'Plátano macho para freír', precio:1500, unidad:'racimo', img:'🍌', stock:200, destacado:true },
  { id:'p040', sm_ids:['sm1','sm2','sm3','sm6','sm7'],                   cat_id:'cat14', nombre:'Tomate 1kg',           marca:'Local GQ',     desc:'Tomates frescos locales',                     precio:1200,  unidad:'kg',      img:'🍅', stock:180, destacado:false },
  { id:'p041', sm_ids:['sm1','sm2','sm3','sm6','sm7'],                   cat_id:'cat14', nombre:'Aguacate x3',          marca:'Local GQ',     desc:'Aguacates maduros locales',                   precio:1800,  unidad:'bolsa',   img:'🥑', stock:120, destacado:false },
  { id:'p042', sm_ids:['sm1','sm2','sm6'],                               cat_id:'cat14', nombre:'Mango x4',             marca:'Local GQ',     desc:'Mangos dulces de temporada',                  precio:2000,  unidad:'bolsa',   img:'🥭', stock:100, destacado:false },
  // Carnes
  { id:'p043', sm_ids:['sm1','sm2','sm3','sm6','sm7'],                   cat_id:'cat15', nombre:'Carne de Res 1kg',     marca:'Local GQ',     desc:'Carne de res fresca, corte variado',          precio:8000,  unidad:'kg',      img:'🥩', stock:60,  destacado:true  },
  { id:'p044', sm_ids:['sm1','sm2','sm3','sm4','sm6','sm7'],             cat_id:'cat15', nombre:'Pollo Entero ~1.5kg',  marca:'Granja Local', desc:'Pollo fresco de granja local',                precio:5500,  unidad:'pieza',   img:'🍗', stock:80,  destacado:false },
  { id:'p045', sm_ids:['sm1','sm2','sm6','sm7'],                         cat_id:'cat15', nombre:'Salchichas x6',        marca:'Campofrío',    desc:'Salchichas de cerdo',                         precio:2800,  unidad:'paquete', img:'🌭', stock:90,  destacado:false },
  // Panadería
  { id:'p046', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7','sm8'], cat_id:'cat16', nombre:'Pan de Molde',         marca:'Bimbo',        desc:'Pan de molde blanco 500g',                    precio:1500,  unidad:'bolsa',   img:'🍞', stock:120, destacado:false },
  { id:'p047', sm_ids:['sm1','sm2','sm6'],                               cat_id:'cat16', nombre:'Croissant x4',         marca:'Panrico',      desc:'Croissants de mantequilla',                   precio:2000,  unidad:'pack',    img:'🥐', stock:60,  destacado:false },
  // Bebidas Energéticas
  { id:'p048', sm_ids:['sm1','sm2','sm4','sm5','sm6','sm7'],             cat_id:'cat17', nombre:'Red Bull 250ml',       marca:'Red Bull',     desc:'Bebida energética clásica',                   precio:2500,  unidad:'lata',    img:'⚡', stock:100, destacado:false },
  // Cervezas
  { id:'p049', sm_ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7','sm8'], cat_id:'cat18', nombre:'Malabo Beer 33cl',     marca:'Malabo Beer',  desc:'Cerveza local de Guinea Ecuatorial',          precio:800,   unidad:'lata',    img:'🍺', stock:300, destacado:true  },
  { id:'p050', sm_ids:['sm1','sm2','sm5','sm6','sm7'],                   cat_id:'cat18', nombre:'Heineken 33cl',        marca:'Heineken',     desc:'Cerveza rubia importada',                     precio:1200,  unidad:'lata',    img:'🍺', stock:150, destacado:false },
  // Licores
  { id:'p051', sm_ids:['sm1','sm2','sm5','sm6'],                         cat_id:'cat19', nombre:'Whisky J&B 70cl',      marca:'J&B',          desc:'Whisky escocés blended',                      precio:18000, unidad:'botella', img:'🥃', stock:30,  destacado:false },
  { id:'p052', sm_ids:['sm1','sm2','sm6'],                               cat_id:'cat19', nombre:'Ron Barceló 70cl',     marca:'Barceló',      desc:'Ron añejo dominicano',                        precio:15000, unidad:'botella', img:'🥃', stock:25,  destacado:false },
];

// ══════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════
type CartItem = { id:string; nombre:string; img:string; precio:number; qty:number; marca:string };
type Order = { id:string; sm_id:string; sm_nombre:string; items:CartItem[]; total:number; metodo_entrega:'delivery'|'recogida'; direccion:string; metodo_pago:string; estado:string; fecha:string; ref:string };
type SScreen = 'home'|'cities'|'stores'|'categories'|'products'|'detail'|'cart'|'checkout'|'orders'|'history'|'support';

// ══════════════════════════════════════════════════════════════════
// LOGO COMPONENT
// ══════════════════════════════════════════════════════════════════
const SmLogo: React.FC<{sm:typeof SUPERMARKETS[0]; size?:number}> = ({sm, size=44}) => (
  <div style={{width:size,height:size,borderRadius:size*0.25,background:`linear-gradient(135deg,${sm.color},${sm.color2})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:size*0.32,fontWeight:'900',flexShrink:0,letterSpacing:'-0.5px'}}>
    {sm.logo}
  </div>
);

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export const SupermercadosModal: React.FC<{onClose:()=>void; userBalance:number; onDebit:(n:number)=>void}> = ({onClose, userBalance, onDebit}) => {
  const [screen, setScreen] = React.useState<SScreen>('home');
  const [cityId, setCityId] = React.useState<string|null>(null);
  const [smId, setSmId] = React.useState<string|null>(null);
  const [catId, setCatId] = React.useState<string|null>(null);
  const [prodId, setProdId] = React.useState<string|null>(null);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [search, setSearch] = React.useState('');
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [metodoEntrega, setMetodoEntrega] = React.useState<'delivery'|'recogida'>('delivery');
  const [metodoPago, setMetodoPago] = React.useState('');
  const [direccion, setDireccion] = React.useState({nombre:'',telefono:'',direccion:'',barrio:'',notas:''});
  const [supportMsg, setSupportMsg] = React.useState('');
  const [supportType, setSupportType] = React.useState('');
  const [supportOk, setSupportOk] = React.useState(false);

  const sm = SUPERMARKETS.find(s=>s.id===smId)||null;
  const cat = CATEGORIES.find(c=>c.id===catId)||null;
  const prod = PRODUCTS.find(p=>p.id===prodId)||null;
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const cartTotal = cart.reduce((s,i)=>s+i.precio*i.qty,0);
  const deliveryFee = metodoEntrega==='delivery'?(sm?.deliveryFee||0):0;
  const grandTotal = cartTotal+deliveryFee;

  const smProds = smId ? PRODUCTS.filter(p=>p.sm_ids.includes(smId)) : [];
  const catProds = smId && catId ? smProds.filter(p=>p.cat_id===catId) : [];
  const smCats = smId ? CATEGORIES.filter(c=>smProds.some(p=>p.cat_id===c.id)) : [];

  const addToCart = (p:Prod) => setCart(prev=>{
    const ex=prev.find(i=>i.id===p.id);
    return ex?prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...prev,{id:p.id,nombre:p.nombre,img:p.img,precio:p.precio,qty:1,marca:p.marca}];
  });
  const removeFromCart = (id:string) => setCart(prev=>prev.map(i=>i.id===id?{...i,qty:i.qty-1}:i).filter(i=>i.qty>0));
  const setDir = (k:string,v:string) => setDireccion(p=>({...p,[k]:v}));

  const confirmOrder = () => {
    if(!metodoPago) return;
    const ref='EGC-'+Date.now().toString().slice(-8);
    const newOrder:Order = {
      id:Date.now().toString(), sm_id:smId||'', sm_nombre:sm?.nombre||'',
      items:[...cart], total:grandTotal, metodo_entrega:metodoEntrega,
      direccion:metodoEntrega==='delivery'?`${direccion.direccion}, ${direccion.barrio}`:'Recogida en tienda',
      metodo_pago:metodoPago, estado:'confirmado', fecha:new Date().toLocaleDateString('es-ES'), ref
    };
    onDebit(grandTotal);
    setOrders(prev=>[newOrder,...prev]);
    setCart([]);
    setScreen('orders');
  };

  const goBack = () => {
    if(screen==='cities') setScreen('home');
    else if(screen==='stores') setScreen('cities');
    else if(screen==='categories') setScreen('stores');
    else if(screen==='products') setScreen('categories');
    else if(screen==='detail') setScreen('products');
    else if(screen==='cart') setScreen(catId?'products':'categories');
    else if(screen==='checkout') setScreen('cart');
    else if(screen==='orders'||screen==='history'||screen==='support') setScreen('home');
    else onClose();
  };

  const headerTitle: Record<SScreen,string> = {
    home:'Supermercados', cities:'Ciudades', stores:cityId?CITIES.find(c=>c.id===cityId)?.name||'Tiendas':'Tiendas',
    categories:sm?.nombre||'Categorías', products:cat?.nombre||'Productos',
    detail:prod?.nombre||'Producto', cart:'Mi Carrito', checkout:'Finalizar Pedido',
    orders:'Mis Pedidos', history:'Historial', support:'Soporte'
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:3000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'rgba(247,248,250,0.55)',backdropFilter:'blur(28px) saturate(180%)',WebkitBackdropFilter:'blur(28px) saturate(180%)',borderRadius:'20px 20px 0 0',border:'1.5px solid rgba(255,255,255,0.6)',borderBottom:'none',width:'100%',maxWidth:'420px',maxHeight:'94vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',paddingTop:'10px',paddingBottom:'4px',flexShrink:0}}>
          <div style={{width:'36px',height:'4px',borderRadius:'2px',background:'#D1D5DB'}}/>
        </div>

        {/* Header */}
        <div style={{padding:'4px 16px 10px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0,background:'#fff',borderBottom:'1px solid #F0F2F5'}}>
          <button onClick={goBack} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'16px'}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:'16px',fontWeight:'700',color:'#111827'}}>{headerTitle[screen]}</div>
            {screen==='home'&&<div style={{fontSize:'11px',color:'#9CA3AF'}}>{SUPERMARKETS.length} tiendas  -  {CITIES.length} ciudades  -  GQ</div>}
            {screen==='stores'&&<div style={{fontSize:'11px',color:'#9CA3AF'}}>{SUPERMARKETS.filter(s=>s.ciudad_id===cityId).length} supermercados</div>}
            {screen==='categories'&&<div style={{fontSize:'11px',color:'#9CA3AF'}}>{smCats.length} categorías  -  {smProds.length} productos</div>}
            {screen==='products'&&<div style={{fontSize:'11px',color:'#9CA3AF'}}>{catProds.length} productos</div>}
          </div>
          {cartCount>0&&screen!=='cart'&&screen!=='checkout'&&(
            <button onClick={()=>setScreen('cart')} style={{background:'#00c8a0',border:'none',borderRadius:'20px',padding:'6px 12px',color:'#fff',fontSize:'11px',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px'}}>
              🛒 {cartCount}
            </button>
          )}
          <button onClick={onClose} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'30px',height:'30px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'14px'}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'12px 16px 24px'}}>

          {/* ── HOME ── */}
          {screen==='home'&&(
            <div>
              {/* Banner */}
              <div style={{background:'linear-gradient(135deg,#065F46,#00c8a0)',borderRadius:'16px',padding:'18px 16px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'14px'}}>
                <div style={{fontSize:'40px'}}>🛒</div>
                <div>
                  <div style={{fontSize:'16px',fontWeight:'800',color:'#fff'}}>Compra Online</div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>Supermercados nacionales  -  Entrega a domicilio</div>
                </div>
              </div>
              {/* Búsqueda global */}
              <div style={{background:'#fff',borderRadius:'12px',padding:'0 14px',height:'46px',display:'flex',alignItems:'center',gap:'10px',border:'1px solid #F0F2F5',marginBottom:'16px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} placeholder="Buscar producto en todos los supermercados..." style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
                {globalSearch&&<button onClick={()=>setGlobalSearch('')} style={{background:'none',border:'none',color:'#9CA3AF',cursor:'pointer',fontSize:'14px'}}>✕</button>}
              </div>
              {/* Resultados búsqueda global */}
              {globalSearch.length>=2&&(
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'11px',fontWeight:'700',color:'#6B7280',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Resultados  -  {PRODUCTS.filter(p=>p.nombre.toLowerCase().includes(globalSearch.toLowerCase())||p.marca.toLowerCase().includes(globalSearch.toLowerCase())).length} productos</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'7px'}}>
                    {PRODUCTS.filter(p=>p.nombre.toLowerCase().includes(globalSearch.toLowerCase())||p.marca.toLowerCase().includes(globalSearch.toLowerCase())).slice(0,12).map(p=>{
                      const inCart=cart.find(i=>i.id===p.id);
                      return (
                        <div key={p.id} style={{background:'#fff',borderRadius:'11px',padding:'10px 8px',border:`1.5px solid ${inCart?'#00c8a0':'#F0F2F5'}`,textAlign:'center'}}>
                          <div style={{fontSize:'24px',marginBottom:'4px'}}>{p.img}</div>
                          <div style={{fontSize:'10px',fontWeight:'700',color:'#111827',marginBottom:'2px',lineHeight:'1.2'}}>{p.nombre}</div>
                          <div style={{fontSize:'8px',color:'#9CA3AF',marginBottom:'4px'}}>{p.marca}</div>
                          <div style={{fontSize:'11px',fontWeight:'800',color:'#00c8a0',marginBottom:'6px'}}>{p.precio.toLocaleString()} XAF</div>
                          {!inCart
                            ? <button onClick={()=>addToCart(p)} style={{width:'100%',background:'linear-gradient(135deg,#00c8a0,#00b4e6)',border:'none',borderRadius:'7px',padding:'5px 0',color:'#fff',fontSize:'10px',fontWeight:'700',cursor:'pointer'}}>+ Añadir</button>
                            : <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#F0FDF9',borderRadius:'7px',padding:'3px 6px'}}>
                                <button onClick={()=>removeFromCart(p.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'700',color:'#00c8a0',padding:'0 2px'}}>−</button>
                                <span style={{fontSize:'12px',fontWeight:'800',color:'#065F46'}}>{inCart.qty}</span>
                                <button onClick={()=>addToCart(p)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'700',color:'#00c8a0',padding:'0 2px'}}>+</button>
                              </div>
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Menú principal */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'16px'}}>
                {[
                  {icon:'🏙️',label:'Ver Ciudades',    sub:`${CITIES.length} ciudades`,    action:()=>setScreen('cities'),  color:'#00c8a0'},
                  {icon:'🛒',label:'Supermercados',   sub:`${SUPERMARKETS.length} tiendas`, action:()=>{setCityId(null);setScreen('stores');}, color:'#00b4e6'},
                  {icon:'🛍️',label:'Mi Carrito',      sub:cartCount>0?`${cartCount} productos`:'Vacío', action:()=>setScreen('cart'), color:'#065F46'},
                  {icon:'📦',label:'Mis Pedidos',     sub:`${orders.length} pedidos`,     action:()=>setScreen('orders'),  color:'#6B5BD6'},
                  {icon:'📋',label:'Historial',       sub:'Compras anteriores',            action:()=>setScreen('history'), color:'#F59E0B'},
                  {icon:'🎧',label:'Soporte',         sub:'Ayuda y reportes',              action:()=>setScreen('support'), color:'#C0392B'},
                ].map(item=>(
                  <button key={item.label} onClick={item.action} style={{background:'#fff',border:'1px solid #F0F2F5',borderRadius:'14px',padding:'14px 12px',cursor:'pointer',outline:'none',textAlign:'left',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                    <div style={{width:'40px',height:'40px',borderRadius:'10px',background:item.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',marginBottom:'8px'}}>{item.icon}</div>
                    <div style={{fontSize:'13px',fontWeight:'700',color:'#111827',marginBottom:'2px'}}>{item.label}</div>
                    <div style={{fontSize:'10px',color:'#9CA3AF'}}>{item.sub}</div>
                  </button>
                ))}
              </div>
              {/* Destacados */}
              <div style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'10px'}}>⭐ Productos destacados</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'7px'}}>
                {PRODUCTS.filter(p=>p.destacado).slice(0,9).map(p=>{
                  const inCart=cart.find(i=>i.id===p.id);
                  return (
                    <div key={p.id} style={{background:'#fff',borderRadius:'11px',padding:'10px 8px',border:`1.5px solid ${inCart?'#00c8a0':'#F0F2F5'}`,textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                      <div style={{fontSize:'24px',marginBottom:'4px'}}>{p.img}</div>
                      <div style={{fontSize:'10px',fontWeight:'700',color:'#111827',marginBottom:'2px',lineHeight:'1.2'}}>{p.nombre}</div>
                      <div style={{fontSize:'8px',color:'#9CA3AF',marginBottom:'4px'}}>{p.marca}</div>
                      <div style={{fontSize:'11px',fontWeight:'800',color:'#00c8a0',marginBottom:'6px'}}>{p.precio.toLocaleString()} XAF</div>
                      {!inCart
                        ? <button onClick={()=>addToCart(p)} style={{width:'100%',background:'linear-gradient(135deg,#00c8a0,#00b4e6)',border:'none',borderRadius:'7px',padding:'5px 0',color:'#fff',fontSize:'10px',fontWeight:'700',cursor:'pointer'}}>+ Añadir</button>
                        : <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#F0FDF9',borderRadius:'7px',padding:'3px 6px'}}>
                            <button onClick={()=>removeFromCart(p.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'700',color:'#00c8a0',padding:'0 2px'}}>−</button>
                            <span style={{fontSize:'12px',fontWeight:'800',color:'#065F46'}}>{inCart.qty}</span>
                            <button onClick={()=>addToCart(p)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'700',color:'#00c8a0',padding:'0 2px'}}>+</button>
                          </div>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CIUDADES ── */}
          {screen==='cities'&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              {CITIES.map(c=>{
                const count=SUPERMARKETS.filter(s=>s.ciudad_id===c.id).length;
                return (
                  <button key={c.id} onClick={()=>{setCityId(c.id);setScreen('stores');}} style={{background:'#fff',border:'1px solid #F0F2F5',borderRadius:'14px',padding:'16px 12px',cursor:'pointer',outline:'none',textAlign:'left',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                    <div style={{fontSize:'32px',marginBottom:'8px'}}>🏙️</div>
                    <div style={{fontSize:'14px',fontWeight:'700',color:'#111827',marginBottom:'3px'}}>{c.name}</div>
                    <div style={{fontSize:'10px',color:'#9CA3AF',marginBottom:'6px'}}>{c.provincia}</div>
                    <span style={{background:'#F0FDF9',color:'#065F46',borderRadius:'6px',padding:'2px 8px',fontSize:'10px',fontWeight:'700'}}>{count} tienda{count!==1?'s':''}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── TIENDAS ── */}
          {screen==='stores'&&(
            <div>
              {/* Filtro ciudad */}
              <div style={{display:'flex',gap:'6px',marginBottom:'12px',overflowX:'auto',scrollbarWidth:'none'}}>
                <button onClick={()=>setCityId(null)} style={{background:cityId===null?'#00c8a0':'#fff',border:`1px solid ${cityId===null?'#00c8a0':'#E5E7EB'}`,borderRadius:'20px',padding:'5px 14px',fontSize:'11px',fontWeight:'700',color:cityId===null?'#fff':'#6B7280',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>Todas</button>
                {CITIES.map(c=>(
                  <button key={c.id} onClick={()=>setCityId(c.id)} style={{background:cityId===c.id?'#00c8a0':'#fff',border:`1px solid ${cityId===c.id?'#00c8a0':'#E5E7EB'}`,borderRadius:'20px',padding:'5px 14px',fontSize:'11px',fontWeight:'700',color:cityId===c.id?'#fff':'#6B7280',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>{c.name}</button>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                {SUPERMARKETS.filter(s=>!cityId||s.ciudad_id===cityId).map(s=>(
                  <button key={s.id} onClick={()=>{setSmId(s.id);setCatId(null);setScreen('categories');}} style={{background:'#fff',border:'1px solid #F0F2F5',borderRadius:'14px',padding:'13px 11px',cursor:'pointer',outline:'none',textAlign:'left',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                    <SmLogo sm={s} size={44}/>
                    <div style={{fontSize:'12px',fontWeight:'700',color:'#111827',marginTop:'8px',marginBottom:'3px',lineHeight:'1.3'}}>{s.nombre}</div>
                    <div style={{fontSize:'10px',color:'#9CA3AF',marginBottom:'6px'}}>{CITIES.find(c=>c.id===s.ciudad_id)?.name}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                      {s.delivery&&<span style={{background:'#EFF5FD',color:'#1B3A6B',borderRadius:'5px',padding:'2px 6px',fontSize:'9px',fontWeight:'600',display:'inline-block'}}>🚚 {s.deliveryFee===0?'Delivery gratis':`+${s.deliveryFee} XAF`}</span>}
                      {!s.delivery&&<span style={{background:'#F3F4F6',color:'#6B7280',borderRadius:'5px',padding:'2px 6px',fontSize:'9px',fontWeight:'600',display:'inline-block'}}>Solo recogida</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CATEGORÍAS ── */}
          {screen==='categories'&&sm&&(
            <div>
              <div style={{background:`linear-gradient(135deg,${sm.color},${sm.color2})`,borderRadius:'14px',padding:'14px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'12px'}}>
                <SmLogo sm={sm} size={48}/>
                <div>
                  <div style={{fontSize:'15px',fontWeight:'800',color:'#fff'}}>{sm.nombre}</div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{sm.direccion}</div>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.7)',marginTop:'2px'}}>🕐 {sm.horario.split('/')[0].trim()}</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
                {smCats.map(c=>{
                  const cnt=smProds.filter(p=>p.cat_id===c.id).length;
                  return (
                    <button key={c.id} onClick={()=>{setCatId(c.id);setScreen('products');setSearch('');}} style={{background:'#fff',border:'1px solid #F0F2F5',borderRadius:'12px',padding:'12px 8px',cursor:'pointer',outline:'none',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                      <div style={{fontSize:'26px',marginBottom:'5px'}}>{c.icono}</div>
                      <div style={{fontSize:'10px',fontWeight:'700',color:'#111827',lineHeight:'1.25',marginBottom:'3px'}}>{c.nombre}</div>
                      <span style={{background:c.color+'18',color:c.color,borderRadius:'5px',padding:'1px 6px',fontSize:'9px',fontWeight:'700'}}>{cnt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PRODUCTOS ── */}
          {screen==='products'&&sm&&cat&&(
            <div>
              <div style={{background:'#fff',borderRadius:'10px',padding:'0 12px',height:'42px',display:'flex',alignItems:'center',gap:'8px',border:'1px solid #F0F2F5',marginBottom:'10px'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Buscar en ${cat.nombre}...`} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
                {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',color:'#9CA3AF',cursor:'pointer',fontSize:'14px'}}>✕</button>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'7px'}}>
                {catProds.filter(p=>!search||p.nombre.toLowerCase().includes(search.toLowerCase())||p.marca.toLowerCase().includes(search.toLowerCase())).map(p=>{
                  const inCart=cart.find(i=>i.id===p.id);
                  return (
                    <div key={p.id} style={{background:'#fff',borderRadius:'11px',padding:'10px 8px',border:`1.5px solid ${inCart?'#00c8a0':'#F0F2F5'}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
                      <button onClick={()=>{setProdId(p.id);setScreen('detail');}} style={{background:'none',border:'none',cursor:'pointer',padding:0,width:'100%'}}>
                        <div style={{fontSize:'26px',marginBottom:'4px'}}>{p.img}</div>
                        <div style={{fontSize:'10px',fontWeight:'700',color:'#111827',marginBottom:'2px',lineHeight:'1.2'}}>{p.nombre}</div>
                        <div style={{fontSize:'8px',color:'#9CA3AF',marginBottom:'4px'}}>{p.marca}  -  {p.unidad}</div>
                        <div style={{fontSize:'11px',fontWeight:'800',color:'#00c8a0',marginBottom:'6px'}}>{p.precio.toLocaleString()} XAF</div>
                      </button>
                      {!inCart
                        ? <button onClick={()=>addToCart(p)} style={{width:'100%',background:'linear-gradient(135deg,#00c8a0,#00b4e6)',border:'none',borderRadius:'7px',padding:'6px 0',color:'#fff',fontSize:'10px',fontWeight:'700',cursor:'pointer'}}>+ Añadir</button>
                        : <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#F0FDF9',borderRadius:'7px',padding:'3px 6px',width:'100%'}}>
                            <button onClick={()=>removeFromCart(p.id)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'15px',fontWeight:'700',color:'#00c8a0',padding:'0 2px',lineHeight:1}}>−</button>
                            <span style={{fontSize:'12px',fontWeight:'800',color:'#065F46'}}>{inCart.qty}</span>
                            <button onClick={()=>addToCart(p)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'15px',fontWeight:'700',color:'#00c8a0',padding:'0 2px',lineHeight:1}}>+</button>
                          </div>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* ── DETALLE PRODUCTO ── */}
          {screen==='detail'&&prod&&(
            <div>
              <div style={{background:'#fff',borderRadius:'16px',padding:'24px',marginBottom:'14px',textAlign:'center',border:'1px solid #F0F2F5',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontSize:'72px',marginBottom:'12px'}}>{prod.img}</div>
                <div style={{fontSize:'18px',fontWeight:'800',color:'#111827',marginBottom:'4px'}}>{prod.nombre}</div>
                <div style={{fontSize:'12px',color:'#9CA3AF',marginBottom:'8px'}}>{prod.marca}  -  {prod.unidad}</div>
                <div style={{fontSize:'24px',fontWeight:'900',color:'#00c8a0',marginBottom:'12px'}}>{prod.precio.toLocaleString()} XAF</div>
                <div style={{display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap',marginBottom:'12px'}}>
                  {cat&&<span style={{background:cat.color+'18',color:cat.color,borderRadius:'8px',padding:'3px 10px',fontSize:'11px',fontWeight:'700'}}>{cat.icono} {cat.nombre}</span>}
                  <span style={{background:prod.stock>0?'#F0FDF9':'#FEF2F2',color:prod.stock>0?'#065F46':'#C0392B',borderRadius:'8px',padding:'3px 10px',fontSize:'11px',fontWeight:'700'}}>{prod.stock>0?`✓ En stock (${prod.stock})`:'Sin stock'}</span>
                  {prod.destacado&&<span style={{background:'#FFFBEB',color:'#92400E',borderRadius:'8px',padding:'3px 10px',fontSize:'11px',fontWeight:'700'}}>⭐ Destacado</span>}
                </div>
                <div style={{fontSize:'13px',color:'#6B7280',lineHeight:'1.5',textAlign:'left',background:'#F9FAFB',borderRadius:'10px',padding:'12px'}}>{prod.desc}</div>
              </div>
              {sm&&(
                <div style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'10px',border:'1px solid #F0F2F5'}}>
                  <SmLogo sm={sm} size={36}/>
                  <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{sm.nombre}</div><div style={{fontSize:'10px',color:'#9CA3AF'}}>{sm.direccion}</div></div>
                </div>
              )}
              {(() => {
                const inCart=cart.find(i=>i.id===prod.id);
                return !inCart
                  ? <button onClick={()=>addToCart(prod)} style={{width:'100%',background:'linear-gradient(135deg,#00c8a0,#00b4e6)',border:'none',borderRadius:'12px',padding:'14px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>+ Añadir al carrito</button>
                  : <div style={{display:'flex',alignItems:'center',gap:'12px',background:'#F0FDF9',borderRadius:'12px',padding:'12px 16px'}}>
                      <button onClick={()=>removeFromCart(prod.id)} style={{width:'36px',height:'36px',borderRadius:'50%',background:'#fff',border:'1px solid #A7F3D0',cursor:'pointer',fontSize:'18px',fontWeight:'700',color:'#00c8a0'}}>−</button>
                      <span style={{flex:1,textAlign:'center',fontSize:'18px',fontWeight:'800',color:'#065F46'}}>{inCart.qty} en carrito</span>
                      <button onClick={()=>addToCart(prod)} style={{width:'36px',height:'36px',borderRadius:'50%',background:'#00c8a0',border:'none',cursor:'pointer',fontSize:'18px',fontWeight:'700',color:'#fff'}}>+</button>
                    </div>;
              })()}
              {cartCount>0&&<button onClick={()=>setScreen('cart')} style={{width:'100%',background:'#065F46',border:'none',borderRadius:'12px',padding:'13px',color:'#fff',fontSize:'13px',fontWeight:'700',cursor:'pointer',marginTop:'8px'}}>Ver carrito  -  {cartCount} productos  -  {cartTotal.toLocaleString()} XAF</button>}
            </div>
          )}

          {/* ── CARRITO ── */}
          {screen==='cart'&&(
            <div>
              {cart.length===0?(
                <div style={{textAlign:'center',padding:'50px 0'}}>
                  <div style={{fontSize:'56px',marginBottom:'12px'}}>🛒</div>
                  <div style={{fontSize:'16px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>Carrito vacío</div>
                  <div style={{fontSize:'12px',color:'#9CA3AF',marginBottom:'20px'}}>Añade productos para continuar</div>
                  <button onClick={()=>setScreen('home')} style={{background:'linear-gradient(135deg,#00c8a0,#00b4e6)',border:'none',borderRadius:'12px',padding:'12px 28px',color:'#fff',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>Explorar productos</button>
                </div>
              ):(
                <div>
                  {cart.map(item=>(
                    <div key={item.id} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'10px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',border:'1px solid #F0F2F5'}}>
                      <div style={{fontSize:'28px',flexShrink:0}}>{item.img}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{item.nombre}</div>
                        <div style={{fontSize:'10px',color:'#9CA3AF'}}>{item.marca}  -  {item.precio.toLocaleString()} XAF/ud</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <button onClick={()=>removeFromCart(item.id)} style={{width:'26px',height:'26px',borderRadius:'50%',background:'#F3F4F6',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'700',color:'#374151'}}>−</button>
                        <span style={{fontSize:'13px',fontWeight:'700',color:'#111827',minWidth:'16px',textAlign:'center'}}>{item.qty}</span>
                        <button onClick={()=>setCart(p=>p.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i))} style={{width:'26px',height:'26px',borderRadius:'50%',background:'#00c8a0',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'700',color:'#fff'}}>+</button>
                      </div>
                      <div style={{fontSize:'12px',fontWeight:'800',color:'#00c8a0',minWidth:'64px',textAlign:'right'}}>{(item.precio*item.qty).toLocaleString()} XAF</div>
                    </div>
                  ))}
                  <div style={{background:'#fff',borderRadius:'12px',padding:'14px',marginTop:'8px',border:'1px solid #F0F2F5'}}>
                    <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #F3F4F6'}}><span style={{fontSize:'12px',color:'#6B7280'}}>Subtotal ({cartCount} productos)</span><span style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{cartTotal.toLocaleString()} XAF</span></div>
                    {sm?.delivery&&<div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #F3F4F6'}}><span style={{fontSize:'12px',color:'#6B7280'}}>Envío estimado</span><span style={{fontSize:'12px',fontWeight:'700',color:sm.deliveryFee===0?'#00c8a0':'#111827'}}>{sm.deliveryFee===0?'Gratis':`${sm.deliveryFee.toLocaleString()} XAF`}</span></div>}
                    <div style={{display:'flex',justifyContent:'space-between',paddingTop:'8px'}}><span style={{fontSize:'14px',fontWeight:'700',color:'#374151'}}>Total estimado</span><span style={{fontSize:'20px',fontWeight:'900',color:'#00c8a0'}}>{cartTotal.toLocaleString()} XAF</span></div>
                  </div>
                  <button onClick={()=>setScreen('checkout')} style={{width:'100%',background:'linear-gradient(135deg,#00c8a0,#00b4e6)',border:'none',borderRadius:'12px',padding:'14px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer',marginTop:'12px'}}>Continuar → Finalizar pedido</button>
                  <button onClick={()=>setCart([])} style={{width:'100%',background:'none',border:'none',padding:'10px',color:'#9CA3AF',fontSize:'12px',cursor:'pointer',marginTop:'4px'}}>Vaciar carrito</button>
                </div>
              )}
            </div>
          )}

          {/* ── CHECKOUT ── */}
          {screen==='checkout'&&(
            <div>
              {/* Método de entrega */}
              <div style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'8px'}}>Método de entrega</div>
              <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
                {([['delivery','🚚','Delivery a domicilio'],['recogida','🏪','Recoger en tienda']] as ['delivery'|'recogida',string,string][]).map(([id,icon,label])=>(
                  <button key={id} onClick={()=>setMetodoEntrega(id)} style={{flex:1,background:metodoEntrega===id?'#F0FDF9':'#F9FAFB',border:`1.5px solid ${metodoEntrega===id?'#00c8a0':'#E5E7EB'}`,borderRadius:'12px',padding:'12px 8px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                    <span style={{fontSize:'22px'}}>{icon}</span>
                    <span style={{fontSize:'10px',fontWeight:'700',color:metodoEntrega===id?'#065F46':'#6B7280'}}>{label}</span>
                  </button>
                ))}
              </div>

              {metodoEntrega==='delivery'&&(
                <div>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'8px'}}>Datos de entrega</div>
                  {([{k:'nombre',l:'Nombre completo',t:'text',i:'👤'},{k:'telefono',l:'Teléfono',t:'tel',i:'📞'},{k:'direccion',l:'Dirección',t:'text',i:'📍'},{k:'barrio',l:'Barrio / Zona',t:'text',i:'🏘️'},{k:'notas',l:'Instrucciones (opcional)',t:'text',i:'📝'}] as {k:keyof typeof direccion;l:string;t:string;i:string}[]).map(f=>(
                    <div key={f.k} style={{background:'#fff',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'50px',display:'flex',alignItems:'center',border:'1px solid #F0F2F5',gap:'10px'}}>
                      <span style={{fontSize:'16px'}}>{f.i}</span>
                      <input type={f.t} placeholder={f.l} value={direccion[f.k]} onChange={e=>setDir(f.k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
                    </div>
                  ))}
                </div>
              )}

              {metodoEntrega==='recogida'&&sm&&(
                <div style={{background:'#F0FDF9',borderRadius:'12px',padding:'14px',marginBottom:'14px',border:'1px solid #A7F3D0'}}>
                  <div style={{fontSize:'13px',fontWeight:'700',color:'#065F46',marginBottom:'6px'}}>📍 Punto de recogida</div>
                  <div style={{fontSize:'12px',color:'#374151',marginBottom:'3px'}}>{sm.nombre}</div>
                  <div style={{fontSize:'11px',color:'#6B7280',marginBottom:'3px'}}>{sm.direccion}</div>
                  <div style={{fontSize:'11px',color:'#6B7280'}}>🕐 {sm.horario}</div>
                </div>
              )}

              {/* Resumen */}
              <div style={{background:'#fff',borderRadius:'12px',padding:'14px',marginBottom:'12px',border:'1px solid #F0F2F5'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:'#9CA3AF',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Resumen del pedido</div>
                {cart.map(i=>(
                  <div key={i.id} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #F3F4F6'}}>
                    <span style={{fontSize:'11px',color:'#374151'}}>{i.img} {i.nombre} x{i.qty}</span>
                    <span style={{fontSize:'11px',fontWeight:'700',color:'#111827'}}>{(i.precio*i.qty).toLocaleString()} XAF</span>
                  </div>
                ))}
                {metodoEntrega==='delivery'&&deliveryFee>0&&(
                  <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #F3F4F6'}}>
                    <span style={{fontSize:'11px',color:'#374151'}}>🚚 Envío</span>
                    <span style={{fontSize:'11px',fontWeight:'700',color:'#111827'}}>{deliveryFee.toLocaleString()} XAF</span>
                  </div>
                )}
                <div style={{display:'flex',justifyContent:'space-between',paddingTop:'8px'}}>
                  <span style={{fontSize:'13px',fontWeight:'700',color:'#374151'}}>Total</span>
                  <span style={{fontSize:'18px',fontWeight:'900',color:'#00c8a0'}}>{grandTotal.toLocaleString()} XAF</span>
                </div>
              </div>

              {/* Método de pago */}
              <div style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'8px'}}>Método de pago</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}}>
                {[{id:'wallet',label:'EGCHAT Wallet',icon:'💳'},{id:'bank',label:'Banco',icon:'🏦'},{id:'cash',label:'Efectivo',icon:'💵'}].map(m=>(
                  <button key={m.id} onClick={()=>setMetodoPago(m.id)} style={{background:metodoPago===m.id?'#F0FDF9':'#F9FAFB',border:`1.5px solid ${metodoPago===m.id?'#00c8a0':'#E5E7EB'}`,borderRadius:'10px',padding:'10px 4px',fontSize:'10px',fontWeight:'700',color:metodoPago===m.id?'#065F46':'#6B7280',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                    <span style={{fontSize:'20px'}}>{m.icon}</span>{m.label}
                  </button>
                ))}
              </div>

              <button
                onClick={confirmOrder}
                disabled={!metodoPago||(metodoEntrega==='delivery'&&(!direccion.nombre||!direccion.telefono||!direccion.direccion))}
                style={{width:'100%',background:metodoPago&&(metodoEntrega==='recogida'||(direccion.nombre&&direccion.telefono&&direccion.direccion))?'linear-gradient(135deg,#00c8a0,#00b4e6)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:metodoPago&&(metodoEntrega==='recogida'||(direccion.nombre&&direccion.telefono&&direccion.direccion))?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>
                Confirmar pedido  -  {grandTotal.toLocaleString()} XAF
              </button>
            </div>
          )}

          {/* ── MIS PEDIDOS ── */}
          {screen==='orders'&&(
            <div>
              {orders.length===0?(
                <div style={{textAlign:'center',padding:'50px 0'}}>
                  <div style={{fontSize:'56px',marginBottom:'12px'}}>📦</div>
                  <div style={{fontSize:'16px',fontWeight:'700',color:'#374151',marginBottom:'6px'}}>Sin pedidos aún</div>
                  <div style={{fontSize:'12px',color:'#9CA3AF',marginBottom:'20px'}}>Tus pedidos aparecerán aquí</div>
                  <button onClick={()=>setScreen('home')} style={{background:'linear-gradient(135deg,#00c8a0,#00b4e6)',border:'none',borderRadius:'12px',padding:'12px 28px',color:'#fff',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>Hacer mi primer pedido</button>
                </div>
              ):(
                <div>
                  {orders.map(o=>{
                    const statusColor: Record<string,string> = {confirmado:'#00c8a0',pendiente:'#F59E0B',en_preparacion:'#00b4e6',listo:'#6B5BD6',en_camino:'#F59E0B',entregado:'#065F46',cancelado:'#C0392B'};
                    const statusLabel: Record<string,string> = {confirmado:'Confirmado',pendiente:'Pendiente',en_preparacion:'En preparación',listo:'Listo',en_camino:'En camino',entregado:'Entregado',cancelado:'Cancelado'};
                    return (
                      <div key={o.id} style={{background:'#fff',borderRadius:'14px',padding:'14px',marginBottom:'10px',border:'1px solid #F0F2F5',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                          <div>
                            <div style={{fontSize:'13px',fontWeight:'700',color:'#111827'}}>{o.sm_nombre}</div>
                            <div style={{fontSize:'10px',color:'#9CA3AF',marginTop:'2px'}}>📅 {o.fecha}  -  Ref: {o.ref}</div>
                          </div>
                          <span style={{background:statusColor[o.estado]+'18',color:statusColor[o.estado],borderRadius:'8px',padding:'3px 10px',fontSize:'10px',fontWeight:'700'}}>{statusLabel[o.estado]}</span>
                        </div>
                        <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'10px'}}>
                          {o.items.slice(0,4).map(i=><span key={i.id} style={{fontSize:'18px'}}>{i.img}</span>)}
                          {o.items.length>4&&<span style={{fontSize:'11px',color:'#9CA3AF',alignSelf:'center'}}>+{o.items.length-4} más</span>}
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'8px',borderTop:'1px solid #F3F4F6'}}>
                          <div>
                            <div style={{fontSize:'10px',color:'#9CA3AF'}}>{o.metodo_entrega==='delivery'?'🚚 Delivery':'🏪 Recogida'}  -  {o.metodo_pago==='wallet'?'💳 EGCHAT':o.metodo_pago==='bank'?'🏦 Banco':'💵 Efectivo'}</div>
                            <div style={{fontSize:'10px',color:'#6B7280',marginTop:'2px'}}>📍 {o.direccion}</div>
                          </div>
                          <div style={{fontSize:'16px',fontWeight:'900',color:'#00c8a0'}}>{o.total.toLocaleString()} XAF</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── HISTORIAL ── */}
          {screen==='history'&&(
            <div>
              <div style={{background:'linear-gradient(135deg,#F59E0B,#D97706)',borderRadius:'14px',padding:'16px',marginBottom:'14px',color:'#fff'}}>
                <div style={{fontSize:'15px',fontWeight:'800',marginBottom:'4px'}}>📋 Historial de compras</div>
                <div style={{fontSize:'11px',opacity:0.85}}>{orders.length} pedido{orders.length!==1?'s':''} realizados</div>
              </div>
              {orders.length===0?(
                <div style={{textAlign:'center',padding:'40px 0',color:'#9CA3AF'}}>
                  <div style={{fontSize:'40px',marginBottom:'8px'}}>📋</div>
                  <div style={{fontSize:'13px'}}>Sin historial todavía</div>
                </div>
              ):(
                <div>
                  {/* Resumen estadísticas */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}}>
                    {[
                      {label:'Pedidos',value:orders.length,icon:'📦',color:'#00c8a0'},
                      {label:'Total gastado',value:`${orders.reduce((s,o)=>s+o.total,0).toLocaleString()} XAF`,icon:'💰',color:'#F59E0B'},
                      {label:'Tiendas',value:new Set(orders.map(o=>o.sm_id)).size,icon:'🛒',color:'#6B5BD6'},
                    ].map(s=>(
                      <div key={s.label} style={{background:'#fff',borderRadius:'12px',padding:'12px 8px',textAlign:'center',border:'1px solid #F0F2F5'}}>
                        <div style={{fontSize:'20px',marginBottom:'4px'}}>{s.icon}</div>
                        <div style={{fontSize:'13px',fontWeight:'800',color:s.color,marginBottom:'2px'}}>{s.value}</div>
                        <div style={{fontSize:'9px',color:'#9CA3AF'}}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {orders.map(o=>(
                    <div key={o.id} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'10px',border:'1px solid #F0F2F5'}}>
                      <div style={{fontSize:'28px'}}>{o.items[0]?.img||'🛒'}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{o.sm_nombre}</div>
                        <div style={{fontSize:'10px',color:'#9CA3AF'}}>{o.fecha}  -  {o.items.length} producto{o.items.length!==1?'s':''}</div>
                        <div style={{fontSize:'10px',color:'#9CA3AF'}}>Ref: {o.ref}</div>
                      </div>
                      <div style={{fontSize:'14px',fontWeight:'800',color:'#00c8a0'}}>{o.total.toLocaleString()} XAF</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SOPORTE ── */}
          {screen==='support'&&(
            <div>
              {!supportOk?(
                <div>
                  <div style={{background:'linear-gradient(135deg,#C0392B,#E74C3C)',borderRadius:'14px',padding:'16px',marginBottom:'14px',color:'#fff'}}>
                    <div style={{fontSize:'15px',fontWeight:'800',marginBottom:'4px'}}>🎧 Soporte</div>
                    <div style={{fontSize:'11px',opacity:0.85}}>Reporta un problema o contacta con nosotros</div>
                  </div>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'8px'}}>Tipo de incidencia</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'14px'}}>
                    {[
                      {id:'faltante',label:'Producto faltante',icon:'📦'},
                      {id:'incompleto',label:'Pedido incompleto',icon:'⚠️'},
                      {id:'entrega',label:'Entrega fallida',icon:'🚚'},
                      {id:'pago',label:'Problema de pago',icon:'💳'},
                      {id:'calidad',label:'Calidad del producto',icon:'🔍'},
                      {id:'otro',label:'Otro',icon:'💬'},
                    ].map(t=>(
                      <button key={t.id} onClick={()=>setSupportType(t.id)} style={{background:supportType===t.id?'#FEF2F2':'#fff',border:`1.5px solid ${supportType===t.id?'#C0392B':'#F0F2F5'}`,borderRadius:'12px',padding:'12px',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',textAlign:'left'}}>
                        <span style={{fontSize:'20px'}}>{t.icon}</span>
                        <span style={{fontSize:'11px',fontWeight:'700',color:supportType===t.id?'#C0392B':'#374151'}}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'8px'}}>Descripción del problema</div>
                  <textarea value={supportMsg} onChange={e=>setSupportMsg(e.target.value)} placeholder="Describe el problema con detalle..." rows={4} style={{width:'100%',background:'#fff',border:'1px solid #F0F2F5',borderRadius:'12px',padding:'12px 14px',fontSize:'13px',color:'#111827',fontFamily:'inherit',outline:'none',resize:'none',boxSizing:'border-box',marginBottom:'14px'}}/>
                  <button onClick={()=>{if(supportType&&supportMsg.trim())setSupportOk(true);}} style={{width:'100%',background:supportType&&supportMsg.trim()?'linear-gradient(135deg,#C0392B,#E74C3C)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:supportType&&supportMsg.trim()?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:supportType&&supportMsg.trim()?'pointer':'default'}}>
                    Enviar reporte
                  </button>
                </div>
              ):(
                <div style={{textAlign:'center',padding:'40px 0'}}>
                  <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'linear-gradient(135deg,#00c8a0,#00b4e6)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:'40px'}}>✅</div>
                  <div style={{fontSize:'18px',fontWeight:'800',color:'#111827',marginBottom:'8px'}}>Reporte enviado</div>
                  <div style={{fontSize:'13px',color:'#9CA3AF',marginBottom:'20px'}}>Nuestro equipo revisará tu caso en menos de 24h</div>
                  <div style={{background:'#F0FDF9',borderRadius:'12px',padding:'14px',marginBottom:'20px',textAlign:'left',border:'1px solid #A7F3D0'}}>
                    <div style={{fontSize:'11px',color:'#065F46',fontWeight:'700',marginBottom:'6px'}}>Ticket: EGC-SUP-{Date.now().toString().slice(-6)}</div>
                    <div style={{fontSize:'12px',color:'#374151'}}>{supportMsg}</div>
                  </div>
                  <button onClick={()=>{setSupportOk(false);setSupportMsg('');setSupportType('');setScreen('home');}} style={{background:'linear-gradient(135deg,#00c8a0,#00b4e6)',border:'none',borderRadius:'12px',padding:'12px 28px',color:'#fff',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>Volver al inicio</button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
