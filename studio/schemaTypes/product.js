export default {
  name: 'product',
  title: 'Producto',
  type: 'document',
  fields: [
    {
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'precio',
      title: 'Precio ($)',
      type: 'number',
      validation: Rule => Rule.required().positive()
    },
    {
      name: 'imagen',
      title: 'Foto del producto',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required()
    },
    {
      name: 'categoria',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          { title: 'Jabones Herbales',            value: 'herbales'    },
          { title: 'Jabones Cremosos',            value: 'cremosos'    },
          { title: 'Jabones Exfoliantes & Detox', value: 'exfoliantes' },
          { title: 'Bálsamos & Exfoliantes',      value: 'balsamos'    },
          { title: 'Textiles',                    value: 'textiles'    },
          { title: 'Gel de Ducha',                value: 'gel'         },
          { title: 'Rituales',                    value: 'rituales'    },
          { title: 'Sales de Baño',               value: 'sales'       },
          { title: 'Remeras',                    value: 'remeras'     },
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'subcategoria',
      title: 'Subcategoría (solo para Bálsamos & Exfoliantes)',
      type: 'string',
      options: {
        list: [
          { title: 'Bálsamo Labial',   value: 'labial'      },
          { title: 'Bálsamo Corporal', value: 'corporal'    },
          { title: 'Exfoliantes',      value: 'exfoliantes' },
        ]
      }
    },
    {
      name: 'descripcion',
      title: 'Descripción (opcional)',
      type: 'text'
    },
    {
      name: 'ingredientes',
      title: 'Ingredientes (opcional)',
      type: 'text'
    },
    {
      name: 'sabores',
      title: 'Sabores / Variantes (solo para Bálsamos & Exfoliantes)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'nombre',       title: 'Nombre del sabor', type: 'string' },
            { name: 'descripcion',  title: 'Descripción',      type: 'text'   },
            { name: 'ingredientes', title: 'Ingredientes',     type: 'text'   },
          ]
        }
      ]
    }
  ]
}