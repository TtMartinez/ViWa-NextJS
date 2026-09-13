export const metadata = {
  title: "Política de Privacidad - ViWa",
};

export default function PoliticaPrivacidad() {
  return (
    <>
      <h1>Política de Privacidad</h1>
      <p style={{ marginBottom: 30, color: "#666", fontSize: "0.9rem" }}>
        Última actualización: Abril 2026
      </p>

      <section className="about-section">
        <h2 className="section-title">¿Quiénes somos?</h2>
        <p className="section-text">
          ViWa Atelier de Artesanías es un emprendimiento dedicado a la elaboración y venta de
          productos artesanales naturales. Podés contactarnos a través de nuestro WhatsApp o
          Instagram.
        </p>
      </section>

      <section className="about-section">
        <h2 className="section-title">¿Qué información almacenamos?</h2>
        <p className="section-text">
          Este sitio web <strong>no recopila ni almacena datos personales</strong> en ningún
          servidor. El único almacenamiento que utilizamos es el{" "}
          <strong>localStorage de tu navegador</strong>, que guarda temporalmente los productos que
          agregás al carrito para que no se pierdan si recargás la página. Esta información nunca
          sale de tu dispositivo y se elimina cuando vaciás el carrito o limpiás los datos del
          navegador.
        </p>
      </section>

      <section className="about-section">
        <h2 className="section-title">¿Usamos cookies?</h2>
        <p className="section-text">
          No utilizamos cookies de seguimiento, publicidad ni análisis de terceros. No hay
          integración con Google Analytics, Facebook Pixel ni ninguna herramienta de rastreo.
        </p>
      </section>

      <section className="about-section">
        <h2 className="section-title">¿Cómo completás tu compra?</h2>
        <p className="section-text">
          Las compras se realizan a través de <strong>WhatsApp</strong>. Al hacer clic en
          &quot;Finalizar compra&quot;, se abre una conversación con el detalle de tu pedido. ViWa
          no procesa pagos en línea ni almacena datos de tarjetas o medios de pago.
        </p>
      </section>

      <section className="about-section">
        <h2 className="section-title">Cambios en esta política</h2>
        <p className="section-text">
          Podemos actualizar esta política ocasionalmente. Cualquier cambio se reflejará en esta
          página con la fecha de última actualización.
        </p>
      </section>

      <section className="about-section">
        <h2 className="section-title">Contacto</h2>
        <p className="section-text">
          Si tenés alguna pregunta sobre esta política, podés contactarnos por{" "}
          <a href="https://wa.me/5493462645379" target="_blank" style={{ color: "#f97316" }}>
            WhatsApp
          </a>{" "}
          o{" "}
          <a
            href="https://www.instagram.com/viwa.atelierdeartesanias/"
            target="_blank"
            style={{ color: "#f97316" }}
          >
            Instagram
          </a>
          .
        </p>
      </section>
    </>
  );
}
