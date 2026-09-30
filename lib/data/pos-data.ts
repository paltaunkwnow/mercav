export const LATAM_CURRENCIES = [
  { code: 'ARS', name: 'Peso argentino', flag: '🇦🇷' },
  { code: 'BOB', name: 'Boliviano', flag: '🇧🇴' },
  { code: 'BRL', name: 'Real brasileño', flag: '🇧🇷' },
  { code: 'CLP', name: 'Peso chileno', flag: '🇨🇱' },
  { code: 'COP', name: 'Peso colombiano', flag: '🇨🇴' },
  { code: 'CRC', name: 'Colón costarricense', flag: '🇨🇷' },
  { code: 'CUP', name: 'Peso cubano', flag: '🇨🇺' },
  { code: 'DOP', name: 'Peso dominicano', flag: '🇩🇴' },
  { code: 'GTQ', name: 'Quetzal guatemalteco', flag: '🇬🇹' },
  { code: 'HNL', name: 'Lempira hondureño', flag: '🇭🇳' },
  { code: 'MXN', name: 'Peso mexicano', flag: '🇲🇽' },
  { code: 'NIO', name: 'Córdoba nicaragüense', flag: '🇳🇮' },
  { code: 'PAB', name: 'Balboa panameño', flag: '🇵🇦' },
  { code: 'PEN', name: 'Sol peruano', flag: '🇵🇪' },
  { code: 'PYG', name: 'Guaraní paraguayo', flag: '🇵🇾' },
  { code: 'SVC', name: 'Colón salvadoreño', flag: '🇸🇻' },
  { code: 'UYU', name: 'Peso uruguayo', flag: '🇺🇾' },
  { code: 'VES', name: 'Bolívar venezolano', flag: '🇻🇪' },
  { code: 'USD', name: 'Dólar estadounidense', flag: '🇺🇸' },
];

