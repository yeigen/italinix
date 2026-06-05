import './Footer.css'

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <p className="site-footer__brand">Italinix</p>
        <p>Cocina italiana hecha para pedir facil, comer bien y repetir.</p>
      </div>

      <div className="site-footer__links" aria-label="Informacion de contacto">
        <a href="mailto:hola@italinix.test">hola@italinix.test</a>
        <a href="tel:+5550101">+555 0101</a>
        <span>Abierto todos los dias</span>
      </div>
    </footer>
  )
}
