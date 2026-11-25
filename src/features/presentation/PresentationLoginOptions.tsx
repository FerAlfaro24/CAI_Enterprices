import { GoogleSignInButton } from '../local-access/GoogleSignInButton'
import { presentationCredentials } from './credentials'
import styles from './presentation.module.css'

export function PresentationLoginOptions({ admin, onFill }: { admin: boolean; onFill: (email: string, password: string) => void }) {
  const account = presentationCredentials[admin ? 'admin' : 'student']
  return <section className={styles.loginOptions} aria-label="Accesos de presentación">
    {!admin && <GoogleSignInButton hint="Google verifica tu cuenta de verdad. Entrarás a la comunidad de presentación, con perfiles y contenido ficticios. No crea una inscripción escolar." />}
    <details><summary>Cuenta de muestra para presentar</summary><p>Correo: <strong>{account.email}</strong><br/>Contraseña: <strong>{account.password}</strong></p><button type="button" className={styles.fillAccount} onClick={() => onFill(account.email, account.password)}>Rellenar cuenta de muestra</button><p className={styles.googleHint}>Usa estas credenciales ficticias. Las contraseñas no se guardan ni se envían.</p></details>
  </section>
}