export const LATAM_LOCATIONS = [
  {
    country: "Bolivia",
    departments: [
      {
        name: "La Paz",
        cities: ["La Paz", "El Alto", "Viacha", "Caranavi", "Coroico", "Desaguadero", "Copacabana", "Achacachi", "Batallas", "Puerto Acosta"]
      },
      {
        name: "Santa Cruz",
        cities: ["Santa Cruz de la Sierra", "Cotoca", "Warnes", "Montero", "La Guardia", "Camiri", "Puerto Suárez", "Vallegrande", "Samaipata", "Portachuelo", "San Ignacio de Velasco", "Roboré"]
      },
      {
        name: "Cochabamba",
        cities: ["Cochabamba", "Quillacollo", "Sacaba", "Colcapirhua", "Tiquipaya", "Punata", "Arani", "Cliza", "Mizque", "Shinahota"]
      },
      {
        name: "Tarija",
        cities: ["Tarija", "Yacuiba", "Bermejo", "Villamontes", "Entre Ríos", "Padcaya", "Uriondo"]
      },
      {
        name: "Oruro",
        cities: ["Oruro", "Huanuni", "Caracollo", "Challapata", "Eucaliptus"]
      },
      {
        name: "Potosí",
        cities: ["Potosí", "Llallagua", "Villazón", "Tupiza", "Uyuni", "Colquechaca"]
      },
      {
        name: "Chuquisaca",
        cities: ["Sucre", "Camargo", "Monteagudo", "Villa Serrano", "Zudáñez"]
      },
      {
        name: "Beni",
        cities: ["Trinidad", "Riberalta", "Guayaramerín", "San Borja", "Santa Ana del Yacuma"]
      },
      {
        name: "Pando",
        cities: ["Cobija", "Porvenir", "Filadelfia", "Puerto Rico"]
      }
    ]
  },
  {
    country: "Argentina",
    departments: [
      {
        name: "Buenos Aires",
        cities: ["Buenos Aires", "La Plata", "Mar del Plata", "Quilmes", "Lomas de Zamora", "Lanús", "General Roca", "Bahía Blanca", "Tandil", "Tigre", "San Isidro", "Vicente López", "Morón"]
      },
      {
        name: "Córdoba",
        cities: ["Córdoba", "Villa Carlos Paz", "Río Cuarto", "Villa María", "San Francisco", "Alta Gracia", "Jesús María"]
      },
      {
        name: "Santa Fe",
        cities: ["Rosario", "Santa Fe", "Rafaela", "Venado Tuerto", "Santo Tomé", "Villa Gobernador Gálvez"]
      },
      {
        name: "Mendoza",
        cities: ["Mendoza", "San Rafael", "Godoy Cruz", "Luján de Cuyo", "Maipú", "Las Heras"]
      },
      {
        name: "Tucumán",
        cities: ["San Miguel de Tucumán", "Tafí Viejo", "Concepción", "Yerba Buena", "Banda del Río Salí"]
      },
      {
        name: "Salta",
        cities: ["Salta", "Orán", "Tartagal", "General Güemes", "Cafayate"]
      }
    ]
  },
  {
    country: "México",
    departments: [
      {
        name: "CDMX",
        cities: ["Iztapalapa", "Gustavo A. Madero", "Álvaro Obregón", "Tlalpan", "Coyoacán", "Cuauhtémoc"]
      },
      {
        name: "Jalisco",
        cities: ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta", "Lagos de Moreno"]
      },
      {
        name: "Nuevo León",
        cities: ["Monterrey", "Guadalupe", "Apodaca", "San Nicolás de los Garza", "General Escobedo", "Santa Catarina"]
      }
    ]
  },
  {
    country: "Perú",
    departments: [
      {
        name: "Lima",
        cities: ["Lima", "Callao", "San Juan de Lurigancho", "San Martín de Porres", "Ate", "Comas"]
      },
      {
        name: "Arequipa",
        cities: ["Arequipa", "Camaná", "Caravelí", "Castilla", "Caylloma", "Condesuyos"]
      }
    ]
  },
  {
    country: "Chile",
    departments: [
      {
        name: "Metropolitana",
        cities: ["Santiago", "Puente Alto", "Maipú", "La Florida", "San Bernardo", "Las Condes"]
      },
      {
        name: "Valparaíso",
        cities: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "San Antonio", "Quillota"]
      }
    ]
  },
  {
    country: "Colombia",
    departments: [
      {
        name: "Cundinamarca",
        cities: ["Bogotá", "Soacha", "Fusagasugá", "Facatativá", "Zipaquirá", "Chía"]
      },
      {
        name: "Antioquia",
        cities: ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Rionegro"]
      },
      {
        name: "Valle del Cauca",
        cities: ["Cali", "Buenaventura", "Palmira", "Tuluá", "Yumbo", "Cartago"]
      }
    ]
  },
  {
    country: "Uruguay",
    departments: [
      { name: "Montevideo", cities: ["Montevideo"] },
      { name: "Canelones", cities: ["Canelones", "Las Piedras", "Ciudad de la Costa", "Pando"] },
      { name: "Maldonado", cities: ["Maldonado", "Punta del Este", "Piriápolis", "San Carlos"] },
      { name: "Salto", cities: ["Salto", "Constitución", "Belén"] },
      { name: "Colonia", cities: ["Colonia del Sacramento", "Carmelo", "Nueva Helvecia", "Juan Lacaze"] }
    ]
  },
  {
    country: "Paraguay",
    departments: [
      { name: "Asunción", cities: ["Asunción"] },
      { name: "Central", cities: ["Luque", "Lambaré", "San Lorenzo", "Capiatá", "Fernando de la Mora", "Limpio"] },
      { name: "Alto Paraná", cities: ["Ciudad del Este", "Hernandarias", "Presidente Franco", "Minga Guazú"] },
      { name: "Itapúa", cities: ["Encarnación", "Cambyretá", "Hohenau"] }
    ]
  },
  {
    country: "Venezuela",
    departments: [
      { name: "Distrito Capital", cities: ["Caracas"] },
      { name: "Zulia", cities: ["Maracaibo", "Cabimas", "Ciudad Ojeda", "Machiques"] },
      { name: "Miranda", cities: ["Los Teques", "Petare", "Baruta", "Guarenas", "Guatire"] },
      { name: "Carabobo", cities: ["Valencia", "Puerto Cabello", "Guacara", "Naguanagua"] },
      { name: "Aragua", cities: ["Maracay", "Turmero", "La Victoria", "Cagua"] },
      { name: "Lara", cities: ["Barquisimeto", "Cabudare", "Carora", "El Tocuyo"] }
    ]
  },
  {
    country: "Ecuador",
    departments: [
      { name: "Pichincha", cities: ["Quito", "Sangolquí", "Machachi", "Cayambe"] },
      { name: "Guayas", cities: ["Guayaquil", "Durán", "Samborondón", "Milagro", "Daule"] },
      { name: "Azuay", cities: ["Cuenca", "Gualaceo", "Paute"] },
      { name: "Manabí", cities: ["Portoviejo", "Manta", "Chone", "Bahía de Caráquez"] },
      { name: "Tungurahua", cities: ["Ambato", "Baños", "Pelileo"] }
    ]
  },
  {
    country: "Guatemala",
    departments: [
      { name: "Guatemala", cities: ["Ciudad de Guatemala", "Mixco", "Villa Nueva", "Amatitlán", "Santa Catarina Pinula"] },
      { name: "Quetzaltenango", cities: ["Quetzaltenango", "Coatepeque", "Salcajá"] },
      { name: "Sacatepéquez", cities: ["Antigua Guatemala", "Jocotenango", "Ciudad Vieja"] },
      { name: "Escuintla", cities: ["Escuintla", "Santa Lucía Cotzumalguapa", "Tiquisate"] }
    ]
  },
  {
    country: "Costa Rica",
    departments: [
      { name: "San José", cities: ["San José", "Escazú", "Desamparados", "Puriscal", "Perez Zeledón"] },
      { name: "Alajuela", cities: ["Alajuela", "San Ramón", "Grecia", "San Carlos"] },
      { name: "Cartago", cities: ["Cartago", "Paraíso", "La Unión", "Turrialba"] },
      { name: "Heredia", cities: ["Heredia", "Barva", "Santo Domingo", "Belén"] }
    ]
  },
  {
    country: "Panamá",
    departments: [
      { name: "Panamá", cities: ["Ciudad de Panamá", "San Miguelito", "Arraiján", "La Chorrera"] },
      { name: "Chiriquí", cities: ["David", "Boquete", "Bugaba"] },
      { name: "Colón", cities: ["Colón", "Portobelo"] },
      { name: "Veraguas", cities: ["Santiago de Veraguas"] }
    ]
  },
  {
    country: "Honduras",
    departments: [
      { name: "Francisco Morazán", cities: ["Tegucigalpa", "Comayagüela"] },
      { name: "Cortés", cities: ["San Pedro Sula", "Choloma", "Puerto Cortés", "Villanueva"] },
      { name: "Atlántida", cities: ["La Ceiba", "Tela"] },
      { name: "Choluteca", cities: ["Choluteca"] }
    ]
  },
  {
    country: "El Salvador",
    departments: [
      { name: "San Salvador", cities: ["San Salvador", "Soyapango", "Mejicanos", "Santa Tecla"] },
      { name: "Santa Ana", cities: ["Santa Ana", "Chalchuapa", "Metapán"] },
      { name: "San Miguel", cities: ["San Miguel"] },
      { name: "La Libertad", cities: ["Santa Tecla", "Antiguo Cuscatlán"] }
    ]
  },
  {
    country: "Nicaragua",
    departments: [
      { name: "Managua", cities: ["Managua", "Tipitapa", "Ciudad Sandino"] },
      { name: "León", cities: ["León", "Nagarote", "La Paz Centro"] },
      { name: "Granada", cities: ["Granada"] },
      { name: "Matagalpa", cities: ["Matagalpa", "Sébaco"] }
    ]
  },
  {
    country: "Cuba",
    departments: [
      { name: "La Habana", cities: ["La Habana"] },
      { name: "Santiago de Cuba", cities: ["Santiago de Cuba", "Palma Soriano"] },
      { name: "Camagüey", cities: ["Camagüey", "Florida"] },
      { name: "Holguín", cities: ["Holguín", "Banes", "Moa"] }
    ]
  },
  {
    country: "República Dominicana",
    departments: [
      { name: "Distrito Nacional", cities: ["Santo Domingo"] },
      { name: "Santiago", cities: ["Santiago de los Caballeros", "Villa González"] },
      { name: "Santo Domingo", cities: ["Santo Domingo Este", "Santo Domingo Oeste", "Santo Domingo Norte"] },
      { name: "La Altagracia", cities: ["Higüey", "Punta Cana"] }
    ]
  }
];

export const DELIVERY_CHANNELS = [
  "PedidosYa", "Rappi", "Yango", "MercadoLibre Comida", "Glovo", "iFood", "Propio"
];

export const ORDER_TYPES = [
  { id: "TABLE", name: "Para la mesa", icon: "🍽️" },
  { id: "TOGO", name: "Para llevar", icon: "🥡" },
  { id: "EMPLOYEE", name: "Descuento empleado", icon: "👨‍🍳" },
];
// creado por pato dev y askforvini
