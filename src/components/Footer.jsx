export default function Footer() {
  return (
    <div className="footer" style={{ marginTop: 36 }}>
      <div className="footer__label">Funded by</div>
      <div className="footer__logos">
        <img src={`${import.meta.env.BASE_URL}logos_gs.png`} alt="Partner logos" />
      </div>
    </div>
  )
}
