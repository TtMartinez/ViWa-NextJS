// Cada entrada define: slug de la URL, categoria que se consulta en Sanity,
// título visible y metadata SEO. Antes esto estaba repetido en cada .html.
export const CATEGORIAS = {
  herbales: {
    categoria: "herbales",
    titulo: "Jabones Herbales",
    description:
      "Jabones herbales ViWa elaborados artesanalmente con extractos naturales de plantas. Ideales para el cuidado diario de la piel de forma consciente.",
    keywords:
      "jabones herbales, jabones naturales, cosmética natural, plantas medicinales, jabones artesanales ViWa",
  },
  cremosos: {
    categoria: "cremosos",
    titulo: "Jabones Cremosos",
    description:
      "Jabones cremosos ViWa elaborados artesanalmente: suaves, hidratantes y diseñados para nutrir y proteger la piel de forma natural.",
    keywords:
      "jabones cremosos, jabones hidratantes, cosmética natural, cuidado de la piel, jabones artesanales ViWa",
  },
  exfoliantes: {
    categoria: "exfoliantes",
    titulo: "Jabones Exfoliantes & Detox",
    description:
      "Jabones exfoliantes y detox ViWa elaborados artesanalmente para limpiar profundamente la piel, eliminando impurezas de forma natural.",
    keywords:
      "jabones exfoliantes, jabones detox, limpieza de la piel, cosmética natural, jabones artesanales ViWa",
  },
  gelducha: {
    categoria: "gel",
    titulo: "Gel de ducha",
    description:
      "Descubrí los geles de ducha naturales de ViWa, elaborados artesanalmente para limpiar, hidratar y cuidar tu piel con ingredientes nobles.",
    keywords:
      "geles de ducha, shower gel, geles de baño, cuidado corporal, cosmética natural, higiene natural, geles artesanales ViWa",
  },
  rituales: {
    categoria: "rituales",
    titulo: "Rituales",
    description:
      "Descubrí los rituales de bienestar de ViWa: boxes artesanales con productos combinados como geles de ducha, jabones y bálsamos para crear momentos de pausa, relajación y energía.",
    keywords:
      "rituales de bienestar, boxes artesanales, sets de autocuidado, ritual relajante, ritual energizante, ritual pausa, cosmética natural ViWa",
  },
  salesbanio: {
    categoria: "sales",
    titulo: "Sales de baño",
    description:
      "Descubrí las sales de baño naturales de ViWa, elaboradas artesanalmente para relajar, revitalizar y brindar bienestar en cada baño.",
    keywords:
      "sales de baño, baño relajante, sales aromáticas, cuidado corporal, bienestar natural, cosmética artesanal, ViWa",
  },
  textiles: {
    categoria: "textiles",
    titulo: "Textiles",
    description:
      "Descubrí los textiles artesanales de ViWa, piezas únicas hechas con dedicación para aportar calidez, diseño y armonía a tus espacios.",
    keywords:
      "textiles artesanales, decoración textil, accesorios textiles, productos artesanales, diseño textil, ViWa atelier",
  },
  balsamos: {
    categoria: "balsamos",
    titulo: "Bálsamos & Exfoliantes",
    description:
      "Descubrí los bálsamos labiales, bálsamos corporales y exfoliantes naturales de ViWa, elaborados artesanalmente para hidratar, nutrir y cuidar tu piel.",
    keywords:
      "bálsamos labiales, bálsamos corporales, exfoliantes naturales, cuidado de labios, cuidado corporal, cosmética natural artesanal, ViWa",
    subcategorias: ["labial", "corporal", "exfoliantes"],
    subcategoriasTitulos: {
      labial: "Bálsamos Labiales",
      corporal: "Bálsamos Corporales",
      exfoliantes: "Exfoliantes",
    },
  },
};

// Usado para armar el menú desplegable de navegación
export const NAV_ITEMS = [
  { slug: "herbales", label: "Jabones Herbales" },
  { slug: "cremosos", label: "Jabones Cremosos" },
  { slug: "exfoliantes", label: "Jabones Exfoliantes & Detox" },
  { slug: "balsamos", label: "Bálsamos & Exfoliantes" },
  { slug: "gelducha", label: "Gel de ducha" },
  { slug: "rituales", label: "Rituales" },
  { slug: "salesbanio", label: "Sales de baño" },
  { slug: "textiles", label: "Textiles" },
];

export const WHATSAPP_NUMBER = "5493462645379";
